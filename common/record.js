(function() {
    'use strict';

    angular.module('chaise.record.display', ['chaise.record.table', 'chaise.utils'])

        /**
         * Directive <record-display> is called to display related table as part of entity layout.
         * These items will be passed to <record-table> diretive for table display.
         * @example  <record-display columns-models="::columnModels" values="::recordValues"
         *        toggle-related-table-display-type='ctrl.toggleDisplayMode(dataModel)' can-edit-related="::ctrl.canEditRelated(ref)"
         *        can-create-related="::ctrl.canCreateRelated(ref)" add-related-record="ctrl.addRelatedRecord(ref)" to-record-set="ctrl.toRecordSet(ref)">
         *        </record-display>
         * @param {array} columnModels : Array with column models
         * @param {array} values: Array with column values
         * @param {callback} toggleInlineDisplayMode: function to determine object display type
         */
        .directive('recordDisplay', ['DataUtils', 'messageMap', 'UriUtils', function(DataUtils, messageMap, UriUtils) {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    // objects
                    columnModels: '=',
                    values: '=',
                    // functions
                    addRelatedRecord: '&',
                    canCreateRelated: '&',
                    canDeleteRelated: '&',
                    canEditRelated: '&',
                    deleteRelatedRecord: '&',
                    toggleInlineDisplayMode: '&',
                    toRecordSet: '&',
                    // boolean
                    showEmptyRelatedTables: '='
                },
                templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/record.html',
                link: function(scope, elem, attr){
                    scope.queryTimeoutTooltip = messageMap.queryTimeoutTooltip;
                    scope.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

                    function isInline (idx) {
                        return scope.columnModels[idx].isInline;
                    };

                    // Show an error warning if the column is aggregate or inline related table and the data failed to load
                    scope.showError = function (i) {
                        return (isInline(i) && scope.columnModels[i].tableModel.tableError) || scope.columnModels[i].columnError;
                    }

                    // Show a loading spinner if the column is aggregate or inline related table and we're waiting for data
                    scope.showLoader = function (i) {
                        return (isInline(i) && !scope.columnModels[i].tableModel.hasLoaded) || scope.columnModels[i].isLoading;
                    }

                    // returns true if we should show the column value (as oppose to not showing or showing an inline table)
                    // column is not inline and value is not null or it is a secondary request (has wait for or it's not unique)
                    scope.showColumn = function (i) {
                        return !isInline(i) && (scope.values[i].value != null || scope.columnModels[i].hasWaitForOrNotUnique);
                    };

                    // returns true if we should show a table (data is non-empty or we can show empty)
                    // we don't need to make sure it's initialized here since we want to show the loader
                    scope.showInlineTable = function (i) {
                        var cm = scope.columnModels[i];
                        return isInline(i) && (scope.showEmptyRelatedTables || (cm.tableModel.page && cm.tableModel.page.length > 0 && cm.tableMarkdownContentInitialized));
                    };

                    // returns true if inline related tables can be displayed as custom display (markdown)
                    scope.allowInlineTableMarkdown = function (i) {
                        var cm = scope.columnModels[i];
                        return cm.tableModel.reference.display.type == 'markdown' && cm.tableModel.page && cm.tableMarkdownContentInitialized && cm.tableMarkdownContent != '';
                    };
                }
            };
        }])

         // displays action bar on top right corner. For non-table display, contents wrap around the action bar.
         // For table display, it appears above the top right corner.
        .directive('recordActionBar', ['UriUtils', function(UriUtils) {
            return {
                restrict: 'E',
                scope: {
                    // functions
                    addRelatedRecord: '&', // add a record with RE app or P&B popup
                    deleteRelatedRecord: '&', // unlink a record with the P&B popup
                    toggleDisplayMode: '&', // toggles the display mode of the RT
                    toRecordset: '&', // redirects the current page to recordset
                    // booleans
                    canCreate: '=',
                    canDelete: '=',
                    canEdit: '=',
                    isInline: "=",
                    isTableDisplay: '=', // is the table in table display mode or other custom mode ('markdown' display)
                    showToggleDisplayBtn: "=",
                    // strings
                    baseTableName: '=',
                    displayname: '='
                },
                templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/recordAction.html',
                controller: "RecordActionController",
                controllerAs: "ctrl"
            };
        }])

        .controller('RecordActionController', ['DataUtils', '$scope', function RecordActionController(DataUtils, $scope) {
            var displayname = $scope.displayname.value,
                tablename = $scope.baseTableName.value;

            if ($scope.displayname.isHTML) displayname = DataUtils.makeSafeHTML($scope.displayname.value);
            if ($scope.baseTableName.isHTML) tablename = DataUtils.makeSafeHTML($scope.baseTableName.value);

            $scope.tooltip = {
                createButton: "Connect " + displayname + " records to this " + tablename + ".",
                deleteButton: "Disconnect " + displayname + " records from this " + tablename + ".",
                exploreButton: "Explore more " + displayname + " records related to this " + tablename + "."
            };

            if ($scope.canEdit) {
                $scope.tooltip.tableModeButton = "Display edit controls for " + displayname + " related to this " + tablename + ".";
            } else {
                $scope.tooltip.tableModeButton = "Display related " + displayname + " in tabular mode.";
            }
        }]);
})();
