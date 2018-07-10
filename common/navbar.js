(function() {
    'use strict';
    angular.module('chaise.navbar', [
        'ngCookies',
        'chaise.utils',
        'chaise.authen',
        'ui.bootstrap'
    ])
    .directive('navbar', ['$window', '$rootScope', 'Session', 'modalUtils', function($window, $rootScope, Session, modalUtils) {

    // One-time transformation of chaiseConfig.navbarMenu to set the appropriate newTab setting at each node
        var root = chaiseConfig.navbarMenu = chaiseConfig.navbarMenu || {};
        if (root) {
            // Set default newTab property at root node
            if (!root.hasOwnProperty('newTab')) {
                root.newTab = true;
            }

            var q = [root];

            while (q.length > 0) {
                var obj = q.shift();
                var parentNewTab = obj.newTab;
                // If current node is a leaf, do nothing
                if (obj.url) {
                    continue;
                }
                // If current node has children, set each child's newTab to its own existing newTab or parent's newTab
                for (var key in obj) {
                    if (key == 'children') {
                        obj[key].forEach(function(child) {
                            q.push(child);
                            if (child.newTab === undefined) {
                                child.newTab = parentNewTab;
                            }
                        });
                    }
                }
            }
        }

        return {
            restrict: 'EA',
            scope: {},
            templateUrl: '../common/templates/navbar.html',
            link: function(scope) {
                scope.brandURL = chaiseConfig.navbarBrand;
                scope.brandText = chaiseConfig.navbarBrandText || chaiseConfig.headTitle;
                scope.brandImage = chaiseConfig.navbarBrandImage;
                scope.menu = chaiseConfig.navbarMenu.children || [];
                scope.signUpURL = chaiseConfig.signUpURL;
                scope.profileURL = chaiseConfig.profileURL;

                Session.subscribeOnChange(function() {
                    $rootScope.session = Session.getSessionValue();

                    if ($rootScope.session == null) {
                        scope.user = null;
                    } else {
                        var user = $rootScope.session.client;
                        scope.user = user.display_name || user.full_name || user.email || user;
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
                    Session.loginInAPopUp();
                };

                scope.logout = function logout() {
                    Session.logout();
                };

                scope.openProfile = function openProfile() {
                    modalUtils.showModal({
                        templateUrl: "../common/templates/profile.modal.html",
                        controller: "profileModalDialogController",
                        controllerAs: "ctrl"
                    }, false, false, false);
                };

            }
        };
    }])

    .directive('navbarMenu', ['$compile', function($compile) {
        return {
            restrict: 'EA',
            scope: {
                menu: '='
            },
            templateUrl: '../common/templates/navbarMenu.html',
            compile: function(el) {
                var contents = el.contents().remove();
                var compiled;
                return function(scope, el) {
                    if (!compiled) {
                        compiled = $compile(contents);
                    }
                    compiled(scope, function(clone) {
                        el.append(clone);
                    });
                };
            }
        };
    }])
})();
