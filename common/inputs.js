(function() {
    'use strict';

    angular.module('chaise.inputs', ['chaise.validators', 'chaise.utils'])

    .directive('rangeInputs', ['dataFormats', 'integerLimits', 'UriUtils', function(dataFormats, integerLimits, UriUtils) {
        return {
            restrict: 'E',
            templateUrl:  UriUtils.chaiseDeploymentPath() + 'common/templates/inputs/rangeInputs.html',
            scope: {
                type: '=',
                addRangeCb: '=',
                absMin: '=?',
                absMax: '=?',
                model: '=?',
                disabled: "=?"
            },
            link: function(scope, elem, attr) {
                function emptyOrNull(val) {
                    return (val === '' || val == null || val == undefined);
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
                            relativeType = (colType.baseType) ? scope.displayType(colType.baseType) : "number";
                            break;
                    }
                    return relativeType;
                }

                // initialize properties
                scope.dataFormats = dataFormats;
                scope.model = {};
                scope.model.min = scope.modelMin;
                scope.model.max = scope.modelMax;
                switch (scope.type.rootName) {
                    case 'int2':
                        scope.intMin = integerLimits.INT_2_MIN;
                        scope.intMax = integerLimits.INT_2_MAX;
                        break;
                    case 'int4':
                        scope.intMin = integerLimits.INT_4_MIN;
                        scope.intMax = integerLimits.INT_4_MAX;
                        break;
                    case 'int8':
                        scope.intMin = integerLimits.INT_8_MIN;
                        scope.intMax = integerLimits.INT_8_MAX;
                        break;
                    case 'timestamp':
                    case 'timestamptz':
                        scope.model.min = {
                            date: null,
                            time: null
                        };
                        scope.model.max = {
                            date: null,
                            time: null
                        };
                        break;
                }

                // returns a boolean to disable the add button if both min and max are not set
                // for timestamps/datetime, we don't care if the time is not set
                scope.disableAdd = function () {
                    return scope.disabled || ((scope.displayType(scope.type) == "datetime") ? ( emptyOrNull(scope.model.min.date) && emptyOrNull(scope.model.max.date) ) : ( emptyOrNull(scope.model.min) && emptyOrNull(scope.model.max) ));
                };

                scope.addRange = function () {
                    var min, max;
                    scope.isDirty = true;
                    // data for timestamp[tz] needs to be formatted properly
                    if (scope.displayType(scope.type) == "datetime") {
                        min = (scope.model.min.date) ? moment(scope.model.min.date + scope.model.min.time, dataFormats.date + dataFormats.time24) : '';
                        max = (scope.model.max.date) ? moment(scope.model.max.date + scope.model.max.time, dataFormats.date + dataFormats.time24) : '';
                        if ((min && max) && max.isBefore(min)) {
                            scope.minMaxForm.$error.improperRange = true;
                            return;
                        } else {
                            scope.minMaxForm.$error.improperRange = false;
                        }
                        if (min) min = min.format(dataFormats.datetime.submission);
                        if (max) max = max.format(dataFormats.datetime.submission);
                        // data for date needs to be formatted properly for a proper comparison
                    } else if (scope.displayType(scope.type) == "date") {
                        min = (scope.model.min) ? moment(scope.model.min, dataFormats.date) : '';
                        max = (scope.model.max) ? moment(scope.model.max, dataFormats.date) : '';
                        if ((min && max) && max.isBefore(min)) {
                            scope.minMaxForm.$error.improperRange = true;
                            return;
                        } else {
                            scope.minMaxForm.$error.improperRange = false;
                        }
                        if (min) min = min.format(dataFormats.date);
                        if (max) max = max.format(dataFormats.date);
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
    }])

    .directive('inputSwitch', ['dataFormats', 'integerLimits', 'maskOptions', 'UriUtils', '$log', function(dataFormats, integerLimits, maskOptions, UriUtils, $log) {
        return {
            restrict: 'E',
            templateUrl:  UriUtils.chaiseDeploymentPath() + 'common/templates/inputs/inputSwitch.html',
            scope: {
                column: '=',
                displayType: '=',
                inputValue: '=?'
            },
            link: function(scope, elem, attr) {
                scope.dataFormats = dataFormats;
                scope.maskOptions = maskOptions;

                scope.int2min = integerLimits.INT_2_MIN;
                scope.int2max = integerLimits.INT_2_MAX;
                scope.int4min = integerLimits.INT_4_MIN;
                scope.int4max = integerLimits.INT_4_MAX;
                scope.int8min = integerLimits.INT_8_MIN;
                scope.int8max = integerLimits.INT_8_MAX;

                scope.booleanValues = ['', true, false];

                if (scope.displayType === "timestamp") {
                    scope.inputValue = {
                        date: null,
                        time: null,
                        meridiem: 'AM'
                    }
                }

                scope.getDisabledInputValue = function () {
                    try {
                        var disabled = scope.column.getInputDisabled("entry/create");
                        if (disabled) {
                            if (typeof disabled === 'object') return disabled.message;
                            return '';
                        } else if (scope.column.isForeignKey) {
                            return 'Select a value';
                        } else if (scope.column.isAsset) {
                            return "No file Selected";
                        }
                    } catch (e) {
                        $log.info(e);
                    }
                }

                // Assigns the current date or timestamp to inputValue
                scope.applyCurrentDatetime = function() {
                    if (scope.displayType === 'timestamp' || scope.displayType === 'timestamptz') {
                        return scope.inputValue = {
                            date: moment().format(dataFormats.date),
                            time: moment().format(dataFormats.time24),
                            meridiem: moment().format('A')
                        }
                    }
                    return scope.inputValue = moment().format(dataFormats.date);
                }

                // Toggle between AM/PM for a time input's model
                scope.toggleMeridiem = function() {
                    // Do the toggling
                    var meridiem = scope.inputValue.meridiem;
                    if (meridiem.charAt(0).toLowerCase() === 'a') {
                        return inputValue.meridiem = 'PM';
                    }
                    return inputValue.meridiem = 'AM';
                }

                scope.blurElement = function(e) {
                    e.currentTarget.blur();
                }

                scope.removeValue = function () {
                    scope.inputValue = null;
                }
            }
        }
    }]);
})();
