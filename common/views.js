(function() {
    'use strict';

    angular.module('chaise.views', ['chaise.errors', 'chaise.utils'])
    .directive('navbar', function() {
        var controller = ['ermrestServerFactory', 'context', '$window', 'UriUtils', function (ermrestServerFactory, context, $window, UriUtils) {
            var vm = this;
            var server = ermrestServerFactory.getServer(context.serviceURL);
            vm.login = login;
            vm.logout = logout;
            vm.user = null;
            vm.navbarBrandImage = chaiseConfig['navbarBrandImage'] ? chaiseConfig.navbarBrandImage : '';
            vm.navbarBrandText = chaiseConfig['navbarBrandText'] ? chaiseConfig.navbarBrandText : 'Chaise';

            function getUser() {
                server.session.get().then(function() {
                    var user = server.getUser();
                    vm.user = user.display_name;
                }, function(error) {
                    // not logged in, redirect to login
                    if (error instanceof Errors.NotFoundError) {
                        var url = context.serviceURL + '/authn/preauth?referrer=' + UriUtils.fixedEncodeURIComponent(window.location.href);
                        // TODO: Switch this ajax call to $http.get when Jennifer has completed conversion in ermrestjs
                        ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successLogin, errorLogin, null);
                    }
                });
            }

            getUser();

            function login() {
                server.session.login($window.location.href);
            }

            function logout() {
                server.session.logout($window.location);
            }
        }];

        return {
            restrict: 'EA',
            // TODO: Do you really need 2-way in everything?
            // https://blog.umur.io/2013/07/02/angularjs-directives-using-isolated-scope-with-attributes/
            scope: {
                // login: '=',
                // logout: '=',
                // user: '=',
                // navbarBrandImage: '=',
                // navbarBrandText: '='
            },
            controller: controller,
            controllerAs: 'vm',
            bindToController: true,
            templateUrl: '../common/templates/navbar.html'
        };
    });
})();
