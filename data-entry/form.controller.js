(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .controller('FormController', ['$scope', 'table', function FormController($scope, table) {
        var vm = this;
        vm.table = table;
        vm.showForm = true;
        vm.newData = {};

        vm.confirmSubmission = confirmSubmission;
        vm.cancel = cancel;
        vm.submit = submit;

        vm.getDefaultColumns = getDefaultColumns;

        vm.isTextType = isTextType;
        vm.isDateType = isDateType;
        vm.isNumberType = isNumberType;
        // vm.isSliderType = isSliderType;
        vm.matchType = matchType;

        function confirmSubmission() {
            vm.showForm = false;
        }

        function cancel() {
            vm.showForm = true;
        }

        function submit() {
            // Put the new data in an array so that it's compatible with ERMrest
            vm.newData = [vm.newData];

            vm.table.entity.post(vm.newData, getDefaultColumns()).then(null, function error(response) {
                console.log(response);
            });

            // Reset the form
            vm.newData = {};
            vm.showForm = true;
        }

        // Determine which columns' values will be automatically filled in by ERMrest
        function getDefaultColumns() {
            var defaults = [];
            var keys = vm.table.keys;
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

        // TODO: How to differentiate between using a textarea and input? Maybe a column annotation..
        function isTextType(columnType) {
            var types = ['text', 'jsonb'];
            return matchType(columnType, types);
        }

        function isDateType(columnType) {
            var types = ['date'];
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
