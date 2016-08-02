(function () {
    'use strict';

    angular.module('chaise.record.display', [])

    .directive('recordDisplay', [function() {
        return {
            restrict: 'E',
            templateUrl: '../common/templates/record.html'
        };
    }]);
})();
