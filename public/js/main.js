/*global console, _*/

(function () {
    var app = angular.module("ChatApp", ["ngAnimate", "toastr"]);

    app.controller("ChatController", function ($scope, $http, toastr) {
        $scope.loggedIn = false;

        //Bindable functions
        $scope.guestLogin = guestLogin;
        $scope.githubLogin = githubLogin;
        $scope.loadUserInfo = loadUserInfo;
        $scope.startConversation = startConversation;
        $scope.getConversations = getConversations;
        $scope.sendMessage = sendMessage;
        $scope.getUserFromId = getUserFromId;
        $scope.clearConversation = clearConversation;
        $scope.showAllConversation = showAllConversation;

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
                $scope.unseenMessages = updateCurrentConversations($scope.currentConversations, result.data);
                if (!firstLoad) {
                    $scope.unseenMessages.forEach(function (unseenMessage) {
                        if (unseenMessage.userid !== $scope.currentUserData.id) {
                            displayMessageNotification(unseenMessage);
                        }

                    });
                }
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

        function displayMessageNotification(message) {
            var messageFrom = getUserFromId(message.userid).name;
            toastr.info(message.text, "Message from " + messageFrom);
        }

        function clearConversation(conversationId) {
            $scope.currentConversations.forEach(function (conversation) {
                if (conversation.id === conversationId) {
                    conversation.messages.forEach(function (message) {
                        message.cleared = true;
                    });
                }
            });
        }

        function showAllConversation(conversationId) {
            $scope.currentConversations.forEach(function (conversation) {
                if (conversation.id === conversationId) {
                    conversation.messages.forEach(function (message) {
                        message.cleared = false;
                    });
                }
            });
        }

        /*
        Rather than replace the whole conversation list each get, this function 
        just updates the local list with new messages. This helps remove flicker, allows 
        certain angular animations and lets client retain the 'cleared' field for messages.
        This also returns a list of all the new messages, used for notifications.
        */
        function updateCurrentConversations(oldConversations, newConversations) {
            var unseenMessages = [];
            console.log("updating the current conversation");
            console.log(oldConversations);
            console.log(newConversations);
            //add any new conversations to the local list
            for (var i = 0; i < newConversations.length; i++) {
                if (!oldConversations[i] || oldConversations[i].id !== newConversations[i].id) {
                    console.log("adding a new conversation to the local list");
                    oldConversations.splice(i, 0, newConversations[i]);
                } else {
                    //if the conversation already exists on the client side then just
                    //add in the new messages
                    console.log("updating the conversation with new messages");
                    updateMessages(oldConversations[i], newConversations[i]);
                }
            }

            //taking this out as a seperate function to avoid too many nested statements
            function updateMessages(oldConvo, newConvo) {
                console.log(oldConvo);
                console.log(newConvo);
                for (var j = 0; j < newConvo.messages.length; j++) {
                    if (!oldConvo.messages[j] || oldConvo.messages[j].id !== newConvo.messages[j].id) {
                        oldConvo.messages.splice(j, 0, newConvo.messages[j]);
                        unseenMessages.push(newConvo.messages[j]);
                    }
                }
            }
            return unseenMessages;
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
