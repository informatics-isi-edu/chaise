(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['AlertsService', '$cookies', '$log', 'UriUtils', 'DataUtils', 'ErrorService', 'MathUtils', 'messageMap', '$rootScope', '$window', '$scope', '$uibModal','$controller', function RecordController(AlertsService, $cookies, $log, UriUtils, DataUtils, ErrorService, MathUtils, messageMap, $rootScope, $window, $scope, $uibModal, $controller) {
        var vm = this;
        var addRecordRequests = {}; // <generated unique id : reference of related table>
        var editRecordRequests = {}; // generated id: {schemaName, tableName}
        var updated = {};
        var context = $rootScope.context;
        
        vm.alerts = AlertsService.alerts;
        vm.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

        vm.canCreate = function() {
            return ($rootScope.reference && $rootScope.reference.canCreate && $rootScope.modifyRecord);
        };

        vm.createRecord = function() {
            $window.location.href = $rootScope.reference.table.reference.contextualize.entryCreate.appLink;
        };

        vm.canEdit = function() {
            var canEdit = ($rootScope.reference && $rootScope.reference.canUpdate && $rootScope.modifyRecord);
            // If user can edit this record (canEdit === true), then change showEmptyRelatedTables.
            // Otherwise, canEdit will be undefined, so no need to change anything b/c showEmptyRelatedTables is already false.

            return canEdit;
        };

        vm.editRecord = function() {
            $window.location.href = $rootScope.reference.contextualize.entryEdit.appLink;
        };

        vm.copyRecord = function() {
            $window.location.href = $rootScope.reference.contextualize.entryCreate.appLink + "?copy=true&limit=1";
        };

        vm.canDelete = function() {
            return ($rootScope.reference && $rootScope.reference.canDelete && $rootScope.modifyRecord && $rootScope.showDeleteButton);
        };

        vm.deleteRecord = function() {
            $rootScope.reference.delete([$rootScope.tuple]).then(function deleteSuccess() {
                // Get an appLink from a reference to the table that the existing reference came from
                var unfilteredRefAppLink = $rootScope.reference.table.reference.contextualize.compact.appLink;
                $window.location.href = unfilteredRefAppLink;
            }, function deleteFail(error) {
                throw error;
            });
        };

        vm.permalink = function getPermalink() {
            return $window.location.href;
        };
         
        vm.toRecordSet = function(ref) {
            return $window.location.href = ref.appLink;
        };
    
        vm.showRelatedTable = function(i) {
            var isFirst = false, prevTableHasLoaded = false;
            if ($rootScope.tableModels && $rootScope.tableModels[i]) {
                if (i === 0) {
                    $rootScope.lastRendered = 0;
                    isFirst = true;
                } else if ($rootScope.tableModels[i-1]) {
                    prevTableHasLoaded = $rootScope.tableModels[i-1].hasLoaded;
                    if ($rootScope.lastRendered == (i-1)) {
                        $rootScope.lastRendered = i;
                    }
                }

                if ($rootScope.lastRendered == $rootScope.relatedReferences.length-1) {
                    $rootScope.loading = false;
                }

                if ($rootScope.showEmptyRelatedTables) {
                    return isFirst || prevTableHasLoaded;
                }

                if ((isFirst || prevTableHasLoaded) && $rootScope.tableModels[i].rowValues && $rootScope.tableModels[i].rowValues.length > 0) {
                    return (i == $rootScope.lastRendered);
                }
                return false;
            }
        };
         
        vm.toggleRelatedTableDisplayType = function(dataModel) {
            if (dataModel.displayType == 'markdown') {
                dataModel.displayType = 'table';
            } else {
                dataModel.displayType = 'markdown';
            }
        };

        vm.toggleRelatedTables = function() {
            $rootScope.showEmptyRelatedTables = !$rootScope.showEmptyRelatedTables;
        };

        vm.canEditRelated = function(ref) {
            if(angular.isUndefined(ref))
            return false;
           return (ref.canUpdate && $rootScope.modifyRecord);
        };

        vm.canCreateRelated = function(relatedRef) {
            if(angular.isUndefined(relatedRef))
            return false;
           var ref = (relatedRef.derivedAssociationReference ? relatedRef.derivedAssociationReference : relatedRef);
           return (ref.canCreate && $rootScope.modifyRecord);
        };

        // Send user to RecordEdit to create a new row in this related table
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
                }).result.then(onSuccess, function (exception) {
                    vm.readyToSubmit = false;
                    vm.submissionButtonDisabled = false;

                    if (exception) AlertsService.addAlert(exception.message, 'error');
                });
            } else {
                vm.readyToSubmit = false;
                vm.submissionButtonDisabled = false;
            }
        }

        function addRecords(isUpdate, derivedref) {
            var model = vm.recordEditModel;
            var form = vm.formContainer;

            // this will include updated and previous raw values.
            var submissionRowsCopy = [];

            model.submissionRows.forEach(function (row) {
                submissionRowsCopy.push(Object.assign({}, row));
            });           

            //call uploadFiles which will upload files and callback on success
            uploadFiles(submissionRowsCopy, isUpdate, function () {

                var fn = "create", fnScope = derivedref.unfilteredReference.contextualize.entryCreate, args = [submissionRowsCopy];

                fnScope[fn].apply(fnScope, args).then(function success(result) {

                    var page = result.successful;
                    var failedPage = result.failed;

                    // the returned reference is contextualized and we don't need to contextualize it again
                    var resultsReference = page.reference;
                    vm.readyToSubmit = false; // form data has already been submitted to ERMrest

                        AlertsService.addAlert("Your data has been submitted. Showing you the result set...","success");

                        // can't use page.reference because it reflects the specific values that were inserted
                        vm.recordsetLink = $rootScope.reference.contextualize.compact.appLink;
                        //set values for the view to flip to recordedit resultset view
                        vm.resultsetModel = {
                            hasLoaded: true,
                            reference: resultsReference,
                            tableDisplayName: resultsReference.displayname,
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
                                selectMode: 'no-select'
                            }
                        };

                        // NOTE: This case is for a pseudo-failure case
                        // When multiple rows are updated and a smaller set is returned, the user doesn't have permission to update those rows based on row-level security
                        if (failedPage !== null) {
                            vm.omittedResultsetModel = {
                                hasLoaded: true,
                                reference: resultsReference,
                                tableDisplayName: resultsReference.displayname,
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
                                    selectMode: 'no-select'
                                }
                            };
                        }

                        vm.resultset = true;
                        // winOnfocus();
                    
                }).catch(function (exception) {
                    vm.submissionButtonDisabled = false;
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
                if (rowVal && !col.getInputDisabled(context.appContext)) {
                    switch (col.type.name) {
                        case "timestamp":
                        case "timestamptz":
                            if (vm.readyToSubmit) {
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
                                if (!vm.readyToSubmit) {
                                    rowVal = { url: "" };
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
            columns.forEach(function (column) {
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
        function updateViewModel(cookie){
            var recordEditModel = {
                table: {},
                rows: [{}], // rows of data in the form, not the table from ERMrest
                oldRows: [{}], // Keep a copy of the initial rows data so that we can see if user has made any changes later
                submissionRows: [{}] // rows of data converted to raw data for submission
            };
            // Update view model
            recordEditModel.rows[recordEditModel.rows.length - 1][cookie.constraintName] = cookie.rowname.value;

            // Update submission model
            var columnNames = Object.keys(cookie.keys);
            columnNames.forEach(function (colName) {
                var colValue = cookie.keys[colName];
                recordEditModel.submissionRows[recordEditModel.submissionRows.length - 1][colName] = colValue;
            });
            vm.recordEditModel = recordEditModel;
        }
        var addPopup = function(ref,rowIndex,derivedref){
            var column = ref;
            // if (isDisabled(column)) return;
       

            var originalTuple,
                editOrCopy = true,
                params = {};

            // pass the reference as a param for the modal
            // call to page with tuple to get proper reference
           
            if (vm.editMode) {
                originalTuple = $rootScope.tuples[rowIndex];
            }else {
                originalTuple = null;
                editOrCopy = false;
            }

            //var submissionRow = populateSubmissionRow(vm.recordEditModel.rows[rowIndex], vm.recordEditModel.submissionRows[rowIndex], originalTuple, $rootScope.reference.columns, editOrCopy);
            //filteredRef(submissionRow)
            params.reference = ref.contextualize.compactSelect;
            params.reference.session = $rootScope.session;
            params.context = "compact/select";
            params.selectMode = "multi-select";

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

                // var foreignKeyColumns = column.foreignKey.colset.columns;
                // for (var i = 0; i < foreignKeyColumns.length; i++) {
                //     var referenceCol = foreignKeyColumns[i];
                //     var foreignTableCol = column.foreignKey.mapping.get(referenceCol);

                //     vm.recordEditModel.submissionRows[rowIndex][referenceCol.name] = tuple.data[foreignTableCol.name];
                // }
                var key_subRow ={},key_row={};
                angular.copy(vm.recordEditModel.submissionRows[0],key_subRow);
                angular.copy(vm.recordEditModel.rows[0],key_row);
                // for (i = 1; i < tuples.length; i++) {
                //     vm.recordEditModel.submissionRows.push(key_subRow);
                //     vm.recordEditModel.rows.push(key_row);
                // }
                for(i=0;i<tuples.length;i++){        
                    if(i!=0){
                        var ob1 = {},ob2={}; 
                        angular.copy(key_subRow, ob1)
                        angular.copy(key_row, ob2)
                        ob1[column.table.name] = tuples[i].data['term'];
                        vm.recordEditModel.submissionRows.push(ob1);
                        ob2[column.columns[0].name] = tuples[i].displayname.value;
                        vm.recordEditModel.rows.push(ob2);
                    }          
                    else{                                       
                        vm.recordEditModel.submissionRows[i][column.table.name] = tuples[i].data['term'];
                        vm.recordEditModel.rows[i][column.columns[0].name] = tuples[i].displayname.value;
                }
                }
                addRecords(false, derivedref);
                
            });
        }
        vm.addRelatedRecord = function(ref) {
            // 1. Pluck required values from the ref into cookie obj by getting the values of the keys that form this FK relationship
            var cookie = {
                rowname: $rootScope.recordDisplayname,
                constraintName: ref.origColumnName
            };
            var mapping = ref.contextualize.entryCreate.origFKR.mapping;

            // Get the column pair that form this FKR between this related table and the main entity
            cookie.keys = {};
            mapping._from.forEach(function (fromColumn, i) {
                var toColumn = mapping._to[i];
                // Assign the column value into cookie
                cookie.keys[fromColumn.name] = $rootScope.tuple.data[toColumn.name];
            });
            
            if(ref.derivedAssociationReference){
                var derivedref = ref.derivedAssociationReference;
                updateViewModel(cookie);
                // NOTE: we're showing all the available domain values, which might result in 409
                // also since we're changing context to compact, it might not refer to the same table (alternative tables)    
                ref = ref.unfilteredReference.contextualize.compact;
                
                addPopup(ref,0,derivedref);
                
                return;
            }
            
           
            // 2. Generate a unique cookie name and set it to expire after 24hrs.
            var COOKIE_NAME = 'recordedit-' + MathUtils.getRandomInt(0, Number.MAX_SAFE_INTEGER);
            $cookies.putObject(COOKIE_NAME, cookie, {
                expires: new Date(Date.now() + (60 * 60 * 24 * 1000))
            });

            // Generate a unique id for this request
            // append it to the URL
            var referrer_id = 'recordedit-' + MathUtils.getRandomInt(0, Number.MAX_SAFE_INTEGER);
            addRecordRequests[referrer_id] = ref.uri;

            // 3. Get appLink, append ?prefill=[COOKIE_NAME]&referrer=[referrer_id]
            var appLink = (ref.derivedAssociationReference ? ref.derivedAssociationReference.contextualize.entryCreate.appLink : ref.contextualize.entryCreate.appLink);
            appLink = appLink + (appLink.indexOf("?") === -1? "?" : "&") +
                'prefill=' + UriUtils.fixedEncodeURIComponent(COOKIE_NAME) +
                '&invalidate=' + UriUtils.fixedEncodeURIComponent(referrer_id);

            // 4. Redirect to the url in a new tab
            $window.open(appLink, '_blank');
        };

        $scope.$on("edit-request", function(event, args) {
            editRecordRequests[args.id] = {"schema": args.schema, "table": args.table};
        });

        // When page gets focus, check cookie for completed requests
        // re-read the records for that table
        
        $window.onfocus = function () {
            $log.info("inside onfocus");
            if ($rootScope.loading === false) {
                var completed = {};
                for (var id in addRecordRequests) {
                    var cookie = $cookies.getObject(id);
                    if (cookie) { // add request has been completed
                        console.log('Cookie found', cookie);
                        completed[addRecordRequests[id]] = true;

                        // remove cookie and request
                        $cookies.remove(id);
                        delete addRecordRequests[id];
                    } else {
                        
                        console.log('Could not find cookie', cookie);
                    }
                }

                // read updated tables
                if (Object.keys(completed).length > 0 || updated !== {}) {
                    for (var i = 0; i < $rootScope.inbFKRef.length; i++) {
                        var relatedTableReference = $rootScope.inbFKRef[i].reference;
                        if (true||completed[relatedTableReference.uri] || updated[relatedTableReference.location.schemaName + ":" + relatedTableReference.location.tableName]) {
                            delete updated[relatedTableReference.location.schemaName + ":" + relatedTableReference.location.tableName];
                            (function (i) {
                                relatedTableReference.read($rootScope.colTableModels[i].pageLimit).then(function (page) {
                                    $rootScope.colTableModels[i].page = page;
                                    $rootScope.colTableModels[i].rowValues = DataUtils.getRowValuesFromPage(page);
                                }, function(error) {
                                    console.log(error);
                                    throw error;                                    
                                }).catch(function(error) {
                                    console.log(error);
                                    throw error;

                                });
                            })(i);
                        }
                    }
                }
            }

        };

        // function called from form.controller.js to notify record that an entity was just updated
        window.updated = function(id) {
            updated[editRecordRequests[id].schema + ":" + editRecordRequests[id].table] = true;
            delete editRecordRequests[id];
        }
    }]);
})();
