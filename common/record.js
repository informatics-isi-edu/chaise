(function () {
    'use strict';

    angular.module('chaise.recordDisplay', [])

    .directive('recordDisplay', ['ErrorService', function(ErrorService) {
        return {
            restrict: 'E',
            transclude: true, // Tranclusion makes the parent scope directly available to the directive. There's no reason to isolate the scope, so no reason to define a new one.
            templateUrl: '../common/templates/record.html',
            link: function(scope) {
                console.log(scope.recordValues);
            }
        };
    }]);
})();
