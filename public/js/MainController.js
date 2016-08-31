    /* global _, app */

    app.controller("ChatController", function ($scope, $http, $mdDialog, toastr) {

        //Bindable functions
        $scope.guestLogin = guestLogin;
        $scope.githubLogin = githubLogin;
        $scope.loadUserInfo = loadUserInfo;
        $scope.startConversation = startConversation;
        $scope.addUserToConversation = addUserToConversation;
        $scope.leaveConversation = leaveConversation;
        $scope.refreshConversations = refreshConversations;
        $scope.sendMessage = sendMessage;
        $scope.getUserFromId = getUserFromId;
        $scope.setClearedForConversationMessages = setClearedForConversationMessages;
        $scope.renameConversation = renameConversation;

        //Bindable variables
        $scope.newMessageValues = {};
        $scope.currentUserData = {};
        $scope.registeredUsers = [];
        $scope.nameInputBox = "";
        $scope.currentConversations = [];
        $scope.errorText = "";
        $scope.unseenMessages = [];
        $scope.loggedIn = false;

        function renameConversation(ev, conversationid, currentName) {
            var confirm = $mdDialog.prompt()
                .title("Name the conversation")
                .initialValue(currentName)
                .ariaLabel("Conversation name")
                .targetEvent(ev)
                .ok("Done")
                .cancel("Cancel");
            $mdDialog.show(confirm).then(function (newName) {
                updateConversationDetails(conversationid, newName);
            });
        }

        function loadUserInfo() {
            $http.get("/api/user")
                .then(function (userResult) {
                    $scope.loggedIn = true;
                    $scope.currentUserData = userResult.data;
                    $http.get("/api/users")
                        .then(function (result) {
                            updateRegisteredUsers($scope.registeredUsers, result.data);
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

        function startConversation(otherUsersIds, conversationName) {
            otherUsersIds.push($scope.currentUserData.id);
            $http({
                    method: "POST",
                    url: "/api/newConversation",
                    data: {
                        userIds: otherUsersIds,
                        conversationName: conversationName
                    }
                })
                .then(function (response) {
                    $scope.refreshConversations();
                }, function (response) {
                    $scope.errorText =
                        "Failed to start conversation : " + response.status + " - " + response.statusText;
                });
        }

        function addUserToConversation(userid, conversationid) {
            $http({
                    method: "POST",
                    url: "api/addUserToConversation",
                    data: {
                        userid: userid,
                        conversationid: conversationid

                    }
                })
                .then(function (response) {
                    $scope.refreshConversations();
                }, function (response) {
                    $scope.errorText =
                        "Failed to add user to conversation : " + response.status + " - " + response.statusText;
                });
        }

        function leaveConversation(conversationid) {
            $http({
                    method: "POST",
                    url: "api/leaveConversation",
                    data: {
                        conversationid: conversationid
                    }
                })
                .then(function (response) {
                    $scope.refreshConversations();
                }, function (response) {
                    $scope.errorText =
                        "Failed to leave conversation : " + response.status + " - " + response.statusText;
                });
        }

        function updateConversationDetails(convId, newName) {
            $http({
                    method: "PUT",
                    url: "api/updateConversationDetails",
                    data: {
                        conversationid: convId,
                        conversationName: newName
                    }
                })
                .then(function (response) {
                    $scope.refreshConversations();
                }, function (response) {
                    $scope.errorText =
                        "Failed to rename conversation : " + response.status + " - " + response.statusText;
                });
        }

        function refreshConversations(firstLoad) {
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
                    $scope.refreshConversations();
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

        function setClearedForConversationMessages(conversationId, cleared) {
            $scope.currentConversations.forEach(function (conversation) {
                if (conversation.id === conversationId) {
                    conversation.messages.forEach(function (message) {
                        message.cleared = cleared;
                    });
                }
            });
        }

        /*
        Rather than replace the whole conversation list each fetch, this function
        just updates the local list with new messages. This helps remove flicker, allows
        certain angular animations and lets client retain the 'cleared' field for messages.
        This also returns a list of all the new messages, used for notifications.
        */
        function updateCurrentConversations(oldConversations, newConversations) {
            var unseenMessages = [];
            var i = 0;
            //add any new conversations to the local list
            for (i = 0; i < newConversations.length; i++) {
                if (!oldConversations[i] || oldConversations[i].id !== newConversations[i].id) {
                    oldConversations.splice(i, 0, newConversations[i]);
                } else {
                    //if conversation already exists on client side the update the conversations details
                    updateMembers(oldConversations[i], newConversations[i]);
                    updateMessages(oldConversations[i], newConversations[i]);
                    oldConversations[i].name = newConversations[i].name;
                }
            }

            //remove any conversation which we are no longer a part of
            for (i = 0; i < oldConversations.length; i++) {
                if (!newConversations[i] || newConversations[i].id !== newConversations[i].id) {
                    oldConversations.splice(i, 1);
                    i--;
                }
            }
            //taking this out as a seperate function to avoid too many nested statements
            function updateMessages(oldConvo, newConvo) {
                for (var j = 0; j < newConvo.messages.length; j++) {
                    if (!oldConvo.messages[j] || oldConvo.messages[j].id !== newConvo.messages[j].id) {
                        oldConvo.messages.splice(j, 0, newConvo.messages[j]);
                        unseenMessages.push(newConvo.messages[j]);
                    }
                }
            }

            function updateMembers(oldConvo, newConvo) {
                if (!_.isEqual(oldConvo.userids, newConvo.userids)) {
                    oldConvo.userids = newConvo.userids;
                }
            }
            return unseenMessages;
        }

        function updateRegisteredUsers(oldUsers, newUsers) {
            for (var i = 0; i < newUsers.length; i++) {
                if (!oldUsers[i] || oldUsers[i].id !== oldUsers[i].id) {
                    oldUsers.splice(i, 0, newUsers[i]);
                }
            }
        }

        angular.element(document).ready(function () {
            $scope.loadUserInfo();
            $scope.refreshConversations(true);
            //polling the server for new users and new messages
            setInterval(function () {
                loadUserInfo();
                refreshConversations();
            }, 1000);
        });
    });
