(function () {
    'use strict';

    angular.module('chaise.modal', [])

    .controller('ConfirmDeleteController', ['$uibModalInstance', function ConfirmDeleteController($uibModalInstance) {
        var vm = this;
        // TODO: Wrap in catcher fn
        vm.ok = ok;
        // TODO: Wrap in catcher fn
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
        // TODO: Wrap in catcher fn
        vm.ok = ok;

        function ok() {
            $uibModalInstance.close();
        }
    }])
    .controller('LoginDialogController', ['$uibModalInstance', 'params' , '$sce', function LoginDialogController($uibModalInstance, params, $sce) {
        var vm = this;
        params.login_url = $sce.trustAsResourceUrl(params.login_url);
        vm.params = params;
        // TODO: Wrap in catcher fn
        vm.cancel = cancel;

        // TODO: Wrap in catcher fn. e.g.:
        // vm.openWindow = catcher(function() {...})
        vm.openWindow = function() {

            var x = window.innerWidth/2 - 800/2;
            var y = window.innerHeight/2 - 600/2;

            window.open(params.login_url, '_blank','width=800,height=600,left=' + x + ',top=' + y);

            return false;
        }

        // TODO: Wrap in catcher fn
        vm.params.host = $sce.trustAsResourceUrl(window.location.host);

        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }

    }])
    .controller('SearchPopupController', ['$scope', '$uibModalInstance', 'DataUtils', 'params', 'Session', function SearchPopupController($scope, $uibModalInstance, DataUtils, params, Session) {
        var vm = this;

        vm.params = params;
        // TODO: Wrap in catcher fn
        vm.ok = ok;
        // TODO: Wrap in catcher fn
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
                    // TODO: Throw error instead of these two lines
                    AlertsService.addAlert({type: 'error', message: response.message});
                    $log.warn(response);
                }
            });
            // TODO: Attach .catch w/ catchAll
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
