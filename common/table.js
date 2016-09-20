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
                    var chaiseURL = $window.location.href.replace($window.location.hash, '');
                    var reload = (chaiseURL.indexOf("/record/") !== -1);

                    chaiseURL = chaiseURL.replace("/recordset/", '');
                    chaiseURL = chaiseURL.replace("/record/", '');
                    chaiseURL = chaiseURL.replace("/record-two/", '');
                    // TODO add line above for each app that uses record-table directive
                    var path = chaiseURL + "/record/#" + UriUtils.fixedEncodeURIComponent(tuple.reference.location.catalog) + "/" + t_path;

                    location.assign(path);

                    // forcing a reload when linking from record to record, which does not automatically reload
                    // this is an angular issue (if change path AFTER hash, page does not reload)
                    if (reload)
                        location.reload();
                }
            }
        };
    }]);
})();
