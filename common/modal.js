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
                throw exception;
            });
        }

        fetchRecords();

        function ok(tuple) {
            $uibModalInstance.close(tuple);
        }

        function cancel() {
            $uibModalInstance.dismiss("cancel");
        }
    }])
    .controller('MarkdownPreviewController', ['$scope', '$uibModalInstance', 'DataUtils', 'params', 'Session', function MarkdownPreviewController($scope, $uibModalInstance, DataUtils, params, Session) {
        var vm = this;

        vm.params = params;
        vm.ok = ok;
        vm.cancel = cancel;
        //console.log("in modal ctrl: "+params.markdownOut);

        function ok(tuple) {
            $uibModalInstance.close(tuple);
        }

        function cancel() {
            $uibModalInstance.dismiss("cancel");
        }
    }])
})();
