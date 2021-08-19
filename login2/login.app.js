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
        var vm = this;
        var chaiseConfig = ConfigUtils.getConfigJSON();

        vm.joinLink = chaiseConfig.termsAndConditionsConfig.joinUrl;
        vm.groupName = chaiseConfig.termsAndConditionsConfig.groupName;

        vm.reLogin = function () {
            // log the user back in (assuming the user joined the required globus group)
            Session.refreshLogin(logService.logActions.VERIFY_GLOBUS_GROUP_LOGIN);
        }
    }])

    .run(['AlertsService', 'ConfigUtils', 'ERMrest', 'logService', 'messageMap', '$rootScope', 'Session', 'UiUtils', 'UriUtils', '$window',
    function (AlertsService, ConfigUtils, ERMrest, logService, messageMap, $rootScope, Session, UiUtils, UriUtils, $window) {
        $rootScope.showInstructions = false;

        var session,
            errorData = {};

        var context = ConfigUtils.getContextJSON(),
            chaiseConfig = ConfigUtils.getConfigJSON();

        var subId = Session.subscribeOnChange(function () {
            Session.unsubscribeOnChange(subId);
            var session = Session.getSessionValue();

            // if the user does have the defined group, continue with auto close and reload of the application
            var hasGroup = session && session.attributes.filter(function(attr) {
                return attr.id === chaiseConfig.termsAndConditionsConfig.groupId;
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
            } else {
                // if this login process is used for verifying group membership, that group is REQUIRED to have an active login
                // log the user out if they don't have the group
                Session.logoutWithoutRedirect(logService.logActions.VERIFY_GLOBUS_GROUP_LOGOUT);
            }

            // show the instructions if the user doesn't have the required group
            $rootScope.showInstructions = !hasGroup;
        });

        UriUtils.setLocationChangeHandling();

        // No navbar or login so initaite the login process
        Session.getSession().catch(function (err) {
            throw err;
        });
    }]);
})();
