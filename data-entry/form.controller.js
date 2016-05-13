(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .controller('FormController', ['editorModel', 'context', function FormController(editorModel, context) {
        var vm = this;
        vm.editorModel = editorModel;

        vm.alert = null;
        vm.closeAlert = closeAlert;

        vm.submit = submit;
        vm.addFormRow = addFormRow;
        vm.numRowsToAdd = 1;
        var MAX_ROWS_TO_ADD = context.maxRowsToAdd; // add too many rows and browser could hang

        vm.getKeys = getKeys;

        vm.inputType = null;
        vm.int2min = -32768;
        vm.int2max = 32767;
        vm.int4min = -2147483648;
        vm.int4max = 2147483647;
        vm.int8min = -9223372036854775808
        vm.int8max = 9223372036854775807;

        vm.setInputType = setInputType;
        vm.isAutoGen = isAutoGen;
        vm.isForeignKey = isForeignKey;
        vm.matchType = matchType;

        function submit() {
            var form = vm.formContainer;
            var model = vm.editorModel;
            form.$setUntouched();
            form.$setPristine();

            if (form.$invalid) {
                vm.alert = {type: 'error', message: 'Sorry, the data could not be submitted because there are errors on the form. Please check all fields and try again.'};
                form.$setSubmitted();
                return;
            }

            model.table.entity.post(model.rows, vm.getKeys()).then(function success(entity) {
                vm.alert = {type: 'success', message: 'Your data has been submitted.'};
                form.$setUntouched();
                form.$setPristine();
            }, function error(response) {
                vm.alert = {type: 'error', message: response.data};
                console.log(response);
            });

            // Reset the form
            model.rows = [{}];
        }

        function addFormRow(numRows) {
            numRows = parseInt(numRows, 10);
            if (Number.isNaN(numRows) || numRows < 0 || numRows > MAX_ROWS_TO_ADD) {
                return vm.alert = {type: 'error', message: "Sorry, you can only add 1 to " + MAX_ROWS_TO_ADD + " rows at a time. Please enter a whole number from 1 to " + MAX_ROWS_TO_ADD + "."};
            } else if (numRows === 0) {
                return;
            }
            var rowset = vm.editorModel.rows;
            var prototypeRow = rowset[rowset.length-1];
            for (var i = 0; i < numRows; i++) {
                var row = angular.copy(prototypeRow);
                rowset.push(row);
            }
        }

        function getKeys() {
            var defaults = [];
            var keys = vm.editorModel.table.keys.all();
            var numKeys = keys.length;
            for (var i = 0; i < numKeys; i++) {
                var columns = keys[i].colset.columns;
                for (var c = 0; c < columns.length; c++) {
                    var column = columns[c];
                    if (column.type.name.indexOf('serial') === 0) {
                        defaults.push(column.name);
                    }
                }
            }
            return defaults;
        }

        function setInputType(column) {
            var name = column.name;
            var type = column.type.name;
            var displayType;

            // TODO: Add isAutoGen case back in when we've figured out the ID generation stuff
            if (vm.isForeignKey(name)) {
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
                    default:
                        displayType = 'text';
                        break;
                }
            }

            return displayType;
        }

        // Returns true if a column's fields should be automatically generated
        function isAutoGen(columnType) {
            if (columnType.indexOf('serial') === 0) {
                return true;
            }
            return false;
        }

        function isForeignKey(columnName) {
            return vm.editorModel.domainValues.hasOwnProperty(columnName);
        }

        // Returns true if a column type is found in the given array of types
        function matchType(columnType, types) {
            if (types.indexOf(columnType) !== -1) {
                return true;
            }
            return false;
        }

        function closeAlert() {
            vm.alert = null;
        }
    }]);
})();
