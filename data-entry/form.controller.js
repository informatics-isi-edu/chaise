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

            model.table.entity.post(model.rows, vm.getDefaults()).then(function success(entity) {
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

        function getDefaults() {
            var autogens = [];
            for (var column in vm.editorModel.table.columns.all()) {
                if (vm.isAutoGen(column.name)) {
                    autogens.push(column.name);
                }
            }
            return autogens;
        }

        function getKeyColumns() {
            var keys = [];
            var _keys = vm.editorModel.table.keys.all();
            var numKeys = _keys.length;
            for (var i = 0; i < numKeys; i++) {
                var columns = _keys[i].colset.columns;
                var numColumns = columns.length;
                for (var c = 0; c < numColumns; c++) {
                    keys.push(columns[c]);
                }
            }
            return keys;
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
            return (vm.editorModel.table.columns.get(name).type.name.indexOf('serial') === 0);
        }

        function isForeignKey(columnName) {
            // Columns with FK refs and their FK values are stored in the domainValues
            // obj with the column name as keys and FK values as values. For now,
            // we can determine whether a column is a FK by checking whether domainValues
            // has a key of that column's name.
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
