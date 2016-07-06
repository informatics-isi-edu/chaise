(function () {
    'use strict';

    angular.module('chaise.recordDisplay', [])

    .directive('recordDisplay', [ function() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                record: '='
            },
            templateUrl: '../common/templates/record.html',
            link: function(scope, el, attrs) {
                scope.$watch('record', function(newVal, oldVal) {
                    if(newVal) {
                        scope.record = newVal;
                    }
                }, true);
            }
        };
    }]);
})();
