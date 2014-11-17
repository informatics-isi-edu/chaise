'use strict';

/* Controllers */

var ermLoginController = angular.module('ermLoginController', []);

ermLoginController.controller('LoginCtrl', ['$scope', '$location',
                                           function($scope, $location) {
	TOP_DISPLAY = false;
	$scope.isVisible = true;
	this.show = function show(facet) {
		return $scope.isVisible;
	};
	this.login = function login() {
		if ($location.search()['schema'] != null) {
			SCHEMA = $location.search()['schema'];
		} else if (SCHEMA == null) {
			SCHEMA = 'facebase';
		}
		if ($location.search()['catalog'] != null) {
			CATALOG = $location.search()['catalog'];
		} else if (CATALOG == null) {
			CATALOG = 1;
		}
		var myToken = submitGlobusLogin($scope.username, $scope.password);
		if (myToken != null) {
			$scope.isVisible = false;
			TOP_DISPLAY = true;
			window.location = '#/discover?catalog=' + CATALOG + '&schema=' + SCHEMA;
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

