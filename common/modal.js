(function () {
    'use strict';

    angular.module('chaise.modal', [])

    .controller('ConfirmDeleteController', ['$uibModalInstance', function ConfirmDeleteController($uibModalInstance) {
        var vm = this;
        vm.ok = ok;
        vm.cancel = cancel;
        vm.status = 0;

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
    .controller('SearchPopupController', ['$scope', '$uibModalInstance', 'DataUtils', 'params', 'Session', function SearchPopupController($scope, $uibModalInstance, DataUtils, params, Session) {
        var vm = this;

        vm.params = params;
        vm.ok = ok;
        vm.cancel = cancel;

        var reference = params.reference;
        vm.hasLoaded = false;
        var reference = vm.reference = params.reference;

        vm.tableModel = {
            hasLoaded:          false,
            reference:          reference,
            tableDisplayName:   reference.displayname,
            columns:            reference.columns,
            sortBy:             null,
            sortOrder:          null,
            enableSort:         true,
            enableAutoSearch:   true,
            pageLimit:          25,
            search:             null,
            config:             {viewable: false, editable: false, deletable: false, selectable: true},
            context:            params.context
        };

        var fetchRecords = function() {

            // TODO this should not be a hardcoded value, either need a pageInfo object across apps or part of user settings
            reference.read(25).then(function getPseudoData(page) {
                vm.tableModel.hasLoaded = true;
                vm.tableModel.initialized = true;
                vm.tableModel.page = page;
                vm.tableModel.rowValues = DataUtils.getRowValuesFromPage(page);
            }, function(exception) {
                if (exception instanceof ERMrest.UnauthorizedError || exception.code == 401) {
                    Session.loginInANewWindow(function() {
                        fetchRecords();
                    });
                } else {
                    AlertsService.addAlert({type: 'error', message: response.message});
                    $log.warn(response);
                }
            });
        }

        fetchRecords();

        function ok(tuple) {
            $uibModalInstance.close(tuple);
        }

        function cancel() {
            $uibModalInstance.dismiss("cancel");
        }
    }]);
})();
