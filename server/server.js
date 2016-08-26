var express = require("express");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var uuid = require("uuid");
var _ = require("underscore");

module.exports = function (port, db, githubAuthoriser) {
    var app = express();

    app.use(express.static("public"));
    app.use(cookieParser());
    app.use(bodyParser.json());

    var users = db.collection("users");
    var conversations = db.collection("conversations");
    var sessions = {};

    function conversation(users) {
        this.id = uuid.v4();
        this.userids = users;
        this.messages = [];
    }

    function message(userId, messageText) {
        this.id = uuid.v4();
        this.userid = userId;
        this.timestamp = Date.now();
        this.text = messageText;
    }

    app.get("/oauth", function (req, res) {
        githubAuthoriser.authorise(req, function (githubUser, token) {
            if (githubUser) {
                //Real github account
                users.findOne({
                    id: githubUser.login
                }, function (err, user) {
                    if (!user) {
                        // TODO: Wait for this operation to complete
                        users.insertOne({
                            id: githubUser.login,
                            name: githubUser.name,
                            avatarUrl: githubUser.avatar_url
                        });
                    }
                    sessions[token] = {
                        user: githubUser.login
                    };
                    res.cookie("sessionToken", token);
                    res.header("Location", "/");
                    res.sendStatus(302);
                });
            } else {
                res.sendStatus(400);
            }

        });
    });

    app.get("/api/oauth/uri", function (req, res) {
        res.json({
            uri: githubAuthoriser.oAuthUri
        });
    });

    app.post("/api/newGuest", function (req, res) {
        var guestID = uuid.v4();
        var guestName = req.body.name;

        users.insertOne({
            id: guestID,
            name: guestName,
            avatarUrl: "http://s.mtgprice.com/images/unknown.png"
        });

        var token = guestID;
        sessions[token] = {
            user: guestID
        };
        res.cookie("sessionToken", guestID);
        res.sendStatus(201);
    });

    //all requests defined below this middleware require a correct cookie
    app.use(function (req, res, next) {
        if (req.cookies.sessionToken) {
            req.session = sessions[req.cookies.sessionToken];
            if (req.session) {
                next();
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(401);
        }
    });

    app.post("/api/newConversation", function (req, res) {
        var userIds = req.body.userIds;
        //find all the users in the database that should be part of the new conversation
        users.find({
            id: {
                $in: userIds
            }
        }).toArray(function (err, foundUsers) {
            if (!err) {
                if (foundUsers) {
                    var foundUsersIds = foundUsers.map(function (foundUser) {
                        return foundUser.id;
                    });
                    var newConvo = new conversation(foundUsersIds);
                    conversations.insertOne(newConvo);
                    res.sendStatus(201);
                } else {
                    //relevant users cannot be found
                    res.sendStatus(404);
                }
            } else {
                //database error
                res.sendStatus(500);
            }
        });
    });

    app.get("/api/user", function (req, res) {
        users.findOne({
            id: req.session.user
        }, function (err, user) {
            if (!err) {
                res.json(user);
            } else {
                res.sendStatus(500);
            }
        });
    });

    app.get("/api/users", function (req, res) {
        users.find().toArray(function (err, docs) {
            if (!err) {
                res.json(docs.map(function (user) {
                    return {
                        id: user.id,
                        name: user.name,
                        avatarUrl: user.avatarUrl
                    };
                }));
            } else {
                res.sendStatus(500);
            }
        });
    });

    app.get("/api/conversations", function (req, res) {
        users.findOne({
            id: req.session.user
        }, function (err, user) {
            if (!err) {
                if (user) {
                    conversations.find({
                        userids: user.id
                    }).toArray(function (err, relevantConversations) {
                        if (relevantConversations) {
                            res.json(relevantConversations);
                        } else {
                            //conversations not found
                            res.sendStatus(404);
                        }
                    });
                } else {
                    //user not found
                    res.sendStatus(404);
                }
            } else {
                //database error
                res.sendStatus(500);
            }
        });

    });

    app.post("/api/newMessage", function (req, res) {
        users.findOne({
            id: req.session.user
        }, function (err, user) {
            if (!err) {
                if (user) {
                    var newMessage = new message(user.id, req.body.messageText);
                    conversations.findOneAndUpdate({
                        id: req.body.conversationId
                    }, {
                        $push: {
                            messages: newMessage
                        }
                    });
                    res.sendStatus(201);
                } else {
                    //user not found
                    res.sendStatus(404);
                }
            } else {
                //database error
                res.sendStatus(500);
            }
        });
    });

    return app.listen(port);
};
