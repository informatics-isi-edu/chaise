(function () {
    'use strict';

    angular.module('chaise.recordDisplay', [])

    .directive('recordDisplay', ['ErrorService', function(ErrorService) {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: '../common/templates/record.html',
            link: function(scope) {

                try {
                    scope.columns = scope.table.columns.all();
                } catch (exception) {
                    ErrorService.catchAll(exception);
                }
            }
        };
    }]);
})();
