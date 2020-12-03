(function () {
    'use strict';

    angular.module('chaise.configure-help', ['chaise.config'])

    .constant('appName', 'help')

    .run(['$rootScope', function ($rootScope) {
        // When the configuration module's run block emits the `configuration-done` event, attach the app to the DOM
        $rootScope.$on("configuration-done", function () {

            angular.element(document).ready(function(){
                angular.bootstrap(document.getElementById("help"), ["chaise.help"]);
            });
        });
    }]);

    angular.module('chaise.help', [
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

    .constant('helpPages', {
        'home': {
            'file': 'home.md',
            'title': 'Chaise help pages'
        },
        'viewer-annotation': {
            'file': 'viewer-annotation.md',
            'title': 'Viewer annotation drawing tools'
        }
    })

    .run(['ConfigUtils', 'ERMrest', 'headInjector', 'UiUtils', 'UriUtils', 'helpPages', '$rootScope', '$timeout', '$window',
         function (ConfigUtils, ERMrest, headInjector, UiUtils, UriUtils, helpPages, $rootScope, $timeout, $window) {

        // find the help page based on the given query parameter
        var pageName = UriUtils.getQueryParam($window.location.href, "page"), helpContent, page;
        if (typeof pageName === "string") {
            var parts = pageName.split("#");
            if (parts.length > 1) {
                pageName = parts[0];
            }
        }
        if (!pageName || !(pageName in helpPages)) {
            pageName = "home";
        }
        page = helpPages[pageName];

        // change the title
        headInjector.addTitle(page.title);

        // fetch the help page
        ConfigUtils.getHTTPService().get(UriUtils.chaiseDeploymentPath() + "help/" + page.file).then(function (response) {
            helpContent = response.data;
            return ERMrest.onload();
        }).then(function () {
            // show the content
            $rootScope.helpContent = ERMrest.renderMarkdown(helpContent);
            $rootScope.displayReady = true;


            $timeout(function () {
                tocbot.init({
                  // Where to render the table of contents.
                  tocSelector: '#toc-container',
                  // // Where to grab the headings to build the table of contents.
                  contentSelector: '.help-content',
                  // Which headings to grab inside of the contentSelector element.
                  headingSelector: 'h1, h2, h3, h4',
                  ignoreSelector: '.ignored-section',
                  // For headings inside relative or absolute positioned containers within content.
                  hasInnerContainers: true
                });

                // make sure the height is properly set
                UiUtils.attachContainerHeightSensors(null, null, true, document.querySelector('#toc-container'));

                // make sure footer position is correct
                UiUtils.attachFooterResizeSensor(0);
            });
        }).catch(function (err) {
            throw err;
        });
    }]);

})();
