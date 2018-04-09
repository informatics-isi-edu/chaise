(function() {
    'use strict';

    angular.module('chaise.record.display', ['chaise.record.table'])

        .filter('trustedHTML', ['$sce', function($sce) {
            return function(text) {
                return $sce.trustAsHtml(text);
            };
        }])
        /**
         * Directive <record-display> is called to display related table as part of entity layout.
         * These items will be passed to <record-table> diretive for table display.
         * @example  <record-display columns="::columns" values="::recordValues"  record-table-model="::colTableModels" related-reference-display-table="::rtrefDisTypetable"
         *        toggle-related-table-display-type='ctrl.toggleRelatedTableDisplayType(dataModel)' can-edit-related="::ctrl.canEditRelated(ref)"
         *        can-create-related="::ctrl.canCreateRelated(ref)" add-related-record="ctrl.addRelatedRecord(ref)" to-record-set="ctrl.toRecordSet(ref)">
         *        </record-display>
         * @param {array} columns : Array with columns labels
         * @param {array} values: Array with column values
         * @param {array} recordTableModel: All record table items
         * @param {array} relatedReferenceDisplayTable: related reference table to determine display type
         * @param {callback} toggleRelatedTableDisplayType: function to determine object display type
         */
        .directive('recordDisplay', ['DataUtils','$timeout', function(DataUtils, $timeout) {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    columns: '=',
                    values: '=',
                    recordTableModel: '=',
                    relatedReferenceDisplayTable: '=',
                    toggleRelatedTableDisplayType: '&',
                    canEditRelated: '&',
                    canCreateRelated: '&',
                    addRelatedRecord: '&',
                    toRecordSet: '&',
                    showEmptyRelatedTables: '='
                },
                templateUrl: '../common/templates/record.html',
                controller: function($scope) {
                    $scope.makeSafeIdAttr = DataUtils.makeSafeIdAttr;
                },
                link: function(scope){

                    scope.isInline = function (i) {
                        var column = scope.columns[i];
                        return (column.isInboundForeignKey || (column.isPathColumn && column.hasPath && !column.isUnique && !column.hasAggregate));
                    };

                    // returns true if we should show the column
                    scope.showColumn = function (i) {
                        return (typeof scope.values[i].value === "string" && scope.values[i].value !== '') && !scope.isInline(i);
                    };

                    // returns true if we should show a table
                    scope.showInlineTable = function (i) {
                        return scope.isInline(i) && (scope.showEmptyRelatedTables || (scope.recordTableModel[i] && scope.recordTableModel[i].rowValues.length > 0));
                    };
                }
            };
        }])
        /**
        * <record-action-bar></record-action-bar> displays action bar on top right corner. For non-table display contents wrap around the action bar.
        * While for the table display it appears on the top right corner.
        * @example: <record-action-bar related-table-ref-display="relatedReferenceDisplayTable[$index].display.type" tab-model-display="recordTableModel[$index].displayType"
        *        toggle-related-table-display-type='toggleRelatedTableDisplayType({dataModel:recordTableModel[$index]})' can-edit-related="canEditRelated({ref:relatedReferenceDisplayTable[$index]})"
        *        can-create-related="canCreateRelated0({ref:relatedReferenceDisplayTable[$index]})"
        *        add-related-record="addRelatedRecord({ref:relatedReferenceDisplayTable[$index]})" to-record-set="toRecordSet({ref:relatedReferenceDisplayTable[$index]})">
        *        </record-action-bar>
        * @param {string} relatedTableRefDisplay: Related table ref. display type
        * @param {string} tabModelDisplay: Display type of individual model
        * @param {callback} canEditRelated: function to check canEdit()
        * @param {callback} canCreateRelated: function to check canCreate()
        * @param {callback} addRelatedRecord: function to check add feature
        * @param {callback} toRecordSet:view more record function
        */
        .directive('recordActionBar', function() {
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
                    toRecordSet: '&'
                },
                templateUrl: '../common/templates/recordAction.html',
                link: function(scope, ele, attr) {
                    scope.tabtype = attr.tabtype;
                }
            };
        });
})();
