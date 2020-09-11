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

    // triggered when top level menu is opened/closed
    function onToggle(open) {
        var elems = document.querySelectorAll(".dropdown-menu.show");
        [].forEach.call(elems, function(el) {
            el.classList.remove("show");
        });

        var highlightedParents = document.querySelectorAll(".dropdown-submenu.child-opened");
        [].forEach.call(highlightedParents, function(el) {
            el.classList.remove("child-opened");
        });
    }

    // ele - dropdown ul element
    function checkHeight(ele, winHeight) {
        // no dropdown is open
        if (!ele) return;

        var dropdownHeight = ele.offsetHeight;
        var fromTop = ele.offsetTop;
        var footerBuffer = 50;

        if ((dropdownHeight + fromTop) > winHeight) {
            var newHeight = winHeight - fromTop - footerBuffer;
            ele.style.height = newHeight + "px";
        }
    }

    /* Function to calculate the left of the toggleSubMenu*/
    function getOffsetValue(element){
       var offsetLeft = 0
       while(element) {
          offsetLeft += element.offsetLeft;
          element = element.offsetParent;
       }
       return offsetLeft;
    }

    /**
     * It will toggle the dropdown submenu that this event is based on. If we're going to open it,
     * it will close all the other dropdowns and also will return `true`.
     * @return{boolean} if true, it means that we opened the menu
     */
    function toggleMenu($event) {
      $event.stopPropagation();
      $event.preventDefault();

      var menuTarget = getNextSibling($event.target,".dropdown-menu");
      var immediateParent = $event.target.offsetParent;
      var parent = immediateParent.offsetParent;
      var posValues = getOffsetValue(immediateParent);

      if (parent.scrollTop == 0){
          menuTarget.style.top = parseInt(immediateParent.offsetTop + parent.offsetTop) + 10 + 'px';
      } else if (parent.scrollTop > 0) {
          menuTarget.style.top = parseInt((immediateParent.offsetTop + parent.offsetTop) - parent.scrollTop) + 10 + 'px';
      }

      menuTarget.style.left = parseInt(posValues + immediateParent.offsetWidth) + 5 + 'px';

      var open = !menuTarget.classList.contains("show");

      // if we're opening this, close all the other dropdowns on navbar.
      if (open) {
        $event.target.closest(".dropdown-menu").querySelectorAll('.show').forEach(function(el) {
          el.parentElement.classList.remove("child-opened");
          el.classList.remove("show");
        });
      }

      // toggle the class
      menuTarget.classList.toggle("show");
      immediateParent.classList.toggle("child-opened");

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

    // TODO we might want to refactor this
    function path(dcctx) {
        if (!_path) {
            var path = "/chaise/";
            if (dcctx && typeof chaiseBuildVariables === "object" && typeof chaiseBuildVariables.chaiseBasePath === "string") {
                var path = chaiseBuildVariables.chaiseBasePath;
                // append "/" if not present
                if (path[path.length-1] !== "/") path += "/";
            }

            _path = window.location.host + path;
        }

        return _path;
    }

    // TODO we might want to refactor this
    function isChaise(link, dcctx) {
        var appNames = ["record", "recordset", "recordedit", "login"];

        // parses the url into a location object
        var eleUrl = document.createElement('a');
        eleUrl.href = link;

        for (var i=0; i<appNames.length; i++) {
            var name = appNames[i];
            // path/appName exists in our url
            if (eleUrl.href.indexOf(path(dcctx) + name) !== -1) return true;
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
    function onLinkClick(ConfigUtils, logService, UriUtils, $window) {
        return function ($event, menuObject) {
            $event.preventDefault();
            $event.stopPropagation();

            // NOTE: if link goes to a chaise app, client logging is not necessary (we're using ppid, pcid instead)
            if (!isChaise(menuObject.url, ConfigUtils.getContextJSON())) {
                // check if external or internal resource page
                var action = UriUtils.isSameOrigin(menuObject.url) ? logService.logActions.NAVBAR_MENU_INTERNAL : logService.logActions.NAVBAR_MENU_EXTERNAL;
                logService.logClientAction({
                    action: logService.getActionString(action, "", ""),
                    names: menuObject.names
                });
            }

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
    .directive('navbar', ['ConfigUtils', 'ERMrest', 'logService', 'Session', 'UriUtils', '$rootScope', '$timeout', '$window', function(ConfigUtils, ERMrest, logService, Session, UriUtils, $rootScope, $timeout, $window) {
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
                if (isChaise(obj.url, ConfigUtils.getContextJSON())) {
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

                    // signal the ancestors that navbar is now displayed
                    $rootScope.$emit("navbar-done");

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
                            // when menu opens, calculate height needed
                            logService.logClientAction({
                                action: logService.getActionString(logService.logActions.NAVBAR_MENU_OPEN, "", ""),
                                names: menuObject.names
                            });
                        }

                        onToggle(open);
                        // unset height on dropdowns first
                        var openDropdowns = document.querySelectorAll(".dropdown.open ul");
                        [].forEach.call(openDropdowns, function(el) {
                            el.style.height = "unset";
                            checkHeight(el, $window.innerHeight);
                        });
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
                            action: logService.getActionString(logService.logActions.NAVBAR_BRANDING, "", "")
                        });

                        // change the window location (do the default link behavior)
                        $window.location = link;
                    }

                    scope.onLinkClick = onLinkClick(ConfigUtils, logService, UriUtils, $window);

                    scope.showRidSearch = function () {
                        return chaiseConfig.resolverImplicitCatalog !== null && chaiseConfig.hideGoToRID !== true
                    }

                    // RID search turned off in the cases of:
                    //  - resolverImplicitCatalog == null
                    //  - OR hideGoToRID == true
                    //
                    // The following cases need to be handled for the resolverImplicitCatalog value:
                    //  - if resolverImplicitCatalog === null:        turn off config
                    //  - if resolverImplicitCatalog === catalogId:   /id/RID
                    //  - otherwise:                                  /id/catalogId/RID
                    scope.ridSearch = function () {
                        var resolverId = chaiseConfig.resolverImplicitCatalog,
                            url = "/id/", catId, splitId;

                        if (isCatalogDefined(catalogId)) {
                            splitId = UriUtils.splitVersionFromCatalog(catalogId);

                            // use `/id/catalog/ridSearchTerm` format if:
                            //   - resolver id is NaN and !null
                            //   - resolver id is a different catalog id than current page
                            if (isNaN(resolverId) || resolverId != catalogId) {
                                url += splitId.catalog + "/"
                            }
                        }

                        url += scope.ridSearchTerm;
                        // implicitly does the isCatalogDefined(catalogId) check with how function returns true/false
                        if (scope.isVersioned()) url += "@" + splitId.version;

                        logService.logClientAction({
                            action: logService.getActionString(logService.logActions.NAVBAR_RID_SEARCH, "", ""),
                            rid: scope.ridSearchTerm
                        });

                        $window.open(url, '_blank');
                    }

                    if (isCatalogDefined(catalogId)) {
                        scope.isVersioned = function () {
                            return catalogId.split("@")[1] ? true : false;
                        }

                        scope.toLive = function () {
                            $window.location = addLogParams($window.location.href.replace(catalogId, catalogId.split("@")[0]), ConfigUtils.getContextHeaderParams());
                        }
                    }

                    // Listen to window resize event to change the width of div form-edit
                    angular.element($window).bind('resize', function() {
                        $timeout(function () {
                            // find an open dropdown
                            // NOTE: might be multiple
                            // unset height on dropdowns first
                            var openDropdowns = document.querySelectorAll(".dropdown.open ul");
                            [].forEach.call(openDropdowns, function(el) {
                                el.style.height = "unset";
                                checkHeight(el, $window.innerHeight);
                            });
                        }, 0)
                    });
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
                                action: logService.getActionString(logService.logActions.NAVBAR_MENU_OPEN, "", ""),
                                names: menuObject.names
                            });
                        }

                        var openSubmenues = document.querySelectorAll(".dropdown-menu.show");
                        [].forEach.call(openSubmenues, function(el) {
                            el.style.height = "unset";
                            checkHeight(el, $window.innerHeight);
                        });
                    };

                    scope.onLinkClick = onLinkClick(ConfigUtils, logService, UriUtils, $window);

                    compiled(scope, function(clone) {
                        el.append(clone);
                    });
                };
            }
        };
    }])
})();
