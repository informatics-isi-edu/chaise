(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .controller('FormController', ['AlertsService', 'ConfigUtils', 'dataFormats', 'DataUtils', 'ErrorService', 'InputUtils', 'integerLimits', 'logActions', 'maskOptions', 'messageMap', 'modalBox', 'modalUtils', 'recordCreate', 'recordEditAppUtils', 'recordEditModel', 'recordsetDisplayModes', 'Session', 'UiUtils', 'UriUtils', '$cookies', '$document', '$log', '$rootScope', '$scope', '$timeout', '$window',
        function FormController(AlertsService, ConfigUtils, dataFormats, DataUtils, ErrorService, InputUtils, integerLimits, logActions, maskOptions, messageMap, modalBox, modalUtils, recordCreate, recordEditAppUtils, recordEditModel, recordsetDisplayModes, Session, UiUtils, UriUtils, $cookies, $document, $log, $rootScope, $scope, $timeout, $window) {
        var vm = this;
        var context = ConfigUtils.getContextJSON();
        var mainBodyEl;
        var chaiseConfig = ConfigUtils.getConfigJSON();
        vm.recordEditModel = recordEditModel;
        vm.dataFormats = dataFormats;
        vm.editMode = (context.mode == context.modes.EDIT ? true : false);
        vm.mdHelpLinks = { // Links to Markdown references to be used in help text
            editor: "https://jbt.github.io/markdown-editor/#RZDLTsMwEEX3/opBXQCRmqjlsYBVi5CKxGOBWFWocuOpM6pjR54Jbfl6nKY08mbO1dwj2yN4pR+ENx23Juw8PBuSEJU6B3zwovdgAzIED1IhONwINNqjezxyRG6dkLcQWmlaAWIwxI3TBzT/pUi2klypLJsHZ0BwL1kGSq1eRDsq6Rf7cKXUCBaoTeebJBho2tGAN0cc+LbnIbg7BUNyr9SnrhuH6dUsCjKYNYm4m+bap3McP6L2NqX/y+9tvcaYLti3Jvm5Ns2H3k0+FBdpvfsGDUvuHY789vuqEmn4oShsCNZhXob6Ou+3LxmqsAMJQL50rUHQHqjWFpW6WM7gpPn6fAIXbBhUUe9yS1K1605XkN+EWGuhksfENEbTFmWlibGoNQvG4ijlouVy3MQE8cAVoTO7EE2ibd54e/0H",
            cheatsheet: "http://commonmark.org/help/"
        };
        vm.isRequired = isRequired;
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

        vm.booleanValues = InputUtils.booleanValues;

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

            // Redirect to record or recordset app..
            $window.location = redirectUrl;
        }

        /*
         * Allows to tranform some form values depending on their types
         * Boolean: If the value is empty ('') then set it as null
         * Date/Timestamptz: If the value is empty ('') then set it as null
         */
        function transformRowValues(row) {
            var transformedRow = {};
            /* Go through the set of columns for the reference.
             * If a value for that column is present (row[col.name]), transform the row value as needed
             * NOTE:
             * Opted to loop through the columns once and use the row object for quick checking instead
             * of looking at each key in row and looping through the column set each time to grab the column
             * My solution is worst case n-time
             * The latter is worst case rowKeys.length * n time
             */
            for (var i = 0; i < $rootScope.reference.columns.length; i++) {
                var col = $rootScope.reference.columns[i];
                var rowVal = row[col.name];
                if (rowVal && !col.getInputDisabled(context.appContext)) {
                    if (col.type.isArray) {
                        rowVal = JSON.parse(rowVal);
                    } else {
                        switch (col.type.name) {
                            case "timestamp":
                            case "timestamptz":
                                if (vm.readyToSubmit) {
                                    var options = {
                                        outputType: "string",
                                        currentMomentFormat: dataFormats.date + dataFormats.time12 + 'A',
                                        outputMomentFormat: dataFormats.datetime.submission
                                    }

                                    // in create if the user doesn't change the timestamp field, it will be an object in form {time: null, date: null, meridiem: AM}
                                    // meridiem should never be null, time can be left empty (null) the case below will catch that.
                                    if (rowVal.time === null) rowVal.time = '00:00:00';
                                    var value = rowVal.date ? rowVal.date + rowVal.time + rowVal.meridiem : null;

                                    rowVal = InputUtils.formatDatetime(value, options);
                                }
                                break;
                            case "json":
                            case "jsonb":
                                rowVal=JSON.parse(rowVal);
                                break;
                            default:
                                if (col.isAsset) {
                                    if (!vm.readyToSubmit) {
                                        rowVal = { url: "" };
                                    }
                                }
                                break;
                        }
                    }
                }
                transformedRow[col.name] = rowVal;
            }
            return transformedRow;
        }

        /**
         * onSuccess - callback after results are added
         *
         * @param  {object} model  model contains updated record object
         * @param  {object} result object has result messages
         */
        function onSuccess (model, result){
            var page = result.successful;
            var failedPage = result.failed;
            var resultsReference = page.reference;
            vm.successfulSubmission = true;
            if (model.rows.length == 1) {
                vm.redirectAfterSubmission(page);
            }
            else {
                AlertsService.addAlert("Your data has been submitted. Showing you the result set...", "success");

                // includes identifiers for specific records modified
                vm.resultsetRecordsetLink = $rootScope.reference.contextualize.compact.appLink;
                //set values for the view to flip to recordedit resultset view
                vm.resultsetModel = {
                    hasLoaded: true,
                    reference: resultsReference,
                    columns: resultsReference.columns,
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
                        selectMode: modalBox.noSelect //'no-select'
                    }
                };

                // NOTE: This case is for a pseudo-failure case
                // When multiple rows are updated and a smaller set is returned, the user doesn't have permission to update those rows based on row-level security
                if (failedPage !== null) {
                    vm.omittedResultsetModel = {
                        hasLoaded: true,
                        reference: resultsReference,
                        columns: resultsReference.columns,
                        enableSort: false,
                        sortby: null,
                        sortOrder: null,
                        page: page,
                        pageLimit: model.rows.length,
                        rowValues: DataUtils.getRowValuesFromTuples(failedPage.tuples),
                        selectedRows: [],
                        search: null,
                        config: {
                            viewable: false,
                            editable: false,
                            deletable: false,
                            selectMode: modalBox.noSelect
                        }
                    };
                }
                vm.resultset = true;
                // delay updating the height of DOM elements so the current digest cycle can complete and "show" the resultset view
                $timeout(function() {
                    mainBodyEl = $document[0].getElementsByClassName('main-body')[1];
                    setMainContainerHeight();
                    UiUtils.setFooterStyle(1);
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
                populateSubmissionRow(model.rows[j], model.submissionRows[j], originalTuple, $rootScope.reference.columns, editOrCopy);
            }
            recordCreate.addRecords(vm.editMode, null, vm.recordEditModel, false, $rootScope.reference, $rootScope.tuples, context.queryParams, vm, onSuccess, context.logObject);
        }

        function onDelete() {
            var uri;
            var ref = $rootScope.reference.unfilteredReference.contextualize.compact;

            if (chaiseConfig.showFaceting) {
                uri = ref.appLink;
            } else {
                var location = ref.location;
                uri = "../search/#" + location.catalog + '/' + location.schemaName + ':' + location.tableName;
            }

            $rootScope.showSpinner = false;
            $window.location.href = uri;
        }

        // NOTE: If changes are made to this function, changes should also be made to the similar function in the inputSwitch directive
        // TODO: remove when RE has been refactored to use the inputSwitch directive for all form inputs
        function searchPopup(rowIndex, column) {
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

            var submissionRow = populateSubmissionRow(vm.recordEditModel.rows[rowIndex], vm.recordEditModel.submissionRows[rowIndex], originalTuple, $rootScope.reference.columns, editOrCopy);

            // used for title
            params.parentReference = $rootScope.reference;
            params.parentTuple = originalTuple;
            params.displayname = column.displayname;

            params.displayMode = vm.editMode ? recordsetDisplayModes.foreignKeyPopupEdit : recordsetDisplayModes.foreignKeyPopupCreate;


            params.reference = column.filteredRef(submissionRow, vm.recordEditModel.foreignKeyData[rowIndex]).contextualize.compactSelect;
            params.reference.session = $rootScope.session;
            params.context = "compact/select";
            params.selectedRows = [];
            params.selectMode = modalBox.singleSelectMode;
            params.showFaceting = true;
            params.facetPanelOpen = false;

            modalUtils.showModal({
                animation: false,
                controller: "SearchPopupController",
                windowClass: "search-popup foreignkey-popup",
                controllerAs: "ctrl",
                resolve: {
                    params: params
                },
                size: "xl",
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
            }, false, false);
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
                if ($rootScope.tuples) $rootScope.tuples[rowIndex].data[referenceCol.name] = null;
            }

            model.rows[rowIndex][column.name] = null;
        }

        function createRecord(column) {
            $window.open(column.reference.contextualize.entryCreate.appLink, '_blank');
        }

        function copyFormRow() {
            if ((vm.numberRowsToAdd + vm.recordEditModel.rows.length) > vm.MAX_ROWS_TO_ADD || vm.numberRowsToAdd < 1) {
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
                var rowset = vm.recordEditModel.rows;
                var protoRow = rowset[index];

                for (var i = 0; i < vm.numberRowsToAdd; i++) {
                    var row = angular.copy(protoRow);
                    // transform row values to avoid parsing issues with null values
                    var transformedRow = transformRowValues(row);
                    var submissionRow = angular.copy(vm.recordEditModel.submissionRows[index]);
                    var foreignKeyData = angular.copy(vm.recordEditModel.foreignKeyData[index]);

                    rowset.push(transformedRow);
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

        function populateSubmissionRow(modelRow, submissionRow, originalTuple, columns, editOrCopy) {
            var transformedRow = transformRowValues(modelRow);
            columns.forEach(function (column) {
                // If the column is a foreign key column, it needs to get the originating columns name for data submission
                if (column.isForeignKey) {

                    var foreignKeyColumns = column.foreignKey.colset.columns;
                    for (var k = 0; k < foreignKeyColumns.length; k++) {
                        var referenceColumn = foreignKeyColumns[k];
                        var foreignTableColumn = column.foreignKey.mapping.get(referenceColumn);
                        // check if value is set in submission data yet
                        if (!submissionRow[referenceColumn.name]) {
                            /**
                             * User didn't change the foreign key, copy the value over to the submission data with the proper column name
                             * In the case of edit, the originating value is set on $rootScope.tuples.data. Use that value if the user didn't touch it (value could be null, which is fine, just means it was unset)
                             * In the case of create, the value is unset if it is not present in submissionRows and because it's newly created it doesn't have a value to fallback to, so use null
                            **/
                            if (editOrCopy && undefined != originalTuple.data[referenceColumn.name]) {
                                submissionRow[referenceColumn.name] = originalTuple.data[referenceColumn.name];
                            } else {
                                submissionRow[referenceColumn.name] = null;
                            }
                        }
                    }
                // not foreign key, column.name is sufficient for the keys
                } else {
                    // set null if not set so that the whole data object is filled out for posting to ermrestJS
                    submissionRow[column.name] = (transformedRow[column.name] === undefined) ? null : transformedRow[column.name];
                }
            });

            return submissionRow;
        }

        function spliceRows(index) {
            vm.recordEditModel.rows.splice(index, 1);
            vm.recordEditModel.oldRows.splice(index, 1);
            vm.recordEditModel.submissionRows.splice(index, 1);
            vm.recordEditModel.foreignKeyData.splice(index, 1);
            if (vm.editMode) $rootScope.tuples.splice(index, 1);
            $timeout(function() {
                onResize();
                $rootScope.showSpinner = false;
            }, 10);
        }

        function removeFormRow(index) {
            scope.$root.showSpinner = true;
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
            return cm && cm.column && !cm.column.nullok && !cm.isDisabled;
        }

// **** Functions for set all input
        var selectAllOpen = false;

        function closeAllInput (model) {
            // reset column view model values
            model.showSelectAll = false;
            model.highlightRow = false;
            selectAllOpen = false;
        }

        // toggles the state of the select all dialog
        vm.toggleSelectAll = function toggleSelectAll(index) {
            var model = vm.recordEditModel.columnModels[index];
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
                        } else if (cm.inputType == "file") {
                            // copy file values to submission model to preserve them
                            vm.recordEditModel.submissionRows[index][cm.column.name] = value;
                            value = value.url;
                        }
                    } else {
                        if (cm.inputType == "timestamp") {
                            var options = { outputType: "object" };
                            // if value is a string or null, convert to object format
                            if ((value && typeof value == "string") || value == null) value = InputUtils.formatDatetime(value, options);
                        } else if (cm.inputType == "file") {
                            // copy file values from submission model (if they exist)
                            if (vm.recordEditModel.submissionRows[index][cm.column.name]) {
                                value = vm.recordEditModel.submissionRows[index][cm.column.name];
                            }
                        }
                    }
                    row[cm.column.name] = value;
                });
            });
        }

        // closes the select all
        vm.cancelSelectAll = function cancelSelectAll(index) {
            var model = vm.recordEditModel.columnModels[index];
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
            } else if (model.inputType == "file") {
                vm.recordEditModel.rows.forEach(function (row, index) {
                    // copy file values from submission model
                    row[model.column.name] = vm.recordEditModel.submissionRows[index][model.column.name];
                });
            }
        }

        // takes the value and sets it on every rows view and submission model
        function setValueAllInputs (index, value) {
            var model = vm.recordEditModel;
            var columnModel = model.columnModels[index];
            var column = columnModel.column;

            var inputType = columnModel.inputType;
            switch (inputType) {
                case "popup-select":
                    // value should be an ERMrest.tuple object
                    // set data in view model (model.rows) and submission model (model.submissionRows)

                    // udpate the foreign key data
                    model.foreignKeyData.forEach(function (fkeyData) {
                        fkeyData[column.foreignKey.name] = value ? value.data : null;
                    });

                    var foreignKeyColumns = column.foreignKey.colset.columns;
                    for (var i = 0; i < foreignKeyColumns.length; i++) {
                        var referenceCol = foreignKeyColumns[i];
                        var foreignTableCol = column.foreignKey.mapping.get(referenceCol);

                        model.submissionRows.forEach(function (submissionRow) {
                            submissionRow[referenceCol.name] = value ? value.data[foreignTableCol.name] : null;
                        });
                    }

                    model.rows.forEach(function (row) {
                        row[column.name] = value ? value.displayname.value : null;
                    });
                    break;
                case "file":
                    model.submissionRows.forEach(function (submissionRow) {
                        // need to set each property to avoid having a reference to the same object
                        submissionRow[column.name] = {}
                        Object.keys(value).forEach(function (key) {
                            if (key !== "hatracObj") {
                                submissionRow[column.name][key] = value[key];
                            }
                        });

                        // TODO: This is duplicated in the upload-input directive.
                        // Should be removed in both places and only created at submission time
                        if (submissionRow[column.name].file) {
                            // if condition guards for "clear all" case
                            submissionRow[column.name].hatracObj = new ERMrest.Upload(submissionRow[column.name].file, {
                                column: column,
                                reference: $rootScope.reference
                            });
                        }
                    });

                    model.rows.forEach(function (row) {
                        row[column.name] = value.url;
                    });
                    break;
                case "timestamp":
                    // set input value for each record to create. populate ui model
                    model.rows.forEach(function (row) {
                        // input stays in disabled format (a string)
                        var options = {
                            outputType: "string",
                            currentMomentFormat: dataFormats.date + dataFormats.time12 + 'A',
                            outputMomentFormat: dataFormats.datetime.display
                        };
                        var valueOrNull = value.date ? value.date + value.time + value.meridiem : null;
                        row[column.name] = InputUtils.formatDatetime(valueOrNull, options);
                    });
                    break;
                default:
                    model.rows.forEach(function (row) {
                        row[column.name] = value;
                    });
                    break;
            }
        }

        vm.applySelectAll = function applySelectAll(index) {
            setValueAllInputs(index, vm.recordEditModel.columnModels[index].allInput.value);
        }

        vm.clearSelectAll = function clearSelectAll(index) {
            var value = null;
            var inputType = vm.recordEditModel.columnModels[index].inputType;
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
            if (!columnModel || !columnModel.allInput) return true;

            var noValue = true;
            var value = columnModel.allInput.value;
            if (columnModel.inputType === "timestamp") {
                // We don't care if a time value is set or not, time is meaningless without a date
                if (value && value.date) noValue = false;
            } else if (columnModel.inputType === "file") {
                // the url value is what determines if a file exists or not
                if (value && value.url) noValue = false;
            } else if (columnModel.inputType === "boolean") {
                // check if the selected value is a boolean (true|false)
                if (typeof value === "boolean") noValue = false;
            } else {
                if (columnModel.allInput.value) noValue = false;
            }
            return noValue;
        }

        // We have 2 ways to determine a disabled input, or rather, when an input should be shown as disabled
        //   1. we check the column beforehand and determine if the input should ALWAYS be disabled
        //   2. If the select all dialog is open, the form inputs should be disabled
        vm.inputTypeOrDisabled = function inputTypeOrDisabled(index) {
            try {
                var model = vm.recordEditModel.columnModels[index];
                return model.showSelectAll ? "disabled" : model.inputType;
            } catch (err) {}
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

        /*** Container Heights and other styling ***/
        // fetches the height of navbar, bookmark container, and viewport
        // also fetches the main container for defining the dynamic height
        // There are 2 main containers on `recordedit` app
        function fetchContainerElements(containerIndex) {
            var elements = {};
            try {
                /**** used for main-container height calculation ****/
                // get navbar height
                elements.fixedContentHeight = $document[0].getElementById('mainnav').offsetHeight;
                // get bookmark height
                elements.fixedContentHeight += $document[0].getElementsByClassName('meta-icons')[containerIndex].offsetHeight;
                // get recordedit main container
                elements.container = $document[0].getElementsByClassName('main-container')[containerIndex];
            } catch(error) {
                elements = {};
                $log.warn(error);
            }
            return elements;
        }

        function setMainContainerHeight() {
            var idx = vm.resultset ? 1 : 0;
            var elements = fetchContainerElements(idx);
            // if the navbarHeight is not set yet, don't set the height
            // no bookmark container here
            if(elements.fixedContentHeight !== undefined && !isNaN(elements.fixedContentHeight)) {
                UiUtils.setDisplayContainerHeightOld(elements.container, elements.fixedContentHeight);
            }
        }

        $scope.$watch(function() {
            return $rootScope.displayReady;
        }, function (newValue, oldValue) {
            if (newValue) {
                $timeout(setMainContainerHeight, 0);
            }
        });

        // watch for the main body size to change
        $scope.$watch(function() {
            return mainBodyEl && mainBodyEl.offsetHeight;
        }, function (newValue, oldValue) {
            if (newValue) {
                $timeout(function () {
                    UiUtils.setFooterStyle(vm.resultset ? 1 : 0);
                }, 0);
            }
        });

        angular.element($window).bind('resize', function(){
            if ($rootScope.displayReady) {
                setMainContainerHeight();
                UiUtils.setFooterStyle(vm.resultset ? 1 : 0);
                $scope.$digest();
            }
        });

        $timeout(function () {
            mainBodyEl = $document[0].getElementsByClassName('main-body')[0];
        }, 0);

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

        var formContainerEl = $rootElement.find('.form-container');

        var elem = $rootElement.find('#form-section');

        // Get the form-edit div
        var elem = $rootElement.find('#form-edit');

        var tableEl = elem.find('table');
        var scrollContainer = formContainerEl.find('#form-edit-scroll');

        var elemHeight;
        var trs, selectAllTrs;
        var scope = $rootScope;


        // Set outer width of element to be less by caption column Width and add buttonWidth,
        // so that it doesn't scrolls due to the margin-left applied before extra padding
        function onResize(doNotInvokeEvent) {
            var elemWidth = formContainerEl.outerWidth();
            vm.formEditDynamicStyle.width = elemWidth - ENTITY_KEY_WIDTH - 25; // account for left margin as well

            if (vm.recordEditModel.rows.length > 1) {
                vm.topScroll.width =  (tableEl.outerWidth()) + "px";
            } else {
                // make scroll bar container smaller than form container so it doesn't show scrollbar when 1 record
                vm.topScroll.width =  (tableEl.outerWidth() - ENTITY_KEY_WIDTH - 50) + "px";
            }

            if (!doNotInvokeEvent) scope.$digest();
        }
        onResize(true);

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
            onResize();
        });

        var editMode = vm.editMode;

        // This function is called whenever the height of form-edit div changes
        // This might be because of selecting/clearing something from the popup for foreighn keys
        // It is called initially once, to adjust heights of fixed columns according to their next td element
        function resizeColumns() {

            // Set timer null to reset settimeout
            timer = null;

            // get current height of div form-edit
            var h = elem.height();

            // If current height of div form-edit has changed than the previous one
            if (elemHeight !== h) {

                // Get height of form-edit div to use for resizing the fixed columns height
                // This should be done once only
                if (!elemHeight) elemHeight = elem.outerHeight();

                // Get all rows of the table
                if (!trs) {
                    trs = elem.find('tr.shift-form');
                    selectAllTrs = elem.find('tr.select-all-row');
                }

                // iterate over each row
                for(var i=0;i<trs.length;i++) {
                    // Get the height of the first column and  second column of the row
                    // Which are the key and value for the row

                    var keytdHeight = trs[i].children[0].height;
                    if (keytdHeight == null || keytdHeight == 0) {
                        keytdHeight = trs[i].children[0].offsetHeight;
                        trs[i].children[0].height = keytdHeight;
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
