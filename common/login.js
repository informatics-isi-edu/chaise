(function () {
    'use strict';
    angular.module('chaise.login', [
        'ngCookies',
        'chaise.utils',
        'chaise.authen',
        'ui.bootstrap'
    ])

    // Login top level menu and functionality
    .directive('login', ['ConfigUtils', 'logService', 'MenuUtils', 'modalUtils', 'Session', 'UriUtils', '$rootScope', '$sce', function (ConfigUtils, logService, MenuUtils, modalUtils, Session, UriUtils, $rootScope, $sce) {
        var chaiseConfig = ConfigUtils.getConfigJSON();
        var settings = ConfigUtils.getSettings();
        var dcctx = ConfigUtils.getContextJSON();
        return {
            restrict: 'E',
            scope: {},
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/login.html',
            link: function (scope) {
                scope.signUpURL = chaiseConfig.signUpURL;
                scope.loggedInMenu = chaiseConfig.loggedInMenu;

                var catalogId = UriUtils.getCatalogId();

                function isValueDefined(val) {
                    return val != undefined && val != null;
                }

                Session.subscribeOnChange(function () {

                    // we don't call Session.unsubscribeOnChange() because if session changes, we should update the session information displayed
                    $rootScope.session = Session.getSessionValue();

                    if ($rootScope.session == null) {
                        scope.user = null;
                    } else {
                        var user = $rootScope.session.client;
                        scope.displayName = dcctx.user = user.full_name || user.display_name || user.email || user.id;
                        if (scope.loggedInMenu) {
                            var menuConfig = scope.loggedInMenu;
                            var newTab = menuConfig.newTab || true;
                            var acls = menuConfig.acls || {};

                            if (menuConfig.displayNameMarkdownPattern) scope.displayName = ERMrest.renderHandlebarsTemplate(menuConfig.displayNameMarkdownPattern, null, {id: catalogId});

                            if (menuConfig.menuOptions) {
                                // if in iframe and we want to force links to open in new tab,
                                var forceNewTab = settings.openLinksInTab === true;

                                // Set default newTab property at root node
                                if (!menuConfig.hasOwnProperty('newTab') || forceNewTab) {
                                    menuConfig.newTab = true;
                                }

                                // Set default ACLs property at root node
                                if (!menuConfig.hasOwnProperty('acls')) {
                                    menuConfig.acls = {
                                        "show": ["*"],
                                        "enable": ["*"]
                                    };
                                }
                                scope.overrideProfile = false;
                                scope.overrideLogout = false;

                                // iterate over menuOptions and check to see if profile and logout need to be replaced
                                var q = [menuConfig];
                                while (q.length > 0) {
                                    var option = q.shift();

                                    var parentNewTab = option.newTab;
                                    var parentAcls = option.acls;

                                    // template the url
                                    // NOTE: Like in navbar.js, this is done here to prevent writing a recursive function (again) in `setConfigJSON()`
                                    if (option.urlPattern && isValueDefined(catalogId)) {
                                        option.url = ERMrest.renderHandlebarsTemplate(option.urlPattern, null, {id: catalogId});

                                        // only append pcid/ppid if link is to a chaise url
                                        if (MenuUtils.isChaise(option.url, ConfigUtils.getContextJSON())) {
                                            option.url = MenuUtils.addLogParams(option.url, ConfigUtils.getContextHeaderParams());
                                        }
                                    }

                                    // If current node has children, set each child's newTab to its own existing newTab or parent's newTab
                                    // used to set ACLs for each child as well
                                    if (Array.isArray(option.menuOptions) || Array.isArray(option.children)) {
                                        var arr = option.menuOptions || option.children;
                                        arr.forEach(function (child) {
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

                                            q.push(child);
                                        });
                                    }
                                }

                                // check if configuration is valid and remove if not
                                // menuConfig.menuOptions.forEach(function (option, idx) {
                                //     if (!MenuUtils.isOptionValid(option)) {
                                //         // delete menuConfig.menuOptions[idx]
                                //         console.log("option not valid");
                                //     }
                                // });

                                console.log(menuConfig);
                            }
                        }

                        // - some users could have the same full_name for multiple globus identities
                        //   having display_name included in tooltip can help differentiate which user is logged in at a glance
                        // - display_name should always be defined
                        if (user.full_name) {
                            scope.userTooltip = user.full_name + "\n" + user.display_name;
                            scope.showUserTooltip = function () {
                                var dropdownEl = document.querySelector("login .navbar-nav.navbar-right li.dropdown.open");
                                return !dropdownEl;
                            }
                        }
                    }

                });

                // NOTE this will call the subscribed functions.
                // So it will catch the errors of the subscribed functions,
                // therefore we should make sure to throw these errors in here.
                // Emitting the catch callback will make angularjs to throw extra error
                // called: `Possibly unhandled rejection`
                Session.getSession().catch(function (err) {
                    throw err;
                });

                // top level function only, will never be called from login dropdown
                scope.login = function login() {
                    Session.loginInAPopUp(logService.logActions.LOGIN_NAVBAR);
                };

                // top level function only
                scope.logDropdownOpen = function () {
                    logService.logClientAction({
                        action: logService.logActions.NAVBAR_ACCOUNT_DROPDOWN
                    });
                }

                // functions of sub menu when menuOptions not defined
                scope.openProfile = function openProfile() {
                    MenuUtils.openProfileModal();
                };

                scope.logout = function logout() {
                    MenuUtils.logout();
                };

            }
        };
    }])

    .directive('subMenu', ['$compile', 'ConfigUtils', 'logService', 'MenuUtils', 'UriUtils', '$sce', '$window', function($compile, ConfigUtils, logService, MenuUtils, UriUtils, $sce, $window) {
        return {
            restrict: 'EA',
            scope: {
                menu: '='
            },
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/subMenu.html',
            compile: function(el) {
                // don't need to wait for session because this directive will only ever be a child of the navbar or login
                var contents = el.contents().remove();
                var compiled;
                var dcctx = ConfigUtils.getContextJSON();

                return function(scope, el) {
                    if (!compiled) {
                        compiled = $compile(contents);
                    }

                    // prefer to use markdownName over name
                    scope.renderName = function (option) {
                        return MenuUtils.renderName(option);
                    }

                    // scope.canShow = function (item) {
                    //     return canShow(item, Session);
                    // }
                    //
                    // scope.canEnable = function (item) {
                    //     return canEnable(item, Session);
                    // }

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
