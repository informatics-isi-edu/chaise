(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .controller('FormController', ['AlertsService', 'UriUtils', 'recordEditModel', 'context', '$window', '$log', function FormController(AlertsService, UriUtils, recordEditModel, context, $window, $log) {
        var vm = this;
        vm.test = test;
        vm.recordEditModel = recordEditModel;
        vm.server = context.server;
        vm.editMode = context.filter || false;
        vm.booleanValues = context.booleanValues;
        vm.getAutoGenValue = getAutoGenValue;

        vm.alerts = AlertsService.alerts;
        vm.closeAlert = AlertsService.deleteAlert;

        vm.submit = submit;
        vm.redirectAfterSubmission = redirectAfterSubmission;
        vm.showSubmissionError = showSubmissionError;
        vm.submissionMode = false; // A flag to track whether the app is in the part of the workflow in which the user has clicked Submit but the app hasn't POSTed or PUT the data to ERMrest yet.
        vm.copyFormRow = copyFormRow;
        vm.removeFormRow = removeFormRow;

        vm.getDefaults = getDefaults;

        vm.inputType = null;
        vm.int2min = -32768;
        vm.int2max = 32767;
        vm.int4min = -2147483648;
        vm.int4max = 2147483647;
        vm.int8min = -9223372036854775808
        vm.int8max = 9223372036854775807;

        vm.columnToDisplayType = columnToDisplayType;
        vm.isAutoGen = isAutoGen;
        vm.isForeignKey = isForeignKey;
        vm.matchType = matchType;
        vm.isHiddenColumn = isHiddenColumn;

        function redirectAfterSubmission(entities) {
            var form = vm.formContainer;
            var model = vm.recordEditModel;
            var rowset = model.rows;
            var redirectUrl = '../';
            form.$setUntouched();
            form.$setPristine();

            if (entities.length === 0) {
            // 1. var entities = the data returned from ERMrest after POST or PUT operation.
            // 2. var rowset = this app's representation of the submitted data.
            // 3. If entities === [], that means the user submitted no new changes
            // to the record, which means we can use rowset to build the redirect
            // url later.
            // Why not just use rowset the whole time? Because after user submits
            // data, ERMrest might have modified that data, so we should use the
            // returned data from ERMrest instead of assuming rowset and entities
            // are always the same.
                entities = rowset;
            }

            // Find the shortest "primary key" for use in redirect url
            var keys = model.table.keys.all().sort(function(a, b) {
                return a.colset.length() - b.colset.length();
            });
            var shortestKey = keys[0].colset.columns;


            if (rowset.length == 1) {
                AlertsService.addAlert({type: 'success', message: 'Your data has been submitted. Redirecting you now to the record...'});
                // example: https://dev.isrd.isi.edu/chaise/record/#1/legacy:dataset/id=5564
                // TODO: Postpone using datapath api to build redirect url until
                // datapath is redeveloped to only use aliases when necessary
                redirectUrl += 'record/#' + context.catalogID + '/' + UriUtils.fixedEncodeURIComponent(context.schemaName) + ':' + UriUtils.fixedEncodeURIComponent(context.tableName);

            } else if (rowset.length > 1) {
                AlertsService.addAlert({type: 'success', message: 'Your data has been submitted. Redirecting you now to the record set...'});
                // example: https://synapse-dev.isrd.isi.edu/chaise/recordset/#1/Zebrafish:Subject@sort(Birth%20Date::desc::)
                redirectUrl += 'recordset/#' + context.catalogID + '/' + UriUtils.fixedEncodeURIComponent(context.schemaName) + ':' + UriUtils.fixedEncodeURIComponent(context.tableName);
            } else {
                return AlertsService.addAlert({type: 'error', message: 'Sorry, there is no data to submit. You must have at least 1 set of data for submission.'});
            }

            // finish building the url with entity filters
            for (var e = 0; e < entities.length; e++) {
                redirectUrl += (e === 0? "/" : ";");

                // entity keys
                for (var c = 0, len = shortestKey.length; c < len; c++) {
                    redirectUrl += (c === 0 && len > 1 ? "(" : "");
                    redirectUrl += (c > 0 ? "&" : "");

                    var colName = shortestKey[c].name;
                    redirectUrl += UriUtils.fixedEncodeURIComponent(colName) + '=' + UriUtils.fixedEncodeURIComponent(entities[e][colName]);
                }

                redirectUrl += (len > 1 ? ")" : "");
            }

            // Redirect to record or recordset app..
            $window.location.replace(redirectUrl);
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
        function transformRowValues(row, model) {
            for (var k in row) {
                try {
                    var column = model.table.columns.get(k);
                    switch (column.type.name) {
                        case 'timestamp':
                        case 'timestamptz':
                        case 'date':
                            if (vm.submissionMode && typeof row[k] === 'object') {
                                row[k] = new Date(row[k].date.toDateString() + ' ' + row[k].time.toTimeString()).toISOString();
                            }
                        default: if (row[k] === '') row[k] = null;
                            break;
                    }
                } catch(e) {}
            }
        }

        function submit() {
            vm.submissionMode = true;
            var form = vm.formContainer;
            var model = vm.recordEditModel;
            form.$setUntouched();
            form.$setPristine();

            if (form.$invalid) {
                AlertsService.addAlert({type: 'error', message: 'Sorry, the data could not be submitted because there are errors on the form. Please check all fields and try again.'});
                form.$setSubmitted();
                return;
            }

            // Somewhere in about here.. you need to check model.rows for date||timestamp columns,
            // perform the concatenation of date +  time and then set it as the actual final value?
            // At least some sort of manipulation, where you have to give it a final value instead of an object of multiple vals.

            model.rows.forEach(function(row) {
                transformRowValues(row, model);
            });

            if (vm.editMode) {
                model.table.entity.put(model.rows).then(function success(entities) {
                    vm.submissionMode = false;
                    // Wrapping redirectAfterSubmission callback fn in the success callback fn
                    // due to inability to pass the success/error responses directly
                    // into redirectAfterSubmission fn. (ReferenceError)
                    vm.redirectAfterSubmission(entities);
                }, function error(response) {
                    vm.showSubmissionError(response);
                });
            } else {
                model.table.entity.post(model.rows, vm.getDefaults()).then(function success(entities) {
                    vm.submissionMode = false;
                    vm.redirectAfterSubmission(entities);
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

        function getDefaults() {
            var defaults = [];

            try {
                var columns = vm.recordEditModel.table.columns.all();
                var numColumns = columns.length;
                for (var i = 0; i < numColumns; i++) {
                    var columnName = columns[i].name;
                    if (vm.isAutoGen(columnName) || vm.isHiddenColumn(columns[i])) {
                        defaults.push(columnName);
                    }
                }
            } catch (exception) { // catches table.columns.all()
                // Should not error, if none it returns an empty array
            } finally {
                return defaults;
            }
        }

        function getKeyColumns() {
            var keys = [];
            try {
                var _keys = vm.recordEditModel.table.keys.all();
                var numKeys = _keys.length;
                for (var i = 0; i < numKeys; i++) {
                    var columns = _keys[i].colset.columns;
                    var numColumns = columns.length;
                    for (var c = 0; c < numColumns; c++) {
                        keys.push(columns[c]);
                    }
                }
            } catch (exception) { // catches table.keys.all()
                // Should not error, if none it returns an empty array
            } finally {
                return keys;
            }
        }

        function columnToDisplayType(column) {
            var name = column.name;
            var type = column.type.name;
            var displayType;
            if (vm.isAutoGen(name)) {
                displayType = 'autogen';
            } else if (vm.isForeignKey(name)) {
                displayType = 'dropdown';
            } else {
                switch (type) {
                    case 'timestamp':
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
        function isAutoGen(name) {
            try {
                return (vm.recordEditModel.table.columns.get(name).type.name.indexOf('serial') === 0);
            } catch (exception) {
                // handle exception
                $log.info(exception);
            }
        }

        function isForeignKey(columnName) {
            // Columns with FK refs and their FK values are stored in the domainValues
            // obj with the column name as keys and FK values as values. For now,
            // we can determine whether a column is a FK by checking whether domainValues
            // has a key of that column's name.
            return vm.recordEditModel.domainValues.hasOwnProperty(columnName);
        }

        // Returns true if a column type is found in the given array of types
        function matchType(columnType, types) {
            if (types.indexOf(columnType) !== -1) {
                return true;
            }
            return false;
        }

        // Returns true if a column has a 2015:hidden annotation or a 2016:ignore
        // (with entry context) annotation.
        function isHiddenColumn(column) {
            var ignore, ignoreCol, hidden;
            var ignoreAnnotation = 'tag:isrd.isi.edu,2016:ignore';

            try {
                ignore = column.annotations.contains(ignoreAnnotation);
                if (ignore) {
                    ignoreCol = column.annotations.get(ignoreAnnotation); // still needs to be caught in case something gets out of sync
                }
                hidden = column.annotations.contains('tag:misd.isi.edu,2015:hidden');

            } finally {
               if ((ignore && (ignoreCol.content.length === 0 || ignoreCol.content === null || ignoreCol.content === true || ignoreCol.content.indexOf('entry') !== -1)) || hidden) {
                   return true;
               }
               return false;
            }

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
