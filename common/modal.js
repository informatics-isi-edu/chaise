(function () {
    'use strict';

    angular.module('chaise.modal', [])

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
    }])
    .controller('ErrorDialogController', ['$uibModalInstance', 'params', function ErrorDeleteController($uibModalInstance, params) {
        var vm = this;
        vm.params = params;
        vm.ok = ok;

        function ok() {
            $uibModalInstance.close();
        }
    }])
    .controller('SearchPopupController', ['$scope', '$uibModalInstance', 'DataUtils', 'params', function SearchPopupController($scope, $uibModalInstance, DataUtils, params) {
        var vm = this;

        vm.params = params;
        vm.ok = ok;
        vm.cancel = cancel;

        vm.hasLoaded = false;
        var reference = params.reference;

        // TODO this should not be a hardcoded value, either need a pageInfo object across apps or part of user settings
        reference.read(25).then(function getPseudoData(page) {
            vm.hasLoaded = true;

            vm.tableModel = {
                hasLoaded:          vm.hasLoaded,
                reference:          reference,
                tableDisplayName:   reference.displayname,
                columns:            reference.columns,
                sortBy:             null,
                sortOrder:          null,
                page:               page,
                pageLimit:          25,
                rowValues:          DataUtils.getRowValuesFromPage(page),
                search:             null
            }
        });

        function ok(tuple) {
            $uibModalInstance.close(tuple);
        }

        function cancel() {
            $uibModalInstance.dismiss("cancel");
        }
    }]);
})();
