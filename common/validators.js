(function() {
    'use strict';


    var INTEGER_REGEXP = /^\-?\d+$/;
    // updated float regex
    // ^(Infinity|-Infinity|NaN|-?\d+(\.\d+)?([eE][-+]?\d+)?$
    var FLOAT_REGEXP = /^\-?(\d+)?((\.)?\d+)?$/;
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

    // Validation directive for testing if an input value is a date
    // Use: <input type="text" date>
    .directive('date', function() {
        return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {
                ctrl.$validators.date = function(modelValue, viewValue) {
                    var value = modelValue || viewValue;
                    if (ctrl.$isEmpty(value)) {
                        return true;
                    }
                    return moment(value, ['YYYY-MM-DD', 'YYYY-M-DD', 'YYYY-M-D', 'YYYY-MM-D'], true).isValid();
                };
            }
        };
    })

    // Validation directive for testing if an input value is a time
    // Use: <input type="text" time>
    .directive('time', function() {
        return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {
                ctrl.$validators.time = function(modelValue, viewValue) {
                    if (ctrl.$isEmpty(modelValue)) {
                        return true;
                    }
                    return moment(modelValue, ['hh:mm:ss', 'hh:mm', 'hh'], true).isValid();
                };
                /*
                The parser below takes the view value and inserts the appropriate colons before updating the model value.
                If we decide the placeholder char for the time input's mask should be something other than
                a valid time character (e.g. underscore or space; currently it's 0), then we need to set the model-view-value
                attr on the time input's ui-mask to `false` and uncomment the parser below.
                */
                // ctrl.$parsers.push(function(value) {
                //     value = value.replace(/(.{2})/g, '$1:');
                //     if (value.slice(-1) === ':') {
                //         value = value.slice(0, -1);
                //     }
                //     return value;
                // });
            }
        };
    })

    .directive('timestamp', function() {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elm, attr, ctrl) {
                // attr.validateValues is a an object that models the 3 parts of a timestamp — obj.date, obj.time, obj.meridiem
                scope.$watch(attr.validateValues, function(newObj, oldObj) {
                    // If newObj and oldObj are identical, then this listener fn was triggered
                    // due to app initialization, not an actual model change. Do nothing.
                    if (newObj === oldObj) {
                        return;
                    }
                    console.log(newObj);
                    var date = newObj.date,
                        dateIsValid = moment(date, ['YYYY-MM-DD', 'YYYY-M-DD', 'YYYY-M-D', 'YYYY-MM-D'], true).isValid(),
                        dateIsEmpty = (date === null || date === ''),

                        time = newObj.time,
                        timeIsValid = moment(time, ['hh:mm:ss', 'hh:mm', 'hh'], true).isValid(),
                        timeIsEmpty = (time === null || time === ''),

                        meridiem = newObj.meridiem,
                        meridiemIsValid = ((meridiem.toLowerCase() === 'am' || meridiem.toLowerCase() === 'pm') ? true : false);

                    if (dateIsValid) {
                        if (!timeIsValid && !timeIsEmpty) {
                            return ctrl.$setValidity('timestampTime', false);
                        }
                    } else if (dateIsEmpty) {
                        if (timeIsValid || !timeIsEmpty) {
                            return ctrl.$setValidity('timestampDate', false);
                        }
                    } else { // if date is bad... the whole timestamp is bad..
                        return ctrl.$setValidity('timestampDate', false);
                    }
                    ctrl.$setValidity('timestampDate', true);
                    ctrl.$setValidity('timestampTime', true);
                }, true);
            }
        };
    });
})();
