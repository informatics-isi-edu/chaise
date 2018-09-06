(function() {
    'use strict';

    angular.module('chaise.authen', ['chaise.utils', 'chaise.storage'])

    .factory('Session', ['messageMap', 'modalUtils', 'StorageService', '$cookies', '$http', '$interval', '$log', '$q', 'UriUtils', '$window', '$rootScope', function (messageMap, modalUtils, StorageService, $cookies, $http, $interval, $log, $q, UriUtils, $window, $rootScope) {

        var chaiseConfig = Object.assign({}, $rootScope.chaiseConfig);

        // authn API no longer communicates through ermrest, removing the need to check for ermrest location
        var serviceURL = $window.location.origin;

        var LOCAL_STORAGE_KEY = 'session';              // name of object session information is stored under
        var PROMPT_EXPIRATION_KEY = 'promptExpiration'; // name of key for prompt expiration value
        var PREVIOUS_SESSION_KEY = 'previousSession';   // name of key for previous session boolean

        // Private variable to store current session object
        var _session = null;

        var _changeCbs = {};

        var _counter = 0;

        var _executeListeners = function() {
            for (var k in _changeCbs) {
                _changeCbs[k]();
            }
        };
       
        /**
         * Functions that interact with the StorageService tokens
         * There are 2 keys stored under the LOCAL_STORAGE_KEY object, PROMPT_EXPIRATION_KEY and PREVIOUS_SESSION_KEY
         */

        // verifies value exists for `keyName`
        var _tokenExists = function(keyName) {
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

        // removes the key/value pair at `keyName`
        var _removeToken = function (keyName) {
            if (_tokenExists(keyName)) {
                StorageService.deleteStorageValue(LOCAL_STORAGE_KEY, keyName);
            }
        };

        // checks if the expiration token with `keyName` has expired
        var _expiredToken = function (keyName) {
            var sessionStorage = StorageService.getStorage(LOCAL_STORAGE_KEY);

            return (sessionStorage && new Date().getTime() > sessionStorage[keyName]);
        };

        // extends the expiration token with `keyName` if it hasn't expired
        var _extendToken = function (keyName) {
            if (_tokenExists(keyName) && !_expiredToken(keyName)) {
                _createToken(keyName);
            }
        };

        // creates a boolean token with `keyName`
        var _createBool = function (keyName) {
            var data = {};

            data[keyName] = true;

            StorageService.updateStorage(LOCAL_STORAGE_KEY, data);
        };

        var loginWindowCb = function (params, referrerId, cb, type){
            if(type.indexOf('modal')!== -1){
                if (_session) {
                    params.title = messageMap.sessionExpired.title;
                    params.message = messageMap.sessionExpired.message;
                } else {
                    params.title = messageMap.noSession.title;
                    params.message = messageMap.noSession.message;
                }
                var closed = false;
                var onModalCloseSuccess = function () {
                    onModalClose();
                }

                var onModalClose = function() {
                    $interval.cancel(intervalId);
                    $cookies.remove("chaise-" + referrerId, { path: "/" });
                    closed = true;
                };

                var modalInstance = modalUtils.showModal({
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
                        _createBool(PREVIOUS_SESSION_KEY);
                        _removeToken(PROMPT_EXPIRATION_KEY);
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


        var logInHelper = function(logInTypeCb, win, cb, type){
            var referrerId = (new Date().getTime());

            var url = serviceURL + '/authn/preauth?referrer='+UriUtils.fixedEncodeURIComponent($window.location.origin+"/"+ UriUtils.chaiseDeploymentPath() + "login?referrerid=" + referrerId);
            var config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': 'application/json'
                }
            };

            $http.get(url, config).then(function(response){
                var data = response.data;

                var login_url = "";
                if (data['redirect_url'] !== undefined) {
                    login_url = data['redirect_url'];
                } else if (data['login_form'] !== undefined) {
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
                logInTypeCb(params,referrerId, cb, type);
            }, function(error) {
                throw error;
            });
        };

        /**
         * uses the reloadCb function to reload the page no matter what after a user logs in
         * creates a race condition with the calback registered for the LoginInAModal function
         */
        var popupLogin = function () {
            var reloadCb = function(){
                window.location.reload();
            };

            var x = window.innerWidth/2 - 800/2;
            var y = window.innerHeight/2 - 600/2;

            var win = window.open("", '_blank','width=800,height=600,left=' + x + ',top=' + y);

            logInHelper(loginWindowCb, win, reloadCb, 'popUp');
        };

        var shouldReloadPageAfterLogin = function(newSession) {
            if (_session === null) return true;
            return false;
        };

        return {

            /**
             * Will return a promise that is resolved with the session.
             * It will also call the _executeListeners() functions and sets the _session.
             * If we couldn't fetch the session, it will resolve with `null`.
             *
             * TODO needs to be revisited for 401.
             * We want to reload the page and stop the code execution for 401,
             *  but currently the code will continue executing and then reloads.
             *
             * @param  {string=} context undefined or "401"
             */
            getSession: function(context) {
                return $http.get(serviceURL + "/authn/session").then(function(response) {
                    if (context === "401" && shouldReloadPageAfterLogin(response.data)) {
                        window.location.reload();
                        return response.data;
                    }

                    _session = response.data;
                    _executeListeners();
                    return _session;
                }).catch(function(err) {
                    $log.warn(err);

                    _session = null;
                    _executeListeners();
                    return _session;
                });
            },

            /**
             * Will return a promise that is resolved with the session.
             * Meant for validating the server session and verify if it's still active or not
             */
            validateSession: function () {
                return $http.get(serviceURL + "/authn/session").then(function(response) {
                    _session = response.data;
                    return _session;
                }).catch(function(err) {
                    $log.warn(err);

                    _session = null;
                    return _session;
                });
            },

            getSessionValue: function() {
                return _session;
            },

            // if there's a previous login token AND
            // the prompt expiration token does not exist OR it has expired
            showPreviousSessionAlert: function() {
                return (_tokenExists(PREVIOUS_SESSION_KEY) && (!_tokenExists(PROMPT_EXPIRATION_KEY) || _expiredToken(PROMPT_EXPIRATION_KEY)));
            },

            subscribeOnChange: function(fn) {
                // To avoid same ids for an instance we add counter
                var id = new Date().getTime() + (++_counter);

                if (typeof fn  == 'function') {
                    _changeCbs[id] = fn;
                }
                return id;
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
             * This function opens a modal dialog which has a link for login
             * the callback for this function has a race condition because the login link in the modal uses `loginInAPopUp`
             * that function uses the embedded `reloadCb` as the callback for the actual login window closing.
             * these 2 callbacks trigger in the order of `popupCb` first then `modalCb` where modalCb is ignored more often than not
             * @param {Function} notifyErmrestCB - runs after the login process has been complete
             */
            loginInAModal: function(notifyErmrestCB) {
                logInHelper(loginWindowCb, "", notifyErmrestCB, 'modal');
            },

            logout: function() {
                var logoutURL = chaiseConfig['logoutURL'] ? chaiseConfig['logoutURL'] : '/';
                var url = serviceURL + "/authn/session";

                url += '?logout_url=' + UriUtils.fixedEncodeURIComponent(logoutURL);

                $http.delete(url).then(function(response) {
                    StorageService.deleteStorageNamespace(LOCAL_STORAGE_KEY);
                    $window.location = response.data.logout_url;
                }, function(error) {
                    // if the logout fails for some reason, send the user to the logout url as defined above
                    $window.location = logoutURL;
                });
            }
        }
    }])

    var pathname = window.location.pathname;

    // If app is not search, viewer and login then attach the unauthorised 401 http handler to ermrestjs

    if (pathname.indexOf('/search/') == -1 && pathname.indexOf('/viewer/') == -1 && pathname.indexOf('/login') == -1) {

        angular.module('chaise.authen')
        .run(['ERMrest', '$injector', '$q', function runRecordEditApp(ERMrest, $injector, $q) {

            var Session = $injector.get("Session");

            // Bind callback function by invoking setHttpUnauthorizedFn handler passing the callback
            // This callback will be called whenever 401 HTTP error is encountered unless there is
            // already login flow in progress
            ERMrest.setHttpUnauthorizedFn(function() {
                var defer = $q.defer();

                // Call login in a new modal window to perform authentication
                // and return a promise to notify ermrestjs that the user has loggedin
                Session.loginInAModal(function() {

                    // Once the user has logged in fetch the new session and set the session value
                    // and resolve the promise to notify ermrestjs that the user has logged in
                    // and it can continue firing other queued calls
                    Session.getSession("401").then(function(_session) {
                        defer.resolve();
                    }, function(exception) {
                        defer.reject(exception);
                    });

                });

                return defer.promise;
            });


        }]);

    }

})();
