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
})
    .directive('recordDisplay', [function() {
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
                toRecordSet:'&',
                dummytest:'&'
            },
            templateUrl: '../common/templates/record.html',
            controller: function ($scope) {
                $scope.repeater = [1,2];
            //    $scope.toRecordSet()($scope.rtrefDisType);
            //console.log($scope.rtrefDisTypetable0[1]);
            // return $scope;
            }

        };
    }])
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
                toRecordSet:'&',
                dummytest:'&'
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
                // scope.rowStyle = {};
                // scope.actionStyle['font-size']='11px';
                //scope.actionStyle['padding-left']= '5px';
                // scope.actionStyle['font-weight']='bold';

                function setClass(f) {
                        //scope.actionStyle.display =f? 'block':'';
                        // scope.actionStyle.border= f?'2px solid #31b7e1':'';
                        scope.actionStyle.float= 'right';// f?'left':'right';
                        // scope.actionStyle['margin-left'] = f?'0px':'-15px';
                        scope.actionStyle['margin-right'] = f?'0px':'15px';
                        //scope.actionStyle['background-color'] = f?'azure':'';
                    }
                function checkDisplayType(){

                        if (scope.tabModelDisplay=='markdown'){
                            scope.rowStyle = false;
                            setClass(true);
                        } else {
                            //scope.actionStyle.float= 'right';
                            // scope.rowStyle['margin-left'] = '-15px';
                            //scope.rowStyle['margin-right'] = '15px';
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
