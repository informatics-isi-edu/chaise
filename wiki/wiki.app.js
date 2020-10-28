(function () {
    'use strict';

    angular.module('chaise.configure-wiki', ['chaise.config'])

    .constant('appName', 'wiki')

    .run(['$rootScope', function ($rootScope) {
        // When the configuration module's run block emits the `configuration-done` event, attach the app to the DOM
        $rootScope.$on("configuration-done", function () {

            angular.element(document).ready(function(){
                angular.bootstrap(document.getElementById("wiki"), ["chaise.wiki"]);
            });
        });
    }]);

    angular.module('chaise.wiki', [
        'ngSanitize',
        'ngCookies',
        'ngAnimate',
        'duScroll',
        'chaise.alerts',
        'chaise.errors',
        'chaise.modal',
        'chaise.navbar',
        'chaise.html',
        'chaise.utils',
        'ermrestjs',
        'ui.bootstrap',
        'chaise.footer',
        'chaise.resizable'
    ])

    .config(['$compileProvider', '$cookiesProvider', '$logProvider', '$provide', '$uibTooltipProvider', 'ConfigUtilsProvider',
            function($compileProvider, $cookiesProvider, $logProvider, $provide, $uibTooltipProvider, ConfigUtilsProvider) {
        ConfigUtilsProvider.$get().configureAngular($compileProvider, $cookiesProvider, $logProvider, $uibTooltipProvider);

        $provide.decorator('$templateRequest', ['ConfigUtils', 'UriUtils', '$delegate', function (ConfigUtils, UriUtils, $delegate) {
            return ConfigUtils.decorateTemplateRequest($delegate, UriUtils.chaiseDeploymentPath());
        }]);
    }])

    .constant('wikiPages', {
        'home': {
            'file': 'home.md',
            'title': 'Chaise wiki pages'
        },
        'viewer-annotation': {
            'file': 'viewer-annotation.md',
            'title': 'Viewer annotation drawing tools'
        }
    })

    .run(['ConfigUtils', 'ERMrest', 'headInjector', 'UiUtils', 'UriUtils', 'wikiPages', '$rootScope', '$timeout', '$window',
         function (ConfigUtils, ERMrest, headInjector, UiUtils, UriUtils, wikiPages, $rootScope, $timeout, $window) {

        // find the wiki page based on the given query parameter
        var pageName = UriUtils.getQueryParam($window.location.href, "page"), wikiContent, page;
        if (!pageName || !(pageName in wikiPages)) {
            pageName = "home";
        }
        page = wikiPages[pageName];

        // change the title
        headInjector.addTitle(page.title);

        // fetch the wiki page
        ConfigUtils.getHTTPService().get(UriUtils.chaiseDeploymentPath() + "wiki/" + page.file).then(function (response) {
            wikiContent = response.data;
            return ERMrest.onload();
        }).then(function () {
            // show the content
            $rootScope.wikiContent = ERMrest.renderMarkdown(wikiContent);
            $rootScope.displayReady = true;


            $timeout(function () {
                // make sure the height is properly set
                UiUtils.attachContainerHeightSensors();

                // make sure footer position is correct
                UiUtils.attachFooterResizeSensor(0);
            });
        }).catch(function (err) {
            throw err;
        });
    }]);

})();
