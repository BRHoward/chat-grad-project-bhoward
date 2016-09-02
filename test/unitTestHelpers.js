var server = require("../server/server");
var request = require("request");
var assert = require("chai").assert;
var sinon = require("sinon");

var testPort = 52684;
var baseUrl = "http://localhost:" + testPort;
var oauthClientId = "1234clientId";

var testUser = {
	id: "bob",
	name: "Bob Bilson",
	avatarUrl: "http://avatar.url.com/u=test"
};
var testUser2 = {
	id: "charlie",
	name: "Charlie Colinson",
	avatarUrl: "http://avatar.url.com/u=charlie_colinson"
};
var testGithubUser = {
	login: "bob",
	name: "Bob Bilson",
	avatar_url: "http://avatar.url.com/u=test"
};
var testConversation1 = {
	id: "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
	userids: ["bob", "charlie"],
	messages: []
};
var testConversation2 = {
	id: "110ec58a-a0f2-4ac4-8393-c866d813b8d2",
	userids: ["david", "edward"],
	messages: []
};

var testToken = "123123";
var testExpiredToken = "987978";

var UIDRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

var cookieJar;
var db;
var githubAuthoriser;
var serverInstance;
var dbCollections;


module.exports.beforeEach = function () {
	cookieJar = request.jar();
	dbCollections = {
		users: {
			find: sinon.stub(),
			findOne: sinon.stub(),
			insertOne: sinon.spy()
		},
		conversations: {
			find: sinon.stub(),
			findOneAndUpdate: sinon.spy(),
			insertOne: sinon.spy()
		}
	};
	db = {
		collection: sinon.stub()
	};
	db.collection.withArgs("users").returns(dbCollections.users);
	db.collection.withArgs("conversations").returns(dbCollections.conversations);

	githubAuthoriser = {
		authorise: function () {},
		oAuthUri: "https://github.com/login/oauth/authorize?clientid=" + oauthClientId
	};
	serverInstance = server(testPort, db, githubAuthoriser);
};

module.exports.afterEach = function () {
	serverInstance.close();
};


module.exports.authenticateUser = function (user, token, callback) {
	sinon.stub(githubAuthoriser, "authorise", function (req, authCallback) {
		authCallback(user, token);
	});

	dbCollections.users.findOne.callsArgWith(1, null, user);

	request(baseUrl + "/oauth", function (error, response) {
		cookieJar.setCookie(request.cookie("sessionToken=" + token), baseUrl);
		callback();
	});
};

module.exports.getVariables = function () {
	return {
		cookieJar: cookieJar,
		db: db,
		githubAuthoriser: githubAuthoriser,
		serverInstance: serverInstance,
		dbCollections: dbCollections,
		testUser: testUser,
		testUser2: testUser2,
		testGithubUser: testGithubUser,
		testConversation1: testConversation1,
		testConversation2: testConversation2,
		testToken:testToken,
		testExpiredToken: testExpiredToken,
		UIDRegex: UIDRegex,
		testPort: testPort,
		baseUrl: baseUrl,
		oauthClientId:oauthClientId
	};
};
