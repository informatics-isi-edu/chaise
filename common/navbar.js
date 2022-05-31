(function() {

    'use strict';
    angular.module('chaise.navbar', [
        'chaise.login',
        'chaise.utils'
    ])

    .directive('navbar', ['ConfigUtils', 'DataUtils', 'ERMrest', 'Errors', 'ErrorService', 'logService', 'MenuUtils', 'Session', 'UriUtils', '$rootScope', '$sce', '$timeout', '$window', function(ConfigUtils, DataUtils, ERMrest, Errors, ErrorService, logService, MenuUtils, Session, UriUtils, $rootScope, $sce, $timeout, $window) {
        var chaiseConfig = ConfigUtils.getConfigJSON();
        var settings = ConfigUtils.getSettings();
        return {
            restrict: 'EA',
            scope: {},
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/navbar.html',
            link: function(scope) {
                scope.hideNavbar = settings.hideNavbar;
                // Subscribe to on change event for session
                // navbar doesn't need to have functionality until the session returns, just like app.js blocks
                var subFunctionId = Session.subscribeOnChange(function() {
                    // signal the ancestors that navbar is now displayed
                    $rootScope.$emit("navbar-done");

                    // Unsubscribe onchange event to avoid this function getting called again
                    Session.unsubscribeOnChange(subFunctionId);

                    // set before processing the navbar menu
                    scope.brandURL = chaiseConfig.navbarBrand;
                    scope.brandText = chaiseConfig.navbarBrandText;
                    scope.brandImage = chaiseConfig.navbarBrandImage;

                    // One-time transformation of chaiseConfig.navbarMenu to set the appropriate newTab setting at each node
                    // used to set ACL inheritance as well for each node
                    var root = chaiseConfig.navbarMenu || {};
                    var catalogId = UriUtils.getCatalogId();

                    function isValueDefined(val) {
                        return val != undefined && val != null;
                    }

                    // if in iframe and we want to force links to open in new tab,
                    var forceNewTab = settings.openLinksInTab === true;

                    // Set default newTab property at root node
                    if (!root.hasOwnProperty('newTab') || forceNewTab) {
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
                        if (obj.url && isValueDefined(catalogId)) {
                            obj.url = ERMrest.renderHandlebarsTemplate(obj.url, null, {id: catalogId});

                            // only append pcid/ppid if link is to a chaise url
                            if (MenuUtils.isChaise(obj.url, ConfigUtils.getContextJSON())) {
                                obj.url = MenuUtils.addLogParams(obj.url, ConfigUtils.getContextHeaderParams());
                            }
                        }
                        // If current node has children, set each child's newTab to its own existing newTab or parent's newTab
                        // used to set ACLs for each child as well
                        if (Array.isArray(obj.children)) {
                            obj.children.forEach(function (child) {
                                // get newTab from the parent
                                if (child.newTab === undefined) child.newTab = parentNewTab;

                                // if we have to open in newtab
                                if (forceNewTab) child.newTab = true;

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

                    // relies on navbarMenu processing to finish, setting this updates the DOM
                    scope.menu = chaiseConfig.navbarMenu ? chaiseConfig.navbarMenu.children : [];


                    // banner support
                    scope.topBanners = [];
                    scope.bottomBanners = [];
                    // navbarBanner can be an object or array
                    var bannerConfig = Array.isArray(chaiseConfig.navbarBanner) ? chaiseConfig.navbarBanner : [chaiseConfig.navbarBanner];

                    bannerConfig.forEach(function (conf) {
                        if (!DataUtils.isObjectAndNotNull(conf)) return;
                        if (!DataUtils.isNoneEmptyString(conf.markdownPattern)) return;

                        var html = ERMrest.renderHandlebarsTemplate(conf.markdownPattern, null, {id: catalogId});
                        html = ERMrest.renderMarkdown(html, false);

                        if (!DataUtils.isNoneEmptyString(html)) {
                            // invalid html, so we shounldn't add it.
                            return;
                        }

                        // if acls.show is defined, process it
                        if (DataUtils.isObjectAndNotNull(conf.acls) && Array.isArray(conf.acls.show)) {
                            if (!Session.isGroupIncluded(conf.acls.show)) {
                                // don't add the banner because of acls
                                return;
                            }
                        }

                        var banner = {
                            html: html,
                            dismissible: (conf.dismissible === true),
                            key: DataUtils.isNoneEmptyString(conf.key) ? conf.key : ""
                        };

                        // add the banner to top or bottom based on given position
                        if ((conf.position !== "bottom")) {
                            scope.topBanners.push(banner);
                        } else {
                            scope.bottomBanners.push(banner);
                        }
                    });

                    scope.hideBanner = function (index, isTop) {
                        if (isTop) {
                            scope.topBanners[index].hide = true;
                        } else {
                            scope.bottomBanners[index].hide = true;
                        }
                    };

                    scope.onToggle = function (open, menuObject) {
                        if (open) {
                            // when menu opens, calculate height needed
                            logService.logClientAction({
                                action: logService.getActionString(logService.logActions.NAVBAR_MENU_OPEN, "", ""),
                                names: menuObject.names
                            });
                        }

                        MenuUtils.onToggle(open);
                    }

                    // prefer to use markdownName over name
                    scope.renderName = function (item) {
                        return MenuUtils.renderName(item);
                    }

                    // remove the height when the dropdown is toggled
                    // NOTE: $event can't be passed to function attached to on-toggle listener
                    // use this function on a click event
                    scope.resetHeight = function ($event) {
                        MenuUtils.resetHeight($event);
                    }

                    scope.canShow = function (item) {
                        return MenuUtils.canShow(item);
                    }

                    scope.canEnable = function (item) {
                        return MenuUtils.canEnable(item);
                    }

                    scope.logBranding = function ($event, link) {
                        $event.stopPropagation();

                        logService.logClientAction({
                            action: logService.getActionString(logService.logActions.NAVBAR_BRANDING, "", "")
                        });
                    }

                    scope.onLinkClick = MenuUtils.onLinkClick();

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
                        scope.showRidSpinner = true;
                        var resolverId = chaiseConfig.resolverImplicitCatalog,
                            url = "/id/", catId, splitId;

                        if (isValueDefined(catalogId)) {
                            splitId = UriUtils.splitVersionFromCatalog(catalogId);

                            // use `/id/catalog/ridSearchTerm` format if:
                            //   - resolver id is NaN and !null
                            //   - resolver id is a different catalog id than current page
                            if (isNaN(resolverId) || resolverId != catalogId) {
                                url += splitId.catalog + "/"
                            }
                        }

                        url += scope.ridSearchTerm;
                        // implicitly does the isValueDefined(catalogId) check with how function returns true/false
                        if (scope.isVersioned()) url += "@" + splitId.version;

                        var logObj = ConfigUtils.getContextHeaderParams(), headers = {};

                        logObj.action = logService.getActionString(logService.logActions.NAVBAR_RID_SEARCH, "", "");
                        logObj.rid = scope.ridSearchTerm;

                        headers[ERMrest.contextHeaderName] = logObj;

                        // try to fetch the resolver link to see if the path resolves before sending the user
                        ConfigUtils.getHTTPService().get(url, {headers: headers}).then(function (response) {
                            scope.showRidSpinner = false;
                            $window.open(url, '_blank');
                        }).catch(function (err) {
                            scope.showRidSpinner = false;
                            if (err.status == 404) {
                                err = new Errors.NoRecordRidError();
                            }
                            throw err;
                        });

                    }

                    if (isValueDefined(catalogId)) {
                        scope.isVersioned = function () {
                            return catalogId.split("@")[1] ? true : false;
                        }

                        scope.toLive = function () {
                            $window.location = MenuUtils.addLogParams($window.location.href.replace(catalogId, catalogId.split("@")[0]), ConfigUtils.getContextHeaderParams());
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
                                MenuUtils.checkHeight(el, $window.innerHeight);
                            });
                        }, 0)
                    });
                });
            }
        };
    }])

    .directive('navbarMenu', ['$compile', 'ConfigUtils', 'logService', 'MenuUtils', 'Session', 'UriUtils', '$sce', '$window', function($compile, ConfigUtils, logService, MenuUtils, Session, UriUtils, $sce, $window) {
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

                    // prefer to use markdownName over name
                    scope.renderName = function (item) {
                        return MenuUtils.renderName(item);
                    }

                    scope.canShow = function (item) {
                        return MenuUtils.canShow(item);
                    }

                    scope.canEnable = function (item) {
                        return MenuUtils.canEnable(item);
                    }

                    scope.toggleSubMenu = function (event, menuObject) {
                        // toggle the menu
                        if (MenuUtils.toggleMenu(event)) {
                            // if we opened the menu, log it.
                            logService.logClientAction({
                                action: logService.getActionString(logService.logActions.NAVBAR_MENU_OPEN, "", ""),
                                names: menuObject.names
                            });
                        }
                    };

                    scope.onLinkClick = MenuUtils.onLinkClick();

                    compiled(scope, function(clone) {
                        el.append(clone);
                    });
                };
            }
        };
    }])
})();
