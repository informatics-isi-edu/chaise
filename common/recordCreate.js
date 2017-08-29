(function() {
    'use strict';
    angular.module('chaise.recordcreate', ['chaise.errors']).factory("recordCreate", ['$rootScope', '$cookies', '$log', '$window', '$uibModal', 'AlertsService', 'DataUtils', 'MathUtils', 'UriUtils', function($rootScope, $cookies, $log, $window, $uibModal, AlertsService, DataUtils, MathUtils, UriUtils) {

        // .factory("recordCreate", ['AlertsService', '$cookies', '$log', 'UriUtils', 'DataUtils', 'ErrorService', 'MathUtils', 'messageMap', '$rootScope', '$window', '$scope', '$uibModal', '$controller', function (AlertsService, $cookies, $log, UriUtils, DataUtils, ErrorService, MathUtils, messageMap, $rootScope, $window, $scope, $uibModal, $controller) {
        var viewModel = {};
        var GV_recordEditModel = {},
            completed = {};
        var addRecordRequests = {}; // <generated unique id : reference of related table>
        var editRecordRequests = {}; // generated id: {schemaName, tableName}
        var updated = {};


        function uploadFiles(submissionRowsCopy, isUpdate, onSuccess) {

            // If url is valid
            // if (areFilesValid(submissionRowsCopy)) {
            if (1) {
                $uibModal.open({
                    templateUrl: "../common/templates/uploadProgress.modal.html",
                    controller: "UploadModalDialogController",
                    controllerAs: "ctrl",
                    size: "md",
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        params: {
                            reference: $rootScope.reference,
                            rows: submissionRowsCopy
                        }
                    }
                }).result.then(onSuccess, function(exception) {
                    viewModel.readyToSubmit = false;
                    viewModel.submissionButtonDisabled = false;

                    if (exception) AlertsService.addAlert(exception.message, 'error');
                });
            } else {
                viewModel.readyToSubmit = false;
                viewModel.submissionButtonDisabled = false;
            }
        }

        function addRecords(isUpdate, derivedref, recordEditModel, isModalUpdate, onSuccessFunction) {
            var model = isModalUpdate ? GV_recordEditModel : recordEditModel;
            var form = viewModel.formContainer;

            // this will include updated and previous raw values.
            var submissionRowsCopy = [];

            model.submissionRows.forEach(function(row) {
                submissionRowsCopy.push(Object.assign({}, row));
            });

            /**
             * Add raw values that are not visible to submissionRowsCopy:
             *
             * submissionRowsCopy is the datastructure that will be used for creating
             * the upload url. It must have all the visible and invisible data.
             * The following makes sure that submissionRowsCopy has all the underlying data
             */
            if (isUpdate) {
                for (var i = 0; i < submissionRowsCopy.length; i++) {
                    var newData = submissionRowsCopy[i];
                    var oldData = $rootScope.tuples[i].data;

                    // make sure submissionRowsCopy has all the data
                    for (var key in oldData) {
                        if (key in newData) continue;
                        newData[key] = oldData[key];
                    }
                }
            }

            //call uploadFiles which will upload files and callback on success
            uploadFiles(submissionRowsCopy, isUpdate, function() {

                var fn = "create",
                    args = [submissionRowsCopy];
                var fnScope = isModalUpdate ? derivedref.unfilteredReference.contextualize.entryCreate : $rootScope.reference.unfilteredReference.contextualize.entryCreate;

                if (isUpdate) {

                    /**
                     * After uploading files, the returned submissionRowsCopy contains
                     * new file data. This includes filename, filebyte, and md5.
                     * The following makes sure that all the data are updated.
                     * That's why this for loop must be after uploading files and not before.
                     * And we cannot just pass submissionRowsCopy to update function, because
                     * update function only accepts array of tuples (and not just key-value pair).
                     */
                    for (var i = 0; i < submissionRowsCopy.length; i++) {
                        var row = submissionRowsCopy[i];
                        var data = $rootScope.tuples[i].data;
                        // assign each value from the form to the data object on tuple
                        for (var key in row) {
                            data[key] = (row[key] === '' ? null : row[key]);
                        }
                    }

                    // submit $rootScope.tuples because we are changing and
                    // comparing data from the old data set for the tuple with the updated data set from the UI
                    fn = "update", fnScope = $rootScope.reference, args = [$rootScope.tuples];
                }

                fnScope[fn].apply(fnScope, args).then(function success(result) {

                    var page = result.successful;
                    var failedPage = result.failed;

                    // the returned reference is contextualized and we don't need to contextualize it again
                    var resultsReference = page.reference;
                    if (isUpdate) {
                        for (var i = 0; i < submissionRowsCopy.length; i++) {
                            var row = submissionRowsCopy[i];
                            var data = $rootScope.tuples[i].data;
                            // assign each value from the form to the data object on tuple
                            for (var key in row) {
                                data[key] = (row[key] === '' ? null : row[key]);
                            }
                        }

                        // check if there is a window that opened the current one
                        // make sure the update function is defined for that window
                        // verify whether we still have a valid vaue to call that function with
                        if (window.opener && window.opener.updated && context.queryParams.invalidate) {
                            window.opener.updated(context.queryParams.invalidate);
                        }
                    } else {
                        if (!isModalUpdate) {
                            $cookies.remove($rootScope.context.queryParams.prefill);


                            // add cookie indicating record added
                            if ($rootScope.context.queryParams.invalidate) {
                                $cookies.put($rootScope.context.queryParams.invalidate, submissionRowsCopy.length, {
                                    expires: new Date(Date.now() + (60 * 60 * 24 * 1000))
                                });
                            }
                        }
                    }
                    viewModel.readyToSubmit = false; // form data has already been submitted to ERMrest

                    if (!isModalUpdate) {
                        onSuccessFunction(page);
                    } else {
                        onSuccessFunction(model, page, result);
                    }
                }).catch(function(exception) {
                    viewModel.submissionButtonDisabled = false;
                    if (exception instanceof ERMrest.NoDataChangedError) {
                        AlertsService.addAlert(exception.message, 'warning');
                    } else {
                        AlertsService.addAlert(exception.message, 'error');
                    }
                });

            });

        }

        function isDisabled(column) {
            try {
                31
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
                if (rowVal && !col.getInputDisabled($rootScope.context.appContext)) {
                    switch (col.type.name) {
                        case "timestamp":
                        case "timestamptz":
                            if (viewModel.readyToSubmit) {
                                if (rowVal.date && rowVal.time && rowVal.meridiem) {
                                    rowVal = moment(rowVal.date + rowVal.time + rowVal.meridiem, 'YYYY-MM-DDhh:mm:ssA').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                                } else if (rowVal.date && rowVal.time === null) {
                                    rowVal.time = '00:00:00';
                                    rowVal = moment(rowVal.date + rowVal.time + rowVal.meridiem, 'YYYY-MM-DDhh:mm:ssA').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                                    // in create if the user doesn't change the timestamp field, it will be an object in form {time: null, date: null, meridiem: AM}
                                    // meridiem should never be null,time can be left empty (null) but the case above would catch that.
                                } else if (!rowVal.date) {
                                    rowVal = null;
                                }
                            }
                            break;
                        case "json":
                        case "jsonb":
                            rowVal = JSON.parse(rowVal);
                            break;
                        default:
                            if (col.isAsset) {
                                if (!viewModel.readyToSubmit) {
                                    rowVal = {
                                        url: ""
                                    };
                                }
                            }
                            break;
                    }
                }
                transformedRow[col.name] = rowVal;
            }
            return transformedRow;
        }

        function populateSubmissionRow(modelRow, submissionRow, originalTuple, columns, editOrCopy) {
            var transformedRow = transformRowValues(modelRow);
            columns.forEach(function(column) {
                // If the column is a foreign key column, it needs to get the originating columns name for data submission
                if (column.isForeignKey) {

                    var foreignKeyColumns = column.foreignKey.colset.columns;
                    for (var k = 0; k < foreignKeyColumns.length; k++) {
                        var referenceColumn = foreignKeyColumns[k];
                        var foreignTableColumn = column.foreignKey.mapping.get(referenceColumn);
                        // check if value is set in submission data yet
                        if (!submissionRow[referenceColumn.name]) {

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

        function updateViewModel(cookie) {
            var recordEditModel = {
                table: {},
                rows: [{}], // rows of data in the form, not the table from ERMrest
                oldRows: [{}], // Keep a copy of the initial rows data so that we can see if user has made any changes later
                submissionRows: [{}] // rows of data
            };
            // Update view model
            recordEditModel.rows[recordEditModel.rows.length - 1][cookie.constraintName] = cookie.rowname.value;

            // Update submission model
            var columnNames = Object.keys(cookie.keys);
            columnNames.forEach(function(colName) {
                var colValue = cookie.keys[colName];
                recordEditModel.submissionRows[recordEditModel.submissionRows.length - 1][colName] = colValue;
            });
            GV_recordEditModel = recordEditModel;
        }
        var addPopup = function(ref, rowIndex, derivedref, isModalUpdate) {
            var column = ref;
            // if (isDisabled(column)) return;


            var originalTuple, nullArr = [],
                editOrCopy = true,
                params = {};

            // pass the reference as a param for the modal
            // call to page with tuple to get proper reference

            if (viewModel.editMode) {
                originalTuple = $rootScope.tuples[rowIndex];
            } else {
                originalTuple = null;
                editOrCopy = false;
            }

            //var submissionRow = populateSubmissionRow(GV_recordEditModel.rows[rowIndex], GV_recordEditModel.submissionRows[rowIndex], originalTuple, $rootScope.reference.columns, editOrCopy);
            // var ref1 = isModalUpdate?ref.unfilteredReference.contextualize.compact:ref.filteredRef(submissionRow).contextualize.compactSelect;
            var ref1 = ref.unfilteredReference.contextualize.compact;
            params.reference = ref1.contextualize.compactSelect;
            params.reference.session = $rootScope.session;
            params.context = "compact/select";
            params.selectMode = isModalUpdate ? "multi-select" : "single-select";

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

            modalInstance.result.then(function dataSelected(tuples) {
                // tuple - returned from action in modal (should be the foreign key value in the recrodedit reference)
                // set data in view model (model.rows) and submission model (model.submissionRows)
                if (!isModalUpdate) {
                    var foreignKeyColumns = ref.foreignKey.colset.columns;
                    for (var i = 0; i < foreignKeyColumns.length; i++) {
                        var referenceCol = foreignKeyColumns[i];
                        var foreignTableCol = ref.foreignKey.mapping.get(referenceCol);

                        GV_recordEditModel.submissionRows[rowIndex][referenceCol.name] = tuples.data[foreignTableCol.name];
                        return GV_recordEditModel;
                    }
                } else {
                    var key_subRow = {},
                        key_row = {};
                    angular.copy(GV_recordEditModel.submissionRows[0], key_subRow);
                    angular.copy(GV_recordEditModel.rows[0], key_row);
                    // for (i = 1; i < tuples.length; i++) {
                    //     GV_recordEditModel.submissionRows.push(key_subRow);
                    //     GV_recordEditModel.rows.push(key_row);
                    // }
                    for (i = 0; i < tuples.length; i++) {
                        if (i != 0) {
                            var ob1 = {},
                                ob2 = {};
                            angular.copy(key_subRow, ob1)
                            angular.copy(key_row, ob2)
                            ob1[column.table.name] = tuples[i].data['term'];
                            GV_recordEditModel.submissionRows.push(ob1);
                            ob2[column.columns[0].name] = tuples[i].displayname.value;
                            GV_recordEditModel.rows.push(ob2);
                        } else {
                            GV_recordEditModel.submissionRows[i][column.table.name] = tuples[i].data['term'];
                            GV_recordEditModel.rows[i][column.columns[0].name] = tuples[i].displayname.value;
                        }
                    }
                }
                if (isModalUpdate)
                    addRecords(viewModel.editMode, derivedref, nullArr, isModalUpdate, viewModel.onSuccess);

            });
        }
        var addRelatedRecord = function(ref, rowIndex, modelObject, isModal) {

            updateViewModel(modelObject);
            var derivedref = isModal ? ref.derivedAssociationReference : null;
            // var refToPass =  isModal?ref.unfilteredReference.contextualize.compact;
            addPopup(ref, 0, derivedref, isModal);
        };



        // function called from form.controller.js to notify record that an entity was just updated
        window.updated = function(id) {
            updated[editRecordRequests[id].schema + ":" + editRecordRequests[id].table] = true;
            delete editRecordRequests[id];
        }
        var testfunction = function(p) {
            return p * 3;
        }

        function addRelatedRecordFact(isModalUpdate, ref, rowIdx, modelObject, editMode, formContainer, readyToSubmit, recordsetLink, resultsetModel, resultset, submissionButtonDisabled, omittedResultsetModel, onSuccess) {
            viewModel.onSuccess = onSuccess;
            viewModel.editMode = editMode;
            viewModel.formContainer = formContainer;
            viewModel.readyToSubmit = readyToSubmit;
            viewModel.recordsetLink = recordsetLink;
            viewModel.resultsetModel = resultsetModel;
            viewModel.resultset = resultset;
            viewModel.submissionButtonDisabled = submissionButtonDisabled;
            viewModel.omittedResultsetModel = omittedResultsetModel;
            addRelatedRecord(ref, rowIdx, modelObject, isModalUpdate);
        }

        return {
            addRelatedRecordFact: addRelatedRecordFact,
            addRecords: addRecords,
            testfunction: testfunction
        }
    }])
})();
