/*global console, _*/

(function () {
    var app = angular.module("ChatApp", []);

    app.controller("ChatController", function ($scope, $http) {
        $scope.loggedIn = false;

        $scope.guestLogin = guestLogin;
        $scope.githubLogin = githubLogin;
        $scope.loadUserInfo = loadUserInfo;
        $scope.startConversation = startConversation;
        $scope.getConversations = getConversations;

        $scope.sendMessage = sendMessage;
        $scope.newMessageValues = {};

        $scope.getUserFromId = getUserFromId;

        $scope.myUserData = {};
        $scope.registeredUsers = [];
        $scope.nameInputBox = "";
        $scope.myConversations = [];

        function loadUserInfo() {
            $http.get("/api/user")
                .then(function (userResult) {
                    $scope.loggedIn = true;
                    $scope.myUserData = userResult.data;
                    $http.get("/api/users")
                        .then(function (result) {
                            $scope.registeredUsers = result.data;
                        });
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
                });
        }

        function startConversation(otherUsersId) {
            $http({
                    method: "POST",
                    url: "/api/newConversation",
                    data: {
                        userIds: [$scope.myUserData._id, otherUsersId]
                    }
                })
                .then(function (response) {
                    $scope.getConversations();
                });
        }

        function getConversations() {
            $http.get("/api/conversations").then(function (result) {
                //TODO: instead of replacing all the conversations each request
                //      just find the differences and update the local list
                $scope.myConversations = result.data;
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
                });
        }

        function getUserFromId(id) {
            return _.find($scope.registeredUsers, function (registeredUser) {
                return registeredUser._id === id;
            });
        }

        angular.element(document).ready(function () {
            $scope.loadUserInfo();
            $scope.getConversations();
            //polling the server for new users and new messages
            setInterval(function () {
                loadUserInfo();
                getConversations();
            }, 10000);
        });
    });
})();
