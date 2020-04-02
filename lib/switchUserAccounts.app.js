(function() {
    'use strict';

/* Configuration of the md help App */
    angular.module('chaise.configure-switchUserAccounts', ['chaise.config'])

    .constant('appName', 'switchUserAccounts')

    .run(['$rootScope', function ($rootScope) {
        // When the configuration module's run block emits the `configuration-done` event, attach the app to the DOM
        $rootScope.$on("configuration-done", function () {

            angular.element(document).ready(function(){
                angular.bootstrap(document.getElementById("switchUserAccounts"), ["chaise.switchUserAccounts"]);
            });
        });
    }]);

/* md help App */
    angular.module('chaise.switchUserAccounts', [
        'chaise.authen',
        'chaise.filters',
        'chaise.alerts',
        'chaise.modal',
        'chaise.errors',
        'chaise.utils',
        'chaise.navbar',
        'chaise.inputs',
        'ermrestjs',
        'ngSanitize',
        'ui.bootstrap',
        'chaise.footer'
    ])

    .config(['$compileProvider', '$cookiesProvider', '$logProvider', '$provide', '$uibTooltipProvider', 'ConfigUtilsProvider', function($compileProvider, $cookiesProvider, $logProvider, $provide, $uibTooltipProvider, ConfigUtilsProvider) {
        ConfigUtilsProvider.$get().configureAngular($compileProvider, $cookiesProvider, $logProvider, $uibTooltipProvider);

        $provide.decorator('$templateRequest', ['ConfigUtils', 'UriUtils', '$delegate', function (ConfigUtils, UriUtils, $delegate) {
            return ConfigUtils.decorateTemplateRequest($delegate, UriUtils.chaiseDeploymentPath());
        }]);
    }])

    .controller('SwitchUserAccountsController', ['Session', '$scope', function (Session, $scope) {
        $scope.login = function () {
            Session.loginInAPopUp("action");
        }

        $scope.logout = function () {
            Session.logout();
        }
    }]);
})();
