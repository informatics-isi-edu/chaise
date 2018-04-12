(function () {
    'use strict';

    angular.module('chaise.record.table', ['chaise.ellipses'])

    .constant('tableConstants', {
        MAX_CONCURENT_REQUEST: 4,
        MAX_URL_LENGTH: 2000,
        PAGE_SIZE: 10,
        AUTO_SEARCH_TIMEOUT: 2000
    })

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
     *          - mode :
     *              The mode of the recordset, can be any of the following:
     *                - default TODO
     *          - viewable
     *          - editable
     *          - deletable
     *          - selectMode:
     *              can be one of the following:
     *                  no-select       // do not allow selection of the rows. {modalBox.noSelect}
     *                  single-select   // only allow one row to be selected. {modalBox.singleSelectMode}
     *                  multi-select    // allow the user to select as many rows as they want. {modalBox.multiSelectMode}
     *          - hideSelectedRows
     *          - hideTotalCount
     *          - hidePageSettings
     *          - showFaceting: defines if the facet panel should be available
     *          - openFacetPanel: defines if the facet panel is open by default
     *          - showNull: if this is available and equal to `true`, we will differentiate between `null` and empty string.
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
    .factory('recordTableUtils',
            ['AlertsService', 'modalBox', 'DataUtils', '$timeout','Session', '$q', 'tableConstants', '$rootScope', '$log', '$window', '$cookies', 'defaultDisplayname', 'MathUtils', 'UriUtils', 'logActions',
            function(AlertsService, modalBox, DataUtils, $timeout, Session, $q, tableConstants, $rootScope, $log, $window, $cookies, defaultDisplayname, MathUtils, UriUtils, logActions) {

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
                    scope.vm.logObject = {action: logActions.recordsetFacet};
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

            scope.vm.reference.read(scope.vm.pageLimit, scope.vm.logObject).then(function (page) {
                if (!setSearchStates(scope, isBackground, searchTerm)) return;

                var afterRead = function () {
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
                };

                if (scope.getDisabledTuples) {
                    scope.getDisabledTuples(page, scope.vm.pageLimit).then(function (rows) {
                        if (!setSearchStates(scope, isBackground, searchTerm)) return;
                        scope.vm.disabledRows = rows;
                        afterRead();
                    }).catch(function (err) {
                        throw err;
                    });
                } else {
                    afterRead();
                }

            }).catch(function error(exception) {
                scope.vm.hasLoaded = true;
                setSearchStates(scope, isBackground);
                if (!isBackground && scope.vm.foregroundSearch) scope.vm.foregroundSearch = false;
                if (DataUtils.isObjectAndKeyDefined(exception.errorData, 'redirectPath')) {
                  exception.errorData.redirectUrl = UriUtils.createRedirectLinkFromPath(exception.errorData.redirectPath);
                }
                throw exception;
            });
        }

        function updateResult (vm) {
            vm.hasLoaded = false;
            var defer = $q.defer();
            (function (uri) {
                vm.reference.read(vm.pageLimit, vm.logObject).then(function (page) {
                    if (vm.reference.uri !== uri) return defer.resolve(false);

                    vm.page = page;

                    return vm.getDisabledTuples ? vm.getDisabledTuples(page, vm.pageLimit) : '';
                }).then(function (rows) {
                    if (rows) vm.disabledRows = rows;
                    vm.hasLoaded = true;
                    vm.initialized = true;
                    vm.rowValues = DataUtils.getRowValuesFromPage(vm.page);

                    return defer.resolve(true);
                }).catch(function(err) {
                    if (vm.reference.uri !== uri) {
                        defer.resolve(false);
                    }

                    vm.hasLoaded = true;
                    vm.initialized = true;
                    if (DataUtils.isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
                      err.errorData.redirectUrl = UriUtils.createRedirectLinkFromPath(err.errorData.redirectPath);
                    }
                    return defer.reject(err);
                });
            }) (vm.reference.uri);
            return defer.promise;
        }

        function updateCount (vm) {
            var  defer = $q.defer();
            (function (uri) {
                vm.reference.getAggregates(
                    [vm.reference.aggregate.countAgg],
                    {action: logActions.recordsetCount}
                ).then(function getAggregateCount(response) {
                    if (vm.reference.uri !== uri) {
                        return defer.resolve(false);
                    }

                    vm.totalRowsCnt = response[0];
                    return defer.resolve(true);
                }).catch(function (err) {
                    if (vm.reference.uri !== uri) {
                        return defer.resolve(false);
                    }

                    // fail silently
                    vm.totalRowsCnt = null;
                });
            })(vm.reference.uri);
            return defer.promise;
        }

        function initialize (vm) {
            vm.search = vm.reference.location.searchTerm;
            vm.initialized = false;
            vm.dirtyResult = true;
            vm.dirtyCount = true;

            update(vm);
        }

        /**
         * Based on the given inputs, it will set the state of different parts
         * of recordset directive to be updated.
         *
         * @param  {Object} vm           table view model
         * @param  {boolean} updateResult if it's true we will update the table.
         * @param  {boolean} updateCount  if it's true we will update the displayed total count.
         * @param  {boolean} updateFacets if it's true we will udpate the opened facets.
         */
        function update (vm, updateResult, updateCount, updateFacets) {
            if (updateFacets) {
                vm.facetModels.forEach(function (fm, index) {
                    if (vm.lastActiveFacet === index) {
                        return;
                    }

                    if (fm.isOpen) {
                        fm.processed = false;
                        fm.isLoading = true;
                    } else {
                        fm.initialized = false;
                        fm.processed = true;
                    }
                });
            }

            // if it's true change, otherwise don't change.
            vm.dirtyResult = updateResult || vm.dirtyResult;
            vm.dirtyCount = updateCount || vm.dirtyCount;

            $timeout(function () {
                updatePage(vm);
            }, 0);
        }

        /**
         * Given the viewmodel, it will update the page.
         * This is behaving as a flow-control system, that allows only a Maximum
         * number of requests defined.
         *
         * @param  {Object} vm The table view model
         */
        function updatePage(vm) {
            var haveFreeSlot = function () {
                var res = vm.occupiedSlots < tableConstants.MAX_CONCURENT_REQUEST;
                if (!res) {
                    $log.debug("No free slot available.");
                }
                return res;
            };

            if (!haveFreeSlot()) {
                return;
            }

            // update the resultset
            if (vm.dirtyResult) {
                vm.occupiedSlots++;
                vm.dirtyResult = false;

                var afterUpdateResult = function (res) {
                    if (res) {
                        // we got the results, let's just update the url
                        $rootScope.$emit('reference-modified');
                    }
                    vm.occupiedSlots--;
                    vm.dirtyResult = !res;
                    $log.debug("after result update: " + (res ? "successful." : "unsuccessful."));
                };

                $log.debug("updating result");
                updateResult(vm).then(function (res) {
                    afterUpdateResult(res);
                    updatePage(vm);
                }).catch(function (err) {
                    afterUpdateResult(true);
                    throw err;
                });
            }

            // update the facets
            if (vm.facetsToInitialize.length === 0) {
                vm.facetModels.forEach(function (fm, index) {
                    if (fm.processed || !haveFreeSlot()) {
                        return;
                    }

                    vm.occupiedSlots++;
                    fm.processed = true;

                    var afterFacetUpdate = function (i, res, hasError) {
                        vm.occupiedSlots--;
                        var currFm = vm.facetModels[i];
                        currFm.initialized = res || currFm.initialized;
                        currFm.isLoading = !res;
                        currFm.processed = res || currFm.processed;

                        $log.debug("after facet (index="+i+") update: " + (res ? "successful." : "unsuccessful."));
                    };

                    (function (i) {
                        $log.debug("updating facet (index="+i+")");
                        vm.facetModels[i].updateFacet().then(function (res) {
                            afterFacetUpdate(i, res);
                            updatePage(vm);
                        }).catch(function (err) {
                            afterFacetUpdate(i, false);
                            throw err;
                        });
                    })(index);
                });
            }
            // initialize facets
            else if (haveFreeSlot()){
                vm.occupiedSlots++;
                var index = vm.facetsToInitialize.shift();
                (function (i) {
                    $log.debug("initializing facet (index="+index+")");
                    vm.facetModels[i].initializeFacet().then(function (res) {
                        $log.debug("after facet (index="+ i +") initialize: " + (res ? "successful." : "unsuccessful."));
                        vm.occupiedSlots--;
                        updatePage(vm);
                    }).catch(function (err) {
                        throw err;
                    });
                })(index);
            }

            // update the count
            if (vm.config.hideTotalCount) {
                vm.totalRowsCnt = null;
            } else if (vm.dirtyCount && haveFreeSlot()) {
                vm.occupiedSlots++;
                vm.dirtyCount = false;

                var afterUpdateCount = function (res, hasError) {
                    vm.occupiedSlots--;
                    vm.dirtyCount = !res;
                    $log.debug("after count update: " + (res ? "successful." : "unsuccessful."));
                };

                $log.debug("updating count");
                updateCount(vm).then(function (res) {
                    afterUpdateCount(res);
                    updatePage(vm);
                }).catch(function (err) {
                    afterUpdateCount(true);
                    throw err;
                });
            }
        }

        function registerTableCallbacks(scope) {
            var callOnRowClick = function (scope, tuples, isSelected) {
                if (scope.onRowClickBind) {
                    scope.onRowClickBind()(tuples, isSelected);
                } else if (scope.onRowClick) {
                    scope.onRowClick()(tuples, isSelected);
                }
            }

            scope.noSelect = modalBox.noSelect;
            scope.singleSelect = modalBox.singleSelectMode;
            scope.multiSelect = modalBox.multiSelectMode;

            scope.$root.checkReferenceURL = function (ref) {
                var refUri = ref.isAttributeGroup ? ref.uri : ref.location.ermrestUri;
                if (refUri.length > tableConstants.MAX_URL_LENGTH) {
                    $timeout(function () {
                        $window.scrollTo(0, 0);
                    }, 0);
                    AlertsService.addAlert('Maximum URL length reached. Cannot perform the requested action.', 'warning');
                    return false;
                }
                return true;
            };

            var changeSort = function (sortOrder, sortBy) {
                if (sortBy) {
                    scope.vm.sortby = sortBy;
                }
                scope.vm.sortOrder = sortOrder;
                var ref = scope.vm.reference.sort([{"column":scope.vm.sortby, "descending":(scope.vm.sortOrder === "desc")}]);

                if (scope.$root.checkReferenceURL(ref)) {
                    scope.vm.reference = ref;
                    scope.vm.logObject = {
                        action: logActions.recordsetSort,
                        sort: ref.location.sortObject
                    };

                    if (scope.vm.showFaceting === true) {
                        update(scope.vm, true, false, false);
                    } else {
                        read(scope);
                    }
                }
            };

            scope.sortby = function(column) {
                if (scope.vm.sortby !== column) {
                    changeSort("asc", column);
                }
            };

            scope.toggleSortOrder = function () {
                changeSort((scope.vm.sortOrder === 'asc' ? scope.vm.sortOrder = 'desc' : scope.vm.sortOrder = 'asc'));
            };

            scope.isDisabled = function (tuple) {
                if (tuple) {
                    if (!scope.vm.disabledRows || scope.vm.disabledRows.length == 0) {
                        return false;
                    }

                    return scope.vm.disabledRows.findIndex(function (obj) {
                        return obj.uniqueId == tuple.uniqueId;
                    }) > -1;
                }
            };

            // verifies whether or not the current key value is in the set of selected rows or not
            scope.isSelected = function (tuple) {
                var index = scope.vm.selectedRows.findIndex(function (obj) {
                    return obj.uniqueId == tuple.uniqueId;
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

                    if (scope.isDisabled(tuple)) continue;

                    if (!scope.isSelected(tuple)) {
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

            scope.$on('record-deleted', function() {
                console.log('catching the record deleted');
                // if there is a parent reference then this is for related
                if (scope.parentReference) {
                    scope.vm.logObject = {action: logActions.recordRelatedUpdate};
                } else {
                    scope.vm.logObject = {action: logActions.recordsetUpdate};
                }
                read(scope);
            });
        }

        function registerRecordsetCallbacks(scope) {
            scope.defaultDisplayname = defaultDisplayname;

            var addRecordRequests = {}; // table refresh used by add record implementation with cookie (old method)
            var updated = false; // table refresh used by ellipses' edit action (new method)

            scope.pageLimits = [10, 25, 50, 75, 100, 200];
            scope.vm.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

            scope.vm.backgroundSearchPendingTerm = null;
            scope.vm.currentPageSelected = false;
            scope.$root.showSpinner = false; // this property is set from common modules for controlling the spinner at a global level that is out of the scope of the app
            //TODO this is forced here
            scope.vm.showFaceting = false;

            scope.unfiltered = function () {
                scope.vm.reference = scope.vm.reference.unfilteredReference.contextualize.compact;
                scope.vm.filterString = null;
                scope.vm.logObject = {action: logActions.recordsetFacet};
                read(scope, false, true);
            };

            scope.setPageLimit = function(limit) {
                scope.vm.pageLimit = limit;
                scope.vm.logObject = {action: logActions.recordsetLimit};
                read(scope);
            };

            scope.before = function() {
                var previous = scope.vm.page.previous;
                if (previous) {
                    scope.vm.reference = previous;
                    scope.vm.logObject = {
                        action: logActions.recordsetPage,
                        sort: previous.location.sortObject,
                        page: previous.location.beforeObject,
                        type: "before"
                    };
                    read(scope);

                }
            };

            scope.after = function() {
                var next = scope.vm.page.next;
                if (next) {
                    scope.vm.reference = next;
                    scope.vm.logObject = {
                        action: logActions.recordsetPage,
                        sort: next.location.sortObject,
                        page: next.location.afterObject,
                        type: "after"
                    };
                    read(scope);
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
                    }, tableConstants.AUTO_SEARCH_TIMEOUT);
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
                scope.vm.logObject = {action: logActions.recordsetFacet};
                read(scope, isBackground, true);
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
                    if (scope.parentReference) {
                        scope.vm.logObject = {action: logActions.recordRelatedUpdate};
                    } else {
                        scope.vm.logObject = {action: logActions.recordsetUpdate};
                    }
                    read(scope);
                }

            };

            // allow child window to call to indicate table has been updated
            // called from form.controller.js to communicate that an entity was just updated
            window.updated = function() {
                updated = true;
            };

            scope.$on('data-modified', function($event) {
                console.log('data-modified in recordset directive, getting count');
                if (!scope.vm.config.hideTotalCount && scope.vm.search == scope.vm.reference.location.searchTerm) {
                    // get the total row count to display above the table
                    console.log("Data-updated: ", scope.vm);
                    scope.vm.reference.getAggregates(
                        [scope.vm.reference.aggregate.countAgg],
                        {action: logActions.recordsetCount}
                    ).then(function (response) {
                        // NOTE: scenario: A user triggered a foreground search. Once it returns the aggregate count request is queued.
                        // While that request is running, the user triggers another foreground search.
                        // How do we avoid one aggregate count query to not show when it isn't relevant to the displayed data?
                        // Maybe comparing reference.location.searchTerm and vm.search here instead and if they don't match,
                        // set the value to null so the count displayed is just the count of the shown rows until the latter
                        // aggregate count request returns. If the latter one never returns (because of a server error or something),
                        // at least the UI doesn't show any misleading information.
                        scope.vm.totalRowsCnt = response[0];
                    }, function error(response) {
                        //fail silently
                        scope.vm.totalRowsCn = null;
                    });
                }
            });

            // row data has been modified (from ellipses)
            // do a read
            scope.$on('record-modified', function($event) {
                console.log('record-modified in recordset directive');
                if (scope.parentReference) {
                    scope.vm.logObject = {action: logActions.recordRelatedUpdate};
                } else {
                    scope.vm.logObject = {action: logActions.recordsetUpdate};
                }
                read(scope, false, true);
                // $event.stopPropagation();
            });
        }

        return {
            read: read,
            initialize: initialize,
            update: update,
            updatePage: updatePage,
            registerTableCallbacks: registerTableCallbacks,
            registerRecordsetCallbacks: registerRecordsetCallbacks
        };
    }])

    .directive('recordTable', ['recordTableUtils', function(recordTableUtils) {

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
                onRowClick: '&?',      // set row click function
                parentReference: "=?" // if this is used for related references, this will be the main reference
            },
            link: function (scope, elem, attr) {
                recordTableUtils.registerTableCallbacks(scope);
            }
        };
    }])

    .directive('recordTableSelectFaceting', ['recordTableUtils', function (recordTableUtils) {
        return {
            restrict: "E",
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
                recordTableUtils.registerTableCallbacks(scope);

                scope.isSelected = function (tuple) {
                    if (scope.vm.matchNotNull) {
                        return false;
                    }
                    var index = scope.vm.selectedRows.findIndex(function (obj) {
                        return obj.uniqueId == tuple.uniqueId;
                    });
                    return (index > -1);
                };

                scope.isDisabled = function (tuple) {
                    if (scope.vm.matchNotNull) {
                        return true;
                    }
                    if (!scope.vm.disabledRows || scope.vm.disabledRows.length == 0) {
                        return false;
                    }

                    return scope.vm.disabledRows.findIndex(function (obj) {
                        return obj.uniqueId == tuple.uniqueId;
                    }) > -1;
                };

            }
        }
    }])

    .directive('recordList', ['recordTableUtils', 'defaultDisplayname', '$timeout', function(recordTableUtils, defaultDisplayname, $timeout) {

        return {
            restrict: 'E',
            templateUrl: '../common/templates/list.html',
            scope: {
                initialized: '=?',
                onRowClick: '=',
                rows: '=' // each row: {uniqueId, displayname, count, selected}
            },
            link: function (scope, elem, attr) {
                scope.defaultDisplayname = defaultDisplayname;

                scope.onSelect = function (row, $event) {
                    row.selected = !row.selected;
                    scope.onRowClick(row, $event);
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

    .directive('recordset', ['recordTableUtils', function(recordTableUtils) {

        return {
            restrict: 'E',
            templateUrl: "../common/templates/recordset.html",
            scope: {
                mode: "=?",
                vm: '=',
                onRowClick: '&?',       // set row click function
                allowCreate: '=?',      // if undefined, assume false
                getDisabledTuples: "=?" // callback to get the disabled tuples
            },
            link: function (scope, elem, attr) {
                recordTableUtils.registerRecordsetCallbacks(scope);
            }
        };
    }])

    .directive('recordsetSelectFaceting', ['recordTableUtils', function(recordTableUtils) {

        return {
            restrict: 'E',
            templateUrl: "../common/templates/recordsetSelectFaceting.html",
            scope: {
                mode: "=?",
                vm: '=',
                onRowClick: '&?',       // set row click function
                allowCreate: '=?',      // if undefined, assume false
                getDisabledTuples: "=?" // callback to get the disabled tuples
            },
            link: function (scope, elem, attr) {
                recordTableUtils.registerRecordsetCallbacks(scope);

                // function for removing a single pill and it's corresponding selected row
                scope.removePill = function(key) {
                    if (scope.vm.matchNotNull) {
                        scope.vm.matchNotNull = false;
                        scope.vm.selectedRows.clear();
                        return;
                    }
                    var index = scope.vm.selectedRows.findIndex(function (obj) {
                        return obj.uniqueId == key;
                    });
                    scope.vm.selectedRows.splice(index, 1);
                };

                // function for removing all pills regardless of what page they are on, clears the whole selectedRows array
                scope.removeAllPills = function() {
                    if (scope.vm.matchNotNull) {
                        scope.vm.matchNotNull = false;
                        scope.vm.selectedRows.clear();
                        return;
                    }
                    scope.vm.selectedRows.clear();
                    scope.vm.currentPageSelected = false;
                };

                scope.toggleMatchNotNull = function () {
                    scope.vm.matchNotNull = !scope.vm.matchNotNull;
                    if (scope.vm.matchNotNull) {
                        scope.vm.selectedRows = [{
                            isNotNull: true,
                            displayname: {"value": scope.defaultDisplayname.notNull, "isHTML": true}
                        }];
                    } else {
                        scope.vm.selectedRows.clear();
                    }
                };
            }
        };
    }])

    //TODO This is used in recrodset app, eventually it should be used everywhere
    .directive('recordsetWithFaceting', ['recordTableUtils', '$window', '$cookies', 'DataUtils', 'MathUtils', 'UriUtils', '$timeout', 'AlertsService', '$log', 'tableConstants', 'defaultDisplayname', 'logActions',
        function(recordTableUtils, $window, $cookies, DataUtils, MathUtils, UriUtils, $timeout, AlertsService, $log, tableConstants, defaultDisplayname, logActions) {

        return {
            restrict: 'E',
            templateUrl: '../common/templates/recordsetWithFaceting.html',
            scope: {
                vm: '=',
                onRowClick: '&?',       // set row click function
                allowCreate: '=?'       // if undefined, assume false
            },
            link: function (scope, elem, attr) {
                var addRecordRequests = {}; // table refresh used by add record implementation with cookie (old method)
                var updated = false; // table refresh used by ellipses' edit action (new method)

                scope.pageLimits = [10, 25, 50, 75, 100, 200];
                scope.$root.alerts = AlertsService.alerts;
                scope.$root.showSpinner = false; // this property is set from common modules for controlling the spinner at a global level that is out of the scope of the app
                scope.vm.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

                scope.defaultDisplayname = defaultDisplayname;

                scope.vm.isIdle = true;
                scope.vm.facetModels = [];
                scope.vm.dirtyResult = false;
                scope.vm.occupiedSlots = 0;
                scope.vm.facetsToInitialize = [];
                scope.vm.showFaceting = scope.vm.config.showFaceting;
                scope.$root.facetPanelOpen = scope.vm.config.facetPanelOpen;

                scope.setPageLimit = function(limit) {
                    scope.vm.pageLimit = limit;

                    scope.vm.logObject = {action: logActions.recordsetLimit};
                    recordTableUtils.update(scope.vm, true, false, false);
                };

                scope.before = function() {
                    var previous = scope.vm.page.previous;
                    if (previous && scope.$root.checkReferenceURL(previous)) {
                        scope.vm.reference = previous;
                        $log.debug('going to previous page. updating..');

                        scope.vm.logObject = {
                            action: logActions.recordsetPage,
                            sort: previous.location.sortObject,
                            page: previous.location.beforeObject,
                            type: "before"
                        };
                        recordTableUtils.update(scope.vm, true, false, false);
                    }
                };

                scope.after = function() {
                    var next = scope.vm.page.next;
                    if (next && scope.$root.checkReferenceURL(next)) {
                        scope.vm.reference = next;
                        $log.debug('going to next page. updating..');

                        scope.vm.logObject = {
                            action: logActions.recordsetPage,
                            sort: next.location.sortObject,
                            page: next.location.afterObject,
                            type: "after"
                        };
                        recordTableUtils.update(scope.vm, true, false, false);
                    }

                };

                scope.focusOnSearchInput = function () {
                    angular.element("#search-input.main-search-input").focus();
                };

                scope.inputChangedPromise = undefined;

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
                        if (scope.inputChangedPromise) {
                            $timeout.cancel(scope.inputChangedPromise);
                        }

                        // Wait for the user to stop typing for a second and then fire the search
                        scope.inputChangedPromise = $timeout(function() {
                            scope.inputChangedPromise = null;
                            scope.search(scope.vm.search);
                        }, tableConstants.AUTO_SEARCH_TIMEOUT);
                    }
                };

                scope.enterPressed = function() {
                    // Trigger search
                    scope.search(scope.vm.search);
                };

                scope.search = function(term) {

                    if (term) term = term.trim();

                    var ref = scope.vm.reference.search(term); // this will clear previous search first
                     if (scope.$root.checkReferenceURL(ref)) {
                         scope.vm.search = term;
                         scope.vm.reference = ref;
                         scope.vm.lastActiveFacet = -1;
                         scope.vm.logObject = {action: logActions.recordsetFacet};
                         $log.debug("search changed to `" + term + "`. updating..");
                         recordTableUtils.update(scope.vm, true, true, true);
                     }
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
                        $log.debug("fouced on page after change, updating...");
                        updated = false;
                        scope.vm.lastActiveFacet = -1;
                        if (scope.parentReference) {
                            scope.vm.logObject = {action: logActions.recordRelatedUpdate};
                        } else {
                            scope.vm.logObject = {action: logActions.recordsetUpdate};
                        }
                        recordTableUtils.update(scope.vm, true, true, true);
                    }

                };

                // allow child window to call to indicate table has been updated
                // called from form.controller.js to communicate that an entity was just updated
                window.updated = function() {
                    updated = true;
                };

                scope.$on('facet-modified', function ($event) {
                    $log.debug("-----------------------------");
                    $log.debug('facet-modified in recordset directive');
                    scope.vm.logObject = {action: logActions.recordsetFacet};
                    recordTableUtils.update(scope.vm, true, true, true);
                });

                scope.$on('record-deleted', function ($event) {
                    $log.debug("-----------------------------");
                    $log.debug('record-deleted in recordset directive');
                    scope.vm.lastActiveFacet = -1;
                    scope.vm.logObject = {action: logActions.recordsetUpdate};
                    recordTableUtils.update(scope.vm, true, true, true);
                });

                // This is not used now, but we should change the record-deleted to this.
                // row data has been modified (from ellipses) do read
                scope.$on('record-modified', function($event) {
                    $log.debug("-----------------------------");
                    $log.debug('record-modified in recordset directive');
                    scope.vm.lastActiveFacet = -1;
                    scope.vm.logObject = {action: logActions.recordsetUpdate};
                    recordTableUtils.update(scope.vm, true, true, true);
                });

                // if faceting is visible, register a watch that relies on facets loading
                if (chaiseConfig.showFaceting) {
                    scope.$watch(function () {
                        return scope.$root.pageLoaded && (scope.$root.facetsLoaded || scope.vm.reference.facetColumns.length == 0);
                    }, function (newValue, oldValue) {
                        if(angular.equals(newValue, oldValue) || !newValue){
                            return;
                        }

                        $timeout(function() {
                            // NOTE
                            // This order is very important, the ref.facetColumns is going to change the
                            // location, so we should call read after that.
                            // TODO BUT WE SHOULD DO SOMETHING ABOUT IT IN ERMRESTJS
                            if (scope.vm.reference.facetColumns.length > 0) {
                                var firstOpen = -1;
                                // create the facetsToInitialize and also open facets
                                scope.vm.reference.facetColumns.forEach(function (fc, index) {
                                    if (fc.isOpen) {
                                        firstOpen = (firstOpen == -1 || firstOpen > index) ? index : firstOpen;
                                        scope.vm.facetsToInitialize.push(index);
                                        scope.vm.facetModels[index].processed = false;
                                        scope.vm.facetModels[index].isOpen = true;
                                        scope.vm.facetModels[index].isLoading = true;
                                    }
                                });

                                firstOpen = (firstOpen !== -1) ? firstOpen : 0;
                                scope.vm.focusOnFacet(firstOpen);
                            }

                            scope.vm.logObject = {action: logActions.recordsetLoad};
                            recordTableUtils.initialize(scope.vm);
                        });
                    });
                // for deployments that won't use faceting
                } else {
                    scope.$watch(function () {
                        return scope.$root.pageLoaded
                    }, function (newValue, oldValue) {
                        if (newValue) {
                            $timeout(function () {
                                scope.vm.logObject = {action: logActions.recordsetLoad};
                                recordTableUtils.initialize(scope.vm);
                            });
                        }
                    });
                }
            }
        };
    }]);
})();
