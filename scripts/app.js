'use strict';

/* App Module */

var ermrestApp = angular.module('ermrestApp', [
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
  'ermMatrixController'
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
	ermrestProvider.setAuthnProvider('session');
	ermrestProvider.setLayout('list');
}]);

