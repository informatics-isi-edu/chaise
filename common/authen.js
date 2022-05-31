(function() {
    'use strict';

    angular.module('chaise.authen', ['chaise.utils', 'chaise.storage'])

    .factory('Session', ['ConfigUtils', 'Errors', 'messageMap', 'logService', 'modalUtils', 'StorageService', 'UriUtils', '$cookies', '$interval', '$log', '$q', '$rootScope', '$sce', '$uibModalStack', '$window',
        function (ConfigUtils, Errors, messageMap, logService, modalUtils, StorageService, UriUtils, $cookies, $interval, $log, $q, $rootScope, $sce, $uibModalStack, $window) {
        // authn API no longer communicates through ermrest, removing the need to check for ermrest location
        var serviceURL = $window.location.origin;

        var LOCAL_STORAGE_KEY = 'session';              // name of object session information is stored under
        var PROMPT_EXPIRATION_KEY = 'promptExpiration'; // name of key for prompt expiration value
        var PREVIOUS_SESSION_KEY = 'previousSession';   // name of key for previous session boolean

        var _session = null;                            // current session object
        var _prevSession = null;                        // previous session object
        var _sameSessionAsPrevious = false;

        var _changeCbs = {};

        var _counter = 0;

        var _executeListeners = function() {
            for (var k in _changeCbs) {
                _changeCbs[k]();
            }
        };

        var _decorateSession = function(session) {
            var attributes = [];
            session.attributes.forEach(function (attr) {
                // NOTE: the current assumption is that everything in session.attributes is a globus group or an identity
                // a globus group if:
                //   - display_name is defined
                //   - display_name is not the same as the user's display_name
                //   - current id is not in the identities array
                if (attr.display_name && attr.display_name !== session.client.display_name && session.client.identities.indexOf(attr.id) == -1) {
                    if (attr.id.indexOf("https://auth.globus.org/") === 0) {
                        // assume id is always "https://auth.globus.org/ff766864-a03f-11e5-b097-22000aef184d"
                        attr.webpage = "https://app.globus.org/groups/" + attr.id.substring(24) + "/about";
                        attr.type = "globus_group";
                    }

                }

                if (session.client.identities.includes(attr.id)) attr.type = "identity";
                // attributes without a type (!globus_group and !identity) are not expected and won't be given a type

                var matchIdx = null;
                // determine if 'attr' exists in $session.attributes
                matchIdx = attributes.findIndex(function (targetAttr) {
                    return targetAttr.id === attr.id;
                });

                // merge if the attribute already exists, push otherwise
                if (matchIdx !== -1) {
                    Object.assign(attributes[matchIdx], attr);
                } else {
                    attributes.push(attr);
                }
            });

            // sort the newly created atrtibutes array by display_name
            attributes.sort(function(a, b) {
                if (a.display_name && b.display_name) return a.display_name.localeCompare(b.display_name);
            });

            session.attributes = attributes;
            return session;
        }

        /**
         * Functions that interact with the StorageService tokens
         * There are 3 keys stored under the LOCAL_STORAGE_KEY object, PROMPT_EXPIRATION_KEY, PREVIOUS_SESSION_KEY
         */

        // returns data stored in loacal storage for `keyName`
        var _getKeyFromStorage = function (keyName) {
            return StorageService.getStorage(LOCAL_STORAGE_KEY)[keyName];
        }

        // create value in storage with `keyName` and `value`
        var _setKeyInStorage = function (keyName, value) {
            var data = {};

            data[keyName] = value;

            StorageService.updateStorage(LOCAL_STORAGE_KEY, data);
        }

        // removes the key/value pair at `keyName`
        var _removeKeyFromStorage = function (keyName) {
            if (_keyExistsInStorage(keyName)) {
                StorageService.deleteStorageValue(LOCAL_STORAGE_KEY, keyName);
            }
        };

        // verifies value exists for `keyName`
        var _keyExistsInStorage = function(keyName) {
            var sessionStorage = StorageService.getStorage(LOCAL_STORAGE_KEY);

            return (sessionStorage && sessionStorage[keyName]);
        };


        // creates an expiration token with `keyName`
        var _createToken = function (keyName) {
            var data = {};
            var hourFromNow = new Date();
            hourFromNow.setHours(hourFromNow.getHours() + 1);

            data[keyName] = hourFromNow.getTime();

            StorageService.updateStorage(LOCAL_STORAGE_KEY, data);
        };

        // checks if the expiration token with `keyName` has expired
        var _expiredToken = function (keyName) {
            var sessionStorage = StorageService.getStorage(LOCAL_STORAGE_KEY);

            return (sessionStorage && new Date().getTime() > sessionStorage[keyName]);
        };

        // extends the expiration token with `keyName` if it hasn't expired
        var _extendToken = function (keyName) {
            if (_keyExistsInStorage(keyName) && !_expiredToken(keyName)) {
                _createToken(keyName);
            }
        };

        // variable so the modal can be passed to another function outside of this scope to close it when appropriate
        var modalInstance = null;

        // post login callback function
        var loginWindowCb = function (params, referrerId, cb, type, rejectCb){
            if(type.indexOf('modal')!== -1){
                if (_session) {
                    params.title = messageMap.sessionExpired.title;
                } else {
                    params.title = messageMap.noSession.title;
                }
                var closed = false;

                var cleanupModal = function (message) {
                    $interval.cancel(intervalId);
                    $cookies.remove("chaise-" + referrerId, { path: "/" });
                    closed = true;
                }
                var onModalCloseSuccess = function () {
                    cleanupModal("login refreshed");
                    cb();
                }

                var onModalClose = function(response) {
                    cleanupModal("no login");
                    if (rejectCb) {
                        //  ermrestJS throws error if 'response' is not formatted as an Error
                        if (typeof response == "String") {
                            response = new Error(response);
                        }
                        rejectCb(response);
                    }
                };

                modalInstance = modalUtils.showModal({
                    windowClass: "modal-login-instruction",
                    templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/loginDialog.modal.html",
                    controller: 'LoginDialogController',
                    controllerAs: 'ctrl',
                    resolve: {
                        params: params
                    },
                    openedClass: 'modal-login',
                    backdrop: 'static',
                    keyboard: false
                }, onModalCloseSuccess, onModalClose, false);
            }


            /* if browser is IE then add explicit handler to watch for changes in localstorage for a particular
             * variable
             */
            if (UriUtils.isBrowserIE()) {
                $cookies.put("chaise-" + referrerId, true, { path: "/" });
                var intervalId;
                var watchChangeInReferrerId = function () {
                    if (!$cookies.get("chaise-" + referrerId)) {
                        $interval.cancel(intervalId);
                        if (typeof cb== 'function') {
                            if(type.indexOf('modal')!== -1){
                                intervalId = $interval(watchChangeInReferrerId, 50);
                                modalInstance.close("Done");
                                cb();
                                closed = true;
                            }
                            else{
                                cb();
                            }
                        }
                        return;
                    }
                }
            }
            else {
                window.addEventListener('message', function(args) {
                    if (args && args.data && (typeof args.data == 'string')) {
                        _setKeyInStorage(PREVIOUS_SESSION_KEY, true);
                        _removeKeyFromStorage(PROMPT_EXPIRATION_KEY);
                        var obj = UriUtils.queryStringToJSON(args.data);
                        if (obj.referrerid == referrerId && (typeof cb== 'function')) {
                            if(type.indexOf('modal')!== -1){
                                modalInstance.close("Done");
                                cb();
                                closed = true;
                            }
                            else{
                                cb();
                            }
                        }
                    }
                });
            }
        };


        var logInHelper = function(logInTypeCb, win, cb, type, rejectCb, logAction){
            var referrerId = (new Date().getTime());

            var chaiseConfig = ConfigUtils.getConfigJSON();
            var loginApp = ConfigUtils.validateTermsAndConditionsConfig(chaiseConfig.termsAndConditionsConfig) ? "login2" : "login";
            var url = serviceURL + '/authn/preauth?referrer='+UriUtils.fixedEncodeURIComponent($window.location.origin + UriUtils.chaiseDeploymentPath() + loginApp + "/?referrerid=" + referrerId);
            var config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': 'application/json'
                },
                skipHTTP401Handling: true
            };

            // TODO in the case of loginInAModal, we're not doing the actual login,
            // but we're still sending the request. Since we need to change this anyways,
            // I decided to not add any log action in that case and instead we should just
            // fix that function.
            if (logAction) {
                config.headers[ERMrest.contextHeaderName] = {
                    action: logService.getActionString(logAction, "", "")
                }
            }
            ConfigUtils.getHTTPService().get(url, config).then(function(response){
                var data = response.data;

                var login_url = "";
                if (data['redirect_url'] !== undefined) {
                    login_url = data['redirect_url'];
                } else if (data['login_form'] !== undefined) {
                    // we want to use the old login flow to login
                    // (login in the same window so when login does occur, it changes the same page instead of the page in the window that pops up)
                    win = $window;
                    // prevents the dialog from popping up shortly before the page redirects to login
                    type = "";
                    var referrer = $window.location.href;
                    var login_form = data['login_form'];
                    login_url = '../login?referrer=' + UriUtils.fixedEncodeURIComponent(referrer);
                    var method = login_form['method'];
                    var action = UriUtils.fixedEncodeURIComponent(login_form['action']);
                    var text = '';
                    var hidden = '';
                    for (var i = 0; i < login_form['input_fields'].length; i++) {
                        var field = login_form['input_fields'][i];
                        if (field.type === 'text') {
                            text = UriUtils.fixedEncodeURIComponent(field.name);
                        } else {
                            hidden = UriUtils.fixedEncodeURIComponent(field.name);
                        }
                    }
                    login_url += '&method=' + method + '&action=' + action + '&text=' + text + '&hidden=' + hidden + '&?referrerid=' + referrerId;
                }

                var params = {
                    login_url: login_url
                };
                if(win){
                        win.location=params.login_url;
                }
                logInTypeCb(params,referrerId, cb, type, rejectCb);
            }, function(error) {
                throw ERMrest.responseToError(error);
            });
        };

        /**
         * opens a window dialog for logging in
         */
        var popupLogin = function (logAction, postLoginCB) {
            if (!postLoginCB) {
                postLoginCB = function(){
                    if (!shouldReloadPageAfterLogin()) {
                        // fetches the session of the user that just logged in
                        _getSession().then(function () {
                            if (modalInstance) modalInstance.close();
                        });
                    } else {
                        window.location.reload();
                    }
                };
            }

            var x = window.innerWidth/2 - 800/2;
            var y = window.innerHeight/2 - 600/2;

            var win = window.open("", '_blank','width=800,height=600,left=' + x + ',top=' + y);

            logInHelper(loginWindowCb, win, postLoginCB, 'popUp', null, logAction);
        };

        // Checks for a session or previous session being set, if neither allow the page to reload
        // the page will reload after login when the page started with no user
        // _session can become null if getSession is called and the session has timed out or the user logged out
        var shouldReloadPageAfterLogin = function() {
            if (_session === null && _prevSession == null) return true;
            return false;
        };

        /**
         * Will return a promise that is resolved with the session.
         * It will also call the _executeListeners() functions and sets the _session.
         * If we couldn't fetch the session, it will resolve with `null`.
         *
         * @param  {string=} context undefined or "401"
         */
        var _getSession = function(context) {
            var config = {
                skipHTTP401Handling: true,
                headers: {}
            };

            config.headers[ERMrest.contextHeaderName] = {
                action: logService.getActionString(logService.logActions.SESSION_RETRIEVE, "", "")
            }

            /**
             * NOTE: the following is for future implementation when we decide to verify session against the cookie object
             * see if there's a token before doing any decision making
             *
             * if there's no webauthnCookie || no cookieFromStorage, login flow
             *
             * if there's a webauthnCookie user was logged in at some point on this machine, check to see if it matches _cookie
             *  - if NOT match page was used by someone that's not the current webauthn cookie holder, check webauthnCookie matches cookieFromStorage
             *    - if match, check cookieFromStorage.expires is not expired
             *      - if expired, login flow
             *      - if not expired, use local storage session
             *    - if NOT match, shouldn't happen unless cookie in browser is updated without chaise
             *  - if match user had a session on this page, make sure _session.expires is not expired
             *    - if not expired, TODO leasing idea
             *    - if expired, login timeout warning
             *
             * no webauthn
             * if there's a cookieFromStorage user was here before, see if it is expired
             *  - if expired
            **/

            return ConfigUtils.getHTTPService().get(serviceURL + "/authn/session", config).then(function(response) {
                if (context === "401" && shouldReloadPageAfterLogin()) {
                    window.location.reload();
                    return response.data;
                }

                // keep track of only the first session, so when a timeout occurs, we can compare the sessions
                // when a new session is fetched after timeout, check if the identities are the same
                if (_prevSession) {
                    _sameSessionAsPrevious = _prevSession.client.id == response.data.client.id;
                } else {
                    _prevSession = response.data
                }

                if (!_session) {
                    // only update _session if no session is set
                    _session = _decorateSession(response.data);
                }

                _executeListeners();
                return _session;
            }).catch(function(err) {
                $log.warn(ERMrest.responseToError(err));

                _session = null;
                _executeListeners();
                return _session;
            });
        }

        return {
            getSession: _getSession,

            /**
             * Will return a promise that is resolved with the session.
             * Meant for validating the server session and verify if it's still active or not
             */
            validateSession: function () {
                var config = {
                    skipHTTP401Handling: true,
                    headers: {}
                };
                config.headers[ERMrest.contextHeaderName] = {
                    action: logService.getActionString(logService.logActions.SESSION_VALIDATE, "", "")
                }
                return ConfigUtils.getHTTPService().get(serviceURL + "/authn/session", config).then(function(response) {
                    if (!_session) {
                        // only update _session if no session is set
                        _session = _decorateSession(response.data);
                    }
                    return _session;
                }).catch(function(err) {
                    $log.warn(ERMrest.responseToError(err));

                    _session = null;
                    return _session;
                });
            },

            // Makes a request to fetch the most recent session from the server
            // verifies if that is the same as when the page loaded before calling `cb`
            validateSessionBeforeMutation: function (cb) {
                var handleDiffUser = function () {
                    // modalInstance comes from error modal controller to close the modal after logging in, but before checking to throw an error again
                    var checkSession = function (modalInstance) {
                        modalInstance.dismiss("continue");
                        // check if login state resolved
                        _getSession().then(function (session) {
                            if (!session || !_sameSessionAsPrevious) {
                                handleDiffUser()
                            } else {
                                cb();
                            }
                        });
                    }

                    var errorCB = checkSession;

                    if (!_session) {
                        // for continuing in the modal if there is a user
                        errorCB = function (modalInstance) {
                            popupLogin(logService.logActions.SWITCH_USER_ACCOUNTS_LOGIN, function () {
                                checkSession(modalInstance);
                            });
                        }
                    }

                    throw new Errors.DifferentUserConflictError(_session, _prevSession, errorCB); // cannot dismiss
                }

                // Checks if an error needs to be thrown because the user is different and continues execution if the login state is resolved
                // a session must exist before calling this function
                var validateSessionSubmit = function () {
                    if (!_sameSessionAsPrevious) {
                        handleDiffUser();
                    } else {
                        // we have a session now and it's the same as when the app started
                        cb();
                    }
                }

                _getSession().then(function (session) {
                    if (!session) {
                        var onSuccess = function () {
                            validateSessionSubmit();
                        }

                        var onError = function (err) {
                            // NOTE: user didn't login, what's the error ?
                            // same error message as duplicate user except "anon"
                            handleDiffUser();
                        }

                        // should be modal login
                        logInHelper(loginWindowCb, "", onSuccess, 'modal', onError, logService.logActions.SWITCH_USER_ACCOUNTS_LOGIN);
                    } else {
                        validateSessionSubmit();
                    }
                });
            },

            getSessionValue: function() {
                return _session;
            },

            getPrevSessionValue: function() {
                return _prevSession;
            },

            isSameSessionAsPrevious: function() {
                return _sameSessionAsPrevious;
            },

            shouldReloadPageAfterLogin: shouldReloadPageAfterLogin,

            // if there's a previous login token AND
            // the prompt expiration token does not exist OR it has expired
            showPreviousSessionAlert: function() {
                return (_keyExistsInStorage(PREVIOUS_SESSION_KEY) && (!_keyExistsInStorage(PROMPT_EXPIRATION_KEY) || _expiredToken(PROMPT_EXPIRATION_KEY)));
            },

            subscribeOnChange: function(fn) {
                // To avoid same ids for an instance we add counter
                var id = new Date().getTime() + (++_counter);

                if (typeof fn  == 'function') {
                    _changeCbs[id] = fn;
                }
                return id;
            },

            // groupArray should be the array of globus group
            isGroupIncluded: function(groupArray) {
                // if no array, assume it wasn't defined and default hasn't been set yet
                if (!groupArray || groupArray.indexOf("*") > -1) return true; // if "*" acl, show the option
                if (!_session) return false; // no "*" exists and no session, hide the option

                for (var i=0; i < groupArray.length; i++) {
                    var attribute = groupArray[i];

                    var match = _session.attributes.some(function (attr) {
                        return attr.id === attribute;
                    });

                    if (match) return true;
                };

                return false;
            },

            unsubscribeOnChange: function(id) {
                delete _changeCbs[id];
            },

            createPromptExpirationToken: function() {
                _createToken(PROMPT_EXPIRATION_KEY);
            },

            extendPromptExpirationToken: function() {
                _extendToken(PROMPT_EXPIRATION_KEY);
            },

            loginInAPopUp: popupLogin,

            /**
             * TODO technically this function should even ask for preauthn in logInHelper
             * This function opens a modal dialog which has a link for login
             * the callback for this function has a race condition because the login link in the modal uses `loginInAPopUp`
             * that function uses the embedded `reloadCb` as the callback for the actual login window closing.
             * these 2 callbacks trigger in the order of `popupCb` first then `modalCb` where modalCb is ignored more often than not
             * @param {Function} notifyErmrestCB - runs after the login process has been complete
             */
            loginInAModal: function(notifyErmrestCB, notifyErmrestRejectCB, logAction) {
                logInHelper(loginWindowCb, "", notifyErmrestCB, 'modal', notifyErmrestRejectCB, logAction);
            },

            logout: function(action) {
                var chaiseConfig = ConfigUtils.getConfigJSON();
                var logoutURL = chaiseConfig['logoutURL'] ? chaiseConfig['logoutURL'] : '/';
                var url = serviceURL + "/authn/session";

                url += '?logout_url=' + UriUtils.fixedEncodeURIComponent(logoutURL);

                var config = {
                    skipHTTP401Handling: true,
                    headers: {}
                };
                config.headers[ERMrest.contextHeaderName] = {
                    action: logService.getActionString(action, "", "")
                }
                ConfigUtils.getHTTPService().delete(url, config).then(function(response) {
                    StorageService.deleteStorageNamespace(LOCAL_STORAGE_KEY);
                    $window.location = response.data.logout_url;
                }, function(error) {
                    // if the logout fails for some reason, send the user to the logout url as defined above
                    $window.location = logoutURL;
                });
            },

            logoutWithoutRedirect: function (action) {
                var logoutConfig = {
                    skipHTTP401Handling: true,
                    headers: {}
                };

                logoutConfig.headers[ERMrest.contextHeaderName] = {
                    action: logService.getActionString(action, "", "")
                };

                // logout without redirecting the user
                ConfigUtils.getHTTPService().delete(serviceURL + "/authn/session/", logoutConfig).then(function(response) {
                    StorageService.deleteStorageNamespace(LOCAL_STORAGE_KEY);

                }).catch(function (error) {
                    // this is a 404 error when session doesn't exist and the user tries to logout
                    // don't throw the error since this means the user is lready logged out
                    console.log(error);
                });
            },

            refreshLogin: function(action) {
                $rootScope.showSpinner = true;

                // get referrerid from browser url
                var referrerId = UriUtils.queryStringToJSON($window.location.search).referrerid,
                    preauthReferrer = $window.location.origin + UriUtils.chaiseDeploymentPath() + "login2/?referrerid=" + referrerId,
                    redirectUrl = serviceURL + '/authn/preauth/?referrer=' + UriUtils.fixedEncodeURIComponent(preauthReferrer);

                var loginConfig = {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'Accept': 'application/json'
                    },
                    skipHTTP401Handling: true
                };

                loginConfig.headers[ERMrest.contextHeaderName] = {
                    action: logService.getActionString(action, "", "")
                }

                ConfigUtils.getHTTPService().get(redirectUrl, loginConfig).then(function(response){
                    var data = response.data;

                    // redirect_url is supposed to be the same as preauthReferrer
                    if (data.redirect_url === undefined) {
                        data.redirect_url = preauthReferrer;
                    }

                    $rootScope.showSpinner = false;
                    $window.location = data.redirect_url;
                }).catch(function (error) {
                    $rootScope.showSpinner = false;
                });

            }
        }
    }])

    var pathname = window.location.pathname;

    // If app is not search, viewer and login then attach the unauthorised 401 http handler to ermrestjs

    if (pathname.indexOf('/login') == -1) {

        angular.module('chaise.authen')

        .run(['ConfigUtils', 'ERMrest', 'Errors', 'ErrorService', '$injector', '$q', function runRecordEditApp(ConfigUtils, ERMrest, Errors, ErrorService, $injector, $q) {

            var Session = $injector.get("Session");

            // Bind callback function by invoking setHTTP401Handler handler passing the callback
            // This callback will be called whenever 401 HTTP error is encountered unless there is
            // already login flow in progress
            ERMrest.setHTTP401Handler(function() {
                var defer = $q.defer();

                // Call login in a new modal window to perform authentication
                // and return a promise to notify ermrestjs that the user has loggedin
                Session.loginInAModal(function() {

                    // Once the user has logged in fetch the new session and set the session value
                    // and resolve the promise to notify ermrestjs that the user has logged in
                    // and it can continue firing other queued calls
                    Session.getSession("401").then(function(_session) {
                        var prevSession = Session.getPrevSessionValue();
                        // Not sure if this will trigger on page load, if not I think it's safe to run this in all contexts
                        // recordset  - read should throw a 409 if there's a permission issue
                        // record     - same issue with read above
                        //            - p&b add throws a conflict error in most cases, so won't get sent here either (RBK)
                        // recordedit - add/update return here in some cases, and in other cases will return a 409 and ignore this case
                        var differentUser = prevSession && !Session.isSameSessionAsPrevious();

                        // send boolean to communicate in ermrestJS if execution should continue after 401 error thrown and subsequent login
                        defer.resolve(differentUser);

                        // throw Error if login is successful but it's a different user
                        if (differentUser) ErrorService.handleException(new Errors.DifferentUserConflictError(_session, prevSession), false);
                    }, function(exception) {
                        defer.reject(exception);
                    });

                }, function (response) {
                    // returns to rejectCB in ermrestJS/http.js
                    defer.reject(response);
                });

                return defer.promise;
            });


        }]);

    }

})();
