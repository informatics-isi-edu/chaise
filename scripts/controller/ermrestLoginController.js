'use strict';

/* Controllers */

var ermLoginController = angular.module('ermLoginController', []);

ermLoginController.controller('LoginCtrl', ['$scope', '$location', 'ermrest',
                                           function($scope, $location, ermrest) {
	if (HOME == null) {
		initLocation();
		authnProvider = ermrest.authnProvider;
	}
	
	$scope.authnProvider = authnProvider;

	this.login = function login() {
		if (authnProvider == 'goauth') {
			var referrer = $location.search()['referrer'];
			if (referrer == null) {
				referrer = '' + window.location;
				var index = referrer.indexOf('#/login');
				referrer = referrer.substring(0, index);
			}
			getGoauth(encodeSafeURIComponent(referrer));
		} else {
			if (authnProvider == 'globusonline') {
				// nexus
				var myToken = submitGlobusLogin($scope.username, $scope.password);
				if (myToken != null) {
					var referrer = $location.search()['referrer'];
					window.location = referrer;
				}
			} else if (authnProvider == 'session') {
				var referrer = $location.search()['referrer'];
				submitLogin($scope.username, $scope.password, referrer);
			} else {
				alert('Authentication "' + authnProvider + '" is not supported.');
			}
		}
	};
	this.cancelLogin = function cancelLogin() {
		window.location = '#/retrieve';
	};
	this.checkLogin = function checkLogin(keyCode) {
		if (keyCode == 13 && $scope.username && $scope.password) {
			this.login();
		}
	};
	this.disableLoginButton = function disableLoginButton() {
		return (!$scope.username || !$scope.password);
	};
}]);

