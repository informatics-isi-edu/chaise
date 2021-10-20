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
            ['AlertsService', 'ConfigUtils', 'DataUtils', 'defaultDisplayname', 'Errors', 'ErrorService', 'logService', 'MathUtils', 'messageMap', 'modalBox', 'modalUtils', 'recordCreate', 'recordsetDisplayModes', 'Session', 'tableConstants', 'UiUtils', 'UriUtils', '$cookies', '$document', '$log', '$q', '$rootScope', '$timeout', '$window',
            function(AlertsService, ConfigUtils, DataUtils, defaultDisplayname, Errors, ErrorService, logService, MathUtils, messageMap, modalBox, modalUtils, recordCreate, recordsetDisplayModes, Session, tableConstants, UiUtils, UriUtils, $cookies, $document, $log, $q, $rootScope, $timeout, $window) {

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
                            $log.warn(err);
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
                // the places that we want to show edit or delete button, we should also ask for trs
                // NOTE technically this should be based on passed config options but we're passing editable
                //      to mean both edit and create, so it's not really useful here
                var getTRS = vm.config.displayMode.indexOf(recordsetDisplayModes.related) === 0 ||
                             vm.config.displayMode === recordsetDisplayModes.fullscreen;

                // if it's in related entity section, we should fetch the
                // unlink trs (acl) of association tables
                var getUnlinkTRS = vm.config.displayMode.indexOf(recordsetDisplayModes.related) === 0 &&
                                   vm.reference.derivedAssociationReference;

                vm.reference.read(vm.pageLimit, logParams, false, false, getTRS, false, getUnlinkTRS).then(function (page) {
                    if (current !== vm.flowControlObject.counter) {
                        defer.resolve(false);
                        return defer.promise;
                    }

                    $log.debug("counter", current, ": read main successful.");


                    return vm.getFavorites ? vm.getFavorites(vm, page) : {page: page};
                }).then(function (result) {
                    return vm.getDisabledTuples ? vm.getDisabledTuples(vm, result.page, requestCauses, reloadStartTime) : {page: result.page};
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
         * @param  {string?} cause why we're calling this function (optional)
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

            // do not fetch table count if hideRowCount is set in the annotation for the table
            // this is because the query takes too long sometimes
            if(!vm.reference.display || !vm.reference.display.hideRowCount){
                // update the count
                _updateMainCount(vm, _updatePage);
            }

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
        * Registers the callbacks for favorites functionality used in faceting and ellipsis
        * @param  {object} scope the scope object
        */
       function registerFavoritesCallbacks(scope, elem, attrs) {
           scope.toggleFavorite = function (tupleData, favoriteTable,isFavorite) {
               var defer = $q.defer();

               var favoriteTablePath = favoriteTable.favoritesPath;

               // TODO: show spinning wheel and disable star
               // if not a favorite, add it
               if (!isFavorite) {
                   ERMrest.resolve($window.location.origin + favoriteTablePath, ConfigUtils.getContextHeaderParams()).then(function (favoriteReference) {
                       var rows = [{}],
                           favoriteRow = rows[0];

                       // assumption that the column to store the id information is the name of the table
                       // assumption that the data to store in above mentioned column is the value of the id column
                       // assupmtion that the column to store the user information is the user_id column
                       // TODO: add all three to config language
                       favoriteRow[favoriteTable.name] = tupleData.id
                       favoriteRow.user_id = scope.$root.session.client.id;

                       // TODO pass proper log object
                       // passing skipOnConflict so it won't return 409 when it encounters a duplicate
                       return favoriteReference.contextualize.entryCreate.create(rows, null, true);
                   }).then(function success() {
                       // toggle favorite
                       $log.debug("favorite created");
                       // return true (favorite)
                       defer.resolve(true);
                   }).catch(function (error) {
                       // an error here could mean a misconfiguration of the favorite_* ermrest table path
                       // or some error while trying to create
                       $log.warn(error);

                       // return false (not favorite)
                       defer.reject(false);
                   });
               } else {
                   // assumption that the column to delete the id information is the name of the table
                   // assumption that the data to associate for delete in above mentioned column is the value of the id column
                   // assupmtion that the column to delete the user information is the user_id column
                   // TODO: add all three to config language
                   var deleteFavoritePath = $window.location.origin + favoriteTablePath + "/" + UriUtils.fixedEncodeURIComponent(favoriteTable.name) + "=" + UriUtils.fixedEncodeURIComponent(tupleData.id) + "&user_id=" + UriUtils.fixedEncodeURIComponent(scope.$root.session.client.id);
                   // if favorited, delete it
                   ERMrest.resolve(deleteFavoritePath, ConfigUtils.getContextHeaderParams()).then(function (favoriteReference) {
                       // delete the favorite
                       return favoriteReference.delete();
                   }).then(function success() {
                       // toggle favorite
                       $log.debug("favorite deleted");
                       // return false (not favorite)
                       defer.resolve(false);
                   }, function error(error) {
                        // TODO hacky
                        // NOTE: 404 could mean it was already deleted, so update UI to show that
                        if (error.code === 404) {
                            // return false (not favorite)
                            defer.resolve(false);
                        } else {
                            // TODO: what to do for error handling
                            $log.warn("favorite delete failed")
                            $log.warn(error);
                            // return true (favorite)
                            defer.reject(true);
                        }
                   }).catch(function (error) {
                       // an error here could mean a misconfiguration of the favorite_* ermrest table path
                       $log.warn(error);

                       // return true (favorite)
                       defer.reject(true);
                   });
               }

               return defer.promise;
           }
       }

        /**
         * Transform facets to a more stable version that can be saved.
         * The overal returned format is like the following:
         * {
         *  "and": [
         *    {
         *      "sourcekey": "key",
         *      "choices": [v1, v2, ..],
         *      "source_domain": {
         *        "schema":
         *        "table":
         *        "column":
         *      }
         *    }
         *  ]
         * }
         * NOTE: will return null if there aren't any facets
         */
        function _getStableFacets(scope) {
            var filters = [];
            if (scope.vm.search) {
                // TODO this is a bit hacky
                filters.push({"sourcekey": "search-box", "search": [scope.vm.search]});
            }
            if (!scope.vm.hasFilter()) {
                if (filters.length > 0) {
                    return {"and": filters};
                } else {
                    return null;
                }
            }
            for (var i = 0; i < scope.vm.facetModels.length; i++) {
                var fm = scope.vm.facetModels[i],
                    fc = scope.vm.reference.facetColumns[i];

                if (fm.appliedFilters.length == 0) {
                    continue;
                }

                var filter = fc.toJSON();

                // we should use sourcekey if we have it
                // NOTE accessing private variable
                if (fc._facetObject.sourcekey) {
                    delete filter.source;
                    filter.sourcekey = fc._facetObject.sourcekey;
                }

                // add entity mode
                filter.entity = fc.isEntityMode;

                // add markdown_name
                filter.markdown_name = DataUtils.getDisplaynameInnerText(fc.displayname);

                // encode source_domain
                filter.source_domain = {
                    schema: fc.column.table.schema.name,
                    table: fc.column.table.name,
                    column: fc.column.name,
                };

                // in entity choice mode we have to map to stable key
                if (fc.isEntityMode && fc.preferredMode === "choices") {
                    var stableKeyCols = fc.column.table.stableKey, stableKeyColName;
                    stableKeyColName = stableKeyCols[0].name;
                    if (stableKeyColName != fc.column.name) {
                        // TODO we're assuming that it's just simple key,
                        //     if this assumption has changed, we should change this implementation too
                        // we have to change the column and choices values
                        filter.source_domain.column = stableKeyColName;
                        filter.choices = [];


                        for (var j = 0; j < fm.appliedFilters.length; j++) {
                            var af = fm.appliedFilters[j];
                            // ignore the not-null choice (it's already encoded and we don't need to map it)
                            if (af.isNotNull) {
                                continue;
                            }
                            // add the null choice manually
                            if (af.uniqueId == null) {
                                filter.choices.push(null);
                            } else {
                                filter.choices.push(af.tuple.data[stableKeyColName]);
                            }
                        }
                    }
                }

                // make sure the items are sorted so it's not based on user selection
                if (Array.isArray(filter.choices)) {
                    filter.choices.sort();
                }

                filters.push(filter);
            }

            return {"and": filters};
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

            /**
             * When the directive DOM is loaded, all the elements that
             * we need for top-horizontal logic are loaded as well and therefore
             * we don't need to wait for any condition.
             * NOTE if we add a condition to hide an element, we should add a
             * watcher for this one as well.
             */
            UiUtils.addTopHorizontalScroll(elem[0]);
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

            // this function is called after recordset triggers that the reference is readyToInitialize
            // scope.$root.savedQuery is set once we have a reference
            function registerSavedQueryFunctions () {
                scope.showSavedQueryUI = scope.$root.savedQuery.showUI;
                // if the UI should not be shown return before doing anything
                if (!scope.showSavedQueryUI) return;

                ERMrest.resolve($window.location.origin + scope.$root.savedQuery.ermrestTablePath, ConfigUtils.getContextHeaderParams()).then(function (savedQueryReference) {
                    scope.vm.savedQueryReference = savedQueryReference;
                }).catch(function (error) {
                    // an error here could mean a misconfiguration of the saved query ermrest table path
                    $log.warn(error);

                    throw error;
                });

                var _disableSavedQueryButton;
                scope.disableSavedQueryButton = function () {
                    if (_disableSavedQueryButton === undefined && scope.vm.savedQueryReference) {
                        // if insert is false, disable the button
                        // should this be checking for insert !== true
                        _disableSavedQueryButton = !scope.vm.savedQueryReference.table.rights.insert;
                    }

                    return _disableSavedQueryButton;
                }

                // string constant used for both saved query functions
                var facetTxt = "*::facets::";
                scope.saveQuery = function () {
                    var chaiseConfig = ConfigUtils.getConfigJSON();
                    var columnModels = [];
                    var savedQueryReference = scope.vm.savedQueryReference.contextualize.entryCreate;
                    var savedQueryConfig = scope.$root.savedQuery;

                    var rowData = {
                        rows: [{}],
                        submissionRows: [{}],
                        foreignKeyData: [{}],
                        oldRows: [{}]
                    };

                    // set columns list
                    savedQueryReference.columns.forEach(function (col) {
                        columnModels.push(recordCreate.columnToColumnModel(col));
                    });

                    var isDescriptionMarkdown = columnModels.filter(function (model) {
                        return model.column.name == "description"
                    })[0].inputType == "longtext"

                    function facetOptionsToString (options) {
                        var str = "";
                        options.forEach(function (option, idx) {
                            var name = option.displayname.value;
                            if (name === null) {
                                str += " _No value_";
                            } else if (name === "<i>All records with value </i>") {
                                str += " _All records with value_"
                            } else if (name === '') {
                                str += " _Empty_"
                            } else {
                                str += " " + name;
                            }
                            if (idx+1 != options.length) str += ","
                        });
                        return str;
                    }

                    function facetDescription (facet, optionsString, notLastIdx) {
                        var value = (isDescriptionMarkdown ? "  -" : "") + facet + ":" + optionsString + ";";
                        if (notLastIdx) value += "\n";

                        return value;
                    }

                    /*
                     * The following code is for creating the default name and description
                     *
                     * `name` begins with the reference displayname and "with". The rest of the name is created by
                     * iterating over each facet and the selections made in the facets. The value appended to the
                     * name for each facet will follow 1 of 3 formats:
                     *   1. listing the options if under the numFacetChoices and facetTextLength thresholds
                     *      <option1>, <option2>, <option3>, ...
                     *   2. in the case of ranges, listing the facet displayname and the selections if under the numFacetChoices and facetTextLength thresholds
                     *      <facet displayname> (<option1>, <option2>, <option3>, ...)
                     *   3. listing the facet displayname and number of selections if over either of the numFacetChoices or facetTextLength thresholds
                     *      <facet displayname> (6 choices)
                     * If the name after appending all facet names together is over the nameLength threshold,
                     * a further shortened syntax is used for the whole name:
                     *     <reference displayname> with x facets: <facet1 displayname>, <facet2 displayname>, <facet3 displayname>, ...
                     *
                     * `description` begins with the reference displayname and "with" also. The rest of the
                     * description is created by iterating over each facet and the selections made in the facets.
                     * description format for each facet is generally:
                     *     <facet displayname> (x choices): <option1>, <option2>, <option3>, ...
                     *
                     * The format for description slightly differs depending on whether the input type is text
                     * or longtext. If longtext, each facet description is preceded by a hyphen (`-`) and is on a new line.
                     * Otherwise, the description is all one line with no hyphens
                     */
                    var nameDescriptionPrefix = scope.vm.reference.displayname.value + " with";
                    var facetNames = "";

                    var name = nameDescriptionPrefix
                    var description = nameDescriptionPrefix + ":\n";

                    var modelsWFilters = scope.vm.facetModels.filter(function (fm, idx) {
                        fm.displayname = scope.vm.reference.facetColumns[idx].displayname.value;
                        fm.preferredMode = scope.vm.reference.facetColumns[idx].preferredMode;
                        return (fm.appliedFilters.length > 0);
                    });

                    if (scope.vm.search) {
                        name += " " + scope.vm.search + ";";
                        description += facetDescription(" Search", scope.vm.search, modelsWFilters.length > 0)
                    }

                    // iterate over the facetModels to create the default name and description values;
                    modelsWFilters.forEach(function (fm, modelIdx) {
                        // ===== setting default name =====
                        // create the facetNames string in the case the name after creating the string with all facets and option names is longer than the nameLengthThreshold
                        facetNames += " " + fm.displayname;
                        if (modelIdx+1 != modelsWFilters.length) facetNames += ",";

                        var numChoices = fm.appliedFilters.length;
                        var facetDetails = " " + fm.displayname + " (" + numChoices + " choice" + (numChoices > 1 ? 's' : '') + ")";
                        // set to default value to use if the threshold are broken
                        var facetInfo = facetDetails;

                        // used for the description and name if not too long
                        var facetOptionsString = ""; // the concatenation of facet option names
                        if (fm.preferredMode == "ranges") facetOptionsString += " " + fm.displayname + " (";
                        facetOptionsString += facetOptionsToString(fm.appliedFilters);
                        if (fm.preferredMode == "ranges") facetOptionsString += ")";

                        // savedQueryConfig.defaultNameLimits.keys -> [ facetChoiceLimit, facetTextLimit, totalTextLimit ]
                        if (fm.appliedFilters.length <= savedQueryConfig.defaultNameLimits.facetChoiceLimit && facetOptionsString.length <= savedQueryConfig.defaultNameLimits.facetTextLimit) facetInfo = facetOptionsString;
                        name += facetInfo + ";"

                        // ===== setting default description =====
                        description += facetDescription(facetDetails, facetOptionsString, modelIdx+1 != modelsWFilters.length);
                    });

                    // if name is longer than the set string length threshold, show the compact version with facet names only
                    if (name.length > savedQueryConfig.defaultNameLimits.totalTextLimit) name = nameDescriptionPrefix + " " + modelsWFilters.length + " facets:" + facetNames;

                    rowData.rows[0].name = name;
                    rowData.rows[0].description = description;

                    // get the stable facet
                    var facetObj = _getStableFacets(scope);
                    var query_id = SparkMD5.hash(JSON.stringify(facetObj));

                    // set id based on hash of `facets` columns
                    rowData.rows[0].query_id = query_id;
                    rowData.rows[0].encoded_facets = facetObj ? ERMrest.encodeFacet(facetObj) : null;
                    rowData.rows[0].facets = facetObj;
                    rowData.rows[0].table_name = scope.vm.reference.table.name;
                    rowData.rows[0].schema_name = scope.vm.reference.table.schema.name;
                    rowData.rows[0].user_id = scope.$root.session.client.id;

                    var row = rowData.rows[0];
                    // check to see if the saved query exists for the given user, table, schema, and selected facets
                    var queryUri = savedQueryReference.uri + "/user_id=" + UriUtils.fixedEncodeURIComponent(row.user_id) + "&schema_name=" + UriUtils.fixedEncodeURIComponent(row.schema_name) + "&table_name=" + UriUtils.fixedEncodeURIComponent(row.table_name) + "&query_id=" + row.query_id;

                    var headers = {};
                    headers[ERMrest.contextHeaderName] = ConfigUtils.getContextHeaderParams();
                    ERMrest.resolve(queryUri, {headers: headers}).then(function (response) {
                        console.log("reference: ", response);

                        return response.read(1);
                    }).then(function (page) {
                        // if a row is returned, a query with this set of facets exists already
                        if (page.tuples.length > 0) {
                            modalUtils.showModal({
                                templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/duplicateSavedQuery.modal.html",
                                windowClass:"duplicate-saved-query",
                                controller: "DuplicateSavedQueryModalDialogController",
                                controllerAs: "ctrl",
                                keyboard: true,
                                resolve: {
                                    params: {
                                        tuple: page.tuples[0]
                                    }
                                }
                            }, null, null, false, false);
                        } else {
                            modalUtils.showModal({
                                templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/createSavedQuery.modal.html",
                                windowClass:"create-saved-query",
                                controller: "SavedQueryModalDialogController",
                                controllerAs: "ctrl",
                                size: "md",
                                keyboard: true,
                                resolve: {
                                    params: {
                                        reference: savedQueryReference,
                                        parentReference: scope.vm.reference,
                                        columnModels: columnModels,
                                        rowData: rowData
                                    }
                                }
                            }, function success() {
                                // notify user of success before closing
                                AlertsService.addAlert("Search criteria saved.", "success");
                            }, null, false, false);
                        }
                    }).catch(function (err) {
                        $log.debug(err);
                    });
                }

                scope.showSavedQueries = function () {
                    var chaiseConfig = ConfigUtils.getConfigJSON();

                    var facetBlob = {
                        and: [{
                            choices: [scope.vm.reference.table.name],
                            source: "table_name" // name of column storing table name in saved_query table
                        }, {
                            choices: [scope.$root.session.client.id],
                            source: "user_id"
                        }]
                    }

                    ERMrest.resolve(scope.vm.savedQueryReference.uri + "/" + facetTxt + ERMrest.encodeFacet(facetBlob) + "@sort(last_execution_time::desc::)", ConfigUtils.getContextHeaderParams()).then(function (savedQueryReference) {
                        // we don't want to allow faceting in the popup
                        savedQueryReference = savedQueryReference.contextualize.compactSelect.hideFacets();

                        var params = {};

                        params.parentReference = scope.vm.reference;
                        params.saveQueryRecordset = true;
                        // used popup/savedquery so that we can configure which button to show and change the modal title
                        params.displayMode = recordsetDisplayModes.savedQuery;
                        params.reference = savedQueryReference;
                        params.selectedRows = [];
                        params.showFaceting = false;
                        // faceting not allowed, make sure panel is collapsed too just in case
                        params.facetPanelOpen = false;
                        params.allowDelete = true;

                        // TODO: fix logging stuff
                        var stackElement = logService.getStackNode(
                            logService.logStackTypes.SET,
                            params.reference.table,
                            {source: savedQueryReference.compressedDataSource, entity: true}
                        );

                        var logStack = logService.getStackObject(stackElement),
                        logStackPath = logService.getStackPath("", logService.logStackPaths.SAVED_QUERY_SELECT_POPUP);

                        params.logStack = logStack;
                        params.logStackPath = logStackPath;

                        modalUtils.showModal({
                            animation: false,
                            controller: "SearchPopupController",
                            windowClass: "search-popup",
                            controllerAs: "ctrl",
                            resolve: {
                                params: params
                            },
                            size: "lg",
                            templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/searchPopup.modal.html"
                        }, function (res) {
                            // ellipsis creates a link attached to the button instead of returning here to redirect
                            // TODO: return from modal and update page instead of reloading
                        }, null, false, false);
                    }).catch(function (error) {
                        $log.warn(error);

                        throw error;
                    });
                }
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

            // if reference.column list changed, update columnModels
            scope.$watch(function () {
                return (scope.vm && scope.vm.reference) ? scope.vm.reference.columns : null;
            }, function (newValue, oldValue) {
                if(!newValue){
                    return;
                }
                _attachExtraAttributes(scope.vm);
            });

            /**
             * Order of events:
             * - vm.readyToInitialize shoubl be set to true when we're ready to initialize
             * - `recordsetReadyToInitializeWatcher` will call `generateFacetColumns` which will
             *   set vm.facetColumnsReady = true
             *   (if facet list is empty, `facetDirectivesLoaded=true` will be called manually)
             * - based on ng-if in recordset directive, faceting will load and populate the facets
             *   and will emit `facetDirectivesLoaded` event, which will set facetDirectivesLoaded=true
             *   (when we're not showing any facets, )
             * - when `facetDirectivesLoaded` is true, recordset structure is ready. so
             *   `recordsetStructureReadyWatcher` watcher will call `initializeRecordsetData`
             *
             * @param {*} scope
             * @returns
             */
            var recordsetReadyToInitializeStructure = function (scope) {
                return scope.vm.readyToInitialize;
            }

            scope.$on('facetDirectivesLoaded', function () {
                $log.debug("all directives loaded");
                scope.facetDirectivesLoaded = true;
            });

            var recordsetStructureReady = function (scope) {
                return scope.facetDirectivesLoaded;
            };

            var initializeRecordsetStructure = function (scope) {
                if (scope.ignoreFaceting) {
                    scope.vm.facetDirectivesLoaded = true;
                    return;
                }

                // NOTE this will affect the reference uri so it must be
                //      done before initializing recordset
                scope.vm.reference.generateFacetColumns().then(function (res) {
                    scope.vm.facetColumnsReady = true;

                    // if facetColumns were empty, we have to manually set the
                    // facetDirectivesLoaded to true
                    if (res.facetColumns.length === 0) {
                        scope.facetDirectivesLoaded = true;
                    }

                    /**
                     * When there are issues in the given facet,
                     * - recordset should just load the data based on the remaining
                     *  facets that had no issue
                     * - we should show an error and let users know that there were some
                     *   issues.
                     * - we should keep the browser location like original to allow users to
                     *   refresh and try again. Also the issue might be happening because they
                     *   are not logged in. So we should keep the location like original so after
                     *   logging in they can get back to the page.
                     * - Dismissing the error should change the browser location.
                     */
                    if (res.issues) {
                        var cb = function () {
                            $rootScope.$emit('reference-modified');
                        };
                        ErrorService.handleException(res.issues, false, false, cb, cb);
                    } else {
                        if ($rootScope.savedQuery && $rootScope.savedQuery.rid) {
                            var rows = [{}],
                                updateRow = rows[0];

                            updateRow.RID = $rootScope.savedQuery.rid
                            updateRow.last_execution_time = "now";

                            // attributegroup/CFDE:saved_query/RID;last_execution_status
                            ConfigUtils.getHTTPService().put($window.location.origin + $rootScope.savedQuery.ermrestAGPath + "/RID;last_execution_time", rows).then(function (response) {
                                $log.debug("new last executed time: ", response);
                            }).catch(function (error) {
                                $log.warn("saved query last executed time could not be updated");
                                $log.warn(error);
                            });
                        }
                    }
                }).catch(function (exception) {
                    $log.warn(exception);
                    scope.vm.hasLoaded = true;
                    if (DataUtils.isObjectAndKeyDefined(exception.errorData, 'redirectPath')) {
                        exception.errorData.redirectUrl = UriUtils.createRedirectLinkFromPath(exception.errorData.redirectPath);
                    }
                    throw exception;
                });
            }

            /**
             * initialize the recordset. This includes:
             *  - populating the facetModels value.
             *  - scrolling to the first open facet.
             *  - initialize flow-control
             */
            var initializeRecordsetData = function (scope) {
                $timeout(function() {
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

            // initialize the recordset structure when it's ready
            var recordsetReadyToInitializeStructureWatcher = scope.$watch(function () {
                return recordsetReadyToInitializeStructure(scope);
            }, function (newValue, oldValue) {
                if(angular.equals(newValue, oldValue) || !newValue){
                    return;
                }
                initializeRecordsetStructure(scope);

                // unbind the wwatcher
                recordsetReadyToInitializeStructureWatcher();
            });

            // we might be able to initialize the recordset structure on load
            if (recordsetReadyToInitializeStructure(scope)) {
                initializeRecordsetStructure(scope);

                // unbind the wwatcher
                recordsetReadyToInitializeStructureWatcher();
            }

            // after recordset structure is ready, do DOM manipulation and start loading data
            attachDOMElementsToScope(scope);
            var recordsetStructureReadyWatcher = scope.$watch(function () {
                return recordsetStructureReady(scope);
            }, function (newValue, oldValue) {
                if(angular.equals(newValue, oldValue) || !newValue){
                    return;
                }
                // set saved query Functions
                registerSavedQueryFunctions();

                $log.debug("going to initialize recordset man");

                // DOM manipulations
                manipulateRecordsetDOMElements();

                // call the flow-control to fetch the data
                initializeRecordsetData(scope);

                // unbind the wwatcher
                recordsetStructureReadyWatcher();
            });

            // we might be able to do DOM manipulation and loading of data on load of directive
            if (recordsetStructureReady(scope)) {
                manipulateRecordsetDOMElements();
                initializeRecordsetData(scope);

                // unbind the watcher
                recordsetStructureReadyWatcher();
            }

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
        }

        return {
            initialize: initialize,
            update: update,
            updateColumnAggregates: updateColumnAggregates,
            updateMainEntity: updateMainEntity,
            registerFavoritesCallbacks: registerFavoritesCallbacks,
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
                    if (link.indexOf("?limit=") === -1 && link.indexOf("&limit=") === -1)
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
                };

                scope.canCreate = function () {
                    return scope.vm.config.editable && scope.vm.reference && scope.vm.reference.canCreate;
                };

                scope.canUpdate = function () {
                    var res = scope.vm.config.editable && scope.vm.page && scope.vm.reference && scope.vm.reference.canUpdate;
                    // make sure at least one row can be updated
                    if (res) {
                        return scope.vm.page.tuples.some(function (t) {
                            return t.canUpdate;
                        });
                    }
                    return false;
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
                onSelectedRowsChanged: '&?',      // set row click function
                onFavoritesChanged: '&?'
            },
            link: function (scope, elem, attrs) {
                recordTableUtils.registerTableCallbacks(scope, elem, attrs);

                // bind the scope so it can be called
                if (scope.onFavoritesChanged) {
                    scope.onFavoritesChanged = scope.onFavoritesChanged();
                }

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

    .directive('recordList', ['ConfigUtils', 'defaultDisplayname', 'messageMap', 'recordTableUtils', 'UriUtils', '$log', '$timeout', '$window', function(ConfigUtils, defaultDisplayname, messageMap, recordTableUtils, UriUtils, $log, $timeout, $window) {

        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/list.html',
            scope: {
                initialized: '=?',
                onRowClick: '=',
                onFavoritesChanged: "=?",
                rows: '=', // each row: {uniqueId, displayname, count, selected}
                enableFavorites: "=?",
                table: "=?"
            },
            link: function (scope, elem, attr) {
                scope.defaultDisplayname = defaultDisplayname;
                scope.tooltip = messageMap.tooltip;

                scope.onSelect = function (row, $event) {
                    row.selected = !row.selected;
                    scope.onRowClick(row, $event);
                }

                recordTableUtils.registerFavoritesCallbacks(scope, elem, attr);

                scope.callToggleFavorite = function (row) {
                    if (row.isFavoriteLoading) return;
                    row.isFavoriteLoading = true;

                    scope.toggleFavorite(row.tuple.data, scope.table, row.isFavorite).then(function (isFavorite) {
                        row.isFavorite = isFavorite;
                    }, function (isFavorite) {
                        row.isFavorite = isFavorite;
                    }).catch(function (error) {
                        $log.warn(error);
                    }).finally(function () {
                        row.isFavoriteLoading = false;
                        if (scope.onFavoritesChanged) {
                            scope.onFavoritesChanged();
                        }
                    });
                }

                scope.$watch('initialized', function (newVal, oldVal) {
                    if (newVal) {
                        $timeout(function () {
                            var listElem = elem[0].getElementsByClassName("chaise-list-container")[0];

                            // set the height to the clientHeight or the rendered height so when the content changes the page doesn't thrash
                            // TODO: we should figure out why this is calculating incorrectly now
                            // plus 1 to fix a truncation of the list issue
                            listElem.style.height = listElem.scrollHeight + 1 + "px";
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
    .directive('recordsetSelectFaceting', ['ConfigUtils', 'ERMrest', 'messageMap', 'recordsetDisplayModes', 'recordTableUtils', 'UriUtils', '$q', '$window', function(ConfigUtils, ERMrest, messageMap, recordsetDisplayModes, recordTableUtils, UriUtils, $q, $window) {

        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/recordsetSelectFaceting.html",
            scope: {
                mode: "=?",
                vm: '=',
                onSelectedRowsChanged: '&?',       // set row click function
                onFavoritesChanged: '&?',
                getDisabledTuples: "=?", // callback to get the disabled tuples
                registerSetPageState: "&?"
            },
            link: function (scope, elem, attrs) {
                // currently faceting is not defined in this mode.
                // TODO We should eventually add faceting here, and remove these initializations
                scope.facetDirectivesLoaded = true;
                scope.ignoreFaceting = true; // this is a temporary flag to avoid any faceting logic
                scope.tooltip = messageMap.tooltip;
                scope.recordsetDisplayModes = recordsetDisplayModes;

                recordTableUtils.registerRecordsetCallbacks(scope, elem, attrs);

                // bind the scope so it can be called
                if (scope.onFavoritesChanged) {
                    scope.onFavoritesChanged = scope.onFavoritesChanged();
                }

                // fetch the favorites
                scope.vm.getFavorites = function (vm, page) {
                    var defer = $q.defer();

                    var table = scope.vm.reference.table;
                    // if the stable key is greater than length 1, the favorites won't be supported for now
                    // TODO: support this for composite stable keys
                    if (scope.$root.session && table.favoritesPath && table.stableKey.length == 1) {
                        // array of column names that represent the stable key of leaf with favorites
                        // favorites_* will use stable key to store this information
                        // NOTE: hardcode `scope.reference.table.name` for use in pure and binary table mapping
                        var key = table.stableKey[0];
                        var displayedFacetIds = "(";
                        page.tuples.forEach(function (tuple, idx) {
                            // use the stable key here
                            displayedFacetIds += UriUtils.fixedEncodeURIComponent(table.name) + "=" + UriUtils.fixedEncodeURIComponent(tuple.data[key.name]);
                            if (idx !== page.tuples.length-1) displayedFacetIds += ";";
                        });
                        displayedFacetIds += ")"
                        // resolve favorites reference for this table with given user_id
                        var favoritesUri = $window.location.origin + table.favoritesPath + "/user_id=" + UriUtils.fixedEncodeURIComponent(scope.$root.session.client.id) + "&" + displayedFacetIds;

                        ERMrest.resolve(favoritesUri, ConfigUtils.getContextHeaderParams()).then(function (favoritesReference) {
                            // read favorites on reference
                            // use 10 since that's the max our facets will show at once
                            // TODO proper log object
                            return favoritesReference.contextualize.compact.read(scope.vm.pageLimit, null, true, true);
                        }).then(function (favoritesPage) {
                            favoritesPage.tuples.forEach(function (favTuple) {
                                // should only be 1
                                var matchedTuple = page.tuples.filter(function (tuple) {
                                    // favTuple has data as table.name and user_id
                                    // tuple comes from leaf table, so find value based on key info
                                    return favTuple.data[table.name] == tuple.data[key.name]
                                });

                                matchedTuple[0].isFavorite = true;
                            });

                            defer.resolve({page: page});
                        }).catch(function (error) {
                            defer.resolve({page: page});
                        });
                    } else {
                        defer.resolve({page: page});
                    }

                    return defer.promise;
                }
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
