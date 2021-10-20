(function() {
    'use strict';

    angular.module('chaise.alerts', ['chaise.filters', 'chaise.utils'])

    .factory('AlertsService', ['DataUtils', 'messageMap', function AlertsService(DataUtils, messageMap) {
        var alerts = [];
        var ALERT_TYPES = ['success', 'error', 'warning'];
        var urlLimitAlert;

        // replaceCloseBoolean was added to replace the functionality deleteAlert() call in closeAlert() with the defined cb function
        // NOTE: could also be defined as a function instead with the name "deleteAlertFunction"
        //   would instead replace the alerts.splice call in deleteAlert with the defined function
        function Alert(message, type, cb, replaceCloseBoolean) {
            DataUtils.verify(message, 'Message required to create an alert.');
            if (type === undefined || ALERT_TYPES.indexOf(type) === -1) {
                type = 'error';
            }
            this.message = message;
            this.type = type;
            this.callback = cb;
             // if true, replaces the normal deleteAlert() call in closeAlert() with the callback function
            this.replaceClose = replaceCloseBoolean || false;
        }

        function addAlert(message, type, closeCallback, replaceClose) {
            DataUtils.verify(message, 'Message required to create an alert.');
            var alert = new Alert(message, type, closeCallback, replaceClose);
            alerts.push(alert);
            return alert;
        }

        function deleteAlert(alert) {
            var index = alerts.indexOf(alert);
            DataUtils.verify((index > -1), 'Alert not found.');
            if (alert.callback) alert.callback();
            return alerts.splice(index, 1);
        }

        // creates an alert without adding it to the internal alerts array
        // allows for managing the array of alerts outside of the scope of the service
        function createAlert(message, type, closeCallback, replaceClose) {
            DataUtils.verify(message, 'Message required to create an alert.');
            var alert = new Alert(message, type, closeCallback, replaceClose);
            return alert;
        }

        /**
         * Will create a specific type of alert for url limitation
         * @param {string} message
         */
        function addURLLimitAlert(message) {
            message = message || messageMap.URLLimitMessage;
            if (urlLimitAlert) return;
            urlLimitAlert = addAlert(message, ALERT_TYPES[2]);
            return urlLimitAlert;
        }

        /**
         * Delete the specific alert
         * @return {Alert}
         */
        function deleteURLLimitAlert() {
            if (!urlLimitAlert) return;
            var alert = deleteAlert(urlLimitAlert);
            urlLimitAlert = null;
            return alert;
        }

        /**
         * delete all alerts
         */
        function deleteAllAlerts() {
            alerts.length = 0;
        }

        return {
            alerts: alerts,
            addAlert: addAlert,
            createAlert: createAlert,
            deleteAlert: deleteAlert,
            deleteAllAlerts: deleteAllAlerts,
            addURLLimitAlert: addURLLimitAlert,
            deleteURLLimitAlert: deleteURLLimitAlert
        };
    }])

    .directive('alerts', ['AlertsService', 'logService', 'Session', 'UriUtils', function(AlertsService, logService, Session, UriUtils) {

        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/alerts.html',
            scope: {
                alerts: '='
            },
            link: function (scope, elem, attr) {
                scope.closeAlert = function(alert) {
                    if (alert.replaceClose && alert.callback) return alert.callback(alert);
                    AlertsService.deleteAlert(alert);
                }

                scope.login = function() {
                    Session.loginInAPopUp(logService.logActions.LOGIN_WARNING);
                }
            }
        };
    }]);
})();
