(function () {
    'use strict';

    angular.module('chaise.record.table', ['chaise.ellipses'])

    /**
     * Ways to use recordTable directive:
     *
     * 1. Table only
     *    <record-table vm="vm" default-row-linking="true"></record-table>
     *
     * 2. Selectable table only with select function
     *    <record-table vm="vm" on-row-click="gotoRowLink(tuple)"></record-table>
     *
     * 3. Table with search, page size, previous/next
     *    <recordset vm="vm"></recordset>
     *
     * 4. Selectable table with search, page size, previous/next
     *    <recordset vm="vm" on-row-click="gotoRowLink(tuple)"></recordset>
     *
     *
     * vm is the table model, should have this format:
     *
     *      { hasLoaded,    // data is ready, loading icon should not be visible
     *        reference,    // reference object
     *        tableDisplayName,
     *        columns,      // array of Column objects
     *        enableSort,   // boolean whether sorting should be enabled
     *        sortby,       // column name, user selected or null
     *        sortOrder,    // asc (default) or desc
     *        page,         // current page object
     *        pageLimit,    // number of rows per page
     *        rowValues,    // array of rows values, each value has this structure {isHTML:boolean, value:value}
     *        search:       // search term, null for none
     *        config,       // {viewable, editable, deletable, selectable, context}
     *        context       // reference's context
     *       }
     *
     *
     * Handle recordset/recordTable events in your controller:
     *
     * 1. recordset-update - data model has been updated
     *    your app may want to update address bar, permalink etc.
     *
     *      $scope.$on('recordset-update', function() {
     *          $window.scrollTo(0, 0);
     *          $window.location.replace($scope.permalink());
     *          $rootScope.location = $window.location.href;
     *      });
     *
     * 2. error - an exception was caught
     *
     *      $scope.$on('error', function(event, exception) {
     *          $log.warn(exception);
     *          ErrorService.catchAll(exception);
     *      });
     */
    .factory('recordTableUtils', ['DataUtils', '$timeout', function(DataUtils, $timeout) {

        function setSearchStates = function(isBackground) {
            if (isBackground) {
                if (scope.vm.backgroundSearchQueue && !scope.vm.foregroundSearch) {
                    scope.vm.search = scope.vm.backgroundSearchQueue
                    scope.vm.backgroundSearchQueue = null;
                    read(scope, true);
                    return false;
                } else {
                    scope.vm.backgroundSearch = false;
                    scope.vm.backgroundSearchQueue = null;

                    if (scope.vm.foregroundSearch) return false;
                }
            }

            return true;
        }

        function read(scope, isBackground) {

            scope.vm.hasLoaded = false;

            scope.vm.reference.read(scope.vm.pageLimit).then(function (page) {

                if (!setSearchStates(isBackground)) return;
                
                scope.vm.page = page;
                scope.vm.rowValues = DataUtils.getRowValuesFromPage(page);
                scope.vm.hasLoaded = true;

                $timeout(function() {
                    if (scope.vm.foregroundSearch) scope.vm.foregroundSearch = false;
                }, 200);


                // tell parent controller data updated
                scope.$emit('recordset-update');



            }, function error(response) {
                scope.vm.hasLoaded = true;
                scope.$emit('error', response);
                setSearchStates(isBackground);

                if (!isBackground && scope.vm.foregroundSearch) scope.vm.foregroundSearch = false;
            });
        }

        return {
            read: read
        }
    }])

    .directive('recordTable', ['AlertsService', 'recordTableUtils', function(AlertsService, recordTableUtils) {

        return {
            restrict: 'E',
            templateUrl: '../common/templates/table.html',
            scope: {
                vm: '=',
                onRowClickBind: '=?',    // used by the recordset template to pass down on click function
                onRowClick: '&?'      // set row click function
            },
            link: function (scope, elem, attr) {

                // row data has been modified (from ellipses)
                // do a read
                scope.$on('record-modified', function() {
                    recordTableUtils.read(scope);
                });

                scope.sortby = function(column) {
                    if (scope.vm.sortby !== column) {
                        scope.vm.sortby = column;
                        scope.vm.sortOrder = "asc";
                        scope.vm.reference = scope.vm.reference.sort([{"column":scope.vm.sortby, "descending":(scope.vm.sortOrder === "desc")}]);
                        recordTableUtils.read(scope);
                    }

                };

                scope.toggleSortOrder = function () {
                    scope.vm.sortOrder = (scope.vm.sortOrder === 'asc' ? scope.vm.sortOrder = 'desc' : scope.vm.sortOrder = 'asc');
                    scope.vm.reference = scope.vm.reference.sort([{"column":scope.vm.sortby, "descending":(scope.vm.sortOrder === "desc")}]);
                    recordTableUtils.read(scope);
                };
            }
        };
    }])

    .directive('recordset', ['recordTableUtils', '$window', '$cookies', 'DataUtils', 'MathUtils', 'UriUtils','$timeout', function(recordTableUtils, $window, $cookies, DataUtils, MathUtils, UriUtils, $timeout) {

        return {
            restrict: 'E',
            templateUrl: '../common/templates/recordset.html',
            scope: {
                vm: '=',
                onRowClick: '&?'         // set row click function
            },
            link: function (scope, elem, attr) {

                var addRecordRequests = {}; // table refresh used by add record implementation with cookie (old method)
                var updated = false; // table refresh used by ellipses' edit action (new method)

                scope.pageLimits = [10, 25, 50, 75, 100, 200];
                scope.vm.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

                scope.vm.backgroundSearchQueue = null;

                scope.setPageLimit = function(limit) {
                    scope.vm.pageLimit = limit;
                    recordTableUtils.read(scope);
                };

                scope.before = function() {
                    var previous = scope.vm.page.previous;
                    if (previous) {

                        scope.vm.reference = previous;
                        recordTableUtils.read(scope);

                    }
                };

                scope.after = function() {
                    var next = scope.vm.page.next;
                    if (next) {

                        scope.vm.reference = next;
                        recordTableUtils.read(scope);
                    }

                };


                var inputChangedPromise;

                scope.inputChanged = function() {
                    if (scope.vm.enableAutoSearch) {

                        if (inputChangedPromise) {
                            $timeout.cancel(inputChangedPromise);
                        }

                        inputChangedPromise = $timeout(function() {
                            inputChangedPromise = null;

                            if (!scope.vm.foregroundSearch) {
                                if (scope.vm.backgroundSearch) {
                                    backgroundSearchQueue = scope.vm.search
                                } else {
                                    scope.vm.backgroundSearch = true;
                                    scope.search(scope.vm.search, true);
                                    backgroundSearchQueue = null;
                                }
                            }
                        }, 1000);
                    }
                };

                scope.enterPressed = function() {
                    $timeout.cancel(inputChangedPromise);
                    scope.vm.foregroundSearch = true;
                    scope.vm.backgroundSearchQueue = null;
                    scope.search(scope.vm.search);
                };

                scope.search = function(term, isBackground) {

                    if (term)
                        term = term.trim();

                    scope.vm.search = term;
                    scope.vm.reference = scope.vm.reference.search(term); // this will clear previous search first
                    recordTableUtils.read(scope, isBackground);
                };

                scope.clearSearch = function() {
                    if (scope.vm.reference.location.searchTerm)
                        scope.search();

                    scope.vm.search = null;
                };

                scope.addRecord = function() {

                    // Generate a unique id for this request
                    // append it to the URL
                    var referrer_id = 'recordset-' + MathUtils.getRandomInt(0, Number.MAX_SAFE_INTEGER);
                    addRecordRequests[referrer_id] = 0;

                    // open a new tab
                    var newRef = scope.vm.reference.table.reference.contextualize.entryCreate;
                    var appLink = newRef.appLink;
                    appLink = appLink + (appLink.indexOf("?") === -1? "?" : "&") +
                        'invalidate=' + UriUtils.fixedEncodeURIComponent(referrer_id);

                    // open url in a new tab
                    $window.open(appLink, '_blank');
                };

                // on window focus, if has pending add record requests
                // check if any are complete 1) delete requests, 2) delete cookies, 3) do a read
                $window.onfocus = function() {

                    var completed = 0; // completed add record requests
                    for (var id in addRecordRequests) {
                        var cookie = $cookies.getObject(id);
                        if (cookie) {
                            delete addRecordRequests[id];
                            $cookies.remove(id);
                            completed += 1;
                        }
                    }

                    // read
                    if (completed > 0 || updated) {
                        updated = false;
                        recordTableUtils.read(scope);
                    }

                };

                // allow child window to call to indicate table has been updated
                window.updated = function() {
                    updated = true;
                }
            }
        };
    }]);
})();
