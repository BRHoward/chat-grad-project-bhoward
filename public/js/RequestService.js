angular.module("ChatApp").service("RequestService", ["$http", function ($http) {

	var self = this;

	self.getUserInfo = getUserInfo;
	self.getRegisteredUsers = getRegisteredUsers;
	self.getConversations = getConversations;
	self.getGithubLoginPath = getGithubLoginPath;
	self.postGuestLogin = postGuestLogin;
	self.postStartConversation = postStartConversation;
	self.postLeaveConversation = postLeaveConversation;
	self.postSendMessage = postSendMessage;
	self.postAddUserToConversation = postAddUserToConversation;
	self.putUpdateConversationDetails = putUpdateConversationDetails;

	function getUserInfo() {
		return $http.get("api/user");
	}

	function getRegisteredUsers() {
		return $http.get("api/users");
	}

	function getGithubLoginPath() {
		return $http.get("/api/oauth/uri");
	}

	function getConversations() {
		return $http.get("api/conversations");
	}

	function postGuestLogin(guestName) {
		return $http({
			method: "POST",
			url: "/api/newGuest",
			data: {
				name: guestName
			}
		});
	}

	function postStartConversation(userIds, conversationName) {
		return $http({
			method: "POST",
			url: "/api/newConversation",
			data: {
				userIds: userIds,
				conversationName: conversationName
			}
		});
	}

	function postAddUserToConversation(userid, conversationid) {
		return $http({
			method: "POST",
			url: "api/addUserToConversation",
			data: {
				userid: userid,
				conversationid: conversationid

			}
		});
	}

	function postLeaveConversation(conversationid) {
		return $http({
			method: "POST",
			url: "api/leaveConversation",
			data: {
				conversationid: conversationid
			}
		});
	}

	function postSendMessage(conversationid, messageText) {
		return $http({
			method: "POST",
			url: "/api/newMessage",
			data: {
				conversationId: conversationid,
				messageText: messageText
			}
		});
	}

	function putUpdateConversationDetails(conversationid, conversationName) {
		return $http({
			method: "PUT",
			url: "api/updateConversationDetails",
			data: {
				conversationid: conversationid,
				conversationName: conversationName
			}
		});
	}

}]);
