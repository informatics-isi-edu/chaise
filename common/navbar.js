(function() {
    'use strict';
    angular.module('chaise.navbar', [
        'ngCookies',
        'chaise.utils',
        'chaise.authen',
        'ui.bootstrap'
    ])
    .directive('navbar', ['$window', '$rootScope', 'Session', function($window, $rootScope, Session) {

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
