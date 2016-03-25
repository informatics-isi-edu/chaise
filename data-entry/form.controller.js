(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .controller('FormController', ['editorModel', '$scope', function FormController(editorModel, $scope) {
        var vm = this;
        vm.editorModel = editorModel;

        vm.showForm = true;
        vm.newData = {};

        vm.confirmSubmission = confirmSubmission;
        vm.cancel = cancel;
        vm.submit = submit;

        vm.getDefaultColumns = getDefaultColumns;

        vm.inputType = null;

        vm.setInputType = setInputType;
        vm.isForeignKey = isForeignKey;
        vm.isTextType = isTextType;
        vm.isDateType = isDateType;
        vm.isNumberType = isNumberType;
        // vm.isSliderType = isSliderType;
        vm.matchType = matchType;


        $scope.$watch(function() {
            return vm.editorModel.rows[0];
        }, function(newValue, oldValue) {
            console.log(newValue);
        });

        function confirmSubmission() {
            vm.showForm = false;
        }

        function cancel() {
            vm.showForm = true;
        }

        function submit() {
            // Put the new data in an array so that it's compatible with ERMrest
            vm.newData = [vm.newData];

            vm.editorModel.entity.post(vm.newData, getDefaultColumns()).then(null, function error(response) {
                console.log(response);
            });

            // Reset the form
            vm.newData = {};
            vm.showForm = true;
        }

        // Determine which columns' values will be automatically filled in by ERMrest
        function getDefaultColumns() {
            var defaults = [];
            var keys = vm.editorModel.keys;
            for (var i = 0; i < keys.length; i++) {
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
            var type = column.type.name;

            if (isForeignKey(column.name)) {
                return 'dropdown';
            } else if (isDateType(type)) {
                return 'date';
            } else if (isNumberType(type)) {
                return 'number';
            } else {
                return 'text';
            }
        }

        function isForeignKey(columnName) {
            return vm.editorModel.domainValues.hasOwnProperty(columnName);
        }

        // TODO: How to differentiate between using a textarea and input? Maybe a column annotation..
        function isTextType(columnType) {
            var types = ['text'];
            return matchType(columnType, types);
        }

        function isDateType(columnType) {
            var types = ['date', 'timestamptz'];
            return matchType(columnType, types);
        }

        function isNumberType(columnType) {
            var types = ['int4', 'int8'];
            return matchType(columnType, types);
        }

        // function isSliderType(columnType) {
        //     var types = [];
        //     return matchType(columnType, types);
        // }

        // Returns true if a column type is found in the given array of types
        function matchType(columnType, types) {
            if (types.indexOf(columnType) !== -1) {
                return true;
            }
            return false;
        }
    }]);
})();
