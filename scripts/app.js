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
  'ermResultsController',
  'ermSideBarController'
]);

ermrestApp.provider('ermrest', function () {
	var catalog;
	var authnProvider;
	
	return {
		setCatalog: function (value) {
			catalog = value;
		},
		setAuthnProvider: function (value) {
			authnProvider = value;
		},
		$get: function () {
			return {
				'catalog': catalog,
				'authnProvider': authnProvider
			}
		}
	}
});

ermrestApp.config(['ermrestProvider',
                   function(ermrestProvider) {
	ermrestProvider.setCatalog(1);
	ermrestProvider.setAuthnProvider('goauth');
}]);

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
	when('/retrieve', {
		templateUrl: 'views/ermretrieve.html'//,
			//controller: 'ExplorerListCtrl'
	}).
	otherwise({
		redirectTo: '/retrieve'
	});
}]);

