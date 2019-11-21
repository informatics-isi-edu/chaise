(function () {
    'use strict';

    angular.module('chaise.modal', ['chaise.utils'])

    //TODO
    .factory('modalUtils', ["UriUtils", "$log", "$uibModal", "$window", function (UriUtils, $log, $uibModal, $window) {

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
                try {
                    // angular.element(document.querySelector(".modal-body")).scrollTop(0);
                } catch (err) {
                    $log.warn(err);
                }
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

        return {
            showModal: showModal,
            getSearchPopupSize: getSearchPopupSize
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
        } else if ( (exception instanceof Errors.CustomError && exception.errorData.clickActionMessage) || notAllowedPermissionAccess) {
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
    .controller('SearchPopupController', ['ConfigUtils', 'DataUtils', 'params', 'Session', 'modalBox', 'logActions', 'recordsetDisplayModes', '$rootScope', '$timeout', '$uibModalInstance',
        function SearchPopupController(ConfigUtils, DataUtils, params, Session, modalBox, logActions, recordsetDisplayModes, $rootScope, $timeout, $uibModalInstance) {
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

        vm.tableModel = {
            readyToInitialize:  true,
            hasLoaded:          false,
            reference:          reference,
            displayname:   params.displayname ? params.displayname : null,
            comment:       (typeof params.comment === "string") ? params.comment: null,
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
                viewable: false, deletable: false,
                editable:           (typeof params.editable === "boolean") ? params.editable : true,
                selectMode:         params.selectMode,
                showFaceting:       showFaceting, facetPanelOpen: params.facetPanelOpen,
                showNull:           params.showNull === true,
                hideNotNullChoice:  params.hideNotNullChoice,
                hideNullChoice:     params.hideNullChoice,
                displayMode:        params.displayMode ? params.displayMode : recordsetDisplayModes.popup,
                parentDisplayMode:  params.parentDisplayMode
            },
            context:                    params.context,
            getDisabledTuples:          params.getDisabledTuples,
            logObject:                  params.logObject ? params.logObject: {},
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
            $uibModalInstance.close(getMultiSelectionResult());
        }

        function cancel() {
            $uibModalInstance.dismiss("cancel");
        }
    }])

    .controller('profileModalDialogController', ['$uibModalInstance','$rootScope', 'ConfigUtils', 'Session','UriUtils',function ($uibModalInstance, $rootScope, ConfigUtils, Session, UriUtils){
        var dcctx = ConfigUtils.getContextJSON();
        var vm = this;
        vm.groupList =[];
        vm.identities = [];
        vm.client = {};
        vm.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };
        var session = dcctx.session;
        vm.client = session.client;

        var user = vm.user = dcctx.user;
        for(var i = 0; i<session.client.identities.length; i++){
            vm.identities.push(session.client.identities[i]);
        }


        for(var i = 0; i<session.attributes.length; i++){
            if(session.attributes[i].display_name && session.attributes[i].display_name !== user.display_name){
                session.attributes[i].id = session.attributes[i].id.substring(24);
                vm.groupList.push(session.attributes[i]);
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
    .controller('ShareCitationController', ['logActions', 'logService', 'params', '$uibModalInstance', '$window', function (logActions, logService, params, $uibModalInstance, $window) {
        var vm = this;
        vm.params = params;
        vm.logActions = logActions;
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

        vm.copyToClipboard = function (text, action) {
            var copyLinkHeader = {
                action: action
            }

            logService.logClientAction(copyLinkHeader, params.reference.defaultLogInfo);
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

        vm.logCitationDownload = function () {
            var citationDownloadHeader = {
                action: logActions.cite
            }

            logService.logClientAction(citationDownloadHeader, params.reference.defaultLogInfo);
        }

        vm.closeAlert = function () {
            vm.params.showVersionWarning = false;
        }

        vm.cancel = function() {
            $uibModalInstance.dismiss('cancel');
        }
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

})();
