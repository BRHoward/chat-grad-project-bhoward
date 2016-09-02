var helpers = require("./unitTestHelpers");

var request = require("request");
var assert = require("chai").assert;
var sinon = require("sinon");

describe("POST /api/updateConversationDetails", function (req, res) {
    beforeEach(function () {
        helpers.beforeEach();

    });
    afterEach(function () {
        helpers.afterEach();
    });

    var requestUrl = helpers.getVariables().baseUrl + "/api/updateConversationDetails";
    it("updates the database new conversation name", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            request.put({
                url: requestUrl,
                json: {
                    conversationid: helpers.getVariables().testConversation1.id,
                    conversationName: "New conversation name"
                },
                jar: helpers.getVariables().cookieJar
            }, function (error, response) {
                assert.equal(
                    helpers.getVariables().dbCollections.conversations.findOneAndUpdate.firstCall.args[0].id,
                    helpers.getVariables().testConversation1.id);
                assert.equal(
                    helpers.getVariables().dbCollections.conversations.findOneAndUpdate.firstCall.args[1].$set.name,
                    "New conversation name");
                done();
            });
        });
    });
    it("responds with status 200 if request succeeds", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            request.put({
                url: requestUrl,
                json: {
                    conversationid: helpers.getVariables().testConversation1.id,
                    conversationName: "New conversation name"
                },
                jar: helpers.getVariables().cookieJar
            }, function (error, response) {
                assert.equal(response.statusCode, 200);
                done();
            });
        });
    });
});
