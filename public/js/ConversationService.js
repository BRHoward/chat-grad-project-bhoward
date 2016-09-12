/* global _ */

angular.module("ChatApp").service("ConversationService", ["$mdDialog", function ($mdDialog) {

	this.setClearedForConversationMessages = setClearedForConversationMessages;
	this.updateCurrentConversations = updateCurrentConversations;
	this.showRenameConversationDialog = showRenameConversationDialog;
	this.addToUnreadMessageCounter = addToUnreadMessageCounter;
	this.clearUnreadMessageCounter = clearUnreadMessageCounter;
	this.getIndexOfConversation = getIndexOfConversation;

	function setClearedForConversationMessages(conversations, conversationId, cleared) {
		conversations.forEach(function (conversation) {
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
	This also returns a list of all the new conversation and messages, used for notifications.
	*/
	function updateCurrentConversations(oldConversations, newConversations) {
		var unseenMessages = [];
		var unseenConversations = [];
		var i = 0;
		var j = 0;

		addNewConversations(oldConversations, newConversations);
		removeOldConversations(oldConversations, newConversations);

		function addNewConversations(oldConversations, newConversations) {
			var conversationFound;
			for (i = 0; i < newConversations.length; i++) {
				conversationFound = false;
				for (j = 0; j < oldConversations.length; j++) {
					if (newConversations[i].id === oldConversations[j].id) {
						updateMessages(oldConversations[j], newConversations[i]);
						updateMembers(oldConversations[j], newConversations[i]);
						oldConversations[j].name = newConversations[i].name;
						conversationFound = true;
						break;
					}
				}

				//the current conversation was not found on the local list, add it
				if (!conversationFound) {
					if (!oldConversations[i]) {
						oldConversations.push(newConversations[i]);
					} else {
						oldConversations.splice(i, 0, newConversations[i]);
					}
					unseenConversations.push(oldConversations[i]);
				}
			}
		}

		function removeOldConversations(oldConversations, newConversations) {
			var conversationFound;
			for (i = 0; i < oldConversations.length; i++) {
				conversationFound = false;
				for (j = 0; j < newConversations.length; j++) {
					if (oldConversations[i].id === newConversations[j].id) {
						conversationFound = true;
						break;
					}
				}
				//this local conversation is not a part of the new list, remove it
				if (!conversationFound) {
					oldConversations.splice(i, 1);
					i--;
				}
			}
		}

		function updateMessages(oldConvo, newConvo) {
			for (var k = 0; k < newConvo.messages.length; k++) {
				if (!oldConvo.messages[k] || oldConvo.messages[k].id !== newConvo.messages[k].id) {
					oldConvo.messages.splice(k, 0, newConvo.messages[k]);

					//new object that keeps track of which conversation the 
					//new message is going to, used for notification purposes
					var unseenMessage = {
						message: newConvo.messages[k],
						conversationId: newConvo.id
					};
					unseenMessages.push(unseenMessage);
				}
			}
		}

		function updateMembers(oldConvo, newConvo) {
			if (!_.isEqual(oldConvo.userids, newConvo.userids)) {
				oldConvo.userids = newConvo.userids;
			}
		}

		function updateName(oldConvo, newConvo) {
			if (oldConvo.name !== newConvo.name) {
				oldConvo.name = newConvo.name;
			}
		}

		return {
			unseenMessages: unseenMessages,
			unseenConversations: unseenConversations
		};
	}

	function addToUnreadMessageCounter(conversation, add) {
		if (!conversation.unreadMessages) {
			conversation.unreadMessages = add;
		} else {
			conversation.unreadMessages += add;
		}
	}

	function clearUnreadMessageCounter(conversation) {
		conversation.unreadMessages = 0;
	}

	function showRenameConversationDialog(event, currentName) {
		var confirm = $mdDialog.prompt()
			.title("Name the conversation")
			.initialValue(currentName)
			.ariaLabel("Conversation name")
			.targetEvent(event)
			.ok("Done")
			.cancel("Cancel");
		return $mdDialog.show(confirm);
	}

	function getIndexOfConversation(conversations, conversationId) {
		return conversations.findIndex(function (conversation) {
			return conversation.id === conversationId;
		});
	}

}]);
