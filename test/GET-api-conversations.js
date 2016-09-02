var helpers = require("./unitTestHelpers");

var request = require("request");
var assert = require("chai").assert;
var sinon = require("sinon");


describe("GET /api/conversations", function () {

    beforeEach(function () {
        helpers.beforeEach();

    });
    afterEach(function () {
        helpers.afterEach();
    });
    var requestUrl = helpers.getVariables().baseUrl + "/api/conversations";
    var relevantConversations;
    beforeEach(function () {
        relevantConversations = {
            toArray: sinon.stub()
        };
        helpers.getVariables().dbCollections.conversations.find.returns(relevantConversations);
    });
    it("returns the correct list of conversations", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            helpers.getVariables().dbCollections.users.findOne.callsArgWith(1, null, helpers.getVariables().testUser);
            relevantConversations.toArray.callsArgWith(0, null, [
                helpers.getVariables().testConversation1,
                helpers.getVariables().testConversation2
            ]);
            request({
                url: requestUrl,
                jar: helpers.getVariables().cookieJar
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
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            helpers.getVariables().dbCollections.users.findOne.callsArgWith(1, {
                err: "Database failure"
            }, null);
            request({
                url: requestUrl,
                jar: helpers.getVariables().cookieJar
            }, function (error, response, body) {
                assert.equal(response.statusCode, 500);
                done();
            });
        });
    });
    it("responds with status 404 if the user is not found", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            helpers.getVariables().dbCollections.users.findOne.callsArgWith(1, null, null);
            request({
                url: requestUrl,
                jar: helpers.getVariables().cookieJar
            }, function (error, response, body) {
                assert.equal(response.statusCode, 404);
                done();
            });
        });
    });
    it("responds with status 404 if the conversations are not found", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            helpers.getVariables().dbCollections.users.findOne.callsArgWith(1, null, helpers.getVariables().testUser);
            relevantConversations.toArray.callsArgWith(0, null, null);
            request({
                url: requestUrl,
                jar: helpers.getVariables().cookieJar
            }, function (error, response, body) {
                assert.equal(response.statusCode, 404);
                done();
            });
        });
    });
});
