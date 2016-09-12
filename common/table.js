(function () {
    'use strict';

    angular.module('chaise.record.table', [])

    .directive('recordTable', [function() {

        return {
            restrict: 'E',
            templateUrl: '../common/templates/table.html',
            scope: {
                // vm is the table model, should have this format
                // { columns: array of Column objects,
                //   sortby: column name/null,
                //   sortOrder: asc, dsc or null,
                //   rowValues: array of rows values, each value has this structure {isHTML:boolean, value:value
                // }
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
