(function () {
    'use strict';

    angular.module('chaise.modal', ['chaise.utils'])

    //TODO
    .factory('modalUtils', ["$uibModal", function ($uibModal) {
        function showModal(params, successCB, rejectCB) {
            var modalInstance = $uibModal.open(params);
            modalInstance.result.then(successCB).catch(function (response) {
                if (rejectCB) {
                    rejectCB(response);
                } else if (typeof response !== "string") {
                    throw response;
                }
            });

            return modalInstance;
        }

        return {
            showModal: showModal
        };
    }])

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
    .controller('ErrorModalController', ['Errors', 'messageMap', 'params', 'Session', '$uibModalInstance', '$window', function ErrorModalController(Errors, messageMap, params, Session, $uibModalInstance, $window) {
        var vm = this;
        vm.params = params;
        vm.displayDetails = false;
        vm.showReloadBtn = false;
        vm.linkText = messageMap.showErrDetails;

        function isErmrestErrorNeedReplace (error) {
            switch (error.constructor) {
                case ERMrest.InvalidFacetOperatorError:
                case ERMrest.InvalidPageCriteria:
                case ERMrest.InvalidSortCriteria:
                    return true;
                default:
                    return false;
            }
        }

        var exception = params.exception,
            reloadMessage = ' <p>  </p>';

        // in case of adding login button, we should add extra message
        if (vm.params.showLogin) {
            if (ERMrest && exception instanceof ERMrest.NotFoundError) {
                vm.params.message = vm.params.message + messageMap.maybeNeedLogin;
            } else if (exception instanceof Errors.noRecordError) {
                vm.params.message = messageMap.noRecordForFilter + '<br>' + messageMap.maybeUnauthorizedMessage;
            }
        }

        // set the click action message
        if (exception instanceof Errors.multipleRecordError) {
            vm.clickActionMessage =  messageMap.recordAvailabilityError.multipleRecords;
        } else if (exception instanceof Errors.noRecordError) {
            vm.clickActionMessage = messageMap.recordAvailabilityError.noRecordsFound;
        } else if (ERMrest && exception instanceof ERMrest.InvalidFilterOperatorError) {
            vm.clickActionMessage = messageMap.recordAvailabilityError.noRecordsFound;
        } else if (ERMrest && isErmrestErrorNeedReplace(exception)) {
            vm.clickActionMessage = messageMap.actionMessageWReplace.clickActionMessage.replace('@errorStatus', vm.params.errorStatus);
        } else {
            vm.clickActionMessage = messageMap.recordAvailabilityError.pageRedirect + vm.params.pageName + '. ';

            // TODO it might be more appropriate to move the following outside the if-else
            if (vm.params.appName == 'recordedit'){
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

        vm.login = function () {
            Session.loginInAPopUp();  //Open login pop-up without closing error modal
        };


    }])

    /**
     * Controller used to show the modal popup with a login dialog
     *
     * params should include:
     * - title {String} - the message shown in the modal header
     * - message {String} - the message for the body of the modalBox
     * - subMessage {String} - the sub-message to display under the login button (optional)
     */
    .controller('LoginDialogController', ['$uibModalInstance', 'params', 'Session', function LoginDialogController($uibModalInstance, params, Session) {
        var vm = this;
        vm.params = params;

        vm.openWindow = function() {
            Session.loginInAPopUp();
        };

        vm.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }])

    /**
     * Controller used to show the modal popup with the recordset directive for searching through entitiy sets
     *
     * params must include:
     *  - reference {ERMrest.Reference} - the reference backing the set of data shown
     *  - context {String} - the current context that the directive fetches data for
     *  - selectMode {String} - the select mode the modal uses
     */
    .controller('SearchPopupController',
                ['$scope', '$rootScope', '$uibModalInstance', 'DataUtils', 'params', 'Session', 'modalBox', 'logActions', '$timeout',
                function SearchPopupController($scope, $rootScope, $uibModalInstance, DataUtils, params, Session, modalBox, logActions, $timeout) {
        var vm = this;

        vm.params = params;
        vm.ok = ok;
        vm.cancel = cancel;
        vm.submit = submitMultiSelection;
        vm.mode = params.mode;

        vm.hasLoaded = false;
        var reference = vm.reference = params.reference;
        var limit = (!angular.isUndefined(reference) && !angular.isUndefined(reference.display) && reference.display.defaultPageSize) ? reference.display.defaultPageSize : 25;
        var comment = (typeof params.comment === "string") ? params.comment: reference.table.comment;
        var showFaceting = chaiseConfig.showFaceting ? params.showFaceting : false;

        vm.tableModel = {
            readyToInitialize:  true,
            hasLoaded:          false,
            reference:          reference,
            tableDisplayName:   params.displayname ? params.displayname : reference.displayname,
            tableComment:            comment,
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
            config:             {viewable: false, editable: false, deletable: false, selectMode: params.selectMode, showFaceting: showFaceting, facetPanelOpen: params.facetPanelOpen, showNull: params.showNull === true},
            context:            params.context,
            getDisabledTuples:  params.getDisabledTuples
        };

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
            $uibModalInstance.dismiss("cancel");
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
