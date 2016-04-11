(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .controller('FormController', ['editorModel', function FormController(editorModel) {
        var vm = this;
        vm.editorModel = editorModel;

        vm.alert = null;
        vm.closeAlert = closeAlert;

        vm.submit = submit;
        vm.addFormRow = addFormRow;
        vm.numRowsToAdd = 2; // Default set at 2, but could be any number

        vm.getKeys = getKeys;

        vm.inputType = null;

        vm.setInputType = setInputType;
        vm.isAutoGen = isAutoGen;
        vm.isForeignKey = isForeignKey;
        vm.isDate = isDate;
        vm.isNumber = isNumber;
        vm.matchType = matchType;

        function submit() {
            var form = vm.formContainer;
            var model = vm.editorModel;

            if (form.$invalid) {
                vm.alert = {
                    type: 'error',
                    message: 'Sorry, the data could not be submitted because there are errors on the form. Please check all fields and try again.'
                };
                return form.$setSubmitted();
            }

            model.table.entity.post(model.rows, vm.getKeys()).then(function success(entity) {
                vm.alert = {
                    type: 'success',
                    message: 'Your data has been submitted.'
                };
                form.$setUntouched();
                form.$setPristine();
            }, function error(response) {
                vm.alert = {
                    type: 'error',
                    message: response.data
                };
                console.log(response);
            });

            // Reset the form
            model.rows = [{}];
        }

        function addFormRow(numRows) {
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

            // TODO: Add isAutoGen case back in when we've figured out the ID generation stuff
            if (vm.isForeignKey(name)) {
                return 'dropdown';
            } else if (vm.isDate(type)) {
                return 'date';
            } else if (vm.isNumber(type)) {
                return 'number';
            } else {
                return 'text';
            }
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

        function isDate(columnType) {
            var types = ['date', 'timestamptz'];
            return vm.matchType(columnType, types);
        }

        function isNumber(columnType) {
            var types = ['int4', 'int8'];
            return vm.matchType(columnType, types);
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
