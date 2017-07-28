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
                scope.actionStyle['font-size']='11px';
                scope.actionStyle['border-radius']= '8px';

                function setClass(f) {
                        scope.actionStyle.display =f? 'block':'';
                        scope.actionStyle.border= f?'2px solid #31b7e1':'';
                        scope.actionStyle.float= f?'left':'right';
                        scope.actionStyle['margin-bottom'] = f?'5px':'';
                        scope.actionStyle['background-color'] = f?'azure':'';
                    }
                function checkDisplayType(){
                        if (scope.tabModelDisplay=='markdown'){
                            setClass(true);
                        } else {
                            //scope.actionStyle.float= 'right';
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
