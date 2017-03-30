(function() {
    'use strict';

    angular.module('chaise.authen', ['chaise.utils'])

    .factory('Session', ['$http', '$q', '$window', 'UriUtils', '$uibModal', '$interval', '$cookies','messageMap', function ($http, $q, $window, UriUtils, $uibModal, $interval, $cookies, messageMap) {

        // authn API no longer communicates through ermrest, removing the need to check for ermrest location
        var serviceURL = $window.location.origin;

        return {

            getSession: function() {
                return $http.get(serviceURL + "/authn/session").then(function(response) {
                    return response.data;
                }, function(response) {
                    return $q.reject(response);
                });
            },

            login: function (referrer) {
                var url = serviceURL + '/authn/preauth?referrer=' + UriUtils.fixedEncodeURIComponent(referrer);
                var config = {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'Accept': 'application/json'
                    }
                };

                $http.get(url, config).then(function(response){
                    var data = response.data;
                    if (data['redirect_url'] !== undefined) {
                        var url = data['redirect_url'];
                        $window.open(url, '_self');
                    } else if (data['login_form'] !== undefined) {
                        var login_form = data['login_form'];
                        var login_url = '../login?referrer=' + UriUtils.fixedEncodeURIComponent(referrer);
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
                        login_url += '&method=' + method + '&action=' + action + '&text=' + text + '&hidden=' + hidden;
                        $window.location = login_url;
                    }
                }, function(error) {
                    throw error;
                });
            },

            loginInANewWindow: function(cb) {
                var referrerId = (new Date().getTime());
                var url = serviceURL + '/authn/preauth?referrer=' + UriUtils.fixedEncodeURIComponent(window.location.href.substring(0,window.location.href.indexOf('chaise')) + "chaise/login?referrerid=" + referrerId);
                var config = {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'Accept': 'application/json'
                    }
                };
                var modalInstance, closed = false;

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

                    params.title = messageMap.sessionExpired.title;
                    params.message = messageMap.sessionExpired.message;

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



                    /* if browser is IE then add explicit handler to watch for changes in localstorage for a particular
                     * variable
                     */
                    if (UriUtils.isBrowserIE()) {


                        $cookies.put("chaise-" + referrerId, true, { path: "/" });
                        var intervalId;
                        var watchChangeInReferrerId = function () {
                            if (!closed && !$cookies.get("chaise-" + referrerId)) {
                                $interval.cancel(intervalId);
                                if (typeof cb== 'function') {
                                    modalInstance.close("Done");
                                    cb();
                                    closed = true;
                                }
                                return;
                            }
                        }

                        var onModalClose = function() {
                            $interval.cancel(intervalId);
                            $cookies.remove("chaise-" + referrerId, { path: "/" });
                            closed = true;
                        }

                        // To avoid problems when user explicitly close the modal
                        modalInstance.result.then(onModalClose, onModalClose);

                        intervalId = $interval(watchChangeInReferrerId, 50);

                    } else {

                        window.addEventListener('message', function(args) {
                            if (args && args.data && (typeof args.data == 'string')) {
                                var obj = UriUtils.queryStringToJSON(args.data);
                                if (obj.referrerid == referrerId && (typeof cb== 'function')) {
                                    modalInstance.close("Done");
                                    cb();
                                    closed = true;
                                }
                            }
                        });
                    }

                }, function(error) {
                    throw error;
                });
            },

            logout: function() {
                var logoutURL = chaiseConfig['logoutURL'];
                var url = serviceURL + "/authn/session";
                if (logoutURL === undefined) {
                    logoutURL = $window.location.origin + '/chaise/logout';
                }
                url += '?logout_url=' + UriUtils.fixedEncodeURIComponent(logoutURL);

                $http.delete(url).then(function(response) {
                    $window.location = response.data.logout_url ;
                }, function(error) {
                    $window.location = '../logout';
                });
            }
        }
    }])

})();
