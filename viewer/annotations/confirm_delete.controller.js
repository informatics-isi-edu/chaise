(function () {
    'use strict';

    angular.module('chaise.viewer')

    .controller('ConfirmDeleteController', ['$uibModalInstance', '$scope', function ConfirmDeleteController($uibModalInstance, $scope) {
        $scope.ok = function () {
            $uibModalInstance.close();
        }

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        }
    }]);
})();
