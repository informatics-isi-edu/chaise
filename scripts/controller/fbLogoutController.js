'use strict';

/* Controllers */

var fbLogoutController = angular.module('fbLogoutController', []);

fbLogoutController.controller('LogoutCtrl', ['$scope',
                                            function($scope) {
	submitLogout();
	TOP_DISPLAY = true;
	window.location = '#/discover';
}]);


