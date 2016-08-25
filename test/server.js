var server = require("../server/server");
var request = require("request");
var assert = require("chai").assert;
var sinon = require("sinon");

var testPort = 52684;
var baseUrl = "http://localhost:" + testPort;
var oauthClientId = "1234clientId";

var testUser = {
    id: "bob",
    name: "Bob Bilson",
    avatarUrl: "http://avatar.url.com/u=test"
};
var testUser2 = {
    id: "charlie",
    name: "Charlie Colinson",
    avatarUrl: "http://avatar.url.com/u=charlie_colinson"
};
var testGithubUser = {
    login: "bob",
    name: "Bob Bilson",
    avatar_url: "http://avatar.url.com/u=test"
};
var testConversation1 = {
    id: "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
    userids: ["bob", "charlie"],
    messages: []
};
var testConversation2 = {
    id: "110ec58a-a0f2-4ac4-8393-c866d813b8d2",
    userids: ["david", "edward"],
    messages: []
};

var testToken = "123123";
var testExpiredToken = "987978";

var UIDRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("server", function () {
    var cookieJar;
    var db;
    var githubAuthoriser;
    var serverInstance;
    var dbCollections;
    beforeEach(function () {
        cookieJar = request.jar();
        dbCollections = {
            users: {
                find: sinon.stub(),
                findOne: sinon.stub(),
                insertOne: sinon.spy()
            },
            conversations: {
                find: sinon.stub(),
                findOneAndUpdate: sinon.spy(),
                insertOne: sinon.spy()
            }
        };
        db = {
            collection: sinon.stub()
        };
        db.collection.withArgs("users").returns(dbCollections.users);
        db.collection.withArgs("conversations").returns(dbCollections.conversations);

        githubAuthoriser = {
            authorise: function () {},
            oAuthUri: "https://github.com/login/oauth/authorize?clientid=" + oauthClientId
        };
        serverInstance = server(testPort, db, githubAuthoriser);
    });
    afterEach(function () {
        serverInstance.close();
    });

    function authenticateUser(user, token, callback) {
        sinon.stub(githubAuthoriser, "authorise", function (req, authCallback) {
            authCallback(user, token);
        });

        dbCollections.users.findOne.callsArgWith(1, null, user);

        request(baseUrl + "/oauth", function (error, response) {
            cookieJar.setCookie(request.cookie("sessionToken=" + token), baseUrl);
            callback();
        });
    }
    describe("GET /oauth", function () {
        var requestUrl = baseUrl + "/oauth";

        it("responds with status code 400 if oAuth authorise fails", function (done) {
            var stub = sinon.stub(githubAuthoriser, "authorise", function (req, callback) {
                callback(null);
            });

            request(requestUrl, function (error, response) {
                assert.equal(response.statusCode, 400);
                done();
            });
        });
        it("responds with status code 302 if oAuth authorise succeeds", function (done) {
            var user = testGithubUser;
            var stub = sinon.stub(githubAuthoriser, "authorise", function (req, authCallback) {
                authCallback(user, testToken);
            });

            dbCollections.users.findOne.callsArgWith(1, null, user);

            request({
                url: requestUrl,
                followRedirect: false
            }, function (error, response) {
                assert.equal(response.statusCode, 302);
                done();
            });
        });
        it("responds with a redirect to '/' if oAuth authorise succeeds", function (done) {
            var user = testGithubUser;
            var stub = sinon.stub(githubAuthoriser, "authorise", function (req, authCallback) {
                authCallback(user, testToken);
            });

            dbCollections.users.findOne.callsArgWith(1, null, user);

            request(requestUrl, function (error, response) {
                assert.equal(response.statusCode, 200);
                assert.equal(response.request.uri.path, "/");
                done();
            });
        });
        it("add user to database if oAuth authorise succeeds and user id not found", function (done) {
            var user = testGithubUser;
            var stub = sinon.stub(githubAuthoriser, "authorise", function (req, authCallback) {
                authCallback(user, testToken);
            });

            dbCollections.users.findOne.callsArgWith(1, null, null);

            request(requestUrl, function (error, response) {
                assert(dbCollections.users.insertOne.calledOnce);
                assert.deepEqual(dbCollections.users.insertOne.firstCall.args[0], {
                    id: "bob",
                    name: "Bob Bilson",
                    avatarUrl: "http://avatar.url.com/u=test"
                });
                done();
            });
        });
    });
    describe("GET /api/oauth/uri", function () {
        var requestUrl = baseUrl + "/api/oauth/uri";
        it("responds with status code 200", function (done) {
            request(requestUrl, function (error, response) {
                assert.equal(response.statusCode, 200);
                done();
            });
        });
        it("responds with a body encoded as JSON in UTF-8", function (done) {
            request(requestUrl, function (error, response) {
                assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
                done();
            });
        });
        it("responds with a body that is a JSON object containing a URI to GitHub with a client id", function (done) {
            request(requestUrl, function (error, response, body) {
                assert.deepEqual(JSON.parse(body), {
                    uri: "https://github.com/login/oauth/authorize?clientid=" + oauthClientId
                });
                done();
            });
        });
    });
    describe("GET /api/user", function () {
        var requestUrl = baseUrl + "/api/user";
        it("responds with status code 401 if user not authenticated", function (done) {
            request(requestUrl, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function (done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request({
                url: requestUrl,
                jar: cookieJar
            }, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 200 if user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                request({
                    url: requestUrl,
                    jar: cookieJar
                }, function (error, response) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });
        it("responds with a body that is a JSON representation of the user if user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                request({
                    url: requestUrl,
                    jar: cookieJar
                }, function (error, response, body) {
                    assert.deepEqual(JSON.parse(body), {
                        id: "bob",
                        name: "Bob Bilson",
                        avatarUrl: "http://avatar.url.com/u=test"
                    });
                    done();
                });
            });
        });
        it("responds with status code 500 if database error", function (done) {
            authenticateUser(testUser, testToken, function () {

                dbCollections.users.findOne.callsArgWith(1, {
                    err: "Database error"
                }, null);

                request({
                    url: requestUrl,
                    jar: cookieJar
                }, function (error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
    });
    describe("GET /api/users", function () {
        var requestUrl = baseUrl + "/api/users";
        var allUsers;
        beforeEach(function () {
            allUsers = {
                toArray: sinon.stub()
            };
            dbCollections.users.find.returns(allUsers);
        });
        it("responds with status code 401 if user not authenticated", function (done) {
            request(requestUrl, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function (done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request({
                url: requestUrl,
                jar: cookieJar
            }, function (error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 200 if user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                allUsers.toArray.callsArgWith(0, null, [testUser]);

                request({
                    url: requestUrl,
                    jar: cookieJar
                }, function (error, response) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });
        it("responds with a body that is a JSON representation of the user if user is authenticated", function (done) {
            authenticateUser(testUser, testToken, function () {
                allUsers.toArray.callsArgWith(0, null, [
                    testUser,
                    testUser2
                ]);

                request({
                    url: requestUrl,
                    jar: cookieJar
                }, function (error, response, body) {
                    assert.deepEqual(JSON.parse(body), [{
                        id: "bob",
                        name: "Bob Bilson",
                        avatarUrl: "http://avatar.url.com/u=test"
                    }, {
                        id: "charlie",
                        name: "Charlie Colinson",
                        avatarUrl: "http://avatar.url.com/u=charlie_colinson"
                    }]);
                    done();
                });
            });
        });
        it("responds with status code 500 if database error", function (done) {
            authenticateUser(testUser, testToken, function () {
                allUsers.toArray.callsArgWith(0, {
                    err: "Database failure"
                }, null);

                request({
                    url: requestUrl,
                    jar: cookieJar
                }, function (error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
    });
    describe("POST /api/newGuest", function () {
        var requestUrl = baseUrl + "/api/newGuest";
        it("updates the database with a new guest user", function (done) {
            authenticateUser(testUser, testToken, function () {
                request.post({
                    url: requestUrl,
                    json: {
                        name: "New Guest"
                    }
                }, function (error, response) {
                    //the id of the guest is a valid UUID
                    assert.match(dbCollections.users.insertOne.getCall(0).args[0].id, UIDRegex);
                    assert.equal(dbCollections.users.insertOne.getCall(0).args[0].name, "New Guest");
                    done();
                });
            });
        });
        it("responds with status 201 if request succeeds", function (done) {
            authenticateUser(testUser, testToken, function () {
                request.post({
                    url: requestUrl,
                    json: {
                        name: "New Guest"
                    }
                }, function (error, response) {
                    assert.equal(response.statusCode, 201);
                    done();
                });
            });
        });
    });
    describe("POST /api/newConversation", function () {
        var requestUrl = baseUrl + "/api/newConversation";
        var relevantUsers;
        beforeEach(function () {
            relevantUsers = {
                toArray: sinon.stub()
            };
            dbCollections.users.find.returns(relevantUsers);
        });
        it("adds a new conversation to the database", function (done) {
            authenticateUser(testUser, testToken, function () {
                relevantUsers.toArray.callsArgWith(0, null, [
                    testUser,
                    testUser2
                ]);
                request.post({
                    url: requestUrl,
                    json: {
                        userIds: ["bob", "charlie"]
                    },
                    jar: cookieJar
                }, function (error, response) {
                    assert.equal(dbCollections.conversations.insertOne.calledOnce, true);
                    assert.match(dbCollections.conversations.insertOne.firstCall.args[0].id, UIDRegex);
                    assert.deepEqual(dbCollections.conversations.insertOne.firstCall.args[0].userids, [
                        "bob", "charlie"
                    ]);
                    assert.equal(dbCollections.conversations.insertOne.firstCall.args[0].messages.length, 0);
                    done();
                });
            });

        });
        it("responds with status 500 if there is a database error", function (done) {
            authenticateUser(testUser, testToken, function () {
                relevantUsers.toArray.callsArgWith(0, {
                    err: "Database failure"
                }, null);
                request.post({
                    url: requestUrl,
                    json: {
                        userIds: ["bob", "charlie"]
                    },
                    jar: cookieJar
                }, function (error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
        it("responds with status 404 if relevant users are not found", function (done) {
            authenticateUser(testUser, testToken, function () {
                relevantUsers.toArray.callsArgWith(0, null, null);
                request.post({
                    url: requestUrl,
                    json: {
                        userIds: ["bob", "charlie"]
                    },
                    jar: cookieJar
                }, function (error, response) {
                    assert.equal(response.statusCode, 404);
                    done();
                });
            });
        });
    });
    describe("GET /api/conversations", function () {
        var requestUrl = baseUrl + "/api/conversations";
        var relevantConversations;
        beforeEach(function () {
            relevantConversations = {
                toArray: sinon.stub()
            };
            dbCollections.conversations.find.returns(relevantConversations);
        });
        it("returns the correct list of conversations", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.users.findOne.callsArgWith(1, null, testUser);
                relevantConversations.toArray.callsArgWith(0, null, [
                    testConversation1,
                    testConversation2
                ]);
                request({
                    url: requestUrl,
                    jar: cookieJar
                }, function (error, response, body) {
                    assert.deepEqual(JSON.parse(body), [{
                        id: "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
                        userids: ["bob", "charlie"],
                        messages: []
                    }, {
                        id: "110ec58a-a0f2-4ac4-8393-c866d813b8d2",
                        userids: ["david", "edward"],
                        messages: []
                    }]);
                    done();
                });
            });
        });
        it("responds with status 500 if there is a database error", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.users.findOne.callsArgWith(1, {
                    err: "Database failure"
                }, null);
                request({
                    url: requestUrl,
                    jar: cookieJar
                }, function (error, response, body) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
        it("responds with status 404 if the user is not found", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.users.findOne.callsArgWith(1, null, null);
                request({
                    url: requestUrl,
                    jar: cookieJar
                }, function (error, response, body) {
                    assert.equal(response.statusCode, 404);
                    done();
                });
            });
        });
        it("responds with status 404 if the conversations are not found", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.users.findOne.callsArgWith(1, null, testUser);
                relevantConversations.toArray.callsArgWith(0, null, null);
                request({
                    url: requestUrl,
                    jar: cookieJar
                }, function (error, response, body) {
                    assert.equal(response.statusCode, 404);
                    done();
                });
            });
        });
    });
    describe("POST /api/newMessage", function (req, res) {
        var requestUrl = baseUrl + "/api/newMessage";
        it("adds a new message to the conversation", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.users.findOne.callsArgWith(1, null, testUser);
                request.post({
                    url: requestUrl,
                    jar: cookieJar,
                    json: {
                        conversationId: "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
                        messageText: "newMessage"
                    }
                }, function (error, response) {
                    assert.equal(dbCollections.conversations.findOneAndUpdate.calledOnce, true);
                    assert.match(dbCollections.conversations.findOneAndUpdate.firstCall.args[0].id, UIDRegex);
                    done();
                });
            });
        });
        it("responds with status 500 if there is a database error", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.users.findOne.callsArgWith(1, {
                    err: "Database failure"
                }, null);
                request.post({
                    url: requestUrl,
                    json: {
                        conversationId: "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
                        messageText: "newMessage"
                    },
                    jar: cookieJar
                }, function (error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
        it("responds with status 404 if user is not found", function (done) {
            authenticateUser(testUser, testToken, function () {
                dbCollections.users.findOne.callsArgWith(1, null, null);
                request.post({
                    url: requestUrl,
                    json: {
                        conversationId: "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
                        messageText: "newMessage"
                    },
                    jar: cookieJar
                }, function (error, response) {
                    assert.equal(response.statusCode, 404);
                    done();
                });
            });
        });
    });
});
