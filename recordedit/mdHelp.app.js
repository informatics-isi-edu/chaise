(function() {
    'use strict';

/* Configuration of the md help App */
    angular.module('chaise.configure-mdHelp', ['chaise.config'])

    .constant('appName', 'mdHelp')

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

    .config(['$provide', function($provide) {
        $provide.decorator('$templateRequest', ['ConfigUtils', 'UriUtils', '$delegate', function (ConfigUtils, UriUtils, $delegate) {
            return ConfigUtils.decorateTemplateRequest($delegate, UriUtils.chaiseDeploymentPath());
        }]);
    }])

    .run(['headInjector', 'UiUtils', 'UriUtils', function (headInjector, UiUtils, UriUtils) {
        UriUtils.setOrigin();
        // This is to allow the dropdown button to open at the top/bottom depending on the space available
        UiUtils.setBootstrapDropdownButtonBehavior();

    }])

    .controller('mdHelpController', ['UiUtils', '$document', '$scope', '$timeout', '$window', function (UiUtils, $document, $scope, $timeout, $window) {
        var mainBodyEl;

        $timeout(function () {
            mainBodyEl = $document[0].getElementsByClassName('main-container');
        }, 0);

        // watch for the main body size to change
        $scope.$watch(function() {
            return mainBodyEl && mainBodyEl[0].offsetHeight;
        }, function (newValue, oldValue) {
            if (newValue) {
                $timeout(function () {
                    UiUtils.setFooterStyle(0);
                }, 0);
            }
        });

        /*** Container Heights and other styling ***/
        // fetches the height of navbar, bookmark container, and view
        // also fetches the main container for defining the dynamic height
        function fetchContainerElements() {
            var elements = {};
            try {
                // get document height
                elements.docHeight = $document[0].documentElement.offsetHeight
                // get navbar height
                elements.navbarHeight = $document[0].getElementById('mainnav').offsetHeight;
                // get md help main container
                elements.container = $document[0].getElementById('main-content');
            } catch (error) {
                $log.warn(error);
            }
            return elements;
        };

        function setMainContainerHeight() {
            var elements = fetchContainerElements();
            // if these values are not set yet, don't set the height
            if(elements.navbarHeight !== undefined && elements.bookmarkHeight) {
                UiUtils.setDisplayContainerHeight(elements);
            }
        };
        // change the main container height whenever the DOM resizes
        angular.element($window).bind('resize', function(){
            setMainContainerHeight();
            UiUtils.setFooterStyle(0);
            $scope.$digest();
        });
    }])

})();
