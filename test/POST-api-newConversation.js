 var helpers = require("./unitTestHelpers");

 var request = require("request");
 var assert = require("chai").assert;
 var sinon = require("sinon");

 describe("POST /api/newConversation", function () {

     beforeEach(function () {
         helpers.beforeEach();

     });
     afterEach(function () {
         helpers.afterEach();
     });

     var requestUrl = helpers.getVariables().baseUrl + "/api/newConversation";
     var relevantUsers;
     beforeEach(function () {
         relevantUsers = {
             toArray: sinon.stub()
         };
         helpers.getVariables().dbCollections.users.find.returns(relevantUsers);
     });
     it("adds a new conversation to the database", function (done) {
         helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
             relevantUsers.toArray.callsArgWith(0, null, [
                 helpers.getVariables().testUser,
                 helpers.getVariables().testUser2
             ]);
             request.post({
                 url: requestUrl,
                 json: {
                     userIds: ["bob", "charlie"]
                 },
                 jar: helpers.getVariables().cookieJar
             }, function (error, response) {
                 assert.equal(helpers.getVariables().dbCollections.conversations.insertOne.calledOnce, true);
                 assert.match(helpers.getVariables().dbCollections.conversations.insertOne.firstCall.args[0].id, helpers.getVariables().UIDRegex);
                 assert.deepEqual(helpers.getVariables().dbCollections.conversations.insertOne.firstCall.args[0].userids, [
                     "bob", "charlie"
                 ]);
                 assert.equal(helpers.getVariables().dbCollections.conversations.insertOne.firstCall.args[0].messages.length, 0);
                 done();
             });
         });

     });
     it("responds with status 500 if there is a database error", function (done) {
         helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
             relevantUsers.toArray.callsArgWith(0, {
                 err: "Database failure"
             }, null);
             request.post({
                 url: requestUrl,
                 json: {
                     userIds: ["bob", "charlie"]
                 },
                 jar: helpers.getVariables().cookieJar
             }, function (error, response) {
                 assert.equal(response.statusCode, 500);
                 done();
             });
         });
     });
     it("responds with status 404 if relevant users are not found", function (done) {
         helpers.authenticateUser(helpers.getVariables().testUser, helpers.getVariables().testToken, function () {
             relevantUsers.toArray.callsArgWith(0, null, null);
             request.post({
                 url: requestUrl,
                 json: {
                     userIds: ["bob", "charlie"]
                 },
                 jar: helpers.getVariables().cookieJar
             }, function (error, response) {
                 assert.equal(response.statusCode, 404);
                 done();
             });
         });
     });
 });
