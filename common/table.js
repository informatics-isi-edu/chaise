(function () {
    'use strict';

    angular.module('chaise.record.table', [])

    .directive('recordTable', ['$window', 'UriUtils', 'ErrorService', function($window, UriUtils, ErrorService) {

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
                    try {
                        var tuple = scope.vm.page.tuples[index];
                        var appUrl = tuple.reference.contextualize.detailed.appLink;
                        if (appUrl)
                            location.assign(appUrl);
                        else {
                            throw new Error("Application Error: row linking undefined for " + tuple.reference.location.compactPath);
                        }
                    } catch (error) {
                        ErrorService.errorPopup(error.message, error.code, "home page");
                    }
                };
            }
        };
    }]);
})();
