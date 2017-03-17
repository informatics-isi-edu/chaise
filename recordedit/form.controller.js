(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .controller('FormController', ['AlertsService', 'DataUtils', 'ErrorService', 'recordEditModel', 'UriUtils', '$cookies', '$log', '$rootScope', '$timeout', '$uibModal', '$window' , 'Session', 'messageMap', function FormController(AlertsService, DataUtils, ErrorService, recordEditModel, UriUtils, $cookies, $log, $rootScope, $timeout, $uibModal, $window, Session, messageMap) {
        var vm = this;
        var context = $rootScope.context;


        vm.recordEditModel = recordEditModel;
        vm.resultset = false;
        vm.editMode = (context.mode == context.modes.EDIT ? true : false);
        vm.showDeleteButton = chaiseConfig.deleteRecord === true ? true : false;
        context.appContext = vm.editMode ? 'entry/edit': 'entry/create';
        vm.booleanValues = context.booleanValues;
        vm.mdHelpLinks = { // Links to Markdown references to be used in help text
            editor: "https://jbt.github.io/markdown-editor/#RZDLTsMwEEX3/opBXQCRmqjlsYBVi5CKxGOBWFWocuOpM6pjR54Jbfl6nKY08mbO1dwj2yN4pR+ENx23Juw8PBuSEJU6B3zwovdgAzIED1IhONwINNqjezxyRG6dkLcQWmlaAWIwxI3TBzT/pUi2klypLJsHZ0BwL1kGSq1eRDsq6Rf7cKXUCBaoTeebJBho2tGAN0cc+LbnIbg7BUNyr9SnrhuH6dUsCjKYNYm4m+bap3McP6L2NqX/y+9tvcaYLti3Jvm5Ns2H3k0+FBdpvfsGDUvuHY789vuqEmn4oShsCNZhXob6Ou+3LxmqsAMJQL50rUHQHqjWFpW6WM7gpPn6fAIXbBhUUe9yS1K1605XkN+EWGuhksfENEbTFmWlibGoNQvG4ijlouVy3MQE8cAVoTO7EE2ibd54e/0H",
            cheatsheet: "http://commonmark.org/help/"
        };
        vm.isDisabled = isDisabled;
        vm.isRequired = isRequired;
        vm.getDisabledInputValue = getDisabledInputValue;

        vm.alerts = AlertsService.alerts;
        vm.closeAlert = AlertsService.deleteAlert;

        vm.submit = submit;
        vm.readyToSubmit = false;
        vm.submissionButtonDisabled = false;
        vm.redirectAfterSubmission = redirectAfterSubmission;
        vm.showSubmissionError = showSubmissionError;
        vm.searchPopup = searchPopup;
        vm.createRecord = createRecord;
        vm.clearForeignKey = clearForeignKey;

        vm.MAX_ROWS_TO_ADD = context.MAX_ROWS_TO_ADD;
        vm.numberRowsToAdd = 1;
        vm.showMultiInsert = false;
        vm.copyFormRow = copyFormRow;
        vm.removeFormRow = removeFormRow;
        vm.deleteRecord = deleteRecord;

        vm.inputType = null;
        vm.int2min = -32768;
        vm.int2max = 32767;
        vm.int4min = -2147483648;
        vm.int4max = 2147483647;
        vm.int8min = -9223372036854775808
        vm.int8max = 9223372036854775807;

        vm.columnToDisplayType = columnToDisplayType;
        vm.matchType = matchType;

        vm.applyCurrentDatetime = applyCurrentDatetime;
        vm.datepickerOpened = {}; // Tracks which datepickers on the form are open
        vm.toggleMeridiem = toggleMeridiem;
        vm.clearModel = clearModel;
        vm.blurElement = blurElement;
        // Specifies the regexes to be used for a token in a ui-mask input. For example, the '1' key in
        // in vm.maskOptions.date means that only 0 or 1 is allowed wherever the '1' key is used in a ui-mask template.
        // See the maskDefinitions section for more info: https://github.com/angular-ui/ui-mask.
        vm.maskOptions = {
            date: {
                maskDefinitions: {'1': /[0-1]/, '2': /[0-2]/, '3': /[0-3]/},
                clearOnBlur: true
            },
            time: {
                maskDefinitions: {'1': /[0-1]/, '2': /[0-2]/, '5': /[0-5]/},
                clearOnBlur: true
            }
        };
        vm.prefillCookie = $cookies.getObject(context.queryParams.prefill);
        vm.makeSafeIdAttr = DataUtils.makeSafeIdAttr;


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
                AlertsService.addAlert({type: 'success', message: 'Your data has been submitted. Redirecting you now to the record...'});
                redirectUrl += "record/#" + UriUtils.fixedEncodeURIComponent(page.reference.location.catalog) + '/' + page.reference.location.compactPath;
            } else {
                AlertsService.addAlert({type: 'success', message: 'Your data has been submitted. Redirecting you now to the recordset...'});
                redirectUrl += "recordset/#" + UriUtils.fixedEncodeURIComponent(page.reference.location.catalog) + '/' + page.reference.location.compactPath;
            }

            // Redirect to record or recordset app..
            $window.location = redirectUrl;
        }

        // TODO: Instead of calling this function in the error callback, the .catchAll() call should be in the catch attached to that promise chain
        // this function is completely unnecessary
        function showSubmissionError(response) {
            ErrorService.catchAll(response);
        }

        /*
         * Allows to tranform some form values depending on their types
         * Boolean: If the value is empty ('') then set it as null
         * Date/Timestamptz: If the value is empty ('') then set it as null
         */
        function transformRowValues(row) {
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

                // If this column is disabled, its value is already in the format
                // needed for submission.
                if (col.getInputDisabled(context.appContext)) {
                    continue;
                }

                var rowVal = row[col.name];
                if (rowVal) {
                    switch (col.type.name) {
                        case "timestamp":
                        case "timestamptz":
                            if (vm.readyToSubmit) {
                                if (rowVal.date && rowVal.time && rowVal.meridiem) {
                                    rowVal = moment(rowVal.date + rowVal.time + rowVal.meridiem, 'YYYY-MM-DDhh:mm:ssA').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                                } else if (rowVal.date && rowVal.time === null) {
                                    rowVal.time = '00:00:00';
                                    rowVal = moment(rowVal.date + rowVal.time + rowVal.meridiem, 'YYYY-MM-DDhh:mm:ssA').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                                } else if (!rowVal.date || !rowVal.time || !rowVal.meridiem) {
                                    rowVal = null;
                                }
                            }
                            break;
                        default:
                            if (rowVal === '') {
                                rowVal = null;
                            }
                            break;
                    }
                }
                row[col.name] = rowVal;
            }
            return row;
        }

        function submit() {
            var originalTuple,
                editOrCopy = true,
                form = vm.formContainer,
                model = vm.recordEditModel;

            if (form.$invalid) {
                vm.readyToSubmit = false;
                AlertsService.addAlert({type: 'error', message: 'Sorry, the data could not be submitted because there are errors on the form. Please check all fields and try again.'});
                form.$setSubmitted();
                return;
            }

            // Form data is valid, time to transform row values for submission to ERMrest
            vm.readyToSubmit = true;
            vm.submissionButtonDisabled = true;
            for (var j = 0; j < model.rows.length; j++) {
                // in the copy case, there will only ever be one tuple. Each additional form should be based off of the original tuple
                if (vm.editMode) {
                    originalTuple = $rootScope.tuples[j];
                }else if (context.queryParams.copy) {
                    originalTuple = $rootScope.tuples[0];
                } else {
                    originalTuple = null;
                    editOrCopy = false;
                }
                populateSubmissionRow(model.rows[j], model.submissionRows[j], originalTuple, $rootScope.reference.columns, editOrCopy);
            }

            if (vm.editMode) {
                // loop through model.submissionRows
                for (var i = 0; i < model.submissionRows.length; i++) {
                    var row = model.submissionRows[i];
                    var data = $rootScope.tuples[i].data;
                    // assign each value from the form to the data object on tuple
                    for (var key in row) {
                        data[key] = (row[key] === '' ? null : row[key]);
                    }
                }
                // submit $rootScope.tuples because we are changing and comparing data from the old data set for the tuple with the updated data set from the UI
                $rootScope.reference.update($rootScope.tuples).then(function success(page) {
                    if (window.opener && window.opener.updated) {
                        window.opener.updated(context.queryParams.invalidate);
                    }
                    vm.readyToSubmit = false; // form data has already been submitted to ERMrest
                    if (model.rows.length == 1) {
                        vm.redirectAfterSubmission(page);
                    } else {
                        AlertsService.addAlert({type: 'success', message: 'Your data has been submitted. Showing you the result set...'});
                        // can't use page.reference because it reflects the specific values that were inserted
                        vm.recordsetLink = $rootScope.reference.contextualize.compact.appLink
                        //set values for the view to flip to recordedit resultset view
                        vm.resultsetModel = {
                            hasLoaded: true,
                            reference: page.reference,
                            tableDisplayName: page.reference.displayname,
                            columns: page.reference.columns,
                            enableSort: false,
                            sortby: null,
                            sortOrder: null,
                            page: page,
                            pageLimit: model.rows.length,
                            rowValues: [],
                            search: null,
                            config: {}
                        }
                        vm.resultsetModel.rowValues = DataUtils.getRowValuesFromPage(page);
                        vm.resultset = true;
                    }
                }, function error(exception) {
                    if (exception instanceof ERMrest.UnauthorizedError || exception.code == 401) {
                        Session.loginInANewWindow(function() {
                            submit();
                        });
                    } else {
                        // TODO: this needs to be removed and a .catch() added
                        vm.showSubmissionError(exception);
                        vm.submissionButtonDisabled = false;
                    }
                });
            } else {
                $rootScope.reference.table.reference.create(model.submissionRows).then(function success(page) {
                    vm.readyToSubmit = false; // form data has already been submitted to ERMrest
                    if (vm.prefillCookie) {
                        $cookies.remove(context.queryParams.prefill);
                    }

                    // add cookie indicating record added
                    if (context.queryParams.invalidate) {
                        $cookies.put(context.queryParams.invalidate, model.submissionRows.length,
                            {
                                expires: new Date(Date.now() + (60 * 60 * 24 * 1000))
                            }
                        );
                    }

                    if (model.rows.length == 1) {
                        vm.redirectAfterSubmission(page);
                    } else {
                        AlertsService.addAlert({type: 'success', message: 'Your data has been submitted. Showing you the result set...'});
                        // can't use page.reference because it reflects the specific values that were inserted
                        vm.recordsetLink = $rootScope.reference.contextualize.compact.appLink
                        //set values for the view to flip to recordedit resultset view
                        vm.resultsetModel = {
                            hasLoaded: true,
                            reference: page.reference,
                            tableDisplayName: page.reference.displayname.value,
                            columns: page.reference.columns,
                            enableSort: false,
                            sortby: null,
                            sortOrder: null,
                            page: page,
                            pageLimit: model.rows.length,
                            rowValues: [],
                            search: null,
                            config: {}
                        }
                        vm.resultsetModel.rowValues = DataUtils.getRowValuesFromPage(page);
                        vm.resultset = true;
                    }
                }, function error(exception) {
                    if (exception instanceof ERMrest.UnauthorizedError || exception.code == 401) {
                        Session.loginInANewWindow(function() {
                            submit();
                        });
                    } else {
                        // TODO: this needs to be removed and a catch added here
                        vm.showSubmissionError(exception);
                        vm.submissionButtonDisabled = false;
                    }
                });
            }
        }

        function deleteRecord() {
            var location = $rootScope.reference.location;
            if (chaiseConfig.confirmDelete === undefined || chaiseConfig.confirmDelete) {
                $uibModal.open({
                    templateUrl: "../common/templates/delete-link/confirm_delete.modal.html",
                    controller: "ConfirmDeleteController",
                    controllerAs: "ctrl",
                    size: "sm"
                }).result.then(function success() {
                    // user accepted prompt to delete
                    return $rootScope.reference.delete($rootScope.tuples);
                }).then(function deleteSuccess() {
                    // redirect after successful delete
                    $window.location.href = "../search/#" + location.catalog + '/' + location.schemaName + ':' + location.tableName;
                }, function deleteFailure(response) {
                    if (response instanceof ERMrest.PreconditionFailedError) {
                        $uibModal.open({
                            templateUrl: "../common/templates/refresh.modal.html",
                            controller: "ErrorDialogController",
                            controllerAs: "ctrl",
                            size: "sm",
                            resolve: {
                                params: {
                                    title: messageMap.pageRefreshRequired.title,
                                    message: messageMap.pageRefreshRequired.message
                                }
                            },
                            backdrop: 'static',
                            keyboard: false
                        }).result.then(function reload() {
                            // Reload the page
                            $window.location.reload();
                        }).catch(function(error) {
                            ErrorService.catchAll(error);
                        });
                    } else {
                        if (response !== 'cancel') {
                            // TODO: rethrow error here
                            vm.showSubmissionError(response);
                        }
                    }
                }).catch(function (error) {
                    ErrorService.catchAll(error);
                });
            } else {
                $rootScope.reference.delete($rootScope.tuples).then(function deleteSuccess() {
                    // redirect after successful delete
                    $window.location.href = "../search/#" + location.catalog + '/' + location.schemaName + ':' + location.tableName;
                }, function deleteFailure(response) {
                    if (exception instanceof ERMrest.UnauthorizedError || exception.code == 401) {
                        Session.loginInANewWindow(function() {
                            deleteRecord();
                        });
                    } else if (response instanceof ERMrest.PreconditionFailedError) {
                        $uibModal.open({
                            templateUrl: "../common/templates/refresh.modal.html",
                            controller: "ErrorDialogController",
                            controllerAs: "ctrl",
                            size: "sm",
                            resolve: {
                                params: {
                                    message: messageMap.pageRefreshRequired
                                }
                            },
                            backdrop: 'static',
                            keyboard: false
                        }).result.then(function reload() {
                            // Reload the page
                            $window.location.reload();
                        }).catch(function(error) {
                            ErrorService.catchAll(error);
                        });
                    } else {
                        // TODO: rethrow error here
                        vm.showSubmissionError(response);
                    }
                }).catch(function (error) {
                    ErrorService.catchAll(error);
                });
            }
        }

        function searchPopup(rowIndex, column) {

            if (isDisabled(column)) return;

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

            params.reference = column.filteredRef(submissionRow).contextualize.compactSelect;
            params.reference.session = $rootScope.session;
            params.context = "compact/select";

            var modalInstance = $uibModal.open({
                animation: false,
                controller: "SearchPopupController",
                controllerAs: "ctrl",
                resolve: {
                    params: params
                },
                size: "lg",
                templateUrl: "../common/templates/searchPopup.modal.html"
            });

            modalInstance.result.then(function dataSelected(tuple) {
                // tuple - returned from action in modal (should be the foreign key value in the recrodedit reference)
                // set data in view model (model.rows) and submission model (model.submissionRows)

                var foreignKeyColumns = column.foreignKey.colset.columns;
                for (var i = 0; i < foreignKeyColumns.length; i++) {
                    var referenceCol = foreignKeyColumns[i];
                    var foreignTableCol = column.foreignKey.mapping.get(referenceCol);

                    vm.recordEditModel.submissionRows[rowIndex][referenceCol.name] = tuple.data[foreignTableCol.name];
                }

                vm.recordEditModel.rows[rowIndex][column.name] = tuple.displayname.value;
            }, function noDataSelected() {
                // do nothing
                // TODO: nned catchall here
            });
        }

        function clearForeignKey(rowIndex, column) {
            var model = vm.recordEditModel;

            var foreignKeyColumns = column.foreignKey.colset.columns;
            for (var i = 0; i < foreignKeyColumns.length; i++) {
                var referenceCol = foreignKeyColumns[i];

                delete model.submissionRows[rowIndex][referenceCol.name];
                if ($rootScope.tuples) $rootScope.tuples[rowIndex].data[referenceCol.name] = null;
            }

            model.rows[rowIndex][column.name] = null;
        }

        function createRecord(column) {
            // TODO: wrapper function with catch here
            var newRef = column.reference.contextualize.entryCreate;
            var appURL = newRef.appLink;
            if (!appURL) {
                AlertsService.addAlert({type: 'error', message: "Application Error: app linking undefined for " + newRef.compactPath});
            }
            else {
                $window.open(appURL, '_blank');
            }
        }

        function copyFormRow() {
            if ((vm.numberRowsToAdd + vm.recordEditModel.rows.length) > vm.MAX_ROWS_TO_ADD || vm.numberRowsToAdd < 1) {
                AlertsService.addAlert({type: "error", message: "Cannot add " + vm.numberRowsToAdd + " records. Please input a value between 1 and " + (vm.MAX_ROWS_TO_ADD - vm.recordEditModel.rows.length) + ', inclusive.'});
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
                    AlertsService.addAlert({type: 'error', message: "Sorry, we can't copy this record because it has invalid values in it. Please check its fields and try again."});
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

                    rowset.push(transformedRow);
                    vm.recordEditModel.submissionRows.push(submissionRow);
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
                // If the column is a pseudo column, it needs to get the originating columns name for data submission
                if (column.isPseudo) {

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
                // not pseudo, column.name is sufficient for the keys
                } else {
                    // set null if not set so that the whole data object is filled out for posting to ermrestJS
                    submissionRow[column.name] = (transformedRow[column.name] === undefined) ? null : transformedRow[column.name];
                }
            });

            return submissionRow;
        }

        function removeFormRow(index) {
            vm.recordEditModel.rows.splice(index, 1);
            vm.recordEditModel.submissionRows.splice(index, 1);
            $timeout(function() {
                onResize();
            }, 10);
        }

        function columnToDisplayType(column) {
            var name = column.name;
            var type = column.type.name;
            var displayType;
            if (isForeignKey(column)) {
                displayType = 'popup-select';
            } else {
                switch (type) {
                    case 'timestamp':
                    case 'timestamptz':
                        displayType = 'timestamp';
                        break;
                    case 'date':
                        displayType = 'date';
                        break;
                    case 'float4':
                    case 'float8':
                    case 'numeric':
                        displayType = 'number';
                        break;
                    case 'int2':
                        displayType = 'integer2';
                        break;
                    case 'int4':
                        displayType = 'integer4';
                        break;
                    case 'int8':
                        displayType = 'integer8';
                        break;
                    case 'boolean':
                        displayType = 'boolean';
                        break;
                    case 'markdown':
                    case 'longtext':
                        displayType = 'longtext';
                        break;
                    case 'shorttext':
                    default:
                        displayType = 'text';
                        break;
                }
            }
            return displayType;
        }

        // Returns true if column.getInputDisabled returns truthy OR if column was prefilled via cookie
        function isDisabled(column) {
            try {
                if (column.getInputDisabled(context.appContext)) {
                    return true;
                } else if (vm.prefillCookie) {
                    return vm.prefillCookie.constraintName == column.name;
                }
                return false;
            } catch (e) {
                $log.info(e);
            }
        }

        function isForeignKey(column) {
            return column.isPseudo;
        }

        // Returns true if a column type is found in the given array of types
        function matchType(columnType, types) {
            if (types.indexOf(columnType) !== -1) {
                return true;
            }
            return false;
        }

        function getDisabledInputValue(column, value) {
            try {
                var disabled = column.getInputDisabled(context.appContext);
                if (disabled) {
                    if (typeof disabled === 'object') {
                        return disabled.message;
                    } else if (vm.editMode) {
                        return value;
                    }
                    return '';
                } else if (isForeignKey(column)) {
                    return 'Select a value';
                }
            } catch (e) {
                $log.info(e);
            }
        }

        // Assigns the current date or timestamp to a column's model
        function applyCurrentDatetime(modelIndex, columnName, columnType) {
            if (columnType === 'timestamp' || columnType === 'timestamptz') {
                return vm.recordEditModel.rows[modelIndex][columnName] = {
                    date: moment().format('YYYY-MM-DD'),
                    time: moment().format('hh:mm:ss'),
                    meridiem: moment().format('A')
                }
            }
            return vm.recordEditModel.rows[modelIndex][columnName] = moment().format('YYYY-MM-DD');
        }

        // Toggle between AM/PM for a time input's model
        function toggleMeridiem(modelIndex, columnName) {
            // If the entire timestamp model doesn't exist, initialize it with a default meridiem
            if (!vm.recordEditModel.rows[modelIndex][columnName]) {
                vm.recordEditModel.rows[modelIndex][columnName] = {meridiem: 'AM'};
            }
            // Do the toggling
            var meridiem = vm.recordEditModel.rows[modelIndex][columnName].meridiem;
            if (meridiem.charAt(0).toLowerCase() === 'a') {
                return vm.recordEditModel.rows[modelIndex][columnName].meridiem = 'PM';
            }
            return vm.recordEditModel.rows[modelIndex][columnName].meridiem = 'AM';
        }

        function clearModel(modelIndex, columnName, columnType) {
            if (columnType === 'timestamp' || columnType === 'timestamptz') {
                return vm.recordEditModel.rows[modelIndex][columnName] = {date: null, time: null, meridiem: 'AM'};
            }
            return vm.recordEditModel.rows[modelIndex][columnName] = null;
        }

        function isRequired(column) {
            if (!column.nullok && !isDisabled(column)) {
                return true;
            }
            return false;
        }

        // Given an $event, this will blur or removes the focus from the element that triggerd the event
        function blurElement(e) {
            e.currentTarget.blur();
        }

        /*------------------------code below is for fixing the column names when scrolling -----------*/

        var captionColumnWidth = 150;
        var marginLeft = captionColumnWidth + 10;

        // Sets a fixed width for the columns, as they're positioned absolute
        vm.captionColumnWidth = { 'width' : captionColumnWidth + "px" };

        // Sets margin-left for the formedit div as the first columns are positioned absolute
        // to avoid overlap between them
        vm.formEditDivMarginLeft = { 'margin-left': marginLeft + "px", 'padding-right': '0px', 'padding-left': '0px' };

        // Sets a fixed header height to match the border for the columns
        var headerHeight = 47;
        vm.headerHeight = { 'height' : headerHeight + "px" };

        // Adds height and width to the first empty heading of the first row
        // to make it uniform
        vm.firstHeaderStyle = {
            'width' : captionColumnWidth + "px",
            'height' : headerHeight + "px"
        };
        vm.tableWidth = { width: '0px' };

        // Get root element
        var element = document.querySelector('.ng-scope');
        var $rootElement = angular.element(element).injector().get('$rootElement');

        var formContainerEl = $rootElement.find('.form-container');

        // Get the formedit div
        var elem = $rootElement.find('#formEdit');

        var tableEl = elem.find('table');
        var scrollContainer = formContainerEl.find('#formEditScroll');

        var elemHeight;
        var trs;
        var scope = $rootScope;


        // Set outer width of element to be less by caption column Width and add buttonWidth,
        // so that it doesn't scrolls due to the margin-left applied before extra padding
        function onResize(doNotInvokeEvent) {
            var elemWidth = formContainerEl.outerWidth();
            vm.formEditDivMarginLeft.width = elemWidth - captionColumnWidth - 30;

            if (vm.recordEditModel.rows.length > 1) {
                vm.tableWidth.width =  (tableEl.outerWidth()) + "px";
            } else {
                vm.tableWidth.width =  (tableEl.outerWidth() - captionColumnWidth - 50) + "px";
            }

            if (!editMode) {
                vm.formEditDivMarginLeft.width = vm.formEditDivMarginLeft.width -30 -5;
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

        // Listen to window resize event to change the width of div formEdit
        angular.element($window).bind('resize', function() {
            onResize();
        });

        var editMode = vm.editMode;

        // This function is called whenever the height of formEdit div changes
        // This might be because of selecting/clearing something from the popup for foreighn keys
        // It is called initially once, to adjust heights of fixed columns according to their next td element
        function resizeColumns() {

            // Set timer null to reset settimeout
            timer = null;

            // get current height of div formEdit
            var h = elem.height();

            // If current height of div formEdit has changed than the previous one
            if (elemHeight !== h) {

                // Get height of formEdit div to use for resizing the fixed columns height
                // This should be done once only
                if (!elemHeight) elemHeight = elem.outerHeight();

                // Get all rows of the table
                if (!trs) trs = elem.find('tr.entity');

                // iterate over each row
                for(var i=0;i<trs.length;i++) {
                    // Get the height of the first column and  second column of the row
                    // Which are the key and value for the row

                    var keytdHeight = trs[i].children[0].getAttribute('data-height');
                    if (keytdHeight == null) {
                        keytdHeight = trs[i].children[0].offsetHeight;
                        trs[i].children[0].setAttribute('data-height', keytdHeight);
                    }

                    var valuetdHeight = trs[i].children[1].offsetHeight;

                    if (editMode && i==0) valuetdHeight++;

                    // If keytdHeight is greater than valuetdHeight
                    // then set valuetdHeight
                    // else change coltdHeight for viceversa condition
                    if (keytdHeight > valuetdHeight) {
                        trs[i].children[1].height = keytdHeight;
                    } else if (valuetdHeight > keytdHeight)  {
                        trs[i].children[0].height = valuetdHeight;
                    }
                }
            }
        }



        var TIMER_INTERVAL = 50; //play with this to get a balance of performance/responsiveness
        var timer;

        // Watch for height changes on the rootscope
        $rootScope.$watch(function() {
            timer = timer ||
            $timeout(function() {
                  resizeColumns();
            }, TIMER_INTERVAL, false);
        });
    }]);
})();
