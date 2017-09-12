(function() {
    'use strict';
    angular.module('chaise.recordcreate', ['chaise.errors','chaise.utils']).factory("recordCreate", ['$cookies', '$log', '$window', '$uibModal', 'AlertsService', 'DataUtils', 'UriUtils', 'modalBox',
     function($cookies, $log, $window, $uibModal, AlertsService, DataUtils, UriUtils, modalBox) {

        var viewModel = {};
        var GV_recordEditModel = {},
            completed = {};
        var addRecordRequests = {}; // <generated unique id : reference of related table>
        var editRecordRequests = {}; // generated id: {schemaName, tableName}
        var updated = {};

        /**
         * checkUpdate - to check all recrds are updated; passed as callback to uploadFiles().
         *
         * @param  {array} submissionRowsCopy   array contains updated recrds attributes
         * @param  {array} rsTuples             array with data tuples value from calling function
         * @return  {array} data                key-value pair of updated records
         */
        function checkUpdate(submissionRowsCopy, rsTuples){
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
                var data = rsTuples[i].data;
                // assign each value from the form to the data object on tuple
                for (var key in row) {
                    data[key] = (row[key] === '' ? null : row[key]);
                }
            }
            return data;
        }

        /**
         * uploadFiles - uploading files
         *
         * @param  {array} submissionRowsCopy   data that is going to be uploaded
         * @param  {object} rsReference         rootscope reference from calling function
         * @param  {object} onSuccess           callback
         */
        function uploadFiles(submissionRowsCopy, rsReference, onSuccess) {

                $uibModal.open({
                    templateUrl: "../common/templates/uploadProgress.modal.html",
                    controller: "UploadModalDialogController",
                    controllerAs: "ctrl",
                    size: "md",
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        params: {
                            reference: rsReference,
                            rows: submissionRowsCopy
                        }
                    }
                }).result.then(onSuccess, function(exception) {
                    viewModel.readyToSubmit = false;
                    viewModel.submissionButtonDisabled = false;

                    if (exception) AlertsService.addAlert(exception.message, 'error');
                });
        }

        /**
         * addRecords - Function that calls ermrestjs method to add data
         *
         * @param  {bool} isUpdate              flag
         * @param  {object} derivedref          derived referene of the column that is being added
         * @param  {array} recordEditModel      data array
         * @param  {bool} isModalUpdate         if updating through record app
         * @param  {object} rsReference         rootscope reference from calling function
         * @param  {array} rsTuples             ootscope tuples array from calling function
         * @param  {object} rsQueryParams       object contains queryparams of context from calling function
         * @param  {object} onSuccessFunction   callback
         */
        function addRecords(isUpdate, derivedref, recordEditModel, isModalUpdate, rsReference, rsTuples, rsQueryParams, onSuccessFunction) {
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
                    var oldData = rsTuples[i].data;

                    // make sure submissionRowsCopy has all the data
                    for (var key in oldData) {
                        if (key in newData) continue;
                        newData[key] = oldData[key];
                    }
                }
            }

            //call uploadFiles which will upload files and callback on success
            uploadFiles(submissionRowsCopy, rsReference, function() {

                var fn = "create",
                    args = [submissionRowsCopy];
                var fnScope = isModalUpdate ? derivedref.unfilteredReference.contextualize.entryCreate : rsReference.unfilteredReference.contextualize.entryCreate;

                if (isUpdate) {

                    var data = checkUpdate(submissionRowsCopy, rsTuples);

                    // submit rootScope.tuples because we are changing and
                    // comparing data from the old data set for the tuple with the updated data set from the UI
                    fn = "update", fnScope = rsReference, args = [rsTuples];
                }

                fnScope[fn].apply(fnScope, args).then(function success(result) {

                    var page = result.successful;
                    var failedPage = result.failed;

                    // the returned reference is contextualized and we don't need to contextualize it again
                    var resultsReference = page.reference;
                    if (isUpdate) {
                        var data = checkUpdate(submissionRowsCopy, rsTuples);
                        // check if there is a window that opened the current one
                        // make sure the update function is defined for that window
                        // verify whether we still have a valid vaue to call that function with
                        if (window.opener && window.opener.updated && rootScope.context.queryParams.invalidate) {
                            window.opener.updated(rsQueryParams.invalidate);
                        }
                    } else {
                        if (!isModalUpdate) {
                            $cookies.remove(rsQueryParams.prefill);


                            // add cookie indicating record added
                            if (rsQueryParams.invalidate) {
                                $cookies.put(rsQueryParams.invalidate, submissionRowsCopy.length, {
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

        /**
         * updateViewModel - Will add the cookie and also initialize the values for the main table.
         *
         * @param  {type} cookie object which has initial value
         */
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

        /**
         * var addPopup - Create pop-up for user to select values
         *
         * @param  {object} ref             column reference
         * @param  {int} rowIndex           row index
         * @param  {object} derivedref      derived referene of the column that is being added
         * @param  {bool} isModalUpdate     flag
         * @param  {object} rsReference     object contains rootscope reference from calling function
         * @param  {array} rsTuples         rootscope tuples array from calling function
         * @param  {object} rsSession       contains session object from calling function
         * @param  {object} rsQueryParams   object contains queryparams of context from calling function
         */
        var addPopup = function(ref, rowIndex, derivedref, isModalUpdate, rsReference, rsTuples, rsSession, rsQueryParams) {
            var column = ref;

            var originalTuple, nullArr = [],
                editOrCopy = true,
                params = {};

            if (viewModel.editMode) {
                originalTuple = rsTuples[rowIndex];
            } else {
                originalTuple = null;
                editOrCopy = false;
            }
            var ref_temp = ref.unfilteredReference.contextualize.compact;
            params.reference = ref_temp.contextualize.compactSelect;
            params.reference.session = rsSession;
            params.context = "compact/select";
            params.selectMode = isModalUpdate ? modalBox.multiSelectMode : modalBox.singleSelectMode;

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
                // we assume that the data for the main table has been populated before
                var mapping = derivedref._secondFKR.mapping;

                for (i = 0; i < tuples.length; i++) {
                    derivedref._secondFKR.key.colset.columns.forEach(function(col) {
                        if (angular.isUndefined(GV_recordEditModel.submissionRows[i])) {
                            var obj = {};
                            angular.copy(GV_recordEditModel.submissionRows[i - 1], obj);
                            GV_recordEditModel.submissionRows.push(obj);
                        }
                        GV_recordEditModel.submissionRows[i][mapping.getFromColumn(col).name] = tuples[i].data[col.name];
                    });

                }
                if (isModalUpdate)
                    addRecords(viewModel.editMode, derivedref, nullArr, isModalUpdate, rsReference, rsTuples, rsQueryParams, viewModel.onSuccess);

            });
        }

        /**
         * var addRelatedRecord - begining of the record addition
         *
         * @param  {object} ref             column object
         * @param  {int} rowIndex           row index
         * @param  {object} modelObject     object holds peripheral attributes
         * @param  {bool} isModal           if creating via record app
         * @param  {object} rsReference     object contains rootscope reference from calling function
         * @param  {array} rsTuples         rootscope tuples array from calling function
         * @param  {object} rsSession       contains session object from calling function
         * @param  {object} rsQueryParams   object contains queryparams of context from calling function
         */
        var addRelatedRecord = function(ref, rowIndex, modelObject, isModal, rsReference, rsTuples, rsSession, rsQueryParams) {

            updateViewModel(modelObject);
            var derivedref = isModal ? ref.derivedAssociationReference : null;
            addPopup(ref, 0, derivedref, isModal, rsReference, rsTuples, rsSession, rsQueryParams);
        };

        /**
         * addRelatedRecordFact - Exposed API for adding records.
         *
         * @param  {bool} isModalUpdate             Create via record app
         * @param  {obj} ref                        column reference
         * @param  {int} rowIdx                     row index
         * @param  {obj} modelObject                object holds peripheral attributes
         * @param  {bool} editMode                  mode is edit or add
         * @param  {obj} formContainer              contains DOM attributes
         * @param  {bool} readyToSubmit             if ready to call create function
         * @param  {obj} recordsetLink              after update link should be redirected
         * @param  {bool} submissionButtonDisabled  disable submission button
         * @param  {object} rsReference             object contains rootscope reference from calling function
         * @param  {array} rsTuples                 rootscope tuples array from calling function
         * @param  {object} rsSession               contains session object from calling function
         * @param  {object} rsQueryParams           object contains queryparams of context from calling function
         * @param  {callback} onSuccess             callback
         */
        function addRelatedRecordFact(isModalUpdate, ref, rowIdx, modelObject, editMode, formContainer, readyToSubmit, recordsetLink, submissionButtonDisabled, rsReference, rsTuples, rsSession, rsQueryParams, onSuccess) {
            viewModel.onSuccess = onSuccess;
            viewModel.editMode = editMode;
            viewModel.formContainer = formContainer;
            viewModel.readyToSubmit = readyToSubmit;
            viewModel.recordsetLink = recordsetLink;
            viewModel.submissionButtonDisabled = submissionButtonDisabled;
            addRelatedRecord(ref, rowIdx, modelObject, isModalUpdate, rsReference, rsTuples, rsSession, rsQueryParams);
        }

        return {
            addRelatedRecordFact: addRelatedRecordFact,
            addRecords: addRecords
        }
    }])
})();
