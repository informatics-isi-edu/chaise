function loadModule() {
    (function () {
        'use strict';

        angular.module('chaise.configure-login', ['chaise.config'])

        .constant('settings', {
            appName: "login"
        })

        .run(['$rootScope', function ($rootScope) {
            // When the configuration module's run block emits the `configuration-done` event, attach the app to the DOM
            $rootScope.$on("configuration-done", function () {

                angular.element(document).ready(function(){
                    angular.bootstrap(document.getElementsByTagName("login")[0],["chaise.loginapp"]);
                });
            });
        }]);

        angular.module('chaise.loginapp', [
            'chaise.alerts',
            'chaise.authen',
            'chaise.inputs',
            'chaise.login',
            'chaise.modal',
            'chaise.utils',
            'ermrestjs',
            'ngCookies',
            'ngAnimate',
            'ui.bootstrap'
        ])

        .config(['ConfigUtilsProvider', '$compileProvider', '$cookiesProvider', '$logProvider', '$provide', '$uibTooltipProvider', function (ConfigUtilsProvider, $compileProvider, $cookiesProvider, $logProvider, $provide, $uibTooltipProvider) {
            ConfigUtilsProvider.$get().configureAngular($compileProvider, $cookiesProvider, $logProvider, $uibTooltipProvider);

            $provide.decorator('$templateRequest', ['ConfigUtils', 'UriUtils', '$delegate', function (ConfigUtils, UriUtils, $delegate) {
                return ConfigUtils.decorateTemplateRequest($delegate, UriUtils.chaiseDeploymentPath());
            }]);
        }])

        .run(['AlertsService', 'messageMap', 'Session', 'ERMrest', 'UiUtils', 'UriUtils',
        function (AlertsService, messageMap, Session, ERMrest, UiUtils, UriUtils) {
            try {
                var subId = Session.subscribeOnChange(function () {
                    Session.unsubscribeOnChange(subId);
                    var session = Session.getSessionValue();
                    if (!session && Session.showPreviousSessionAlert())
                    AlertsService.addAlert(messageMap.previousSession.message, 'warning', Session.createPromptExpirationToken);
                });
                UriUtils.setLocationChangeHandling();
                // UiUtils.setBootstrapDropdownButtonBehavior();  //NOTE: Assumption that the login is always at the top
            } catch (exception) {
                throw exception;
            }
        }]);

        /**
        * Manually initialize the ng-app
        * Otherwise angular throws an error if ng-app is used in the HTML template as angular tries to load the module before all the dependencies have finished loading
        */
        angular.element(document).ready(function(){
            angular.bootstrap(document.getElementsByTagName("head")[0],["chaise.configure-login"]);
        });
    })();
}

var buildVersion = "", chaiseBasePath = "/chaise/", ermrestjsBasePath = "/ermrestjs/";
// if chaise is already prefeteched, these values are defined
if (typeof chaiseBuildVariables === "object") {
    buildVersion = chaiseBuildVariables.buildVersion;
    chaiseBasePath = chaiseBuildVariables.chaiseBasePath;
    ermrestjsBasePath = chaiseBuildVariables.ermrestjsBasePath;
}

const ANGULAR_JS = chaiseBasePath + "scripts/vendor/angular.js";

/**
 * Here we load the JavaScript and CSS dependencies dynamically in the head of the containing html page
 * This is done to reduce the number of Chaise dependencies that need to be otherwise added in the html page manually
 * Also, if the names or the location of any of these files change, we could just change it here and the individual deployments do not have to know about that
 */
const JS_DEPS = [
    chaiseBasePath + 'dist/chaise.vendor.min.js',
    chaiseBasePath + 'chaise-config.js',
    chaiseBasePath + 'dist/chaise.min.js',
    ermrestjsBasePath + 'ermrest.min.js'
];

const CSS_DEPS = [
    chaiseBasePath + 'styles/vendor/bootstrap.min.css',
    chaiseBasePath + 'styles/vendor/fontawesome.min.css',
    chaiseBasePath + 'common/styles/app.css'
];

var head = document.getElementsByTagName('head')[0];

/**
 * Given the location of css file, load it and call the callback function.
 */
function loadStylesheet(url, callback) {
    // if the file is already injected
    if (document.querySelector('link[href^="' + url + '"]')) {
        callback();
        return;
    }

    var link = document.createElement('link');
    link.setAttribute("type", "text/css");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", url + (buildVersion ? ( "?v=" + buildVersion) : ""));
    head.appendChild(link);
    callback();
}


/**
 * Gien the location of css file, load it and call the callback function when loaded.
 */
function loadScript(url, callback) {
    // if the file is already injected
    var script = document.querySelector('script[src^="' + url + '"]');
    if (script) {
        // we're assuming that file injection = file loaded
        // NOTE this assumption is not correct if these files are loaded dynamically by other sources
        callback();
        return;
    }

    script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", url + (buildVersion ? ( "?v=" + buildVersion) : ""));
    script.addEventListener('load', callback);
    script.addEventListener('error', callback);
    head.appendChild(script);
}

/**
 * load all the app dependencies and call loadModule
 */
function loadDependencies() {
    var numLoaded = 0, cb = function(e) {
        if (++numLoaded === JS_DEPS.length + CSS_DEPS.length) {
            loadModule();
        }
    };

    JS_DEPS.forEach(function(url) {
        loadScript(url, cb);
    });

    CSS_DEPS.forEach(function(url) {
        loadStylesheet(url, cb);
    });
}

// All the other dependencies rely on angular.js so we have to first get the angular.js
loadScript(ANGULAR_JS, loadDependencies);
