'use strict';

/* Controllers */

var ermLogoutController = angular.module('ermLogoutController', []);

ermLogoutController.controller('LogoutCtrl', ['$scope',
                                            function($scope) {
	submitLogout();
	TOP_DISPLAY = true;
	window.location = '#/retrieve';
}]);


