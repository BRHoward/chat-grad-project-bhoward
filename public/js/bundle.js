/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/*global require*/

	angular.module("ChatApp", ["ngAnimate", "ngMaterial", "toastr"]);

	__webpack_require__(1);
	__webpack_require__(2);
	__webpack_require__(3);
	__webpack_require__(4);


/***/ },
/* 1 */
/***/ function(module, exports) {

	    /* global _, angular, console */

	    angular.module("ChatApp").controller("ChatController", ["$scope", "$http", "$mdDialog", "RequestService", "ConversationService", "toastr", function ($scope, $http, $mdDialog, RequestService, ConversationService, toastr) {

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
	        $scope.renameConversation = renameConversation;
	        $scope.getConversationLabel = getConversationLabel;

	        //Bindable variables
	        $scope.newMessageValues = {};
	        $scope.currentUserData = {};
	        $scope.registeredUsers = [];
	        $scope.nameInputBox = "";
	        $scope.currentConversations = [];
	        $scope.errorText = "";
	        $scope.unseenMessages = [];
	        $scope.loggedIn = false;

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

	        function guestLogin() {
	            RequestService.postGuestLogin($scope.nameInputBox)
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

	        function displayMessageNotification(message) {
	            var messageFrom = getUserFromId(message.userid).name;
	            toastr.info(message.text, "Message from " + messageFrom);
	        }

	        function renameConversation(ev, conversationid, currentName) {
	            ConversationService.showRenameConversationDialog(ev, currentName)
	                .then(function (newName) {
	                    updateConversationDetails(conversationid, newName);
	                });
	        }

	        function getConversationLabel(conversationid) {
	            var convo = getConversationFromId(conversationid);
	            if (convo.name !== "") {
	                return convo.name;
	            }
	            if($scope.registeredUsers.length === 0){
	                return "Loading...";
	            }
	            var otherUsersIds = convo.userids.filter(function (id) {
	                return $scope.currentUserData.id !== id;
	            });
	            if(otherUsersIds.length === 0){
	                return "Just you";
	            }
	            var outputString = "";
	            outputString += getUserFromId(otherUsersIds[0]).name;
	            if (otherUsersIds.length > 1) {
	                outputString += " and ";
	                outputString += otherUsersIds.length -1;
	                outputString += " other";
	            }
	            if (otherUsersIds.length > 2) {
	                outputString += "s";
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


/***/ },
/* 2 */
/***/ function(module, exports) {

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


/***/ },
/* 3 */
/***/ function(module, exports) {

	/* global _ */

	angular.module("ChatApp").service("ConversationService", ["$mdDialog", function ($mdDialog) {

		this.setClearedForConversationMessages = setClearedForConversationMessages;
		this.updateCurrentConversations = updateCurrentConversations;
		this.showRenameConversationDialog = showRenameConversationDialog;

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

	}]);


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(5);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(7)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./main.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./main.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(6)();
	// imports


	// module
	exports.push([module.id, "", ""]);

	// exports


/***/ },
/* 6 */
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];

		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};

		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0,
		styleElementsInsertedAtTop = [];

	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}

		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();

		// By default, add <style> tags to the bottom of <head>.
		if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

		var styles = listToStyles(list);
		addStylesToDom(styles, options);

		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}

	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}

	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}

	function insertStyleElement(options, styleElement) {
		var head = getHeadElement();
		var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
		if (options.insertAt === "top") {
			if(!lastStyleElementInsertedAtTop) {
				head.insertBefore(styleElement, head.firstChild);
			} else if(lastStyleElementInsertedAtTop.nextSibling) {
				head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
			} else {
				head.appendChild(styleElement);
			}
			styleElementsInsertedAtTop.push(styleElement);
		} else if (options.insertAt === "bottom") {
			head.appendChild(styleElement);
		} else {
			throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
		}
	}

	function removeStyleElement(styleElement) {
		styleElement.parentNode.removeChild(styleElement);
		var idx = styleElementsInsertedAtTop.indexOf(styleElement);
		if(idx >= 0) {
			styleElementsInsertedAtTop.splice(idx, 1);
		}
	}

	function createStyleElement(options) {
		var styleElement = document.createElement("style");
		styleElement.type = "text/css";
		insertStyleElement(options, styleElement);
		return styleElement;
	}

	function createLinkElement(options) {
		var linkElement = document.createElement("link");
		linkElement.rel = "stylesheet";
		insertStyleElement(options, linkElement);
		return linkElement;
	}

	function addStyle(obj, options) {
		var styleElement, update, remove;

		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement(options));
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement(options);
			update = updateLink.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement(options);
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
			};
		}

		update(obj);

		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}

	var replaceText = (function () {
		var textStore = [];

		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();

	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;

		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}

	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;

		if(media) {
			styleElement.setAttribute("media", media)
		}

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}

	function updateLink(linkElement, obj) {
		var css = obj.css;
		var sourceMap = obj.sourceMap;

		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}

		var blob = new Blob([css], { type: "text/css" });

		var oldSrc = linkElement.href;

		linkElement.href = URL.createObjectURL(blob);

		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ }
/******/ ]);