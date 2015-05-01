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
			getGoauth(referrer);
		} else {
			if ($location.search()['schema'] != null) {
				SCHEMA = $location.search()['schema'];
			} else if (SCHEMA == null) {
				SCHEMA = 'legacy';
			}
			if ($location.search()['catalog'] != null) {
				CATALOG = $location.search()['catalog'];
			} else if (CATALOG == null) {
				CATALOG = 1;
			}
			var myToken = submitGlobusLogin($scope.username, $scope.password);
			if (myToken != null) {
				window.location = '#/retrieve?catalog=' + CATALOG + '&schema=' + SCHEMA;
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

