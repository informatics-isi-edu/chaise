(function () {
    'use strict';

    angular.module('chaise.record.display', [])

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
