(function() {
    'use strict';

    angular.module('chaise.inputs', ['chaise.validators', 'chaise.utils'])

    .factory('InputUtils', ['dataFormats', 'defaultDisplayname', '$rootScope', function(dataFormats, defaultDisplayname, $rootScope) {
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

        /* boolean specific function */
        var defaultBooleanValues = [true, false];

        // checks for preformat config before returning true/false
        function formatBoolean(column, value) {
            return column.formatvalue(value);
        }

        function unformatBoolean(columnModel, value) {
            return columnModel.booleanMap[value];
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
        //   - outputMomentFormat - the output format the string should be in (required if `string` is defined for outputType)
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
            if (column && Array.isArray(column.filenameExtFilter)) {
                return column.filenameExtFilter.join(", ");
            }
            return "";
        }

        /* Foregin Key specific functions */
        // Given an $event, this will blur or removes the focus from the element that triggerd the event
        function blurElement(e) {
            e.currentTarget.blur();
        }

        return {
            applyCurrentDatetime: applyCurrentDatetime,
            blurElement: blurElement,
            defaultBooleanValues: defaultBooleanValues,
            clearDatetime: clearDatetime,
            fileExtensionTypes: fileExtensionTypes,
            formatBoolean: formatBoolean,
            unformatBoolean: unformatBoolean,
            formatDatetime: formatDatetime,
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

    /**
     * NOTE: this directive uses spectrum library which uses jQuery
     */
    .directive('colorPicker',[function () {
        return {
            require: '?ngModel',
            scope: {
                toggleCallback: "=?",
                isRequired: "="
            },
            link: function (scope, elem, attrs, ngModel) {
                if (!ngModel) return;

                // create the spectrum color picker
                elem.spectrum({
                    containerClassName: 'chaise-color-picker-popup',
                    showAlpha: false,
                    showPalette: false,
                    showInitial: true,
                    showInput: true,
                    allowEmpty: (scope.isRequired !== true)
                });

                // when the model changed, change the input
                ngModel.$render = function () {
                    elem.spectrum('set', ngModel.$viewValue);
                };

                // keep it updated on change
                elem.on('change', function () {
                    scope.$apply(function () {
                        var val = null;
                        try {
                            val = elem.spectrum("get").toHexString();
                        } catch(exp) {
                            // if the value is empty (null), it might throw an error
                            // fail silently and use null
                        }

                        elem.spectrum("set", val);
                        ngModel.$setViewValue(val);
                    });
                });

                var togglePopup = function ($event) {
                    elem.spectrum("toggle");
                    $event.preventDefault();
                    $event.stopPropagation();
                    return false;
                }

                // clicking on the color should open the picker
                elem.prev().on('click', togglePopup);

                scope.toggleCallback = togglePopup;
            }
        }
    }])

    /**
     * This directive can be used to display an appropriate input element based on the given columnModel in a form.
     * Based on the passed values, it can be used in two different modes:
     *  - standalone: As an standalone input element (used in select-all feature in recordedit).
     *  - form: As a normal input in a form
     * The mode is determined by the directive itself based on the given attributes.
     * If you pass parentModel and parentReference, it will assume that you want the form mode, otherwise it will be in standalone mode.
     * The only noticable difference is just how the scope.model value works (especially in the case of foreignkey inputs).
     * In standalone mode,
     *  - the initial value of scope.model for foreignkeys is ignored.
     *  - the value of scope.model for foreignkeys is a "tuple" (instead of rowname).
     *  - since we don't have access to the parentModel, there must be a translation layer to properly set the value of foreignkey columns.
     */
    .directive('inputSwitch', ['ConfigUtils', 'dataFormats', 'DataUtils', 'InputUtils', 'integerLimits', 'logService', 'maskOptions', 'modalBox', 'modalUtils', 'recordCreate', 'recordsetDisplayModes', 'UriUtils', '$log', '$rootScope',
                function(ConfigUtils, dataFormats, DataUtils, InputUtils, integerLimits, logService, maskOptions, modalBox, modalUtils, recordCreate, recordsetDisplayModes, UriUtils, $log, $rootScope) {

        /**
         * We have multiple ways to determine a disabled input, or rather, when an input should be shown as disabled
         *   1. the input should not be file (the upload directive handls showing proper disabled input for those)
         *   2. If the column must be disabled based on acl or annotation
         * NOTE: in recordedit if select-all is open the column is also marked as disabled but not here
         */
        function _populateInputTypeOrDisabled(vm) {
            if (vm.columnModel.inputType === "file") {
                return vm.columnModel.inputType;
            }

            if (vm.isDisabled) {
                return 'disabled';
            }

            return vm.columnModel.inputType
        }

        /**
         * - column is marked as disabled by annotation
         * - in edit mode and column in the row is marked as disabled by acl
         * NOTE: in recordedit there's also `we're showing the select-all control` case but not here
         */
        function _populateIsDisabled (vm) {
            if (vm.columnModel.isDisabled) return true;

            if (vm.mode === "edit" && vm.hasParentModel && vm.parentModel.canUpdateRows) {
                var canUpdateRow = vm.parentModel.canUpdateRows[vm.rowIndex];
                if (canUpdateRow && !canUpdateRow[vm.columnModel.column.name]) {
                    return true;
                }
            }

            return false;
        }

        return {
            restrict: 'E',
            templateUrl:  UriUtils.chaiseDeploymentPath() + 'common/templates/inputs/inputSwitch.html',
            scope: {
                column: '=',
                columnIndex: '=', // index in column models list
                rowIndex: "=?",
                columnModel: '=',
                model: "=",
                mode: "@",
                inputContainer: "=?",
                formContainer: "=?",
                isRequired: "=?", // we cannot derive this from the columnModel (for select-all none of the inputs are required)
                parentModel: "=?",
                parentReference: "=?",
                parentTuples: "=?",
                onSearchPopupValueChange: "&?", // callback that will fire when the search popup value changes
                searchPopupGetDisabledTuples: "&?" // callback that will be used to generate the list of disabled tuples in search popup
            },
            controllerAs: 'vm',
            controller: function () {},
            bindToController: true,
            link: function(scope, elem, attr, vm) {

                // TODO does this make sense?
                if (typeof vm.rowIndex !== "integer") {
                    vm.rowIndex = 0;
                }

                if (typeof vm.isRequired !== "boolean") {
                    vm.isRequired = false;
                }

                if (typeof vm.inputContainer !== "object") {
                    vm.inputContainer = {};
                }

                if (typeof vm.formContainer !== "object") {
                    vm.formContainer = vm.inputContainer;
                }

                // TODO in select-all implementation, we're doing things differently,
                // we're doing a post process after the apply-all is selected, this boolean flag
                // will signal whether we're doings things in place or is this part of a bigger form.
                vm.hasParentModel = false;
                if (typeof vm.parentModel === "object" && typeof vm.parentReference === "object") {
                    vm.hasParentModel = true;
                    vm.parentLogStack = vm.parentModel.logStack;
                    vm.parentLogStackPath = vm.parentModel.parentLogStackPath;
                }

                vm.isDisabled = _populateIsDisabled(vm);
                vm.inputTypeOrDisabled = _populateInputTypeOrDisabled(vm);

                vm.customErrorMessage = null;
                vm.blurElement = InputUtils.blurElement;
                vm.defaultBooleanValues = InputUtils.defaultBooleanValues;
                vm.dataFormats = dataFormats;
                vm.fileExtensionTypes = InputUtils.fileExtensionTypes;
                vm.maskOptions = maskOptions;

                vm.int2min = integerLimits.INT_2_MIN;
                vm.int2max = integerLimits.INT_2_MAX;
                vm.int4min = integerLimits.INT_4_MIN;
                vm.int4max = integerLimits.INT_4_MAX;
                vm.int8min = integerLimits.INT_8_MIN;
                vm.int8max = integerLimits.INT_8_MAX;

                // initialize value for different input types
                if (vm.columnModel.inputType === "timestamp" && !DataUtils.isObjectAndNotNull(vm.model)) {
                    vm.model = {
                        date: null,
                        time: null,
                        meridiem: 'AM'
                    }
                } else if (vm.columnModel.inputType === "file" && !DataUtils.isObjectAndNotNull(vm.model)) {
                    vm.model = {};
                }

                vm.getDisabledInputValue = function () {
                    return InputUtils.getDisabledInputValue(vm.column);
                }

                // Assigns the current date or timestamp to inputValue
                vm.applyCurrentDatetime = function () {
                    vm.model = InputUtils.applyCurrentDatetime(vm.columnModel.inputType);
                }

                // Toggle between AM/PM for a time input's model
                vm.toggleMeridiem = function() {
                    var value = vm.model;
                    value.meridiem = InputUtils.toggleMeridiem(value.meridiem);
                }

                vm.searchPopup = function() {
                    var context = ConfigUtils.getContextJSON();
                    var mode = vm.mode ? vm.mode : context.mode;

                    var originalTuple = null, editOrCopy = false;

                    // parentTuples is only defined in edit/copy
                    if (vm.parentTuples) {
                        editOrCopy = true;
                        if (!Array.isArray(vm.parentTuples)) {
                            originalTuple = vm.parentTuples;
                        } else {
                            var i = vm.rowIndex;
                            // TODO needs to be refactored
                            // context.modes is only defined in recordedit but should be in utils
                            if (vm.mode === "copy") {
                                i = 0;
                            }
                            originalTuple = vm.parentTuples[i];
                        }
                    }

                    // used for filteredRef (to support domain-fitler-pattern)
                    // TODO: domain-filter pattern support does not work for set all input
                    // TODO: we need to pass the parent models in recordedit as well
                    var  submissionRow = {}, rowForeignKeyData = {};
                    if (vm.hasParentModel) {
                        rowForeignKeyData = vm.parentModel.foreignKeyData[vm.rowIndex];
                        submissionRow = recordCreate.populateSubmissionRow(
                            vm.parentModel.rows[vm.rowIndex],
                            vm.parentModel.submissionRows[vm.rowIndex],
                            vm.parentReference,
                            originalTuple,
                            editOrCopy
                        );
                    }

                    var params = {};

                    // used for title
                    params.parentReference = vm.parentReference;
                    params.parentTuple = originalTuple;
                    params.displayname = vm.column.displayname;

                    // TODO needs to be refactored
                    // context.modes is only defined in recordedit but should be in utils
                    if (vm.mode === "edit") {
                        params.displayMode = recordsetDisplayModes.foreignKeyPopupEdit;
                    } else {
                        params.displayMode = recordsetDisplayModes.foreignKeyPopupCreate;
                    }

                    var andFilters = [];
                    // loop through all columns that make up the key information for the association with the leaf table and create non-null filters
                    vm.column.foreignKey.key.colset.columns.forEach(function (col) {
                        andFilters.push({
                            "source": col.name,
                            "hidden": true,
                            "not_null": true
                        });
                    });

                    // add not null filters for key information
                    params.reference = vm.column.filteredRef(submissionRow, rowForeignKeyData).addFacets(andFilters).contextualize.compactSelectForeignKey;
                    params.selectedRows = [];
                    params.selectMode = modalBox.singleSelectMode;
                    params.showFaceting = true;

                    if (vm.searchPopupGetDisabledTuples) {
                        params.getDisabledTuples = vm.searchPopupGetDisabledTuples()(vm.columnModel);
                    }

                    // log attributes
                    // TODO should eventually be moved outside this function and directly under link
                    //      if we want to do more logs for other column types as well
                    params.logStack = recordCreate.getColumnModelLogStack(vm.columnModel, vm.parentModel);
                    params.logStackPath = logService.getStackPath(vm.parentLogStackPath, logService.logStackPaths.FOREIGN_KEY_POPUP);

                    modalUtils.showModal({
                        animation: false,
                        controller: "SearchPopupController",
                        windowClass: "search-popup foreignkey-popup",
                        controllerAs: "ctrl",
                        resolve: {
                            params: params
                        },
                        size: modalUtils.getSearchPopupSize(params),
                        templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/searchPopup.modal.html"
                    }, function dataSelected(tuple) {
                        // tuple - returned from action in modal (should be the foreign key value in the recrodedit reference)


                        // in select-all we're not changing the parent model directly here
                        if (!vm.hasParentModel) {
                            vm.fkValue = tuple.displayname.value;
                            vm.model = tuple;
                            return;
                        }

                        // udpate the foreign key data
                        vm.parentModel.foreignKeyData[vm.rowIndex][vm.column.foreignKey.name] = tuple.data;

                        // TODO should be refactored
                        // make sure the spinner is not showing
                        if ($rootScope.showColumnSpinner[vm.rowIndex] && $rootScope.showColumnSpinner[vm.rowIndex][vm.column.name]) {
                            $rootScope.showColumnSpinner[vm.rowIndex][vm.column.name] = false;
                        }

                        var foreignKeyColumns = vm.column.foreignKey.colset.columns;
                        for (var i = 0; i < foreignKeyColumns.length; i++) {
                            var referenceCol = foreignKeyColumns[i];
                            var foreignTableCol = vm.column.foreignKey.mapping.get(referenceCol);

                            vm.parentModel.submissionRows[vm.rowIndex][referenceCol.name] = tuple.data[foreignTableCol.name];
                        }

                        vm.parentModel.rows[vm.rowIndex][vm.column.name] = tuple.displayname.value;
                        vm.model = tuple.displayname.value;
                        if (typeof vm.onSearchPopupValueChange === 'function') {
                            var res = vm.onSearchPopupValueChange()(vm.columnModel, tuple);
                            if (res.error) {
                                vm.inputContainer.$error.customError = res.message;
                                vm.customErrorMessage = res.message;
                            } else {
                                delete vm.inputContainer.$error.customError;
                                vm.customErrorMessage = "";
                            }
                        }
                    }, false, false);
                }

                vm.showRemove = function () {
                    return vm.model || (vm.inputContainer.$invalid && !vm.inputContainer.$error.required);
                }

                vm.showBooleanRemove = function () {
                    return vm.model !== null || (vm.inputContainer.$invalid && !vm.inputContainer.$error.required);
                }

                // used for timestamp[tz] inputs only
                vm.showDateRemove = function () {
                    return (vm.model && vm.model.date) || vm.inputContainer.$error.date;
                }

                // used for timestamp[tz] inputs only
                vm.showTimeRemove = function () {
                    return (vm.model.value && vm.model.value.time) || vm.inputContainer.$error.time;
                }

                vm.clearInput = function (model) {
                    delete vm.inputContainer.$error.customError;
                    vm.customErrorMessage = "";
                    vm.model = null;
                }

                // used for foriegn key inputs only
                vm.clearForeignKey = function() {
                    delete vm.inputContainer.$error.customError;
                    vm.customErrorMessage = "";
                    vm.model = null;
                    vm.fkValue = null;
                }

                // Used to remove the value in timestamp inputs when the "Clear" button is clicked
                vm.clearDatetime = function () {
                    delete vm.inputContainer.$error.customError;
                    vm.customErrorMessage = "";
                    vm.model = InputUtils.clearDatetime(vm.columnModel.inputType);
                }

                // used for timestamp[tz] inputs only
                vm.clearDate = function () {
                    delete vm.inputContainer.$error.customError;
                    vm.customErrorMessage = "";
                    vm.model.date = null;
                }

                // used for timestamp[tz] inputs only
                vm.clearTime = function () {
                    delete vm.inputContainer.$error.customError;
                    vm.customErrorMessage = "";
                    vm.model.time = null;
                }

                vm.inputContainerForDropdowns = document.querySelector('.input-container');

                // used to increase the width of boolean dropdowns to the size of the input
                vm.setDropdownWidth = function () {
                    var inputSelector = vm.columnIndex + '-boolean-input',
                        input = document.getElementById(inputSelector);

                    // ng-style attached to dropdown for better repositioning
                    vm.inputWidth = {
                        width: input.offsetWidth + 'px',
                        "margin-top": '14px'
                    };
                }

                // just a placeholder to make sure this is defined
                // this function will be defiend by color-picker directive
                vm.toggleColorPicker = function () {}
            }
        }
    }]);
})();
