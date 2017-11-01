(function() {
    'use strict';
    
    angular.module('chaise.inputs', ['chaise.validators'])

    .directive('rangeInputs', function() {
        return {
            restrict: 'E',
            templateUrl: '../common/templates/inputs/rangeInputs.html',
            scope: {
                type: '=',
                addRangeCb: '=',
                absMin: '=?',
                absMax: '=?'
            },
            link: function(scope, elem, attr) {
                function emptyOrNull(val) {
                    
                    return (val === '' || val == null || val == undefined);
                }
                
                scope.int2min = -32768;
                scope.int2max = 32767;
                scope.int4min = -2147483648;
                scope.int4max = 2147483647;
                scope.int8min = -9223372036854775808
                scope.int8max = 9223372036854775807;
                
                scope.model = {};

                /**
                 * Returns a relative type after checkins if the column has a domain type.
                 *
                 * @returns {String} - the column's type's name
                 */
                scope.displayType = function (colType) {
                    var relativeType;

                    switch (colType.name) {
                        case 'date':
                            relativeType = "date";
                            break;
                        case 'timestamp':
                        case 'timestamptz':
                            relativeType = "datetime";
                            break;
                        case 'int2':
                        case 'int4':
                        case 'int8':
                        case 'float4':
                        case 'float8':
                        case 'numeric':
                            relativeType = "number";
                            break;
                        default:
                            relativeType = (colType.baseType) ? scope.displayType(colType.baseType) : "number";
                            break;
                    }
                    return relativeType;
                }

                // initialize properties
                if (scope.displayType(scope.type) == "datetime") {
                    scope.model.min = {
                        date: null,
                        time: null
                    };
                    scope.model.max = {
                        date: null,
                        time: null
                    };
                } else {
                    scope.model.min = null;
                    scope.model.max = null;
                }

                // returns a boolean to disable the add button if both min and max are not set
                // for timestamps/datetime, we don't care if the time is not set
                scope.disableAdd = function () {
                    return (scope.displayType(scope.type) == "datetime") ? ( emptyOrNull(scope.model.min.date) && emptyOrNull(scope.model.max.date) ) : ( emptyOrNull(scope.model.min) && emptyOrNull(scope.model.max) );
                };

                scope.addRange = function () {
                    var min, max;
                    scope.isDirty = true;
                    // data for timestamp[tz] needs to be formatted properly
                    if (scope.displayType(scope.type) == "datetime") {
                        min = (scope.model.min.date) ? moment(scope.model.min.date + scope.model.min.time, 'YYYY-MM-DDHH:mm:ss') : '';
                        max = (scope.model.max.date) ? moment(scope.model.max.date + scope.model.max.time, 'YYYY-MM-DDHH:mm:ss') : '';
                        if ((min && max) && max.isBefore(min)) {
                            scope.minMaxForm.$error.improperRange = true;
                            return;
                        } else {
                            scope.minMaxForm.$error.improperRange = false;
                        }
                        if (min) min = min.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                        if (max) max = max.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                        // data for date needs to be formatted properly for a proper comparison
                    } else if (scope.displayType(scope.type) == "date") {
                        min = (scope.model.min) ? moment(scope.model.min, 'YYYY-MM-DD') : '';
                        max = (scope.model.max) ? moment(scope.model.max, 'YYYY-MM-DD') : '';
                        if ((min && max) && max.isBefore(min)) {
                            scope.minMaxForm.$error.improperRange = true;
                            return;
                        } else {
                            scope.minMaxForm.$error.improperRange = false;
                        }
                        if (min) min = min.format('YYYY-MM-DD');
                        if (max) max = max.format('YYYY-MM-DD');
                        // date for numeric should be formatted as Number() for a proper comparison
                    } else if (scope.displayType(scope.type) == "number") {
                        min = !emptyOrNull(scope.model.min) ? Number(scope.model.min) : '';
                        max = !emptyOrNull(scope.model.max) ? Number(scope.model.max) : '';
                        if ((min && max) && min > max) {
                            scope.minMaxForm.$error.improperRange = true;
                            return;
                        } else {
                            scope.minMaxForm.$error.improperRange = false;
                        }
                    }

                    if (min === '') min = null;
                    if (max === '') max = null;
                    scope.addRangeCb(min, max);
                };

                // if timestamp inputs are emptied or changed
                if (scope.displayType(scope.type) == "datetime") {
                    scope.$watch('model.min.date', function (newValue, oldValue) {
                        if (scope.minMaxForm.$error.improperRange) {
                            scope.minMaxForm.$error.improperRange = false;
                        }
                    });

                    scope.$watch('model.min.time', function (newValue, oldValue) {
                        if (scope.minMaxForm.$error.improperRange) {
                            scope.minMaxForm.$error.improperRange = false;
                        }
                    });

                    scope.$watch('model.max.date', function (newValue, oldValue) {
                        if (scope.minMaxForm.$error.improperRange) {
                            scope.minMaxForm.$error.improperRange = false;
                        }
                    });

                    scope.$watch('model.max.time', function (newValue, oldValue) {
                        if (scope.minMaxForm.$error.improperRange) {
                            scope.minMaxForm.$error.improperRange = false;
                        }
                    });
                } else {
                    scope.$watch('model.min', function (newValue, oldValue) {
                        if (scope.minMaxForm.$error.improperRange) {
                            scope.minMaxForm.$error.improperRange = false;
                        }
                    });

                    scope.$watch('model.max', function (newValue, oldValue) {
                        if (scope.minMaxForm.$error.improperRange) {
                            scope.minMaxForm.$error.improperRange = false;
                        }
                    });
                }
            }
        }
    });
})();
