(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .controller('FormController', ['AlertsService', 'UriUtils', 'recordEditModel', '$window', '$log', '$rootScope', function FormController(AlertsService, UriUtils, recordEditModel, $window, $log, $rootScope) {
        var vm = this;
        var context = $rootScope.context;
        vm.recordEditModel = recordEditModel;
        vm.editMode = context.filter || false;
        vm.booleanValues = context.booleanValues;
        vm.getAutoGenValue = getAutoGenValue;

        vm.alerts = AlertsService.alerts;
        vm.closeAlert = AlertsService.deleteAlert;

        vm.submit = submit;
        vm.redirectAfterSubmission = redirectAfterSubmission;
        vm.showSubmissionError = showSubmissionError;
        vm.copyFormRow = copyFormRow;
        vm.removeFormRow = removeFormRow;

        vm.inputType = null;
        vm.int2min = -32768;
        vm.int2max = 32767;
        vm.int4min = -2147483648;
        vm.int4max = 2147483647;
        vm.int8min = -9223372036854775808
        vm.int8max = 9223372036854775807;

        vm.columnToDisplayType = columnToDisplayType;
        vm.matchType = matchType;


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
            $log.info(response);
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
                if (row[col.name]) {
                    switch (col.type.name) {
                        default:
                            if (row[col.name] === '') {
                                row[col.name] = null;
                            }
                            break;
                    }
                }
            });
        }

        function submit() {
            var form = vm.formContainer;
            var model = vm.recordEditModel;
            form.$setUntouched();
            form.$setPristine();

            if (form.$invalid) {
                AlertsService.addAlert({type: 'error', message: 'Sorry, the data could not be submitted because there are errors on the form. Please check all fields and try again.'});
                form.$setSubmitted();
                return;
            }

            model.rows.forEach(function(row) {
                transformRowValues(row);
            });

            if (vm.editMode) {

                // get tuple.data
                var data = $rootScope.tuples[0].data;

                // loop through model.rows
                // there should only be 1 row for editting
                for (var i = 0; i < model.rows.length; i++) {
                    var row = model.rows[i];
                    var tuple = $rootScope.tuples[i];
                    // assign each value from the form to the data object on tuple
                    for (var key in row) {
                        tuple.data[key] = (row[key] === '' ? null : row[key]);
                    }
                }

                $rootScope.reference.update($rootScope.tuples).then(function success(entities) {
                    vm.redirectAfterSubmission(entities);
                }, function error(response) {
                    vm.showSubmissionError(response);
                });
            } else {
                $rootScope.reference.create(model.rows).then(function success(page) {
                    vm.redirectAfterSubmission(page);
                }, function error(response) {
                    vm.showSubmissionError(response);
                });
            }
        }

        function copyFormRow() {
            // Check if the prototype row to copy has any invalid values. If it
            // does, display an error. Otherwise, copy the row.
            var index = vm.recordEditModel.rows.length - 1;
            var protoRowValidityStates = vm.formContainer.row[index];
            var validRow = true;
            angular.forEach(protoRowValidityStates, function(value, key) {
                if (value.$dirty && value.$invalid) {
                    AlertsService.addAlert({type: 'error', message: "Sorry, we can't copy this record because it has invalid values in it. Please check its fields and try again."});
                    validRow = false;
                }
            });
            if (validRow) {
                var rowset = vm.recordEditModel.rows;
                var protoRow = rowset[index];
                var row = angular.copy(protoRow);

                // transform row values to avoid parsing issues with null values
                transformRowValues(row, vm.recordEditModel);

                rowset.push(row);

            }
        }

        function removeFormRow(index) {
            vm.recordEditModel.rows.splice(index, 1);
        }

        function columnToDisplayType(column) {
            var name = column.name;
            var type = column.type.name;
            var displayType;
            if (isAutoGen(column)) {
                displayType = 'autogen';
            } else if (isForeignKey(column)) {
                displayType = 'dropdown';
            } else {
                switch (type) {
                    case 'timestamptz':
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

        // Returns true if a column's fields should be automatically generated
        // In this case, columns of type serial* == auto-generated
        function isAutoGen(col) {
            try {
                return (col.type.name.indexOf('serial') === 0);
            } catch (exception) {
                // handle exception
                $log.info(exception);
            }
        }

        function isForeignKey(column) {
            return column.memberOfForeignKeys.length > 0
        }

        // Returns true if a column type is found in the given array of types
        function matchType(columnType, types) {
            if (types.indexOf(columnType) !== -1) {
                return true;
            }
            return false;
        }

        // If in edit mode, autogen fields show the value of the existing record
        // Otherwise, show a static string in entry mode.
        function getAutoGenValue(value) {
            if (vm.editMode) {
                return value;
            }
            return 'To be set by system';
        }
    }]);
})();
