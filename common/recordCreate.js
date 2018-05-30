(function() {
    'use strict';
    angular.module('chaise.recordcreate', ['chaise.errors','chaise.utils'])

    .factory("recordCreate", ['$cookies', '$log', '$q', '$rootScope', '$window', 'AlertsService', 'DataUtils', 'logActions', 'messageMap', 'modalBox', 'modalUtils', 'Session', 'UriUtils',
        function($cookies, $log, $q, $rootScope, $window, AlertsService, DataUtils, logActions, messageMap, modalBox, modalUtils, Session, UriUtils) {

        var viewModel = {};
        var GV_recordEditModel = {},
            completed = {};
        var addRecordRequests = {}; // <generated unique id : reference of related table>
        var editRecordRequests = {}; // generated id: {schemaName, tableName}
        var updated = {};


        /**
         * areFilesValid - checks whether file columns are getting the correct url and are not null if nullok is false
         *
         * @param  {array} rows           array contains updated recrds attributes
         * @param  {object} rsReference   record reference object
         * @return {boolean}              whether rows have valid file columns or not
         */
        function areFilesValid(rows, rsReference) {
            var isValid = true, index = 0;
            // Iterate over all rows that are passed as parameters to the modal controller
            rows.forEach(function(row) {

                index++;

                // Iterate over each property/column of a row
                for(var k in row) {

                    // If the column type is object and has a file property inside it
                    // Then increment the count for no of files and create an uploadFile Object for it
                    // Push this to the tuple array for the row
                    // NOTE: each file object has an hatracObj property which is an hatrac object
                    try {
                        var column = rsReference.columns.find(function(c) { return c.name == k;  });
                        if (column.isAsset) {

                            if (row[k].url == "" && !column.nullok) {
                                isValid = false;
                                AlertsService.addAlert("Please select file for column " + k + " for record " + index, 'error');
                            } else if (row[k] != null && typeof row[k] == 'object' && row[k].file) {
                                try {
                                    if (!row[k].hatracObj.validateURL(row)) {
                                        isValid = false;
                                        AlertsService.addAlert("Invalid url template for column " + k + " for record " + index, 'error');
                                    }
                                } catch(e) {
                                    isValid = false;
                                    AlertsService.addAlert("Invalid url template for column " + k + " for record " + index, 'error');
                                }
                            }
                        }
                    } catch(e) {
                        //NOthing to do
                    }
                }
            });

            return isValid;
        }


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

            // If url is valid
            if (areFilesValid(submissionRowsCopy, rsReference)) {
                modalUtils.showModal({
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
                }, onSuccess, function(exception) {
                    viewModel.readyToSubmit = false;
                    viewModel.submissionButtonDisabled = false;

                    if (exception) AlertsService.addAlert(exception.message, 'error');
                });
            } else {
                viewModel.readyToSubmit = false;
                viewModel.submissionButtonDisabled = false;
            }
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
         * @param  {object} vm                  recoredit view model
         * @param  {object} onSuccessFunction   callback
         * @param  {object} logObject           The object that we want to log in the create/update request
         */
        function addRecords(isUpdate, derivedref, recordEditModel, isModalUpdate, rsReference, rsTuples, rsQueryParams, vm, onSuccessFunction, logObject) {
            var model = isModalUpdate ? GV_recordEditModel : recordEditModel;
            viewModel = vm;
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
                    args = [submissionRowsCopy, logObject];
                var fnScope = isModalUpdate ? derivedref.unfilteredReference.contextualize.entryCreate : rsReference.unfilteredReference.contextualize.entryCreate;

                if (isUpdate) {
                    var data = checkUpdate(submissionRowsCopy, rsTuples);
                    // submit rootScope.tuples because we are changing and
                    // comparing data from the old data set for the tuple with the updated data set from the UI
                    fn = "update", fnScope = rsReference, args = [rsTuples, logObject];
                }

                fnScope[fn].apply(fnScope, args).then(function success(result) {

                    var page = result.successful;
                    var failedPage = result.failed;

                    // the returned reference is contextualized and we don't need to contextualize it again
                    var resultsReference = page.reference;
                    if (isUpdate) {
                        var data = checkUpdate(submissionRowsCopy, rsTuples);
                        try {
                            // check if there is a window that opened the current one
                            // make sure the update function is defined for that window
                            // verify whether we still have a valid vaue to call that function with
                            if (window.opener && window.opener.updated && rsQueryParams.invalidate) {
                                window.opener.updated(rsQueryParams.invalidate);
                            }
                        } catch (exp) {
                          // if window.opener is from another origin, this will result in error on accessing any attribute in window.opener
                          // And if it's from another origin, we don't need to call updated since it's not
                          // the same row that we wanted to update in recordset (table directive)
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

                    if (isModalUpdate) {
                        onSuccessFunction();
                    } else {
                        onSuccessFunction(model, result);

                    }
                }).catch(function(exception) {
                    if (exception instanceof ERMrest.ConflictError) {
                        Session.getSession().then(function (session) {
                            if (!session) throw new ERMrest.UnauthorizedError(messageMap.unauthorizedErrorCode, (messageMap.unauthorizedMessage + messageMap.reportErrorToAdmin));
                        });
                    }

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
         * NOTE This function currently only used in record app for adding association.
         * TODO needs refactoring, eventhough it is used only in one case
         * it contains some logic to be used in recordedit too. Also some of the passed arguments
         * are not being used, and some of them are not even available in case of adding association.
         *
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
        var addPopup = function(domainRef, rowIndex, derivedref, isModalUpdate, rsReference, rsTuples, rsSession, rsQueryParams) {
            var originalTuple, nullArr = [],
                editOrCopy = true,
                params = {};

            //TODO needs refactoring
            if (viewModel.editMode) {
                originalTuple = rsTuples[rowIndex];
            } else {
                originalTuple = null;
                editOrCopy = false;
            }

            /**
             * Callback to get the list of disabled tuples.
             * This is only applicable in case of adding related entities.
             * @param  {ERMrest.Page} page     the page object.
             * @param  {int} pageSize the page size for read request.
             * @return {Promise} Promise is resolved with a list of disabled rows (array of tuple objects).
             */
            params.getDisabledTuples = function (page, pageSize) {
                var defer = $q.defer();
                var disabledRows = [], index;

                domainRef.setSamePaging(page).read(pageSize, {action: logActions.preCreateAssociationSelected}).then(function (newPage) {
                    newPage.tuples.forEach(function (newTuple) {
                        index = page.tuples.findIndex(function (tuple) {
                            return tuple.uniqueId == newTuple.uniqueId;
                        });
                        if (index > -1) disabledRows.push(page.tuples[index]);
                    });

                    defer.resolve(disabledRows);
                }).catch(function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            };

            params.reference = domainRef.unfilteredReference.contextualize.compactSelect;
            params.reference.session = rsSession;
            params.context = "compact/select";
            params.selectMode = isModalUpdate ? modalBox.multiSelectMode : modalBox.singleSelectMode;
            params.selectedRows = [];
            params.showFaceting = true;
            params.facetPanelOpen = false;
            //NOTE assumption is that this function is only is called for adding pure and binary association
            params.logObject = {
                action: logActions.preCreateAssociation,
                referrer: rsReference.defaultLogInfo
            };

            modalUtils.showModal({
                animation: false,
                controller: "SearchPopupController",
                controllerAs: "ctrl",
                resolve: {
                    params: params
                },
                size: "xl",
                templateUrl: "../common/templates/searchPopup.modal.html"
            }, function dataSelected(tuples) {
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

                // NOTE this if case is unnecessary, this is always modal update
                if (isModalUpdate) {
                    var logObject = {
                        action: logActions.createAssociation,
                        referrer: rsReference.defaultLogInfo
                    };
                    addRecords(viewModel.editMode, derivedref, nullArr, isModalUpdate, rsReference, rsTuples, rsQueryParams, viewModel, viewModel.onSuccess, logObject);
                }
            }, viewModel.onModalClose);
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
        function addRelatedRecordFact(isModalUpdate, ref, rowIdx, modelObject, editMode, formContainer, readyToSubmit, recordsetLink, submissionButtonDisabled, rsReference, rsTuples, rsSession, rsQueryParams, onSuccess, onModalClose) {
            viewModel.onModalClose = onModalClose;
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
