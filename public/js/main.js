/*global console, _*/

(function () {
    var app = angular.module("ChatApp", []);

    app.controller("ChatController", function ($scope, $http) {
        $scope.loggedIn = false;

        //Bindable functions
        $scope.guestLogin = guestLogin;
        $scope.githubLogin = githubLogin;
        $scope.loadUserInfo = loadUserInfo;
        $scope.startConversation = startConversation;
        $scope.getConversations = getConversations;
        $scope.sendMessage = sendMessage;
        $scope.getUserFromId = getUserFromId;

        //Bindable variables
        $scope.newMessageValues = {};
        $scope.currentUserData = {};
        $scope.registeredUsers = [];
        $scope.nameInputBox = "";
        $scope.currentConversations = [];
        $scope.errorText = "";
        $scope.unseenMessages = [];

        function loadUserInfo() {
            $http.get("/api/user")
                .then(function (userResult) {
                    $scope.loggedIn = true;
                    $scope.currentUserData = userResult.data;
                    $http.get("/api/users")
                        .then(function (result) {
                            $scope.registeredUsers = result.data;
                        });
                }, function (response) {
                    $scope.errorText =
                        "Failed to get user data : " + response.status + " - " + response.statusText;
                });
        }

        function githubLogin() {
            $http.get("/api/oauth/uri").then(function (result) {
                //user is sent to github login system
                window.location.href = result.data.uri;
            });
        }

        function guestLogin() {
            $http({
                    method: "POST",
                    url: "/api/newGuest",
                    data: {
                        name: $scope.nameInputBox
                    }
                })
                .then(function (response) {
                    $scope.loadUserInfo();
                    $scope.errorText = "";
                }, function (response) {
                    $scope.errorText =
                        "Failed to login as guest : " + response.status + " - " + response.statusText;
                });
        }

        function startConversation(otherUsersId) {
            $http({
                    method: "POST",
                    url: "/api/newConversation",
                    data: {
                        userIds: [$scope.currentUserData.id, otherUsersId]
                    }
                })
                .then(function (response) {
                    $scope.getConversations();
                }, function (response) {
                    $scope.errorText =
                        "Failed to start conversation : " + response.status + " - " + response.statusText;
                });
        }

        function getConversations(firstLoad) {
            $http.get("/api/conversations").then(function (result) {
                //TODO: make each new set of messages show up as a timed notification
                //Dont show notifications the first time we load the page
                if (!firstLoad) {
                    $scope.unseenMessages =
                        $scope.unseenMessages.concat(findUnseenMessages($scope.currentConversations, result.data));
                }
                $scope.currentConversations = result.data;
            }, function (response) {
                $scope.errorText =
                    "Failed to fetch conversations : " + response.status + " - " + response.statusText;
            });
        }

        function sendMessage(conversationId) {
            $http({
                    method: "POST",
                    url: "/api/newMessage",
                    data: {
                        conversationId: conversationId,
                        messageText: $scope.newMessageValues[conversationId]
                    }
                })
                .then(function (response) {
                    $scope.newMessageValues[conversationId] = "";
                    $scope.getConversations();
                }, function (response) {
                    $scope.errorText =
                        "Failed to send message : " + response.status + " - " + response.statusText;
                });
        }

        function getUserFromId(id) {
            return _.find($scope.registeredUsers, function (registeredUser) {
                return registeredUser.id === id;
            });
        }

        function findUnseenMessages(oldConversations, newConversations) {
            //goes through all conversations and creates an array of all the local messages
            var oldMessages = [];
            oldConversations.forEach(function (conversation) {
                oldMessages = oldMessages.concat(conversation.messages);
            });
            //goes through all conversations and creates an array of all the fetched messages
            var newMessages = [];
            newConversations.forEach(function (conversation) {
                newMessages = newMessages.concat(conversation.messages);
            });
            //remove seen messages from newMessages array leaving only unseen messages
            for (var i = 0; i < oldMessages.length; i++) {
                for (var j = 0; j < newMessages.length; j++) {
                    if (oldMessages[i].id === newMessages[j].id) {
                        newMessages.splice(j, 1);
                        break;
                    }
                }
            }
            return newMessages;
        }

        /*
            TODO: allow users to clear the conversations
            could be done through attaching a 'cleared' field to each message
            messages which have this field are then hidden in the DOM
        */

        angular.element(document).ready(function () {
            $scope.loadUserInfo();
            $scope.getConversations(true);
            //polling the server for new users and new messages
            setInterval(function () {
                loadUserInfo();
                getConversations();
            }, 10000);
        });
    });
})();
