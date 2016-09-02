(function() {
    'use strict';
    angular.module('chaise.navbar', ['chaise.utils', 'chaise.authen'])
    .directive('navbar', ['$window', '$rootScope', 'Session', function($window, $rootScope, Session) {
        return {
            restrict: 'EA',
            scope: {},
            templateUrl: '../common/templates/navbar.html',
            link: function(scope) {
                scope.brandURL = chaiseConfig.navbarBrand;
                scope.brandText = chaiseConfig.headTitle;
                scope.brandImage = chaiseConfig.navbarBrandImage;
                scope.menu = navbar_menu;

                Session.getSession().then(function(session) {
                    $rootScope.session = session;

                    var user = session.client;
                    scope.user = user.display_name || user.full_name || user.email || user;
                }, function(error) {
                    // No session = no user
                    scope.user = null;
                });

                scope.login = function login() {
                    Session.login($window.location.href);
                };

                scope.logout = function logout() {
                    Session.logout();
                };

                // TODO: What's the heuristic for determining whether a menu item is "active"?
                // scope.isActiveMenuItem = function isActiveMenuItem(item) {
                //     var currentUrl = $window.location.href;
                //     if (item.children) {
                //         for (var i = 0; i < item.children.length; i++) {
                //             if (item.children.url && currentUrl.indexOf(item.children.url) > -1) {
                //                 console.log('active!');
                //                 return true;
                //             }
                //         }
                //     }
                //
                //     if (currentUrl.indexOf(item.url) > -1) {
                //         console.log('active!');
                //         return true;
                //     }
                //     return false;
                // }
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
    }]);
})();
