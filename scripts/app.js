'use strict';

/* App Module */

var ermrestApp = angular.module('ermrestApp', [
  'ngSanitize',
  'ngGrid',
  'rzModule',
  '720kb.datepicker',
  'ui.select',
  'ngCookies',
  'ermrestjs',
  'chaise.navbar',
  'ermLoginController',
  'facetsModel',
  'facetsService',
  'ermInitController',
  'ermDetailController',
  'ermFilterController',
  'ermResultsController',
  'ermSideBarController',
  'ermrestTourController'
]);

ermrestApp.provider('ermrest', function () {
	var catalog;
	var layout;

	return {
		setCatalog: function (value) {
			catalog = value;
		},
		setLayout: function (value) {
			layout = value;
		},
		$get: function () {
			return {
				'catalog': catalog,
				'layout': layout
			}
		}
	}
});

ermrestApp.config(['ConfigUtilsProvider', 'ermrestProvider',
                   function(ConfigUtilsProvider, ermrestProvider) {
	ermrestProvider.setCatalog(1);
	ermrestProvider.setLayout('list');
    ConfigUtilsProvider.$get().setConfigJSON();
}]);
