(function() {
    function hasClass(ele, className) {
      var className = " " + className + " ";
      if ((" " + ele.className + " ").replace(/[\n\t]/g, " ").indexOf(className) > -1) {
        return true;
      }
      return false;
    }

    function getNextSibling(elem, selector) {
      var sibling = elem.nextElementSibling;
      if (!selector) return sibling;
      while (sibling) {
        if (sibling.matches(selector)) return sibling;
        sibling = sibling.nextElementSibling
      }
    };

    function onToggle(open) {
      var elems = document.querySelectorAll(".dropdown-menu.show");
      [].forEach.call(elems, function(el) {
        el.classList.remove("show");
      });
    }

    function toggleMenu($event) {
      $event.stopPropagation();
      $event.preventDefault();
      if (!hasClass(getNextSibling($event.target,".dropdown-menu"),"show")) {
        $event.target.closest(".dropdown-menu").querySelectorAll('.show').forEach(function(el) {
          el.classList.remove("show");
        });
      }
      getNextSibling($event.target,".dropdown-menu").classList.toggle("show");
    }

    function isCatalogDefined(val) {
        return val != undefined && val != null;
    }

    'use strict';
    angular.module('chaise.navbar', [
        'chaise.login',
        'chaise.utils'
    ])
    .directive('navbar', ['ConfigUtils', 'ERMrest', 'UriUtils', '$rootScope', '$window', function(ConfigUtils, ERMrest, UriUtils, $rootScope, $window) {
        var chaiseConfig = ConfigUtils.getConfigJSON();

        // One-time transformation of chaiseConfig.navbarMenu to set the appropriate newTab setting at each node
        var root = chaiseConfig.navbarMenu || {};
        var catalogId = UriUtils.getCatalogId();
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
            if (obj.url && isCatalogDefined(catalogId)) {
                obj.url = ERMrest.renderHandlebarsTemplate(obj.url, null, {id: catalogId});
                // only append pcid/ppid if link is to the same origin
                // same origin urls will be relative, check for http instead(?)
                // if http, make sure not same origin
                if (obj.url.indexOf("http") == -1 || obj.url.indexOf($window.location.origin) != -1) {
                    var paramChar = "";
                    if (obj.url.lastIndexOf("?") !== -1) {
                        // already a `?` in the url
                        paramChar += '&';
                    } else {
                        paramChar += '?';
                    }
                    // pcid should always be navbar
                    // ppid should be the pid for the current page
                    obj.url += paramChar + "pcid=navbar&ppid=" + $window.dcctx.pid;
                }
            }
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
                var chaiseConfig = ConfigUtils.getConfigJSON();
                var dcctx = ConfigUtils.getContextJSON();

                scope.hideNavbar = dcctx.hideNavbar;
                scope.brandURL = chaiseConfig.navbarBrand;
                scope.brandText = chaiseConfig.navbarBrandText;
                scope.brandImage = chaiseConfig.navbarBrandImage;
                scope.menu = chaiseConfig.navbarMenu ? chaiseConfig.navbarMenu.children : [];

                scope.toggleMenu = toggleMenu;
                scope.onToggle = onToggle;
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
