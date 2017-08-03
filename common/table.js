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
     */
    .factory('recordTableUtils', ['DataUtils', '$timeout','Session', function(DataUtils, $timeout, Session) {

        // This method sets backgroundSearch states depending upon various parameters
        // If it returns true then we should render the data
        // else we should reject the data
        function setSearchStates(scope, isBackground, searchTerm) {
            // If request is background
            if (isBackground) {
                // If there is a term in backgroundSearchPendingTerm for background and there is no foreground search going on then
                // Fire the request for the term in the backgroundSearchPendingTerm and return false
                // Else empty the backgroundSearchPendingTerm and set backgroundSearch false
                if (scope.vm.backgroundSearchPendingTerm && !scope.vm.foregroundSearch) {
                    scope.vm.search = scope.vm.backgroundSearchPendingTerm
                    scope.vm.backgroundSearchPendingTerm = null;
                    read(scope, true);
                    return false;
                } else {
                    scope.vm.backgroundSearch = false;
                    scope.vm.backgroundSearchPendingTerm = null;

                    // If forground search is going on or the searchterm differs from the current searchterm
                    // then return false
                    if (scope.vm.foregroundSearch || (searchTerm != scope.vm.search)) return false;
                }
            }

            return true;
        }

        /*
            This function performs a reference.read operation on search and pagination
            It accepts 2 parameters: viz: scope and isBackground
            The isbackground is true if the search was triggered because of a delayed search called backgroundSearch
            It is false for other scenarios.

            It uses 3 variables to determine the flow of search and perform operations

            - If this is a foreground search, it is fired instantly depending on the variable vm.foregroundSearch and results are rendered once returned.
              It also sets vm.backgroundSearch to false and empties backgroundSearchPendingTerm, to cancel any backgroundSearch.
            - If this is a background search and there is already a foreground search in progress which can be determined from vm.foregroundSearch,
              we cancel this search and empty the backgroundSearchPendingTerm.
            - If this is a background search, and there is already a background search in progress, this method will never be called,
              as we have the restriction of having only one background search running at a time
            - If the background search is completed successfully, and if the vm.foregroundSearch flag is true, then we reject background search results
              and empty the backgroundSearchPendingTerm
            - If the background search is completed successfully, and if the vm.foregroundSearch flag is false, and the backgroundSearchpendingTerm is
              not empty then we reject these results and fire a search for that term
            - If the background search is completed successfully, and if the vm.foregroundSearch flag is false, and the backgroundSearchpendingTerm is
              not empty then we render the background search results and empty the backgroundSearchPendingTerm
        */
        function read(scope, isBackground) {

            if (scope.vm.search == '') scope.vm.search = null;
            var searchTerm = scope.vm.search;

            scope.vm.hasLoaded = false;

            // If isbackground and no foregroundsearch going on then only fire the search request
            // Else empty the backgroundSearchPendingTerm
            if (isBackground) {
                if (!scope.vm.foregroundSearch) {
                    scope.vm.backgroundSearch = true;
                    scope.vm.totalRowsCnt = null;
                } else {
                    scope.vm.backgroundSearchPendingTerm = null;
                    scope.vm.backgroundSearch = false;
                    return;
                }
            } else {
                scope.vm.backgroundSearchPendingTerm = null;
            }

            scope.vm.reference.read(scope.vm.pageLimit).then(function (page) {
                // This method sets the
                if (!setSearchStates(scope, isBackground, searchTerm)) return;

                scope.vm.page = page;
                scope.vm.rowValues = DataUtils.getRowValuesFromPage(page);
                scope.vm.hasLoaded = true;

                $timeout(function() {
                    if (scope.vm.foregroundSearch) scope.vm.foregroundSearch = false;
                }, 200);

                // tell parent controller data updated
                if (!isBackground) {
                    scope.$emit('recordset-update');
                }

            }, function error(exception) {
                scope.vm.hasLoaded = true;
                setSearchStates(scope, isBackground);
                if (!isBackground && scope.vm.foregroundSearch) scope.vm.foregroundSearch = false;
                throw exception;
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

                scope.isSelected = function (displayname) {
                    return (scope.vm.selectedRows.indexOf(displayname) > -1);
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

                scope.vm.backgroundSearchPendingTerm = null;

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

                /*
                    The search fires at most one active "background"
                    search at a time and, i.e. for opportunistic type-ahead search. It should never send
                    another before the previous terminates. The delay for firing the search is
                    1 second, when the user has stopeed typing.
                */
                // On change in user input
                scope.inputChanged = function() {
                    if (scope.vm.enableAutoSearch) {

                        // Cancel previous promise for background search that was queued to be called

                        if (inputChangedPromise) {
                            $timeout.cancel(inputChangedPromise);
                        }

                        // Wait for the user to stop typing for a second and then fire the search
                        inputChangedPromise = $timeout(function() {
                            inputChangedPromise = null;

                            // If there is no foregound search going currently
                            if (!scope.vm.foregroundSearch) {
                                // If there is a background search going on currently then
                                // set the search term in the backgroundSearchPendingTerm
                                // else fire the search and empty the backgroundSearchPendingTerm
                                if (scope.vm.backgroundSearch) {
                                    scope.vm.backgroundSearchPendingTerm = scope.vm.search
                                } else {
                                    scope.search(scope.vm.search, true);
                                    scope.vm.backgroundSearchPendingTerm = null;
                                }
                            }
                        }, 1000);
                    }
                };

                scope.enterPressed = function() {
                    /* If user has pressed enter then foreground search starts,
                    the input is supposed to be frozen w/ a spinner to show that it is busy doing what the user
                    asked for. Any existing background search result completing during that time is to be discarded
                    to avoid confusing the UX.
                    */
                    $timeout.cancel(inputChangedPromise);

                    // Set the foregroundSearch to true and empty the backgroundSearchPendingTerm
                    scope.vm.foregroundSearch = true;
                    scope.vm.backgroundSearchPendingTerm = null;

                    // Trigger search
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
                    appLink = appLink + (appLink.indexOf("?") === -1 ? "?" : "&") +
                        'invalidate=' + UriUtils.fixedEncodeURIComponent(referrer_id);

                    // open url in a new tab
                    $window.open(appLink, '_blank');
                };

                // function for selecting all rows currently displayed
                scope.selectAll = function() {

                };

                // function for selecting none of the rows currently displayed
                scope.selectNone = function() {

                };

                // function for removing a single pill and it's corresponding selected row
                scope.removePill = function(displayname) {
                    scope.vm.selectedRows.splice(scope.vm.selectedRows.indexOf(displayname), 1);
                };

                // function for removing all pills
                scope.removeAllPills = function() {
                    scope.vm.selectedRows.clear();
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
                // called from form.controller.js to communicate that an entity was just updated
                window.updated = function() {
                    updated = true;
                }

                // get the total row count to display above the table
                scope.$on('recordset-update', function($event) {
                    if(scope.vm.search == scope.vm.reference.location.searchTerm) {
                        scope.vm.reference.getAggregates([scope.vm.reference.aggregate.countAgg]).then(function getAggregateCount(response) {
                            // NOTE: scenario: A user triggered a foreground search. Once it returns the aggregate count request is queued.
                            // While that request is running, the user triggers another foreground search.
                            // How do we avoid one aggregate count query to not show when it isn't relevant to the displayed data?
                            // Maybe comparing reference.location.searchTerm and vm.search here instead and if they don't match,
                            // set the value to null so the count displayed is just the count of the shown rows until the latter
                            // aggregate count request returns. If the latter one never returns (because of a server error or something),
                            // at least the UI doesn't show any misleading information.
                            scope.vm.totalRowsCnt = response[0];
                        }, function error(response) {
                            throw response;
                        });
                    }
                });
            }
        };
    }]);
})();
