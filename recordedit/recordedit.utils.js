(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .factory('recordEditAppUtils', ['InputUtils', 'UiUtils', '$log', '$rootScope', function (InputUtils, UiUtils, $log, $rootScope) {

        function columnToInputType(column, isDisabled) {
            if (isDisabled) {
                return 'disabled';
            } else if (column.isForeignKey) {
                return 'popup-select';
            } else if (column.isAsset) {
                return 'file';
            } else {
                return UiUtils.getInputType(column.type);
            }
        }

        return {
            columnToInputType: columnToInputType
        };
    }]);

})();
