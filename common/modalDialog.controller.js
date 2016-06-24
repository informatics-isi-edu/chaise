(function() {
    'use strict';

    angular.module('chaise.errors')

    .controller('ModalDialogController', ['$uibModalInstance', 'params', function ConfirmDeleteController($uibModalInstance, params) {
        var vm = this;
        vm.params = params;
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
