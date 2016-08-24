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
    var sessions = {};

    var latestGuestID = 0;

    var conversations = [];

    function conversation(users) {
        this._id = uuid.v4();
        this.userids = users;
        this.messages = [];
    }

    function message(userId, messageText) {
        this.userId = userId;
        this.timestamp = Date.now();
        this.text = messageText;
    }

    app.get("/oauth", function (req, res) {
        githubAuthoriser.authorise(req, function (githubUser, token) {
            if (githubUser) {
                //Real github account
                users.findOne({
                    _id: githubUser.login
                }, function (err, user) {
                    if (!user) {
                        // TODO: Wait for this operation to complete
                        users.insertOne({
                            _id: githubUser.login,
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
        latestGuestID++;
        //TODO: maybe generate a unique id for each user
        users.update({
            _id: guestID
        }, {
            _id: guestID,
            name: guestName,
            avatarUrl: "http://s.mtgprice.com/images/unknown.png"
        }, {
            upsert: true
        });
        var token = guestID;
        sessions[token] = {
            user: guestID
        };
        res.cookie("sessionToken", guestID);
        latestGuestID++;
        res.sendStatus(201);
    });

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

    app.get("/api/user", function (req, res) {
        users.findOne({
            _id: req.session.user
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
                        _id: user._id,
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
        var requestingUser = {};
        console.log(req.session);
        users.findOne({
            _id: req.session.user
        }, function (err, user) {
            if (!err) {
                requestingUser = user;
                var relevantConversations = conversations.filter(function (conversation) {
                    return _.contains(conversation.userids, requestingUser._id);
                });
                res.json(relevantConversations);
            } else {
                res.sendStatus(500);
            }
        });

    });

    app.post("/api/newConversation", function (req, res) {
        var userIds = req.body.userIds;
        //find all the users in the database that should be part of the new conversation
        users.find({
            _id: {
                $in: userIds
            }
        }).toArray(function (err, foundUsers) {
            if (!err) {
                var foundUsersIds = foundUsers.map(function (foundUser) {
                    return foundUser._id;
                });
                var newConvo = new conversation(foundUsersIds);
                conversations.push(newConvo);
                //console.log(conversations);
                res.sendStatus(201);
            } else {
                res.sendStatus(500);
            }
        });
    });

    return app.listen(port);
};
