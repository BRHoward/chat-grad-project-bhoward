var helpers = require("./unitTestHelpers");

var request = require("request");
var assert = require("chai").assert;
var sinon = require("sinon");


describe("POST /api/newMessage", function (req, res) {
    beforeEach(function () {
        helpers.beforeEach();

    });
    afterEach(function () {
        helpers.afterEach();
    });
    var requestUrl = helpers.getVariables().baseUrl + "/api/newMessage";
    it("adds a new message to the conversation", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            helpers.getVariables().dbCollections.users.findOne.callsArgWith(1, null, helpers.getVariables().testUser);
            request.post({
                url: requestUrl,
                jar: helpers.getVariables().cookieJar,
                json: {
                    conversationId: "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
                    messageText: "newMessage"
                }
            }, function (error, response) {
                assert.equal(helpers.getVariables().dbCollections.conversations.findOneAndUpdate.calledOnce, true);
                assert.match(helpers.getVariables().dbCollections.conversations.findOneAndUpdate.firstCall.args[0].id, helpers.getVariables().UIDRegex);
                done();
            });
        });
    });
    it("responds with status 500 if there is a database error", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            helpers.getVariables().dbCollections.users.findOne.callsArgWith(1, {
                err: "Database failure"
            }, null);
            request.post({
                url: requestUrl,
                json: {
                    conversationId: "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
                    messageText: "newMessage"
                },
                jar: helpers.getVariables().cookieJar
            }, function (error, response) {
                assert.equal(response.statusCode, 500);
                done();
            });
        });
    });
    it("responds with status 404 if user is not found", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            helpers.getVariables().dbCollections.users.findOne.callsArgWith(1, null, null);
            request.post({
                url: requestUrl,
                json: {
                    conversationId: "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
                    messageText: "newMessage"
                },
                jar: helpers.getVariables().cookieJar
            }, function (error, response) {
                assert.equal(response.statusCode, 404);
                done();
            });
        });
    });
});
