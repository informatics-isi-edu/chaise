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
     *        logStack,     // (required) used to capture the stack related to this table.
     *        logStackPath, // (required) used to capture the stack-path related to this table.
     *        logAppMode,  // (optional) if defined, will be used instead of the default app mode.
     *        logObject (optional) // used only on the first request of main entity read.
     *       }
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
     *          - displayMode: find the complete list in utils.recordsetDisplayModes
     *          - containerIndex: If it's related (or inline), this will return the index of that related(or inline) table.
     * - vm public variables that can be used in other directives: these variables will be generated when the table directive is instantiated
     *   - columnModels: An array of objects that represent the displayed columns. Each object has the following attribues:
     *     - column: the column object that comes from ermrestjs
     *     - isLoading: whether we should show a spinner in the UI
     *   - internalID: can be used to refer to this specific instance of table directive
     * - vm private variables that are used internally and should not be passed to other directive/modules:
     *   - _reloadCauses, _reloadStartTime: Used to capture the causes of reload requests as well as the start time of dirtyness of the page.
     *   - _recountCauses, _recountStartTime: Used to capture the causes of recount requests as well as the start time of dirtyness of the page.
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
     *     the children of recordset directive should listen to.
     * 3. `facet-modified`, `facet-selected`, `facet-deselect`, `facet-clear`, `clear-all`:
     *     facet(s) has been updated. This is an internal
     *     event that facets will send to the parents. recordset directive uses this
     *     event to call read on this new reference.
     * 4. `record-deleted`: when a row of table is deleted. The message also includes the following object:
     *     {
     *       displayMode: "the display mode of the table",
     *       containerIndex: "the containerIndex defined in the config object"
     *     }
     * 5. `edit-request`: When users click on "edit" button for a row. It's sending the same object as `record-deleted`.
     * 6. `aggregate-loaded-<internalID>-<rowIndex>`: when an aggregate value has returned, an event is emitted
     *     to trigger logic in ellipsis.js that conditionally adds a resize sensor to the cell associated with `colIndex`
     *     that is also passed along with the emitted event
     */
    .factory('recordTableUtils',
            ['AlertsService', 'DataUtils', 'defaultDisplayname', 'ErrorService', 'logService', 'MathUtils', 'messageMap', 'modalBox', 'recordsetDisplayModes', 'Session', 'tableConstants', 'UiUtils', 'UriUtils', '$cookies', '$document', '$log', '$q', '$rootScope', '$timeout', '$window',
            function(AlertsService, DataUtils, defaultDisplayname, ErrorService, logService, MathUtils, messageMap, modalBox, recordsetDisplayModes, Session, tableConstants, UiUtils, UriUtils, $cookies, $document, $log, $q, $rootScope, $timeout, $window) {

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
         * That function will generate `vm.page` which is needed for this function
         * @param  {object} vm           table model
         * @param  {function} updatePageCB The update page callback which we will call after getting each result.
         * @param  {object} logObject    The object that should be logged with the read request.
         * @param  {boolean} hideSpinner  Indicates whether we should show spinner for columns or not
         */
        function updateColumnAggregates(vm, updatePageCB, hideSpinner) {
            if (!vm.hasLoaded) return;
            vm.aggregateModels.forEach(function (aggModel, index) {
                if (!_haveFreeSlot(vm) || aggModel.processed) {
                    return;
                }

                vm.flowControlObject.occupiedSlots++;

                aggModel.processed = true;

                $log.debug("counter", vm.flowControlObject.counter, ": getting aggregated values for column (index=" + i + ")");
                _updateColumnAggregate(vm, aggModel, vm.flowControlObject.counter, hideSpinner).then(function (res) {
                    vm.flowControlObject.occupiedSlots--;
                    aggModel.processed = res;

                    $log.debug("counter", vm.flowControlObject.counter, ": after aggregated value for column (index=" + index + ") update: " + (res? "successful." : "unsuccessful."));

                    updatePageCB(vm);
                }).catch(function (err) {
                    throw err;
                });
            });
        }

        /**
         * @private
         * Generate request for each individual aggregate columns. Will return
         * a promise that is resolved with a boolean value denoting the success or failure.
         * A rejected promise should be displayed as an error.
         */
        function _updateColumnAggregate(vm, aggModel, current, hideSpinner) {
            var defer = $q.defer();
            var activeListModel = aggModel.activeListModel;

            // show spinner for all the dependent columns
            activeListModel.objects.forEach(function (obj) {
                // this is only called in recordset so it won't be related
                if (obj.column) {
                    vm.columnModels[obj.index].isLoading = !hideSpinner;
                }
            });

            // we have to get the stack everytime because the filters might change.
            var action = logService.logActions.LOAD, stack = getTableLogStack(vm, aggModel.logStackNode);
            if (Array.isArray(aggModel.reloadCauses) && aggModel.reloadCauses.length > 0) {
                action = logService.logActions.RELOAD;
                stack = logService.addCausesToStack(stack, aggModel.reloadCauses, aggModel.reloadStartTime);
            }
            var logObj = {
                action: getTableLogAction(vm, action, logService.logStackPaths.PSEUDO_COLUMN),
                stack: stack
            }
            activeListModel.column.getAggregatedValue(vm.page, logObj).then(function (values) {
                if (vm.flowControlObject.counter !== current) {
                    return defer.resolve(false), defer.promise;
                }

                // remove the column error (they might retry)
                activeListModel.objects.forEach(function (obj) {
                    if (obj.column) {
                        vm.columnModels[obj.index].columnError = false;
                    }
                })

                // use the returned value and:
                //  - update the templateVariables
                //  - update the aggregateResults
                //  - attach the values to the appropriate columnModel if we have all the data.
                var sourceDefinitions = vm.reference.table.sourceDefinitions;
                values.forEach(function (val, valIndex) {

                    // update the templateVariables
                    if (activeListModel.objects.length > 0 && Array.isArray(sourceDefinitions.sourceMapping[activeListModel.column.name])) {
                        // NOTE: not needed
                        if (!Array.isArray(vm.templateVariables)) {
                            vm.templateVariables = new Array(values.length);
                        }

                        if (!vm.templateVariables[valIndex]) {
                            vm.templateVariables[valIndex] = {};
                        }

                        sourceDefinitions.sourceMapping[activeListModel.column.name].forEach(function (k) {
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
                    vm.aggregateResults[valIndex][activeListModel.column.name] = val;

                    // attach the values to the appropriate objects
                    _attachPseudoColumnValue(vm, activeListModel, valIndex);
                });

                // clear the causes
                aggModel.reloadCauses = [];
                aggModel.reloadStartTime = -1;

                return defer.resolve(true);
            }).catch(function (err) {
                if (vm.flowControlObject.counter !== current) {
                    return defer.resolve(false), defer.promise;
                }

                activeListModel.objects.forEach(function (obj) {
                    if (!obj.column) return;

                    vm.columnModels[obj.index].isLoading = false;

                    // show the timeout error in dependent models
                    if (err instanceof ERMrest.QueryTimeoutError) {
                        // TODO what about inline and related ones that timed out?
                        vm.columnModels[obj.index].columnError = true;
                        return defer.resolve(true), defer.promise;
                    }

                });

                defer.reject(err);
            });

            return defer.promise;
        }

        /**
         * @private
         * This function is called inside `_updateColumnAggregate`, after
         * the value is attached to the appropriate objects.
         * The purpose of this function is to show value of a column,
         * if all it's dependencies are available.
         * @param {Object} vm - the table model
         * @param {Object} activeListModel - the model that ermrestjs returns
         * @param {Integer} valIndex - the row index
         */
        function _attachPseudoColumnValue(vm, activeListModel, valIndex) {
            activeListModel.objects.forEach(function (obj) {
                // this is only called in recordset so it won't be any other type
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

                // if rowValues has not been completely populated yet, use pendingRowValues instead
                if (vm.pushMoreRowsPending) {
                    if (vm.pendingRowValues[valIndex] === undefined) {
                        vm.pendingRowValues[valIndex] = {};
                    }
                    vm.pendingRowValues[valIndex][obj.index] = displayValue;
                } else {
                    vm.rowValues[valIndex][obj.index] = displayValue;
                    // emit aggregates loaded event for [row][column]
                    $rootScope.$emit("aggregate-loaded-" + vm.internalID + "-" + valIndex, obj.index);
                }
            });
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
         * @param  {object} isTerminal  Indicates whether we should show a terminal error or not for 400 QueryTimeoutError
         * @param {object} cb a callback that will be called after the read is done and is successful.
         */
        function updateMainEntity(vm, updatePageCB, hideSpinner, notTerminal, cb) {
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
                    if (cb) cb(vm, res);
                    // TODO remember last successful main request
                    // when a request fails for 400 QueryTimeout, revert (change browser location) to this previous request
                    updatePageCB(vm);
                }).catch(function (err) {
                    _afterUpdateMainEntity(vm, true, currentCounter);
                    if (cb) cb(vm, true);

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

            // scroll to top of the page so user can see the result
            if (vm.config.displayMode.indexOf(recordsetDisplayModes.related) !== 0) {
                scrollToTop();
            }

            $log.debug("counter", counter, ": after result update: " + (res ? "successful." : "unsuccessful."));
        }

        /**
         * @private
         * After the push more row logic is done, merge the pendingRowValues with rowValues
         * pendingRowValues will be populated by:
         * - afterReadAggregate function if it's called while push more row logic has not finished
         */
        function _mergeRowValuesAfterPushMoreRows(vm) {
            if (vm.pendingRowValues) {
                for (var rowIndex in vm.pendingRowValues) {
                    for (var colIndex in vm.pendingRowValues[rowIndex]) {
                        vm.rowValues[rowIndex][colIndex] = vm.pendingRowValues[rowIndex][colIndex];
                        // emit aggregates loaded event for [row][column] after push more rows

                        $rootScope.$emit("aggregate-loaded-" + vm.internalID + "-" + rowIndex, colIndex);
                    }
                }
            }
            vm.pendingRowValues = {};
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
            vm.pushMoreRowsPending = false;
            vm.dirtyResult = false;
            vm.hasLoaded = false;
            var defer = $q.defer();

            var logParams = vm.logObject ? vm.logObject : {};

            var hasCauses = Array.isArray(vm.reloadCauses) && vm.reloadCauses.length > 0;
            var act = hasCauses ? logService.logActions.RELOAD : logService.logActions.LOAD;

            // if getDisabledTuples exists, then this read will load everything (domain values) and the
            // getDisabledTuples is the actual load/reload
            if (vm.getDisabledTuples) {
                act = hasCauses ? logService.logActions.RELOAD_DOMAIN : logService.logActions.LOAD_DOMAIN;
            }

            // add reloadCauses
            if (hasCauses) {
                logParams.stack = logService.addCausesToStack(getTableLogStack(vm), vm.reloadCauses, vm.reloadStartTime);
            } else {
                logParams.stack = getTableLogStack(vm);
            }

            // create the action
            logParams.action = getTableLogAction(vm, act);

            (function (current, requestCauses, reloadStartTime) {
                vm.reference.read(vm.pageLimit, logParams).then(function (page) {
                    if (current !== vm.flowControlObject.counter) {
                        defer.resolve(false);
                        return defer.promise;
                    }

                    $log.debug("counter", current, ": read main successful.");

                    return vm.getDisabledTuples ? vm.getDisabledTuples(vm, page, requestCauses, reloadStartTime) : {page: page};
                }).then(function (result) {
                    if (current !== vm.flowControlObject.counter) {
                        defer.resolve(false);
                        return defer.promise;
                    }

                    /*
                     * The following line used to be part of the previous step of promise chain,
                     * but I moved it here to remove the UI bugs that it was causing.
                     * since we're showing the rows using ng-repeat on vm.rowValues, the number of
                     * displayed rows won't change until that value changes. But if we change the
                     * vm.page before this, then the passed tuple to the ellipsis directive would change.
                     * So if we were changing vm.page in one digest cycle, and vm.rowValues in the other,
                     * then the displayed row would be based on the old vm.rowValues but the new vm.page.
                     */
                    // attach the new page
                    vm.page = result.page;

                    // update the objects based on the new page
                    if (Array.isArray(vm.page.templateVariables)) {
                        vm.templateVariables = vm.page.templateVariables.map(function (tv) {
                            return tv.values;
                        });
                    } else {
                        vm.templateVariables = [];
                    }
                    vm.aggregateResults = new Array(vm.page.tuples.length);
                    vm.pendingRowValues = {};

                    // if the getDisabledTuples was defined, this will have a value
                    if (result.disabledRows) {
                        vm.disabledRows = result.disabledRows;
                    }

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
                                        vm.pushMoreRowsPending = false;
                                    }
                                });
                            } else {
                                // we reached the end of the data to page in
                                vm.pushMoreRowsPending = false;
                                _mergeRowValuesAfterPushMoreRows(vm);
                            }
                        } else {
                            $log.debug("current global counter: ", vm.flowControlObject.counter);
                            $log.debug("counter", current, ": break out of push more rows");
                            $log.debug("counter", current, ": with uuid", pushMoreID);
                            $log.debug("counter", current, ": with global uuid", $rootScope.pushMoreID);
                            vm.pushMoreRowsPending = false;
                            _mergeRowValuesAfterPushMoreRows(vm);
                        }
                    }

                    $log.debug("counter", current, ": row values length ", rowValues.length);
                    vm.rowValues = [];
                    if (rowValues.length > rowLimit) {
                        vm.pushMoreRowsPending = true;
                        var uniqueIdentifier = $rootScope.pushMoreID = MathUtils.uuid();
                        $log.debug("counter", current, ": before push more rows with uuid", uniqueIdentifier);
                        _pushMoreRows(0, rowLimit, uniqueIdentifier);
                    } else {
                        vm.rowValues = rowValues;
                    }

                    vm.initialized = true;
                    // globally sets when the app state is ready to interact with
                    $rootScope.displayReady = true;

                    // make sure we're getting the data for aggregate columns
                    vm.aggregateModels.forEach(function (agg, i) {
                        if (vm.page.tuples.length > 0) {
                            agg.processed = false;
                            agg.reloadCauses = requestCauses;
                            if (!Number.isInteger(agg.reloadStartTime) || agg.reloadStartTime === -1) {
                                agg.reloadStartTime = ERMrest.getElapsedTime();
                            }

                        } else {
                            agg.processed = true;

                            // there are not matching rows, so there's no point in creating
                            // aggregate requests.
                            // make sure the spinner is hidden for the pending columns.
                            agg.activeListModel.objects.forEach(function (obj) {
                                if (obj.column) {
                                    vm.columnModels[obj.index].isLoading = false;
                                }
                            })
                        }
                    });

                    // empty the causes since now we're showing the value.
                    vm.reloadCauses = [];
                    vm.reloadStartTime = -1;

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

                // clear logObject since it was used just for the first request
                vm.logObject = {}
            }) (counterer, vm.reloadCauses, vm.reloadStartTime);
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

             var hasCauses = Array.isArray(vm._recountCauses) && vm._recountCauses.length > 0;
             var action = hasCauses ? logService.logActions.RECOUNT : logService.logActions.COUNT;
             var stack = getTableLogStack(vm);
             if (hasCauses) {
                 stack = logService.addCausesToStack(stack, vm._recountCauses, vm._recountStartTime);
             }
             vm.reference.getAggregates(
                 aggList,
                 {action: getTableLogAction(vm, action), stack: stack}
             ).then(function getAggregateCount(response) {
                 if (current !== vm.flowControlObject.counter) {
                     defer.resolve(false);
                     return defer.promise;
                 }

                 vm.countError = false;

                 vm.totalRowsCnt = response[0];

                 vm._recountCauses = [];
                 vm._recountStartTime = -1;

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

            update(vm, false, false, false, false);
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
        function update (vm, updateResult, updateCount, updateFacets, sameCounter, cause) {
            $log.debug("counter", vm.flowControlObject.counter ,"update called with res=" + updateResult + ", cnt=" + updateCount + ", facets=" + updateFacets + ", sameCnt=" + sameCounter + ", cause=" + cause);

            if (updateFacets) {
                vm.facetModels.forEach(function (fm, index) {
                    if (vm.lastActiveFacet === index) {
                        return;
                    }

                    if (fm.isOpen) {
                        if (!Number.isInteger(fm.reloadStartTime) || fm.reloadStartTime === -1) {
                            fm.reloadStartTime = ERMrest.getElapsedTime();
                        }
                        if (cause && fm.reloadCauses.indexOf(cause) === -1) {
                            fm.reloadCauses.push(cause);
                        }

                        fm.processed = false;
                        fm.isLoading = true;
                    } else {
                        fm.initialized = false;
                        fm.processed = true;
                    }
                });
            }

            if (updateResult) {
                if (!Number.isInteger(vm.reloadStartTime) || vm.reloadStartTime === -1) {
                    vm.reloadStartTime = ERMrest.getElapsedTime();
                }
                if (cause && vm.reloadCauses.indexOf(cause) === -1) {
                    vm.reloadCauses.push(cause);
                }
            }

            if (updateCount) {
                if (!Number.isInteger(vm._recountStartTime) || vm._recountStartTime === -1) {
                    vm._recountStartTime = ERMrest.getElapsedTime();
                }
                if (cause && vm._recountCauses.indexOf(cause) === -1) {
                    vm._recountCauses.push(cause);
                }
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

            logService.updateStackFilterInfo(getTableLogStack(vm), vm.reference.filterLogInfo);

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
                    isLoading: col.hasWaitFor === true || col.isUnique === false
                });
            });

            vm.aggregateModels = [];
            if (vm.reference.activeList) {
                vm.reference.activeList.requests.forEach(function (activeListModel) {
                    // we cannot capture the whole stack object here since it might get updated
                    var pcolStackNode = logService.getStackNode(
                        logService.logStackTypes.PSEUDO_COLUMN,
                        activeListModel.column.table,
                        { source: activeListModel.column.compressedDataSource, entity: activeListModel.column.isEntityMode, agg: activeListModel.column.aggregateFn}
                    );
                    vm.aggregateModels.push({
                        activeListModel: activeListModel, // the api that ermrestjs returns (has .objects and .column)
                        processed: true, // whether we should get the data or not
                        reloadCauses: [], // why the request is being sent to the server (might be empty)
                        reloadStartTime: -1, // when the page became dirty
                        logStackNode: pcolStackNode
                    });
                })
            }

            // only allowing single column sort here
            var location = vm.reference.location;
            if (location.sortObject) {
                vm.sortby = location.sortObject[0].column;
                vm.sortOrder = (location.sortObject[0].descending ? "desc" : "asc");
            }

            vm.reloadCauses = [];
            vm._recountCauses = [];
            vm.reloadStartTime = -1;
            vm._recountStartTime = -1;

            // can be used to refer to this current instance of table
            vm.internalID = MathUtils.uuid();
        }

        /**
         * Return the action string that should be used for logs.
         * @param {Object} vm - the vm object
         * @param {String} actionPath - the ui context and verb
         * @param {String=} childStackPath - if we're getting the action for child (facet, pseudo-column)
         */
        function getTableLogAction(vm, actionPath, childStackPath) {
            var stackPath = vm.logStackPath ? vm.logStackPath : logService.logStackPaths.SET;
            if (childStackPath) {
                stackPath = logService.getStackPath(stackPath, childStackPath);
            }
            var appMode = vm.logAppMode ? vm.logAppMode : null;
            return logService.getActionString(actionPath, stackPath, appMode);
        }

        /**
         * Returns the stack object that should be used
         */
        function getTableLogStack(vm, childStackElement, extraInfo) {
            var stack = vm.logStack;
            if (childStackElement) {
                stack = vm.logStack.concat(childStackElement);
            }
            if (extraInfo) {
                return logService.addExtraInfoToStack(stack, extraInfo);
            }
            return stack;
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


                    logService.logClientAction(
                        {
                            action: getTableLogAction(scope.vm, logService.logActions.SORT),
                            stack: getTableLogStack(scope.vm)
                        },
                        scope.vm.reference.defaultLogInfo
                    );
                    update(scope.vm, true, false, false, false, logService.reloadCauses.SORT);
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

                    logService.logClientAction(
                        {
                            action: getTableLogAction(scope.vm, logService.logActions.PAGE_PREV),
                            stack: getTableLogStack(scope.vm)
                        },
                        scope.vm.reference.defaultLogInfo
                    );

                    update(scope.vm, true, false, false, false, logService.reloadCauses.PAGE_PREV);
                }
            };

            scope.after = function() {
                var next = scope.vm.page.next;
                if (next && scope.$root.checkReferenceURL(next)) {
                    scope.vm.reference = next;
                    $log.debug('counter', scope.vm.flowControlObject.counter ,': request for next page');

                    logService.logClientAction(
                        {
                            action: getTableLogAction(scope.vm, logService.logActions.PAGE_NEXT),
                            stack: getTableLogStack(scope.vm)
                        },
                        scope.vm.reference.defaultLogInfo
                    );

                    update(scope.vm, true, false, false, false, logService.reloadCauses.PAGE_NEXT);
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
                logService.logClientAction(
                    {
                        action: getTableLogAction(scope.vm, logService.logActions.PAGE_DESELECT_ALL),
                        stack: getTableLogStack(scope.vm)
                    },
                    scope.vm.reference.defaultLogInfo
                );

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
                logService.logClientAction(
                    {
                        action: getTableLogAction(scope.vm, logService.logActions.PAGE_SELECT_ALL),
                        stack: getTableLogStack(scope.vm)
                    },
                    scope.vm.reference.defaultLogInfo
                );

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

            // used to capture left click events on permalink button
            scope.copyPermalink = function () {
                logService.logClientAction(
                    {
                        action: getTableLogAction(scope.vm, logService.logActions.PERMALINK_LEFT),
                        stack: getTableLogStack(scope.vm)
                    },
                    scope.vm.reference.defaultLogInfo
                );

                var text = scope.getRecordsetLink();

                // Create a dummy input to put the text string into it, select it, then copy it
                // this has to be done because of HTML security and not letting scripts just copy stuff to the clipboard
                // it has to be a user initiated action that is done through the DOM object
                var dummy = angular.element('<input></input>');
                dummy.attr("visibility", "hidden");
                dummy.attr("display", "none");

                document.body.appendChild(dummy[0]);

                dummy.attr("id", "permalink_copy");
                document.getElementById("permalink_copy").value = text;
                dummy.select();
                document.execCommand("copy");

                document.body.removeChild(dummy[0]);
            }

            scope.toggleFacetPanel = function () {
                var panelOpen = scope.vm.config.facetPanelOpen;

                // log the action
                var action = panelOpen ? logService.logActions.FACET_PANEL_HIDE : logService.logActions.FACET_PANEL_SHOW;
                logService.logClientAction(
                    {
                        action: getTableLogAction(scope.vm, action),
                        stack: getTableLogStack(scope.vm)
                    },
                    scope.vm.reference.defaultLogInfo
                );

                scope.vm.config.facetPanelOpen = !scope.vm.config.facetPanelOpen;
            }

            scope.search = function(term, action) {

                if (term) term = term.trim();

                var ref = scope.vm.reference.search(term); // this will clear previous search first
                 if (scope.$root.checkReferenceURL(ref)) {
                     scope.vm.search = term;
                     scope.vm.reference = ref;
                     scope.vm.lastActiveFacet = -1;
                     $log.debug('counter', scope.vm.flowControlObject.counter ,': new search term=' + term);

                     // log the client action
                     var extraInfo = typeof term === "string" ? {"search-str": term} : {};
                     logService.logClientAction({
                         action:getTableLogAction(scope.vm, action),
                         stack: getTableLogStack(scope.vm, null, extraInfo)
                     }, scope.vm.reference.defaultLogInfo);

                     update(scope.vm, true, true, true, false, logService.reloadCauses.SEARCH_BOX);
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

                // log the client action
                logService.logClientAction({
                    action:getTableLogAction(scope.vm, logService.logActions.SELECTION_CLEAR),
                    stack: getTableLogStack(scope.vm)
                }, scope.vm.reference.defaultLogInfo);

                _callonSelectedRowsChanged(scope, tuple, false);
            };

            // function for removing all pills regardless of what page they are on, clears the whole selectedRows array
            scope.removeAllPills = function($event) {

                // log the client action
                logService.logClientAction({
                    action:getTableLogAction(scope.vm, logService.logActions.SELECTION_CLEAR_ALL),
                    stack: getTableLogStack(scope.vm)
                }, scope.vm.reference.defaultLogInfo);

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

                if (completed > 0 || updated) {
                    $log.debug('counter', scope.vm.flowControlObject.counter ,': focused on page after update');
                    updated = false;

                    scope.vm.lastActiveFacet = -1;
                    var cause = completed ? logService.reloadCauses.ENTITY_CREATE : logService.reloadCauses.ENTITY_UPDATE;
                    update(scope.vm, true, true, true, false, cause);
                }

            };

            // allow child window to call to indicate table has been updated
            // called from form.controller.js to communicate that an entity was just updated
            window.updated = function() {
                updated = true;
            };

            // listen to facet change
            angular.forEach([logService.reloadCauses.CLEAR_ALL, logService.reloadCauses.FACET_MODIFIED,
                            logService.reloadCauses.FACET_SELECT, logService.reloadCauses.FACET_DESELECT,
                            logService.reloadCauses.FACET_CLEAR, logService.reloadCauses.CLEAR_CFACET,
                            logService.reloadCauses.CLEAR_CUSTOM_FILTER], function (evMessage) {
                scope.$on(evMessage, function ($event) {
                    $log.debug("-----------------------------");
                    $log.debug('counter', scope.vm.flowControlObject.counter, ': ' + evMessage + ' in recordset directive');
                    update(scope.vm, true, true, true, false ,evMessage);
                });
            })

            scope.$on('record-deleted', function ($event) {
                $log.debug("-----------------------------");
                $log.debug('counter', scope.vm.flowControlObject.counter, ': record-deleted in recordset directive');
                scope.vm.lastActiveFacet = -1;

                update(scope.vm, true, true, true, false, logService.reloadCauses.ENTITY_DELETE);
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

            /**
             * initialize the recordset. This includes:
             *  - populating the facetModels value.
             *  - scrolling to the first open facet.
             *  - initialize flow-control
             */
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

                    // show the main search box columns
                    scope.searchColumns = scope.vm.reference.searchColumns;

                    initialize(scope.vm);
                });
            };

            /**
             * This function will be called when the DOM is initialized and vm is present.
             * So we can do DOM manipulations and attach the resize events
             * NOTE When this function is called the data has not been load yet
             */
            var manipulateRecordsetDOMElements = function () {
                //call the resize sensors for adjusting the container height
                // we need to call this here (before data load) so the loading spinner shows in the correct spot
                UiUtils.attachContainerHeightSensors(scope.parentContainer, scope.parentStickyArea);

                // fix footer styles
                if (scope.vm.config.displayMode === recordsetDisplayModes.fullscreen) {
                    UiUtils.attachFooterResizeSensor(0);
                }

                // capture and log the right click event on the permalink button
                var permalink = document.getElementById('permalink');
                if (permalink) {
                    permalink.addEventListener('contextmenu', function (e) {
                        logService.logClientAction({
                            action: getTableLogAction(scope.vm, logService.logActions.PERMALINK_RIGHT),
                            stack: getTableLogStack(scope.vm)
                        }, scope.vm.reference.defaultLogInfo);
                    });
                }
            };

            var attachDOMElementsToScope = function (scope) {
                // set the parentContainer element
                if (scope.vm.parentContainerSelector) {
                    scope.parentContainer = document.querySelector(scope.vm.parentContainerSelector);
                } else {
                    scope.parentContainer = document.querySelector("body");
                }

                // set the sticky area selector container
                if (scope.vm.parentStickyAreaSelector) {
                    scope.parentStickyArea = document.querySelector(scope.vm.parentStickyAreaSelector);
                }

                // all the elements that should be resizable alongside the facet panel
                scope.resizePartners = scope.parentContainer.querySelectorAll(".top-left-panel");
            };

            // initialize the recordset when it's ready to be initialized
            attachDOMElementsToScope(scope);
            var recordsetDOMInitializedWatcher = scope.$watch(function () {
                return recordsetReadyToInitialize(scope);
            }, function (newValue, oldValue) {
                if(angular.equals(newValue, oldValue) || !newValue){
                    return;
                }

                // DOM manipulations
                manipulateRecordsetDOMElements();

                // call the flow-control to fetch the data
                initializeRecordset(scope);

                // unbind the wwatcher
                recordsetDOMInitializedWatcher();
            });

            // the recordset data is initialized, so we can do extra manipulations if we need to
            var recordsetDataInitializedWatcher = scope.$watch(function () {
                return scope.vm.initialized;
            }, function (newValue, oldValue) {
                if (newValue) {

                    /*
                     * We are attaching the padding sensor here because we don't want to
                     * change the padding while the container is not still visible to the users.
                     * If we call this function before data initialization, you could see more
                     * jittering on the page for the cases that a scrollbar was visible.
                     * refer to https://github.com/informatics-isi-edu/chaise/pull/1866 for more info
                     */

                    // make sure the padding of main-container is correctly set
                    UiUtils.attachMainContainerPaddingSensor(scope.parentContainer);

                    // unbind the watcher
                    recordsetDataInitializedWatcher();
                }
            });

            // we might be able to initialize the recordset when it's loading
            if (recordsetReadyToInitialize(scope)) {
                manipulateRecordsetDOMElements();
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
            FlowControlObject: FlowControlObject,
            getTableLogAction: getTableLogAction,
            getTableLogStack: getTableLogStack
        };
    }])


    .directive('tableHeader', ['logService', 'MathUtils', 'messageMap', 'recordsetDisplayModes', 'recordTableUtils', 'UriUtils', '$window', function(logService, MathUtils, messageMap, recordsetDisplayModes, recordTableUtils, UriUtils, $window) {
        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/tableHeader.html',
            scope: {
                vm: '='
            },
            link: function (scope, elem, attr) {
                scope.recordsetDisplayModes = recordsetDisplayModes;

                scope.pageLimits = [10, 25, 50, 75, 100, 200];
                var insertCustomPageLimit = scope.$watch('vm.readyToInitialize', function () {
                    if (scope.vm.readyToInitialize == true && scope.pageLimits.indexOf(scope.vm.pageLimit) === -1) {
                        scope.pageLimits.push(scope.vm.pageLimit);
                        scope.pageLimits.sort(function(a, b) {
                            return a - b;
                        });
                        insertCustomPageLimit();
                    }
                });

                scope.setPageLimit = function(limit) {
                    scope.vm.pageLimit = limit;

                    logService.logClientAction(
                        {
                            action: recordTableUtils.getTableLogAction(scope.vm, logService.logActions.PAGE_SIZE_SELECT),
                            stack: recordTableUtils.getTableLogStack(scope.vm, null, {"page-size": limit})
                        },
                        scope.vm.reference.defaultLogInfo
                    );

                    recordTableUtils.update(scope.vm, true, false, false, false, logService.reloadCauses.PAGE_LIMIT);
                };

                scope.pageSizeDropdownToggle = function (open) {
                    if (!open) return;
                    logService.logClientAction(
                        {
                            action: recordTableUtils.getTableLogAction(scope.vm, logService.logActions.PAGE_SIZE_OEPN),
                            stack: recordTableUtils.getTableLogStack(scope.vm)
                        },
                        scope.vm.reference.defaultLogInfo
                    );
                }

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

                    if (scope.vm.config.displayMode !== recordsetDisplayModes.fullscreen) {
                        logService.logClientAction(
                            {
                                action: recordTableUtils.getTableLogAction(scope.vm, logService.logActions.ADD_INTEND),
                                stack: recordTableUtils.getTableLogStack(scope.vm)
                            },
                            scope.vm.reference.defaultLogInfo
                        );
                    }

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

                // the text that we should display before the page-size-dropdown
                scope.prependLabel = function () {
                    if (scope.vm.page && scope.vm.page.tuples.length > 0) {
                        var page = scope.vm.page;
                        if (page.hasNext && !page.hasPrevious) {
                            return "first";
                        }

                        if (!page.hasNext && page.hasPrevious) {
                            return "last";
                        }

                        if (!page.hasNext && !page.hasPrevious) {
                            return "all";
                        }
                        return "";
                    }
                };

                // the text that we should display after the page-size-dropdown
                scope.appendLabel = function () {
                    var vm = scope.vm;
                    if (!vm || !vm.page) return "";

                    var records = "records";
                    if (vm.reference.location.isConstrained && vm.config.displayMode.indexOf(recordsetDisplayModes.related) !== 0) {
                        records = "matching results";
                    }

                    if (vm.page.tuples.length === 0) {
                        return "0 " + records;
                    }

                    var label = "";
                    if (vm.totalRowsCnt && !vm.tableError) {
                        label += "of ";
                        if (vm.totalRowsCnt > vm.rowValues.length) {
                            label += vm.totalRowsCnt.toLocaleString() + " ";
                        } else {
                            label += vm.rowValues.length.toLocaleString() + " ";
                        }
                    }
                    return label + records;
                }

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
                registerSetPageState: "&?",
                test: "@"
            },
            link: function (scope, elem, attrs) {
                recordTableUtils.registerRecordsetCallbacks(scope, elem, attrs);
            }
        };
    }]);
})();
