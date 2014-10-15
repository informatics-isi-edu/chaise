'use strict';

/* Controllers */

var ermLoginController = angular.module('ermLoginController', []);

ermLoginController.controller('LoginCtrl', ['$scope',
                                           function($scope) {
	TOP_DISPLAY = false;
	$scope.isVisible = true;
	this.show = function show(facet) {
		return $scope.isVisible;
	};
	this.login = function login() {
		var myToken = submitGlobusLogin($scope.username, $scope.password);
		if (myToken != null) {
			$scope.isVisible = false;
			TOP_DISPLAY = true;
			window.location = '#/discover';
		}
	};
	this.cancelLogin = function cancelLogin() {
		TOP_DISPLAY = true;
		window.location = '#/discover';
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

