var helpers = require("./unitTestHelpers");

var request = require("request");
var assert = require("chai").assert;
var sinon = require("sinon");

describe("GET /api/users", function () {

    beforeEach(function () {
        helpers.beforeEach();

    });
    afterEach(function () {
        helpers.afterEach();
    });

    var requestUrl = helpers.getVariables().baseUrl + "/api/users";
    var allUsers;
    beforeEach(function () {
        allUsers = {
            toArray: sinon.stub()
        };
        helpers.getVariables().dbCollections.users.find.returns(allUsers);
    });
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
            allUsers.toArray.callsArgWith(0, null, [helpers.getVariables().testUser]);

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
            allUsers.toArray.callsArgWith(0, null, [
                helpers.getVariables().testUser,
                helpers.getVariables().testUser2
            ]);

            request({
                url: requestUrl,
                jar: helpers.getVariables().cookieJar
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
        helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
            allUsers.toArray.callsArgWith(0, {
                err: "Database failure"
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
