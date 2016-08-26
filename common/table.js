(function () {
    'use strict';

    angular.module('chaise.record.table', [])

    .directive('recordTable', [function() {

        return {
            restrict: 'E',
            templateUrl: '../common/templates/table.html',
            scope: {
                vm: '=',
                toggleSortOrder: '&',
                sortby: '&',
                gotoRowLink: '&'
            },
            link: function (scope, elem, attr) {

                scope.sortByColumn = function (colname) {
                    scope.sortby({ colname: colname });
                };

                scope.gotoRowLinkIndex = function (index) {
                    scope.gotoRowLink({index : index});
                };
            }
        };
    }]);
})();
