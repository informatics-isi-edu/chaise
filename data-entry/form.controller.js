(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .controller('FormController', ['editorModel', function FormController(editorModel) {
        var vm = this;
        vm.editorModel = editorModel;

        vm.submit = submit;
        vm.addFormRow = addFormRow;

        vm.getKeys = getKeys;

        vm.inputType = null;

        vm.setInputType = setInputType;
        vm.isAutoGen = isAutoGen;
        vm.isForeignKey = isForeignKey;
        vm.isDate = isDate;
        vm.isNumber = isNumber;
        vm.matchType = matchType;

        function submit() {
            vm.editorModel.table.entity.post(vm.editorModel.rows, vm.getKeys()).then(null, function error(response) {
                console.log(response);
            });

            // Reset the form
            vm.editorModel.rows = [{}];
        }

        function addFormRow() {
            vm.editorModel.rows.push({});
        }

        // Returns true if a column's fields should be automatically generated
        function isAutoGen(columnType) {
            if (columnType.indexOf('serial') === 0) {
                return true;
            }
            return false;
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

            if (vm.isAutoGen(type)) {
                return 'autoGen';
            } else if (vm.isForeignKey(name)) {
                return 'dropdown';
            } else if (vm.isDate(type)) {
                return 'date';
            } else if (vm.isNumber(type)) {
                return 'number';
            } else {
                return 'text';
            }
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
    }]);
})();
