(function() {
    'use strict';

    angular.module('chaise.inputs', ['chaise.validators', 'chaise.utils'])

    .factory('inputUtils', ['dataFormats', '$rootScope', function(dataFormats, $rootScope) {
        function applyCurrentDatetime(displayType) {
            if (displayType === 'timestamp' || displayType === 'timestamptz') {
                return {
                    date: moment().format(dataFormats.date),
                    time: moment().format(dataFormats.time24),
                    meridiem: moment().format('A')
                }
            }
            return moment().format(dataFormats.date);
        }

        function clearDatetime(columnType) {
            if (columnType === 'timestamp' || columnType === 'timestamptz') {
                return {date: null, time: null, meridiem: 'AM'};
            }
            return null;
        }

        function fileExtensionTypes(column) {
            return column.filenameExtFilter.join(", ");
        }

        function toggleMeridiem(meridiem) {
            // Do the toggling
            if (meridiem.charAt(0).toLowerCase() === 'a') {
                return 'PM';
            }
            return 'AM';
        }

        return {
            applyCurrentDatetime: applyCurrentDatetime,
            clearDatetime: clearDatetime,
            fileExtensionTypes: fileExtensionTypes,
            toggleMeridiem: toggleMeridiem
        };
    }])

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

    .directive('inputSwitch', ['dataFormats', 'inputUtils', 'integerLimits', 'maskOptions', 'modalBox', 'modalUtils', 'UriUtils', '$log', '$rootScope', function(dataFormats, inputUtils, integerLimits, maskOptions, modalBox, modalUtils, UriUtils, $log, $rootScope) {
        return {
            restrict: 'E',
            templateUrl:  UriUtils.chaiseDeploymentPath() + 'common/templates/inputs/inputSwitch.html',
            scope: {
                column: '=',
                columnModel: '=',
                model: '=?'
            },
            link: function(scope, elem, attr) {
                scope.model = {};
                scope.dataFormats = dataFormats;
                scope.maskOptions = maskOptions;
                scope.fileExtensionTypes = inputUtils.fileExtensionTypes;

                scope.int2min = integerLimits.INT_2_MIN;
                scope.int2max = integerLimits.INT_2_MAX;
                scope.int4min = integerLimits.INT_4_MIN;
                scope.int4max = integerLimits.INT_4_MAX;
                scope.int8min = integerLimits.INT_8_MIN;
                scope.int8max = integerLimits.INT_8_MAX;

                scope.booleanValues = ['', true, false];

                if (scope.columnModel.displayType === "timestamp") {
                    scope.model.value = {
                        date: null,
                        time: null,
                        meridiem: 'AM'
                    }
                } else if (scope.columnModel.displayType === "file") {
                    scope.model.value = {};
                }

                scope.getDisabledInputValue = function () {
                    try {
                        var disabled = scope.column.inputDisabled;
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
                scope.applyCurrentDatetime = function () {
                    scope.model.value = inputUtils.applyCurrentDatetime(scope.columnModel.displayType);
                }

                // Toggle between AM/PM for a time input's model
                scope.toggleMeridiem = function() {
                    var value = scope.model.value;
                    value.meridiem = inputUtils.toggleMeridiem(value.meridiem);
                }

                scope.searchPopup = function() {

                    var params = {};

                    params.reference = scope.column.filteredRef(null, null).contextualize.compactSelect;
                    params.reference.session = $rootScope.session;
                    params.context = "compact/select";
                    params.selectedRows = [];
                    params.selectMode = modalBox.singleSelectMode;
                    params.showFaceting = true;
                    params.facetPanelOpen = false;

                    modalUtils.showModal({
                        animation: false,
                        controller: "SearchPopupController",
                        controllerAs: "ctrl",
                        resolve: {
                            params: params
                        },
                        size: "xl",
                        templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/searchPopup.modal.html"
                    }, function dataSelected(tuple) {
                        // tuple - returned from action in modal (should be the foreign key value in the recrodedit reference)

                        scope.columnModel.fkDisplayName = tuple.displayname;
                        scope.model.value = tuple;
                    }, false, false);
                }

                scope.clearForeignKey = function() {
                    scope.model = null;
                    scope.columnModel.fkDisplayName = null;
                }

                scope.blurElement = function(e) {
                    e.currentTarget.blur();
                }

                // Used to remove the value in date and timestamp inputs when the "Clear" button is clicked
                scope.removeValue = function () {
                    if (scope.columnModel.displayType === 'timestamp' || scope.columnModel.displayType === 'timestamptz') {
                        scope.model.value = {date: null, time: null, meridiem: 'AM'};
                    } else {
                        scope.model.value = null;
                    }
                    scope.model.value = inputUtils.
                }
            }
        }
    }]);
})();
