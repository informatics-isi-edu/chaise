(function () {
    'use strict';

    angular.module('chaise.modal', ['chaise.utils'])

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
    .controller('ErrorModalController', ['$uibModalInstance', 'params', 'messageMap', '$window', function ErrorModalController($uibModalInstance, params, messageMap, $window) {
        var vm = this;
        vm.params = params;
        vm.displayDetails = false;
        vm.linkText = messageMap.showErrDetails;
        vm.showReloadBtn = false;
        var reloadMessage = ' <p>  </p>';

        if(vm.params.errorCode == 'Multiple Records Found'){
            vm.clickActionMessage =  messageMap.recordAvailabilityError.multipleRecords;
        } else if(vm.params.errorCode == 'Record Not Found'){
            vm.clickActionMessage = messageMap.recordAvailabilityError.noRecordsFound;
        } else {
            vm.clickActionMessage = messageMap.recordAvailabilityError.pageRedirect + vm.params.pageName + '. ';
            if(vm.params.appName == 'recordedit'){
              vm.showReloadBtn = true;
              reloadMessage = ' <p>' + messageMap.terminalError.reloadMessage +' </p>';
            }
        }
        // <p> tag is added to maintain the space between click action message and buttons
        // Also maintains consistency  in their placement irrespective of reload message
        vm.clickActionMessage += reloadMessage;

        vm.showDetails = function() {
            vm.displayDetails = !vm.displayDetails;
            vm.linkText = (vm.displayDetails) ? messageMap.hideErrDetails : messageMap.showErrDetails;
        };

        vm.ok = function () {
            $uibModalInstance.close();
        };

        vm.cancel = function cancel() {
            $uibModalInstance.dismiss('cancel');
        };
        vm.reload = function () {
            $uibModalInstance.close("reload");

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
    .controller('SearchPopupController', ['$scope', '$uibModalInstance', 'DataUtils', 'params', 'Session', 'modalBox', function SearchPopupController($scope, $uibModalInstance, DataUtils, params, Session, modalBox) {
        var vm = this;

        vm.params = params;
        vm.ok = ok;
        vm.cancel = cancel;
        vm.submit = submitMultiSelection;
        vm.getDisabledTuples = params.getDisabledTuples ? params.getDisabledTuples : undefined;
        vm.mode = params.mode;

        vm.hasLoaded = false;
        var reference = vm.reference = params.reference;
        var limit = 25;

        vm.tableModel = {
            hasLoaded:          false,
            reference:          reference,
            tableDisplayName:   params.displayname ? params.displayname : reference.displayname,
            columns:            reference.columns,
            sortby:             reference.location.sortObject ? reference.location.sortObject[0].column: null,
            sortOrder:          reference.location.sortObject ? (reference.location.sortObject[0].descending ? "desc" : "asc") : null,
            enableSort:         true,
            enableAutoSearch:   true,
            pageLimit:          limit,
            rowValues:          [],
            selectedRows:       params.selectedRows,
            matchNotNull:       params.matchNotNull,
            search:             reference.location.searchTerm,
            config:             {viewable: false, editable: false, deletable: false, selectMode: params.selectMode, showNull: params.showNull === true},
            context:            params.context
        };

        var fetchRecords = function() {
            // TODO this should not be a hardcoded value, either need a pageInfo object across apps or part of user settings
            // The new recordset (recordsetWithFaceting) doesn't require read first. It will take care of this.
            reference.read(limit).then(function getPseudoData(page) {
                var afterRead = function () {
                    vm.tableModel.hasLoaded = true;
                    vm.tableModel.initialized = true;
                    vm.tableModel.page = page;
                    vm.tableModel.rowValues = DataUtils.getRowValuesFromPage(page);
                    $scope.$broadcast('data-modified');
                };

                // get disabled tuple.
                if (vm.getDisabledTuples) {
                    vm.getDisabledTuples(page, vm.tableModel.pageLimit).then(function (rows) {
                        vm.tableModel.disabledRows = rows;
                        afterRead();
                    }).catch(function (err) {
                        throw err;
                    });
                } else {
                    afterRead();
                }

            }).catch(function(exception) {
                throw exception;
            });
        };

        fetchRecords();

        // since this is currently used for single select mode, the isSelected will always be true
        function ok(tuples, isSelected) {
            if (params.selectMode != modalBox.multiSelectMode) $uibModalInstance.close(tuples[0]);
        }

        /**
         * Will call the close modal with the appropriate results.
         * If we had the matchNotNull, then we just need to pass that attribute.
         */
        function submitMultiSelection() {
            var res = vm.tableModel.selectedRows;
            if (!Array.isArray(res)) res = [];
            if (vm.tableModel.matchNotNull) {
                res = {matchNotNull: true};
            }
            $uibModalInstance.close(res);
        }

        function cancel() {
            $uibModalInstance.dismiss("cancel");
        }
    }])

    .controller('profileModalDialogController', ['$uibModalInstance','$rootScope', 'Session','UriUtils',function ($uibModalInstance, $rootScope, Session, UriUtils){
        var vm = this;
        vm.groupList =[];
        vm.identities = [];
        vm.client= {};
        vm.cancel = function() {
            $uibModalInstance.dismiss();
        };
        $rootScope.session = Session.getSessionValue();
        vm.client =$rootScope.session.client;

        var user = $rootScope.session.client;
        vm.user = user.full_name || user.display_name  || user.email || user.id;
        for(var i = 0; i<  $rootScope.session.client.identities.length; i++){
            vm.identities.push($rootScope.session.client.identities[i]);
        }


        for(var i = 0; i<  $rootScope.session.attributes.length; i++){
            if($rootScope.session.attributes[i].display_name && $rootScope.session.attributes[i].display_name !== user.display_name){
                $rootScope.session.attributes[i].id= $rootScope.session.attributes[i].id.substring(24);
                vm.groupList.push($rootScope.session.attributes[i]);
            }
        }
    }])

})();
