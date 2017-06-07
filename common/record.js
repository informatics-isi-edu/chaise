(function () {
    'use strict';

    angular.module('chaise.record.display', [])

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
                values: '='
            },
            templateUrl: '../common/templates/record.html'
        };
    }]);
})();
