angular.module("ChatApp").service("RequestService", ["$http", function ($http) {

	var self = this;

	self.get_userInfo = get_userInfo;
	self.get_registeredUsers = get_registeredUsers;
	self.get_conversations = get_conversations;
	self.get_githubLoginPath = get_githubLoginPath;
	self.post_guestLogin = post_guestLogin;
	self.post_startConversation = post_startConversation;
	self.post_leaveConversation = post_leaveConversation;
	self.post_sendMessage = post_sendMessage;
	self.post_addUserToConversation = post_addUserToConversation;
	self.put_updateConversationDetails = put_updateConversationDetails;

	function get_userInfo() {
		return $http.get("api/user");
	}

	function get_registeredUsers() {
		return $http.get("api/users");
	}

	function get_githubLoginPath() {
		return $http.get("/api/oauth/uri");
	}

	function get_conversations() {
		return $http.get("api/conversations");
	}

	function post_guestLogin(guestName) {
		return $http({
			method: "POST",
			url: "/api/newGuest",
			data: {
				name: guestName
			}
		});
	}

	function post_startConversation(userIds, conversationName) {
		return $http({
			method: "POST",
			url: "/api/newConversation",
			data: {
				userIds: userIds,
				conversationName: conversationName
			}
		});
	}

	function post_addUserToConversation(userid, conversationid) {
		return $http({
			method: "POST",
			url: "api/addUserToConversation",
			data: {
				userid: userid,
				conversationid: conversationid

			}
		});
	}

	function post_leaveConversation(conversationid) {
		return $http({
			method: "POST",
			url: "api/leaveConversation",
			data: {
				conversationid: conversationid
			}
		});
	}

	function post_sendMessage(conversationid, messageText) {
		return $http({
			method: "POST",
			url: "/api/newMessage",
			data: {
				conversationId: conversationid,
				messageText: messageText
			}
		});
	}

	function put_updateConversationDetails(conversationid, conversationName) {
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
