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

        function isDisabled(column, cookie)                                  {
            var disabled = InputUtils.isDisabled(column);
            if (disabled) {
                return true;
            } else if (cookie && Array.isArray(cookie.constraintNames)) {
                return cookie.constraintNames.indexOf(column.name) !== -1;
            }
            return false;
        }

        return {
            columnToInputType: columnToInputType,
            isDisabled: isDisabled
        };
    }]);

})();
