(function () {
    'use strict';

    angular.module('chaise.viewer')

    .controller('ConfirmDeleteController', ['$uibModalInstance', function ConfirmDeleteController($uibModalInstance) {
        $scope.ok = function () {
            $uibModalInstance.close();
        }

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        }
    }]);
})();
