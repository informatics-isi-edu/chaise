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
            replace: false,
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
