(function () {
    'use strict';

    angular.module('chaise.record.table', [])

    .directive('recordTable', ['$window', function($window) {

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

                scope.toRecordSet = function() {
                    var refLocation = scope.vm.reference.location,
                        // This uses $window location because we need the origin and pathname relative to chaise,
                        // whereas refLocation gives you that info but relative to ermrestJS
                        recordsetPathname = $window.location.pathname.replace("record-two", "recordset");

                    var uri = $window.location.origin + recordsetPathname + '#' + refLocation.catalog + '/' + refLocation.path;
                    $window.location.href = uri;
                };
            }
        };
    }]);
})();
