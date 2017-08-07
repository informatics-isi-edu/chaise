(function() {
    'use strict';

    angular.module('chaise.alerts', ['chaise.filters', 'chaise.utils'])

    .factory('AlertsService', ['DataUtils', function AlertsService(DataUtils) {
        var alerts = [];
        var ALERT_TYPES = ['success', 'error', 'warning'];

        function Alert(message, type) {
            DataUtils.verify(message, 'Message required to create an alert.');
            if (type === undefined || ALERT_TYPES.indexOf(type) === -1) {
                type = 'error';
            }
            this.message = message;
            this.type = type;
        }

        function addAlert(message, type) {
            DataUtils.verify(message, 'Message required to create an alert.');
            var alert = new Alert(message, type);
            alerts.push(alert);
            return alert;
        }

        function deleteAlert(alert) {
            var index = alerts.indexOf(alert);
            DataUtils.verify((index > -1), 'Alert not found.')
            return alerts.splice(index, 1);
        }

        return {
            alerts: alerts,
            addAlert: addAlert,
            deleteAlert: deleteAlert
        };
    }])

    .directive('alerts', ['AlertsService', function(AlertsService) {

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
            }
        };
    }]);
})();
