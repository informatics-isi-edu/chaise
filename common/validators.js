(function() {
    'use strict';


    var INTEGER_REGEXP = /^\-?\d+$/;
    angular.module('chaise.validators', [])
    // Validation directive for testing if an input value is an integer
    // Use: <input type="number" required integer>
    .directive('integer', function() {
        return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {
                ctrl.$validators.integer = function(modelValue, viewValue) {
                    if (ctrl.$isEmpty(modelValue)) {
                        // consider empty models to be valid
                        // use the `required` attribute in the HTML
                        console.log("Empty");
                        return true;
                    }
                    if (INTEGER_REGEXP.test(viewValue)) {
                        // it is valid
                        console.log("Passed REGEX");
                        return true;
                    }
                    // it is invalid
                    console.log("Invalid integer value");
                    return false;
                };
            }
        };
    })

    // Validation directive for testing if an input value is a float
    // Use: <input type="number" required float>
    .directive('float', function() {
        return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {
                ctrl.$validators.float = function(modelValue, viewValue) {
                    if (ctrl.$isEmpty(modelValue)) {
                        // consider empty models to be valid
                        // use the `required` attribute in the HTML
                        console.log("Empty");
                        return true;
                    }
                    if (angular.isNumber(parseFloat(viewValue))) {
                        // it is valid
                        console.log("Passed REGEX");
                        return true;
                    }
                    // it is invalid
                    console.log("Invalid float value");
                    return false;
                };
            }
        };
    });
})();
