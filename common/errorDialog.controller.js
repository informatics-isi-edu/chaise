
(function() {
    'use strict';

    angular.module('chaise.errors')

    .controller('ErrorDialogController', ['$uibModalInstance', 'params', function ErrorDialogController($uibModalInstance, params) {
        var vm = this;
        vm.params = params;
        vm.ok = ok;

        vm.displayDetails = false;
        vm.showDetails = showDetails;
        vm.linkText = "Show Details";

        function showDetails() {
            vm.displayDetails = !vm.displayDetails;
            if(vm.displayDetails) vm.linkText = "Hide Details";
            else vm.linkText = "Show Details";
        };

        function ok() {
            $uibModalInstance.close();
        };
    }]);
})();
