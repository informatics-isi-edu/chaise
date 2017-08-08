(function () {
    'use strict';

    angular.module('chaise.record.display', ['chaise.record.table'])

    .filter('trustedHTML', ['$sce', function($sce){
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }])
    .factory('templates',function(){
        return{
        entity: 'ent',
        related: 'rel'
        };
        }) /* *Directive record-display is called to display related table as part of entity layout
            These items will be passed to record-table diretive for table display.
            @example <record-display columns="::columns" values="::recordValues"  rectab="::colTableModels" rtref-dis-typetable0="::rtrefDisTypetable"
                toggle-related-table-display-type='ctrl.toggleRelatedTableDisplayType(dataModel)' can-edit-related="ctrl.canEditRelated(ref)" can-create-related0="ctrl.canCreateRelated(ref)"
                add-related-record="ctrl.addRelatedRecord(ref)" to-record-set="ctrl.toRecordSet(ref)">
                </record-display>
            @param columns : Array with columns labels
            @param Values: Array with column values
            @param rectab: All record table items
            @param rtrefDisTypetable0: related reference table
            @param toggleRelatedTableDisplayType: RT table display type
        */
        .directive('recordDisplay', ['DataUtils', function (DataUtils) {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                columns: '=',
                values: '=',
                rectab:'=',
                rtrefDisTypetable0: '=',
                toggleRelatedTableDisplayType: '&',
                canEditRelated:'&',
                canCreateRelated0:'&',
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
    While for the table siaply it appear on top right corner.
            @example: <record-action-bar rtref-dis-type="rtrefDisTypetable0[$index].display.type" tab-model-display="rectab[$index].displayType"
                  toggle-related-table-display-type='toggleRelatedTableDisplayType({dataModel:rectab[$index]})' can-edit-related="canEditRelated({ref:rtrefDisTypetable0[$index]})"
                  can-create-related="canCreateRelated0({ref:rtrefDisTypetable0[$index]})"
                  add-related-record="addRelatedRecord({ref:rtrefDisTypetable0[$index]})" to-record-set="toRecordSet({ref:rtrefDisTypetable0[$index]})">
                  </record-action-bar>
            @param  rtrefDisType: Related ref. display type
            @param  tabModelDisplay: Internal model display type
            @param  canEditRelated: function to check canEdit()
            @param: canCreateRelated: function to check canCreate()
            @param: addRelatedRecord: function to check add feature
            @param: toRecordSet:view more record function
     */
    .directive('recordActionBar', ['templates',function(templates) {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                rtrefDisType: '=',
                tabModelDisplay: '=',
                toggleRelatedTableDisplayType: '&',
                canEditRelated:'&',
                canCreateRelated:'&',
                addRelatedRecord:'&',
                toRecordSet:'&'
                
            },
            templateUrl:function(elem, attr){
                var temp = '../common/templates/recordAction-' + templates[attr.tabtype] + '.html';
                return (temp);
            },

            link: function(scope, ele) {
                var footerText = chaiseConfig.footerMarkdown;
                angular.isUndefinedOrNull = function(val) {
                    return val == '' || angular.isUndefined(val) || val === null
                }
                scope.actionStyle = {};                
                scope.actionStyle['padding-left']= '5px';
                scope.actionStyle['padding-bottom']= '5px';
                scope.actionStyle.float = 'right';                        

                function setClass(f) {                                                
                        scope.actionStyle['margin-right'] = f?'0px':'15px';
                        
                    }
                function checkDisplayType(){

                        if (scope.tabModelDisplay=='markdown'){
                            scope.rowStyle = false;
                            setClass(true);
                        } else {
                            scope.rowStyle = true;
                            setClass(false)
                        }
                    }
                    checkDisplayType();
                    scope.$watch('tabModelDisplay', function(){
                        checkDisplayType();
                    })
                }
        };
    }]);
})();
