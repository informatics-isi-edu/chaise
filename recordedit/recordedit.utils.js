(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .factory('recordEditAppUtils', ['InputUtils', 'UiUtils', '$log', '$rootScope', function (InputUtils, UiUtils, $log, $rootScope) {

        function columnToInputType(column, prefillCookie) {
            if (isDisabled(column, prefillCookie)) {
                return 'disabled';
            } else if (column.isForeignKey) {
                return 'popup-select';
            } else if (column.isAsset) {
                return 'file';
            } else {
                return UiUtils.getInputType(column.type);
            }
        }

        function isDisabled(column, cookie) {
            var disabled = InputUtils.isDisabled(column);
            if (disabled) {
                return true;
            } else if (cookie) {
                return cookie.constraintName == column.name;
            }
            return false;
        }

        return {
            columnToInputType: columnToInputType,
            isDisabled: isDisabled
        };
    }]);

})();
