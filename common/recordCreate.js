(function() {
    'use strict';
    angular.module('chaise.recordcreate', ['chaise.errors','chaise.utils', 'chaise.inputs'])

    .factory("recordCreate", ['$cookies', '$log', '$q', '$rootScope', '$window', 'AlertsService', 'DataUtils', 'Errors', 'ErrorService', 'logService', 'messageMap', 'modalBox', 'modalUtils', 'recordsetDisplayModes', 'Session', 'UriUtils', 'UiUtils', 'InputUtils', 'ConfigUtils', 'dataFormats',
        function($cookies, $log, $q, $rootScope, $window, AlertsService, DataUtils, Errors, ErrorService, logService, messageMap, modalBox, modalUtils, recordsetDisplayModes, Session, UriUtils, UiUtils, InputUtils, ConfigUtils, dataFormats) {

        var viewModel = {};
        var GV_recordEditModel = {},
            completed = {};
        var addRecordRequests = {}; // <generated unique id : reference of related table>
        var editRecordRequests = {}; // generated id: {schemaName, tableName}
        var updated = {};
        var pbModalInstance = null;


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
                    templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/uploadProgress.modal.html",
                    windowClass:"modal-upload-progress",
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

                    if (typeof exception !== "string") {
                        // happens with an error with code 0 (Timeout Error)
                        $log.warn(exception);
                        var message = exception.message || messageMap.errorMessageMissing;

                        // if online, we don't know how to handle the error
                        if ($window.navigator.onLine) AlertsService.addAlert(message, 'error');
                    }
                }, false, false);
            } else {
                viewModel.readyToSubmit = false;
                viewModel.submissionButtonDisabled = false;
            }
        }

        /**
         * addRecords - Function that calls ermrestjs method to add data
         *
         * @param  {bool} isUpdate              flag
         * @param  {object} derivedref          derived reference of the column that is being added
         * @param  {array} recordEditModel      data array
         * @param  {bool} isModalUpdate         if updating through record app
         * @param  {object} rsReference         rootscope reference from calling function
         * @param  {array} rsTuples             ootscope tuples array from calling function
         * @param  {object} rsQueryParams       object contains queryparams of context from calling function
         * @param  {object} vm                  recoredit view model
         * @param  {object} onSuccessFunction   callback
         * @param  {object} logObj           The object that we want to log in the create/update request
         */
        function addRecords(isUpdate, derivedref, recordEditModel, isModalUpdate, rsReference, rsTuples, rsQueryParams, vm, onSuccessFunction, logObj, closeModal) {
            var model = isModalUpdate ? GV_recordEditModel : recordEditModel;
            viewModel = vm;

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

            // validates the session then calls the uploadFiles function and then the submission of the data once upload files returns
            Session.validateSessionBeforeMutation(function () {
                uploadFiles(submissionRowsCopy, rsReference, function() {

                    // success callback after create/update is called on a reference object
                    var submitSuccessCB = function success(result) {
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
                            pbModalInstance.close();
                        } else {
                            onSuccessFunction(model, result);
                        }
                    };

                    // error handling for create/update calls to ermrest
                    var submitErrorHandler = function(exception) {
                        viewModel.submissionButtonDisabled = false;
                        // assume user had been previously logged in (can't create/update without it)
                        // if no valid current session, user should re-login
                        // validate session will never throw an error, so it's safe to not write a reject callback or catch clause
                        Session.validateSession().then(function (session) {
                            if (!session && exception instanceof ERMrest.ConflictError) {
                                // login in a modal should show (Session timed out)
                                throw new ERMrest.UnauthorizedError();
                            }
                            // append link to end of alert.
                            if (exception instanceof ERMrest.DuplicateConflictError) {
                                exception.message += ' Click <a href="' + exception.duplicateReference.contextualize.detailed.appLink + '" target="_blank">here</a> to see the conflicting record that already exists.';
                            }

                            if (isModalUpdate || exception instanceof Errors.DifferentUserConflictError) {
                                // pure and binary add on record page, we want a popup error
                                // if timeout error, also show popup
                                ErrorService.handleException(exception, true);
                            } else {
                                AlertsService.addAlert(exception.message, (exception instanceof ERMrest.NoDataChangedError ? 'warning' : 'error') );
                            }
                        });
                    }

                    var createRef = isModalUpdate ? derivedref.unfilteredReference.contextualize.entryCreate : rsReference.unfilteredReference.contextualize.entryCreate;

                    if (isUpdate) {
                        var data = checkUpdate(submissionRowsCopy, rsTuples);
                        // submit rootScope.tuples because we are changing and
                        // comparing data from the old data set for the tuple with the updated data set from the UI
                    }

                    if (!isUpdate) {
                        createRef.create(submissionRowsCopy, logObj).then(submitSuccessCB).catch(submitErrorHandler);
                    } else {
                        rsReference.update(rsTuples, logObj).then(submitSuccessCB).catch(submitErrorHandler);
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
            cookie.fkColumnNames.forEach(function (cn) {
                recordEditModel.rows[recordEditModel.rows.length - 1][cn] = cookie.rowname.value;
            })

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
         * @param  {object} derivedref      derived reference of the column that is being added
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

            // assumption is that this function is only called for p&b
            params.parentTuple = rsTuples[rowIndex];
            params.parentReference = rsReference;
            params.displayMode = recordsetDisplayModes.addPureBinaryPopup;

            var andFilters = [];
            // loop through all columns that make up the key information for the association with the leaf table and create non-null filters
            domainRef.derivedAssociationReference.associationToRelatedFKR.key.colset.columns.forEach(function (col) {
                andFilters.push({
                    "source": col.name,
                    "hidden": true,
                    "not_null": true
                });
            });

            params.reference = domainRef.unfilteredReference.addFacets(andFilters).contextualize.compactSelectAssociationLink;
            params.selectMode = isModalUpdate ? modalBox.multiSelectMode : modalBox.singleSelectMode;
            params.selectedRows = [];
            params.showFaceting = true;

            // TODO (could be optimized) this is already done in recordutil getTableModel (we just don't have access to the tableModel here)
            var stackElement = logService.getStackNode(
                logService.logStackTypes.RELATED,
                params.reference.table,
                {source: domainRef.compressedDataSource, entity: true}
            );

            var logStack = logService.getStackObject(stackElement),
                logStackPath = logService.getStackPath("", logService.logStackPaths.ADD_PB_POPUP);

            params.logStack = logStack;
            params.logStackPath = logStackPath;

            /**
             * Callback to get the list of disabled tuples.
             * This is only applicable in case of adding related entities.
             * @param  {Object} tableModel the table model
             * @param {Object} page the new page object
             * @param  {Array} requestCauses array of string that indicates why the request is fired
             * @return {Promise} Promise is resolved with a list of disabled rows (array of tuple objects).
             */
            params.getDisabledTuples = function (tableModel, page, requestCauses, reloadStartTime) {
                var defer = $q.defer();
                var disabledRows = [], index, newStack = tableModel.logStack, pageSize = tableModel.pageLimit;

                var action = logService.logActions.LOAD;
                if (Array.isArray(requestCauses) && requestCauses.length > 0) {
                    action = logService.logActions.RELOAD;
                    newStack = logService.addCausesToStack(tableModel.logStack, requestCauses, reloadStartTime);
                }
                var logObj = {
                    action: logService.getActionString(action, tableModel.logStackPath),
                    stack: newStack
                }

                // fourth input: preserve the paging (read will remove the before if number of results is less than the limit)
                domainRef.setSamePaging(page).read(pageSize, logObj, false, true).then(function (newPage) {
                    newPage.tuples.forEach(function (newTuple) {
                        index = page.tuples.findIndex(function (tuple) {
                            return tuple.uniqueId == newTuple.uniqueId;
                        });
                        if (index > -1) disabledRows.push(page.tuples[index]);
                    });

                    defer.resolve({disabledRows: disabledRows, page: page});
                }).catch(function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            };

            params.submitBeforeClose = function dataSelected(res) {
                //TODO this is written only for modal update (multi-select), isModalUpdate is unnecessary

                if (!res || !res.rows) return;
                var tuples = res.rows;

                // tuple - returned from action in modal (should be the foreign key value in the recrodedit reference)
                // set data in view model (model.rows) and submission model (model.submissionRows)
                // we assume that the data for the main table has been populated before
                var mapping = derivedref.associationToRelatedFKR.mapping;

                for (i = 0; i < tuples.length; i++) {
                    derivedref.associationToRelatedFKR.key.colset.columns.forEach(function(col) {
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
                    var logObj = {
                        action: logService.getActionString(logService.logActions.LINK, logStackPath),
                        stack: logStack
                    };
                    addRecords(viewModel.editMode, derivedref, nullArr, isModalUpdate, rsReference, rsTuples, rsQueryParams, viewModel, null, logObj);
                }
            }

            pbModalInstance = modalUtils.showModal({
                animation: false,
                controller: "SearchPopupController",
                windowClass: "search-popup add-pure-and-binary-popup",
                controllerAs: "ctrl",
                resolve: {
                    params: params
                },
                size: modalUtils.getSearchPopupSize(params),
                templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/searchPopup.modal.html"
            }, function (res) {
                viewModel.onSuccess();
            }, function () {
                viewModel.onModalClose();
            }, false);
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

        /**
         * Create a columnModel based on the given column that can be used in recordedit form
         */
        function columnToColumnModel(column) {
            var isDisabled = InputUtils.isDisabled(column);
            var stackNode = logService.getStackNode(
                column.isForeignKey ? logService.logStackTypes.FOREIGN_KEY : logService.logStackTypes.COLUMN,
                column.table,
                {source: column.compressedDataSource, entity: column.isForeignKey}
            );
            var stackPath = column.isForeignKey ? logService.logStackPaths.FOREIGN_KEY : logService.logStackPaths.COLUMN;

            var type;
            if (column.isAsset) {
                type = 'file'
            } else if (isDisabled) {
                type = "disabled";
            } else if (column.isForeignKey) {
                type = 'popup-select';
            } else {
                type =  UiUtils.getInputType(column.type);
            }

            if (type == 'boolean') {
                var trueVal = InputUtils.formatBoolean(column, true),
                    falseVal = InputUtils.formatBoolean(column, false),
                    booleanArray = [trueVal, falseVal];

                // create map
                var booleanMap = {};
                booleanMap[trueVal] = true;
                booleanMap[falseVal] = false;
            }

            return {
                allInput: undefined,
                booleanArray: booleanArray || [],
                booleanMap: booleanMap || {},
                column: column,
                isDisabled: isDisabled,
                isRequired: !column.nullok && !isDisabled,
                inputType: type,
                highlightRow: false,
                showSelectAll: false,
                logStackNode: stackNode, // should not be used directly, take a look at getColumnModelLogStack
                logStackPathChild: stackPath // should not be used directly, use getColumnModelLogAction getting the action string
            };
        }

        /**
         * Given a columnModel and the parent model that it belongs to, return the log stack that should be used.
         * NOTES:
         *   - The parentModel might have a logStack object that is different from $rootScope,
         *     so this function will merge the columnModel.logStackNode with its parent object.
         *   - In some cases (currently viewer annotation form), the logStack that is present on the
         *     parentModel might change, so we cannot create the whole stack while creating the columnModel.
         *     So while creating columnModel I'm just creating the node and on run time the parentLogStack will be added.
         *
         */
        function getColumnModelLogStack(colModel, parentModel) {
            return logService.getStackObject(colModel.logStackNode, parentModel ? parentModel.logStack : null);
        }

        /**
         * Given a columnModel and the parent model that is belogns to, returns the action string that should be used.
         * Take a look at the Notes on getColumnModelLogStack function for more info
         */
        function getColumnModelLogAction(action, colModel, parentModel) {
            var logStackPath = logService.getStackPath(parentModel ? parentModel.logStackPath : null, colModel.logStackPathChild);
            return logService.getActionString(action, logStackPath);
        }

        /**
         * In case of prefill and default we only have a reference to the foreignkey,
         * we should do extra reads to get the actual data.
         *
         * @param  {Object} model the tableModel object
         * @param  {int} rowIndex The row index that this data is for (it's usually zero, first row)
         * @param  {string[]} colNames Array of foreignkey names that can be prefilled
         * @param  {ERMrest.Refernece} fkRef   Reference to the foreign key table
         * @param  {Object} logObj the object will be passed to read as contextHeaderParams
         */
        function _getForeignKeyData (model, rowIndex, colNames, fkRef, logObj) {
            fkRef.contextualize.compactSelectForeignKey.read(1, logObj).then(function (page) {
                colNames.forEach(function (colName) {
                    // default value is validated
                    if (page.tuples.length > 0) {
                        model.foreignKeyData[rowIndex][colName] = page.tuples[rowIndex].data;
                        model.rows[rowIndex][colName] = page.tuples[rowIndex].displayname.value;
                    } else {
                        model.foreignKeyData[rowIndex][colName] = null;
                        model.rows[rowIndex][colName] = null;
                    }

                    $rootScope.showColumnSpinner[rowIndex][colName] = false;
                });
            }).catch(function (err) {
                colNames.forEach(function (colName) {
                    $rootScope.showColumnSpinner[rowIndex][colName] = false;
                });
                $log.warn(err);
            });
        }

        /**
         * - Attach the values for foreignkeys and columns that are prefilled.
         * - Read the actual parent row in order to attach the foreignkeyData
         * @param  {Object} model           the model object that we attach rows and other value to (recordEditModel)
         * @param  {string[]} fkColumnNames An array of the name of foreign key columns
         * @param  {Object} keys            key-value pair of raw values
         * @param  {string} origUrl         the parent url that should be resolved to get the complete row of data
         * @param  {Object} rowname         the default rowname that should be displayed
         */
        function _processPrefilledForeignKeys(model, reference, fkColumnNames, keys, origUrl, rowname) {
            var newRow = model.rows.length - 1;

            fkColumnNames.forEach(function (cn) {
                // Update view model
                model.rows[newRow][cn] = rowname.value;

                // show the spinner that means we're waiting for data.
                $rootScope.showColumnSpinner[newRow][cn] = true;
            });

            // get the actual foreignkey data
            ERMrest.resolve(origUrl, ConfigUtils.getContextHeaderParams()).then(function (ref) {

                // get the first foreignkey relationship between the ref.table and current table
                // and log it as the foreignkey that we are prefilling (eventhough we're prefilling multiple fks)
                var fks = reference.table.foreignKeys.all(), source = {};
                for (var i = 0; i < fks.length; i++) {
                    if (fkColumnNames.indexOf(fks[i].name) !== -1) {
                        source = fks[i].compressedDataSource;
                        break;
                    }
                }

                // create proper logObject
                var stackNode = logService.getStackNode(
                    logService.logStackTypes.FOREIGN_KEY,
                    ref.table,
                    {source: source, entity: true}
                );
                var logStackPath = logService.getStackPath(model.logStackPath, logService.logStackPaths.FOREIGN_KEY);
                var logObj = {
                    action: logService.getActionString(logService.logActions.FOREIGN_KEY_PRESELECT, logStackPath),
                    stack: logService.getStackObject(stackNode, model.logStack)
                }
                _getForeignKeyData(model, newRow, fkColumnNames, ref, logObj);
            }).catch(function (err) {
                fkColumnNames.forEach(function (cn) {
                    $rootScope.showColumnSpinner[newRow][cn] = false;
                });
                $log.warn(err);
            });

            // Update submission and row model
            for (var name in keys) {
                model.rows[newRow][name] = keys[name];
                model.submissionRows[newRow][name] = keys[name];
            }
        }

        function populateCreateModelValues(model, reference, prefillQueryParam, initialValues) {
            // get the prefilled values
            var prefilledColumns = {}, prefilledFks = [];
            if (prefillQueryParam) {
                // get the cookie with the prefill value
                var cookie = $cookies.getObject(prefillQueryParam);

                // make sure cookie is correct
                var hasAllKeys = cookie && ["keys", "fkColumnNames", "origUrl", "rowname"].every(function (k) {
                    return cookie.hasOwnProperty(k);
                });
                if (hasAllKeys) {
                    $rootScope.cookieObj = cookie;

                    // keep a record of freignkeys that are prefilled
                    prefilledFks = cookie.fkColumnNames;

                    // keep a record of columns that are prefilled
                    prefilledColumns = cookie.keys;

                    // process the list of prefilled foreignkeys to get additional data
                    _processPrefilledForeignKeys(model, reference, cookie.fkColumnNames, cookie.keys, cookie.origUrl, cookie.rowname);

                    // Keep a copy of the initial rows data so that we can see if user has made any changes later
                    model.oldRows = angular.copy(model.rows);
                }
            }

            //add initialValues to submissionRows
            if (DataUtils.isObjectAndNotNull(initialValues)) {
                model.submissionRows[0] = initialValues;
            }

            // populate defaults
            for (var i = 0; i < model.columnModels.length; i++) {
                // default model initialiation is null
                var initialModelValue = null;
                var colModel = model.columnModels[i];
                var column = colModel.column;

                // only want to set primitive values in the input fields so make sure it isn't a function, null, or undefined
                var defaultValue = column.default;
                if (DataUtils.isObjectAndNotNull(initialValues) && initialValues[column.name] && !column.isForeignKey) {
                    defaultValue = initialValues[column.name];
                }

                // if it's a prefilled foreignkey, the value is already set
                if (column.isForeignKey &&  prefilledFks.indexOf(column.name) !== -1) {
                    colModel.isDisabled = true;
                    colModel.inputType = "disabled";
                    continue;
                }

                // if the column is prefilled, get the prefilled value instead of default
                if (column.name in prefilledColumns) {
                    defaultValue = prefilledColumns[column.name];
                    colModel.isDisabled = true;
                    colModel.inputType = "disabled";
                }

                var tsOptions = {
                    outputType: colModel.inputType == "disabled" ? "string" : "object"
                };

                switch (column.type.name) {
                    // timestamp[tz] and asset columns have default model objects if their inputs are NOT disabled
                    case 'timestamp':
                        tsOptions.outputMomentFormat = dataFormats.datetime.display;
                        // formatDatetime takes care of column.default if null || undefined
                        initialModelValue = InputUtils.formatDatetime(defaultValue, tsOptions);
                        break;
                    case 'timestamptz':
                        tsOptions.outputMomentFormat = dataFormats.datetime.displayZ;
                        // formatDatetime takes care of column.default if null || undefined
                        initialModelValue = InputUtils.formatDatetime(defaultValue, tsOptions);
                        break;
                    case "boolean":
                        if (defaultValue != null) {
                            initialModelValue = InputUtils.formatBoolean(column, defaultValue);
                        }
                        break;
                    default:
                        if (column.isAsset) {
                            var metaObj = {};
                            metaObj[column.name] = defaultValue;

                            var metadata = column.getMetadata(metaObj);
                            initialModelValue = {
                                url: metadata.url || "",
                                filename: metadata.filename || metadata.caption || "",
                                filesize: metadata.byteCount || ""
                            }
                        } else if (column.isForeignKey) {
                            // if all the columns of the foreignkey are prefilled, use that instead of default
                            var allPrefilled = column.foreignKey.colset.columns.every(function (col) {
                                return prefilledColumns[col.name] != null;
                            });

                            // if all the columns of the foreignkey are initialized, use that instead of default
                            var allInitialized = initialValues && column.foreignKey.colset.columns.every(function (col) {
                                return initialValues[col.name] != null;
                            });

                            if (allPrefilled || allInitialized) {
                                var defaultDisplay = column.getDefaultDisplay(allPrefilled ? prefilledColumns : initialValues), logObj;

                                if (allPrefilled) {
                                    colModel.isDisabled = true;
                                    colModel.inputType = "disabled";
                                }
                                // display the initial value
                                initialModelValue = defaultDisplay.rowname.value;
                                // initialize foreignKey data
                                model.foreignKeyData[0][column.foreignKey.name] = defaultDisplay.values;

                                // populate the log object
                                logObj = {
                                    action: getColumnModelLogAction(
                                        logService.logActions.FOREIGN_KEY_PRESELECT,
                                        colModel,
                                        model
                                    ),
                                    stack: getColumnModelLogStack(colModel, model)
                                };

                                // get the actual foreign key data
                                _getForeignKeyData(model, 0, [column.name], defaultDisplay.reference, logObj);
                            } else if (defaultValue != null) {
                                initialModelValue = defaultValue;
                                // initialize foreignKey data
                                model.foreignKeyData[0][column.foreignKey.name] = column.defaultValues;

                                // populate the log object
                                logObj = {
                                    action: getColumnModelLogAction(
                                        logService.logActions.FOREIGN_KEY_DEFAULT,
                                        colModel,
                                        model
                                    ),
                                    stack: getColumnModelLogStack(colModel, model)
                                };

                                // get the actual foreign key data
                                _getForeignKeyData(model, 0, [column.name], column.defaultReference, logObj);
                            }
                        } else {
                            // all other column types
                            if (defaultValue != null) {
                                initialModelValue = defaultValue;
                            }
                        }
                }

                model.rows[0][column.name] = initialModelValue;
            }
        }

        /**
         * if because of column-level acls, columns of one of the rows cannot be
         * updated, we cannot update any other rows. so we should precompute this
         * and attach the error so we can show it later to the users.
         * This should be called on load, as well as when one of the records
         * in the form is removed.
         * TODO technically could be improved. we've already gone through the
         * list of columns, we might not need to to do it again here
         */
        function populateColumnPermissionError(model, columnModel) {
            if (!model.columnPermissionError) {
                model.columnPermissionError = {};
            }

            if (columnModel.isDisabled) {
                model.columnPermissionError[columnModel.column.name] = null;
                return;
            }

            var firstIndex = model.canUpdateRows.findIndex(function (curr, index) {
                // the whole row can be updated but the column cannot
                return $rootScope.tuples[index].canUpdate && !curr[columnModel.column.name];
            });
            if (firstIndex === -1) {
                model.columnPermissionError[columnModel.column.name] = null;
                return;
            }
            var message = "This field cannot be modified. To modify it, remove all records that have this field disabled (e.g. Record Number ";
            message +=  (firstIndex+1) + ")";
            model.columnPermissionError[columnModel.column.name] =  message;
        }

        function populateEditModelValues(model, reference, tuple, tupleIndex, isCopy) {
            // initialize row objects {column-name: value,...}
            model.rows[tupleIndex] = {};
            // needs to be initialized so foreign keys can be set
            // these are the values that we're sending to ermrestjs,
            // chaise should not use these values and we should just populate the values
            model.submissionRows[tupleIndex] = {};

            if (!isCopy) {
                model.canUpdateRows[tupleIndex] = {};
            }

            var values = tuple.values;

            // attach the foreign key data of the tuple
            model.foreignKeyData[tupleIndex] = tuple.linkedData;

            model.columnModels.forEach(function (colModel) {
                var column = colModel.column,
                    value;

                // columnModels array might not be the same size as column list
                var i = reference.columns.findIndex(function (col) {return col.name === column.name});

                // If input is disabled, and it's copy, we don't want to copy the value
                var isDisabled = colModel.inputType == "disabled";
                if (isDisabled && isCopy) return;

                if (!isCopy) {
                    // whether certain columns are disabled or not
                    model.canUpdateRows[tupleIndex][column.name] = tuple.canUpdate && tuple.canUpdateValues[i];
                    isDisabled = isDisabled || !(tuple.canUpdate && tuple.canUpdateValues[i]);
                }

                // stringify the returned array value
                if (column.type.isArray) {
                    if (values[i] !== null) {
                        model.rows[tupleIndex][column.name] = JSON.stringify(values[i], undefined, 2);
                    }
                    return;
                }

                // Transform column values for use in view model
                var options = { outputType: "object" }
                switch (column.type.name) {
                    case "timestamp":
                        // If input is disabled, there's no need to transform the column value.
                        value = isDisabled ? values[i] : InputUtils.formatDatetime(values[i], options);
                        break;
                    case "timestamptz":
                        if (isDisabled) {
                            options.outputType = "string";
                            options.outputMomentFormat = dataFormats.datetime.return;
                        }
                        value = InputUtils.formatDatetime(values[i], options);
                        break;
                    case "int2":
                    case "int4":
                    case "int8":
                        // If input is disabled, there's no need to transform the column value.
                        value = isDisabled ? values[i] : InputUtils.formatInt(values[i]);
                        break;
                    case "float4":
                    case "float8":
                    case "numeric":
                        // If input is disabled, there's no need to transform the column value.
                        value = isDisabled ? values[i] : InputUtils.formatFloat(values[i]);
                        break;
                    case "boolean":
                        value = InputUtils.formatBoolean(column, values[i]);
                        break;
                    default:
                        // the structure for asset type columns is an object with a 'url' property
                        if (column.isAsset) {
                            var metadata = column.getMetadata(tuple.data);
                            value = {
                                url: values[i] || "",
                                filename: metadata.filename || metadata.caption,
                                filesize: metadata.byteCount
                            };
                        } else {
                            value = values[i];
                        }

                        // if in copy mode and copying an asset column with metadata available, attach that to the submission model
                        if (column.isAsset && isCopy) {
                            // may not have been set or fetched above because of disabled case
                            // we still want to copy the metadata
                            var metadata = column.getMetadata(tuple.data);

                            // I don't think this should be done brute force like this
                            if (metadata.filename) model.submissionRows[tupleIndex][column.filenameColumn.name] = metadata.filename;
                            if (metadata.byteCount) model.submissionRows[tupleIndex][column.byteCountColumn.name] = metadata.byteCount;
                            if (metadata.md5) model.submissionRows[tupleIndex][column.md5.name] = metadata.md5;
                            if (metadata.sha256) model.submissionRows[tupleIndex][column.sha256.name] = metadata.sha256;
                        }
                        break;
                }

                // no need to check for copy here because the case above guards against the negative case for copy
                model.rows[tupleIndex][column.name] = value;
            });
        }

        /**
         * Given a modelRow and submissionRow objects, use the value of modelRow to modify the submissionRow value.
         * These are the modifications that it does:
         *   - foreignKeys: if they are not edited, use the value of originalTuple for its constituent columns
         *   - array: parse the string representation
         *   - timestamp: turn object to string representation
         *   - json: parse the string representation
         *   - otherwise: use the modelRow value as is
         * TODO technically we don't need to pass modelRow and submissionRow since their attached to $rootScope
         * TODO even the third and fourth inputs can be derived in this function.
         * @param {Object} modelRow - each object in the recordEditModel.rows array
         * @param {Object} submissionRow - each object in the recordEditModel.submissionRow array
         * @param {ERMrest.Reference=} reference - the reference that these values are based on.
         * @param {ERMrest.Tuple=} originalTuple - the original tuple that comes from the first read
         * @param {Boolean} editOrCopy - true if it's edit or copy, otherwise it's false.
         */
        function populateSubmissionRow(modelRow, submissionRow, reference, originalTuple, editOrCopy, canUpdateRows) {
            reference.columns.forEach(function (column, columnIndex) {
                // If the column is a foreign key column, it needs to get the originating columns name for data submission
                if (column.isForeignKey) {

                    var foreignKeyColumns = column.foreignKey.colset.columns;
                    for (var k = 0; k < foreignKeyColumns.length; k++) {
                        var referenceColumn = foreignKeyColumns[k];
                        var foreignTableColumn = column.foreignKey.mapping.get(referenceColumn);
                        // check if value is set in submission data yet (searchPopup will set this value if foreignkey is picked)
                        if (submissionRow[referenceColumn.name] == null) {
                            /**
                             * User didn't change the foreign key, copy the value over to the submission data with the proper column name
                             * In the case of edit, the originating value is set on $rootScope.tuples.data. Use that value if the user didn't touch it (value could be null, which is fine, just means it was unset)
                             * In the case of create, the value is unset if it is not present in submissionRows and because it's newly created it doesn't have a value to fallback to, so use null
                            **/
                            if (editOrCopy && originalTuple && undefined != originalTuple.data[referenceColumn.name]) {
                                submissionRow[referenceColumn.name] = originalTuple.data[referenceColumn.name];
                            } else {
                                submissionRow[referenceColumn.name] = null;
                            }
                        }
                    }

                    return;
                }
                // not foreign key, column.name is sufficient for the keys
                var rowVal = modelRow[column.name];
                var canUpdateCol = !DataUtils.isObjectAndNotNull(canUpdateRows) || canUpdateRows[column.name] == true;
                if (rowVal && !column.isDisabled && canUpdateCol) {
                    if (column.type.isArray) {
                        rowVal = JSON.parse(rowVal);
                    } else {
                        switch (column.type.name) {
                            case "timestamp":
                            case "timestamptz":
                                var options = {
                                    outputType: "string",
                                    currentMomentFormat: dataFormats.date + dataFormats.time12 + 'A',
                                    outputMomentFormat: dataFormats.datetime.submission
                                }

                                var value = null;
                                if (rowVal.date) {
                                    // in create if the user doesn't change the timestamp field, it will be an object in form {time: null, date: null, meridiem: AM}
                                    // meridiem should never be null, time can be left empty (null) the case below will catch that.
                                    if (rowVal.time === null) rowVal.time = '00:00:00';
                                    value = rowVal.date + rowVal.time + rowVal.meridiem;
                                }
                                rowVal = InputUtils.formatDatetime(value, options);
                                break;
                            case "json":
                            case "jsonb":
                                rowVal = JSON.parse(rowVal);
                                break;
                            case "boolean":
                                // call columnToColumnModel to set booleanArray and booleanMap for proper un-formatting
                                rowVal = InputUtils.unformatBoolean(columnToColumnModel(column), rowVal);
                                break;
                            default:
                                break;
                        }
                    }
                }
                // set null if not set so that the whole data object is filled out for posting to ermrestJS
                submissionRow[column.name] = (rowVal === undefined || rowVal === "") ? null : rowVal;
            });

            return submissionRow;
        }

        return {
            addRelatedRecordFact: addRelatedRecordFact,
            addRecords: addRecords,
            columnToColumnModel: columnToColumnModel,
            getColumnModelLogStack: getColumnModelLogStack,
            getColumnModelLogAction: getColumnModelLogAction,
            populateCreateModelValues: populateCreateModelValues,
            populateEditModelValues: populateEditModelValues,
            populateSubmissionRow: populateSubmissionRow,
            populateColumnPermissionError: populateColumnPermissionError
        }
    }])
})();
