(function () {
    'use strict';

    angular.module('chaise.record.table', ['chaise.ellipses', 'chaise.utils'])

    .constant('tableConstants', {
        MAX_CONCURENT_REQUEST: 4,
        MAX_URL_LENGTH: 2000,
        PAGE_SIZE: 11, // one is not-null
        AUTO_SEARCH_TIMEOUT: 2000,
        CELL_LIMIT: 500
    })

    /**
     * Ways to use recordTable directive:
     *
     * 1. Table only
     *    <record-table vm="vm"></record-table>
     *
     * 2. Selectable table only with select function
     *    <record-table vm="vm" on-selected-rows-changed="gotoRowLink(tuple)"></record-table>
     *
     * 3. Table with search, page size, previous/next
     *    <recordset vm="vm"></recordset>
     *
     * 4. Selectable table with search, page size, previous/next
     *    <recordset vm="vm" on-selected-rows-changed="gotoRowLink(tuple)"></recordset>
     *
     * These are recordset and record-table directive parameters:
     * - onSelectedRowsChanged(tuple, isSelected):
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
     *
     */
    .factory('recordTableUtils',
            ['AlertsService', '$document', 'modalBox', 'DataUtils', '$timeout','Session', '$q', 'tableConstants', '$rootScope', '$log', '$window', '$cookies', 'defaultDisplayname', 'MathUtils', 'UriUtils', 'logActions',
            function(AlertsService, $document, modalBox, DataUtils, $timeout, Session, $q, tableConstants, $rootScope, $log, $window, $cookies, defaultDisplayname, MathUtils, UriUtils, logActions) {

        function FlowControlObject(maxRequests) {
            this.maxRequests = maxRequests || tableConstants.MAX_CONCURENT_REQUEST;
            this.occupiedSlots = 0;
            this.counter = 0;
        }

        /**
         * returns true if we have free slots for requests.
         * @return {boolean}
         */
        function _haveFreeSlot(vm, dontLog) {
            var res = vm.flowControlObject.occupiedSlots < vm.flowControlObject.maxRequests;
            if (!res && !dontLog) {
                $log.debug("No free slot available.");
            }
            return res;
        }

        /**
         * Given the tableModel object, will get value for the aggregate columns.
         * The updateMainEntity should be called on the tableModel before this function.
         * That function will generate `vm.page` and `vm.aggregatesToInitialize` which
         * are needed for this function.
         * @param  {object} vm           table model
         * @param  {function} updatePageCB The update page callback which we will call after getting each result.
         * @param  {object} logObject    The object that should be logged with the read request.
         * @param  {boolean} hideSpinner  Indicates whether we should show spinner for columns or not
         */
        function updateColumnAggregates(vm, updatePageCB, logObject, hideSpinner) {
            if (!vm.hasLoaded || !Array.isArray(vm.aggregatesToInitialize)) return;
            while (vm.aggregatesToInitialize.length > 0) {
                if (!_haveFreeSlot(vm)) {
                    return;
                }

                vm.flowControlObject.occupiedSlots++;
                (function (i, current) {
                    $log.debug("counter", current, ": getting aggregated values for column (index=" + i + ")");
                    _updateColumnAggregate(vm, i, current, logObject, hideSpinner).then(function (res) {
                        _afterUpdateColumnAggregate(vm, res, i);
                        updatePageCB(vm);
                    }).catch(function (err) {
                        _afterUpdateColumnAggregate(vm, false, i);
                        throw err;
                    });
                })(vm.aggregatesToInitialize.shift(), vm.flowControlObject.counter);
            }
        }

        /**
         * @private
         * Generate request for each individual aggregate columns. Will return
         * a promise that is resolved with a boolean value denoting the success or failure.
         */
        function _updateColumnAggregate(vm, colIndex, current, logObject, hideSpinner) {
            var defer = $q.defer();
            vm.columnModels[colIndex].isLoading = !hideSpinner;
            logObject = logObject || {action: logActions.recordsetAggregate};
            logObject.colIndex = colIndex;

            vm.columnModels[colIndex].column.getAggregatedValue(vm.page, logObject).then(function (values) {
                if (vm.flowControlObject.counter !== current) {
                    return defer.resolve(false);
                }
                vm.columnModels[colIndex].isLoading = false;
                vm.totalRowValues.forEach(function (val, index) {
                    vm.totalRowValues[index][colIndex] = values[index];
                });
                return defer.resolve(true);
            }).catch(function (err) {
                if (vm.flowControlObject.counter !== current) {
                    return defer.resolve(false);
                }
                return defer.reject(err);
            });

            return defer.promise;
        }

        /**
         * @private
         * This will be called after getting data for each of the aggregate columns
         */
        function _afterUpdateColumnAggregate(vm, res, colIndex) {
            vm.flowControlObject.occupiedSlots--;
            $log.debug("counter", vm.flowControlObject.counter, ": after aggregated value for column (index=" + colIndex + ") update: " + (res? "successful." : "unsuccessful."));
        }

        /**
         * Given the tableModel object, will get the values for main entity and
         * attach them to the model.
         * @param  {object} vm           table model
         * @param  {function} updatePageCB The update page callback which we will call after getting the result.
         * @param  {boolean} hideSpinner  Indicates whether we should show spinner for columns or not
         */
        function updateMainEntity(vm, updatePageCB, hideSpinner) {
            if (!vm.dirtyResult || !_haveFreeSlot(vm)) {
                $log.debug("break out of updateMainEntity: (not dirty or full)");
                return;
            }

            // to make sure we're sending one request at a time (no duplicate requests)
            // if counter is the same, then the reference is the same and there's no point in sending the request
            if (vm.lastMainRequestPending == vm.flowControlObject.counter) {
                $log.debug("break out of updateMainEntity (duplicate)");
                return;
            }

            vm.lastMainRequestPending = vm.flowControlObject.counter;

            vm.flowControlObject.occupiedSlots++;
            vm.dirtyResult = false;

            (function (currentCounter) {
                $log.debug("counter", currentCounter, ": updateMainEntity");
                _readMainEntity(vm, hideSpinner, currentCounter).then(function (res) {
                    _afterUpdateMainEntity(vm, res, currentCounter);
                    $log.debug("counter", currentCounter, ": after updateMainEntity, retry.");
                    updatePageCB(vm);
                }).catch(function (err) {
                    _afterUpdateMainEntity(vm, true, currentCounter);
                    throw err;
                });
            })(vm.flowControlObject.counter);
        }

        /**
         * @private
         * This will be called after updateMainEntity. which will set the flags
         * based on success or failure of request.
         */
        function _afterUpdateMainEntity(vm, res, counter) {
            if (res) {
                // we got the results, let's just update the url
                $rootScope.$emit('reference-modified');
            }
            vm.flowControlObject.occupiedSlots--;
            vm.dirtyResult = !res && !vm.dirtyResult;
            vm.hasLoaded = res;
            $log.debug("counter", counter, ": after updateMainEntity: " + (res ? "successful." : "unsuccessful."));
        }

        // comment $timeout why
        var pushMore;
        /**
         * @private
         * Does the actual read for the main entity. Returns a promise that will
         * be resolved with `true` if the request was successful.
         */
        function _readMainEntity (vm, hideSpinner, current) {
            $log.debug("counter", current, ": readMainEntity");
            if (!vm.columnModels) {
                _attachExtraAttributes(vm);
            }

            // cancel timeout loop that may still be running and hide the spinner and "Loading ..."
            $timeout.cancel(pushMore);
            vm.pushRowsSpinner = false;
            vm.dirtyResult = false;
            // vm.hasLoaded = false;
            var defer = $q.defer();
            vm.reference.read(vm.pageLimit, vm.logObject).then(function (page) {
                if (current !== vm.flowControlObject.counter) {
                    defer.resolve(false);
                    return defer.promise;
                }

                vm.page = page;

                return vm.getDisabledTuples ? vm.getDisabledTuples(page, vm.pageLimit) : '';
            }).then(function (rows) {
                if (current !== vm.flowControlObject.counter) {
                    defer.resolve(false);
                    return defer.promise;
                }

                if (rows) vm.disabledRows = rows;

                vm.totalRowValues = DataUtils.getRowValuesFromPage(vm.page);

                /*
                 * vm.rowValues is the object that will be used to show the resultset.
                 * vm.totalRowValues is all the row values which might be different from rowValues
                 * if We set vm.rowValues = rowValues, angularjs will try to show that
                 * object all at once. To show it, we're using recursive ng-repeats which
                 * is heavy and might be slow. To mitigate the issue, if number of cells is
                 * more than the limit (CELL_LIMIT), we're going to add the rows gradually.
                 * This was causing problems with the flow control. It's not part of flow control
                 * because flow control is supposed to deal with the requests to the server and not UI.
                 * But it relies on flow control, we should not push rows midway. We must be sure that
                 * we're calling _pushMoreRows for the final result and not any of the states in between.
                 * So we must always check for that in each cycle. To do so, we're generating a uuid at first.
                 * If the uuid changes, then we are aborting the addition of rows. The fact that uuid has changed,
                 * shows that a new request has been generated for the main entity and is trying to draw the rows.
                 */

                // calculate how many rows can be shown based on # of columns
                var rowLimit = Math.ceil(tableConstants.CELL_LIMIT/vm.page.reference.columns.length);

                // recursive function for adding more rows to the DOM
                function _pushMoreRows(prevInd, limit, pushMoreID) {
                    if ($rootScope.pushMoreID === pushMoreID) {
                        var nextLimit = prevInd + limit;
                        // combines all of the second array (vm.totalRowValues) with the first one (vm.rowValues)
                        Array.prototype.push.apply(vm.rowValues, vm.totalRowValues.slice(prevInd, nextLimit));
                        if (vm.totalRowValues[nextLimit]) {
                            $log.debug("counter", current, ": readMainEntity, recurse with", vm.rowValues.length);
                            $timeout(function () {
                                if ($rootScope.pushMoreID === pushMoreID) {
                                    _pushMoreRows(nextLimit, limit, pushMoreID);
                                } else {
                                    $log.debug(
                                        "counter", current,
                                        ": readMainEntity, break out of timeout inside push more rows (diff uuid)",
                                        "current uuid:", pushMoreID, "global uuid:", $rootScope.pushMoreID
                                    );
                                    vm.pushRowsSpinner = false;
                                }
                            });
                        } else {
                            // we reached the end of the data to page in
                            vm.pushRowsSpinner = false;
                        }
                    } else {
                        $log.debug(
                            "counter", current,
                            ": readMainEntity, break out of push more rows (diff uuid)",
                            "current uuid:", pushMoreID, "global uuid:", $rootScope.pushMoreID
                        );
                        vm.pushRowsSpinner = false;
                    }
                }

                $log.debug("counter", current, ": readMainEntity, row values length ", vm.totalRowValues.length);
                vm.rowValues = [];
                if (vm.totalRowValues.length > rowLimit) {
                    vm.pushRowsSpinner = true;
                    var uniqueIdentifier = $rootScope.pushMoreID = MathUtils.uuid();
                    $log.debug("counter", current, ": readMainEntity, before push more rows with uuid", uniqueIdentifier);
                    _pushMoreRows(0, rowLimit, uniqueIdentifier);
                } else {
                    vm.rowValues = vm.totalRowValues;
                }

                // vm.hasLoaded = true;
                vm.initialized = true;

                // create the array that will be used for getting result of aggregate columns.
                vm.aggregatesToInitialize = [];
                vm.reference.columns.forEach(function (c, i) {
                    if(c.isPathColumn && c.hasAggregate) {
                        vm.aggregatesToInitialize.push(i);
                    }
                });

                defer.resolve(true);
            }).catch(function(err) {
                if (current !== vm.flowControlObject.counter) {
                    return defer.resolve(false);
                }
                // vm.hasLoaded = true;
                vm.initialized = true;
                if (DataUtils.isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
                  err.errorData.redirectUrl = UriUtils.createRedirectLinkFromPath(err.errorData.redirectPath);
                }
                defer.reject(err);
            });
            return defer.promise;
        }

        /**
         * @private
         * will be called after getting data for each facet to set the flags.
         */
        function _afterFacetUpdate (vm, i, res) {
            vm.flowControlObject.occupiedSlots--;
            var currFm = vm.facetModels[i];
            currFm.initialized = res || currFm.initialized;
            currFm.isLoading = !res;
            currFm.processed = res || currFm.processed;

            $log.debug("after facet (index="+i+") update: " + (res ? "successful." : "unsuccessful."));
        }


        /**
         *  @private
         *  Updates the total count of rows that matches the reference
         */
        function _updateCount(vm, updatePageCB) {
            if (!vm.dirtyCount || !_haveFreeSlot(vm)) {
                $log.debug("break out of updateCount: (not dirty or full)");
                return;
            }

            // to make sure we're sending one request at a time (no duplicate requests)
            // if counter is the same, then the reference is the same and there's no point in sending the request
            if (vm.lastMainCountRequestPending == vm.flowControlObject.counter){
                $log.debug("break out of updateCount: (duplicate)");
                return;
            }

            vm.lastMainCountRequestPending = vm.flowControlObject.counter;
            vm.flowControlObject.occupiedSlots++;
            vm.dirtyCount = false;

            (function (curr) {
                _getRowsCount(vm, curr).then(function (res) {
                    _afterGetRowsCount(vm, res, curr);
                    _updatePage(vm);
                }).catch(function (err) {
                    _afterGetRowsCount(vm, true, curr);
                    throw err;
                });
            })(vm.flowControlObject.counter);
        }

        /**
         * @private
         * This will generate the request for getting the count.
         * Returns a promise. If it's resolved with `true` then it has been successful.
         */
        function _getRowsCount (vm, current) {
            $log.debug("counter", current, ": getRowsCount.");

            var  defer = $q.defer();
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
                if (current !== vm.flowControlObject.counter) {
                    defer.resolve(false);
                    return defer.promise;
                }

                vm.totalRowsCnt = response[0];
                defer.resolve(true);
            }).catch(function (err) {
                if (current !== vm.flowControlObject.counter) {
                    defer.resolve(false);
                    return defer.promise;
                }

                // fail silently
                vm.totalRowsCnt = null;
            });
            return defer.promise;
        }

        /**
         * @private
         * will be called after getting data for count to set the flags.
         */
        function _afterGetRowsCount (vm, res, current) {
            vm.flowControlObject.occupiedSlots--;
            vm.dirtyCount = !res;
            $log.debug("counter", current, ": after getRowsCount: " + (res ? "successful." : "unsuccessful."));
        }

        /**
         * This should be called to start the initialization of recordset page.
         * It will set the flags, and then call the actual update function.
         * @param  {object} vm the table model object
         */
        function initialize (vm) {
            vm.search = vm.reference.location.searchTerm;
            vm.initialized = false;
            vm.dirtyResult = true;
            vm.dirtyCount = true;
            vm.flowControlObject.counter = 0;

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
            // if the result is dirty, then we should get new data and we should
            // set the hasLoaded to false.
            vm.hasLoaded = !vm.dirtyResult;

            vm.dirtyCount = updateCount || vm.dirtyCount;

            $timeout(function () {
                vm.flowControlObject.counter++;
                $log.debug("\n=================\ncalling update page, with new counter=" + vm.flowControlObject.counter);
                $log.debug(vm.reference.location.ermrestCompactPath);
                _updatePage(vm);
            }, 0);
        }

        /**
         * Given the table model, it will update the page.
         * This is behaving as a flow control system, that allows only a Maximum
         * number of requests defined. Requests are generated in this order:
         *
         * 1. main entity
         * 2. aggregate columns
         * 3. facets
         * 4. total count
         *
         * @private
         * @param  {Object} vm The table view model
         */
        function _updatePage(vm) {
            $log.debug("counter", vm.flowControlObject.counter, ": updatePage");
            if (!_haveFreeSlot(vm)) {
                return;
            }

            // update the resultset
            updateMainEntity(vm, _updatePage);

            // get the aggregate values only if main page is loaded
            updateColumnAggregates(vm, _updatePage);

            // update the facets
            if (vm.facetModels) {
                if (vm.facetsToInitialize.length === 0) {
                    vm.facetModels.forEach(function (fm, index) {
                        if (fm.processed || !_haveFreeSlot(vm)) {
                            return;
                        }

                        vm.flowControlObject.occupiedSlots++;
                        fm.processed = true;

                        (function (i) {
                            $log.debug("counter", vm.flowControlObject.counter, ": updateFacet (index="+i+")");
                            vm.facetModels[i].updateFacet().then(function (res) {
                                _afterFacetUpdate(vm, i, res);
                                _updatePage(vm);
                            }).catch(function (err) {
                                _afterFacetUpdate(vm, i, false);
                                throw err;
                            });
                        })(index);
                    });
                }
                // initialize facets
                else if (_haveFreeSlot(vm)){
                    vm.flowControlObject.occupiedSlots++;
                    var index = vm.facetsToInitialize.shift();
                    (function (i) {
                        $log.debug("counter", vm.flowControlObject.counter, ": initializeFacet (index="+index+")");
                        vm.facetModels[i].initializeFacet().then(function (res) {
                            $log.debug("counter", vm.flowControlObject.counter, ": after facet (index="+ i +") initialize: " + (res ? "successful." : "unsuccessful."));
                            vm.flowControlObject.occupiedSlots--;
                            _updatePage(vm);
                        }).catch(function (err) {
                            throw err;
                        });
                    })(index);
                }
            }

            // update the count
            if (vm.config.hideTotalCount) {
                vm.totalRowsCnt = null;
            } else {
                _updateCount(vm, _updatePage);
            }
        }

        /**
         * @private
         * attaches the extra attributes to the vm object.
         * The issue is that when we're calling the directive, the tableModel.reference
         * might not be defined. Therefore the directive should work without those attributes.
         * But as soon as we attach those variables, we should update other attributes that are
         * relying on reference.
         * In this case, columnModels is the attribute that need to be updated.
         */
        function _attachExtraAttributes(vm) {
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

        function _callonSelectedRowsChanged (scope, tuples, isSelected) {
            if (scope.onSelectedRowsChangedBind) {
                return scope.onSelectedRowsChangedBind()(tuples, isSelected);
            } else if (scope.onSelectedRowsChanged) {
                return scope.onSelectedRowsChanged()(tuples, isSelected);
            }
        }

        /**
         * Scrolls the current container to top. The container
         * can be the modal-body or the main-container
         */
        function scrollToTop() {
            $timeout(function () {
                // if modal is open, scroll the modal to top
                var container = angular.element(".modal-body");
                if (container.length) {
                    container.scrollTo(0, 0, 100);
                }

                // otherwise scroll the main-container
                container = angular.element(".main-container");
                if (container.length) {
                    container.scrollTo(0, 0, 100);
                }
            }, 0);
        }

        /**
         * Registers the callbacks for recordTable directive and it's children.
         * @param  {object} scope the scope object
         */
        function registerTableCallbacks(scope, elem, attr) {
            if (!scope.vm) scope.vm = {};

            scope.noSelect = modalBox.noSelect;
            scope.singleSelect = modalBox.singleSelectMode;
            scope.multiSelect = modalBox.multiSelectMode;

            scope.$root.checkReferenceURL = function (ref) {
                var refUri = ref.isAttributeGroup ? ref.ermrestPath : ref.location.ermrestPath;
                if (refUri.length > tableConstants.MAX_URL_LENGTH) {

                    // show the alert (the function will handle just showing one alert)
                    AlertsService.addURLLimitAlert();

                    // scroll to top of the container so users can see the alert
                    scrollToTop();

                    // signal the caller that we reached the URL limit.
                    return false;
                }

                // remove the alert if it's present since we don't need it anymore
                AlertsService.deleteURLLimitAlert();
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
            scope.selectNone = function($event) {
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
                    _callonSelectedRowsChanged(scope, tuples, false);
                }
            };

            // this is for the button on the table heading that selects all currently visible rows
            scope.selectAll = function($event) {
                var tuples = [], tuple;
                for (var i = 0; i < scope.vm.page.tuples.length; i++) {
                    tuple = scope.vm.page.tuples[i];

                    if (scope.isDisabled(tuple)) continue;

                    if (!scope.isSelected(tuple)) {
                        scope.vm.selectedRows.push(tuple);
                        tuples.push(tuple);
                    }
                }
                if (tuples.length > 0) {
                    _callonSelectedRowsChanged(scope, tuples, true);
                }
            };

            // Facilitates the multi select functionality for multi edit by storing the tuple in the selectedRows array
            scope.onSelect = function(args, $event) {
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

                _callonSelectedRowsChanged(scope, [tuple], isSelected);
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
                _attachExtraAttributes(scope.vm);
            });

            if (scope.vm && scope.vm.reference) {
                _attachExtraAttributes(scope.vm);
            }
        }

        /**
         * Registers the callbacks for recordset directive and it's children.
         * @param  {object} scope the scope object
         */
        function registerRecordsetCallbacks(scope) {
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
            scope.vm.flowControlObject = new FlowControlObject();

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
            scope.removePill = function(key, $event) {
                var index = scope.vm.selectedRows.findIndex(function (obj) {
                    return obj.uniqueId == key;
                });

                // this sanity check is not necessary since we're always calling
                // this function with a valid key. but it doesn't harm to check
                if (index === -1) {
                    $event.preventDefault();
                    return;
                }

                var tuple = scope.vm.selectedRows.splice(index, 1)[0];
                _callonSelectedRowsChanged(scope, tuple, false);
            };

            // function for removing all pills regardless of what page they are on, clears the whole selectedRows array
            scope.removeAllPills = function($event) {
                var pre = scope.vm.selectedRows.slice();
                scope.vm.selectedRows.clear();
                scope.vm.currentPageSelected = false;
                _callonSelectedRowsChanged(scope, pre, false);
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
                _attachExtraAttributes(scope.vm);
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
            registerRecordsetCallbacks: registerRecordsetCallbacks,
            FlowControlObject: FlowControlObject
        };
    }])

    .directive('recordTable', ['DataUtils', 'recordTableUtils', 'messageMap', 'UriUtils', function(DataUtils, recordTableUtils, messageMap, UriUtils) {

        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/table.html',
            scope: {
                vm: '=',
                /*
                 * used by the recordset template to pass down on click function
                 * The recordset has a onSelectedRowsChanged which will be passed to this onSelectedRowsChangedBind.
                 */
                onSelectedRowsChangedBind: '=?',
                onSelectedRowsChanged: '&?',      // set row click function TODO not used anywhere
                parentReference: "=?" // if this is used for related references, this will be the main reference
            },
            link: function (scope, elem, attr) {
                recordTableUtils.registerTableCallbacks(scope, elem, attr);

                scope.makeSafeIdAttr = DataUtils.makeSafeIdAttr;
                scope.tooltip = messageMap.tooltip;
            }
        };
    }])

    .directive('recordTableSelectFaceting', ['recordTableUtils', 'UriUtils', function (recordTableUtils, UriUtils) {
        return {
            restrict: "E",
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/table.html',
            scope: {
                vm: '=',
                /*
                 * used by the recordset template to pass down on click function
                 * The recordset has a onSelectedRowsChanged which will be passed to this onSelectedRowsChangedBind.
                 */
                onSelectedRowsChangedBind: '=?',
                onSelectedRowsChanged: '&?'      // set row click function
            },
            link: function (scope, elem, attr) {
                recordTableUtils.registerTableCallbacks(scope, elem, attr);

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

    .directive('recordList', ['recordTableUtils', 'defaultDisplayname', '$timeout', 'UriUtils', function(recordTableUtils, defaultDisplayname, $timeout, UriUtils) {

        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/list.html',
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

    .directive('recordsetSelectFaceting', ['recordTableUtils', 'UriUtils', function(recordTableUtils, UriUtils) {

        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/recordsetSelectFaceting.html",
            scope: {
                mode: "=?",
                vm: '=',
                onSelectedRowsChanged: '&?',       // set row click function
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
                scope.removePill = function(key, $event) {
                    if (scope.vm.matchNotNull) {
                        scope.vm.matchNotNull = false;
                        scope.vm.selectedRows.clear();
                        return;
                    }
                    var index = scope.vm.selectedRows.findIndex(function (obj) {
                        return obj.uniqueId == key;
                    });

                    if (index === -1) {
                        $event.preventDefault();
                        return;
                    }

                    var tuple = scope.vm.selectedRows.splice(index, 1)[0];

                    if (scope.onSelectedRowsChanged) {
                        scope.onSelectedRowsChanged()(tuple, false);
                    }
                };

                // function for removing all pills regardless of what page they are on, clears the whole selectedRows array
                scope.removeAllPills = function($event) {
                    var pre = scope.vm.selectedRows.slice();
                    scope.vm.selectedRows.clear();
                    if (scope.vm.matchNotNull) {
                        scope.vm.matchNotNull = false;
                    } else {
                        scope.vm.currentPageSelected = false;
                    }
                    if (scope.onSelectedRowsChanged) {
                        scope.onSelectedRowsChanged()(pre, false);
                    }
                };

                scope.toggleMatchNotNull = function () {
                    scope.vm.matchNotNull = !scope.vm.matchNotNull;
                    var tuples = [];
                    if (scope.vm.matchNotNull) {
                        scope.vm.selectedRows = tuples = [{
                            isNotNull: true,
                            displayname: {"value": scope.defaultDisplayname.notNull, "isHTML": true}
                        }];
                    } else {
                        tuples = scope.vm.selectedRows.slice();
                        scope.vm.selectedRows.clear();
                    }

                    if (scope.onSelectedRowsChanged) {
                        scope.onSelectedRowsChanged()(tuples, scope.vm.matchNotNull);
                    }
                };
            }
        };
    }])

    .directive('recordset', ['recordTableUtils', 'UriUtils', function(recordTableUtils, UriUtils) {

        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/recordset.html',
            scope: {
                vm: '=',
                onSelectedRowsChanged: '&?',       // set row click function
                allowCreate: '=?',       // if undefined, assume false
                registerSetPageState: "&?"
            },
            link: function (scope, elem, attr) {
                recordTableUtils.registerRecordsetCallbacks(scope);
            }
        };
    }]);
})();
