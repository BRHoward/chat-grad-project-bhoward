/*global require*/

angular.module("ChatApp", ["ngAnimate", "ngMaterial", "luegg.directives", "toastr"]);

require("./ChatController.js");
require("./RequestService.js");
require("./ChatConfig.js");
require("./ConversationService.js");
require("./userIdsToStringFilter.js");
require("../css/main.css");
