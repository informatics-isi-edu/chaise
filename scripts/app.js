'use strict';

/* App Module */

var ermrestApp = angular.module('ermrestApp', [
  'ngRoute',
  'ngSanitize',
  'ngGrid',
  'rzModule',
  '720kb.datepicker',
  'ermLoginController',
  'ermLogoutController',
  'facetsModel',
  'facetsService',
  'ermInitController',
  'ermDetailController',
  'ermFilterController',
  'ermResultsController',
  'ermSideBarController',
  'ermSettingsController'
]);

ermrestApp.provider('ermrest', function () {
	var catalog;
	var authnProvider;
	var layout;
	
	return {
		setCatalog: function (value) {
			catalog = value;
		},
		setAuthnProvider: function (value) {
			authnProvider = value;
		},
		setLayout: function (value) {
			layout = value;
		},
		$get: function () {
			return {
				'catalog': catalog,
				'authnProvider': authnProvider,
				'layout': layout
			}
		}
	}
});

ermrestApp.config(['ermrestProvider',
                   function(ermrestProvider) {
	ermrestProvider.setCatalog(1);
	ermrestProvider.setAuthnProvider('goauth');
	ermrestProvider.setLayout('list');
}]);

ermrestApp.config(['$routeProvider',
                   function($routeProvider) {
	$routeProvider.
	when('/login', {
		templateUrl: 'views/ermlogin.html'//,
			//controller: 'LoginCtrl'
	}).
	when('/logout', {
		templateUrl: 'views/ermlogout.html'//,
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

