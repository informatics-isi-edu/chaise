(function() {
    function toggleMenu($event) {
        // prevent menu from closing on click
        $event.stopPropagation();
        $event.preventDefault();

        var el = $($event.target);

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

    function isCatalogDefined(val) {
        return val != undefined && val != null;
    }

    'use strict';
    angular.module('chaise.navbar', [
        'chaise.login',
        'chaise.utils'
    ])
    .directive('navbar', [ '$rootScope', '$window', 'ERMrest', 'UriUtils', function($rootScope, $window, ERMrest, UriUtils) {
        var chaiseConfig = Object.assign({}, $rootScope.chaiseConfig);

        // One-time transformation of chaiseConfig.navbarMenu to set the appropriate newTab setting at each node
        var root = chaiseConfig.navbarMenu || {};
        // get the catalog id
        // NOTE: this is put in a string
        var catalogId;
        if ($rootScope.context && $rootScope.context.catalogID) {
            catalogId = "" + $rootScope.context.catalogID;
        } else if ($window.location.hash != "") {
            catalogId = UriUtils.getCatalogIDFromLocation();
        } else if (chaiseConfig.defaultCatalog) {
            catalogId = "" + chaiseConfig.defaultCatalog;
        } else {
            catalogId = null;
        }
        // Set default newTab property at root node
        if (!root.hasOwnProperty('newTab')) {
            root.newTab = true;
        }
        var q = [root];
        while (q.length > 0) {
            var obj = q.shift();
            var parentNewTab = obj.newTab;
            // template the url
            // TODO: This is done here to prevent writing a recursive function (again) in `setConfigJSON()`
            if (obj.url && isCatalogDefined(catalogId)) obj.url = ERMrest.renderHandlebarsTemplate(obj.url, null, {id: catalogId});
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

                scope.toggleMenu = toggleMenu;
                if (isCatalogDefined(catalogId)) {
                    scope.isVersioned = function () {
                        return catalogId.split("@")[1] ? true : false;
                    }

                    scope.toLive = function () {
                        $window.location = $window.location.href.replace(catalogId, catalogId.split("@")[0])
                    }
                }
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

                    scope.toggleSubMenu = toggleMenu;

                    compiled(scope, function(clone) {
                        el.append(clone);
                    });
                };
            }
        };
    }])
})();
