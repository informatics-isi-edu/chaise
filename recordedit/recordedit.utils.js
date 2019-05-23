(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .factory('recordEditAppUtils', ['InputUtils', 'UiUtils', '$log', '$rootScope', function (InputUtils, UiUtils, $log, $rootScope) {

        function columnToInputType(column, isDisabled) {
            // asset columns should always use the upload directive
            if (column.isAsset) {
                return 'file';
            } else if (isDisabled) {
                return 'disabled';
            } else if (column.isForeignKey) {
                return 'popup-select';
            } else {
                return UiUtils.getInputType(column.type);
            }
        }

        return {
            columnToInputType: columnToInputType
        };
    }]);

})();
