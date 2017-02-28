(function() {
    'use strict';

    angular.module('chaise.errors')

    .controller('ErrorDialogController', ['$uibModalInstance', 'params', function ErrorDialogController($uibModalInstance, params) {
        var vm = this;
        vm.params = params || undefined;
        vm.ok = ok;

        function ok() {
            $uibModalInstance.close();
        }
    }]);
})();
