(function () {
    'use strict';

    angular.module('chaise.record.display', ['chaise.record.table'])

    .filter('trustedHTML', ['$sce', function($sce){
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }])

    .directive('recordDisplay', [function() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                columns: '=',
                values: '=',
                rectab:'=',
                rtrefDisTypetable0: '=',
                toggleRelatedtabDisplayType: '&',
                canEdit:'&',
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
    .directive('recordActionBar', [function() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                rtrefDisType: '=',
                tabModelDisplay: '=',
                toggleRelatedtabDisplayType: '&',
                canEdit:'&',
                canCreateRelated:'&',
                addRelatedRecord:'&',
                toRecordSet:'&',
                dummytest:'&'
            },
            templateUrl: '../common/templates/recordAction.html',
            controller: function ($scope) {

                //$scope.dummytest({$scope.k:56777});

            }
        };
    }]);
})();
