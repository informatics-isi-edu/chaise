(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .controller('FormController', ['ErrorService', 'AlertsService', 'UriUtils', 'recordEditModel', 'context', '$window', '$log', function FormController(ErrorService, AlertsService, UriUtils, recordEditModel, context, $window, $log) {
        var vm = this;
        vm.recordEditModel = recordEditModel;
        vm.server = context.server;
        vm.editMode = context.filters || false;
        vm.booleanValues = context.booleanValues;
        vm.getAutoGenValue = getAutoGenValue;

        vm.alerts = AlertsService.alerts;
        vm.closeAlert = AlertsService.deleteAlert;

        vm.submit = submit;
        vm.redirectAfterSubmission = redirectAfterSubmission;
        vm.showSubmissionError = showSubmissionError;
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
            var redirectUrl = $window.location.origin;
            form.$setUntouched();
            form.$setPristine();

            if (rowset.length == 1) {
                AlertsService.addAlert({type: 'success', message: 'Your data has been submitted. Redirecting you now to the record...'});
                // example: https://dev.isrd.isi.edu/chaise/record/#1/legacy:dataset/id=5564
                // TODO: Postpone using datapath api to build redirect url until
                // datapath is redeveloped to only use aliases when necessary
                redirectUrl += '/chaise/record/#' + context.catalogID + '/' + UriUtils.fixedEncodeURIComponent(context.schemaName) + ':' + UriUtils.fixedEncodeURIComponent(context.tableName);

                try {
                    // Find the shortest "primary key" for use in redirect url
                    var keys = model.table.keys.all().sort(function(a, b) {
                        return a.colset.length() - b.colset.length();
                    });
                    var shortestKey = keys[0].colset.columns;

                    // Build the redirect url with key cols and entity's values
                    for (var c = 0, len = shortestKey.length; c < len; c++) {
                        var colName = shortestKey[c].name;
                        var separator = null;
                        if (rowset.length == 1) {
                            redirectUrl += '/' + UriUtils.fixedEncodeURIComponent(colName) + '=' + UriUtils.fixedEncodeURIComponent(entities[0][colName]);
                        }
                    }
                } catch (exception) { // catches model.table.keys.all()
                    // handle exception
                    $log.info(exception);
                }
            } else if (rowset.length > 1) {
                AlertsService.addAlert({type: 'success', message: 'Your data has been submitted. Redirecting you now to the record set...'});
                // example: https://synapse-dev.isrd.isi.edu/chaise/recordset/#1/Zebrafish:Subject@sort(Birth%20Date::desc::)
                redirectUrl += '/chaise/recordset/#' + context.catalogID + '/' + UriUtils.fixedEncodeURIComponent(context.schemaName) + ':' + UriUtils.fixedEncodeURIComponent(context.tableName);
            } else {
                return AlertsService.addAlert({type: 'error', message: 'Sorry, there is no data to submit. You must have at least 1 set of data for submission.'});
            }

            // Redirect to record or recordset app..
            $window.location.replace(redirectUrl);
        }

        function showSubmissionError(response) {
            AlertsService.addAlert({type: 'error', message: response.message});
            console.log(response);
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

            if (vm.editMode) {
                model.table.entity.put(model.rows).then(function success(entities) {
                    // Wrapping redirectAfterSubmission callback fn in the success callback fn
                    // due to inability to pass the success/error responses directly
                    // into redirectAfterSubmission fn. (ReferenceError)
                    vm.redirectAfterSubmission(entities);
                }, function error(response) {
                    vm.showSubmissionError(response);
                });
            } else {
                model.table.entity.post(model.rows, vm.getDefaults()).then(function success(entities) {
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
                rowset.push(angular.copy(protoRow));
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
                    case 'timestamptz':
                    case 'date':
                        displayType = 'date';
                        break;
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
               if ((ignore && (ignoreCol.content.length === 0 || ignoreCol.content === null || ignoreCol.content.indexOf('entry') !== -1)) || hidden) {
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
