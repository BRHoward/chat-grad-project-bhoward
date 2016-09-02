var helpers = require("./unitTestHelpers");

var request = require("request");
var assert = require("chai").assert;
var sinon = require("sinon");

describe("GET /api/user", function () {

    beforeEach(function () {
        helpers.beforeEach();

    });
    afterEach(function () {
        helpers.afterEach();
    });
    var requestUrl = helpers.getVariables().baseUrl + "/api/user";
    it("responds with status code 401 if user not authenticated", function (done) {
        request(requestUrl, function (error, response) {
            assert.equal(response.statusCode, 401);
            done();
        });
    });
    it("responds with status code 401 if user has an unrecognised session token", function (done) {
        helpers.getVariables().cookieJar.setCookie(request.cookie("sessionToken=" + helpers.getVariables().testExpiredToken), helpers.getVariables().baseUrl);
        request({
            url: requestUrl,
            jar: helpers.getVariables().cookieJar
        }, function (error, response) {
            assert.equal(response.statusCode, 401);
            done();
        });
    });
    it("responds with status code 200 if user is authenticated", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            request({
                url: requestUrl,
                jar: helpers.getVariables().cookieJar
            }, function (error, response) {
                assert.equal(response.statusCode, 200);
                done();
            });
        });
    });
    it("responds with a body that is a JSON representation of the user if user is authenticated", function (done) {
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            request({
                url: requestUrl,
                jar: helpers.getVariables().cookieJar
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
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {

            helpers.getVariables().dbCollections.users.findOne.callsArgWith(1, {
                err: "Database error"
            }, null);

            request({
                url: requestUrl,
                jar: helpers.getVariables().cookieJar
            }, function (error, response) {
                assert.equal(response.statusCode, 500);
                done();
            });
        });
    });
});
