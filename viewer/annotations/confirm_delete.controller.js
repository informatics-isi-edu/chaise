(function () {
    'use strict';

    angular.module('chaise.viewer')

    .controller('ConfirmDeleteController', ['$uibModalInstance', function ConfirmDeleteController($uibModalInstance) {
        var vm = this;
        vm.ok = ok;
        vm.cancel = cancel;
        
        function ok() {
            $uibModalInstance.close();
        }

        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }
    }]);
})();
