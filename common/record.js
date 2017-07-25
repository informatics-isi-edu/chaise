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
            scope: {
                columns: '=',
                values: '=',
                rectab:'=',
                rtrefDisTypetable0: '=',
                toggleRelatedtabDisptype0: '&',
                canEdit0:'&',
                canCreateRelated0:'&',
                addRelatedRecord0:'&',
                toRecordSet0:'&'
            },
            templateUrl: '../common/templates/record.html'
        };
    }])
    .directive('recordActionBar', [function() {
        return {
            restrict: 'E',
            scope: {
                rtrefDisType: '=',
                tabModelDisplay: '=',
                toggleRelatedtabDisptype: '&',
                canEdit:'&',
                canCreateRelated:'&',
                addRelatedRecord:'&',
                toRecordSet:'&'
            },
            templateUrl: '../common/templates/recordAction.html'
        };
    }]);
})();
