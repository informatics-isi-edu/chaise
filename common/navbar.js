(function() {
    function toggleMenu($event) {
        // prevent menu from closing on click
        $event.stopPropagation();
        $event.preventDefault();

        var el = angular.element($event.target);

        // if the dropdown we are trying to open is closed
        if (!el.next().hasClass('show')) {
            // find if another dropdown menu is open in the same list, close it first
            el.parents('.dropdown-menu').first().find('.show').removeClass("show");
        }


        // open the dropdown menu
        el.next(".dropdown-menu").toggleClass("show");
        // attach handler for when the main nav dropdown closes, close each submenu dropdown as well
        el.parents('ul.nav li.open').on('hidden.bs.dropdown', function(e) {
            $('.dropdown-submenu .show').removeClass("show");
        });
    }

    'use strict';
    angular.module('chaise.navbar', [
        'chaise.login',
        'chaise.utils'
    ])
    .directive('navbar', [ '$rootScope', 'UriUtils', function($rootScope, UriUtils) {
        var chaiseConfig = Object.assign({}, $rootScope.chaiseConfig);

        // One-time transformation of chaiseConfig.navbarMenu to set the appropriate newTab setting at each node
        var root = chaiseConfig.navbarMenu || {};
        // Set default newTab property at root node
        if (!root.hasOwnProperty('newTab')) {
            root.newTab = true;
        }
        var q = [root];
        while (q.length > 0) {
            var obj = q.shift();
            var parentNewTab = obj.newTab;
            // If current node has children, set each child's newTab to its own existing newTab or parent's newTab
            if (Array.isArray(obj.children)) {
                obj.children.forEach(function (child) {
                    if (child.newTab === undefined) child.newTab = parentNewTab;
                    q.push(child);
                });
            }
        }

        return {
            restrict: 'EA',
            scope: {},
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/navbar.html',
            link: function(scope) {
                scope.brandURL = chaiseConfig.navbarBrand;
                scope.brandText = chaiseConfig.navbarBrandText;
                scope.brandImage = chaiseConfig.navbarBrandImage;
                scope.menu = chaiseConfig.navbarMenu ? chaiseConfig.navbarMenu.children : [];

                scope.templateUrl = function (url) {
                    // TODO: shouldn't have to specify catalog and it's id here
                    return ERMrest._renderHandlebarsTemplate(url, null, {id: "1"});
                }
                scope.toggleMenu = toggleMenu;
            }
        };
    }])

    .directive('navbarMenu', ['$compile', 'UriUtils', function($compile, UriUtils) {
        return {
            restrict: 'EA',
            scope: {
                menu: '='
            },
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/navbarMenu.html',
            compile: function(el) {
                var contents = el.contents().remove();
                var compiled;
                return function(scope, el) {
                    if (!compiled) {
                        compiled = $compile(contents);
                    }

                    scope.templateUrl = function (url) {
                        // TODO: shouldn't have to specify catalog and it's id here
                        return ERMrest._renderHandlebarsTemplate(url, null, {id: "1"});
                    }
                    scope.toggleSubMenu = toggleMenu;

                    compiled(scope, function(clone) {
                        el.append(clone);
                    });
                };
            }
        };
    }])
})();
