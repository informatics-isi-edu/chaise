(function() {
    'use strict';

    angular.module('chaise.record.display', ['chaise.record.table', 'chaise.utils'])

        .filter('trustedHTML', ['$sce', function($sce) {
            return function(text) {
                return $sce.trustAsHtml(text);
            };
        }])
        /**
         * Directive <record-display> is called to display related table as part of entity layout.
         * These items will be passed to <record-table> diretive for table display.
         * @example  <record-display columns-models="::columnModels" values="::recordValues"
         *        toggle-related-table-display-type='ctrl.toggleRelatedTableDisplayType(dataModel)' can-edit-related="::ctrl.canEditRelated(ref)"
         *        can-create-related="::ctrl.canCreateRelated(ref)" add-related-record="ctrl.addRelatedRecord(ref)" to-record-set="ctrl.toRecordSet(ref)">
         *        </record-display>
         * @param {array} columnModels : Array with column models
         * @param {array} values: Array with column values
         * @param {callback} toggleRelatedTableDisplayType: function to determine object display type
         */
        .directive('recordDisplay', ['DataUtils','$timeout', 'UriUtils', function(DataUtils, $timeout, UriUtils) {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    columnModels: '=',
                    values: '=',
                    toggleRelatedTableDisplayType: '&',
                    canEditRelated: '&',
                    canCreateRelated: '&',
                    addRelatedRecord: '&',
                    toRecordSet: '&',
                    showEmptyRelatedTables: '='
                },
                templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/record.html',
                controller: function($scope) {
                    $scope.makeSafeIdAttr = DataUtils.makeSafeIdAttr;
                },
                link: function(scope){
                    // set the display type value to false so the 'Edit |' text doesn't appear
                    // we only watch for the value 'markdown' to show 'Edit |'
                    scope.actionBarDisplayType = function (i) {
                        var tm = scope.columnModels[i].tableModel;
                        return !tm.tableError ? tm.reference.display.type : false;
                    };

                    scope.isInline = function (i) {
                        return scope.columnModels[i].isInline;
                    };

                    scope.isAggregate = function (i) {
                        return scope.columnModels[i].isAggregate;
                    };

                    // Show an error warning if the column is aggregate or inline related table and the data failed to load
                    scope.showError = function (i) {
                        return ((scope.isInline(i) && scope.columnModels[i].tableModel.tableError) || (scope.isAggregate(i)&& scope.columnModels[i].hasError));
                    }

                    // Show a loading spinner if the column is aggregate or inline related table
                    scope.showLoader = function (i) {
                        return ((scope.isInline(i) && scope.columnModels[i].tableModel.isLoading) || (scope.isAggregate(i) && scope.columnModels[i].isLoading));
                    }

                    // returns true if we should show the column
                    scope.showColumn = function (i) {
                        return ((typeof scope.values[i].value === "string" && scope.values[i].value !== '') && !scope.isInline(i)) || scope.isAggregate(i);
                    };

                    // returns true if we should show a table
                    scope.showInlineTable = function (i) {
                        return scope.isInline(i) && (scope.showEmptyRelatedTables || scope.columnModels[i].tableModel.rowValues.length > 0);
                    };
                }
            };
        }])
        /**
        * <record-action-bar></record-action-bar> displays action bar on top right corner. For non-table display contents wrap around the action bar.
        * While for the table display it appears on the top right corner.
        * @example: <record-action-bar related-table-ref-display="tableModel.reference.display.type" tab-model-display="tableModel.displayType"
        *        toggle-related-table-display-type='toggleRelatedTableDisplayType({dataModel:tableModel})' can-edit-related="canEditRelated({ref:relatedReferenceDisplayTable[$index]})"
        *        can-create-related="canCreateRelated0({ref:tableModel.reference})"
        *        add-related-record="addRelatedRecord({ref:tableModel.reference})" to-record-set="toRecordSet({ref:tableModel.reference})"
        *        displayname="tableModel.reference.displayname" base-table-name="tableModel.baseTableName">
        *        </record-action-bar>
        * @param {string} relatedTableRefDisplay: Related table ref. display type
        * @param {string} tabModelDisplay: Display type of individual model
        * @param {callback} canEditRelated: function to check canEdit()
        * @param {callback} canCreateRelated: function to check canCreate()
        * @param {callback} addRelatedRecord: function to check add feature
        * @param {callback} toRecordSet:view more record function
        * @param {string} displayname: Display name of related table
        * @param {string} baseTableName: Display name of base table
        */
        .directive('recordActionBar', ['UriUtils', function(UriUtils) {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    relatedTableRefDisplay: '=',
                    tabModelDisplay: '=',
                    toggleRelatedTableDisplayType: '&',
                    canEditRelated: '&',
                    canCreateRelated: '&',
                    addRelatedRecord: '&',
                    toRecordSet: '&',
                    displayname: '=',
                    baseTableName: '='
                },
                templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/recordAction.html',
                controller: "RecordActionController",
                controllerAs: "ctrl",
                link: function(scope, ele, attr) {
                    scope.tabtype = attr.tabtype;
                }
            };
        }])
        .controller('RecordActionController', ['DataUtils', '$scope', function RecordActionController(DataUtils, $scope) {
            $scope.tooltip = {};
            if (!$scope.displayname.isHTML) {
                $scope.tooltip.entityName = DataUtils.makeSafeHTML($scope.displayname.value);
            } else {
                $scope.tooltip.entityName = $scope.displayname.value;
            }
            if (!$scope.baseTableName.isHTML) {
                $scope.tooltip.baseTableName = DataUtils.makeSafeHTML($scope.baseTableName.value);
            } else {
                $scope.tooltip.baseTableName = $scope.baseTableName.value;
            }
        }]);
})();
