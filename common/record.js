(function () {
    'use strict';

    angular.module('chaise.recordDisplay', [])

    .directive('recordDisplay', [ function() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                record: '=',
                table: '='
            },
            templateUrl: '../common/templates/record.html',
            link: function(scope) {
                scope.$watch('record', function(newVal, oldVal) {
                    if(newVal) {
                        scope.record = newVal;
                    }
                }, true);

                scope.$watch('table', function(newVal, oldVal) {
                    if(newVal) {
                        scope.table = newVal;
                        scope.columns = scope.table.columns.all();
                    }
                });
            }
        };
    }]);
})();
