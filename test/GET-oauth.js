var helpers = require("./unitTestHelpers");

var request = require("request");
var assert = require("chai").assert;
var sinon = require("sinon");

describe("GET /oauth", function () {
    beforeEach(function () {
        helpers.beforeEach();

    });
    afterEach(function () {
        helpers.afterEach();
    });

    var requestUrl = helpers.getVariables().baseUrl + "/oauth";

    it("responds with status code 400 if oAuth authorise fails", function (done) {
        var stub = sinon.stub(helpers.getVariables().githubAuthoriser, "authorise", function (req, callback) {
            callback(null);
        });

        request(requestUrl, function (error, response) {
            assert.equal(response.statusCode, 400);
            done();
        });
    });
    it("responds with status code 302 if oAuth authorise succeeds", function (done) {
        var user = helpers.getVariables().testGithubUser;
        var stub = sinon.stub(helpers.getVariables().githubAuthoriser, "authorise", function (req, authCallback) {
            authCallback(user, helpers.getVariables().testToken);
        });

        helpers.getVariables().dbCollections.users.findOne.callsArgWith(1, null, user);

        request({
            url: requestUrl,
            followRedirect: false
        }, function (error, response) {
            assert.equal(response.statusCode, 302);
            done();
        });
    });
    it("responds with a redirect to '/' if oAuth authorise succeeds", function (done) {
        var user = helpers.getVariables().testGithubUser;
        var stub = sinon.stub(helpers.getVariables().githubAuthoriser, "authorise", function (req, authCallback) {
            authCallback(user, helpers.getVariables().testToken);
        });

        helpers.getVariables().dbCollections.users.findOne.callsArgWith(1, null, user);

        request(requestUrl, function (error, response) {
            assert.equal(response.statusCode, 200);
            assert.equal(response.request.uri.path, "/");
            done();
        });
    });
    it("add user to database if oAuth authorise succeeds and user id not found", function (done) {
        var user = helpers.getVariables().testGithubUser;
        var stub = sinon.stub(helpers.getVariables().githubAuthoriser, "authorise", function (req, authCallback) {
            authCallback(user, helpers.getVariables().testToken);
        });

        helpers.getVariables().dbCollections.users.findOne.callsArgWith(1, null, null);

        request(requestUrl, function (error, response) {
            assert(helpers.getVariables().dbCollections.users.insertOne.calledOnce);
            assert.deepEqual(helpers.getVariables().dbCollections.users.insertOne.firstCall.args[0], {
                id: "bob",
                name: "Bob Bilson",
                avatarUrl: "http://avatar.url.com/u=test"
            });
            done();
        });
    });
});
