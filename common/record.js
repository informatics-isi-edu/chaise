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
         * @example  <record-display columns-models="::columnModels" values="::recordValues"
         *        toggle-related-table-display-type='ctrl.toggleRelatedTableDisplayType(dataModel)' can-edit-related="::ctrl.canEditRelated(ref)"
         *        can-create-related="::ctrl.canCreateRelated(ref)" add-related-record="ctrl.addRelatedRecord(ref)" to-record-set="ctrl.toRecordSet(ref)">
         *        </record-display>
         * @param {array} columnModels : Array with column models
         * @param {array} values: Array with column values
         * @param {callback} toggleRelatedTableDisplayType: function to determine object display type
         */
        .directive('recordDisplay', ['DataUtils','$timeout', function(DataUtils, $timeout) {
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
                templateUrl: '../common/templates/record.html',
                controller: function($scope) {
                    $scope.makeSafeIdAttr = DataUtils.makeSafeIdAttr;
                },
                link: function(scope){
                    scope.isInline = function (i) {
                        return scope.columnModels[i].isInline;
                    };

                    // returns true if we should show the column
                    scope.showColumn = function (i) {
                        return (typeof scope.values[i].value === "string" && scope.values[i].value !== '') && !scope.isInline(i);
                    };

                    // returns true if we should show a table
                    scope.showInlineTable = function (i) {
                        var readDone =  scope.isInline(i) && scope.columnModels[i].tableModel && scope.columnModels[i].tableModel.page;
                        return readDone && (scope.showEmptyRelatedTables || scope.columnModels[i].tableModel.rowValues.length > 0);
                    };
                }
            };
        }])
        /**
        * <record-action-bar></record-action-bar> displays action bar on top right corner. For non-table display contents wrap around the action bar.
        * While for the table display it appears on the top right corner.
        * @example: <record-action-bar related-table-ref-display="tableModel.reference.display.type" tab-model-display="tableModel.displayType"
        *        toggle-related-table-display-type='toggleRelatedTableDisplayType({dataModel:tableModel})' can-edit-related="canEditRelated({ref:relatedReferenceDisplayTable[$index]})"
        *        can-create-related="canCreateRelated({ref:tableModel.reference})"
        *        add-related-record="addRelatedRecord({ref:tableModel.reference})" to-record-set="toRecordSet({ref:tableModel.reference})">
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
                    canDeleteRelated: '&',
                    addRelatedRecord: '&',
                    removeRelatedRecord: '&',
                    toRecordSet: '&'
                },
                templateUrl: '../common/templates/recordAction.html',
                link: function(scope, ele, attr) {
                    scope.tabtype = attr.tabtype;
                }
            };
        });
})();
