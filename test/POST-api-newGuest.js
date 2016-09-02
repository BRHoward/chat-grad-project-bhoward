var helpers = require("./unitTestHelpers");

var request = require("request");
var assert = require("chai").assert;
var sinon = require("sinon");


describe("POST /api/newGuest", function () {
    beforeEach(function () {
        helpers.beforeEach();

    });
    afterEach(function () {
        helpers.afterEach();
    });

    var requestUrl = helpers.getVariables().baseUrl + "/api/newGuest";
    it("updates the database with a new guest user", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            request.post({
                url: requestUrl,
                json: {
                    name: "New Guest"
                }
            }, function (error, response) {
                //the id of the guest is a valid UUID
                assert.match(helpers.getVariables().dbCollections.users.insertOne.getCall(0).args[0].id, helpers.getVariables().UIDRegex);
                assert.equal(helpers.getVariables().dbCollections.users.insertOne.getCall(0).args[0].name, "New Guest");
                done();
            });
        });
    });
    it("responds with status 201 if request succeeds", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
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
