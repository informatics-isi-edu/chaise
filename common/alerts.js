(function() {
    'use strict';

    angular.module('chaise.alerts', ['chaise.filters'])

    .factory('AlertsService', [function AlertsService() {
        var alerts = [];

        function addAlert(alert) {
            if (alert.hasOwnProperty('type') && alert.hasOwnProperty('message')) {
                return alerts.push(alert);
            }
            throw "Invalid alert";
        }

        function deleteAlert(alert) {
            var index = alerts.indexOf(alert);
            if (index > -1) {
                return alerts.splice(index, 1);
            }
            throw "Alert not found.";
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

                // TODO: Add catcher fn
                scope.closeAlert = function (alert) {
                    AlertsService.deleteAlert(alert);
                };
            }
        };
    }]);
})();
