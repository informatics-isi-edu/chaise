(function() {
    'use strict';
    
    angular.module('chaise.inputs', ['chaise.validators'])

    .directive('rangeInputs', function() {
        return {
            restrict: 'E',
            templateUrl: '../common/templates/rangeInputs.html',
            scope: {
                type: '=',
                addRangeCb: '=',
                absMin: '=?',
                absMax: '=?'
            },
            link: function(scope, elem, attr) {
                function emptyOrNull(val) {
                    return (val == '' || val == null || val == undefined);
                }

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
                            relativeType = (colType.baseType) ? type(colType.baseType) : "number";
                            break;
                    }
                    return relativeType;
                }

                // initialize properties
                if (scope.displayType(scope.type) == "datetime") {
                    scope.min = {
                        date: null,
                        time: null
                    };
                    scope.max = {
                        date: null,
                        time: null
                    };
                } else {
                    scope.min = null;
                    scope.max = null;
                }
                
                scope.numericError = function () {
                    return scope.numericMin.$error || scope.numericMax.$error;
                }

                scope.showNumericError = function () {
                    return (scope.numericMin.$dirty && scope.numericMin.$error.integer) || (scope.numericMax.$dirty && scope.numericMax.$error.integer) || scope.minMaxForm.$submitted;
                }

                // returns a boolean to disable the add button if both min and max are not set
                // for timestamps/datetime, we don't care if the time is not set
                scope.disableAdd = function () {
                    return (scope.displayType(scope.type) == "datetime") ? ( emptyOrNull(scope.min.date) && emptyOrNull(scope.max.date) ) : ( emptyOrNull(scope.min) && emptyOrNull(scope.max) );
                };

                scope.dateError = function () {
                    return scope.dateMin.$error || scope.dateMax.$error || scope.tsDateMin.$error || scope.tsDateMax.$error;
                }
                
                //TODO refactor for each form
                scope.showDateError = function () {
                    return (scope.dateMin.$dirty && scope.dateMin.$error.date) || (scope.dateMax.$dirty && scope.dateMax.$error.date) || (scope.tsDateMin.$dirty && scope.tsDateMin.$error.date) || (scope.tsDateMax.$dirty && scope.tsDateMax.$error.date) || scope.minMaxForm.$submitted;
                }

                scope.timeError = function () {
                    return scope.timeMin.$error || scope.timeMax.$error;
                }

                scope.showTimeError = function () {
                    return (scope.timeMin.$dirty && scope.timeMin.$error.time) || (scope.timeMax.$dirty && scope.timeMax.$error.time) || scope.minMaxForm.$submitted;
                }

                scope.addRange = function () {
                    var min, max;
                    scope.isDirty = true;
                    // data for timestamp[tz] needs to be formatted properly
                    if (scope.displayType(scope.type) == "datetime") {
                        console.log(scope.min.date + scope.min.time);
                        min = (scope.min.date) ? moment(scope.min.date + scope.min.time, 'YYYY-MM-DDHH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.SSSZ') : '';
                        max = (scope.max.date) ? moment(scope.max.date + scope.max.time, 'YYYY-MM-DDHH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.SSSZ') : '';
                    } else {
                        min = scope.min;
                        max = scope.max;
                    }

                    if (min == '') min = null;
                    if (max == '') max = null;
                    scope.addRangeCb(min, max);
                };
            }
        }
    });
})();
