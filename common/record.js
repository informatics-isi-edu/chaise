(function () {
    'use strict';

    angular.module('chaise.record.display', ['chaise.record.table'])

    .filter('trustedHTML', ['$sce', function($sce){
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }])
     /* *Directive record-display is called to display related table as part of entity layout.
            These items will be passed to record-table diretive for table display.
            @example  <record-display columns="::columns" values="::recordValues"  record-table-model="::colTableModels" related-reference-display-table="::rtrefDisTypetable"
                toggle-related-table-display-type='ctrl.toggleRelatedTableDisplayType(dataModel)' can-edit-related="::ctrl.canEditRelated(ref)" can-create-related="::ctrl.canCreateRelated(ref)"
                add-related-record="ctrl.addRelatedRecord(ref)" to-record-set="ctrl.toRecordSet(ref)">
                </record-display>
            @param columns : Array with columns labels
            @param Values: Array with column values
            @param recordTableModel: All record table items
            @param relatedReferenceDisplayTable: related reference table
            @param toggleRelatedTableDisplayType: RT table display type
        */
        .directive('recordDisplay', ['DataUtils', function (DataUtils) {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    columns: '=',
                    values: '=',
                    recordTableModel:'=',
                    relatedReferenceDisplayTable: '=',
                    toggleRelatedTableDisplayType: '&',
                    canEditRelated:'&',
                    canCreateRelated:'&',
                    addRelatedRecord:'&',
                    toRecordSet:'&'                
                },
                templateUrl: '../common/templates/record.html',
                controller: function ($scope) {
                    $scope.makeSafeIdAttr = DataUtils.makeSafeIdAttr;
                }
            };
    }])
    /* *Directive to display action bar on top right corner. For non-table display contents wrap around the action bar.
        While for the table display it appears on the top right corner.
            @example: <record-action-bar related-table-ref-display="relatedReferenceDisplayTable[$index].display.type" tab-model-display="recordTableModel[$index].displayType"
                  toggle-related-table-display-type='toggleRelatedTableDisplayType({dataModel:recordTableModel[$index]})' can-edit-related="canEditRelated({ref:relatedReferenceDisplayTable[$index]})"
                  can-create-related="canCreateRelated0({ref:relatedReferenceDisplayTable[$index]})"
                  add-related-record="addRelatedRecord({ref:relatedReferenceDisplayTable[$index]})" to-record-set="toRecordSet({ref:relatedReferenceDisplayTable[$index]})">
                  </record-action-bar>
            @param  relatedTableRefDisplay: Related table ref. display type
            @param  tabModelDisplay: Display type of individual model
            @param  canEditRelated: function to check canEdit()
            @param: canCreateRelated: function to check canCreate()
            @param: addRelatedRecord: function to check add feature
            @param: toRecordSet:view more record function
     */
    .directive('recordActionBar',function() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                relatedTableRefDisplay: '=',
                tabModelDisplay: '=',
                toggleRelatedTableDisplayType: '&',
                canEditRelated:'&',
                canCreateRelated:'&',
                addRelatedRecord:'&',
                toRecordSet:'&'                
            },          
            templateUrl: '../common/templates/recordAction.html',
            link: function(scope, ele, attr) {
                scope.tabtype = attr.tabtype;
                }
        };
    });
})();
