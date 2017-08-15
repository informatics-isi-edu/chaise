(function() {
    'use strict';

    angular.module('chaise.inputs', ['chaise.validators'])

    .directive('integerInput', function() {
        return {
            require: "?ngModel",
            restrict: 'E',
            scope: {
                column: '@',
                elePlaceholder: '@',
                formContainerInput: '@',
                inputType: '@',
                isDisabled: '@',
                isRequired: '@',
                isSubmitted: '@',
                modelType: '@'
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

                console.log(ngModel);
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
