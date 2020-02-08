(function() {
    var _path;
    function getNextSibling(elem, selector) {
      var sibling = elem.nextElementSibling;
      if (!selector) return sibling;
      while (sibling) {
        if (sibling.matches(selector)) return sibling;
        sibling = sibling.nextElementSibling
      }
    };

    function onToggle(open, menuText) {
      var elems = document.querySelectorAll(".dropdown-menu.show");
      [].forEach.call(elems, function(el) {
        el.classList.remove("show");
      });
    }

    /**
     * It will toggle the dropdown that this event is based on. If we're going to open it,
     * it will close all the other dropdowns and also will return `true`.
     * @return{boolean} if true, it means that we opened the menu
     */
    function toggleMenu($event) {
      $event.stopPropagation();
      $event.preventDefault();

      var menuTarget = getNextSibling($event.target,".dropdown-menu");

      var open = !menuTarget.classList.contains("show");

      // if we're opening this, close all the other dropdowns on navbar.
      if (open) {
        $event.target.closest(".dropdown-menu").querySelectorAll('.show').forEach(function(el) {
          el.classList.remove("show");
        });
      }

      // toggle the class
      menuTarget.classList.toggle("show");

      return open;
    }

    function isCatalogDefined(val) {
        return val != undefined && val != null;
    }

    function addLogParams(url, contextHeaderParams) {
        // if `?` already in the url, use &
        var paramChar = url.lastIndexOf("?") !== -1 ? "&" : "?";

        var pcid = "navbar";
        // if not navbar app, append appname
        if (contextHeaderParams.cid !== "navbar") {
            pcid += "/" + contextHeaderParams.cid;
        }
        // ppid should be the pid for the current page
        return url + paramChar + "pcid=" + pcid + "&ppid=" + contextHeaderParams.pid;
    }

    function path() {
        if (!_path) {
            var path = "/chaise/";
            if (chaiseConfig && typeof chaiseConfig.chaiseBasePath === "string") {
                var path = chaiseConfig.chaiseBasePath;
                // append "/" if not present
                if (path[path.length-1] !== "/") path += "/";
            }

            _path = window.location.host + path;
        }

        return _path;
    }

    function isChaise(link) {
        var appNames = ["record", "recordset", "recordedit", "search", "login"];

        // parses the url into a location object
        var eleUrl = document.createElement('a');
        eleUrl.href = link;

        for (var i=0; i<appNames.length; i++) {
            var name = appNames[i];
            // path/appName exists in our url
            if (eleUrl.href.indexOf(path() + name) !== -1) return true;
        }

        return false;
    }

    function canShow (item, session) {
        if (item.acls.show.indexOf("*") > -1) return true; // if "*" acl, show the option
        if (!session) return false; // no "*" exists and no session, hide the option

        for (var i=0; i < item.acls.show.length; i++) {
            var attribute = item.acls.show[i];

            var match = session.attributes.some(function (attr) {
                return attr.id === attribute;
            });

            if (match) return true;
        };

        return false;
    }

    function canEnable (item, session) {
        if (item.acls.enable.indexOf("*") > -1) return true; // if "*" acl, enable the option
        if (!session) return false; // no "*" exists and no session, disable the option

        for (var i=0; i < item.acls.enable.length; i++) {
            var attribute = item.acls.enable[i];

            var match = session.attributes.some(function (attr) {
                return attr.id === attribute;
            });

            if (match) return true;
        };

        return false;
    }

    /**
     * Just to make sure browsers are not ignoring the ng-click, we are first
     * preventing the default behavior of link, then logging the client action
     * and then changing the location without waiting for the request,
     * This will ensure that we're at least sending the log to server.
     */
    function logStaticLink(logService, UriUtils, $window) {
        return function ($event, menuObject) {
            $event.preventDefault();
            $event.stopPropagation();

            // NOTE: if link goes to a chaise app, no logging necessary
            if (isChaise(menuObject.url)) return;

            // check if external or internal resource page
            var action = UriUtils.isSameOrigin(menuObject.url) ? logService.logActions.NAVBAR_MENU_INTERNAL : logService.logActions.NAVBAR_MENU_EXTERNAL;
            logService.logClientAction({
                action: logService.getActionString("", action, true),
                names: menuObject.names
            });

            if (menuObject.newTab) {
                $window.open(menuObject.url, '_blank');
            } else {
                $window.location = menuObject.url;
            }
        };
    }

    'use strict';
    angular.module('chaise.navbar', [
        'chaise.login',
        'chaise.utils'
    ])
    .directive('navbar', ['ConfigUtils', 'ERMrest', 'logService', 'Session', 'UriUtils', '$rootScope', '$window', function(ConfigUtils, ERMrest, logService, Session, UriUtils, $rootScope, $window) {
        var chaiseConfig = ConfigUtils.getConfigJSON();

        // One-time transformation of chaiseConfig.navbarMenu to set the appropriate newTab setting at each node
        // used to set ACL inheritance as well for each node
        var root = chaiseConfig.navbarMenu || {};
        var catalogId = UriUtils.getCatalogId();
        // Set default newTab property at root node
        if (!root.hasOwnProperty('newTab')) {
            root.newTab = true;
        }

        // Set default ACLs property at root node
        if (!root.hasOwnProperty('acls')) {
            root.acls = {
                "show": ["*"],
                "enable": ["*"]
            };
        }

        var q = [root];
        while (q.length > 0) {
            var obj = q.shift();
            var parentNewTab = obj.newTab;
            var parentAcls = obj.acls;
            var parentNames = obj.names;
            // template the url
            // TODO: This is done here to prevent writing a recursive function (again) in `setConfigJSON()`
            if (obj.url && isCatalogDefined(catalogId)) {
                obj.url = ERMrest.renderHandlebarsTemplate(obj.url, null, {id: catalogId});

                // only append pcid/ppid if link is to a chaise url
                if (isChaise(obj.url)) {
                    obj.url = addLogParams(obj.url, ConfigUtils.getContextHeaderParams());
                }
            }
            // If current node has children, set each child's newTab to its own existing newTab or parent's newTab
            // used to set ACLs for each child as well
            if (Array.isArray(obj.children)) {
                obj.children.forEach(function (child) {
                    // get newTab from the parent
                    if (child.newTab === undefined) child.newTab = parentNewTab;

                    // get acls settings from the parent
                    if (child.acls === undefined) {
                        child.acls = parentAcls;
                    } else {
                        // acls could be defined with nothing in it, or with only show or only enable
                        if (child.acls.show === undefined) child.acls.show = parentAcls.show;
                        if (child.acls.enable === undefined) child.acls.enable = parentAcls.enable;
                    }

                    // create the names array that will be used for logging
                    if (!Array.isArray(parentNames)) {
                        if (!(name in obj)) {
                            parentNames = [];
                        } else {
                            parentNames = obj.name;
                        }
                    }
                    child.names = parentNames.concat(child.name);

                    q.push(child);
                });
            }
        }

        return {
            restrict: 'EA',
            scope: {},
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/navbar.html',
            link: function(scope) {
                // Subscribe to on change event for session
                // navbar doesn't need to have functionality until the session returns, just like app.js blocks
                var subFunctionId = Session.subscribeOnChange(function() {

                    // Unsubscribe onchange event to avoid this function getting called again
                    Session.unsubscribeOnChange(subFunctionId);

                    var chaiseConfig = ConfigUtils.getConfigJSON();
                    var dcctx = ConfigUtils.getContextJSON();

                    scope.hideNavbar = dcctx.hideNavbar;
                    scope.brandURL = chaiseConfig.navbarBrand;
                    scope.brandText = chaiseConfig.navbarBrandText;
                    scope.brandImage = chaiseConfig.navbarBrandImage;
                    scope.menu = chaiseConfig.navbarMenu ? chaiseConfig.navbarMenu.children : [];

                    scope.onToggle = function (open, menuObject) {
                        if (open) {
                            logService.logClientAction({
                                action: logService.getActionString("", logService.logActions.NAVBAR_MENU_OPEN, true),
                                names: menuObject.names
                            });
                        }
                        onToggle(open);
                    }

                    scope.canShow = function (item) {
                        return canShow(item, Session.getSessionValue());
                    }

                    scope.canEnable = function (item) {
                        return canEnable(item, Session.getSessionValue());
                    }

                    scope.logBranding = function ($event, link) {
                        // prevent the default link behavior, so we log the action first
                        $event.preventDefault();
                        $event.stopPropagation();

                        logService.logClientAction({
                            action: logService.getActionString("", logService.logActions.NAVBAR_BRANDING, true)
                        });

                        // change the window location (do the default link behavior)
                        $window.location = link;
                    }

                    // scope.logMenuToggle = logMenuToggle(logService);

                    scope.logStaticLink = logStaticLink(logService, UriUtils, $window);

                    if (isCatalogDefined(catalogId)) {
                        scope.isVersioned = function () {
                            return catalogId.split("@")[1] ? true : false;
                        }

                        scope.toLive = function () {
                            $window.location = addLogParams($window.location.href.replace(catalogId, catalogId.split("@")[0]), ConfigUtils.getContextHeaderParams());
                        }
                    }
                });
            }
        };
    }])

    .directive('navbarMenu', ['$compile', 'ConfigUtils', 'logService', 'Session', 'UriUtils', '$window', function($compile, ConfigUtils, logService, Session, UriUtils, $window) {
        return {
            restrict: 'EA',
            scope: {
                menu: '='
            },
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/navbarMenu.html',
            compile: function(el) {
                // don't need to wait for session because this directive will only ever be a child of the above directive, `navbar`
                var contents = el.contents().remove();
                var compiled;
                var dcctx = ConfigUtils.getContextJSON();

                return function(scope, el) {
                    if (!compiled) {
                        compiled = $compile(contents);
                    }

                    scope.canShow = function (item) {
                        return canShow(item, Session.getSessionValue());
                    }

                    scope.canEnable = function (item) {
                        return canEnable(item, Session.getSessionValue());
                    }

                    scope.toggleSubMenu = function (event, menuObject) {
                        // toggle the menu
                        if (toggleMenu(event)) {
                            // if we opened the menu, log it.
                            logService.logClientAction({
                                action: logService.getActionString("", logService.logActions.NAVBAR_MENU_OPEN, true),
                                names: menuObject.names
                            });
                        }
                    };

                    scope.logStaticLink = logStaticLink(logService, UriUtils, $window);

                    compiled(scope, function(clone) {
                        el.append(clone);
                    });
                };
            }
        };
    }])
})();
