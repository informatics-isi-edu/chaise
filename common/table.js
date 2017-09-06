(function () {
    'use strict';

    angular.module('chaise.record.table', ['chaise.ellipses'])

    /**
     * Ways to use recordTable directive:
     *
     * 1. Table only
     *    <record-table vm="vm"></record-table>
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
     * These are recordset and record-table directive parameters:
     * - onRowClick(tuple, isSelected): 
     *   - A callback for when in select mode a row is selected.
     *   - If isSelected is false, that means the row has been deselected.
     * - 
     * 
     * - vm: The table model, should have this format:
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
     *        selectedRows, // array of selected rows
     *        search,       // search term, null for none
     *        config,       // set of config to disable or enable features
     *        context       // reference's context
     *       }
     *
     *      available config options:
     *          - viewable
     *          - editable
     *          - deletable
     *          - selectMode:
     *              can be one of the following:
     *                  no-select       // do not allow selection of the rows
     *                  single-select   // only allow one row to be selected
     *                  multi-select    // allow the user to select as many rows as they want
     *          - hideSelectedRows
     *          - hideTotalCount
     *          - hidePageSettings
     *          - hasFaceting
     *
     * The events that are being used by directives in this file and their children:
     * 1. `reference-modified`: data model has been updated.
     *    your app may want to update address bar, permalink etc.
     *
     *      $scope.$on('reference-modified', function() {
     *          $window.scrollTo(0, 0);
     *          $window.location.replace($scope.permalink());
     *          $rootScope.location = $window.location.href;
     *      });
     * 2. `data-modified`: data has been updated, this is an internal event which
     * the children of recordset directive should listen to.
     * 3. `facet-modified`: one of the facet has been updated. This is an internal
     * event that facets will send to the parents. recordset directive uses this
     * event to call read on this new reference.
     * 4. `record-modified`: one of the records in the recordset table has been
     * modified. ellipses will fire this event and recordset directive will use it.
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
        function read(scope, isBackground, broadcast) {

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

                if (!isBackground) {
                    // tell parent controller data modified
                    scope.$emit('reference-modified');
                }
                
                // tell children that data modified
                if (broadcast) {
                    scope.$broadcast('data-modified');
                }

            }, function error(exception) {
                scope.vm.hasLoaded = true;
                setSearchStates(scope, isBackground);
                if (!isBackground && scope.vm.foregroundSearch) scope.vm.foregroundSearch = false;
                throw exception;
            });
        }
        
        function newRead(scope, broadcast) {
            if (!scope.vm.isIdle) {
                return;
            }
            
            scope.vm.hasLoaded = false;
            
            scope.vm.isIdle = false;
            (function (uri, send) {
                scope.vm.reference.read(scope.vm.pageLimit).then(function (page) {
                    scope.vm.isIdle = true;
                    if (scope.vm.reference.uri === uri) {
                        
                        scope.vm.page = page;
                        scope.vm.rowValues = DataUtils.getRowValuesFromPage(page);
                        scope.vm.hasLoaded = true;
                        
                        scope.$emit('reference-modified');
                        
                        if (send) {
                            scope.$broadcast('data-modified');
                        }
                    } else {
                        newRead(scope, send);
                    }
                }).catch(function (err) {
                    scope.vm.isIdle = true;
                    if (scope.vm.reference.uri === uri) {
                        scope.vm.hasLoaded = true;
                        throw err; // this is the last request
                    } else {
                        newRead(scope, send); // some request are still pending
                    }
                })
            })(scope.vm.reference.uri, broadcast);
        }

        return {
            read: read,
            newRead: newRead
        }
    }])

    .directive('recordTable', ['AlertsService', 'recordTableUtils', function(AlertsService, recordTableUtils) {
        
        function callOnRowClick(scope, tuples, isSelected) {
            if (scope.onRowClickBind) {
                console.log('calling bind');
                scope.onRowClickBind()(tuples, isSelected);
            } else if (scope.onRowClick) {
                console.log('calling');
                scope.onRowClick()(tuples, isSelected);
            }
        }
        
        return {
            restrict: 'E',
            templateUrl: '../common/templates/table.html',
            scope: {
                vm: '=',
                /*
                 * used by the recordset template to pass down on click function
                 * The recordset has a onRowClick which will be passed to this onRowClickBind.
                 */
                onRowClickBind: '=?',    
                onRowClick: '&?'      // set row click function
            },
            link: function (scope, elem, attr) {

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

                // verifies whether or not the current key value is in the set of selected rows or not
                scope.isSelected = function (key) {
                    var index = scope.vm.selectedRows.findIndex(function (obj) {
                        return obj.uniqueId == key;
                    });
                    return (index > -1);
                };

                // this is for the button on the table heading that deselects all currently visible rows
                scope.selectNone = function() {
                    var tuples = [], tuple;
                    for (var i = 0; i < scope.vm.page.tuples.length; i++) {
                        tuple = scope.vm.page.tuples[i];
                        var key = tuple.uniqueId;

                        var index = scope.vm.selectedRows.findIndex(function (obj) {
                            return obj.uniqueId == key;
                        });

                        if (index > -1) {
                            tuples.push(tuple);
                            scope.vm.selectedRows.splice(index, 1);
                        }
                    }
                    if (tuples.length > 0) {
                        callOnRowClick(scope, tuples, false);
                    }
                };

                // this is for the button on the table heading that selects all currently visible rows
                scope.selectAll = function() {
                    var tuples = [], tuple;
                    for (var i = 0; i < scope.vm.page.tuples.length; i++) {
                        var tuple = scope.vm.page.tuples[i];

                        if (!scope.isSelected(tuple.uniqueId)) {
                            scope.vm.selectedRows.push(tuple);
                            tuples.push(tuple);
                        }
                    }
                    if (tuples.length > 0) {
                        callOnRowClick(scope, tuples, true);
                    }
                };


                // Facilitates the multi select functionality for multi edit by storing the tuple in the selectedRows array
                scope.onSelect = function(args) {
                    console.log(args);
                    var tuple = args.tuple;

                    var rowIndex = scope.vm.selectedRows.findIndex(function (obj) {
                        return obj.uniqueId == tuple.uniqueId;
                    });

                    // add the tuple to the list of selected rows
                    var isSelected = rowIndex === -1;
                    
                    if (isSelected) {
                        scope.vm.selectedRows.push(tuple);
                    } else {
                        scope.vm.selectedRows.splice(rowIndex, 1);
                    }
                    
                    callOnRowClick(scope, [tuple], isSelected);
                };
            }
        };
    }])

    .directive('recordList', ['recordTableUtils', '$timeout', function(recordTableUtils, $timeout) {

        return {
            restrict: 'E',
            templateUrl: '../common/templates/list.html',
            scope: {
                initialized: '=?',
                onRowClick: '=',
                rows: '=' // each row: {uniqueId, displayname, count, selected}
            },
            link: function (scope, elem, attr) {
                scope.onSelect = function (row) {
                    row.selected = !row.selected;
                    scope.onRowClick(row);
                }

                scope.$watch('initialized', function (newVal, oldVal) {
                    if (newVal) {
                        $timeout(function () {
                            var listElem = elem[0].getElementsByClassName("chaise-list-container")[0];

                            // set the height to the clientHeight or the rendered height so when the content changes the page doesn't thrash
                            listElem.style.height = listElem.scrollHeight + "px";
                            listElem.style.overflow = "hidden";
                        }, 0);
                    } else if (newVal == false) {
                        var listElem = elem[0].getElementsByClassName("chaise-list-container")[0];
                        listElem.style.height = "";
                        listElem.style.overflow = "";
                    }
                });
            }
        }
    }])

    .directive('recordset', ['recordTableUtils', '$window', '$cookies', 'DataUtils', 'MathUtils', 'UriUtils','$timeout', function(recordTableUtils, $window, $cookies, DataUtils, MathUtils, UriUtils, $timeout) {

        return {
            restrict: 'E',
            templateUrl: '../common/templates/recordset.html',
            scope: {
                vm: '=',
                onRowClick: '&?',       // set row click function
                allowCreate: '=?'       // if undefined, assume false
            },
            link: function (scope, elem, attr) {

                var addRecordRequests = {}; // table refresh used by add record implementation with cookie (old method)
                var updated = false; // table refresh used by ellipses' edit action (new method)

                scope.pageLimits = [10, 25, 50, 75, 100, 200];
                scope.vm.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

                scope.vm.backgroundSearchPendingTerm = null;
                scope.vm.currentPageSelected = false;
                scope.vm.isIdle = true;

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

                    if (term) term = term.trim();

                    scope.vm.search = term;
                    scope.vm.reference = scope.vm.reference.search(term); // this will clear previous search first
                    recordTableUtils.read(scope, isBackground, true);
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

                // function for removing a single pill and it's corresponding selected row
                scope.removePill = function(key) {
                    var index = scope.vm.selectedRows.findIndex(function (obj) {
                        return obj.uniqueId == key;
                    });
                    scope.vm.selectedRows.splice(index, 1);
                };

                // function for removing all pills regardless of what page they are on, clears the whole selectedRows array
                scope.removeAllPills = function() {
                    scope.vm.selectedRows.clear();
                    scope.vm.currentPageSelected = false;
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

                scope.$on('data-modified', function($event) {
                    
                    console.log('data-modified in recordset directive, getting count');
                    if (!scope.vm.config.hideTotalCount && scope.vm.search == scope.vm.reference.location.searchTerm) {
                        // get the total row count to display above the table
                        console.log("Data-updated: ", scope.vm);
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
                
                scope.$on('facet-modified', function ($event) {
                    console.log('facet-modified in recordset directive');
                    // recordTableUtils.read(scope, false, true);
                    recordTableUtils.newRead(scope, true);
                    // $event.stopPropagation();
                });
                
                // row data has been modified (from ellipses)
                // do a read
                scope.$on('record-modified', function($event) {
                    console.log('record-modified in recordset directive');
                    recordTableUtils.read(scope, false, true);
                    // $event.stopPropagation();
                });
            }
        };
    }]);
})();
