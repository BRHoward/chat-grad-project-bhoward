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

					//new object that keeps track of which conversation the 
					//new message is going to, used for notification purposes
					var unseenMessage =  {
						message : newConvo.messages[j],
						conversationId : newConvo.id
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
		return unseenMessages;
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

	function getIndexOfConversation(conversations, conversationId){
		return conversations.findIndex(function (conversation){
			return conversation.id === conversationId;
		});
	}

}]);
