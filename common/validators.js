(function() {
    'use strict';


    var INTEGER_REGEXP = /^\-?\d+$/;
    // updated float regex
    // ^(Infinity|-Infinity|NaN|-?\d+(\.\d+)?([eE][-+]?\d+)?$
    var FLOAT_REGEXP = /^\-?(\d+)?((\.)?\d+)?$/;
    var TIME_REGEXP = /^(?:([01]?\d|2[0-3]):([0-5]?\d):)?([0-5]?\d)$/ // matches HH:MM:SS
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
                        return true;
                    }
                    if (INTEGER_REGEXP.test(viewValue)) {
                        // it is valid
                        return true;
                    }
                    // it is invalid
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
                        return true;
                    }
                    if (FLOAT_REGEXP.test(viewValue)) {
                        // it is valid
                        return true;
                    }
                    // it is invalid
                    return false;
                };
            }
        };
    })

    .directive('date', function() {
        return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {
                ctrl.$validators.date = function(modelValue, viewValue) {
                    if (ctrl.$isEmpty(modelValue)) {
                        return true;
                    }
                    return moment(modelValue, 'YYYY-MM-DD', true).isValid();
                };
            }
        };
    })

    .directive('time', function() {
        return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {
                ctrl.$validators.time = function(modelValue, viewValue) {
                    if (ctrl.$isEmpty(modelValue)) {
                        return true;
                    }
                    if (TIME_REGEXP.test(viewValue)) {
                        return true;
                    }
                    return false;
                };
                // ctrl.$formatters.push(function(modelValue) {
                //     return moment(modelValue, moment.ISO_8601, true).format('hh:mm:ss');
                // });
                // ctrl.$parsers.push(function(viewValue) {
                //     return moment(viewValue, moment.ISO_8601, true).format('HH:mm:ss');
                // });
            }
        };
    });
})();
