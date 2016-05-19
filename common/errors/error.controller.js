(function () {
    'use strict';

    angular.module('chaise.errors')

    .controller('ErrorController', ['$uibModalInstance', function ErrorController($uibModalInstance) {
        var vm = this;
        vm.ok = ok;

        function ok() {
            $uibModalInstance.close();
        }
    }]);
})();
