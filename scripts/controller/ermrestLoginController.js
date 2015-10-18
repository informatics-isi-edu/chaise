'use strict';

/* Controllers */

var ermLoginController = angular.module('ermLoginController', []);

ermLoginController.controller('LoginCtrl', ['$scope', 'ermrest',
                                           function($scope, ermrest) {
	if (HOME == null) {
		initLocation();
		authnProvider = ermrest.authnProvider;
		if (chaiseConfig['authnProvider'] != null) {
			authnProvider = chaiseConfig['authnProvider'];
		}
	}
	
	$scope.authnProvider = authnProvider;

	this.login = function login() {
		if (authnProvider == 'goauth') {
			var referrer = $scope.getReferrer();
			getGoauth(encodeSafeURIComponent(referrer));
		} else {
			if (authnProvider == 'globusonline') {
				// nexus
				var myToken = submitGlobusLogin($scope.username, $scope.password);
				if (myToken != null) {
					var referrer = $scope.getReferrer();
					window.location = referrer;
				}
			} else if (authnProvider == 'session') {
				var referrer = $scope.getReferrer();
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
	
	$scope.getReferrer = function getReferrer() {
		var referrer = null;
		var query = decodeURIComponent(window.location.search);
		if (query.length > 0) {
			query = query.substring(1);
		}
		var parameters = query.split('&');
		$.each(parameters, function(i, parameter) {
			var item = parameter.split('=');
			if ([item[0]] == 'referrer') {
				item.shift();
				referrer = item.join('=');
			}
		});
		return referrer;
	}
}]);

