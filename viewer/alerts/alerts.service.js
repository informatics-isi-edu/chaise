(function() {
    'use strict';

    angular.module('chaise.viewer')

    .factory('AlertsService', [function AlertsService() {
        var alerts = [];

        function setAlert(alert) {
            if (alert.hasOwnProperty('type') && alert.hasOwnProperty('message')) {
                return alerts.push(alert);
            }
            console.log('Improper alert properties: ', alert);
        }

        function deleteAlert(alert) {
            var index = alerts.indexOf(alert);
            alerts.splice(index, 1);
        }
        
        return {
            alerts: alerts,
            setAlert: setAlert,
            deleteAlert: deleteAlert
        };
    }]);
})();
