(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .controller('FormController', ['AlertsService', 'recordEditModel', 'UriUtils', '$cookies', '$log', '$rootScope', '$uibModal', '$window', function FormController(AlertsService, recordEditModel, UriUtils, $cookies, $log, $rootScope, $uibModal, $window) {
        var vm = this;
        var context = $rootScope.context;
        vm.recordEditModel = recordEditModel;
        vm.editMode = context.filter || false;
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
        vm.redirectAfterSubmission = redirectAfterSubmission;
        vm.showSubmissionError = showSubmissionError;
        vm.searchPopup = searchPopup;
        vm.createRecord = createRecord;
        vm.clearForeignKey = clearForeignKey;

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
        // Specifies the regexes to be used for a token in a ui-mask input. For example, the '1' key in
        // in vm.maskOptions.date means that only 0 or 1 is allowed wherever the '1' key is used in a ui-mask template.
        // See the maskDefinitions section for more info: https://github.com/angular-ui/ui-mask.
        vm.maskOptions = {
            date: {
                maskDefinitions: {'1': /[0-1]/, '2': /[0-2]/, '3': /[0-3]/},
                clearOnBlur: false
            },
            time: {
                maskDefinitions: {'1': /[0-1]/, '2': /[0-2]/, '5': /[0-5]/},
                clearOnBlur: false
            }
        };
        vm.prefillCookie = $cookies.getObject(context.prefill);

        // Takes a page object and uses the uri generated for the reference to construct a chaise uri
        function redirectAfterSubmission(page) {
            var rowset = vm.recordEditModel.rows,
                redirectUrl = "../";

            // Created a single entity or Updated one
            if (rowset.length == 1) {
                AlertsService.addAlert({type: 'success', message: 'Your data has been submitted. Redirecting you now to the record...'});

                redirectUrl += "record/#" + UriUtils.fixedEncodeURIComponent(page.reference.location.catalog) + '/' + page.reference.location.compactPath;
            } else {
                AlertsService.addAlert({type: 'success', message: 'Your data has been submitted. Redirecting you now to the record...'});

                redirectUrl += "recordset/#" + UriUtils.fixedEncodeURIComponent(page.reference.location.catalog) + '/' + page.reference.location.compactPath;
            }

            // Redirect to record or recordset app..
            $window.location = redirectUrl;
        }

        function showSubmissionError(response) {
            AlertsService.addAlert({type: 'error', message: response.message});
            $log.warn(response);
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
            angular.forEach($rootScope.reference.columns, function(col) {
                var rowVal = row[col.name];
                if (rowVal) {
                    switch (col.type.name) {
                        case "timestamp":
                        case "timestamptz":
                            if (vm.readyToSubmit) {
                                if (rowVal.date && rowVal.time && rowVal.meridiem) {
                                    rowVal = moment(rowVal.date + rowVal.time + rowVal.meridiem, 'YYYY-MM-DDhh:mm:ssA').utc().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
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
            });

            return row;
        }

        function submit() {
            var form = vm.formContainer;
            var model = vm.recordEditModel;

            if (form.$invalid) {
                vm.readyToSubmit = false;
                AlertsService.addAlert({type: 'error', message: 'Sorry, the data could not be submitted because there are errors on the form. Please check all fields and try again.'});
                form.$setSubmitted();
                return;
            }

            // Form data is valid, time to transform row values for submission to ERMrest
            vm.readyToSubmit = true;
            for (var j = 0; j < model.rows.length; j++) {
                var transformedRow = transformRowValues(model.rows[j]);
                $rootScope.reference.columns.forEach(function (column) {
                    // If the column is a pseudo column, it needs to get the originating columns name for data submission
                    if (column.isPseudo) {

                        var referenceColumn = column.foreignKey.colset.columns[0];
                        var foreignTableColumn = column.foreignKey.mapping.get(referenceColumn);

                        // check if value is set in submission data yet
                        if (!model.submissionRows[j][referenceColumn.name]) {
                            /**
                             * User didn't change the foreign key, copy the value over to the submission data with the proper column name
                             * In the case of edit, the originating value is set on $rootScope.tuples.data. Use that value if the user didn't touch it (value could be null, which is fine, just means it was unset)
                             * In the case of create, the value is unset if it is not present in submissionRows and because it's newly created it doesn't have a value to fallback to, so use null
                            **/
                            model.submissionRows[j][referenceColumn.name] = (vm.editMode ? $rootScope.tuples[j].data[referenceColumn.name] : null);
                        }
                    // not pseudo, column.name is sufficient for the keys
                    } else {
                        // set null if not set so that the whole data object is filled out for posting to ermrestJS
                        model.submissionRows[j][column.name] = (transformedRow[column.name] ? transformedRow[column.name] : null);
                    }
                });
            }

            if (vm.editMode) {
                // loop through model.rows
                // there should only be 1 row for editting
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
                    vm.readyToSubmit = false; // form data has already been submitted to ERMrest
                    vm.redirectAfterSubmission(page);
                }, function error(response) {
                    vm.showSubmissionError(response);
                });
            } else {
                $rootScope.reference.create(model.submissionRows).then(function success(page) {
                    vm.readyToSubmit = false; // form data has already been submitted to ERMrest
                    if (vm.prefillCookie) {
                        $cookies.remove(context.prefill);
                    }
                    vm.redirectAfterSubmission(page);
                }, function error(response) {
                    vm.showSubmissionError(response);
                });
            }
        }

        function deleteRecord() {
            if (chaiseConfig.confirmDelete === undefined || chaiseConfig.confirmDelete) {
                $uibModal.open({
                    templateUrl: "../common/templates/delete-link/confirm_delete.modal.html",
                    controller: "ConfirmDeleteController",
                    controllerAs: "ctrl",
                    size: "sm"
                }).result.then(function success() {
                    // user accepted prompt to delete
                    return $rootScope.reference.delete();
                }).then(function deleteSuccess() {
                    // redirect after successful delete
                    $window.location.href = (chaiseConfig.dataBrowser ? chaiseConfig.dataBrowser : $window.location.origin);
                }, function deleteFailure(response) {
                    vm.showSubmissionError(response);
                }).catch(function (error) {
                    $log.info(error);
                });
            } else {
                $rootScope.reference.delete().then(function deleteSuccess() {
                    // redirect after successful delete
                    $window.location.href = (chaiseConfig.dataBrowser ? chaiseConfig.dataBrowser : $window.location.origin);
                }, function deleteFailure(response) {
                    vm.showSubmissionError(response);
                }).catch(function (error) {
                    $log.info(error);
                });
            }
        }

        function searchPopup(rowIndex, column) {
            var params = {};

            // TODO this should not be a hardcoded value, either need a pageInfo object across apps or part of user settings
            column.reference.read(25).then(function getPseudoData(page) {
                // pass the page as a param for the modal
                params.page = page;

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

                return modalInstance.result;
            }).then(function dataSelected(tuple) {
                // tuple - returned from action in modal (should be the foreign key value in the recrodedit reference)
                // set data in view model (model.rows) and submission model (model.submissionRows)

                // TODO bad idea assuming there's 1 value
                var referenceCol = column.foreignKey.colset.columns[0];
                var foreignTableCol = column.foreignKey.mapping.get(referenceCol);

                // set the tuple instead
                vm.recordEditModel.rows[rowIndex][column.name] = tuple.displayname;
                vm.recordEditModel.submissionRows[rowIndex][referenceCol.name] = tuple.data[foreignTableCol.name];

            }, function noDataSelected() {
                // do nothing
            });
        }

        function clearForeignKey(rowIndex, column) {
            // TODO bad idea assuming there's 1 value
            var model = vm.recordEditModel,
                referenceCol = column.foreignKey.colset.columns[0];

            console.log(referenceCol);

            delete model.rows[rowIndex][column.name];
            delete model.submissionRows[rowIndex][referenceCol.name];

            console.log(model);
        }

        function createRecord(column) {
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
                var row = angular.copy(protoRow);

                // transform row values to avoid parsing issues with null values
                var transformedRow = transformRowValues(row);

                rowset.push(transformedRow);

                var submissionRow = angular.copy(vm.recordEditModel.submissionRows[index]);

                vm.recordEditModel.submissionRows.push(submissionRow);
            }
        }

        function removeFormRow(index) {
            vm.recordEditModel.rows.splice(index, 1);
            vm.recordEditModel.submissionRows.splice(index, 1);
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
            return (column.memberOfForeignKeys.length > 0 || column.isPseudo);
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
            if (!vm.recordEditModel.rows[modelIndex][columnName]) {
                vm.recordEditModel.rows[modelIndex][columnName] = {meridiem: 'AM'};
            }
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
    }]);
})();
