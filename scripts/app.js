'use strict';

/* App Module */

var ermrestApp = angular.module('ermrestApp', [
  'ngRoute',
  'ngSanitize',
  'ngGrid',
  'rzModule',
  'ermLoginController',
  'ermLogoutController',
  'facetsModel',
  'facetsService',
  'ermInitController',
  'ermDetailController',
  'ermFilterController',
  'ermResultsController'
]);

ermrestApp.config(['$routeProvider',
                   function($routeProvider) {
	$routeProvider.
	when('/login', {
		templateUrl: 'views/ermlogin.html'//,
			//controller: 'LoginCtrl'
	}).
	when('/logout', {
		templateUrl: 'views/ermlogout.html',
		//controller: 'LogoutCtrl'
	}).
	when('/explore', {
		templateUrl: 'views/ermexplore.html'//,
			//controller: 'ExplorerListCtrl'
	}).
	otherwise({
		redirectTo: '/explore'
	});
}]);

