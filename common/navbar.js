/**
* @desc
* The navbar directive can be used as an element tag (<navbar></navbar>)
* or an attribute (<div navbar></div>). It accepts the following attributes:
* @param {String} brand-image [#] - A URL to an image (e.g. consortium logo).
* If unspecified, no image is displayed
* @param {String} brand-text ["Chaise"] - A string of text (e.g. consortium name).
* Default text is 'Chaise'.
* @example <navbar brand-image="/path/to/img.png" brand-text="FaceBase"></navbar>
*/

(function() {
    'use strict';
    angular.module('chaise.navbar', ['chaise.utils', 'chaise.authen'])
    .directive('navbar', ['$window', 'Session', function($window, Session) {
        return {
            restrict: 'EA',
            scope: {
                brandImage: '@',
                brandText: '@'
            },
            templateUrl: '../common/templates/navbar.html',
            link: function(scope) {
                Session.getSession().then(function(session) {
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
    }]);
})();
