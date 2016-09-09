    /* global _, angular*/

    angular.module("ChatApp").controller("ChatController", ["$scope", "$http", "$mdDialog", "RequestService", "ConversationService", "userIdsToStringFilter", "toastr", function ($scope, $http, $mdDialog, RequestService, ConversationService, userIdsToStringFilter, toastr) {

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
        $scope.setClearedForConversationMessages = ConversationService.setClearedForConversationMessages;
        $scope.clearUnreadMessageCounter = ConversationService.clearUnreadMessageCounter;
        $scope.renameConversation = renameConversation;
        $scope.getConversationLabelFromId = getConversationLabelFromId;
        $scope.setSelectedTab = setSelectedTab;

        //Bindable variables
        $scope.newMessageValues = {};
        $scope.currentUserData = {};
        $scope.registeredUsers = [];
        $scope.nameInputBox = "";
        $scope.avatarUrlInputBox = "http://s.mtgprice.com/images/unknown.png";
        $scope.currentConversations = [];
        $scope.errorText = "";
        $scope.unseenMessages = [];
        $scope.loggedIn = false;
        $scope.currentlySelectedTab = 0;

        function setSelectedTab(number){
            $scope.currentlySelectedTab = number;
        }

        function loadUserInfo() {
            RequestService.getUserInfo()
                .then(function (userResult) {
                    $scope.loggedIn = true;
                    $scope.currentUserData = userResult.data;
                    RequestService.getRegisteredUsers()
                        .then(function (result) {
                            updateRegisteredUsers($scope.registeredUsers, result.data);
                        });
                }, function (response) {
                    $scope.errorText =
                        "Failed to get user data : " + response.status + " - " + response.statusText;
                });
        }

        function githubLogin() {
            RequestService.getGithubLoginPath()
                .then(function (result) {
                    //user is sent to github login system
                    window.location.href = result.data.uri;
                });
        }

        function refreshConversations(firstLoad) {
            RequestService.getConversations()
                .then(function (result) {
                    $scope.unseenMessages = ConversationService.updateCurrentConversations($scope.currentConversations, result.data);
                    if (!firstLoad) {
                        $scope.unseenMessages.forEach(function (unseenMessage) {
                            //if the message is not from the user themselves and the user is not already looking at the conversation
                            //then show notifications through a toast and through numbers in the conversation labels
                            if (unseenMessage.message.userid !== $scope.currentUserData.id &&
                                $scope.currentlySelectedTab !== ConversationService.getIndexOfConversation($scope.currentConversations, unseenMessage.conversationId)) {
                                displayMessageNotification(unseenMessage);
                                ConversationService.addToUnreadMessageCounter(getConversationFromId(unseenMessage.conversationId), 1);
                            }
                        });
                    }
                }, function (response) {
                    $scope.errorText =
                        "Failed to fetch conversations : " + response.status + " - " + response.statusText;
                });
        }

        function guestLogin(name, avatarURL) {
            if (name) {
                RequestService.postGuestLogin(name, avatarURL)
                    .then(function (response) {
                        $scope.loadUserInfo();
                        $scope.errorText = "";
                    }, function (response) {
                        $scope.errorText =
                            "Failed to login as guest : " + response.status + " - " + response.statusText;
                    });
            }
        }

        function startConversation(otherUsersIds, conversationName) {
            otherUsersIds.push($scope.currentUserData.id);
            RequestService.postStartConversation(otherUsersIds, conversationName)
                .then(function (response) {
                    $scope.refreshConversations();
                }, function (response) {
                    $scope.errorText =
                        "Failed to start conversation : " + response.status + " - " + response.statusText;
                });
        }

        function addUserToConversation(userid, conversationid) {
            RequestService.postAddUserToConversation(userid, conversationid)
                .then(function (response) {
                    $scope.refreshConversations();
                }, function (response) {
                    $scope.errorText =
                        "Failed to add user to conversation : " + response.status + " - " + response.statusText;
                });
        }

        function leaveConversation(conversationid) {
            RequestService.postLeaveConversation(conversationid)
                .then(function (response) {
                    $scope.refreshConversations();
                }, function (response) {
                    $scope.errorText =
                        "Failed to leave conversation : " + response.status + " - " + response.statusText;
                });
        }

        function updateConversationDetails(convId, newName) {
            RequestService.putUpdateConversationDetails(convId, newName)
                .then(function (response) {
                    $scope.refreshConversations();
                }, function (response) {
                    $scope.errorText =
                        "Failed to rename conversation : " + response.status + " - " + response.statusText;
                });
        }

        function sendMessage(conversationId) {
            RequestService.postSendMessage(conversationId, $scope.newMessageValues[conversationId])
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

        function getConversationFromId(id) {
            return _.find($scope.currentConversations, function (conversation) {
                return conversation.id === id;
            });
        }

        function displayMessageNotification(unreadMessage) {
            var messageFrom = getUserFromId(unreadMessage.message.userid).name;
            toastr.info(unreadMessage.message.text, "Message from " + messageFrom);
        }

        function renameConversation(ev, conversationid, currentName) {
            ConversationService.showRenameConversationDialog(ev, currentName)
                .then(function (newName) {
                    updateConversationDetails(conversationid, newName);
                });
        }

        function getConversationLabelFromId(conversationid) {
            //generates the string to be shown on the conversation tabs
            //either shows the conversation name or gives an indication of
            //how many people are in the conversation
            var outputString;

            var convo = getConversationFromId(conversationid);
            if (convo.name) {
                outputString = convo.name;
            } else {
                var otherUsersIds = convo.userids.filter(function (id) {
                    return $scope.currentUserData.id !== id;
                });
                outputString = userIdsToStringFilter(otherUsersIds, $scope.registeredUsers, true);
            }
            if (convo.unreadMessages) {
                outputString += " (" + convo.unreadMessages + ")";
            }
            return outputString;
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
    }]);
