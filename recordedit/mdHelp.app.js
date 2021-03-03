(function() {
    'use strict';

/* Configuration of the md help App */
    angular.module('chaise.configure-mdHelp', ['chaise.config'])

    .constant('settings', {
        appName: "mdHelp",
        overrideDownloadClickBehavior: true,    // links in navbar might need this
        overrideExternalLinkBehavior: true      // links in navbar might need this
    })

    .run(['$rootScope', function ($rootScope) {
        // When the configuration module's run block emits the `configuration-done` event, attach the app to the DOM
        $rootScope.$on("configuration-done", function () {

            angular.element(document).ready(function(){
                angular.bootstrap(document.getElementById("mdHelp"), ["chaise.mdHelp"]);
            });
        });
    }]);

/* md help App */
    angular.module('chaise.mdHelp', [
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

    // TODO scrollbar behavior of this page is different from other apps
    // because the strcuture is completely different.
})();
