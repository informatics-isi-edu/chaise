(function () {
    'use strict';

    angular.module('chaise.modal', ['chaise.utils'])

    //TODO
    .factory('modalUtils', ["$log", "$uibModal", "$window", function ($log, $uibModal, $window) {
        function showModal(params, successCB, rejectCB, postRenderCB) {
            var modalInstance = $uibModal.open(params);
            if (postRenderCB) {
                modalInstance.rendered.then(postRenderCB).catch(function (error) {
                    $log.warn(error);
                });
            }
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
    .controller('ErrorModalController', ['ConfigUtils', 'Errors', 'messageMap', 'params', 'Session', '$rootScope', '$sce', '$uibModalInstance', '$window', function ErrorModalController(ConfigUtils, Errors, messageMap, params, Session, $rootScope, $sce, $uibModalInstance, $window) {
        var cc = ConfigUtils.getConfigJSON();
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

        // checks if error is -1, 0, 500, or 503
        function isRetryError (error) {
            switch (error.constructor) {
                case ERMrest.NoConnectionError:
                case ERMrest.TimedOutError:
                case ERMrest.InternalServerError:
                case ERMrest.ServiceUnavailableError:
                    return true;
                default:
                    return false;
            }
        }

        var vm = this,
            exception = params.exception,
            reloadMessage = ' <p>  </p>';

        vm.params = params;
        vm.displayDetails = false;
        vm.linkText = messageMap.showErrDetails;
        vm.showReloadBtn = false;
        vm.showDownloadPolicy = (vm.params.exception instanceof Errors.UnauthorizedAssetAccess && cc.assetDownloadPolicyURL && cc.assetDownloadPolicyURL.trim().length > 0 && typeof cc.assetDownloadPolicyURL == "string");
        if (vm.showDownloadPolicy) vm.downloadPolicy = cc.assetDownloadPolicyURL;
        if (ERMrest && isRetryError(exception)) {
            // we are only showing the reload button for the 4 types of retriable errors while the page is loading.
            // we discussed that it doesn't make sense to "retry" other requests that may fail after the data has loaded.
            vm.showReloadBtn = !$rootScope.displayReady;
        }

        // set the click action message
        if (exception instanceof Errors.multipleRecordError) {
            vm.clickActionMessage =  messageMap.clickActionMessage.multipleRecords;
        } else if (exception instanceof Errors.noRecordError) {
            vm.clickActionMessage = messageMap.clickActionMessage.noRecordsFound;
        } else if ( (exception instanceof Errors.CustomError && exception.errorData.clickActionMessage) || exception instanceof Errors.UnauthorizedAssetAccess) {
            vm.clickActionMessage = exception.errorData.clickActionMessage;
        } else if (ERMrest && exception instanceof ERMrest.InvalidFilterOperatorError) {
            vm.clickActionMessage = messageMap.clickActionMessage.noRecordsFound;
        } else if (ERMrest && isErmrestErrorNeedReplace(exception)) {
            vm.clickActionMessage = messageMap.clickActionMessage.messageWReplace.replace('@errorStatus', vm.params.errorStatus);
        } else {
            vm.clickActionMessage = messageMap.clickActionMessage.pageRedirect + vm.params.pageName + '. ';

            // TODO it might be more appropriate to move the following outside the if-else
            if (vm.params.appName == 'recordedit'){
                vm.showReloadBtn = true;
                reloadMessage = ' <p>' + messageMap.clickActionMessage.reloadMessage +' </p>';
            }
        }

        // <p> tag is added to maintain the space between click action message and buttons
        // Also maintains consistency  in their placement irrespective of reload message
        // NOTE: $sce.trustAsHtml done in one place after setting everything
        vm.clickActionMessage = vm.clickActionMessage + reloadMessage;
        vm.params.message = $sce.trustAsHtml(vm.params.message);
        vm.params.subMessage = $sce.trustAsHtml(vm.params.subMessage);

        vm.clickOkToDismiss = exception.clickOkToDismiss;
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
            $window.location.reload();
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
    .controller('SearchPopupController', ['ConfigUtils', 'DataUtils', 'params', 'Session', 'modalBox', 'logActions', '$rootScope', '$timeout', '$uibModalInstance',
        function SearchPopupController(ConfigUtils, DataUtils, params, Session, modalBox, logActions, $rootScope, $timeout, $uibModalInstance) {
        var vm = this;

        vm.params = params;
        vm.onSelectedRowsChanged = onSelectedRowsChanged;
        vm.cancel = cancel;
        vm.submit = submitMultiSelection;
        vm.mode = params.mode;

        vm.hasLoaded = false;

        var chaiseConfig = ConfigUtils.getConfigJSON();
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
            matchNull:          params.matchNull,
            hideNotNullChoice:  params.hideNotNullChoice,
            hideNullChoice:     params.hideNullChoice,
            search:             reference.location.searchTerm,
            config:             {viewable: false, editable: false, deletable: false, selectMode: params.selectMode, showFaceting: showFaceting, facetPanelOpen: params.facetPanelOpen, showNull: params.showNull === true},
            context:            params.context,
            getDisabledTuples:  params.getDisabledTuples,
            logObject:          params.logObject ? params.logObject: {}
        };

        /**
         * In case of single-select, this will be called just once.
         * In case of multi-select, this will be called anytime the list has changed
         */
        function onSelectedRowsChanged(tuples, isSelected) {
            switch (params.selectMode) {
                case modalBox.multiSelectMode:
                    if (params.onSelectedRowsChanged) {
                        var res = params.onSelectedRowsChanged(getMultiSelectionResult());

                        // if it returns false, then we should disable submit button
                        // since we cannot apply the change (url limit issue)
                        vm.disableSubmit = (res === false);
                        return res;
                    }
                    break;
                default:
                    // for single select isSelected is always true
                    $uibModalInstance.close(tuples[0]);
            }
        }

        /**
         * This will generate the correct object that we need to pass in case of multi-select.
         * It will return an object that,
         * - will have `matchNotNull` attribute if match not-null is selected
         * - otherwise the selected rows are in the `rows` attribute
         */
        function getMultiSelectionResult() {
            if (vm.tableModel.matchNotNull) {
                return {matchNotNull: true};
            }
            return {rows: Array.isArray(vm.tableModel.selectedRows) ? vm.tableModel.selectedRows : []};
        }

        /**
         * Will call the close modal with the appropriate results.
         * If we had the matchNotNull, then we just need to pass that attribute.
         */
        function submitMultiSelection() {
            $uibModalInstance.close(getMultiSelectionResult());
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

    .controller('ExportProgressController', ['$uibModalInstance', 'params', function ($uibModalInstance, params) {
        var vm = this;
        vm.cancel = cancel;
        vm.params = params;
        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }
    }])

    /**
     * Params object values:
     *   - {String} displayname - used for citation content and filename for bibtex download
     *   - {String} permalink - link to the live catalog
     *   - {String} versionLink - link to the current version of the live catalog
     *   - {String} versionDate - version decoded to it's datetime
     *   - {String} versionDateRelative - version decoded to it's datetime then presented as relative to today's date
     *   - {boolean} showVersionWarning - decides whether to show "out of date content" warning
     *   - {Object} citation - citation object returned from ERMrest.tuple.citation
     *
     */
    .controller('ShareCitationController', ['$uibModalInstance', '$window', 'params', function ($uibModalInstance, $window, params) {
        var vm = this;
        vm.params = params;
        vm.warningMessage = "The displayed content may be stale due to recent changes made by other users. You may wish to review the changes prior to sharing the <a ng-href='{{ctrl.params.permalink}}'>live link</a> below. Or, you may share the older content using the <a ng-href='{{ctrl.params.versionLink}}'>versioned link</a>.";

        vm.moreThanWeek = function () {
            var weekAgo = moment().subtract(7, 'days').startOf('day');
            var versionMoment = moment(params.versionDate);

            return weekAgo.isAfter(versionMoment);
        }

        // generate bibtex url from citation
        if (params.citation) {
            var citation = params.citation;
            var bibtexContent = "@article{";
            bibtexContent += (citation.id ? citation.id+",\n" : params.displayname+",\n");
            if (citation.author) bibtexContent += "author = {" + citation.author + "},\n";
            if (citation.title) bibtexContent += "title = {" + citation.title + "},\n";
            bibtexContent += "journal = {" + citation.journal + "},\n";
            bibtexContent += "year = {" + citation.year + "},\n";
            bibtexContent += "URL = {" + citation.url + "}\n}";

            var bibtexBlob = new Blob([ bibtexContent ], { type : 'text/plain' });
            // set downloadURL for ng-href attribute
            vm.downloadBibtex = $window.URL.createObjectURL( bibtexBlob );
        }

        vm.copyToClipboard = function (text) {
            // Create a dummy input to put the text string into it, select it, then copy it
            // this has to be done because of HTML security and not letting scripts just copy stuff to the clipboard
            // it has to be a user initiated action that is done through the DOM object
            var dummy = angular.element('<input></input>');
            dummy.attr("visibility", "hidden");
            dummy.attr("display", "none");

            document.body.appendChild(dummy[0]);

            dummy.attr("id", "copy_id");
            document.getElementById("copy_id").value = text;
            dummy.select();
            document.execCommand("copy");

            document.body.removeChild(dummy[0]);
        }

        vm.closeAlert = function () {
            vm.params.showVersionWarning = false;
        }

        vm.cancel = function() {
            $uibModalInstance.dismiss('cancel');
        }
    }])

})();
