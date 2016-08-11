(function () {
    'use strict';

    angular.module('chaise.recordDisplay', [])

    .directive('recordDisplay', ['ErrorService', function(ErrorService) {
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
