angular.module("ChatApp").config(["$mdThemingProvider", function ($mdThemingProvider) {

	$mdThemingProvider.theme("default")
		.primaryPalette("indigo")
		.accentPalette("deep-orange")
		.backgroundPalette("grey");
}]);
