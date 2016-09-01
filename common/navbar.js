/**
* @desc
* The navbar directive can be used as an element tag (<navbar></navbar>)
* or an attribute (<div navbar></div>). It accepts the following attributes:
* @param {String} brand-image [#] - A URL to an image (e.g. consortium logo).
* If unspecified, navbarBrandImage in chaise-config.js will be displayed otherwise no image is displayed.
* @param {String} brand-text ["Chaise"] - A string of text (e.g. consortium name).
* If unspecified, headTitle in chaise-config.js will be used. Default text is 'Chaise'.
* @param {String} brand-url ["/"] - A URL to homepage (e.g. '/').
* If unspecified, navbarBrand in chaise-config.js will be used. Default url is '/'. 
* @example <navbar brand-image="/path/to/img.png" brand-text="FaceBase" brand-url='/home/'></navbar>
*/

(function() {
    'use strict';
    angular.module('chaise.navbar', ['chaise.utils', 'chaise.authen'])
    .directive('navbar', ['$window', '$rootScope', 'Session', function($window, $rootScope, Session) {
        return {
            restrict: 'EA',
            scope: {
                brandImage: '@',
                brandText: '@',
                brandURL: "@"
            },
            templateUrl: '../common/templates/navbar.html',
            link: function(scope) {
                scope.brandURL = chaiseConfig.navbarBrand;
                scope.brandText = chaiseConfig.headTitle;
                scope.brandImage = chaiseConfig.navbarBrandImage;

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
    }]);
})();
