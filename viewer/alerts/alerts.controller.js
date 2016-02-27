(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('AlertsController', ['AlertsService', function AlertsController(AlertsService) {
        var vm = this;
        vm.alerts = AlertsService.alerts;

        vm.closeAlert = closeAlert;

        function closeAlert(alert) {
            return AlertsService.deleteAlert(alert);
        }
    }]);
})();
