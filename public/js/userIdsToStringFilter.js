/* global _ */
angular.module("ChatApp").filter("userIdsToString", function () {
	return function (userids, allUsers, shortened) {

		/* 	
			Takes in an array of user ids and output a string listing the users by name
			If shortened flag is not present output in form :
				"USER1, USER2 and USER3"
			if it is present then output in form :
				"USER1 + 2 others"
		*/

		if (userids.length === 0) {
			return "No one";
		}

		//The user list hasn't been fetched yet
		if (allUsers.length === 0) {
			return "Loading ...";
		}

		if (userids.length === 1) {
			return getUserFromId(userids[0]).name
		}

		if (shortened) {
			var outputString = getUserFromId(userids[0]).name;
			outputString += " and "
			outputString += userids.length - 1;
			outputString += " other";
			if (userids.length > 2) {
				outputString += "s";
			}
			return outputString;
		} else {

			var usernames = userids.map(function (userid) {
				return getUserFromId(userid).name;
			});
			return usernames
				.slice(0, usernames.length - 1).join(", ")
				.concat(" and " + usernames[usernames.length - 1]);
		}

		function getUserFromId(id) {
			return _.find(allUsers, function (registeredUser) {
				return registeredUser.id === id;
			});
		}

	};
});
