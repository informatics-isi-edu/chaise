(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .controller('FormController', ['data', function FormController(data) {
        var vm = this;
        vm.data = data;
        vm.newData = {};
        vm.showForm = true;

        vm.cancel = cancel;
        vm.confirmSubmission = confirmSubmission;
        vm.submit = submit;
        vm.defaultColumns = getDefaultColumns;
        vm.showColumn = showColumn;

        vm.isTextType = isTextType;
        vm.isDateType = isDateType;
        // vm.isNumberType = isNumberType;
        // vm.isDropdownType = isDropdownType;
        vm.isSliderType = isSliderType;
        vm.matchType = matchType;

        function cancel() {
            vm.showForm = true;
        }

        function confirmSubmission() {
            vm.showForm = false;
        }

        function submit() {
            // Put the new data in an array so that it's compatible with ERMrest
            vm.newData = [vm.newData];

            vm.data.table.entity.post(vm.newData, vm.defaultColumns()).then(null, function error(response) {
                console.log(response);
            });

            // Reset the form
            vm.newData = {};
            vm.showForm = true;
        }

        // Determine which columns' values will be automatically filled in by ERMrest
        function getDefaultColumns() {
            var defaults = [];
            var columns = vm.data.table.columns._columns;
            angular.forEach(columns, function(props, column) {
                var name = props.name;
                var type = props.type.name;
                if (name === 'created' && type === 'date') {
                    // If column name is "created" and column type is "date", add it to defaults
                    defaults.push(name);
                } else if (type.indexOf('serial') === 0) {
                    // If column type begins with "serial" (e.g. serial4), add to defaults
                    defaults.push(name);
                }
            });
            return defaults;
        }

        // Returns true if a user doesn't need to fill in a column
        function showColumn(columnName) {
            if (vm.defaultColumns().indexOf(columnName) === -1) {
                return true;
            }
            return false;
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

        // TODO: If column is a FK, use a dropdown?
        // function isDropdownType(columnType) {
        //     var types = [];
        //     return matchType(columnType, types);
        // }

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
