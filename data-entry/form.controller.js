(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .controller('FormController', ['editorModel', '$scope', '$window', function FormController(editorModel, $scope, $window) {
        var vm = this;
        vm.editorModel = editorModel;

        vm.showForm = true;
        vm.newData = [];

        vm.confirmSubmission = confirmSubmission;
        vm.cancel = cancel;
        vm.submit = submit;

        vm.getDisplayPatternAnnotation = getDisplayPatternAnnotation;

        vm.inputType = null;

        vm.setInputType = setInputType;
        vm.isAutoGen = isAutoGen;
        vm.isForeignKey = isForeignKey;
        vm.isTextType = isTextType;
        vm.isDateType = isDateType;
        vm.isNumberType = isNumberType;
        // vm.isSliderType = isSliderType;
        vm.matchType = matchType;

        $scope.$watch(function() {
            return vm.editorModel.rows;
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
            console.debug(vm.editorModel.rows); // [{author: 'abc', image_id: 4}, {another row}]
            //
            // vm.editorModel.table.entity.post(vm.editorModel.rows, []).then(null, function error(response) {
            //     console.log(response);
            // });
            //
            // // Reset the form
            // vm.editorModel.rows = [];
            // vm.showForm = true;
        }

        // Returns true if a column's fields should be automatically generated
        function isAutoGen(columnName) {
            var displayPattern = vm.getDisplayPatternAnnotation(columnName);
            // If the column is a key or has a display annotation...
            if (getKeys().indexOf(columnName) !== -1 ) {
                return true;
            } else if (displayPattern) {
                // TODO: for each item in squigglies, prepend "vm.editorModel.rows[0]."
                // remove squigglies. concatenate them...
                vm.editorModel.rows[0][columnName] = displayPattern;
                return true;
            }
            return false;
        }

        function getDisplayPatternAnnotation(columnName) {
            var columns = vm.editorModel.table.columns.all();
            for (var i = 0; i < columns.length; i++) {
                var column = columns[i];
                if (column.name === columnName) {
                    var tag = 'tag:' + $window.location.host + ',' + new Date().getFullYear() + ':display';
                    var annotations = column.annotations.get(tag);
                    if (annotations) {
                        console.log(annotations.content[0].pattern);
                        return annotations.content[0].pattern;
                    }
                }
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

            if (isAutoGen(name)) {
                return 'autoGen';
            } else if (isForeignKey(name)) {
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
