(function () {
    'use strict';

    var isIE = /*@cc_on!@*/false || !!document.documentMode, // Internet Explorer 6-11
        isEdge = !isIE && !!window.StyleMedia; // Edge

    var addRecordRequests = {}; // table refresh used by add record implementation with cookie (old method)

    angular.module('chaise.record.table', ['chaise.ellipsis', 'chaise.inputs', 'chaise.utils'])

    .constant('tableConstants', {
        MAX_CONCURENT_REQUEST: 4,
        URL_PATH_LENGTH_LIMIT: (isIE || isEdge) ? 2000: 4000,
        PAGE_SIZE: 10,
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
     *          - showFaceting: defines if the facet panel should be available
     *          - openFacetPanel: defines if the facet panel is open by default
     *          - showNull: if this is available and equal to `true`, we will differentiate between `null` and empty string.
     *          - displayMode:
     *             fullscreen
     *             related
     *             popup
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
     * modified. ellipsis will fire this event and recordset directive will use it.
     */
    .factory('recordTableUtils',
            ['AlertsService', 'DataUtils', 'defaultDisplayname', 'ErrorService', 'logActions', 'logService', 'MathUtils', 'messageMap', 'modalBox', 'recordsetDisplayModes', 'Session', 'tableConstants', 'UiUtils', 'UriUtils', '$cookies', '$document', '$log', '$q', '$rootScope', '$timeout', '$window',
            function(AlertsService, DataUtils, defaultDisplayname, ErrorService, logActions, logService, MathUtils, messageMap, modalBox, recordsetDisplayModes, Session, tableConstants, UiUtils, UriUtils, $cookies, $document, $log, $q, $rootScope, $timeout, $window) {

        function FlowControlObject(maxRequests) {
            this.maxRequests = maxRequests || tableConstants.MAX_CONCURENT_REQUEST;
            this.occupiedSlots = 0;
            this.counter = 0;
        }

        /**
         * returns true if we have free slots for requests.
         * @return {boolean}
         */
        function _haveFreeSlot(vm) {
            var res = vm.flowControlObject.occupiedSlots < vm.flowControlObject.maxRequests;
            if (!res) {
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
                        //TODO does this make sense?
                        vm.reference.activeList.aggregates[i].objects.forEach(function (obj) {
                            // this is only called in recordset so it won't be related
                            if (obj.column) {
                                vm.columnModels[obj.index].columnError = false;
                            }
                        });
                        updatePageCB(vm);
                    }).catch(function (err) {
                        _afterUpdateColumnAggregate(vm, false, i);
                        // show alert if 400 Query Timeout Error
                        if (err instanceof ERMrest.QueryTimeoutError) {
                            vm.reference.activeList.aggregates[i].objects.forEach(function (obj) {
                                // this is only called in recordset so it won't be related
                                if (obj.column) {
                                    vm.columnModels[obj.index].columnError = true;
                                }
                            });

                        } else {
                            throw err;
                        }
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
            // show spinner for all the dependent columns
            vm.reference.activeList.aggregates[colIndex].objects.forEach(function (obj) {
                // this is only called in recordset so it won't be related
                if (obj.column) {
                    vm.columnModels[obj.index].isLoading = !hideSpinner;
                }
            });

            logObject = logObject || {action: logActions.recordsetAggregate};
            //TODO maybe change?
            logObject.colIndex = colIndex;

            vm.reference.activeList.aggregates[colIndex].column.getAggregatedValue(vm.page, logObject).then(function (values) {
                if (vm.flowControlObject.counter !== current) {
                    return defer.resolve(false);
                }
                afterReadAggregate(vm, colIndex, values);
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
         * This will be called after the data for an aggregate column has returned.
         * It will,
         *  - update the templateVariables.
         *  - update the aggregateResults
         *  - update the column value if all of its dependent requests are back.
         * @param  {Object} vm       vm object
         * @param  {integer} colIndex index of aggregate column
         * @param  {Object} values   the returned value
         */
        function afterReadAggregate(vm, colIndex, values) {
            var agg = vm.reference.activeList.aggregates[colIndex];
            var sourceDefinitions = vm.reference.table.sourceDefinitions;

            values.forEach(function (val, valIndex) {

                // update the templateVariables
                if (agg.objects.length > 0 && Array.isArray(sourceDefinitions.sourceMapping[agg.column.name])) {
                    // NOTE: not needed
                    if (!Array.isArray(vm.templateVariables)) {
                        vm.templateVariables = new Array(values.length);
                    }

                    if (!vm.templateVariables[valIndex]) {
                        vm.templateVariables[valIndex] = {};
                    }

                    sourceDefinitions.sourceMapping[agg.column.name].forEach(function (k) {
                        if (val.templateVariables["$self"]) {
                            vm.templateVariables[valIndex][k] = val.templateVariables["$self"];
                        }
                        if (val.templateVariables["$_self"]) {
                            vm.templateVariables[valIndex]["_" + k] = val.templateVariables["$_self"];
                        }
                    });
                }

                // update the aggregateResults
                if (vm.aggregateResults[valIndex] === undefined) {
                    vm.aggregateResults[valIndex] = {};
                }
                vm.aggregateResults[valIndex][agg.columnName] = val;

                // attach the values to the appropriate objects
                agg.objects.forEach(function (obj) {
                    // this is only called in recordset so it won't be related
                    if (!obj.column) return;
                    var model = vm.columnModels[obj.index];

                    // do we have all the waitfor results?
                    var hasAll = model.column.waitFor.every(function (col) {
                        return col.isUnique || col.name in vm.aggregateResults[valIndex];
                    });
                    if (!(hasAll && (model.column.name in vm.aggregateResults[valIndex] || model.column.isUnique))) return;

                    var displayValue = model.column.sourceFormatPresentation(
                        vm.templateVariables[valIndex],
                        vm.aggregateResults[valIndex][model.column.name],
                        vm.page.tuples[valIndex]
                    );

                    model.isLoading = false;
                    vm.rowValues[valIndex][obj.index] = displayValue;
                });
            });

        }

        /**
         * Given the tableModel object, will get the values for main entity and
         * attach them to the model.
         * @param  {object} vm           table model
         * @param  {function} updatePageCB The update page callback which we will call after getting the result.
         * @param  {boolean} hideSpinner  Indicates whether we should show spinner for columns or not
         * @param  {object} isTerminal  Indicates whether we should show a terminal error or not for 400 QueryTimeoutError
         */
        function updateMainEntity(vm, updatePageCB, hideSpinner, notTerminal) {
            if (!vm.dirtyResult || !_haveFreeSlot(vm)) {
                $log.debug("counter", vm.flowControlObject.counter, ": break out of update main");
                return;
            }

            vm.flowControlObject.occupiedSlots++;
            vm.dirtyResult = false;

            (function (currentCounter) {
                $log.debug("counter", currentCounter, ": updating result");
                _readMainEntity(vm, hideSpinner, currentCounter).then(function (res) {
                    _afterUpdateMainEntity(vm, res, currentCounter);
                    vm.tableError = false;
                    $log.debug("counter", currentCounter, ": read is done. just before update page (to update the rest of the page)");
                    // TODO remember last successful main request
                    // when a request fails for 400 QueryTimeout, revert (change browser location) to this previous request
                    updatePageCB(vm);
                }).catch(function (err) {
                    _afterUpdateMainEntity(vm, true, currentCounter);
                    // show modal with different text if 400 Query Timeout Error
                    if (err instanceof ERMrest.QueryTimeoutError) {
                        // clear the data shown in the table
                        vm.rowValues = [];
                        vm.tableError = true;

                        if (!notTerminal){
                            err.subMessage = err.message;
                            err.message = "The result set cannot be retrieved. Try the following to reduce the query time:\n" + messageMap.queryTimeoutList;
                            console.log(err);
                            ErrorService.handleException(err, true);
                        }
                    } else {
                        throw err;
                    }
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
            vm.dirtyResult = !res;
            vm.hasLoaded = true;
            $log.debug("counter", counter, ": after result update: " + (res ? "successful." : "unsuccessful."));
        }

        // comment $timeout why
        var pushMore;
        /**
         * @private
         * Does the actual read for the main entity. Returns a promise that will
         * be resolved with `true` if the request was successful.
         */
        function _readMainEntity (vm, hideSpinner, counterer) {
            _attachExtraAttributes(vm);

            // cancel timeout loop that may still be running and hide the spinner and "Loading ..."
            $timeout.cancel(pushMore);
            vm.pushRowsSpinner = false;
            vm.dirtyResult = false;
            vm.hasLoaded = false;
            var defer = $q.defer();
            (function (current) {
                vm.reference.read(vm.pageLimit, vm.logObject).then(function (page) {
                    if (current !== vm.flowControlObject.counter) {
                        defer.resolve(false);
                        return defer.promise;
                    }

                    $log.debug("counter", current, ": read main successful.");
                    vm.page = page;
                    vm.templateVariables = page.templateVariables;
                    vm.aggregateResults = new Array(vm.page.tuples.length);

                    return vm.getDisabledTuples ? vm.getDisabledTuples(page, vm.pageLimit) : '';
                }).then(function (rows) {
                    if (current !== vm.flowControlObject.counter) {
                        defer.resolve(false);
                        return defer.promise;
                    }

                    if (rows) vm.disabledRows = rows;
                    var rowValues = DataUtils.getRowValuesFromPage(vm.page);
                    // calculate how many rows can be shown based on # of columns
                    var rowLimit = Math.ceil(tableConstants.CELL_LIMIT/vm.page.reference.columns.length);

                    // recursive function for adding more rows to the DOM
                    function _pushMoreRows(prevInd, limit, pushMoreID) {
                        if ($rootScope.pushMoreID === pushMoreID) {
                            var nextLimit = prevInd + limit;
                            // combines all of the second array (rowValues) with the first one (vm.rowValues)
                            Array.prototype.push.apply(vm.rowValues, rowValues.slice(prevInd, nextLimit));
                            if (rowValues[nextLimit]) {
                                $log.debug("counter", current, ": recurse with", vm.rowValues.length);
                                $timeout(function () {
                                    if ($rootScope.pushMoreID === pushMoreID) {
                                        _pushMoreRows(nextLimit, limit, pushMoreID);
                                    } else {
                                        $log.debug("current global counter: ", vm.flowControlObject.counter);
                                        $log.debug("counter", current, ": break out of timeout inside push more rows");
                                        $log.debug("counter", current, ": with uuid", pushMoreID);
                                        $log.debug("counter", current, ": with global uuid", $rootScope.pushMoreID);
                                        vm.pushRowsSpinner = false;
                                    }
                                });
                            } else {
                                // we reached the end of the data to page in
                                vm.pushRowsSpinner = false;
                            }
                        } else {
                            $log.debug("current global counter: ", vm.flowControlObject.counter);
                            $log.debug("counter", current, ": break out of push more rows");
                            $log.debug("counter", current, ": with uuid", pushMoreID);
                            $log.debug("counter", current, ": with global uuid", $rootScope.pushMoreID);
                            vm.pushRowsSpinner = false;
                        }
                    }

                    $log.debug("counter", current, ": row values length ", rowValues.length);
                    vm.rowValues = [];
                    if (rowValues.length > rowLimit) {
                        vm.pushRowsSpinner = true;
                        var uniqueIdentifier = $rootScope.pushMoreID = MathUtils.uuid();
                        $log.debug("counter", current, ": before push more rows with uuid", uniqueIdentifier);
                        _pushMoreRows(0, rowLimit, uniqueIdentifier);
                    } else {
                        vm.rowValues = rowValues;
                    }

                    vm.initialized = true;
                    // globally sets when the app state is ready to interact with
                    $rootScope.displayReady = true;
                    // TODO could be better
                    vm.aggregatesToInitialize = [];
                    if (vm.reference.activeList) {
                        vm.reference.activeList.aggregates.forEach(function (c, i) {
                            if (vm.page.tuples.length > 0) {
                                vm.aggregatesToInitialize.push(i);
                            } else {
                                // there are not matching rows, so there's no point in creating
                                // aggregate requests.
                                // make sure the spinner is hidden for the pending columns.
                                c.objects.forEach(function (obj) {
                                    if (obj.column) {
                                        vm.columnModels[obj.index].isLoading = false;
                                    }
                                })
                            }
                        });
                    }

                    defer.resolve(true);
                }).catch(function(err) {
                    if (current !== vm.flowControlObject.counter) {
                        return defer.resolve(false);
                    }
                    vm.initialized = true;
                    // globally sets when the app state is ready to interact with
                    $rootScope.displayReady = true;
                    if (DataUtils.isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
                      err.errorData.redirectUrl = UriUtils.createRedirectLinkFromPath(err.errorData.redirectPath);
                    }
                    defer.reject(err);
                });
            }) (counterer);
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

            $log.debug("counter", vm.flowControlObject.counter, ": after facet (index="+i+") update: " + (res ? "successful." : "unsuccessful."));
        }

        /**
         * @private
         * Calls _getMainRowsCount to update the count. won't return any values
         */
        function _updateMainCount (vm, updatePageCB) {
            if (!vm.dirtyCount || !_haveFreeSlot(vm)) {
                $log.debug("counter", vm.flowControlObject.counter , ": break out of updateCount: (not dirty or full)");
                return;
            }

            vm.flowControlObject.occupiedSlots++;
            vm.dirtyCount = false;

            (function (curr) {
                _getMainRowsCount(vm, curr).then(function (res) {
                    _afterGetMainRowsCount(vm, res, curr);
                    updatePageCB(vm);
                }).catch(function (err) {
                    _afterGetMainRowsCount(vm, true, curr);
                    throw err;
                });
            })(vm.flowControlObject.counter);
        }

        /**
         * @private
         * This will generate the request for getting the count.
         * Returns a promise. If it's resolved with `true` then it has been successful.
         */
        function _getMainRowsCount(vm, current) {
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

                 vm.countError = false;

                 vm.totalRowsCnt = response[0];
                 defer.resolve(true);
             }).catch(function (err) {
                 if (current !== vm.flowControlObject.counter) {
                     defer.resolve(false);
                     return defer.promise;
                 }

                 if (err instanceof ERMrest.QueryTimeoutError) {
                     // separate from hasError above
                     vm.countError = true;
                 }

                 // fail silently
                 vm.totalRowsCnt = null;
                 return defer.resolve(true), defer.promise;
             });

             return defer.promise;
        }

        /**
         * @private
         * will be called after getting data for count to set the flags.
         */
        function _afterGetMainRowsCount (vm, res, current) {
            vm.flowControlObject.occupiedSlots--;
            vm.dirtyCount = !res;
            $log.debug("counter", current, ": after _getMainRowsCount: " + (res ? "successful." : "unsuccessful."));
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
         * @param  {boolean} sameCounter if it's true, the flow-control counter won't be updated.
         *
         * NOTE: sameCounter=true is used just to signal that we want to get results of the current
         * page status. For example when a facet opens or when users add a search term to a single facet.
         * we don't want to update the whole page in that case, just the facet itself.
         * If while doing so, the whole page updates, the updateFacet function itself should ignore the
         * stale request by looking at the request url.
         */
        function update (vm, updateResult, updateCount, updateFacets, sameCounter) {
            $log.debug("counter", vm.flowControlObject.counter ,"update called with res=" + updateResult + ", cnt=" + updateCount + ", facets=" + updateFacets + ", sameCnt=" + sameCounter);

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
                if (!sameCounter) {
                    vm.flowControlObject.counter++;
                    $log.debug("adding one to counter, new: " + vm.flowControlObject.counter);
                }
                _updatePage(vm);
            }, 0);
        }

        /**
         * Given the table model, it will update the page.
         * This is behaving as a flow-control system, that allows only a Maximum
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
            $log.debug("counter", vm.flowControlObject.counter, ": running update page");
            if (!_haveFreeSlot(vm)) {
                return;
            }

            // update the resultset
            updateMainEntity(vm, _updatePage);

            // get the aggregate values only if main page is loaded
            updateColumnAggregates(vm, _updatePage);

            // update the count
            _updateMainCount(vm, _updatePage);

            // update the facets
            if (vm.facetModels) {
                if (vm.facetsToPreProcess.length === 0) {
                    vm.facetModels.forEach(function (fm, index) {
                        if (!fm.preProcessed || fm.processed || !_haveFreeSlot(vm)) {
                            return;
                        }

                        vm.flowControlObject.occupiedSlots++;
                        fm.processed = true;

                        (function (i) {
                            $log.debug("counter", vm.flowControlObject.counter, ": updating facet (index="+i+")");
                            vm.facetModels[i].updateFacet().then(function (res) {
                                vm.facetModels[i].facetError = false;
                                _afterFacetUpdate(vm, i, res);
                                _updatePage(vm);
                            }).catch(function (err) {
                                _afterFacetUpdate(vm, i, true);
                                // show alert if 400 Query Timeout Error
                                if (err instanceof ERMrest.QueryTimeoutError) {
                                    vm.facetModels[i].facetError = true;
                                } else {
                                    throw err;
                                }
                            });
                        })(index);
                    });
                }
                // initialize facets
                else if (_haveFreeSlot(vm)){
                    vm.flowControlObject.occupiedSlots++;
                    var index = vm.facetsToPreProcess.shift();
                    (function (i, currentCounter) {
                        $log.debug("counter", vm.flowControlObject.counter, ": initializing facet (index="+index+")");
                        vm.facetModels[i].preProcessFacet().then(function (res) {
                            $log.debug("counter", currentCounter, ": after facet (index="+ i +") initialize: " + (res ? "successful." : "unsuccessful."));
                            vm.flowControlObject.occupiedSlots--;
                            vm.facetModels[i].preProcessed = true;
                            vm.facetModels[i].facetError = false;
                            _updatePage(vm);
                        }).catch(function (err) {
                            // show alert if 400 Query Timeout Error
                            if (err instanceof ERMrest.QueryTimeoutError) {
                                vm.facetModels[i].facetError = true;
                            } else {
                                throw err;
                            }
                        });
                    })(index, vm.flowControlObject.counter);
                }
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
            if (vm.attributesAlreadyAttached) return;
            vm.attributesAlreadyAttached = true;
            vm.columnModels = [];
            vm.reference.columns.forEach(function (col) {
                vm.columnModels.push({
                    column: col,
                    isLoading: col.hasWaitFor === true || col.isUnique === false,
                    hasWaitFor: col.hasWaitFor === true || col.isUnique === false
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
        function registerTableCallbacks(scope, elem, attrs) {
            if (!scope.vm) scope.vm = {};

            scope.makeSafeIdAttr = DataUtils.makeSafeIdAttr;
            scope.noSelect = modalBox.noSelect;
            scope.singleSelect = modalBox.singleSelectMode;
            scope.multiSelect = modalBox.multiSelectMode;
            scope.tooltip = messageMap.tooltip;

            scope.$root.checkReferenceURL = function (ref) {
                var ermrestPath = ref.isAttributeGroup ? ref.ermrestPath : ref.readPath;
                if (ermrestPath.length > tableConstants.URL_PATH_LENGTH_LIMIT || ref.uri.length > tableConstants.URL_PATH_LENGTH_LIMIT) {

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
                } else {
                    scope.toggleSortOrder();
                }
            };

            scope.toggleSortOrder = function () {
                changeSort((scope.vm.sortOrder === 'asc' ? scope.vm.sortOrder = 'desc' : scope.vm.sortOrder = 'asc'));
            };

            scope.before = function() {
                var previous = scope.vm.page.previous;
                if (previous && scope.$root.checkReferenceURL(previous)) {
                    scope.vm.reference = previous;
                    $log.debug('counter', scope.vm.flowControlObject.counter ,': request for previous page');

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
                    $log.debug('counter', scope.vm.flowControlObject.counter ,': request for next page');

                    scope.vm.logObject = {
                        action: logActions.recordsetPage,
                        sort: next.location.sortObject,
                        page: next.location.afterObject,
                        type: "after"
                    };
                    update(scope.vm, true, false, false);
                }

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

            scope.$watch(function () {
                return (scope.vm && scope.vm.reference) ? scope.vm.reference.columns : null;
            }, function (newValue, oldValue) {
                if(!newValue){
                    return;
                }
                _attachExtraAttributes(scope.vm);
            });
        }

        /**
         * Registers the callbacks for recordset directive and it's children.
         * @param  {object} scope the scope object
         */
        function registerRecordsetCallbacks(scope, elem, attrs) {
            var updated = false; // table refresh used by ellipsis' edit action (new method)

            scope.$root.alerts = AlertsService.alerts;
            scope.$root.showSpinner = false; // this property is set from common modules for controlling the spinner at a global level that is out of the scope of the app
            scope.vm.makeSafeIdAttr = DataUtils.makeSafeIdAttr;
            scope.transformCustomFilter = DataUtils.addSpaceAfterLogicalOperators;

            scope.getRecordsetLink = UriUtils.getRecordsetLink;

            scope.tooltip = messageMap.tooltip;
            scope.defaultDisplayname = defaultDisplayname;

            scope.recordsetDisplayModes = recordsetDisplayModes;

            scope.vm.isIdle = true;
            scope.vm.facetModels = [];
            scope.vm.facetsToPreProcess = [];
            scope.vm.flowControlObject = new FlowControlObject();

            scope.versionDisplay = function () {
                return UiUtils.humanizeTimestamp(scope.vm.reference.location.versionAsMillis);
            }

            scope.versionDate = function () {
                return UiUtils.versionDate(scope.vm.reference.location.versionAsMillis);
            }

            scope.search = function(term) {

                if (term) term = term.trim();

                var ref = scope.vm.reference.search(term); // this will clear previous search first
                 if (scope.$root.checkReferenceURL(ref)) {
                     scope.vm.search = term;
                     scope.vm.reference = ref;
                     scope.vm.lastActiveFacet = -1;
                     scope.vm.logObject = {action: logActions.recordsetFacet};
                     $log.debug('counter', scope.vm.flowControlObject.counter ,': new search term=' + term);
                     update(scope.vm, true, true, true);
                 }
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
                    $log.debug('counter', scope.vm.flowControlObject.counter ,': focused on page after update');
                    updated = false;
                    scope.vm.lastActiveFacet = -1;
                    if (scope.vm.config.displayMode === scope.recordsetDisplayModes.related) {
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
                $log.debug('counter', scope.vm.flowControlObject.counter, ': facet-modified in recordset directive');
                scope.vm.logObject = {action: logActions.recordsetFacet};
                update(scope.vm, true, true, true);
            });

            scope.$on('record-deleted', function ($event) {
                $log.debug("-----------------------------");
                $log.debug('counter', scope.vm.flowControlObject.counter, ': record-deleted in recordset directive');
                scope.vm.lastActiveFacet = -1;
                scope.vm.logObject = {action: logActions.recordsetUpdate};
                update(scope.vm, true, true, true);
            });

            // This is not used now, but we should change the record-deleted to this.
            // row data has been modified (from ellipsis) do read
            scope.$on('record-modified', function($event) {
                $log.debug("-----------------------------");
                $log.debug('counter', scope.vm.flowControlObject.counter, ': record-modified in recordset directive');
                scope.vm.lastActiveFacet = -1;
                scope.vm.logObject = {action: logActions.recordsetUpdate};
                update(scope.vm, true, true, true);
            });

            scope.$watch(function () {
                return (scope.vm && scope.vm.reference) ? scope.vm.reference.columns : null;
            }, function (newValue, oldValue) {
                if(!newValue){
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
                        // create the facetsToPreProcess and also open facets
                        scope.vm.reference.facetColumns.forEach(function (fc, index) {
                            if (fc.isOpen) {
                                firstOpen = (firstOpen == -1 || firstOpen > index) ? index : firstOpen;
                                scope.vm.facetsToPreProcess.push(index);
                                scope.vm.facetModels[index].processed = false;
                                scope.vm.facetModels[index].isOpen = true;
                                scope.vm.facetModels[index].isLoading = true;
                                scope.vm.facetModels[index].preProcessed = false;
                            }
                        });

                        // all the facets are closed, open the first one
                        if (firstOpen === -1) {
                            firstOpen = 0;
                            scope.vm.facetModels[0].processed = false;
                            scope.vm.facetModels[0].isOpen = true;
                            scope.vm.facetModels[0].isLoading = true;
                        }
                        scope.vm.focusOnFacet(firstOpen, true);
                    }

                    // TODO should be based on the reference columns in search context
                    scope.searchPlaceholder = {isHTML: false, value: "all columns"};

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


            /**
             * Set the height of recordset and facet panel
             * This is called if the height of the fixed content is changed
             */
            function setRecordsetHeight() {
                // make sure the value is set and is integer
                if (scope.fixedContentHeight !== undefined && !isNaN(scope.fixedContentHeight)) {

                    var pc, pcs;
                    if (scope.vm.parentContainerSelector) {
                        pc = scope.parentContainer;
                    }
                    if (scope.vm.parentStickyAreaSelector) {
                        pcs = scope.parentStickyArea;
                    }

                    UiUtils.setDisplayContainerHeight(pc, pcs);
                }
            }

            /**
             * Compute the value of fixed content (navbar/modal header + top-panel-container)
             * @return {int}
             */
            function computeFixedContentHeight () {
                scope.fixedContentHeight = scope.parentContainer.querySelector('.top-panel-container').offsetHeight;

                // if the sticky area of the parent is defined (navbar or header in modal)
                if (scope.parentStickyArea) {
                    scope.fixedContentHeight += scope.parentStickyArea.offsetHeight;
                }

                return scope.fixedContentHeight;
            }

            /**
             * Attach the container elements to the scope, and create the watch
             * event for the fixedContentHeight.
             */
            function initializeRecordsetHeight () {
                // get the scrollable container of this recordset
                scope.scrollableContainer = scope.parentContainer.querySelector(".bottom-panel-container");

                // just setting the watch event is not enough, we have to run it once too.
                computeFixedContentHeight();
                setRecordsetHeight();

                // watch the height of the fixed content and set the height on change.
                scope.$watch(computeFixedContentHeight, function (newValue, oldValue) {
                    if (newValue != oldValue) {
                        setRecordsetHeight();
                    }
                });

                // make sure the padding of main-container is correctly set
                UiUtils.watchForMainContainerPadding(scope, scope.parentContainer);
            }

            // initialize the height of main-container and facet container
            var unbindWatchForRecordsetInitializeHeight = scope.$watch(function() {
                return (scope.vm.hasLoaded && scope.vm.initialized) || (scope.vm.config.showFaceting && scope.vm.reference);
            }, function (newValue, oldValue) {
                if (newValue) {
                    $timeout(function () {
                        initializeRecordsetHeight();

                        //make sure we're calling this watcher once
                        unbindWatchForRecordsetInitializeHeight();

                        // capture and log the right click event on the permalink button
                        var permalink = document.getElementById('permalink');
                        permalink.addEventListener('contextmenu', function (e) {
                            logService.logAction(logActions.recordsetPermalink, logActions.buttonAction);
                        });
                    }, 0);
                }
            });

            // watch for the main body size to change
            if (scope.vm.config.displayMode === recordsetDisplayModes.fullscreen) {
                scope.$watch(function() {
                    if (scope.mainBodyEl) {
                        return scope.mainBodyEl.offsetHeight;
                    } else {
                        return -1;
                    }
                }, function (newValue, oldValue) {
                    if (newValue != oldValue) {
                        $timeout(function () {
                            UiUtils.setFooterStyle(0);
                        }, 0);
                    }
                });
            }

            angular.element($window).bind('resize', function(){
                if (scope.vm.hasLoaded && scope.vm.initialized ) {
                    setRecordsetHeight();
                    if (scope.vm.config.displayMode === recordsetDisplayModes.fullscreen) {
                        UiUtils.setFooterStyle(0);
                    }
                    scope.$digest();
                }
            });

            $timeout(function () {
                // set the parentContainer element
                if (scope.vm.parentContainerSelector) {
                    scope.parentContainer = $document[0].querySelector(scope.vm.parentContainerSelector);
                } else {
                    scope.parentContainer = $document[0].querySelector("body");
                }

                // used for footer
                scope.mainBodyEl = scope.parentContainer.querySelector('.main-body');

                // set the sticky area selector container
                if (scope.vm.parentStickyAreaSelector) {
                    scope.parentStickyArea = $document[0].querySelector(scope.vm.parentStickyAreaSelector);
                }
            }, 0);
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


    .directive('tableHeader', ['logActions', 'MathUtils', 'messageMap', 'recordsetDisplayModes', 'recordTableUtils', 'UriUtils', '$window', function(logActions, MathUtils, messageMap, recordsetDisplayModes, recordTableUtils, UriUtils, $window) {
        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/tableHeader.html',
            scope: {
                vm: '='
            },
            link: function (scope, elem, attr) {
                scope.recordsetDisplayModes = recordsetDisplayModes;

                scope.pageLimits = [10, 25, 50, 75, 100, 200];
                scope.setPageLimit = function(limit) {
                    scope.vm.pageLimit = limit;

                    scope.vm.logObject = {action: logActions.recordsetLimit};
                    recordTableUtils.update(scope.vm, true, false, false);
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

                scope.editRecord = function() {
                    var link = scope.vm.page.reference.contextualize.entryEdit.appLink;
                    // TODO ermrestJS needs to handle the case when no limit is defined in the URL
                    if (link.indexOf("?limit=") === -1 || link.indexOf("&limit=") === -1)
                        link = link + (link.indexOf('?') === -1 ? "?limit=" : "&limit=" ) + scope.vm.pageLimit;

                    location.href = link;
                };

            }
        }
    }])

    .directive('recordTable', ['recordTableUtils', 'UriUtils', function(recordTableUtils, UriUtils) {

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
            },
            link: function (scope, elem, attrs) {
                recordTableUtils.registerTableCallbacks(scope, elem, attrs);
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
            link: function (scope, elem, attrs) {
                recordTableUtils.registerTableCallbacks(scope, elem, attrs);

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

    .directive('recordList', ['defaultDisplayname', 'messageMap', 'recordTableUtils', 'UriUtils', '$timeout', function(defaultDisplayname, messageMap, recordTableUtils, UriUtils, $timeout) {

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
                scope.tooltip = messageMap.tooltip;

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

    /**
     * This directive has the same functionality as recordset directive, the only differences are:
     * - It has matchNotNull checkbox that will disable all the other rows.
     *   To figure out if this is selected or not, the caller should use the boolean value of vm.matchNotNull
     *   Although to be consistent we're still adding a special row to the selectedRows, but you don't need to check for that.
     * - A special checkbox for matchNull so users will be able to select null value.
     *   vm.matchNull is only used internally in the directive, we're still adding the "null"
     *   value to the vm.selectedRows
     * NOTE removePill, removeAllPills are also changed to support these two matchNull and matchNotNull options.
     */
    .directive('recordsetSelectFaceting', ['messageMap', 'recordsetDisplayModes', 'recordTableUtils', 'UriUtils', function(messageMap, recordsetDisplayModes, recordTableUtils, UriUtils) {

        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/recordsetSelectFaceting.html",
            scope: {
                mode: "=?",
                vm: '=',
                onSelectedRowsChanged: '&?',       // set row click function
                getDisabledTuples: "=?", // callback to get the disabled tuples
                registerSetPageState: "&?"
            },
            link: function (scope, elem, attrs) {
                // currently faceting is not defined in this mode.
                // TODO We should eventually add faceting here, and remove these initializations
                scope.facetsLoaded = true;
                scope.ignoreFaceting = true; // this is a temporary flag to avoid any faceting logic
                scope.tooltip = messageMap.tooltip;
                scope.recordsetDisplayModes = recordsetDisplayModes;

                recordTableUtils.registerRecordsetCallbacks(scope, elem, attrs);

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

                    if (key == null) {
                        scope.vm.matchNull = false;
                    }

                    if (scope.onSelectedRowsChanged) {
                        scope.onSelectedRowsChanged()(tuple, false);
                    }
                };

                // function for removing all pills regardless of what page they are on, clears the whole selectedRows array
                scope.removeAllPills = function($event) {
                    var pre = scope.vm.selectedRows.slice();
                    scope.vm.selectedRows.clear();
                    scope.vm.matchNull = false;
                    if (scope.vm.matchNotNull) {
                        scope.vm.matchNotNull = false;
                    } else {
                        scope.vm.currentPageSelected = false;
                    }
                    if (scope.onSelectedRowsChanged) {
                        scope.onSelectedRowsChanged()(pre, false);
                    }
                };

                /**
                 * Toggle the not-null checkbox.
                 * If it is selected, we're disabling and deselcting all the other options.
                 */
                scope.toggleMatchNotNull = function () {
                    scope.vm.matchNotNull = !scope.vm.matchNotNull;
                    var tuples = [];
                    if (scope.vm.matchNotNull) {
                        scope.vm.matchNull = false;
                        scope.vm.selectedRows = tuples = [{
                            isNotNull: true,
                            displayname: {"value": scope.defaultDisplayname.notNull, "isHTML": true}
                        }];
                        scope.vm.matchNull = false;
                    } else {
                        tuples = scope.vm.selectedRows.slice();
                        scope.vm.selectedRows.clear();
                    }

                    if (scope.onSelectedRowsChanged) {
                        scope.onSelectedRowsChanged()(tuples, scope.vm.matchNotNull);
                    }
                };

                /**
                 * Toggle the null filter
                 */
                scope.toggleMatchNull = function () {
                    scope.vm.matchNull = !scope.vm.matchNull;
                    var tuple = {uniqueId: null,  displayname: {value: null, isHTML: false}};

                    if (scope.vm.matchNull) {
                        scope.vm.selectedRows.push(tuple);
                    } else {
                        var rowIndex = scope.vm.selectedRows.findIndex(function (obj) {
                            return obj.uniqueId == null;
                        });
                        scope.vm.selectedRows.splice(rowIndex, 1);
                    }

                    if (scope.onSelectedRowsChanged) {
                        scope.onSelectedRowsChanged()(tuple, scope.vm.matchNotNull);
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
                onSelectedRowsChanged: '&?', // set row click function
                registerSetPageState: "&?"
            },
            link: function (scope, elem, attrs) {
                recordTableUtils.registerRecordsetCallbacks(scope, elem, attrs);
            }
        };
    }]);
})();
