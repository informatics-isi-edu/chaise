(function () {
    'use strict';

    angular.module('chaise.record.table', [])

    .directive('recordTable', ['UriUtils', '$rootScope', '$window', '$filter', function(UriUtils, $rootScope, $window, $filter) {
        var postLink = function(scope) {
            var context = $rootScope.context;

            scope.tableModel = {
                tableName:          null,
                tableDisplayName:   null,
                columns:            [],
                filter:             null,
                sortedBy:           null,
                sortOrder:          null,
                rowset:             null,
                keycols:            [],
                count:              0
            };

            scope.pageInfo = $rootScope.pageInfo;

            // fetched from directive input
            scope.tableModel.columns = scope.columns;
            console.log(scope.data);
            scope.tableModel.rowset = scope.data;

            // TODO: Read the context for the reference and set defaults based on that

            scope.sort = function () {

                // update the address bar
                // page does not reload
                location.replace(scope.permalink());
                $rootScope.location = $window.location.href;

                pageInfo.previousButtonDisabled = true;
                pageInfo.nextButtonDisabled = true;

                var sort = [];
                if (scope.tableModel.sortedBy !== null) {
                    sort.push({"column": scope.tableModel.sortedBy, "order": scope.tableModel.sortOrder});
                }

                for (var i = 0; i < scope.tableModel.keycols.length; i++) { // all the key columns
                    var col = scope.tableModel.keycols[i].name;
                    if (col !== scope.tableModel.sortedBy) {
                        sort.push({"column": col, "order": "asc"});
                    }
                }

                pageInfo.loading = true;

                scope.tableModel.table.entity.get(scope.tableModel.filter, pageInfo.pageLimit, null, sort).then(function (rowset) {
                    pageInfo.loading = false;
                    console.log(rowset);
                    scope.tableModel.rowset = rowset;

                    // enable buttons
                    pageInfo.recordStart = 1;
                    pageInfo.recordEnd = pageInfo.recordStart + rowset.length() - 1;
                    pageInfo.previousButtonDisabled = true; // on page 1
                    pageInfo.nextButtonDisabled = (scope.tableModel.count <= pageInfo.recordEnd);
                }, function (error) {
                    console.log("Error getting entities: ");
                    console.log(error);

                    pageInfo.loading = false;

                    if (error instanceof ERMrest.UnauthorizedError) {
                        // session has expired, login
                        Session.login($window.location.href);
                    } else {

                        // TODO alert error

                        // enable buttons
                        pageInfo.previousButtonDisabled = (pageInfo.recordStart === 1); // on page 1
                        pageInfo.nextButtonDisabled = (scope.tableModel.count <= pageInfo.recordEnd);
                    }
                });
            };

            // function to determine if the clicked column should be sorted
            scope.sortBy = function(column) {
                if (scope.tableModel.sortedBy !== column) {
                    scope.tableModel.sortedBy = column;
                    scope.tableModel.sortOrder = "asc";
                    scope.sort();
                }
            }

            // toggle sort order between 'asc' and 'desc'
            scope.toggleSortOrder = function () {
                scope.tableModel.sortOrder = (scope.tableModel.sortOrder === 'asc' ? scope.tableModel.sortOrder === 'desc' : scope.tableModel.sortOrder = 'asc');
            };

            scope.permalink = function() {
                var url = $window.location.href.replace($window.location.hash, ''); // everything before #
                url = url + "#" + UriUtils.fixedEncodeURIComponent(context.catalogID) + "/" +
                    (context.schemaName !== '' ? UriUtils.fixedEncodeURIComponent(context.schemaName) + ":" : "") +
                    UriUtils.fixedEncodeURIComponent(context.tableName);

                if (scope.tableModel.filter !== null) {
                    url = url + "/" + scope.tableModel.filter.toUri();
                }

                if (scope.tableModel.sortby !== null) {
                    url = url + "@sort(" + UriUtils.fixedEncodeURIComponent(scope.tableModel.sortedBy);
                    if (scope.tableModel.sortOrder === "desc") {
                        url = url + "::desc::";
                    }
                    url = url + ")";
                }
                return url;
            };
        };

        return {
            restrict: 'E',
            templateUrl: '../common/templates/table.html',
            scope: {
                columns: '=',
                data: '='
            },
            link: postLink
        };
    }]);
})();
