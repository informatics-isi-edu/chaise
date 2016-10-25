(function () {
    'use strict';

    angular.module('chaise.record.table', [])

    .directive('recordTable', ['$window', 'AlertsService', 'DataUtils', function($window, AlertsService, DataUtils) {

        return {
            restrict: 'E',
            templateUrl: '../common/templates/table.html',
            scope: {
                // vm is the table model, should have this format
                // { hasLoaded,  // data is ready
                //   reference,
                //   tableDisplayName,
                //   columns,
                //   sortby,     // column name, user selected or null
                //   sortOrder,  // asc (default) or desc
                //   page,        // current page
                //   pageLimit,   // number of rows per page
                //   rowValues,      // array of rows values, each value has this structure {isHTML:boolean, value:value}
                //   search: null       // search term
                // }
                vm: '=',
                defaultRowLinking: "=", // set to true will use default row link function (go to record)
                onRowClick: '='         // set this if not using defaultRowLinking
            },
            link: function (scope, elem, attr) {

                scope.read = function() { // TODO how to not duplicate this code in recordset directive and use this here?

                    scope.vm.hasLoaded = false;

                    scope.vm.reference.read(scope.vm.pageLimit).then(function (page) {
                        $window.scrollTo(0, 0);

                        scope.vm.page = page;
                        scope.vm.rowValues = DataUtils.getRowValuesFromPage(page);

                        scope.vm.hasLoaded = true;

                        // tell parent controller data updated
                        scope.$emit('recordset-update');

                    }, function error(response) {
                        $log.warn(response);

                        scope.vm.hasLoaded = false;


                    }).catch(function genericCatch(exception) {
                        ErrorService.catchAll(exception);
                    });
                };

                scope.sortby = function(column) {
                    if (scope.vm.sortby !== column) {
                        scope.vm.sortby = column;
                        scope.vm.sortOrder = "asc";
                        scope.vm.reference = scope.vm.reference.sort([{"column":scope.vm.sortby, "descending":(scope.vm.sortOrder === "desc")}]);
                        scope.read();
                    }

                };

                scope.toggleSortOrder = function () {
                    scope.vm.sortOrder = (scope.vm.sortOrder === 'asc' ? scope.vm.sortOrder = 'desc' : scope.vm.sortOrder = 'asc');
                    scope.vm.reference = scope.vm.reference.sort([{"column":scope.vm.sortby, "descending":(scope.vm.sortOrder === "desc")}]);
                    scope.read();
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

                scope.onRowClickIndex = function (index) {
                    scope.onRowClick({index: index});
                };

            }
        };
    }])

    .directive('recordset', ['$window', 'AlertsService', 'DataUtils', function($window, AlertsService, DataUtils) {

        return {
            restrict: 'E',
            templateUrl: '../common/templates/recordset.html',
            scope: {
                vm: '=',
                defaultRowLinking: "=",
                onRowClick: '&'
            },
            link: function (scope, elem, attr) {

                scope.pageLimits = [10, 25, 50, 75, 100, 200];

                scope.read = function() {

                    scope.vm.hasLoaded = false;

                    scope.vm.reference.read(scope.vm.pageLimit).then(function (page) {
                        $window.scrollTo(0, 0);

                        scope.vm.page = page;
                        scope.vm.rowValues = DataUtils.getRowValuesFromPage(page);

                        scope.vm.hasLoaded = true;

                        // tell parent controller data updated
                        scope.$emit('recordset-update');

                    }, function error(response) {
                        $log.warn(response);

                        scope.vm.hasLoaded = false;

                    }).catch(function genericCatch(exception) {
                        ErrorService.catchAll(exception);
                    });
                };

                scope.setPageLimit = function(limit) {
                    scope.vm.pageLimit = limit;
                    scope.read();
                };

                scope.before = function() {

                    var previous = scope.vm.page.previous;
                    if (previous) {

                        scope.vm.reference = previous;
                        scope.read();

                    }
                };

                scope.after = function() {

                    var next = scope.vm.page.next;
                    if (next) {

                        scope.vm.reference = next;
                        scope.read();
                    }

                };

                scope.search = function(term) {

                    if (term)
                        term = term.trim();

                    scope.vm.search = term;
                    scope.vm.reference = scope.vm.reference.search(term); // this will clear previous search first
                    scope.read();
                };

                scope.clearSearch = function() {
                    if (scope.vm.reference.location.searchTerm)
                        scope.search();

                    scope.vm.search = null;
                };

            }
        };
    }]);
})();
