(function() {
    'use strict';

    angular.module('chaise.errors')

    .controller('ErrorDialogController', ['$uibModalInstance', 'params', function ErrorDialogController($uibModalInstance, params) {
        var vm = this;
        vm.params = params;
        // TODO: Wrap ok function in catcher fn 
        vm.ok = ok;

        function ok() {
            $uibModalInstance.close();
        }
    }]);
})();
