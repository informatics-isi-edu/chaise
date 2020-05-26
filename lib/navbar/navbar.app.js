function loadModule() {
    (function () {
        'use strict';

        angular.module('chaise.configure-navbar', ['chaise.config'])

        .constant('appName', 'navbar')

        .run(['$rootScope', function ($rootScope) {
            // When the configuration module's run block emits the `configuration-done` event, attach the app to the DOM
            $rootScope.$on("configuration-done", function () {

                angular.element(document).ready(function(){
                    angular.bootstrap(document.getElementsByTagName("navbar")[0],["chaise.navbarapp"]);
                });
            });
        }]);

        angular.module('chaise.navbarapp', [
            'chaise.alerts',
            'chaise.authen',
            'chaise.inputs',
            'chaise.login',
            'chaise.modal',
            'chaise.navbar',
            'chaise.utils',
            'ermrestjs',
            'ngCookies',
            'ngAnimate',
            'ui.bootstrap'
        ])

        .config(['$compileProvider', '$cookiesProvider', '$logProvider', '$provide', '$uibTooltipProvider', 'ConfigUtilsProvider', function ($compileProvider, $cookiesProvider, $logProvider, $provide, $uibTooltipProvider, ConfigUtilsProvider) {
            ConfigUtilsProvider.$get().configureAngular($compileProvider, $cookiesProvider, $logProvider, $uibTooltipProvider);

            $provide.decorator('$templateRequest', ['ConfigUtils', 'UriUtils', '$delegate', function (ConfigUtils, UriUtils, $delegate) {
                return ConfigUtils.decorateTemplateRequest($delegate, UriUtils.chaiseDeploymentPath());
            }]);
        }])

        .run(['AlertsService', 'messageMap', '$rootScope', 'Session', 'ERMrest', 'UiUtils', 'UriUtils',
        function (AlertsService, messageMap, $rootScope, Session, ERMrest, UiUtils, UriUtils) {
            try {
                var subId = Session.subscribeOnChange(function () {
                    Session.unsubscribeOnChange(subId);
                    var session = Session.getSessionValue();
                    if (!session && Session.showPreviousSessionAlert())
                    AlertsService.addAlert(messageMap.previousSession.message, 'warning', Session.createPromptExpirationToken);
                });
                UriUtils.setLocationChangeHandling();
                // UiUtils.setBootstrapDropdownButtonBehavior();  //NOTE: Assumption that the navbar is always at the top
            } catch (exception) {
                throw exception;
            }

            // when navbar done, if the page was hidden and we were showing a loader,
            // switch the modes.
            $rootScope.$on("navbar-done", function () {
                var bodyWait = document.querySelector(".wait-for-navbar");
                if (bodyWait) {
                    bodyWait.style.visibility = "visible";
                }

                var loader = document.querySelector(".wait-for-navbar-loader");
                if (loader) {
                    loader.style.visibility = "hidden";
                }
            });
        }]);

        /**
        * Manually initialize the ng-app
        * Otherwise angular throws an error if ng-app is used in the HTML template as angular tries to load the module before all the dependencies have finished loading
        */
        angular.element(document).ready(function(){
            angular.bootstrap(document.getElementsByTagName("head")[0],["chaise.configure-navbar"]);
        });
    })();
}


// since we're dynamically loading css, this makes sure the rule
// to hide the content and show the loader is applied from the beginning:
var css = '.wait-for-navbar {visibility: hidden;} .wait-for-navbar-loader {visibility: visible;}',
    style = document.createElement('style');
document.head.appendChild(style);
style.type = 'text/css';
style.appendChild(document.createTextNode(css));


// chaiseBuildVariables must be defined since it's part of the build,
// we don't need to check for existence of this value
var buildVersion = chaiseBuildVariables.buildVersion;
var chaiseBasePath = chaiseBuildVariables.chaiseBasePath;
var ermrestjsBasePath = chaiseBuildVariables.ermrestjsBasePath;

/**
 * Here we load the JavaScript and CSS dependencies dynamically in the head of the containing html page
 * This is done to reduce the number of Chaise dependencies that need to be otherwise added in the html page manually
 * Also, if the names or the location of any of these files change, we could just change it here and the individual deployments do not have to know about that
 */
const JS_DEPS = [
    chaiseBasePath + 'dist/chaise.vendor.min.js',
    chaiseBasePath + 'chaise-config.js',
    chaiseBasePath + 'dist/chaise.min.js',
    ermrestjsBasePath + 'ermrest.vendor.min.js',
    ermrestjsBasePath + 'ermrest.min.js'
];

const CSS_DEPS = [
    chaiseBasePath + 'styles/vendor/bootstrap.min.css',
    chaiseBasePath + 'styles/vendor/fontawesome.min.css',
    chaiseBasePath + 'common/styles/app.css'
];

var head = document.getElementsByTagName('head')[0];
function loadStylesheets(url) {
    // if the file is already injected
    if (document.querySelector('link[href^="' + url + '"]')) {
        return;
    }

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url + "?v=" + buildVersion;
    head.appendChild(link);
}
function loadJSDeps(url, callback) {
    // if the file is already injected
    if (document.querySelector('script[src^="' + url + '"]')) {
        callback();
        return;
    }
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url + "?v=" + buildVersion;
    script.onload = callback;
    script.onerror = callback;
    head.appendChild(script);
}
var jsIndex = 0;

/**
 * Function to load all JavaScript dependencies needed for the navbar app
 * The loadModule() function is invoked only after all the dependencies have been added to the HTML page
 * The loadModule() function has an IIFE with the module definition for 'chaise.navbarapp' which then adds the navbar app to the html page
 */
function fileLoaded() {
    jsIndex = jsIndex + 1;
    if (jsIndex == JS_DEPS.length) {
        loadModule();
    } else {
        loadJSDeps(JS_DEPS[jsIndex], fileLoaded);
    }
}
CSS_DEPS.forEach(function (url) {
    loadStylesheets(url);
});
loadJSDeps(JS_DEPS[0], fileLoaded);
