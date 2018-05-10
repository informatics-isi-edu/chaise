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

        function haveFreeSlot() {
            var res = $rootScope.occupiedSlots < tableConstants.MAX_CONCURENT_REQUEST;
            if (!res) {
                $log.debug("No free slot available.");
            }
            return res;
        }

        function updateColumnAggregates(vm, updatePageCB, logObject, hideSpinner) {
            if (!vm.hasLoaded || !Array.isArray(vm.aggregatesToInitialize)) return;
            while (vm.aggregatesToInitialize.length > 0) {
                if (!haveFreeSlot()) {
                    return;
                }

                $rootScope.occupiedSlots++;
                (function (i, current) {
                    $log.debug("getting aggregated values for column (index=" + i + ")");
                    updateColumnAggregate(vm, i, current, logObject, hideSpinner).then(function (res) {
                        afterUpdateColumnAggregate(res, i, vm);
                        updatePageCB(vm);
                    }).catch(function (err) {
                        afterUpdateColumnAggregate(false, i, vm);
                        throw err;
                    });
                })(vm.aggregatesToInitialize.shift(), $rootScope.counter);
            }
        }

        function updateColumnAggregate(vm, colIndex, current, logObject, hideSpinner) {
            var defer = $q.defer();
            vm.columnModels[colIndex].isLoading = !hideSpinner;
            logObject = logObject || {action: logActions.recordsetAggregate};
            logObject.colIndex = colIndex;

            vm.columnModels[colIndex].column.getAggregatedValue(vm.page, logObject).then(function (values) {
                if ($rootScope.counter !== current) {
                    return defer.resolve(false);
                }
                vm.columnModels[colIndex].isLoading = false;
                vm.rowValues.forEach(function (val, index) {
                    vm.rowValues[index][colIndex] = values[index];
                });
                return defer.resolve(true);
            }).catch(function (err) {
                if ($rootScope.counter !== current) {
                    return defer.resolve(false);
                }
                return defer.reject(err);
            });

            return defer.promise;
        }

        function afterUpdateColumnAggregate(res, colIndex, vm) {
            $rootScope.occupiedSlots--;
            $log.debug("after aggregated value for column (index=" + colIndex + ") update: " + (res? "successful." : "unsuccessful."));
        }

        function updateMainEntity(vm, updatePageCB, hideSpinner) {
            if (!vm.dirtyResult || !haveFreeSlot()) return;

            $rootScope.occupiedSlots++;
            vm.dirtyResult = false;

            var afterUpdateResult = function (res) {
                if (res) {
                    // we got the results, let's just update the url
                    $rootScope.$emit('reference-modified');
                }
                $rootScope.occupiedSlots--;
                vm.dirtyResult = !res;
                $log.debug("after result update: " + (res ? "successful." : "unsuccessful."));
            };

            $log.debug("updating result");
            readMainEntity(vm, hideSpinner).then(function (res) {
                afterUpdateResult(res);
                updatePageCB(vm);
            }).catch(function (err) {
                afterUpdateResult(true);
                throw err;
            });
        }

        function readMainEntity (vm, hideSpinner) {
            vm.dirtyResult = false;
            vm.hasLoaded = false;
            var defer = $q.defer();
            (function (current) {
                vm.reference.read(vm.pageLimit, vm.logObject).then(function (page) {
                    if (current !== $rootScope.counter) {
                        defer.resolve(false);
                        return defer.promise;
                    }

                    vm.page = page;

                    return vm.getDisabledTuples ? vm.getDisabledTuples(page, vm.pageLimit) : '';
                }).then(function (rows) {
                    if (rows) vm.disabledRows = rows;
                    vm.rowValues = DataUtils.getRowValuesFromPage(vm.page);
                    vm.hasLoaded = true;
                    vm.initialized = true;
                    vm.aggregatesToInitialize = [];
                    vm.reference.columns.forEach(function (c, i) {
                        if(c.isPathColumn && c.hasAggregate) {
                            vm.aggregatesToInitialize.push(i);
                        }
                    });

                    defer.resolve(true);
                }).catch(function(err) {
                    if (current !== $rootScope.counter) {
                        return defer.resolve(false);
                    }

                    vm.hasLoaded = true;
                    vm.initialized = true;
                    if (DataUtils.isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
                      err.errorData.redirectUrl = UriUtils.createRedirectLinkFromPath(err.errorData.redirectPath);
                    }
                    defer.reject(err);
                });
            }) ($rootScope.counter);
            return defer.promise;
        }

        function updateCount (vm) {
            var  defer = $q.defer();
            (function (current) {
                var aggList, hasError;
                try {
                    // if the table doesn't have any simple key, this might throw error
                    aggList = [vm.reference.aggregate.countAgg];
                } catch (exp) {
                    hasError = true;
                }
                if (hasError) {
                    vm.totalRowsCnt = null;
                    defer.resolve(true);
                    return defer.promise;
                }

                vm.reference.getAggregates(
                    aggList,
                    {action: logActions.recordsetCount}
                ).then(function getAggregateCount(response) {
                    if (current !== $rootScope.counter) {
                        defer.resolve(false);
                        return defer.promise;
                    }

                    vm.totalRowsCnt = response[0];
                    defer.resolve(true);
                }).catch(function (err) {
                    if (current !== $rootScope.counter) {
                        defer.resolve(false);
                        return defer.promise;
                    }

                    // fail silently
                    vm.totalRowsCnt = null;
                });
            })($rootScope.counter);
            return defer.promise;
        }

        function initialize (vm) {
            vm.search = vm.reference.location.searchTerm;
            vm.initialized = false;
            vm.dirtyResult = true;
            vm.dirtyCount = true;
            $rootScope.counter = 0;

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
                $rootScope.counter++;
                $log.debug("adding one to counter: " + $rootScope.counter);
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
            if (!haveFreeSlot()) {
                return;
            }

            // update the resultset
            updateMainEntity(vm, updatePage);

            // get the aggregate values only if main page is loaded
            updateColumnAggregates(vm, updatePage);

            // update the facets
            if (vm.facetModels) {
                if (vm.facetsToInitialize.length === 0) {
                    vm.facetModels.forEach(function (fm, index) {
                        if (fm.processed || !haveFreeSlot()) {
                            return;
                        }

                        $rootScope.occupiedSlots++;
                        fm.processed = true;

                        var afterFacetUpdate = function (i, res, hasError) {
                            $rootScope.occupiedSlots--;
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
                    $rootScope.occupiedSlots++;
                    var index = vm.facetsToInitialize.shift();
                    (function (i) {
                        $log.debug("initializing facet (index="+index+")");
                        vm.facetModels[i].initializeFacet().then(function (res) {
                            $log.debug("after facet (index="+ i +") initialize: " + (res ? "successful." : "unsuccessful."));
                            $rootScope.occupiedSlots--;
                            updatePage(vm);
                        }).catch(function (err) {
                            throw err;
                        });
                    })(index);
                }
            }

            // update the count
            if (vm.config.hideTotalCount) {
                vm.totalRowsCnt = null;
            } else if (vm.dirtyCount && haveFreeSlot()) {
                $rootScope.occupiedSlots++;
                vm.dirtyCount = false;

                var afterUpdateCount = function (res, hasError) {
                    $rootScope.occupiedSlots--;
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

        function attachExtraAttributes(vm) {
            vm.columnModels = [];
            vm.reference.columns.forEach(function (col) {
                vm.columnModels.push({
                    column: col
                });
            });

            // only allowing single column sort here
            var location = vm.reference.location;
            if (location.sortObject) {
                vm.sortby = location.sortObject[0].column;
                vm.sortOrder = (location.sortObject[0].descending ? "desc" : "asc");
            }
        }

        function registerTableCallbacks(scope) {
            if (!scope.vm) scope.vm = {};

            if (!DataUtils.isInteger($rootScope.occupiedSlots)) {
                $rootScope.occupiedSlots = 0;
            }
            if (!DataUtils.isInteger($rootScope.counter)) {
                $rootScope.counter = 0;
            }

            var callOnRowClick = function (scope, tuples, isSelected) {
                if (scope.onRowClickBind) {
                    scope.onRowClickBind()(tuples, isSelected);
                } else if (scope.onRowClick) {
                    scope.onRowClick()(tuples, isSelected);
                }
            };

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

                    update(scope.vm, true, false, false);
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
                if (!tuple) return false;
                if (!scope.vm.disabledRows || scope.vm.disabledRows.length == 0) {
                    return false;
                }

                return scope.vm.disabledRows.findIndex(function (obj) {
                    return obj.uniqueId == tuple.uniqueId;
                }) > -1;
            };

            // verifies whether or not the current key value is in the set of selected rows or not
            scope.isSelected = function (tuple) {
                if (!tuple) return false;
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
                update(scope.vm, true, false, false);
            });

            scope.$watch(function () {
                return (scope.vm && scope.vm.reference) ? scope.vm.reference.columns : null;
            }, function (newValue, oldValue) {
                if(angular.equals(newValue, oldValue) || !newValue){
                    return;
                }
                attachExtraAttributes(scope.vm);
            });

            if (scope.vm && scope.vm.reference) {
                attachExtraAttributes(scope.vm);
            }
        }

        function registerRecordsetCallbacks(scope) {
            if (!DataUtils.isInteger($rootScope.occupiedSlots)) {
                $rootScope.occupiedSlots = 0;
            }
            if (!DataUtils.isInteger($rootScope.counter)) {
                $rootScope.counter = 0;
            }

            var addRecordRequests = {}; // table refresh used by add record implementation with cookie (old method)
            var updated = false; // table refresh used by ellipses' edit action (new method)

            scope.pageLimits = [10, 25, 50, 75, 100, 200];
            scope.$root.alerts = AlertsService.alerts;
            scope.$root.showSpinner = false; // this property is set from common modules for controlling the spinner at a global level that is out of the scope of the app
            scope.vm.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

            scope.defaultDisplayname = defaultDisplayname;

            scope.vm.isIdle = true;
            scope.vm.facetModels = [];
            scope.vm.facetsToInitialize = [];

            scope.setPageLimit = function(limit) {
                scope.vm.pageLimit = limit;

                scope.vm.logObject = {action: logActions.recordsetLimit};
                update(scope.vm, true, false, false);
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
                    update(scope.vm, true, false, false);
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
                    update(scope.vm, true, false, false);
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
                scope.inputChangedPromise = null;
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
                     update(scope.vm, true, true, true);
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
                    update(scope.vm, true, true, true);
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
                update(scope.vm, true, true, true);
            });

            scope.$on('record-deleted', function ($event) {
                $log.debug("-----------------------------");
                $log.debug('record-deleted in recordset directive');
                scope.vm.lastActiveFacet = -1;
                scope.vm.logObject = {action: logActions.recordsetUpdate};
                update(scope.vm, true, true, true);
            });

            // This is not used now, but we should change the record-deleted to this.
            // row data has been modified (from ellipses) do read
            scope.$on('record-modified', function($event) {
                $log.debug("-----------------------------");
                $log.debug('record-modified in recordset directive');
                scope.vm.lastActiveFacet = -1;
                scope.vm.logObject = {action: logActions.recordsetUpdate};
                update(scope.vm, true, true, true);
            });

            scope.$watch(function () {
                return (scope.vm && scope.vm.reference) ? scope.vm.reference.columns : null;
            }, function (newValue, oldValue) {
                if(angular.equals(newValue, oldValue) || !newValue){
                    return;
                }
                attachExtraAttributes(scope.vm);
            });

            scope.$on('facetsLoaded', function () {
                scope.facetsLoaded = true;
            });

            var recordsetReadyToInitialize = function (scope) {
                return scope.vm.readyToInitialize && (scope.facetsLoaded || (scope.vm.reference && scope.vm.reference.facetColumns && scope.vm.reference.facetColumns.length === 0));
            };

            // initialize the recordset
            var initializeRecordset = function (scope) {
                $timeout(function() {
                    // NOTE
                    // This order is very important, the ref.facetColumns is going to change the
                    // location, so we should call read after that.
                    if (!scope.ignoreFaceting && scope.vm.reference.facetColumns.length > 0) {
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
                    initialize(scope.vm);
                });
            };

            // initialize the recordset when it's ready to be initialized
            scope.$watch(function () {
                return recordsetReadyToInitialize(scope);
            }, function (newValue, oldValue) {
                if(angular.equals(newValue, oldValue) || !newValue){
                    return;
                }
                initializeRecordset(scope);
            });

            // we might be able to initialize the recordset when it's loading
            if (recordsetReadyToInitialize(scope)) {
                initializeRecordset(scope);
            }
        }

        return {
            initialize: initialize,
            update: update,
            updateColumnAggregates: updateColumnAggregates,
            updateMainEntity: updateMainEntity,
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
                    if (!tuple) return false;
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
                    if (!tuple) return false;
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

    .directive('recordsetSelectFaceting', ['recordTableUtils', function(recordTableUtils) {

        return {
            restrict: 'E',
            templateUrl: "../common/templates/recordsetSelectFaceting.html",
            scope: {
                mode: "=?",
                vm: '=',
                onRowClick: '&?',       // set row click function
                allowCreate: '=?',      // if undefined, assume false
                getDisabledTuples: "=?", // callback to get the disabled tuples
                registerSetPageState: "&?"
            },
            link: function (scope, elem, attr) {
                // currently faceting is not defined in this mode.
                // TODO We should eventually add faceting here, and remove these initializations
                scope.facetsLoaded = true;
                scope.ignoreFaceting = true; // this is a temporary flag to avoid any faceting logic

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

    .directive('recordset', ['recordTableUtils', function(recordTableUtils) {

        return {
            restrict: 'E',
            templateUrl: '../common/templates/recordset.html',
            scope: {
                vm: '=',
                onRowClick: '&?',       // set row click function
                allowCreate: '=?',       // if undefined, assume false
                registerSetPageState: "&?"
            },
            link: function (scope, elem, attr) {
                recordTableUtils.registerRecordsetCallbacks(scope);
            }
        };
    }]);
})();
