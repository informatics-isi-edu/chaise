(function() {
    'use strict';

    angular.module('chaise.views', ['chaise.utils'])
    .directive('navbar', ['$window', function($window) {
        return {
            restrict: 'EA',
            scope: {
                server: '=',
                brandImage: '@',
                brandText: '@'
            },
            link: function(scope) {
                scope.server.session.get().then(function() {
                    var user = scope.server.getUser();
                    scope.user = user.display_name || user.full_name || user.email || user;
                }, function(error) {
                    // No session = no user
                    scope.user = null;
                });

                scope.login = function login() {
                    scope.server.session.login($window.location.href);
                }

                scope.logout = function logout() {
                    scope.server.session.logout($window.location);
                }
            },
            templateUrl: '../common/templates/navbar.html'
        };
    }]);
})();
