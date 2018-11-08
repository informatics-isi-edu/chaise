(function() {
    'use strict';

    angular.module('chaise.inputs', ['chaise.validators', 'chaise.utils'])

    .constant("dataFormats", {
        date: "YYYY-MM-DD",
        time12: "hh:mm:ss", // used for displaying values in recordedit properly
        time24: "HH:mm:ss",
        datetime:  {
            display: "YYYY-MM-DD HH:mm:ss",
            displayZ: "YYYY-MM-DD HH:mm:ssZ",
            return: "YYYY-MM-DDTHH:mm:ssZ", // the format that the database returns when there are no fractional seconds to show
            submission: "YYYY-MM-DDTHH:mm:ss.SSSZ"
        }
    })

    // Specifies the regexes to be used for a token in a ui-mask input. For example, the '1' key in
    // in vm.maskOptions.date means that only 0 or 1 is allowed wherever the '1' key is used in a ui-mask template.
    // See the maskDefinitions section for more info: https://github.com/angular-ui/ui-mask.
    .constant("maskOptions", {
        date: {
            mask: "2999-19-39",
            options: {
                maskDefinitions: {'1': /[0-1]/, '2': /[0-2]/, '3': /[0-3]/},
                clearOnBlur: true
            }
        },
        time: {
            mask: "19:59:59",
            options: {
                maskDefinitions: {'1': /[0-1]/, '2': /[0-2]/, '5': /[0-5]/},
                clearOnBlur: true
            }
        }
    })

    .constant("integerLimits", {
        INT_2_MIN: -32768,
        INT_2_MAX: 32767,
        INT_4_MIN: -2147483648,
        INT_4_MAX: 2147483647,
        INT_8_MIN: -9223372036854775808,
        INT_8_MAX: 9223372036854775807
    })

    .factory('InputUtils', ['dataFormats', '$rootScope', function(dataFormats, $rootScope) {
        var booleanValues = ['', true, false];

        /* Functions for all input types */
        // determines if input should be disabled based on ermrestJS API
        function isDisabled(column) {
            return column.inputDisabled ? true : false;
        }

        function getDisabledInputValue(column) {
            var disabled = column.inputDisabled;
            if (disabled) {
                if (typeof disabled === 'object') return disabled.message;
                return '';
            } else if (column.isForeignKey) {
                return 'Select a value';
            } else if (column.isAsset) {
                return "No file Selected";
            }
        }

        /* numeric specific functions */
        function formatInt(value) {
            var intVal = parseInt(value, 10);
            return !isNaN(intVal) ? intVal : null;
        }

        function formatFloat(value) {
            var floatVal = parseFloat(value);
            return !isNaN(floatVal) ? floatVal : null;
        }

        /* Datetime specific functions */
        // Assigns the current date or timestamp to a column's model
        function applyCurrentDatetime(inputType) {
            if (inputType === 'timestamp' || inputType === 'timestamptz') {
                return {
                    date: moment().format(dataFormats.date),
                    time: moment().format(dataFormats.time24),
                    meridiem: moment().format('A')
                }
            }
            return moment().format(dataFormats.date);
        }

        // resets timestamp[tz] values and sets the rest to null
        function clearDatetime(columnType) {
            if (columnType === 'timestamp' || columnType === 'timestamptz') {
                return {date: null, time: null, meridiem: 'AM'};
            }
            return null;
        }

        // Toggle between AM/PM for a time input's model
        function toggleMeridiem(meridiem) {
            if (meridiem.charAt(0).toLowerCase() === 'a') {
                return 'PM';
            }
            return 'AM';
        }

        // value should be in string format or undefined
        //   - undefined means to set datetime as null or empty object
        // options include the following:
        //   - outputType - the expected output type, "string" || "object" (required)
        //   - currentMomentFormat - the current format the string is in (optional)
        //   - outputMomentFormat - the output format the string should be in (optional)
        function formatDatetime(value, options) {
            if (value) {
                // create a moment object (value should be string format)
                var momentObj = options.currentMomentFormat ? moment(value, options.currentMomentFormat) : moment(value);
                if (options.outputType == "object") {
                    return {
                        date: momentObj.format(dataFormats.date),
                        time: momentObj.format(dataFormats.time12),
                        meridiem: momentObj.format('A')
                    };
                } else if (options.outputType == "string") {
                    return momentObj.format(options.outputMomentFormat);
                }
            } else {
                if (options.outputType == "object") {
                    // there is no value and we want an object
                    return {
                        date: null,
                        time: null,
                        meridiem: 'AM'
                    };
                } else {
                    return null;
                }
            }
        }

        /* File specific functions */
        function fileExtensionTypes(column) {
            return column.filenameExtFilter.join(", ");
        }

        // value should be in string format or undefined
        //   - undefined means set to null
        // outputType - the expected output type, "string" || "object"
        function formatFile(value, outputType) {
            // value should ALWAYS be a string for file inputs
            if (value) {
                if (outputType == "object") {
                    return { url: value }
                } else if (outputType == "string") {
                    return value;
                }
            } else {
                if (outputType == "object") {
                    // there is no value and we want an object
                    return { url: "" };
                } else {
                    return null;
                }
            }
        }

        /* Foregin Key specific functions */
        // Given an $event, this will blur or removes the focus from the element that triggerd the event
        function blurElement(e) {
            e.currentTarget.blur();
        }

        return {
            applyCurrentDatetime: applyCurrentDatetime,
            blurElement: blurElement,
            booleanValues: booleanValues,
            clearDatetime: clearDatetime,
            fileExtensionTypes: fileExtensionTypes,
            formatDatetime: formatDatetime,
            formatFile: formatFile,
            formatFloat: formatFloat,
            formatInt: formatInt,
            getDisabledInputValue: getDisabledInputValue,
            isDisabled: isDisabled,
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
                scope.columnToInputType = function (colType) {
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
                            relativeType = (colType.baseType) ? scope.columnToInputType(colType.baseType) : "number";
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
                    return scope.disabled || ((scope.columnToInputType(scope.type) == "datetime") ? ( emptyOrNull(scope.model.min.date) && emptyOrNull(scope.model.max.date) ) : ( emptyOrNull(scope.model.min) && emptyOrNull(scope.model.max) ));
                };

                scope.addRange = function () {
                    var min, max;
                    scope.isDirty = true;
                    // data for timestamp[tz] needs to be formatted properly
                    if (scope.columnToInputType(scope.type) == "datetime") {
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
                    } else if (scope.columnToInputType(scope.type) == "date") {
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
                    } else if (scope.columnToInputType(scope.type) == "number") {
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
                if (scope.columnToInputType(scope.type) == "datetime") {
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

    .directive('inputSwitch', ['dataFormats', 'InputUtils', 'integerLimits', 'maskOptions', 'modalBox', 'modalUtils', 'UriUtils', '$log', '$rootScope', function(dataFormats, InputUtils, integerLimits, maskOptions, modalBox, modalUtils, UriUtils, $log, $rootScope) {
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
                scope.blurElement = InputUtils.blurElement;
                scope.booleanValues = InputUtils.booleanValues;
                scope.dataFormats = dataFormats;
                scope.fileExtensionTypes = InputUtils.fileExtensionTypes;
                scope.maskOptions = maskOptions;

                scope.int2min = integerLimits.INT_2_MIN;
                scope.int2max = integerLimits.INT_2_MAX;
                scope.int4min = integerLimits.INT_4_MIN;
                scope.int4max = integerLimits.INT_4_MAX;
                scope.int8min = integerLimits.INT_8_MIN;
                scope.int8max = integerLimits.INT_8_MAX;

                // initialize value for different input types
                if (scope.columnModel.inputType === "timestamp") {
                    scope.model.value = {
                        date: null,
                        time: null,
                        meridiem: 'AM'
                    }
                } else if (scope.columnModel.inputType === "file") {
                    scope.model.value = {};
                }

                scope.getDisabledInputValue = function () {
                    return InputUtils.getDisabledInputValue(scope.column);
                }

                // Assigns the current date or timestamp to inputValue
                scope.applyCurrentDatetime = function () {
                    scope.model.value = InputUtils.applyCurrentDatetime(scope.columnModel.inputType);
                }

                // Toggle between AM/PM for a time input's model
                scope.toggleMeridiem = function() {
                    var value = scope.model.value;
                    value.meridiem = InputUtils.toggleMeridiem(value.meridiem);
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

                // Used to remove the value in date and timestamp inputs when the "Clear" button is clicked
                scope.clearDatetime = function () {
                    scope.model.value = InputUtils.clearDatetime(scope.columnModel.inputType);
                }
            }
        }
    }]);
})();
