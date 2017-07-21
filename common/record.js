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
                rectab:'='
            },
            templateUrl: '../common/templates/record.html'
        };
    }]);
})();
