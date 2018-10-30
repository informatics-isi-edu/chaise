(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .factory('recordEditAppUtils', ['dataFormats', 'UiUtils', '$log', '$rootScope', function (dataFormats, UiUtils, $log, $rootScope) {
        function columnToDisplayType(column, prefillCookie) {
            var displayType;

            if (isDisabled(column, prefillCookie)) {
                return 'disabled';
            } else if (column.isForeignKey) {
                return 'popup-select';
            } else if (column.isAsset) {
                return 'file';
            } else {
                return UiUtils.getDisplayType(column.type);
            }
        }

        // used as placeholder text
        function getDisabledInputValue(column, value) {
            try {
                var disabled = column.inputDisabled;
                if (isDisabled(column)) {
                    if (typeof disabled === 'object') {
                        return disabled.message;
                    } else if ($rootScope.context.mode == $rootScope.context.modes.EDIT) {
                        return value;
                    }
                    return '';
                } else if (column.isForeignKey) {
                    return 'Select a value';
                } else if (column.isAsset) {
                    return "No file Selected";
                }
            } catch (e) {
                $log.info(e);
            }
        }

        function isDisabled(column, prefillCookie) {
            try {
                if (column.inputDisabled) {
                    return true;
                } else if (prefillCookie) {
                    return prefillCookie.constraintName == column.name;
                }
                return false;
            } catch (e) {
                $log.info(e);
            }
        }

        return {
            columnToDisplayType: columnToDisplayType,
            getDisabledInputValue: getDisabledInputValue,
            isDisabled: isDisabled
        };
    }]);

})();
