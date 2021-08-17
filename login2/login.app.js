(function () {
    'use strict';

    angular.module('chaise.configure-login2', ['chaise.config'])

    .constant('settings', {
        appName: "login2",
        appTitle: "Record"
    })

    .run(['$rootScope', function ($rootScope) {
        // When the configuration module's run block emits the `configuration-done` event, attach the app to the DOM
        $rootScope.$on("configuration-done", function () {
            console.log("config event captured");
            angular.element(document).ready(function(){
                angular.bootstrap(document.getElementById("login2"),["chaise.login2app"]);
            });
        });
    }]);

    angular.module('chaise.login2app', [
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

    .controller("Login2Controller", ['ConfigUtils', 'ERMrest', 'logService', '$rootScope', 'Session', function (ConfigUtils, ERMrest, logService, $rootScope, Session) {
        console.log("login controller");
        var vm = this;
        var chaiseConfig = ConfigUtils.getConfigJSON();

        vm.joinLink = "https://app.globus.org/groups/" + chaiseConfig.newLoginGroupId + "/join";

        vm.reLogin = function () {
            // log the user out
            Session.logoutWithoutRedirect(logService.logActions.VERIFY_GLOBUS_GROUP_LOGOUT).then(function () {
                // log the user in without prompting
                // can we do this?
                //  - doesn't seem likely
                //
                // NOTE: Click "proceed" logs out, starts login process in new window, closes current window without triggering the referrer reload
                // NOTE: maybe reuse reffererid to refresh main page after
                Session.loginInAPopUp(logService.logActions.VERIFY_GLOBUS_GROUP_LOGIN);
            }).catch(function (exception) {
                // show alert if logout fails?
                console.log(exception);
            });
        }
    }])

    .run(['AlertsService', 'ConfigUtils', 'messageMap', '$rootScope', 'Session', 'ERMrest', 'UiUtils', 'UriUtils', '$window',
    function (AlertsService, ConfigUtils, messageMap, $rootScope, Session, ERMrest, UiUtils, UriUtils, $window) {
        var session,
            errorData = {};

        var context = ConfigUtils.getContextJSON(),
            chaiseConfig = ConfigUtils.getConfigJSON();

        var subId = Session.subscribeOnChange(function () {
            Session.unsubscribeOnChange(subId);
            var session = Session.getSessionValue();
            console.log(session);

            // if the user does have the defined group, continue with auto close and reload of the application
            var hasGroup = session && session.attributes.filter(function(attr) {
                return attr.id === "https://auth.globus.org/" + chaiseConfig.newLoginGroupId;
            }).length > 0

            if (hasGroup) {
                var queryString = UriUtils.queryStringToJSON($window.location.search);
                if (queryString.referrerid && (typeof queryString.action == 'undefined') && $window.opener) {

                    // if browser is IE then clear the referrerId from cookiestore
                    // else postmessage to parent window and close itslef
                    if (UriUtils.isBrowserIE()) {
                        $cookies.remove("chaise-" + queryString.referrerid, { path: "/" });
                    } else {
                        //For child window
                        $window.opener.postMessage($window.location.search, $window.opener.location.href);
                    }
                    $window.close();
                    return;
                }
            }
        });

        UriUtils.setLocationChangeHandling();

        // No navbar or login so initaite the login process
        Session.getSession().catch(function (err) {
            throw err;
        });
    }]);
})();
