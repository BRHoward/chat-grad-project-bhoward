var helpers = require("./unitTestHelpers");

var request = require("request");
var assert = require("chai").assert;
var sinon = require("sinon");

describe("POST /api/leaveConversation", function (req, res) {

    beforeEach(function () {
        helpers.beforeEach();

    });
    afterEach(function () {
        helpers.afterEach();
    });

    var requestUrl = helpers.getVariables().baseUrl + "/api/leaveConversation";
    it("updates the database by removing the user", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            request.post({
                url: requestUrl,
                json: {
                    conversationid: helpers.getVariables().testConversation1.id,
                    user: helpers.getVariables().testUser.id
                },
                jar: helpers.getVariables().cookieJar
            }, function (error, response) {
                assert.equal(
                    helpers.getVariables().dbCollections.conversations.findOneAndUpdate.firstCall.args[0].id,
                    helpers.getVariables().testConversation1.id);
                done();
            });
        });
    });
    it("responds with status 200 if request succeeds", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            request.post({
                url: requestUrl,
                json: {
                    id: helpers.getVariables().testConversation1.id,
                    userid: helpers.getVariables().testUser.id
                },
                jar: helpers.getVariables().cookieJar
            }, function (error, response) {
                assert.equal(response.statusCode, 200);
                done();
            });
        });
    });
});
