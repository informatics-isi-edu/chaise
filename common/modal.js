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
    .controller('ErrorModalController', ['$uibModalInstance', 'params', function ErrorModalController($uibModalInstance, params) {
        var vm = this;
        vm.params = params;
        vm.details = false;
        vm.linkText = "Show Details";

        vm.showDetails = function() {
            vm.details = !vm.details;
            vm.linkText = (vm.details) ? "Hide Details" : "Show Details";
        };

        vm.ok = function () {
            $uibModalInstance.close();
        };

        vm.cancel = function cancel() {
            $uibModalInstance.dismiss('cancel');
        };

    }])
    .controller('LoginDialogController', ['$uibModalInstance', 'params' , '$sce', function LoginDialogController($uibModalInstance, params, $sce) {
        var vm = this;
        params.login_url = $sce.trustAsResourceUrl(params.login_url);
        vm.params = params;
        vm.cancel = cancel;

        vm.openWindow = function() {

            var x = window.innerWidth/2 - 800/2;
            var y = window.innerHeight/2 - 600/2;

            window.open(params.login_url, '_blank','width=800,height=600,left=' + x + ',top=' + y);

            return false;
        }

        vm.params.host = $sce.trustAsResourceUrl(window.location.host);

        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }

    }])
    /**
     * Controller used to show the modal popup with the recordset directive for searching through entitiy sets
     * 
     * params must include:
     *  - reference {ERMrest.Reference} - the reference backing the set of data shown
     *  - context {String} - the current context that the directive fetches data for
     *  - selectMode {String} - the select mode the modal uses
     */
    .controller('SearchPopupController', ['$scope', '$uibModalInstance', 'DataUtils', 'params', 'Session', function SearchPopupController($scope, $uibModalInstance, DataUtils, params, Session) {
        var vm = this;

        vm.params = params;
        vm.ok = ok;
        vm.cancel = cancel;
        vm.submit = submitMultiSelection;

        vm.hasLoaded = false;
        var reference = vm.reference = params.reference;
        var tableDisplayName = params.displayname ? params.displayname : reference.displayname;
        var limit = 25;

        vm.tableModel = {
            hasLoaded:          false,
            reference:          reference,
            tableDisplayName:   tableDisplayName,
            columns:            reference.columns,
            sortby:             reference.location.sortObject ? reference.location.sortObject[0].column: null,
            sortOrder:          reference.location.sortObject ? (reference.location.sortObject[0].descending ? "desc" : "asc") : null,
            enableSort:         true,
            enableAutoSearch:   true,
            pageLimit:          limit,
            rowValues:          [],
            selectedRows:       params.selectedRows,
            search:             null,
            config:             {viewable: false, editable: false, deletable: false, selectMode: params.selectMode},
            context:            params.context
        };

        var fetchRecords = function() {
            // TODO this should not be a hardcoded value, either need a pageInfo object across apps or part of user settings
            reference.read(limit).then(function getPseudoData(page) {
                vm.tableModel.hasLoaded = true;
                vm.tableModel.initialized = true;
                vm.tableModel.page = page;
                vm.tableModel.rowValues = DataUtils.getRowValuesFromPage(page);

                $scope.$broadcast('data-modified');
            }, function(exception) {
                throw exception;
            });
        }

        fetchRecords();
    
        // since this is currently used for single select mode, the isSelected will always be true
        function ok(tuples, isSelected) {
            if (params.selectMode != "multi-select") $uibModalInstance.close(tuples[0]);
        }

        function submitMultiSelection() {
            $uibModalInstance.close(this.tableModel.selectedRows);
        }

        function cancel() {
            $uibModalInstance.dismiss("cancel");
        }
    }])

})();
