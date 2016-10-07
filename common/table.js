(function () {
    'use strict';

    angular.module('chaise.record.table', [])

    .directive('recordTable', ['$window', 'UriUtils', function($window, UriUtils) {

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
                    var t_path = tuple.reference.location.compactPath;
                    var newRef = tuple.reference.contextualize.detailed;
                    var appUrl = newRef.appLink;
                    if (appUrl)
                        location.assign(appUrl);
                    else {
                        var path = UriUtils.chaiseBaseURL + "/record/#" + UriUtils.fixedEncodeURIComponent(tuple.reference.location.catalog) + "/" + t_path;
                        location.assign(path);
                    }

                };
            }
        };
    }]);
})();
