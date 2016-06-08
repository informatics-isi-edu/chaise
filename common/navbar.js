(function() {
    'use strict';

    angular.module('chaise.navbar', ['chaise.utils'])

    /**
    * @desc
    * The navbar directive can be used as an element tag (<navbar></navbar>)
    * or an attribute (<div navbar></div>). It accepts the following attributes:
    * @param {ERMrest.Server} server - A server instance returned from the
    * ermrestjs API (required)
    * @param {String} brand-image [#] - A URL to an image (e.g. consortium logo).
    * If unspecified, no image is displayed
    * @param {String} brand-text ["Chaise"] - A string of text (e.g. consortium name).
    * Default text is 'Chaise'.
    * @example <navbar server="controller.server" brand-image="/path/to/img.png" brand-text="FaceBase"></navbar>
    */
    .directive('navbar', ['$window', function($window) {
        return {
            restrict: 'EA',
            scope: {
                server: '=',
                brandImage: '@',
                brandText: '@'
            },
            templateUrl: '../common/templates/navbar.html',
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
            }
        };
    }]);
})();
