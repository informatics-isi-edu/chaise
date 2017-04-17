
(function() {
    'use strict';

    angular.module('chaise.errors')

    .controller('ErrorDialogController', ['$uibModalInstance', 'params', function ErrorDialogController($uibModalInstance, params) {
        var vm = this;
        vm.params = params;
        vm.ok = ok;

        vm.details = false;
        vm.showDetails = showDetails;
        vm.linkText = "Show Details";
        
        function showDetails() {
            vm.details = !vm.details;
            if(vm.details) vm.linkText = "Hide Details";
            else vm.linkText = "Show Details";
        };

        function ok() {
            $uibModalInstance.close();
        };
    }]);
})();
