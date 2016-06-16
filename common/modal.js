(function () {
    'use strict';

    angular.module('chaise.modal', [])

    // Use this controller when making a confirmation modal for deletion
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
