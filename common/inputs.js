(function() {
    'use strict';

    angular.module('chaise.inputs', ['chaise.validators'])

    /**
     * This directive is a reusable integer input for all types of integers that chaise 
     * allows (int2, int4, int8). It includes the validator for the input as well.
     */
    .directive('integerInput', function() {
        return {
            require: "?ngModel",
            restrict: 'E',
            scope: {
                column: '=',                // column associated with the input
                elePlaceholder: '=?',       // placeholder text
                formContainerInput: '=',    // input field on the for container
                inputId: '@',               // id for the input used by e2e tests
                inputType: '@',             // input type as defined by getInputType
                isDisabled: '=',            // boolean whether input is disabled
                isRequired: '=',            // boolean whether input is required
                isSubmitted: '=',           // boolean whether form was submitted
                modelType: '@'              // model type as defined by ermrest
            },
            templateUrl: '../common/templates/inputs/integer.html',
            link: function(scope, elem, attr, ngModel) {
                switch (scope.inputType) {
                    case 'integer2':
                        scope.min = -32768;
                        scope.max = 32767;
                        break;
                    case 'integer4':
                        scope.min = -2147483648;
                        scope.max = 2147483647;
                        break;
                    case 'integer8':
                        scope.min = -9223372036854775808;
                        scope.max = 9223372036854775807;
                        break;
                    default:
                        break;
                }

                if (!ngModel) return;

                scope.onChange = function(){
                    ngModel.$setViewValue(scope.value);
                };

                ngModel.$render = function(){
                    scope.value = ngModel.$modelValue;
                };
            }
        }
    });
})();
