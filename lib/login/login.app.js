function loadModule() {
    (function () {
        'use strict';

        angular.module('chaise.configure-login', ['chaise.config'])

        .constant('appName', 'login')

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
var chaisePath = "/chaise/";
if (typeof chaiseConfig != 'undefined' && typeof chaiseConfig === "object" && chaiseConfig['chaiseBasePath'] !== undefined) {
    chaisePath = chaiseConfig['chaiseBasePath'];
}

/**
 * Here we load the JavaScript and CSS dependencies dynamically in the head of the containing html page
 * This is done to reduce the number of Chaise dependencies that need to be otherwise added in the html page manually
 * Also, if the names or the location of any of these files change, we could just change it here and the individual deployments do not have to know about that
 */
const JS_DEPS = [
    'scripts/vendor/ui-bootstrap-tpls-2.5.0.min.js',
    'common/vendor/angular-animate.min.js',
    'common/config.js',
    'common/errors.js',
    '../ermrestjs/ermrest.js',
    'common/validators.js',
    'common/inputs.js',
    'common/utils.js',
    'common/authen.js',
    'common/filters.js',
    'common/modal.js',
    'common/storage.js',
    'common/alerts.js',
    'common/login.js',
    'common/vendor/angular-cookies.min.js',
];

const CSS_DEPS = [
    'styles/vendor/bootstrap.min.css',
    'common/styles/app.css'
];

var head = document.getElementsByTagName('head')[0];
function loadStylesheets(url) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = chaisePath + url;
    head.appendChild(link);
}
function loadJSDeps(url, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = chaisePath + url;
    script.onload = callback;
    head.appendChild(script);
}
var jsIndex = 0;

/**
 * Function to load all JavaScript dependencies needed for the login app
 * The loadModule() function is invoked only after all the dependencies have been added to the HTML page
 * The loadModule() function has an IIFE with the module definition for 'chaise.loginapp' which then adds the login app to the html page
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
