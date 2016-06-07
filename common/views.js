(function() {
    'use strict';

    angular.module('chaise.views', ['chaise.utils'])
    .directive('navbar', function() {
        var controller = ['$window', function ($window) {
            var vm = this;
            vm.login = login;
            vm.logout = logout;
            console.log('DIRECTIVE:', vm.server);

            function getUser() {
                vm.server.session.get().then(function() {
                    var user = vm.server.getUser();
                    vm.user = user.display_name || user.full_name || user.email || user;
                }, function(error) {
                    // No session = no user
                    vm.user = null;
                });
            }

            getUser();

            function login() {
                vm.server.session.login($window.location.href);
            }

            function logout() {
                vm.server.session.logout($window.location);
            }
        }];

        return {
            restrict: 'EA',
            scope: true,
            controller: controller,
            controllerAs: 'vm',
            bindToController: {
                server: '=',
                brandImage: '@',
                brandText: '@'
            },
            templateUrl: '../common/templates/navbar.html'
        };
    });
})();
