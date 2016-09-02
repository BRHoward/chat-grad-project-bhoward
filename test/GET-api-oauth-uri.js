var helpers = require("./unitTestHelpers");

var request = require("request");
var assert = require("chai").assert;
var sinon = require("sinon");

describe("GET /api/oauth/uri", function () {

    beforeEach(function () {
        helpers.beforeEach();

    });
    afterEach(function () {
        helpers.afterEach();
    });
    var requestUrl = helpers.getVariables().baseUrl + "/api/oauth/uri";
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
                uri: "https://github.com/login/oauth/authorize?clientid=" + helpers.getVariables().oauthClientId
            });
            done();
        });
    });
});
