(function() {
    'use strict';

    angular.module('chaise.authen', ['chaise.utils'])

    .factory('Session', ['$http', '$q', '$window', 'UriUtils', '$uibModal', '$interval', '$cookies','messageMap', function ($http, $q, $window, UriUtils, $uibModal, $interval, $cookies, messageMap) {

        // authn API no longer communicates through ermrest, removing the need to check for ermrest location
        var serviceURL = $window.location.origin;

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
         * Return deployment specific path name
         * @return {String} string representation of the path name "~username/chaise", "chaise", "path/to/deployment/data"
         */
        var getDepPathName = function() {
            var location = window.location;
            var splits = location.pathname.split('/');
            splits.splice(0, 1);
            if(splits[splits.length-1] == ""){
                splits.splice(splits.length-1, 1);
            }
            if(splits[splits.length-1] == 'index.html'){
                splits.splice(splits.length-1, 1);
            }
            splits.splice(splits.length-1, 1);
            return splits.join('/');
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
                var modalInstance, closed = false;
                modalInstance = $uibModal.open({
                    windowClass: "modal-login-instruction",
                    templateUrl: "../common/templates/loginDialog.modal.html",
                    controller: 'LoginDialogController',
                    controllerAs: 'ctrl',
                    resolve: {
                        params: params
                    },
                    openedClass: 'modal-login',
                    backdrop: 'static',
                    keyboard: false
                });
                
                var onModalClose = function() {
                    $interval.cancel(intervalId);
                    $cookies.remove("chaise-" + referrerId, { path: "/" });
                    closed = true;
                };
                
                // To avoid problems when user explicitly close the modal
                modalInstance.result.then(onModalClose, onModalClose);
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
            
            var url = serviceURL + '/authn/preauth?referrer='+UriUtils.fixedEncodeURIComponent(location.origin+"/"+getDepPathName() + "/login?referrerid=" + referrerId);
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

        return {

            getSession: function() {
                return $http.get(serviceURL + "/authn/session").then(function(response) {
                    _session = response.data;
                    _executeListeners();
                    return response.data;
                }, function(response) {
                    _session = null;
                    _executeListeners();
                    return $q.reject(response);
                });
            },

            getSessionValue: function() {
                return _session;
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
            
            loginInAPopUp: function(win,reloadCb) {
                logInHelper(loginWindowCb,win,reloadCb,'popUp');
            },

            loginInAModal: function(notifyErmrestCB) {
                logInHelper(loginWindowCb,"",notifyErmrestCB,'modal');
            },

            logout: function() {
                var logoutURL = chaiseConfig['logoutURL'] ? chaiseConfig['logoutURL'] : '/';
                var url = serviceURL + "/authn/session";

                url += '?logout_url=' + UriUtils.fixedEncodeURIComponent(logoutURL);

                $http.delete(url).then(function(response) {
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
                    Session.getSession().then(function(_session) {
                        defer.resolve();
                    }, function(exception) {
                        throw exception;
                    });

                });

                return defer.promise;
            });


        }]);

    }

})();
