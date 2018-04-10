(function() {
    'use strict';

    angular.module('chaise.alerts', ['chaise.filters', 'chaise.utils'])

    .factory('AlertsService', ['DataUtils', function AlertsService(DataUtils) {
        var alerts = [];
        var ALERT_TYPES = ['success', 'error', 'warning'];

        function Alert(message, type, cb) {
            DataUtils.verify(message, 'Message required to create an alert.');
            if (type === undefined || ALERT_TYPES.indexOf(type) === -1) {
                type = 'error';
            }
            this.message = message;
            this.type = type;
            this.callback = cb;
        }

        function addAlert(message, type, closeCallback) {
            DataUtils.verify(message, 'Message required to create an alert.');
            var alert = new Alert(message, type, closeCallback);
            alerts.push(alert);
            return alert;
        }

        function deleteAlert(alert) {
            var index = alerts.indexOf(alert);
            DataUtils.verify((index > -1), 'Alert not found.');
            if (alert.callback) alert.callback();
            return alerts.splice(index, 1);
        }

        return {
            alerts: alerts,
            addAlert: addAlert,
            deleteAlert: deleteAlert
        };
    }])

    .directive('alerts', ['AlertsService', 'Session', function(AlertsService, Session) {

        return {
            restrict: 'E',
            templateUrl: '../common/templates/alerts.html',
            scope: {
                alerts: '='
            },
            link: function (scope, elem, attr) {
                scope.closeAlert = function(alert) {
                    AlertsService.deleteAlert(alert);
                };

                /****** Functions used within alert messages *******/
                // defined here to allow for any callback to be used with the alert messages
                // passing along the named functions and attaching them to the alert scope may be over-engineering, so this will suffice for now
                scope.login = function() {
                    Session.loginInAPopUp();
                };
            }
        };
    }]);
})();
