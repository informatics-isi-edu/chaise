(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .factory('recordEditAppUtils', ['InputUtils', 'UiUtils', 'logService', function (InputUtils, UiUtils, logService) {

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

        function createColumnModel(column) {
            var isDisabled = InputUtils.isDisabled(column);
            var stackNode = logService.getStackNode(
                column.isForeignKey ? logService.logStackTypes.FOREIGN_KEY : logService.logStackTypes.COLUMN,
                column.table,
                {source: column.compressedDataSource, entity: column.isForeignKey}
            );
            var stackPath = column.isForeignKey ? logService.logStackPaths.FOREIGN_KEY : logService.logStackPaths.COLUMN;

            return {
                allInput: null,
                column: column,
                isDisabled: isDisabled,
                inputType: columnToInputType(column, isDisabled),
                highlightRow: false,
                showSelectAll: false,
                logStack: logService.getStackObject(stackNode),
                logStackPath: logService.getStackPath("", stackPath)
            };
        }

        return {
            createColumnModel: createColumnModel
        };
    }]);

})();
