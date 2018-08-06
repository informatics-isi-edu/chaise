function loadModule() {
    (function () {
        'use strict';

        angular.module('chaise.loginapp', [
            'chaise.alerts',
            'chaise.authen',
            'chaise.login',
            'chaise.modal',
            'chaise.utils',
            'ermrestjs',
            'ngCookies',
            'ngAnimate',
            'ui.bootstrap'])

            .config(['$cookiesProvider', function ($cookiesProvider) {
                $cookiesProvider.defaults.path = '/';
            }])

            .config(['$uibTooltipProvider', function ($uibTooltipProvider) {
                $uibTooltipProvider.options({ appendToBody: true });
            }])

            .config(['$logProvider', function ($logProvider) {
                $logProvider.debugEnabled(chaiseConfig.debug === true);
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
                        UiUtils.setBootstrapDropdownButtonBehavior();
                    } catch (exception) {
                        throw exception;
                    }
                }]);
    })();
}
var chaisePath = chaiseConfig['chaisePath'];

const JS_DEPS = [
    'scripts/vendor/jquery-latest.min.js',
    'scripts/vendor/ui-bootstrap-tpls-2.5.0.min.js',
    'common/vendor/angular-animate.min.js',
    'common/errors.js',
    '../ermrestjs/ermrest.js',
    'common/utils.js',
    'common/authen.js',
    'common/filters.js',
    'common/modal.js',
    'common/storage.js',
    'common/alerts.js',
    'common/login.js',
    'common/vendor/angular-cookies.min.js',
    'scripts/vendor/bootstrap.js',
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
    //script.onreadystatechange = callback;
    head.appendChild(script);
}
var jsIndex = 0;
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


// (function() {
//     'use strict';
//     var chaisePath = chaiseConfig['chaisePath'];

//     const JS_DEPS = [
//         'scripts/vendor/jquery-latest.min.js',
//         'scripts/vendor/ui-bootstrap-tpls-2.5.0.min.js',
//         'common/vendor/angular-animate.min.js',
//         '../ermrestjs/ermrest.js',
//         'common/alerts.js',
//         'common/authen.js',
//         'common/errors.js',
//         'common/filters.js',
//         'common/login.js',
//         'common/modal.js',
//         'common/storage.js',
//         'common/utils.js',
//         'common/vendor/angular-cookies.min.js',
//         'scripts/vendor/bootstrap.js',
//     ];

//     const CSS_DEPS = [
//         'styles/vendor/bootstrap.min.css',
//         'common/styles/app.css'
//     ];

//     var head = document.getElementsByTagName('head')[0];
//     function loadStylesheets(url){
//         var link = document.createElement('link');
//         link.rel = 'stylesheet';
//         link.type = 'text/css';
//         link.href = chaisePath + url;
//         head.appendChild(link);
//     }
//     function loadScripts(url, callback){
//         var script = document.createElement('script');
//         script.type = 'text/javascript';
//         script.src = chaisePath + url;
//         script.onload = callback;
//         //script.onreadystatechange = callback;
//         head.appendChild(script);
//     }
   
//     function loadModule(){
//         angular.module('chaise.loginapp', [
//             'chaise.alerts',
//             'chaise.authen',
//             'chaise.login',
//             'chaise.modal',
//             'chaise.utils',
//             'ermrestjs',
//             'ngCookies',
//             'ngAnimate',
//             'ui.bootstrap'])

//         .config(['$cookiesProvider', function($cookiesProvider) {
//             $cookiesProvider.defaults.path = '/';
//         }])

//         .config(['$uibTooltipProvider', function($uibTooltipProvider) {
//             $uibTooltipProvider.options({appendToBody: true});
//         }])
        
//         .config(['$logProvider', function($logProvider) {
//             $logProvider.debugEnabled(chaiseConfig.debug === true);
//         }])
        
//         .run(['AlertsService', 'messageMap', 'Session', 'ERMrest', 'UiUtils', 'UriUtils',
//             function(AlertsService, messageMap, Session, ERMrest, UiUtils, UriUtils) {
//             try {
//                 var subId = Session.subscribeOnChange(function() {
//                     Session.unsubscribeOnChange(subId);
//                     var session = Session.getSessionValue();
//                     if (!session && Session.showPreviousSessionAlert()) 
//                         AlertsService.addAlert(messageMap.previousSession.message, 'warning', Session.createPromptExpirationToken);
//                 });
//                 UriUtils.setLocationChangeHandling();
//                 UiUtils.setBootstrapDropdownButtonBehavior();
//             } catch (exception) {
//                 throw exception;
//             }
//         }]);
//     }
//     var count = 0;
//     function fileLoaded(){
//         count = count+1;
//         if(count == JS_DEPS.length){
//             loadModule();
//         } else {
//             loadScripts(JS_DEPS[count], fileLoaded);
//         }
//     }
//     CSS_DEPS.forEach(function(url){
//         loadStylesheets(url);
//     });
//     loadScripts(JS_DEPS[0], fileLoaded);
// })();
