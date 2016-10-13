(function () {
    'use strict';

    angular.module('chaise.record.table', [])

    .directive('recordTable', ['$window', 'UriUtils', 'AlertsService', function($window, UriUtils, AlertsService) {

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
                sortby: '&'
            },
            link: function (scope, elem, attr) {

                scope.sortByColumn = function (colname) {
                    scope.sortby({ colname: colname });
                };

                scope.gotoRowLink = function(index) {
                    var tuple = scope.vm.page.tuples[index];
                    var appUrl = tuple.reference.contextualize.detailed.appLink;
                    if (appUrl)
                        location.assign(appUrl);
                    else {
                        AlertsService.addAlert({type: "error", message: "Application Error: row linking undefined for " + tuple.reference.location.compactPath});
                    }
                };
            }
        };
    }]);
})();
