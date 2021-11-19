'use strict';

/**
 * Module Dependencies:
 *   config.js
 *   utils.js
 *    |--errors.js - needed for utils
 *    |  |--alerts.js
 *    |  |  |--filters.js
 *    |  |
 *    |  |--authen.js
 *    |  |  |--storage.js
 *    |  |
 *    |  |--modal.js
 *    |
 *    |--inputs.js
 *       |--validators.js
 */
angular.module('configure-search', [
    'chaise.config',
    'chaise.utils',
    'ermrestjs',
    'ngCookies'
])

.constant('settings', {
    appName: "search",
    appTitle: "Search",
    overrideHeadTitle: true,
    overrideDownloadClickBehavior: true,    // links in navbar might need this
    overrideExternalLinkBehavior: true      // links in navbar might need this
})

.run(['$rootScope', function ($rootScope) {
    // When the configuration module's run block emits the `configuration-done` event, attach the app to the DOM
    $rootScope.$on("configuration-done", function () {

        angular.element(document).ready(function(){
            angular.bootstrap(document.getElementById("search"), ["ermrestApp"]);
        });
    });
}]);

/* App Module */
var ermrestApp = angular.module('ermrestApp', [
  'ngSanitize',
  'ngGrid',
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

ermrestApp.config(['ermrestProvider', function(ermrestProvider) {
	ermrestProvider.setCatalog(1);
	ermrestProvider.setLayout('list');
}]);
