(function () {
    'use strict';

    angular.module('chaise.modal', ['chaise.utils'])

    //TODO
    .factory('modalUtils', ["logService", "UiUtils", "UriUtils", "$log", "$q", "$uibModal", "$window", function (logService, UiUtils, UriUtils, $log, $q, $uibModal, $window) {

        /**
         * Given the parameters that are used to generate a modal, returns the appropriate size.
         * If we are going to show faceting, that will be treated as an extra column.
         * Then the logic is based on number of represented columns:
         *   - if #columns <= 3 : md
         *   - if #columns <= 6 : lg
         *   - else             : xl
         * TODO eventually anywhere we're creating searchpopup should be factored into a
         * function and this logic should be in that function.
         * But when I did that the passed vm was undefined. This needs more investigation.
         * TODO we should eventually change the behavior of modals to be based on
         * page size. Currently it will use a predefined percentage of the page size
         * which means that it will not be responsive.
         * @param {Object} params - the modal parameters
         * @return {string} the modal size
         **/
        function getSearchPopupSize(params) {
            var numberOfColumns = params.reference.columns.length;
            if (params.showFaceting) {
                ++numberOfColumns;
            }

            if (numberOfColumns <= 3) {
                return "md";
            } else if (numberOfColumns <= 6) {
                return "lg";
            }
            return "xl";
        }

        function showModal(params, successCB, rejectCB, postRenderCB) {
            var modalInstance = $uibModal.open(params);

            modalInstance.rendered.then(function () {
                if (postRenderCB) postRenderCB();
            }).catch(function (error) {
                $log.warn(error);
            });

            modalInstance.result.then(successCB).catch(function (response) {
                if (rejectCB) {
                    rejectCB(response);
                } else if (typeof response !== "string") {
                    throw response;
                }
            });

            return modalInstance;
        }

        /**
         * Given a tuple and reference will open the share popup. It will return a promise
         * that will be resolved when the modal is displayed.
         * You can also pass extra parameters if you want. The acceptable extra params are:
         *  - title: will be displayed in the modal title
         *  - hideCitation: hide the citation section
         *  - hideHeader: hides all the section headers.
         *  - extraInformation: An array of objects that will be displayed. Each element can be either
         *    {value: "string", title: "string"} or {title: "string", value: "string", link: "string", type: "link"}
         *  - logStackPath: if you want to change the default log stack path of the app
         *  - logStack: if you want to change the default log stack object of the app
         */
        function openSharePopup (tuple, reference, extraParams) {
            var defer = $q.defer();

            var refTable = reference.table;
            var params = extraParams || {};

            params.displayname = refTable.name+'_'+tuple.uniqueId,
            params.reference = reference;
            params.title = (extraParams.title ? extraParams.title : "Share");

            var versionString = "@" + (reference.location.version || refTable.schema.catalog.snaptime);
            params.permalink = UriUtils.resolvePermalink(tuple, reference);
            params.versionLink = UriUtils.resolvePermalink(tuple, reference, versionString);
            params.versionDateRelative = UiUtils.humanizeTimestamp(ERMrest.versionDecodeBase32(refTable.schema.catalog.snaptime));
            params.versionDate = UiUtils.versionDate(ERMrest.versionDecodeBase32(refTable.schema.catalog.snaptime));

            var stack = params.logStack ? params.logStack : logService.getStackObject();
            var snaptimeHeader = {
                action: logService.getActionString(logService.logActions.SHARE_OPEN, params.logStackPath),
                stack: stack,
                catalog: reference.defaultLogInfo.catalog,
                schema_table: reference.defaultLogInfo.schema_table
            }
            refTable.schema.catalog.currentSnaptime(snaptimeHeader).then(function (snaptime) {
                // if current fetched snpatime doesn't match old snaptime, show a warning
                params.showVersionWarning = (snaptime !== refTable.schema.catalog.snaptime);
            }).finally(function() {
                showModal({
                    templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/shareCitation.modal.html",
                    controller: "ShareCitationController",
                    windowClass: "chaise-share-citation",
                    controllerAs: "ctrl",
                    resolve: {
                        params: params
                    }
                }, false, false, false); // not defining any extra callbacks

                defer.resolve();
            });

            return defer.promise;
        }

        return {
            showModal: showModal,
            getSearchPopupSize: getSearchPopupSize,
            openSharePopup: openSharePopup
        };
    }])

    /**
     * Controller used to show the modal popup for confirming an action.
     *
     * parameters that we will look for:
     * - action {String=} - the message shown in the modal header (optional)
     * - message {String=} - the message for the body of the modal (optional)
     * - buttonAction {String=} - the confirm button label (optional)
     */
    .controller('ConfirmModalController', ['params', '$uibModalInstance', function (params, $uibModalInstance) {
        var vm = this;
        vm.params = params;

        vm.ok = function () {
            $uibModalInstance.close();
        }

        vm.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        }
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
    .controller('ErrorModalController', ['ConfigUtils', 'Errors', 'logService', 'messageMap', 'params', 'Session', 'UriUtils', '$rootScope', '$sce', '$uibModalInstance', '$window', function ErrorModalController(ConfigUtils, Errors, logService, messageMap, params, Session, UriUtils, $rootScope, $sce, $uibModalInstance, $window) {
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
        vm.showOkBtn = true;
        var notAllowedPermissionAccess = (vm.params.exception instanceof Errors.UnauthorizedAssetAccess  || vm.params.exception instanceof Errors.ForbiddenAssetAccess)
        vm.showDownloadPolicy = (notAllowedPermissionAccess && cc.assetDownloadPolicyURL && cc.assetDownloadPolicyURL.trim().length > 0 && typeof cc.assetDownloadPolicyURL == "string");
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
        } else if (exception instanceof Errors.NoRecordRidError) {
            vm.clickActionMessage = exception.errorData.clickActionMessage;
        } else if (exception instanceof Errors.DifferentUserConflictError) {
            vm.showOkBtn = false;
            vm.showReloadBtn = exception.showReloadBtn;
            vm.showContinueBtn = exception.showContinueBtn;
            // contains the `reloadMessage` already since it's customized in the error
            vm.clickActionMessage = exception.errorData.clickActionMessage;
            vm.continueMessage = exception.errorData.continueMessage;
            vm.continueBtnText = exception.errorData.continueBtnText;

            vm.continue = function () {
                exception.errorData.continueCB($uibModalInstance);
            }

            vm.switchUserAccounts = function () {
                $window.open(UriUtils.chaiseDeploymentPath() + 'lib/switchUserAccounts.html', '_blank');
            }
        } else if ( (exception instanceof Errors.CustomError && exception.errorData.clickActionMessage) || notAllowedPermissionAccess) {
            vm.clickActionMessage = exception.errorData.clickActionMessage;
        } else if (ERMrest && exception instanceof ERMrest.InvalidFilterOperatorError) {
            vm.clickActionMessage = messageMap.clickActionMessage.noRecordsFound;
        } else if (ERMrest && exception instanceof ERMrest.UnsupportedFilters) {
            vm.clickActionMessage = messageMap.clickActionMessage.unsupportedFilters;
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
            $rootScope.error = false;

            // NOTE: Doing this in recordedit allows the user to dismiss the browser reload popup and see the app
            // basically allowing the modal to be dismissed
            $uibModalInstance.close();
        };

        vm.cancel = function cancel() {
            $rootScope.error = false;

            $uibModalInstance.dismiss('cancel');
        };

        vm.reload = function () {
            $window.location.reload();
        };

        vm.login = function () {
            Session.loginInAPopUp(logService.logActions.LOGIN_ERROR_MODAL);  //Open login pop-up without closing error modal
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
    .controller('LoginDialogController', ['logService', 'params', 'Session', '$uibModalInstance', function LoginDialogController(logService, params, Session, $uibModalInstance) {
        var vm = this;
        vm.params = params;

        vm.openWindow = function() {
            Session.loginInAPopUp(logService.logActions.LOGIN_LOGIN_MODAL);
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
    .controller('SearchPopupController', ['ConfigUtils', 'DataUtils', 'params', 'Session', 'logService', 'modalBox', 'recordsetDisplayModes', '$rootScope', '$timeout', '$uibModalInstance',
        function SearchPopupController(ConfigUtils, DataUtils, params, Session, logService, modalBox, recordsetDisplayModes, $rootScope, $timeout, $uibModalInstance) {
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
        var showFaceting = chaiseConfig.showFaceting ? params.showFaceting : false;

        var logStack = {};
        if (params.logStack) {
            // add the picker indication to the stack
            logStack = logService.addExtraInfoToStack(params.logStack, {picker: 1});
        }

        vm.tableModel = {
            readyToInitialize:  true,
            hasLoaded:          false,
            reference:          reference,
            displayname:        params.displayname ? params.displayname : null,
            comment:            (typeof params.comment === "string") ? params.comment: null,
            columns:            reference.columns,
            sortby:             reference.location.sortObject ? reference.location.sortObject[0].column: null,
            sortOrder:          reference.location.sortObject ? (reference.location.sortObject[0].descending ? "desc" : "asc") : null,
            enableSort:         true,
            pageLimit:          limit,
            rowValues:          [],
            selectedRows:       params.selectedRows,
            matchNotNull:       params.matchNotNull,
            matchNull:          params.matchNull,
            search:             reference.location.searchTerm,
            config:             {
                viewable:           false,
                deletable:          (typeof params.allowDelete === "boolean") ? params.allowDelete : false, // saved query mode we want to allow delete (per row)
                editable:           (typeof params.editable === "boolean") ? params.editable : true,
                selectMode:         params.selectMode,
                showFaceting:       showFaceting,
                facetPanelOpen:     params.facetPanelOpen,
                showNull:           params.showNull === true,
                hideNotNullChoice:  params.hideNotNullChoice,
                hideNullChoice:     params.hideNullChoice,
                displayMode:        params.displayMode ? params.displayMode : recordsetDisplayModes.popup,
                enableFavorites:     params.enableFavorites ? params.enableFavorites : false
            },
            getDisabledTuples:          params.getDisabledTuples,

            // log related attributes
            logStack:                  logStack,
            logStackPath:              params.logStackPath ? params.logStackPath : null,
            logAppMode:                params.logAppMode ? params.logAppMode : null,

            // used for the recordset height and sticky section logic
            // TODO different modals should pass different strings (ultimatly it should be the element and not selector)
            parentContainerSelector:    ".search-popup .modal-content",
            parentStickyAreaSelector:   ".search-popup .modal-header",

            // used for displayname logic
            parentReference:    params.parentReference ? params.parentReference : null,
            parentTuple:        params.parentTuple ? params.parentTuple : null
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
         * TODO remove matchNotNull from here
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
            if (vm.params.submitBeforeClose) {
                vm.params.submitBeforeClose(getMultiSelectionResult());
            } else {
                $uibModalInstance.close(getMultiSelectionResult());
            }
        }

        function cancel() {
            if (vm.tableModel.logStackPath && vm.tableModel.logStack) {
                logService.logClientAction(
                    {
                        action: logService.getActionString(logService.logActions.CANCEL, vm.tableModel.logStackPath),
                        stack: vm.tableModel.logStack
                    },
                    vm.tableModel.reference.defaultLogInfo
                );
            }

            $uibModalInstance.dismiss("cancel");
        }
    }])

    .controller('profileModalDialogController', ['$uibModalInstance','$rootScope', 'ConfigUtils', 'Session','UriUtils',function ($uibModalInstance, $rootScope, ConfigUtils, Session, UriUtils){
        var dcctx = ConfigUtils.getContextJSON();
        var vm = this;
        vm.globusGroupList = [];
        vm.otherGroups = [];
        vm.identities = [];
        vm.client = {};
        vm.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };
        var session = Session.getSessionValue();
        vm.client = session.client;

        var user = vm.user = dcctx.user;
        for(var i = 0; i<session.client.identities.length; i++){
            vm.identities.push(session.client.identities[i]);
        }

        for(var i = 0; i<session.attributes.length; i++){
            if(session.attributes[i].display_name && session.attributes[i].display_name !== user.display_name && vm.identities.indexOf(session.attributes[i].id) == -1){
                if (session.attributes[i].id.indexOf("https://auth.globus.org/") === 0) {
                    session.attributes[i].truncatedId = session.attributes[i].id.substring(24);
                    vm.globusGroupList.push(session.attributes[i]);
                } else {
                    vm.otherGroups.push(session.attributes[i]);
                }
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
     *   - {String} title (optional) - will be displayed in the modal title
     *   - {boolean} hideCitation (optional) - hide the citation section
     *   - {boolean} hideHeader (optional) - hides all the section headers.
     *   - {Object[]} extraInformation (optional) - An array of objects that will be displayed. Each element can be either
     *                {value: "string", title: "string"} or {title: "string", value: "string", link: "string", type: "link"}
     *   - {Object} logStackPath (optional) - if you want to change the default log stack path of the app
     *   - {Object} logStack (optional) - if you want to change the default log stack object of the app
     */
    .controller('ShareCitationController', ['logService', 'params', '$rootScope', '$uibModalInstance', '$window', function (logService, params, $rootScope, $uibModalInstance, $window) {
        var vm = this;

        // uses the $rootScope.citationReady to determine whether the citation is ready
        // then gets the citation value from $rootScope.citation and generates the bibtextURL
        var generateBibtexURL = function () {
            if (!$rootScope.citationReady) {
                vm.citation = null;
                vm.citationReady = false;
                return;
            }

            var citation = $rootScope.citation;

            vm.citation = citation;
            vm.citationReady = true;

            // it might be null
            if (!vm.citation) return;

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

        vm.params = params;
        vm.logActions = logService.logActions;

        // run the function once in case the citation is ready on load
        generateBibtexURL();

        vm.warningMessage = "The displayed content may be stale due to recent changes made by other users. You may wish to review the changes prior to sharing the <a ng-href='{{ctrl.params.permalink}}'>live link</a> below. Or, you may share the older content using the <a ng-href='{{ctrl.params.versionLink}}'>versioned link</a>.";

        vm.moreThanWeek = function () {
            var weekAgo = moment().subtract(7, 'days').startOf('day');
            var versionMoment = moment(params.versionDate);

            return weekAgo.isAfter(versionMoment);
        }

        vm.copyToClipboard = function (text, action) {
            logService.logClientAction({
                action: logService.getActionString(action, params.logStackPath),
                stack: params.logStack ? params.logStack : logService.getStackObject()
            }, params.reference.defaultLogInfo);
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

        vm.logCitationDownload = function (action) {
            logService.logClientAction({
                action: logService.getActionString(action, params.logStackPath),
                stack: params.logStack ? params.logStack : logService.getStackObject()
            }, params.reference.defaultLogInfo);
        }

        vm.closeAlert = function () {
            vm.params.showVersionWarning = false;
        }

        vm.cancel = function() {
            $uibModalInstance.dismiss('cancel');
        }

        // The citation might not be ready when we open the modal, so we should just watch for it
        $rootScope.$watch(function () {
            return $rootScope.citationReady;
        }, function () {
            generateBibtexURL();
        }, true);

    }])

    .controller('RedirectController', ['$interval', '$timeout', '$uibModalInstance', function ($interval, $timeout, $uibModalInstance) {
        var vm = this;
        vm.countdown = 5;
        vm.cancel = cancel;

        vm.redirectNow = function () {
            $interval.cancel(countdownTimer);
            $uibModalInstance.close();
        }

        // start a countdown that runs until the interval is cancelled
        var countdownTimer = $interval(function (){vm.countdown--}, 1000, 0);

        function cancel() {
            $interval.cancel(countdownTimer);
            $uibModalInstance.dismiss('cancel');
        }

        $timeout(function (){
            // close the dialog after 5 seconds and trigger success callback
            vm.redirectNow();
        }, 5000);
    }])

    .controller('MarkdownPreviewController', ['$scope', '$uibModalInstance', 'params', 'ERMrest', function MarkdownPreviewController($scope, $uibModalInstance, params) {
        var vm = this;

        var val = ERMrest.renderMarkdown(params.rawMarkdown);
        if (typeof val !== "string") {
            val = "";
        }
        vm.renderedMarkdown = val;

        function ok() {
            $uibModalInstance.close();
        }
        vm.cancel = function () {
            $uibModalInstance.dismiss("cancel");
        }
    }])

    .controller('SavedQueryModalDialogController', ['AlertsService', 'messageMap', 'params', '$scope', '$uibModalInstance', function SavedQueryModalDialogController(AlertsService, messageMap, params, $scope, $uibModalInstance) {
        var vm = this;
        vm.alerts = AlertsService.alerts;
        vm.columnModels = params.columnModels;
        vm.parentReference = params.parentReference;
        vm.savedQueryForm = params.rowData;

        vm.form = params.rowData;

        vm.submit = function () {
            if (vm.form.$invalid) {
                AlertsService.addAlert('Sorry, the data could not be submitted because there are errors on the form. Please check all fields and try again.', 'error');
                vm.form.$setSubmitted();
                return;
            }

            var row = vm.savedQueryForm.rows[0]

            // set id based on hash of `facets` columns
            row.query_id = SparkMD5.hash(JSON.stringify(row.facets));
            row.last_execution_time = "now";
            params.reference.create(vm.savedQueryForm.rows).then(function success(query) {
                // show success after close
                $uibModalInstance.close(query.successful);
            }, function error(error) {
                // show error without close

                // error handling when "facet blob" exists already and violates the uniqueness constraint
                // NOTE: this is hacky as it's assuming the only unique constraint on the table
                //       is because of duplicate facet definition
                if (ERMrest && error instanceof ERMrest.DuplicateConflictError) {
                    AlertsService.addAlert(messageMap.duplicateSavedQueryMessage, 'error');
                } else {
                    AlertsService.addAlert(error.message, 'error');
                }
            });
        }

        vm.cancel = function () {
            $uibModalInstance.dismiss("cancel");
        }
    }])

})();
