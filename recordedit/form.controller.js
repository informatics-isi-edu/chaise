(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .controller('FormController', ['AlertsService', 'ConfigUtils', 'dataFormats', 'DataUtils', 'ErrorService', 'InputUtils', 'integerLimits', 'logService', 'maskOptions', 'messageMap', 'modalBox', 'modalUtils', 'recordCreate', 'recordEditAppUtils', 'recordEditModel', 'recordsetDisplayModes', 'Session', 'UiUtils', 'UriUtils', '$cookies', '$document', '$log', '$rootScope', '$scope', '$timeout', '$window',
        function FormController(AlertsService, ConfigUtils, dataFormats, DataUtils, ErrorService, InputUtils, integerLimits, logService, maskOptions, messageMap, modalBox, modalUtils, recordCreate, recordEditAppUtils, recordEditModel, recordsetDisplayModes, Session, UiUtils, UriUtils, $cookies, $document, $log, $rootScope, $scope, $timeout, $window) {
        var vm = this;
        var context = ConfigUtils.getContextJSON();
        var chaiseConfig = ConfigUtils.getConfigJSON();
        vm.recordEditModel = recordEditModel;
        vm.dataFormats = dataFormats;
        vm.editMode = (context.mode == context.modes.EDIT ? true : false);
        vm.mdHelpLinks = { // Links to Markdown references to be used in help text
            editor: "https://jbt.github.io/markdown-editor/#RZDLTsMwEEX3/opBXQCRmqjlsYBVi5CKxGOBWFWocuOpM6pjR54Jbfl6nKY08mbO1dwj2yN4pR+ENx23Juw8PBuSEJU6B3zwovdgAzIED1IhONwINNqjezxyRG6dkLcQWmlaAWIwxI3TBzT/pUi2klypLJsHZ0BwL1kGSq1eRDsq6Rf7cKXUCBaoTeebJBho2tGAN0cc+LbnIbg7BUNyr9SnrhuH6dUsCjKYNYm4m+bap3McP6L2NqX/y+9tvcaYLti3Jvm5Ns2H3k0+FBdpvfsGDUvuHY789vuqEmn4oShsCNZhXob6Ou+3LxmqsAMJQL50rUHQHqjWFpW6WM7gpPn6fAIXbBhUUe9yS1K1605XkN+EWGuhksfENEbTFmWlibGoNQvG4ijlouVy3MQE8cAVoTO7EE2ibd54e/0H",
            cheatsheet: "http://commonmark.org/help/"
        };
        vm.isRequired = isRequired;
        vm.isDisabled = isDisabled;
        vm.getDisabledInputValue = getDisabledInputValue;

        vm.alerts = AlertsService.alerts;
        vm.closeAlert = AlertsService.deleteAlert;

        vm.submit = submit;
        vm.readyToSubmit = false;
        vm.submissionButtonDisabled = false;
        vm.successfulSubmission = false;
        vm.showSelectAll = false;
        vm.redirectAfterSubmission = redirectAfterSubmission;
        vm.searchPopup = searchPopup;
        vm.createRecord = createRecord;
        vm.showRemove = showRemove;
        vm.clearInput = clearInput;
        vm.clearForeignKey = clearForeignKey;

        // placeholder for the color picker callbacks
        vm.toggleColorPickerCallbacks = [{}];

        vm.MAX_ROWS_TO_ADD = context.MAX_ROWS_TO_ADD;
        vm.numberRowsToAdd = 1;
        vm.showMultiInsert = false;
        vm.copyFormRow = copyFormRow;
        vm.removeFormRow = removeFormRow;

        vm.inputType = null;
        vm.int2min = integerLimits.INT_2_MIN;
        vm.int2max = integerLimits.INT_2_MAX;
        vm.int4min = integerLimits.INT_4_MIN;
        vm.int4max = integerLimits.INT_4_MAX;
        vm.int8min = integerLimits.INT_8_MIN;
        vm.int8max = integerLimits.INT_8_MAX;

        vm.booleanValues = booleanValues;

        vm.applyCurrentDatetime = applyCurrentDatetime;
        vm.toggleMeridiem = toggleMeridiem;
        vm.clearDatetime = clearDatetime;
        vm.clearDate = clearDate;
        vm.clearTime = clearTime;

        vm.fileExtensionTypes = InputUtils.fileExtensionTypes;
        vm.blurElement = InputUtils.blurElement;
        vm.maskOptions = maskOptions;
        vm.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

        vm.customErrorMessage = [];

        // Takes a page object and uses the uri generated for the reference to construct a chaise uri
        function redirectAfterSubmission(page) {
            var rowset = vm.recordEditModel.rows,
                redirectUrl = "../";

            // If no page arg provided, it means no submission to ERMrest was made because user made no changes while editing a record
            if (typeof page === 'undefined') {
                // Default the page arg to the existing $rootScope in order to allow retrieval of catalog and compactPath info under via page.reference later
                page = $rootScope;
            }

            // Created a single entity or Updated one
            if (rowset.length == 1) {
                AlertsService.addAlert('Your data has been submitted. Redirecting you now to the record...', 'success');
                // TODO can be replaced with page.reference.appLink.detailed
                redirectUrl += "record/#" + page.reference.location.catalog + '/' + page.reference.location.compactPath;
            } else {
                AlertsService.addAlert('Your data has been submitted. Redirecting you now to the recordset...', 'success');
                // TODO can be replaced with page.reference.appLink.compact
                redirectUrl += "recordset/#" + page.reference.location.catalog + '/' + page.reference.location.compactPath;
            }

            // append pcid
            var qCharacter = redirectUrl.indexOf("?") !== -1 ? "&" : "?";
            var contextHeaderParams = ConfigUtils.getContextHeaderParams();
            // Redirect to record or recordset app..
            $window.location = redirectUrl + qCharacter + "pcid=" + contextHeaderParams.cid + "&ppid=" + contextHeaderParams.pid;
        }

        /**
         * onSuccess - callback after results are added
         *
         * @param  {object} model  model contains updated record object
         * @param  {object} result object has result messages
         */
        function onSuccess (model, result){
            var page = result.successful,
                failedPage = result.failed,
                disabledPage = result.disabled;

            vm.successfulSubmission = true;
            if (model.rows.length == 1) {
                vm.redirectAfterSubmission(page);
            } else {
                AlertsService.addAlert("Your data has been submitted. Showing you the result set...", "success");

                var resultsReference = page.reference;
                // NOTE currently this has been added just to make sure nothing is broken,
                // but it's not used since the displayed table doesn't have any controls.
                // if we end up adding more controls and needed to log them, we might want to
                // revisit the filters that we're logging here.
                var logStackNode = logService.getStackNode(
                    logService.logStackTypes.SET,
                    resultsReference.table,
                    resultsReference.filterLogInfo
                );

                // includes identifiers for specific records modified
                // TODO: the above comment seems wrong
                // NOTE: I think we are using the base reference for the page so we go to either an unconstrained recordset (multi create)
                // or a constrained recordset (multi edit we entered recordedit with)
                vm.resultsetRecordsetLink = $rootScope.reference.contextualize.compact.appLink;

                // set values for the view to flip to recordedit resultset view
                vm.resultsetModel = {
                    hasLoaded: true,
                    reference: resultsReference,
                    enableSort: false,
                    sortby: null,
                    sortOrder: null,
                    page: page,
                    pageLimit: model.rows.length,
                    rowValues: DataUtils.getRowValuesFromTuples(page.tuples),
                    selectedRows: [],
                    search: null,
                    config: {
                        viewable: false,
                        editable: false,
                        deletable: false,
                        selectMode: modalBox.noSelect, //'no-select'
                        displayMode: recordsetDisplayModes.table
                    },
                    logStack: logService.getStackObject(logStackNode),
                    logStackPath: logService.getStackPath("", logService.logStackPaths.RESULT_SUCCESFUL_SET)
                };

                if (failedPage !== null) {
                    var failedReference = failedPage.reference;

                    vm.omittedResultsetModel = {
                        hasLoaded: true,
                        reference: failedReference,
                        enableSort: false,
                        sortby: null,
                        sortOrder: null,
                        page: failedPage,
                        pageLimit: model.rows.length,
                        rowValues: DataUtils.getRowValuesFromTuples(failedPage.tuples),
                        selectedRows: [],
                        search: null,
                        config: {
                            viewable: false,
                            editable: false,
                            deletable: false,
                            selectMode: modalBox.noSelect,
                            displayMode: recordsetDisplayModes.table
                        },
                        logStack: logService.getStackObject(logStackNode),
                        logStackPath: logService.getStackPath("", logService.logStackPaths.RESULT_FAILED_SET)
                    };
                }

                // NOTE: This case is for the unchanged rows
                // When multiple rows are updated and a smaller set is returned,
                // the user doesn't have permission to update those rows based on row-level security
                if (disabledPage !== null) {
                    var disabledReference = disabledPage.reference;

                    vm.disabledResultsetModel = {
                        hasLoaded: true,
                        reference: disabledReference,
                        enableSort: false,
                        sortby: null,
                        sortOrder: null,
                        page: disabledPage,
                        pageLimit: model.rows.length,
                        rowValues: DataUtils.getRowValuesFromTuples(disabledPage.tuples),
                        selectedRows: [],
                        search: null,
                        config: {
                            viewable: false,
                            editable: false,
                            deletable: false,
                            selectMode: modalBox.noSelect,
                            displayMode: recordsetDisplayModes.table
                        },
                        logStack: logService.getStackObject(logStackNode),
                        logStackPath: logService.getStackPath("", logService.logStackPaths.RESULT_DISABLED_SET)
                    };
                }

                vm.resultset = true;
                // delay updating the height of DOM elements so the current digest cycle can complete and "show" the resultset view
                $timeout(function() {
                    // remove the old resize sensors since we're switching the display to resultset
                    detachResizeSensors();

                    // create new resize sensors for the resultset view
                    attachResizeSensors();
                }, 0);
            }
        }

        function submit() {
            var originalTuple,
                editOrCopy = true,
                form = vm.formContainer,
                model = vm.recordEditModel;

            angular.element(document.getElementsByClassName('main-container')[0]).scrollTo(0, 0, 500);
            if (form.$invalid) {
                vm.readyToSubmit = false;
                AlertsService.addAlert('Sorry, the data could not be submitted because there are errors on the form. Please check all fields and try again.', 'error');
                form.$setSubmitted();
                return;
            }

            // Form data is valid, time to transform row values for submission to ERMrest
            vm.readyToSubmit = true;
            vm.submissionButtonDisabled = true;
            // close allInput if open to ensure data is submission ready
            model.columnModels.forEach(function (cm, index) {
                if (cm.showSelectAll) vm.cancelSelectAll(index);
            });

            for (var j = 0; j < model.rows.length; j++) {
                // in the copy case, there will only ever be one tuple. Each additional form should be based off of the original tuple
                if (vm.editMode) {
                    originalTuple = $rootScope.tuples[j];
                } else if (context.queryParams.copy) {
                    originalTuple = $rootScope.tuples[0];
                } else {
                    originalTuple = null;
                    editOrCopy = false;
                }
                recordCreate.populateSubmissionRow(
                    model.rows[j],
                    model.submissionRows[j],
                    $rootScope.reference,
                    originalTuple,
                    editOrCopy,
                    vm.editMode ? model.canUpdateRows[j] : null
                );
            }
            recordCreate.addRecords(vm.editMode, null, vm.recordEditModel, false, $rootScope.reference, $rootScope.tuples, context.queryParams, vm, onSuccess, context.logObject);
        }

        function onDelete() {
            var uri;
            var ref = $rootScope.reference.unfilteredReference.contextualize.compact;

            if (chaiseConfig.showFaceting) {
                uri = ref.appLink;
            } else {
                var table = ref.table;
                var encode = UriUtils.fixedEncodeURIComponent;
                uri = "../search/#" + table.schema.catalog.id + '/' + encode(table.schema.name) + ':' + encode(table.name);
            }

            $rootScope.showSpinner = false;
            $window.location.href = uri;
        }

        // NOTE: If changes are made to this function, changes should also be made to the similar function in the inputSwitch directive
        // TODO: remove when RE has been refactored to use the inputSwitch directive for all form inputs
        function searchPopup(rowIndex, column, columnIndex) {
            var originalTuple,
                editOrCopy = true,
                params = {};

            // pass the reference as a param for the modal
            // call to page with tuple to get proper reference
            if (vm.editMode) {
                originalTuple = $rootScope.tuples[rowIndex];
            }else if (context.queryParams.copy) {
                originalTuple = $rootScope.tuples[0];
            } else {
                originalTuple = null;
                editOrCopy = false;
            }

            var submissionRow = recordCreate.populateSubmissionRow(
                vm.recordEditModel.rows[rowIndex],
                vm.recordEditModel.submissionRows[rowIndex],
                $rootScope.reference,
                originalTuple,
                editOrCopy,
                vm.editMode ? vm.recordEditModel.canUpdateRows[rowIndex] : null
            );

            // used for title
            params.parentReference = $rootScope.reference;
            params.parentTuple = originalTuple;
            params.displayname = column.displayname;

            params.displayMode = vm.editMode ? recordsetDisplayModes.foreignKeyPopupEdit : recordsetDisplayModes.foreignKeyPopupCreate;

            var andFilters = [];
            // loop through all columns that make up the key information for the association with the leaf table and create non-null filters
            column.foreignKey.key.colset.columns.forEach(function (col) {
                andFilters.push({
                    "source": col.name,
                    "hidden": true,
                    "not_null": true
                });
            });

            // add not null filters for key information
            params.reference = column.filteredRef(submissionRow, vm.recordEditModel.foreignKeyData[rowIndex]).addFacets(andFilters).contextualize.compactSelect;

            params.selectedRows = [];
            params.selectMode = modalBox.singleSelectMode;
            params.showFaceting = true;
            params.facetPanelOpen = false;

            var columnModel = vm.recordEditModel.columnModels[columnIndex];
            params.logStack = recordCreate.getColumnModelLogStack(columnModel);
            params.logStackPath = logService.getStackPath("", logService.logStackPaths.FOREIGN_KEY_POPUP);

            modalUtils.showModal({
                animation: false,
                controller: "SearchPopupController",
                windowClass: "search-popup foreignkey-popup",
                controllerAs: "ctrl",
                resolve: {
                    params: params
                },
                size: modalUtils.getSearchPopupSize(params),
                templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/searchPopup.modal.html"
            }, function dataSelected(tuple) {
                // tuple - returned from action in modal (should be the foreign key value in the recrodedit reference)
                // set data in view model (model.rows) and submission model (model.submissionRows)

                // udpate the foreign key data
                vm.recordEditModel.foreignKeyData[rowIndex][column.foreignKey.name] = tuple.data;

                // make sure the spinner is not showing
                if ($rootScope.showColumnSpinner[rowIndex] && $rootScope.showColumnSpinner[rowIndex][column.name]) {
                    $rootScope.showColumnSpinner[rowIndex][column.name] = false;
                }

                var foreignKeyColumns = column.foreignKey.colset.columns;
                for (var i = 0; i < foreignKeyColumns.length; i++) {
                    var referenceCol = foreignKeyColumns[i];
                    var foreignTableCol = column.foreignKey.mapping.get(referenceCol);

                    vm.recordEditModel.submissionRows[rowIndex][referenceCol.name] = tuple.data[foreignTableCol.name];
                }

                vm.recordEditModel.rows[rowIndex][column.name] = tuple.displayname.value;

                // call resize function in case the rowname is long enough to span 2+ lines
                resizeColumns(true);
            }, null, false);
        }

        // idx - the index of the form
        // name - the name of the column
        // typename - column type
        // input - used for timestamp inputs to distinguish date from time
        function showRemove(idx, name, typename, input) {
            var value = null,
                valueHiddenByValidator = false;

            if (typename == "timestamp" || typename == "timestamptz") {
                value = vm.recordEditModel.rows[idx][name] && vm.recordEditModel.rows[idx][name][input];
                valueHiddenByValidator = vm.formContainer.row[idx][name].$error[input];
            } else if (typename == "boolean") {
                value = vm.recordEditModel.rows[idx][name] !== null;
                valueHiddenByValidator = vm.formContainer.row[idx][name].$invalid && !vm.formContainer.row[idx][name].$error.required;
            } else {
                value = vm.recordEditModel.rows[idx][name];
                valueHiddenByValidator = vm.formContainer.row[idx][name].$invalid && !vm.formContainer.row[idx][name].$error.required;
            }

            return value || valueHiddenByValidator;
        }

        // idx - the index of the form
        // name - the name of the column
        function clearInput(idx, name) {
            vm.recordEditModel.rows[idx][name] = null;
        }

        // NOTE: If changes are made to this function, changes should also be made to the similar function in the inputSwitch directive
        // TODO: remove when RE has been refactored to use the inputSwitch directive for all form inputs
        function clearForeignKey(rowIndex, column) {
            var model = vm.recordEditModel;

            model.foreignKeyData[rowIndex][column.foreignKey.name] = null;
            if ($rootScope.showColumnSpinner[rowIndex] && $rootScope.showColumnSpinner[rowIndex][column.name]) {
                $rootScope.showColumnSpinner[rowIndex][column.name] = false;
            }

            var foreignKeyColumns = column.foreignKey.colset.columns;
            for (var i = 0; i < foreignKeyColumns.length; i++) {
                var referenceCol = foreignKeyColumns[i];

                delete model.submissionRows[rowIndex][referenceCol.name];
                // Note: this conditional is for clearing `tuple.data` for update
                // we rely on the data property to compare against the old data to verify what has changed
                if ($rootScope.tuples && $rootScope.tuples[rowIndex]) $rootScope.tuples[rowIndex].data[referenceCol.name] = null;
            }

            model.rows[rowIndex][column.name] = null;
        }

        function createRecord(column) {
            $window.open(column.reference.contextualize.entryCreate.appLink, '_blank');
        }

        /**
         * what we capture in rows are not always simple objects and
         * we should manually copy in those cases. this includes:
         *   - asset column: for these columns we are storing the object
         */
        function copyRow (row) {
            var res = {}, k, colValue;
            $rootScope.reference.columns.forEach(function (col, colIndex) {
                colValue = row[col.name];
                if (col.isAsset) {

                    // make sure it is not null
                    if (!DataUtils.isObjectAndNotNull(colValue)) return;

                    res[col.name] = {};

                    // copy each value individually
                    for (k in colValue) {
                        if (!colValue.hasOwnProperty(k)) return;
                        if (k === "hatracObj") {
                            res[col.name].hatracObj = new ERMrest.Upload(colValue.file, {
                                column: col,
                                reference: $rootScope.reference
                            });
                        } else {
                            // one of the values is file object, based on my testing
                            // it seems like passing the value this way is fine.
                            // we should avoid angular.copy since based on the
                            // angular documentation it has known issues with File object
                            res[col.name][k] = colValue[k];
                        }
                    }

                    return;
                }

                // for other columns we can just copy the value
                res[col.name] = angular.copy(colValue);
            });

            // there might be some data for the columns that are not visible
            if (DataUtils.isObjectAndNotNull(row)) {
                for (k in row) {
                    if (row.hasOwnProperty(k) && !(k in res)) {
                        res[k] = angular.copy(row[k]);
                    }
                }
            }

            return res;
        }

        function copyFormRow() {
            if (!vm.numberRowsToAdd) vm.numberRowsToAdd = 1;

            // log the button was clicked
            var action = logService.logActions.FORM_CLONE,
                stack = logService.getStackObject();

            if (vm.numberRowsToAdd > 1) {
                action = logService.logActions.FORM_CLONE_X;
                stack = logService.addExtraInfoToStack(null, {clone: vm.numberRowsToAdd});
            }

            logService.logClientAction({
                action: logService.getActionString(action),
                stack: stack
            }, $rootScope.reference.defaultLogInfo);

            if ((vm.numberRowsToAdd + vm.recordEditModel.rows.length) > vm.MAX_ROWS_TO_ADD) {
                AlertsService.addAlert("Cannot add " + vm.numberRowsToAdd + " records. Please input a value between 1 and " + (vm.MAX_ROWS_TO_ADD - vm.recordEditModel.rows.length) + ', inclusive.', 'error');
                return true;
            }
            // Check if the prototype row to copy has any invalid values. If it
            // does, display an error. Otherwise, copy the row.
            var index = vm.recordEditModel.rows.length - 1;
            var protoRowValidityStates = vm.formContainer.row[index];
            var validRow = true;
            Object.keys(protoRowValidityStates).some(function(key) {
                var value = protoRowValidityStates[key];
                if (value.$dirty && value.$invalid) {
                    vm.readyToSubmit = false, validRow = false;
                    AlertsService.addAlert("Sorry, we can't copy this record because it has invalid values in it. Please check its fields and try again.", "error");
                    return true;
                }
            });

            if (validRow) {
                for (var i = 0; i < vm.numberRowsToAdd; i++) {

                    var row = copyRow(vm.recordEditModel.rows[index]);
                    var submissionRow = copyRow(vm.recordEditModel.submissionRows[index]);
                    var foreignKeyData = angular.copy(vm.recordEditModel.foreignKeyData[index]);

                    vm.recordEditModel.rows.push(row);
                    vm.recordEditModel.submissionRows.push(submissionRow);
                    vm.recordEditModel.foreignKeyData.push(foreignKeyData);
                }
                vm.showMultiInsert = false;
                vm.numberRowsToAdd = 1;

                $timeout(function() {
                    onResize();
                }, 10);
            }
        }

        function spliceRows(index) {
            vm.recordEditModel.rows.splice(index, 1);
            vm.recordEditModel.oldRows.splice(index, 1);
            vm.recordEditModel.submissionRows.splice(index, 1);
            vm.recordEditModel.foreignKeyData.splice(index, 1);
            if (vm.editMode) {
                vm.recordEditModel.canUpdateRows.splice(index, 1);
                $rootScope.tuples.splice(index, 1);
                // when some rows has changed, we should make sure the errors are updated
                vm.recordEditModel.columnModels.forEach(function (cm) {
                    recordCreate.populateColumnPermissionError(vm.recordEditModel, cm);
                });
                vm.showColumnPermissionError = [];
            }
            $timeout(function() {
                onResize();
                $rootScope.showSpinner = false;
            }, 10);
        }

        function removeFormRow(index) {
            scope.$root.showSpinner = true;

            var defaultLogInfo = (vm.editMode ? $rootScope.tuples[index].reference.defaultLogInfo : $rootScope.reference.defaultLogInfo);

            logService.logClientAction({
                action: logService.getActionString(logService.logActions.FORM_REMOVE),
                stack: logService.getStackObject()
            }, defaultLogInfo);

            return spliceRows(index);
        }

        function getDisabledInputValue(column, value) {
            var disabledValue = InputUtils.getDisabledInputValue(column);
            // if value is empty string and we are in edit mode, use the previous value
            if (disabledValue == '' && context.mode == context.modes.EDIT) {
                disabledValue = value;
            }

            return disabledValue;
        }

        // returns columnModel.booleanArray for use in boolean dropdown
        function booleanValues(colIndex) {
            return vm.recordEditModel.columnModels[colIndex].booleanArray;
        }

        // Assigns the current date or timestamp to a column's model
        function applyCurrentDatetime(modelIndex, columnName, columnType) {
            vm.recordEditModel.rows[modelIndex][columnName] = InputUtils.applyCurrentDatetime(columnType);
        }

        // Toggle between AM/PM for a time input's model
        function toggleMeridiem(modelIndex, columnName) {
            var model = vm.recordEditModel.rows[modelIndex][columnName];
            // If the entire timestamp model doesn't exist, initialize it with a default meridiem before toggling
            if (!model) model = {meridiem: 'AM'};

            // Do the toggling
            model.meridiem = InputUtils.toggleMeridiem(model.meridiem);
        }

        // resets timestamp[tz] values and sets the rest to null
        function clearDatetime(modelIndex, columnName, columnType) {
            vm.recordEditModel.rows[modelIndex][columnName] = InputUtils.clearDatetime(columnType);
        }

        // clears the date for timestamp[tz] inputs
        function clearDate(modelIndex, columnName) {
            vm.recordEditModel.rows[modelIndex][columnName].date = null;
        }

        // clears the time for timestamp[tz] inputs
        function clearTime(modelIndex, columnName) {
            vm.recordEditModel.rows[modelIndex][columnName].time = null;
        }

        function isRequired(columnIndex) {
            var cm = vm.recordEditModel.columnModels[columnIndex];
            return cm && cm.isRequired;
        }

        /**
         * - we're showing the select-all control
         * - column is marked as disabled by annotation
         * - in edit mode and column in the row is marked as disabled by acl
         */
        function isDisabled(columnIndex, rowIndex) {
            var cm = vm.recordEditModel.columnModels[columnIndex];
            if (!cm) return false;

            // model based
            if (cm.isDisabled || cm.showSelectAll) return true;

            // row based in edit mode
            if (vm.editMode) {
                var canUpdateRow = vm.recordEditModel.canUpdateRows[rowIndex];
                if (canUpdateRow && !canUpdateRow[cm.column.name]) {
                    return true;
                }
            }

            return false;
        }

        // when a boolean dropdown is opened, resize the dropdown menu to match the width of the input
        vm.setDropdownWidth = function () {
            // All boolean are visible and same size so it doesn't matter which is selected
            var input = document.querySelector('.re-boolean-input');

            // make sure input is present before setting value
            // NOTE: this triggers on resize (and there may be no boolean inputs)
            if (input) {
                // ng-style attached for better repositioning
                vm.inputWidth = {
                    width: input.offsetWidth + 'px',
                    "margin-top": '14px'
                };
            }
        }

// **** Functions for set all input
        var selectAllOpen = false;

        function closeAllInput (model) {
            // reset column view model values
            model.showSelectAll = false;
            model.highlightRow = false;
            selectAllOpen = false;
        }

        vm.canShowSelectAllBtn = function (columnIndex) {
            var model = vm.recordEditModel.columnModels[columnIndex];
            // if we're already showing the select-all UI, then we have to show the button
            if (model.showSelectAll) {
                return true;
            }

            // in this case we want to show the button and instead disable it
            if (vm.editMode && vm.recordEditModel.columnPermissionError && vm.recordEditModel.columnPermissionError[model.column.name]) {
                return true;
            }

            // it must be multi-row, column must not be disabled,
            // and at least one row can be edited (if in edit mode)
            if (vm.recordEditModel.rows.length < 2) return false;
            if (model.isDisabled) return false;

            return !vm.editMode || vm.recordEditModel.canUpdateRows.some(function (item) {
                return item[model.column.name];
            });
        };

        // if because of column-level acl some rows cannot be edited, select-all should be disabled.
        vm.disableSelectAllBtn = function (columnIndex) {
            var model = vm.recordEditModel.columnModels[columnIndex];
            return vm.editMode && vm.recordEditModel.columnPermissionError[model.column.name];
        }

        /**
         * this function will be called when user toggles the select-all panel. it will,
         * - log the client action
         * - set the boolean flags
         * - convert the values from disabled mode to interactable mode or vice versa.
         */
        vm.toggleSelectAll = function toggleSelectAll(index) {
            var model = vm.recordEditModel.columnModels[index];

            var defaultLogInfo = (model.column.reference ? model.column.reference.defaultLogInfo : $rootScope.reference.defaultLogInfo);

            var action = model.showSelectAll ? logService.logActions.SET_ALL_CLOSE : logService.logActions.SET_ALL_OPEN;
            logService.logClientAction({
                action: recordCreate.getColumnModelLogAction(action, model),
                stack: recordCreate.getColumnModelLogStack(model)
            }, defaultLogInfo);

            if (selectAllOpen) {
                // close the other select all dialog first
                vm.recordEditModel.columnModels.forEach(function (cm, idx) {
                    // don't change the state of the current one
                    if (idx === index) return;

                    cm.showSelectAll = false;
                    cm.highlightRow = false;
                });
            }

            model.showSelectAll = !model.showSelectAll;
            model.highlightRow = !model.highlightRow;
            // This should match the current column model property
            selectAllOpen = model.showSelectAll;

            // change view/display model value into an object or string depending on state
            vm.recordEditModel.columnModels.forEach(function (cm) {
                vm.recordEditModel.rows.forEach(function (row, index) {
                    // if column cannot be updated don't do anything
                    if (vm.editMode && !vm.recordEditModel.canUpdateRows[index][cm.column.name]) return;

                    var value = row[cm.column.name];
                    if (cm.showSelectAll) {
                        if (cm.inputType == "timestamp") {
                            // if selectAll is open for TS column, make sure value is converted to a string (in display format)
                            // if other type (null or string), don't change the value
                            if (typeof value == "object") {
                                // if time isn't set, default to midnight
                                if (value.time === null) value.time = '00:00:00'
                                var options = {
                                    outputType: "string",
                                    currentMomentFormat: dataFormats.date + dataFormats.time12 + 'A',
                                    outputMomentFormat: dataFormats.datetime.display
                                }
                                var valueOrNull = value.date ? value.date + value.time + value.meridiem : null;
                                value = InputUtils.formatDatetime(valueOrNull, options);
                            }
                        }
                    } else {
                        if (cm.inputType == "timestamp") {
                            var options = { outputType: "object" };
                            // if value is a string or null, convert to object format
                            if ((value && typeof value == "string") || value == null) value = InputUtils.formatDatetime(value, options);
                        }
                    }
                    row[cm.column.name] = value;
                });
            });

            resizeColumns(true);
        }

        /**
         * this function will be called when user closes the select-all panel. it will,
         * - log the client action
         * - set the boolean flags
         * - convert the values from disabled mode to interactable mode.
         */
        vm.cancelSelectAll = function cancelSelectAll(index) {
            var model = vm.recordEditModel.columnModels[index];

            var defaultLogInfo = (model.column.reference ? model.column.reference.defaultLogInfo : $rootScope.reference.defaultLogInfo);
            logService.logClientAction({
                action: recordCreate.getColumnModelLogAction(logService.logActions.SET_ALL_CANCEL, model),
                stack: recordCreate.getColumnModelLogStack(model)
            }, defaultLogInfo);

            model.showSelectAll = false;
            model.highlightRow = false;
            selectAllOpen = false;

            closeAllInput(model);

            // change display values for object display
            if (model.inputType === "timestamp") {
                vm.recordEditModel.rows.forEach(function (row) {
                    // the current row value is in the "disabled" format (aka a string)
                    var value = row[model.column.name];
                    var options = { outputType: "object" };
                    row[model.column.name] = InputUtils.formatDatetime(value, options);
                });
            }
        }

        // takes the value and sets it on every rows view and submission model
        function setValueAllInputs (index, value) {
            var model = vm.recordEditModel;
            var columnModel = model.columnModels[index];
            var column = columnModel.column;

            var inputType = columnModel.inputType;
            model.rows.forEach(function (row, rowIndex) {
                // ignore the ones that cannot be updated
                if (vm.editMode && !model.canUpdateRows[rowIndex][column.name]) return;

                switch (inputType) {
                    case "popup-select":
                        // udpate the foreign key data
                        model.foreignKeyData[rowIndex][column.foreignKey.name] = value ? value.data : null;

                        // update the submission rows
                        var foreignKeyColumns = column.foreignKey.colset.columns;
                        for (var i = 0; i < foreignKeyColumns.length; i++) {
                            var referenceCol = foreignKeyColumns[i];
                            var foreignTableCol = column.foreignKey.mapping.get(referenceCol);

                            model.submissionRows[rowIndex][referenceCol.name] = value ? value.data[foreignTableCol.name] : null;
                        }

                        row[column.name] = value ? value.displayname.value : null;
                        break;
                    case "file":
                        // need to set each property to avoid having a reference to the same object
                        row[column.name] = {}
                        Object.keys(value).forEach(function (key) {
                            if (key !== "hatracObj") {
                                row[column.name][key] = value[key];
                            }
                        });

                        // TODO: This is duplicated in the upload-input directive.
                        // Should be removed in both places and only created at submission time
                        if (row[column.name].file) {
                            // if condition guards for "clear all" case
                            row[column.name].hatracObj = new ERMrest.Upload(row[column.name].file, {
                                column: column,
                                reference: $rootScope.reference
                            });
                        }
                        break;
                    case "timestamp":
                        // set input value for each record to create. populate ui model
                        // input stays in disabled format (a string)
                        var options = {
                            outputType: "string",
                            currentMomentFormat: dataFormats.date + dataFormats.time12 + 'A',
                            outputMomentFormat: dataFormats.datetime.display
                        };
                        var valueOrNull = value.date ? value.date + value.time + value.meridiem : null;
                        row[column.name] = InputUtils.formatDatetime(valueOrNull, options);
                        break;
                    default:
                        row[column.name] = value;
                        break;
                }

            });

        }

        vm.applySelectAll = function applySelectAll(index) {
            var model = vm.recordEditModel.columnModels[index];

            var defaultLogInfo = (model.column.reference ? model.column.reference.defaultLogInfo : $rootScope.reference.defaultLogInfo);
            logService.logClientAction({
                action: recordCreate.getColumnModelLogAction(logService.logActions.SET_ALL_APPLY, model),
                stack: recordCreate.getColumnModelLogStack(model)
            }, defaultLogInfo);

            setValueAllInputs(index, model.allInput);
        }

        vm.clearSelectAll = function clearSelectAll(index) {
            var model = vm.recordEditModel.columnModels[index];

            var defaultLogInfo = (model.column.reference ? model.column.reference.defaultLogInfo : $rootScope.reference.defaultLogInfo);
            logService.logClientAction({
                action: recordCreate.getColumnModelLogAction(logService.logActions.SET_ALL_CLEAR, model),
                stack: recordCreate.getColumnModelLogStack(model)
            }, defaultLogInfo);

            var value = null;
            var inputType = model.inputType;
            if (inputType === "timestamp") {
                value = {
                    date: null,
                    time: null,
                    meridiem: 'AM'
                };
            } else if (inputType === "file") {
                value = { url: "" };
            }
            setValueAllInputs(index, value);
        }

        // decides whether apply should be disabled
        vm.disableApply = function disableApply(index) {
            var columnModel = vm.recordEditModel.columnModels[index];
            if (!columnModel) return true;

            var noValue = true;
            var value = columnModel.allInput;
            if (columnModel.inputType === "timestamp") {
                // We don't care if a time value is set or not, time is meaningless without a date
                if (DataUtils.isObjectAndNotNull(value) && value.date) noValue = false;
            } else if (columnModel.inputType === "file") {
                // the url value is what determines if a file exists or not
                if (DataUtils.isObjectAndNotNull(value) && value.url) noValue = false;
            } else if (columnModel.inputType === "boolean") {
                // check if the selected value is a boolean (true|false)
                if (typeof value === "boolean" || (typeof value === "string" && value.length > 0)) noValue = false;
            } else {
                if (value != null) noValue = false;
            }
            return noValue;
        }

        // We have multiple ways to determine a disabled input, or rather, when an input should be shown as disabled
        //   1. the input should not be file (the upload directive handls showing proper disabled input for those)
        //   2. If the select all dialog is open
        //   3. If the column must be disabled based on acl or annotation
        vm.inputTypeOrDisabled = function inputTypeOrDisabled(rowIndex, columnIndex) {
            try {
                var model = vm.recordEditModel.columnModels[columnIndex];
                if (model.inputType === "file") {
                    return model.inputType;
                }
                if (model.showSelectAll || vm.isDisabled(columnIndex, rowIndex)) {
                    return 'disabled';
                }
                return model.inputType;
            } catch (err) {
                console.log("couldn't figure out the type: ", err);
            }
        }


        vm.showColumnPermissionErrorClick = function (rowIndex, columnName) {
            if (!vm.showColumnPermissionError) {
                vm.showColumnPermissionError = [];
            }
            if (!(rowIndex in vm.showColumnPermissionError)) {
                vm.showColumnPermissionError[rowIndex] = {};
            }
            vm.showColumnPermissionError[rowIndex][columnName] = true;
        }

        // if any of the columns is showing spinner, that means it's waiting for some
        // data and therefore we should just disable the addMore button.
        $rootScope.$watchCollection(function () {
            return $rootScope.showColumnSpinner[$rootScope.showColumnSpinner.length-1];
        }, function (newValue, oldValue) {
            if (newValue && Object.values(newValue).some(function (v) {return v;})) {
                vm.canAddMore = false;
            } else {
                vm.canAddMore = true;
            }
        });

        // call the functions used to fix the style of page after displayReady is set.
        var unbindDisplayReady = $scope.$watch(function() {
            return $rootScope.displayReady;
        }, function (newValue, oldValue) {
            if (newValue) {

                // attach the footer and mainContainer sensors
                attachResizeSensors();

                $timeout(function () {
                    onResize(true);
                }, 0);

                // remove the watch event since it's not needed anymore
                unbindDisplayReady();
            }
        });

        /*------------------------code below is for fixing the main-container height and footer styles -----------*/

        var footerSensor, mainContainerSensor;

        /**
         * detach the resize sensors that have been created to improve performance
         */
        function detachResizeSensors() {
            if (footerSensor) footerSensor.detach();
        }

        /**
         * Create resize sensors to fix the height of the main-container, and fix footer styles
         */
        function attachResizeSensors() {
            var parentContainer = $document[0].querySelector(vm.resultset ? '.resultset-container' : '.form-container');

            UiUtils.attachContainerHeightSensors(parentContainer, null, true);

            footerSensor = UiUtils.attachFooterResizeSensor(vm.resultset ? 1 : 0);
        }

        /*------------------------code below is for fixing the column names when scrolling -----------*/

        // NOTE: keep consistent with $chaise-caption-column-width in _variables.scss
        var ENTITY_KEY_WIDTH = 200;

        vm.formEditDynamicStyle = {};
        vm.topScroll = {
            width: '0px'
        };

        // Get root element
        var element = document.querySelector('.ng-scope');
        var $rootElement = angular.element(element).injector().get('$rootElement');

        // used for setting the width of table and
        var inputContainerEl = vm.inputContainer = document.querySelector('.input-container');
        var tableEl = document.querySelector('#form-edit table');

        // used for adjusting the padding of main-container (because of scrollbar)
        var mainContainerEl = document.querySelector('.form-container .main-container');
        var topRightPanelEl = document.querySelector('.form-container .top-right-panel');

        // Get the form-edit div
        var elem = $rootElement.find('#form-edit');
        var scrollContainer = $rootElement.find('#form-edit-scroll');

        var elemHeight;
        var trs, selectAllTrs;
        var scope = $rootScope;


        // Set outer width of element to be less by caption column Width and add buttonWidth,
        // so that it doesn't scrolls due to the margin-left applied before extra padding
        function onResize(doNotInvokeEvent) {

            //adjust the padding of main-container
            // if there's a scrollbar, the spacing needs to be adjusted
            var padding = mainContainerEl.clientWidth - topRightPanelEl.clientWidth;
            mainContainerEl.style.paddingRight = padding + "px";

            // change the form-edit width to be the same as input-container
            var reducedWidth = inputContainerEl.offsetWidth - ENTITY_KEY_WIDTH; // account for left margin
            vm.formEditDynamicStyle.width = reducedWidth;

            if (vm.recordEditModel.rows.length > 1) {
                // make sure the width of form-edit-scroll and the table are the same
                vm.topScroll.width =  (tableEl.offsetWidth) + "px";

                if (tableEl.offsetWidth > reducedWidth) {
                    // if the table width is greater than the scrollable container width
                    // NOTE: this is for an edge case in safari but has no harm on other browsers
                    vm.showTopScroll = true;
                } else {
                    vm.showTopScroll = false;
                }
            } else {
                // make scroll bar container smaller than form container so it doesn't show scrollbar when 1 record
                vm.topScroll.width =  (tableEl.offsetWidth - ENTITY_KEY_WIDTH - 50) + "px";
            }

            // don't invoke digest cycle if the caller said so
            // (currently it's only passed on load. the rest of callers will invoke extra digest cycle)
            if (!doNotInvokeEvent) scope.$digest();
        }

        // Listen to scroll event on dummy div for top horizontal bar to update recordedit div position
        scrollContainer.on('scroll', function (e) {
            elem.scrollLeft(scrollContainer.scrollLeft());
        });

        // Listen to scroll event on recordedit div for top horizontal bar to update dummy div position
        var elemStopTimer;
        elem.on('scroll', function (e) {
            $timeout.cancel(elemStopTimer);
            elemStopTimer = $timeout(function() {
                scrollContainer.scrollLeft(elem.scrollLeft());
            }, 10);
        });

        // Listen to window resize event to change the width of div form-edit
        angular.element($window).bind('resize', function() {
            $timeout(function () {
                onResize();
                // resize dropdown menu if open while resizing
                vm.setDropdownWidth();
            }, 0)
        });

        var editMode = vm.editMode;

        // This function is called whenever the height of form-edit div changes
        // This might be because of selecting/clearing something from the popup for foreighn keys
        // It is called initially once, to adjust heights of fixed columns according to their next td element
        function resizeColumns(resize) {
            // Set timer null to reset settimeout
            timer = null;

            // get current height of div form-edit
            var h = elem.height();

            if (resize === false) return;

            // Get all rows of the table
            if (!trs) {
                trs = elem.find('tr.shift-form');
                selectAllTrs = elem.find('tr.select-all-row');
            }

            // iterate over each row
            for(var i=0;i<trs.length;i++) {
                // unset the height in case the column name is long enough to move the set all button down
                trs[i].children[0].height = "unset";

                // Get the height of the first column and  second column of the row
                // Which are the key and value for the row
                var keytdHeight = trs[i].children[0].getAttribute('data-height');
                if (keytdHeight == null || keytdHeight == 0) {
                    keytdHeight = trs[i].children[0].offsetHeight;
                    // set first TD height
                    trs[i].children[0].setAttribute('height', keytdHeight);
                }

                var valuetdHeight = trs[i].children[1].offsetHeight;

                // If keytdHeight is greater than valuetdHeight
                // then set valuetdHeight
                // else change coltdHeight for viceversa condition
                if (keytdHeight > valuetdHeight) {
                    trs[i].children[1].height = keytdHeight;
                } else if (valuetdHeight > keytdHeight) {
                    trs[i].children[0].height = valuetdHeight;
                }

                if (i !== 0) {
                    // use -1 because there is no extra <tr> for the header row
                    var idx = i-1;

                    // get the height of the input div and buttons (Apply/Cancel) div
                    // HTML structure:
                    //    tr > td(entity-value) > span/input-switch/button
                    var inputHeight = selectAllTrs[idx].children[1].children[1].offsetHeight;
                    var buttonsHeight = selectAllTrs[idx].children[1].children[2].offsetHeight;

                    // + (8*2) for 8 padding on top and bottom
                    // + 1 for border width
                    var allValueTdHeight = (inputHeight > buttonsHeight ? inputHeight : buttonsHeight) + (8*2) + 1;

                    // set key height to the height of the input div
                    selectAllTrs[idx].children[0].height = allValueTdHeight;
                    selectAllTrs[idx].children[1].height = allValueTdHeight;
                }
            }
        }



        var TIMER_INTERVAL = 50; //play with this to get a balance of performance/responsiveness
        var timer;

        // Watch for height changes on the rootscope
        // TODO: this doesn't make much sense
        $rootScope.$watch(function() {
            timer = timer ||
            $timeout(function() {
                resizeColumns();
            }, TIMER_INTERVAL, false);
        });

        $window.addEventListener("beforeunload", function(e) {
            if(vm.successfulSubmission){
                return undefined;
            }
            e.returnValue = "Do you want to leave this page? Changes you have made will not be saved.";
        });
    }]);
})();
