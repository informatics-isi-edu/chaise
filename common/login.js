(function () {
    'use strict';
    angular.module('chaise.login', [
        'ngCookies',
        'chaise.utils',
        'chaise.authen',
        'ui.bootstrap'
    ])
        .directive('login', ['ConfigUtils', 'logService', 'modalUtils', 'Session', 'UriUtils', '$rootScope', function (ConfigUtils, logService, modalUtils, Session, UriUtils, $rootScope) {
            var chaiseConfig = ConfigUtils.getConfigJSON();
            var dcctx = ConfigUtils.getContextJSON();
            return {
                restrict: 'E',
                scope: {},
                templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/login.html',
                link: function (scope) {
                    scope.signUpURL = chaiseConfig.signUpURL;
                    scope.profileURL = chaiseConfig.profileURL;

                    Session.subscribeOnChange(function () {
                        $rootScope.session = Session.getSessionValue();

                        if ($rootScope.session == null) {
                            scope.user = null;
                        } else {
                            var user = $rootScope.session.client;
                            scope.user = dcctx.user = user.display_name || user.full_name || user.email || user.id || user;
                        }

                    });

                    // NOTE this will call the subscribed functions.
                    // So it will catch the errors of the subscribed functions,
                    // therefore we should make sure to throw these errors in here.
                    // Emitting the catch callback will make angularjs to throw extra error
                    // called: `Possibly unhandled rejection`
                    Session.getSession().catch(function (err) {
                        throw err;
                    })

                    scope.login = function login() {
                        Session.loginInAPopUp(logService.logActions.LOGIN_NAVBAR);
                    };


                    scope.logDropdownOpen = function () {
                        logService.logClientAction({
                            action: logService.logActions.NAVBAR_ACCOUNT_DROPDOWN
                        });
                    }

                    scope.openProfile = function openProfile() {
                        logService.logClientAction({
                            action: logService.logActions.NAVBAR_PROFILE_OPEN
                        });

                        modalUtils.showModal({
                            templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/profile.modal.html",
                            controller: "profileModalDialogController",
                            controllerAs: "ctrl",
                            windowClass: "profile-popup"
                        }, false, false, false);
                    };

                    scope.logout = function logout() {
                        Session.logout();
                    };

                }
            };
        }])
})();
