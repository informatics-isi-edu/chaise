(function () {
    'use strict';

    angular.module('chaise.faceting', ['plotly', 'chaise.inputs', 'chaise.utils'])

        .factory('facetingUtils', ['defaultDisplayname', 'messageMap', function (defaultDisplayname, messageMap) {

            /**
             * Returns an object that can be used for showing the null filter
             * @param  {boolean} selected whether it should be selected
             * @param  {boolean} disabled whether it should be disabled
             */
            function getNullFilter(selected, disabled) {
                return {
                    selected: (typeof selected == 'boolean') ? selected: false,
                    disabled: (typeof disabled == 'boolean') ? disabled: false,
                    uniqueId: null,
                    displayname: {"value": null, "isHTML": false},
                    tooltip: {
                        value: messageMap.tooltip.null,
                        isHTML: false
                    },
                    alwaysShowTooltip: true
                };
            }

            /**b
             * Returns an object that can be used for showing the not-null filter
             * @param  {boolean} selected whether it should be selected
             * @param  {boolean} disabled whether it should be disabled
             */
            function getNotNullFilter(selected) {
                return {
                    selected: (typeof selected == 'boolean') ? selected: false,
                    isNotNull: true,
                    displayname: {"value": defaultDisplayname.notNull, "isHTML": true},
                    tooltip: {
                        value: messageMap.tooltip.notNull,
                        isHTML: false
                    },
                    alwaysShowTooltip: true
                };
            }

            return {
                getNotNullFilter: getNotNullFilter,
                getNullFilter: getNullFilter
            };
        }])

        .directive('faceting', ['$log', `logService`, 'recordTableUtils', '$rootScope', '$timeout', 'UriUtils', function ($log, logService, recordTableUtils, $rootScope, $timeout, UriUtils) {

            return {
                restrict: 'AE',
                templateUrl:  UriUtils.chaiseDeploymentPath() + 'common/templates/faceting/faceting.html',
                scope: {
                    vm: "="
                },
                controller: ['$scope', function ($scope) {
                    var ctrl = this;

                    ctrl.childCtrls = []; // child controllers

                    ctrl.facetingCount = 0;

                    // register a children controller in here
                    ctrl.register = function (childCtrl, facetColumn, index) {
                        ctrl.childCtrls[index] = childCtrl;
                        ctrl.facetingCount++;

                        var facetLogStackElemenet = logService.getStackElement(
                            logService.logStackTypes.FACET,
                            facetColumn.column.table,
                            { source: facetColumn.compressedDataSource, entity: facetColumn.isEntityMode}
                        );

                        var parentLogStackPath = $scope.vm.logStackPath ? $scope.vm.logStackPath : logService.logStackPaths.SET;

                        $scope.vm.facetModels[index] = {
                            facetError: false,
                            // some facets require extra step to process preselected filters
                            preProcessed: true,
                            initialized: false,
                            isOpen: false,
                            isLoading: false,
                            processed: true,
                            noConstraints: false,
                            appliedFilters: [],
                            updateFacet: childCtrl.updateFacet,
                            preProcessFacet: childCtrl.preProcessFacet,
                            recordsetConfig: $scope.vm.config,
                            updateCauses: [],
                            updateStartTime: -1,
                            logStackElement: facetLogStackElemenet,
                            parentLogStackPath: $scope.vm.logStackPath ? $scope.vm.logStackPath : logService.logStackPaths.SET
                        };

                        if (ctrl.facetingCount === $scope.vm.reference.facetColumns.length) {
                            $scope.$emit("facetsLoaded");
                        }
                    };

                    ctrl.updateVMReference = function (reference, index, reason, keepRef) {
                        return $scope.updateReference(reference, index, reason, keepRef);
                    };

                    ctrl.setInitialized = function () {
                        $scope.vm.facetModels.forEach(function (fm, index) {
                            if (fm.isOpen) fm.initialized = false;
                        });
                    };

                    /**
                     * Only update this given facet
                     * @param {int} index index of facetColumn
                     **/
                    ctrl.updateFacetColumn = function (index, cause) {
                        var fm = $scope.vm.facetModels[index];
                        fm.processed = false;
                        fm.isLoading = true;
                        $log.debug("faceting: sending a request to update the facet index=" + index);

                        if (!Number.isInteger(fm.updateStartTime) || fm.updateStartTime === -1) {
                            fm.updateStartTime = ERMrest.getElapsedTime();
                            if (cause && fm.updateCauses.indexOf(cause) === -1) {
                                fm.updateCauses.push(cause);
                            }
                        }

                        recordTableUtils.update($scope.vm, false, false, false, true);
                    };

                    ctrl.focusOnFacet = function (index, dontUpdate) {
                        $scope.focusOnFacet(index, dontUpdate);
                    };

                    /**
                     * Return the action string that should be used for the given facet
                     * @param {integer} index the facet index
                     * @param {string} actionPath the user context + action verb
                     */
                    ctrl.getFacetLogAction = function (index, actionPath) {
                        return recordTableUtils.getTableLogAction($scope.vm, logService.logStackPaths.FACET, actionPath);
                    };

                    /**
                     * Return the stack objec tthat should be used for the given facet
                     * NOTE this has to be a function to make sure the stack is always updated
                     * (the filters on the stack elements might change)
                     * @param {integer}
                     */
                    ctrl.getFacetLogStack = function (index, extraInfo) {
                        return recordTableUtils.getTableLogStack($scope.vm, $scope.vm.facetModels[index].logStackElement, extraInfo);
                    };
                }],
                require: 'faceting',
                link: function (scope, element, attr, currentCtrl) {
                    scope.updateReference = function (reference, index, reason, keepRef) {
                        if (!scope.$root.checkReferenceURL(reference)) {
                            return false;
                        }

                        if (!keepRef) {
                            scope.vm.lastActiveFacet = index;
                            scope.vm.reference = reference;
                            scope.$emit(reason);
                        }
                        return true;
                    };

                    scope.hasFilter = function (index) {
                        if (!scope.vm.facetModels || (index !== undefined && !scope.vm.facetModels[index])) {
                            return false;
                        }

                        if (typeof index === 'undefined') {
                            return scope.vm.facetModels.some(function (fm) {
                                return fm.appliedFilters.length > 0;
                            })
                        } else {
                            return scope.vm.facetModels[index].appliedFilters.length > 0;
                        }
                    };

                    scope.removeFilter = function (index) {
                        var newRef, reason = logService.updateCauses.FACET_CLEAR, action = "";
                        if (index === "filters") {
                            // only remove custom filters on the reference (not the facet)
                            // TODO LOG should we log this?
                            newRef = scope.vm.reference.removeAllFacetFilters(false, true, true);
                            action = logService.logActions.BREADCRUMB_CLEAR_CUSTOM;
                            reason = logService.updateCauses.CLEAR_CUSTOM_FILTER;
                        } else if (index === "cfacets") {
                            // only remove custom facets on the reference
                            // TODO LOG should we log this?
                            newRef = scope.vm.reference.removeAllFacetFilters(true, false, true);
                            action = logService.logActions.BREADCRUMB_CLEAR_CFACET;
                            reason = logService.updateCauses.CLEAR_CFACET;
                        } else if (typeof index === 'undefined') {
                            // // delete all filters and facets
                            reason = logService.updateCauses.CLEAR_ALL;
                            action = logService.logActions.BREADCRUMB_CLEAR_ALL;
                            newRef = scope.vm.reference.removeAllFacetFilters();
                            scope.vm.facetModels.forEach(function (fm) {
                                fm.appliedFilters = [];
                            });

                            scope.vm.search = null;
                            if (scope.vm.reference.location.searchTerm) {
                                newRef = newRef.search();
                            }

                        } else {
                            // delete all fitler for one column
                            newRef = scope.vm.reference.facetColumns[index].removeAllFilters();
                            scope.vm.facetModels[index].appliedFilters = [];

                            // log the action
                            var fc = scope.vm.reference.facetColumns[index];
                            logService.logClientAction({
                                action: currentCtrl.getFacetLogAction(index, logService.logActions.BREADCRUMB_CLEAR),
                                stack: currentCtrl.getFacetLogStack(index)
                            }, fc.sourceReference.defaultLogInfo);
                        }

                        // whether we should log the action for the whole page or not
                        if (action) {
                            // log the action
                            logService.logClientAction(
                                {
                                    action: recordTableUtils.getTableLogAction(scope.vm, "", action),
                                    stack: recordTableUtils.getTableLogStack(scope.vm)
                                },
                                scope.vm.reference.defaultLogInfo
                            );
                        }

                        scope.updateReference(newRef, -1, reason);
                    };

                    /**
                     * open or close the facet given its index
                     * @param  {int} index index of facet
                     */
                    scope.toggleFacet = function (index) {
                        $timeout(function() {
                            var fm = scope.vm.facetModels[index];
                            var fc = scope.vm.reference.facetColumns[index];

                            if (!fm.isOpen) {
                                // make sure to get the result again later
                                if (fm.isLoading) {
                                    fm.initialized = false;
                                }

                                // hide the spinner
                                fm.isLoading = false;
                            } else if (!fm.initialized) {
                                // send a request
                                // TODO should have priority
                                currentCtrl.updateFacetColumn(index);
                            }

                            var action = fm.isOpen ? logService.logActions.OPEN : logService.logActions.CLOSE;
                            // log the action
                            logService.logClientAction({
                                action: currentCtrl.getFacetLogAction(index, action),
                                stack: currentCtrl.getFacetLogStack(index)
                            }, fc.sourceReference.defaultLogInfo);
                        });
                    };

                    scope.scrollToFacet = function (index, dontLog) {
                        var container = angular.element(document.getElementsByClassName('side-panel-container')[0]);
                        var el = angular.element(document.getElementById('fc-'+index));
                        // the elements might not be available
                        if (el.length === 0 || container.length === 0) return;

                        if (!dontLog) {
                            var fc = scope.vm.reference.facetColumns[index];
                            logService.logClientAction({
                                action: currentCtrl.getFacetLogAction(index, logService.logActions.BREADCRUMB_SCROLL_TO),
                                stack: currentCtrl.getFacetLogStack(index)
                            }, fc.sourceReference.defaultLogInfo);
                        }

                        container.scrollToElementAnimated(el, 5).then(function () {
                            $timeout(function () {
                                el.addClass("active");
                            }, 100);
                            $timeout(function () {
                                el.removeClass('active');
                            }, 1600);
                        }).catch(function(err) {
                            //it will be rejected only if scroll is cancelled
                            //we don't need to handle the rejection, so we can fail silently.
                        });
                    };

                    scope.focusOnFacet = function (index, dontUpdate) {
                        var fm = scope.vm.facetModels[index];

                        if (!fm.isOpen && (dontUpdate !== true)) {
                            fm.isOpen = true;
                            scope.toggleFacet(index);
                        }

                        scope.scrollToFacet(index, dontUpdate);
                    };

                    scope.vm.focusOnFacet = function (index, dontUpdate) {
                        return scope.focusOnFacet(index, dontUpdate);
                    }

                    // TODO I am attaching the removeFilter to the vm here, maybe I shouldn't?
                    scope.vm.hasFilter = function (col) {
                        return scope.hasFilter(col);
                    }

                    // TODO I am attaching the removeFilter to the vm here, maybe I shouldn't?
                    scope.vm.removeFilter = function (colId) {
                        scope.removeFilter(colId);
                    }
                }
            };
        }])

        .directive('rangePicker', ['dataFormats', 'facetingUtils', '$log', 'logService', '$q', '$timeout', 'UriUtils', function (dataFormats, facetingUtils, $log, logService, $q, $timeout, UriUtils) {
            return {
                restrict: 'AE',
                templateUrl:  UriUtils.chaiseDeploymentPath() + 'common/templates/faceting/range-picker.html',
                scope: {
                    facetColumn: "=",
                    facetModel: "=",
                    index: "=",
                    facetPanelOpen: "="
                },
                controller: ['$scope', function ($scope) {
                    var ctrl = this;

                    // register the update facet callback
                    ctrl.updateFacet = function () {
                        // make sure to sync the selected
                        // when we clear a filter, this function will take care of unchecking it.
                        $scope.syncSelected();
                        return $scope.updateFacetData();
                    }

                    ctrl.preProcessFacet = function () {
                        return $scope.initialRows();
                    }
                }],
                require: ['^faceting', 'rangePicker'],
                link: function (scope, element, attr, ctrls) {
                    var parentCtrl = ctrls[0],
                        currentCtrl = ctrls[1];

                    var numBuckets = scope.facetColumn.histogramBucketCount;

                    function isColumnOfType(columnType) {
                        return (scope.facetColumn.column.type.rootName.indexOf(columnType) > -1)
                    }

                    // register this controller in the parent
                    parentCtrl.register(currentCtrl, scope.facetColumn, scope.index);
                    scope.parentCtrl = parentCtrl;

                    scope.relayout = false;
                    scope.ranges = [];
                    if (!scope.facetColumn.hideNotNullChoice) {
                        scope.ranges.push(facetingUtils.getNotNullFilter());
                    }

                    scope.histogramDataStack = [];
                    // draw the plot
                    scope.plot = {
                        data: [{
                            x: [],
                            y: [],
                            type: "bar"
                        }],
                        options: {
                            displayModeBar: false
                        },
                        layout: {
                            margin: {
                                l: 40,
                                r: 0,
                                b: 80,
                                t: 20,
                                pad: 2
                            },
                            xaxis: {
                                fixedrange: false,
                                ticks: 'inside',
                                tickangle: 45,
                                // set to "linear" for int/float graphs
                                // set to "date" for date/timestamp graphs
                                type: '-'
                                // NOTE: setting the range currently to unzoom the graph because auto-range wasn't working it seemed
                                // autorange: true // default is true. if range is provided, set to false.
                                // rangemode: "normal"/"tozero"/"nonnegative"
                            },
                            yaxis: {
                                fixedrange: true,
                                zeroline: true,
                                tickformat: ',d'
                            },
                            bargap: 0
                        }
                    }

                    if (isColumnOfType("int")) {
                        scope.plot.layout.margin.b = 40;
                        scope.plot.layout.xaxis.tickformat = ',d';
                    } else if (isColumnOfType("date")) {
                        scope.plot.layout.xaxis.tickformat = '%Y-%m-%d';
                    } else if (isColumnOfType("timestamp")) {
                        scope.plot.layout.xaxis.tickformat = '%Y-%m-%d\n%H:%M';
                    }

                    function createChoiceDisplay(filter, selected) {
                        return {
                            uniqueId: filter.uniqueId,
                            displayname: {value: filter.toString(), isHTML: false},
                            selected: selected,
                            disabled: scope.facetColumn.hasNotNullFilter,
                            metaData: {
                                min: filter.min,
                                minExclusive: filter.minExclusive,
                                max: filter.max,
                                maxExclusive: filter.maxExclusive
                            }
                        };
                    };

                    // convert filter to applied filter (filter has selected, applied filter doesn't)
                    function createAppliedFilter(filter) {
                        return {
                            uniqueId: filter.uniqueId,
                            displayname: {value: filter.toString(), isHTML: false}
                        }
                    }

                    // function used in ng-show based on annotation value and both min and max being present
                    scope.showHistogram = function () {
                        return scope.facetColumn.barPlot && (scope.rangeOptions.absMin !== null && scope.rangeOptions.absMax !== null);
                    }

                    // callback for the list directive
                    scope.onSelect = function (row, $event) {
                        var res, i;
                        var cause = row.selected ? logService.updateCauses.FACET_SELECT : logService.updateCauses.FACET_DESELECT;

                        // if the selected row is null
                        if (row.isNotNull) {
                            if (row.selected) {
                                res = scope.facetColumn.addNotNullFilter();
                            } else {
                                res = scope.facetColumn.removeNotNullFilter();
                            }

                            if (res && !scope.parentCtrl.updateVMReference(res, scope.index, cause)) {
                                $log.debug("faceting: rejected because of url length limit.");
                                row.selected = !row.selected;
                                $event.preventDefault();
                                return;
                            }

                            // we should disable or enable other ranges
                            if (row.selected) {
                                scope.facetModel.appliedFilters = [facetingUtils.getNotNullFilter(true)];
                                for (i = 1; i < scope.ranges.length; i++) {
                                    scope.ranges[i].selected = false;
                                    scope.ranges[i].disabled = true;
                                }
                            } else {
                                scope.facetModel.appliedFilters = [];
                                for (i = 1; i < scope.ranges.length; i++) {
                                    scope.ranges[i].disabled = false;
                                }
                            }

                            return;
                        }

                        if (row.selected) {
                            res = scope.facetColumn.addRangeFilter(row.metaData.min, row.metaData.minExclusive, row.metaData.max, row.metaData.maxExclusive);
                        } else {
                            res = scope.facetColumn.removeRangeFilter(row.metaData.min, row.metaData.minExclusive, row.metaData.max, row.metaData.maxExclusive);
                        }

                        $log.debug("faceting: request for facet (index="+scope.facetColumn.index+") range " + (row.selected ? "add" : "remove") + '. min=' + row.metaData.min + ", max=" + row.metaData.max);

                        if (res && !scope.parentCtrl.updateVMReference(res.reference, scope.index, cause)) {
                            $log.debug("faceting: rejected because of url length limit.");
                            row.selected != row.selected;
                            $event.preventDefault();
                        } else {
                            if (row.selected) {
                                scope.facetModel.appliedFilters.push({
                                    uniqueId: row.uniqueId,
                                    displayname: row.displayname
                                });
                            } else {
                                scope.facetModel.appliedFilters = scope.facetModel.appliedFilters.filter(function (f) {
                                    return f.uniqueId != row.uniqueId;
                                });
                            }
                        }
                    };

                    // Add new integer filter, used as the callback function to range-inputs
                    scope.addFilter = function (min, max) {
                        var res = scope.facetColumn.addRangeFilter(min, false, max, false);
                        if (!res) {
                            return; // duplicate filter
                        }

                        if (!scope.parentCtrl.updateVMReference(res.reference, scope.index, logService.updateCauses.FACET_SELECT)) {
                            $log.debug("faceting: rejected because of url length limit.");
                            return; // uri limit
                        }

                        var rowIndex = scope.ranges.findIndex(function (obj) {
                            return obj.uniqueId == res.filter.uniqueId;
                        });

                        $log.debug("faceting: request for facet (index="+scope.facetColumn.index +") range add. min='" + min + ", max=" + max);

                        scope.facetModel.appliedFilters.push(createAppliedFilter(res.filter));
                        if (rowIndex === -1) {
                            //we should create a new filter
                            scope.ranges.push(createChoiceDisplay(res.filter, true));
                        } else {
                            // filter already exists, we should just change it to selected
                            scope.ranges[rowIndex].selected = true;
                        }
                    };

                    // Look at the filters available for the facet and add rows to represent the preset filters
                    scope.initialRows = function () {
                        var defer = $q.defer();
                        scope.facetModel.appliedFilters = [];
                        scope.ranges = [];

                        // if we have the not-null filter, other filters are not important and can be ignored
                        if (scope.facetColumn.hasNotNullFilter) {
                            scope.facetModel.appliedFilters.push(facetingUtils.getNotNullFilter(true));
                            scope.ranges.push(facetingUtils.getNotNullFilter(true));
                            return defer.resolve(true), defer.promise;
                        } else if (!scope.facetColumn.hideNotNullChoice) {
                            scope.ranges.push(facetingUtils.getNotNullFilter());
                        }

                        for (var i = 0; i < scope.facetColumn.rangeFilters.length; i++) {
                            var filter = scope.facetColumn.rangeFilters[i];

                            var rowIndex = scope.ranges.findIndex(function (obj) {
                                return obj.uniqueId == filter.uniqueId;
                            });

                            // if the row is not in the set of choices, add it
                            if (rowIndex == -1) {
                                scope.ranges.push(createChoiceDisplay(filter, true));
                                scope.facetModel.appliedFilters.push(createAppliedFilter(filter));
                            }
                        }

                        // return a promise that can be acted on
                        defer.resolve(true);
                        return defer.promise;
                    };

                    // some of the facets might have been cleared, this function will unselect those
                    scope.syncSelected = function () {
                        var i;
                        var filterIndex = function (uniqueId) {
                            return scope.facetColumn.rangeFilters.findIndex(function (f) {
                                return f.uniqueId == uniqueId;
                            });
                        }

                        // see if there's a not-null choice
                        if (!scope.facetColumn.hideNotNullChoice) {
                            scope.ranges[0].selected = scope.facetColumn.hasNotNullFilter;

                            // if not-null is unchecked, enable the other options
                            if (!scope.facetColumn.hasNotNullFilter) {
                                for (i = 1; i < scope.ranges.length; i++) {
                                    scope.ranges[i].disabled = false;
                                }
                            }
                        }


                        //scope.ranges[0] could be the not-null filter.
                        for (i = (scope.facetColumn.hideNotNullChoice ? 0 : 1); i < scope.ranges.length; i++) {
                            // if couldn't find the filter, then it should be unselected
                            if (filterIndex(scope.ranges[i].uniqueId) === -1) {
                                scope.ranges[i].selected = false;
                            }
                        }
                    };

                    /**
                     * Generate the object that we want to be logged alongside the action
                     * This function does not attach action, after calling this function
                     * we should attach the action.
                     * @param  {object} scope the scope object
                     */
                    function getDefaultLogInfo(scope) {
                        var res = scope.facetColumn.sourceReference.defaultLogInfo;

                        res.stack = scope.parentCtrl.getFacetLogStack(scope.index);
                        return res;
                    }

                    // range is defined by the x values of the bar graph because layout.xaxis.type is `linear` or 'category'
                    function setHistogramRange() {
                        if (isColumnOfType("timestamp")) {
                            scope.plot.layout.xaxis.range = [dateTimeToTimestamp(scope.rangeOptions.absMin),  dateTimeToTimestamp(scope.rangeOptions.absMax)];
                        } else {
                            scope.plot.layout.xaxis.range = [scope.rangeOptions.absMin, scope.rangeOptions.absMax];
                        }
                    }

                    // set the absMin and absMax values
                    // all values are in their database returned format
                    function setRangeMinMax(min, max) {
                        if (isColumnOfType("timestamp")) {
                            // convert and set the values if they are defined.
                            scope.rangeOptions.absMin = timestampToDateTime(min);
                            scope.rangeOptions.absMax = timestampToDateTime(max);
                        } else {
                            scope.rangeOptions.absMin = min;
                            scope.rangeOptions.absMax = max;
                        }
                    }

                    // update the min/max model values to the min/max represented by the histogram
                    function setInputs() {
                        scope.rangeOptions.model.min = scope.rangeOptions.absMin;
                        scope.rangeOptions.model.max = scope.rangeOptions.absMax;
                    }

                    // sets both the range and the inputs
                    function setRangeVars() {
                        setHistogramRange();
                        setInputs();

                        var plotEl = element[0].getElementsByClassName("js-plotly-plot")[0];
                        if (plotEl) {
                            Plotly.relayout(plotEl, {'xaxis.fixedrange': scope.disableZoomIn()});
                        }
                    }

                    /**
                     * Given an object with `date` and `time`, it will turn it into timestamp reprsentation of datetime.
                     * @param  {object} obj The datetime object with `date` and `time` attributes
                     * @return {string} timestamp in submission format
                     * NOTE might return `null`
                     */
                    function dateTimeToTimestamp(obj) {
                        if (!obj) return null;
                        var ts = obj.date + obj.time;
                        return moment(ts, dataFormats.date + dataFormats.time24).format(dataFormats.datetime.submission);
                    }

                    /**
                     * Given a string representing timestamp will turn it into an object with `date` and `time` attributes
                     * @param  {string} ts timestamp
                     * @return {object} an object with `date` and `time` attributes
                     * NOTE might return `null`
                     */
                    function timestampToDateTime(ts) {
                        if (!ts) return null;
                        var m = moment(ts);
                        return {
                            date: m.format(dataFormats.date),
                            time: m.format(dataFormats.time24)
                        };
                    }

                    function histogramData(updateCauses, updateStartTime) {
                        var defer = $q.defer();

                        (function (uri) {
                            var requestMin = isColumnOfType("timestamp") ? dateTimeToTimestamp(scope.rangeOptions.absMin) : scope.rangeOptions.absMin,
                                requestMax = isColumnOfType("timestamp") ? dateTimeToTimestamp(scope.rangeOptions.absMax) : scope.rangeOptions.absMax;

                            var facetLog = getDefaultLogInfo(scope);
                            var action = logService.logActions.HISTOGRAM_LOAD;
                            if (updateCauses.length > 0) {
                                action = logService.logActions.HISTOGRAM_RELOAD;

                                // add causes
                                facetLog.stack = logService.addCausesToStack(facetLog.stack, updateCauses, updateStartTime);
                            }

                            facetLog.action = scope.parentCtrl.getFacetLogAction(scope.index, action);
                            scope.facetColumn.column.groupAggregate.histogram(numBuckets, requestMin, requestMax).read(facetLog).then(function (response) {
                                if (scope.facetColumn.sourceReference.uri !== uri) {
                                    // return breaks out of the current callback function
                                    defer.resolve(false);
                                    return defer.promise;
                                }

                                // after zooming in, we don't care about displaying values beyond the set the user sees
                                // if set is greater than bucketCount, remove last bin (we should only see this when the max+ bin is present)
                                if (scope.relayout && response.x.length > numBuckets) {
                                    // no need to splice off labels because they are used for lookup
                                    // i.e. response.labels.(min/max)
                                    response.x.splice(-1,1);
                                    response.y.splice(-1,1);
                                    scope.relayout = false;
                                }

                                scope.plot.data[0].x = response.x;
                                scope.plot.data[0].y = response.y;

                                scope.plot.labels = response.labels;

                                setRangeVars();

                                response.min = isColumnOfType("timestamp") ? dateTimeToTimestamp(scope.rangeOptions.absMin) : scope.rangeOptions.absMin;
                                response.max = isColumnOfType("timestamp") ? dateTimeToTimestamp(scope.rangeOptions.absMax) : scope.rangeOptions.absMax;

                                // push the data on the stack to be used for unzoom and reset
                                scope.histogramDataStack.push(response);

                                var plotEl = element[0].getElementsByClassName("js-plotly-plot")[0];
                                if (plotEl) {
                                    Plotly.relayout(plotEl, {'xaxis.fixedrange': scope.disableZoomIn()});
                                }

                                defer.resolve(true);
                            }).catch(function (err) {
                                defer.reject(err);
                            });
                        })(scope.facetColumn.sourceReference.uri);

                        return defer.promise;
                    }

                    // Gets the facet data for min/max
                    scope.updateFacetData = function () {
                        var defer = $q.defer();

                        (function (uri, updateCauses, updateStartTime) {
                            if (!scope.relayout) {
                                // the captured uri is not the same as the initial data uri so we need to refetch the min/max
                                // this happens when another facet adds a filter that affects the facett object in the uri
                                var agg = scope.facetColumn.column.aggregate;
                                var aggregateList = [
                                    agg.minAgg,
                                    agg.maxAgg
                                ];

                                var facetLog = getDefaultLogInfo(scope);
                                var action = logService.logActions.LOAD;
                                if (scope.facetModel.updateCauses.length > 0) {
                                    action = logService.logActions.RELOAD;
                                    // add causes
                                    facetLog.stack = logService.addCausesToStack(facetLog.stack, scope.facetModel.updateCauses, scope.facetModel.updateStartTime);
                                }
                                facetLog.action = scope.parentCtrl.getFacetLogAction(scope.index, action);
                                scope.facetColumn.sourceReference.getAggregates(aggregateList, facetLog).then(function(response) {
                                    if (scope.facetColumn.sourceReference.uri !== uri) {
                                        // return false to defer.resolve() in .then() callback
                                        return false;
                                    }
                                    // initiailize the min/max values
                                    setRangeMinMax(response[0], response[1]);

                                    // if - the max/min are null
                                    //    - bar_plot in annotation is 'false'
                                    //    - histogram not supported for column type
                                    if (!scope.showHistogram()) {
                                        // return true to defer.resolve() in .then() callback
                                        return true;
                                    }
                                    scope.relayout = false;

                                    scope.histogramDataStack = [];

                                    // get initial histogram data
                                    return histogramData(updateCauses, updateStartTime);
                                }).then(function (response) {

                                    scope.facetModel.updateCauses = [];
                                    scope.facetModel.updateStartTime = -1;

                                    defer.resolve(response);
                                }).catch(function (err) {
                                    defer.reject(err);
                                });
                            } else {
                                histogramData().then(function (response) {
                                    defer.resolve(response);
                                }).catch(function (err) {
                                    defer.reject(err);
                                });
                            }
                        })(scope.facetColumn.sourceReference.uri, scope.facetModel.updateCauses, scope.facetModel.updateStartTime);

                        // // so we can check if the getAggregates request needs to be remade or we can just call histogramData
                        // scope.initialDataUri = scope.facetColumn.sourceReference.uri;

                        return defer.promise;
                    };

                    // Zoom the set into the middle 50% of the buckets
                    scope.zoomInPlot = function () {
                        // NOTE: x[x.length-1] may not be representative of the absolute max
                        // range is based on the index of the bucket representing the max value
                        var maxIndex = scope.plot.data[0].x.findIndex(function (value) {
                            return value >= scope.rangeOptions.absMax;
                        });

                        // the last bucket is a value less than the max but includes max in it
                        if (maxIndex < 0) {
                            maxIndex = scope.plot.data[0].x.length;
                        }

                        // zooming in should increase clarity by 50%
                        // range is applied to both min and max so use half of 50%
                        var zoomRange = Math.ceil(maxIndex * 0.25);
                        // middle bucket rounded down
                        var median = Math.floor(maxIndex/2);
                        var minBinIndex = median - zoomRange;
                        var maxBinIndex = median + zoomRange;

                        setRangeMinMax(scope.plot.data[0].x[minBinIndex], scope.plot.data[0].x[maxBinIndex]);

                        scope.relayout = true;
                        scope.parentCtrl.updateFacetColumn(scope.index, logService.updateCauses.FACET_PLOT_RELAYOUT);
                    };

                    // disable zoom in ifhistogram has been zoomed 20+ times or the current range is <= the number of buckets
                    scope.disableZoomIn = function() {
                        var limitedRange = false;

                        if (scope.rangeOptions.absMin && scope.rangeOptions.absMax) {
                            if (isColumnOfType("int")) {
                                limitedRange = (scope.rangeOptions.absMax-scope.rangeOptions.absMin) <= numBuckets;
                            } else if (isColumnOfType("date")) {
                                var minMoment = moment(scope.rangeOptions.absMin);
                                var maxMoment = moment(scope.rangeOptions.absMax);

                                limitedRange = moment.duration( (maxMoment.diff(minMoment)) ).asDays() <= numBuckets;
                            } else if(isColumnOfType("timestamp")) {
                                limitedRange = (scope.rangeOptions.absMin.date+scope.rangeOptions.absMin.time) == (scope.rangeOptions.absMax.date+scope.rangeOptions.absMax.time);
                            } else {
                                // handles float for now
                                limitedRange = scope.rangeOptions.absMin == scope.rangeOptions.absMax;
                            }
                        }

                        return scope.histogramDataStack.length >= 20 || limitedRange;
                    };

                    function setPreviousPlotValues(data) {
                        scope.plot.data[0].x = data.x;
                        scope.plot.data[0].y = data.y;

                        scope.plot.labels = data.labels;

                        setRangeMinMax(data.min, data.max);
                        setRangeVars();
                    };

                    scope.zoomOutPlot = function () {
                        try {
                            if (scope.histogramDataStack.length == 1) {
                                setRangeVars();
                                throw new Error("No more data to show");
                            }
                            scope.histogramDataStack.pop();

                            var previousData = scope.histogramDataStack[scope.histogramDataStack.length-1];

                            setPreviousPlotValues(previousData);
                        } catch (err) {
                            if (scope.histogramDataStack.length == 1) {
                                $log.warn(err)
                            }
                        }
                    };

                    scope.resetPlot = function () {
                        scope.histogramDataStack.splice(1);

                        var initialData = scope.histogramDataStack[0];

                        setPreviousPlotValues(initialData);
                    };

                    //  all the events related to the plot
                    // defines listeners on those events
                    scope.plotlyEvents = function (graph) {
                        // this event is triggered when the:
                        //      plot is zoomed/double clicked
                        //      xaxis is panned/stretched/shrunk
                        graph.on('plotly_relayout', function (event) {
                            try {
                                $timeout(function () {
                                    scope.relayout = true;
                                    // min/max is value interpretted by plotly by position of range in respect to x axis values
                                    var min = event['xaxis.range[0]'];
                                    var max = event['xaxis.range[1]'];

                                    // This case can happen when:
                                    //   - the user double clicks the plot
                                    //   - the relayout event is called because the element was resized (panel stretched or shrunk)
                                    //   - Plotly.relayout is called to update xaxis.fixedrange
                                    // if both undefined, don't re-fetch data
                                    if (typeof min === "undefined" && typeof max === "undefined") {
                                        scope.relayout = false;
                                        return;
                                    }


                                    // if min is undefined, absMin remains unchanged (happens when xaxis max is stretched)
                                    // and if not null, update the value
                                    if (min !== null && typeof min !== "undefined") {
                                        if (isColumnOfType("int")) {
                                            scope.rangeOptions.absMin = Math.round(min);
                                        } else if(isColumnOfType("date")) {
                                            scope.rangeOptions.absMin = moment(min).format(dataFormats.date);
                                        } else if(isColumnOfType("timestamp")) {
                                            var minMoment = moment(min);
                                            scope.rangeOptions.absMin = {
                                                date: minMoment.format(dataFormats.date),
                                                time: minMoment.format(dataFormats.time24)
                                            };
                                        } else {
                                            scope.rangeOptions.absMin = min;
                                        }
                                    }

                                    // if max is undefined, absMax remains unchanged (happens when xaxis min is stretched)
                                    // and if not null, update the value
                                    if (max !== null && typeof max !== "undefined") {
                                        if (isColumnOfType("int")) {
                                            scope.rangeOptions.absMax = Math.round(max);
                                        } else if(isColumnOfType("date")) {
                                            scope.rangeOptions.absMax = moment(max).format(dataFormats.date);
                                        } else if(isColumnOfType("timestamp")) {
                                            var maxMoment = moment(max);
                                            scope.rangeOptions.absMax.date = maxMoment.format(dataFormats.date);
                                            scope.rangeOptions.absMax.time = maxMoment.format(dataFormats.time24);
                                        } else {
                                            scope.rangeOptions.absMax = max;
                                        }
                                    }

                                    scope.parentCtrl.updateFacetColumn(scope.index, logService.updateCauses.FACET_PLOT_RELAYOUT);
                                });
                            } catch (err) {
                                setRangeVars();
                                $log.warn(err);
                            }
                        });
                    };

                    scope.rangeOptions = {
                        type: scope.facetColumn.column.type,
                        callback: scope.addFilter,
                        model: {}
                    }
                }
            };
        }])

        .directive('choicePicker',
            ["AlertsService", 'facetingUtils', 'logService', 'messageMap', 'modalUtils', 'recordsetDisplayModes', 'tableConstants', 'UriUtils', "$log", '$q', '$timeout',
            function (AlertsService, facetingUtils, logService, messageMap, modalUtils, recordsetDisplayModes, tableConstants, UriUtils, $log, $q, $timeout) {

            /**
             * Given tuple and the columnName that should be used, return
             * the filter's uniqueId (in case of entityPicker, it might be different from the tuple's uniqueId)
             * @param  {Object} tuple      the tuple object
             * @param  {string} columnName name of column (in scalar it is 'value')
             * @return {string}            filter's uniqueId
             */
            function getFilterUniqueId(tuple, columnName) {
              if (tuple.data && columnName in tuple.data) {
                  return tuple.data[columnName];
              }
              return tuple.uniqueId;
            }

            /**
             * Initialzie facet column. This will populate the `facetModel.appliedFilters`.
             * We need this function because the value of filter is not necesarily what we want to add to the appliedFilters,
             * - In entity mode, the filters are based on the key but we want the rowname.
             * - We want to display null and not-null differently.
             *
             * NOTE should not be used directly in this directive.
             * NOTE this will only be called on load when the facet has preselected filters.
             * @param {Object} scope The current scope
             */
            function preProcessFacetColumn(scope) {
                var defer = $q.defer();

                // if not_null exist, other filters are not relevant
                if (scope.facetColumn.hasNotNullFilter) {
                    scope.facetModel.appliedFilters.push(facetingUtils.getNotNullFilter(true));
                    defer.resolve();
                }
                else if (scope.facetColumn.choiceFilters.length === 0) {
                    defer.resolve();
                }
                else {
                    // getChoiceDisplaynames won't return the null filter, so we need to check for it first
                    if (scope.facetColumn.hasNullFilter) {
                        scope.facetModel.appliedFilters.push(facetingUtils.getNullFilter(true));
                    }
                    var facetLog = getDefaultLogInfo(scope);
                    facetLog.action = scope.parentCtrl.getFacetLogAction(scope.index, logService.logActions.PRESELECTED_FACETS_LOAD);
                    scope.facetColumn.getChoiceDisplaynames(facetLog).then(function (filters) {
                        filters.forEach(function (f) {
                            scope.facetModel.appliedFilters.push({
                                uniqueId: f.uniqueId,
                                displayname: f.displayname,
                                tuple: f.tuple // the returned tuple might be null (in case of scalar)
                            });
                        });

                        defer.resolve();
                    }).catch(function (error) {
                        defer.reject(error);
                    });
                }
                return defer.promise;
            }

            /**
             * This will create checkbox rows for already applied filters.
             * It will also make sure that not-null and null fitlers are the first two choices.
             *
             * NOTE this will be called everytime that we are updating the facet column.
             * The updateFacetColumn is calling this function.
             *
             * @param {Object} scope The current scope
             */
            function appliedFiltersToCheckBoxRows(scope) {
                var res = [];

                // we should show the not-null option if:
                // - it is selected, or
                // - hide_not_null_choice is not available
                if (scope.facetColumn.hasNotNullFilter || !scope.facetColumn.hideNotNullChoice) {
                    res.push(facetingUtils.getNotNullFilter(scope.facetColumn.hasNotNullFilter));
                }

                // we should show the null option if:
                // - it is selected, or
                // - hide_null_choice is not available
                if (scope.facetColumn.hasNullFilter || !scope.facetColumn.hideNullChoice) {
                    res.push(facetingUtils.getNullFilter(scope.facetColumn.hasNullFilter, scope.facetColumn.hasNotNullFilter));
                }

                // add already applied filters.
                // the appliedFilters will have the not-null and null too, so we should filter those,
                // since the preivous lines have taken care of them
                Array.prototype.push.apply(res, scope.facetModel.appliedFilters.filter(function (f) {
                    // null and not-null are already added.
                    return f.isNotNull !== true && f.uniqueId != null;
                }).map(function (f) {
                    var tooltip = f.displayname;
                    if (f.uniqueId === "") {
                        tooltip = {
                            value: messageMap.empty,
                            isHTML: false
                        };
                    }
                    return {
                        selected: true,
                        uniqueId: f.uniqueId,
                        displayname: f.displayname,
                        tuple: f.tuple, // might be null
                        alwaysShowTooltip: (f.uniqueId === ""),
                        tooltip: tooltip
                    };
                }));
                return res;
            }

            /**
             * Update facet column rows
             * Will return a promise, which will be resolved with:
             * - true, if the respond is the result of latest request.
             * - false, if respond is for an outdated request (therefore should be ignored).
             *
             * NOTE should not be used directly in this directive.
             * @param  {Object} scope current scope
             */
            function updateFacetColumn(scope) {
                var defer = $q.defer();

                // facetColumn has changed so create the new reference
                if (scope.facetColumn.isEntityMode) {
                    scope.reference = scope.facetColumn.sourceReference.contextualize.compactSelect;
                    scope.columnName = scope.facetColumn.column.name;
                } else {
                    scope.reference = scope.facetColumn.scalarValuesReference;
                    // the first column will be the value column
                    scope.columnName = scope.reference.columns[0].name;
                }

                // make sure to add the search term
                if (scope.searchTerm) {
                    scope.reference = scope.reference.search(scope.searchTerm);
                }


                // maxCheckboxLen: Maximum number of checkboxes that we could show
                // (PAGE_SIZE + if not-null is allowed + if null is allowed)
                var maxCheckboxLen = tableConstants.PAGE_SIZE;
                if (!scope.facetColumn.hideNotNullChoice) maxCheckboxLen++;
                if (!scope.facetColumn.hideNullChoice) maxCheckboxLen++;

                // appliedLen: number of applied filters (apart from null and not-null)
                //if this is more than PAGE_SIZE, we don't need to read the data.
                var appliedLen = scope.facetModel.appliedFilters.length;
                if (scope.facetColumn.hasNullFilter) appliedLen--;
                if (scope.facetColumn.hasNotNullFilter) appliedLen--;

                // there are more than PAGE_SIZE selected rows, just display them.
                if (appliedLen >= tableConstants.PAGE_SIZE) {
                    scope.checkboxRows = appliedFiltersToCheckBoxRows(scope);
                    // there might be more, we're not sure
                    scope.hasMore = false;
                    defer.resolve(true);
                    return defer.promise;
                }

                // remove the constraints if scope.facetModel.noConstraints
                if (scope.facetModel.noConstraints) {
                    scope.reference = scope.reference.unfilteredReference;
                    if (scope.facetColumn.isEntityMode) {
                        scope.reference = scope.reference.contextualize.compactSelect;
                    }
                }
                // read new data if needed
                (function (uri) {
                    var facetLog = getDefaultLogInfo(scope);

                    // create the action
                    var action = logService.logActions.LOAD;
                    if (scope.facetModel.updateCauses.length > 0) {
                        action = logService.logActions.RELOAD;
                        // add causes
                        facetLog.stack = logService.addCausesToStack(facetLog.stack, scope.facetModel.updateCauses, scope.facetModel.updateStartTime);
                    }
                    facetLog.action = scope.parentCtrl.getFacetLogAction(scope.index, action);

                    // update the filter log info to stack
                    logService.updateStackFilterInfo(facetLog.stack, scope.reference.filterLogInfo);

                    scope.reference.read(tableConstants.PAGE_SIZE, facetLog, true).then(function (page) {
                        // if this is not the result of latest facet change
                        if (scope.reference.uri !== uri) {
                            defer.resolve(false);
                            return defer.promise;
                        }

                        scope.checkboxRows = appliedFiltersToCheckBoxRows(scope);

                        scope.hasMore = page.hasNext;

                        page.tuples.forEach(function (tuple) {
                            // if we're showing enough rows
                            if (scope.checkboxRows.length == maxCheckboxLen) {
                                return;
                            }

                            // filter and tuple uniqueId might be different
                            var value = getFilterUniqueId(tuple, scope.columnName);

                            var i = scope.facetModel.appliedFilters.findIndex(function (row) {
                                return row.uniqueId == value && !row.isNotNull;
                            });

                            // it's already selected
                            if (i !== -1) {
                                return;
                            }

                            var tooltip = tuple.displayname;
                            if (value === "") {
                                tooltip = {
                                    value: messageMap.tooltip.empty,
                                    isHTML: false
                                };
                            }
                            scope.checkboxRows.push({
                                selected: false,
                                uniqueId: value,
                                displayname: tuple.displayname,
                                tuple:  tuple,
                                // if we have a not_null filter, other filters must be disabled.
                                disabled: scope.facetColumn.hasNotNullFilter,
                                alwaysShowTooltip: (value === ""),
                                tooltip: tooltip
                            });
                        });

                        scope.facetModel.updateCauses = [];
                        scope.facetModel.updateStartTime = -1;

                        defer.resolve(true);

                    }).catch(function (err) {
                        defer.reject(err);
                    });
                })(scope.reference.uri);

                return defer.promise;
            }

            /**
             * Generate the object that we want to be logged alongside the action
             * This function does not attach action, after calling this function
             * we should attach the action.
             * @param  {object} scope the scope object
             */
            function getDefaultLogInfo(scope, obj) {
                var res = scope.facetColumn.sourceReference.defaultLogInfo;
                res.stack = scope.parentCtrl.getFacetLogStack(scope.index);
                return res;
            }

            /**
             * Post process after selectedRows is defined coming from the modal.
             * If changeRef is false, then we only want to apply the URL limitation logic.
             * the callback that is returning is accepting an array or an object with `matchNotNull` attribute.
             * If the attribute exists, then we want to match any values apart from null. otherwise the
             * parameter will be an array of tuples.
             * @param  {object} scope
             * @param  {boolean} changeRef whether we should change the reference or not
             */
            function modalDataChanged(scope, changeRef) {
                return function (res) {
                    // TODO needs refactoring.
                    var ref;

                    if (!res) return false;

                    // if the value returned is an object with matchNotNull
                    if (res.matchNotNull) {
                        ref = scope.facetColumn.addNotNullFilter();

                        // update the reference
                        if (!scope.parentCtrl.updateVMReference(ref, -1, logService.updateCauses.FACET_MODIFIED, !changeRef)) {
                            return false;
                        }

                        if (changeRef) {
                            scope.facetModel.appliedFilters = [facetingUtils.getNotNullFilter(true)];
                        }
                    } else {
                        // invalid output
                        if (!Array.isArray(res.rows)) return false;
                        var tuples = res.rows;

                        // create the list of choice filters
                        var filters = tuples.map(function (t) {
                            return getFilterUniqueId(t, scope.columnName);
                        });

                        // create the reference using filters
                        ref = scope.facetColumn.replaceAllChoiceFilters(filters);

                        // update the reference
                        if (!scope.parentCtrl.updateVMReference(ref, -1, logService.updateCauses.FACET_MODIFIED, !changeRef)) {
                            return false;
                        }

                        if (changeRef) {
                            scope.facetModel.appliedFilters = [];


                            // we want to show the null first, this is used for finding it
                            var hasNullFilter = false;

                            // create the list of applied filters, this will be used for genreating the checkboxRows of current facet
                             tuples.forEach(function (t) {
                                var val = getFilterUniqueId(t, scope.columnName);

                                if (val === null) {
                                    hasNullFilter = true;
                                    return; // null filter will be added later
                                }

                                scope.facetModel.appliedFilters.push({
                                    uniqueId: val,
                                    displayname: (val === null) ? {value: null, isHTML: false} : t.displayname,
                                    tuple: t,
                                });
                            });

                            // null filter should be the first applied fitler that we show
                            if (hasNullFilter) {
                                scope.facetModel.appliedFilters.unshift(facetingUtils.getNullFilter(true));
                            }
                        }
                    }

                    if (changeRef) {
                        // make sure to update all the opened facets
                        scope.parentCtrl.setInitialized();

                        // focus on the current facet
                        scope.parentCtrl.focusOnFacet(scope.index);
                    }
                };
            }

            return {
                restrict: 'AE',
                templateUrl:  UriUtils.chaiseDeploymentPath() + 'common/templates/faceting/choice-picker.html',
                scope: {
                    facetColumn: "=",
                    facetModel: "=",
                    index: "=",
                    facetPanelOpen: "="
                },
                controller: ['$scope', function ($scope) {
                    var ctrl = this;

                    // register the update facet function
                    ctrl.updateFacet = function () {
                        return updateFacetColumn($scope);
                    };

                    // register the initialize facet function
                    ctrl.preProcessFacet =  function () {
                        return preProcessFacetColumn($scope);
                    };
                }],
                require: ['^faceting', 'choicePicker'],
                link: function (scope, element, attr, ctrls) {

                    var parentCtrl = ctrls[0],
                        currentCtrl = ctrls[1];

                    // register this controller in the parent
                    parentCtrl.register(currentCtrl, scope.facetColumn, scope.index);
                    scope.parentCtrl = parentCtrl;

                    // This can eventually be in the annotation, that's why I created this attribute
                    scope.showSearch = (scope.facetColumn.column.type.name !== "boolean");

                    scope.tooltip = messageMap.tooltip;

                    // in scalar mode, we don't want to show search columns because it's
                    // based on the scalar value of the column, in entity however we should
                    // get the search columns from ermrestjs and display them to the user
                    if (scope.facetColumn.isEntityMode) {
                        scope.searchColumns = scope.facetColumn.sourceReference.searchColumns;
                    }

                    scope.checkboxRows = [];

                    // for the search popup selector
                    scope.openSearchPopup = function() {
                        var params = {};

                        // the parameters needed for logging
                        var stack = getDefaultLogInfo(scope).stack;
                        params.logStack = stack;
                        params.logStackPath = logService.getStackPath(scope.facetModel.parentLogStackPath, logService.logStackPaths.FACET_POPUP);

                        // for the title
                        params.parentReference = scope.facetColumn.reference;
                        params.displayname = scope.facetColumn.displayname;
                        // disable comment for facet, since it might be confusing
                        params.comment = scope.facetColumn.comment;

                        params.reference = scope.reference;
                        params.reference.session = scope.$root.session;
                        params.selectMode = "multi-select";
                        params.faceting = false;
                        params.facetPanelOpen = false;

                        // callback on each selected change (incldues the url limitation logic)
                        params.onSelectedRowsChanged = modalDataChanged(scope, false);

                        // if url limitation alert exists, remove it.
                        // The alert on the main recordset page is behaving differently
                        // from the alert that we are going to show on modal.
                        // We're showing alert as a preventing measure in recordset.
                        // if users are about to reach the limit, upon making the request
                        // we're showing the modal and ignoring the request. So the alert
                        // is just to tell users why they couldn't do the action and it
                        // doesn't have to remain on the page.
                        // While the alert on modal must stay untill they actually remove
                        // some selections and url becomes shorter than the limit.
                        AlertsService.deleteURLLimitAlert();

                        // to choose the correct directive
                        params.mode = "selectFaceting";
                        params.showFaceting = false;

                        if (scope.facetColumn.hasNotNullFilter) {
                            params.matchNotNull = true;
                        }
                        if (scope.facetColumn.hasNullFilter) {
                            params.matchNull = true;
                        }

                        params.displayMode = recordsetDisplayModes.facetPopup;
                        params.parentDisplayMode = scope.facetModel.recordsetConfig.displayMode;
                        params.editable = false;

                        params.selectedRows = [];

                        // generate list of rows needed for modal
                        scope.checkboxRows.forEach(function (row) {
                            if (!row.selected) return;
                            var newRow = {};

                            // - row.uniqueId will return the filter's uniqueId and not
                            //    the tuple's. We need tuple's uniqueId in here
                            //    (it will be used in the logic of isSelected in modal).
                            // - data is needed for the post process that we do on the data.
                            if (row.tuple && row.tuple.data && scope.facetColumn.isEntityMode) {
                                newRow.uniqueId = row.tuple.uniqueId;
                                newRow.data = row.tuple.data;
                            } else {
                                newRow.uniqueId = row.uniqueId;
                            }

                            newRow.displayname = (newRow.uniqueId === null) ? {value: null, isHTML: false} : row.displayname;
                            newRow.tooltip = newRow.displayname;
                            newRow.isNotNull = row.notNull;
                            params.selectedRows.push(newRow);
                        });

                        // show null or not
                        if (!scope.facetColumn.isEntityMode) {
                            params.showNull = true;
                        }

                        // modal properties
                        var windowClass = "search-popup faceting-show-details-popup";
                        if (!scope.facetColumn.isEntityMode) {
                            windowClass += " scalar-show-details-popup";
                        }

                        modalUtils.showModal({
                            animation: false,
                            controller: "SearchPopupController",
                            windowClass: windowClass,
                            controllerAs: "ctrl",
                            resolve: {
                                params: params
                            },
                            size: modalUtils.getSearchPopupSize(params),
                            templateUrl:  UriUtils.chaiseDeploymentPath() + "common/templates/searchPopup.modal.html"
                        }, modalDataChanged(scope, true), null, false);
                    };

                    // for clicking on each row (will be registerd as a callback for list directive)
                    scope.onRowClick = function(row, $event) {
                        var cause = row.selected ? logService.updateCauses.FACET_SELECT : logService.updateCauses.FACET_DESELECT;

                        // get the new reference based on the operation
                        var ref;
                        if (row.isNotNull) {
                            if (row.selected) {
                                ref = scope.facetColumn.addNotNullFilter();
                            } else {
                                ref = scope.facetColumn.removeNotNullFilter();
                            }
                            $log.debug("faceting: request for facet (index=" + scope.facetColumn.index + ") choice add. Not null filter.'");
                        } else {
                            if (row.selected) {
                                ref = scope.facetColumn.addChoiceFilters([row.uniqueId]);
                            } else {
                                ref = scope.facetColumn.removeChoiceFilters([row.uniqueId]);
                            }
                            $log.debug("faceting: request for facet (index=" + scope.facetColumn.index + ") choice " + (row.selected ? "add" : "remove") + ". uniqueId='" + row.uniqueId);
                        }


                        // if the updateVMReference failed (due to url length limit),
                        // we should revert the change back
                        if (!scope.parentCtrl.updateVMReference(ref, scope.index, cause)) {
                            $log.debug("faceting: URL limit reached. Reverting the change.");
                            row.selected = !row.selected;
                            $event.preventDefault();
                            return;
                        }

                        // if the changed row is not-null
                        if (row.isNotNull) {
                            var i;
                            if (row.selected) {
                                // if user selects not_null, we must deselect and disable other options
                                scope.facetModel.appliedFilters = [facetingUtils.getNotNullFilter(true)];
                                for (i = 1; i < scope.checkboxRows.length; i++) {
                                    scope.checkboxRows[i].selected = false;
                                    scope.checkboxRows[i].disabled = true;
                                }
                            } else {
                                // if user deselects not_null, we must enable all the options
                                scope.facetModel.appliedFilters = [];
                                for (i = 1; i < scope.checkboxRows.length; i++) {
                                    scope.checkboxRows[i].disabled = false;
                                }
                            }
                            return;
                        }

                        // if the changed row is not not-null
                        if (row.selected) {
                            scope.facetModel.appliedFilters.push({
                                selected: true,
                                uniqueId: row.uniqueId,
                                displayname: row.displayname,
                                tuple: row.tuple
                            });
                        } else {
                            scope.facetModel.appliedFilters = scope.facetModel.appliedFilters.filter(function (f) {
                                return f.uniqueId !== row.uniqueId;
                            });
                        }
                    };

                    // retries the query for the current facet
                    scope.retryQuery = function (noConstraints) {
                        scope.facetModel.noConstraints = noConstraints;

                        // log in the client
                        logService.logClientAction({
                            action: currentCtrl.getFacetLogAction(scope.index, logService.logActions.FACET_RETRY),
                            stack: currentCtrl.getFacetLogStack(scope.index, extraInfo)
                        }, scope.facetColumn.sourceReference.defaultLogInfo);

                        parentCtrl.updateFacetColumn(scope.index, logService.updateCauses.FACET_RETRY);
                    }

                    scope.search = function (term) {
                        if (term) term = term.trim();
                        var ref = scope.reference.search(term);
                        if (scope.$root.checkReferenceURL(ref)) {
                            scope.searchTerm = term;

                            // log the client action
                            var extraInfo = typeof term === "string" ? {"search-str": term} : {};
                            logService.logClientAction({
                                action: currentCtrl.getFacetLogAction(scope.index, action),
                                stack: currentCtrl.getFacetLogStack(scope.index, extraInfo)
                            }, scope.facetColumn.sourceReference.defaultLogInfo);

                            $log.debug("faceting: request for facet (index=" + scope.facetColumn.index + ") update. new search=" + term);
                            scope.parentCtrl.updateFacetColumn(scope.index, logService.updateCauses.FACET_SEARCH_BOX);
                        }
                    };

                    scope.$watch(function () {
                        return scope.facetModel.isOpen && scope.facetModel.initialized && scope.facetPanelOpen;
                    }, function (newVal, oldVal) {
                        var findMoreHeight = 25;
                        if (newVal) {
                            $timeout(function () {
                                var choicePickerElem = element[0].getElementsByClassName("choice-picker")[0];
                                var addedHeight = choicePickerElem.scrollHeight;
                                // if the load more text link isn't present, save some space for it
                                // TODO: seems like showFindMore solved the case of adding the extra height twice
                                //   - i think because the below (isOpen and !isLoading) watch event fires off first
                                // if (!scope.hasMore && !scope.showFindMore) addedHeight += findMoreHeight;
                                // TODO the line above didn't have any effect since hasMore was always true,
                                // so I commented it. We should eventually remove this.
                                choicePickerElem.style.height = addedHeight + "px";
                            }, 0);
                        } else if (newVal == false) {
                            var choicePickerElem = element[0].getElementsByClassName("choice-picker")[0];
                            choicePickerElem.style.height = "";
                        }
                    });

                    scope.$watch(function() {
                        // NOTE initialized = false & isOpen=true -> isLoading must be true
                        return scope.facetModel.isOpen && !scope.facetModel.isLoading;
                    }, function (newVal, oldVal) {
                        if (newVal) {
                            $timeout(function () {
                                var listElem = element[0].getElementsByClassName("chaise-list-container")[0];
                                if (listElem) {
                                    scope.showFindMore = listElem.scrollHeight > listElem.offsetHeight;
                                }
                            });
                        }
                    });
                }
            };
        }])

        .directive("checkPresence", ['facetingUtils', '$q', '$log', 'logService', 'UriUtils', function(facetingUtils, $q, $log, logService, UriUtils) {
            return {
                restrict: 'AE',
                templateUrl:  UriUtils.chaiseDeploymentPath() + 'common/templates/faceting/check-presence.html',
                scope: {
                    facetColumn: "=",
                    facetModel: "=",
                    index: "=",
                    facetPanelOpen: "="
                },
                controller: ['$scope', function ($scope) {
                    var ctrl = this;

                    // register the update facet function
                    ctrl.updateFacet = function () {
                        return $scope.updateFacetColumn($scope);
                    };

                    // register the initialize facet function
                    ctrl.preProcessFacet =  function () {
                        return $scope.preProcessFacetColumn($scope);
                    };
                }],
                require: ['^faceting', 'checkPresence'],
                link: function (scope, element, attr, ctrls) {
                    var parentCtrl = ctrls[0],
                        currentCtrl = ctrls[1];

                    // register this controller in the parent
                    parentCtrl.register(currentCtrl, scope.facetColumn, scope.index);
                    scope.parentCtrl = parentCtrl;

                    scope.checkboxRows = [];

                    scope.updateFacetColumn = function () {
                        var defer = $q.defer();
                        scope.facetModel.appliedFilters = [];
                        scope.checkboxRows = [];

                        // show not-null if it exists or hide_not_null_choice is missing.
                        if (!scope.facetColumn.hideNotNullChoice) {
                            scope.checkboxRows.push(facetingUtils.getNotNullFilter());
                            if (scope.facetColumn.hasNotNullFilter) {
                                scope.checkboxRows[0].selected = true;
                                scope.facetModel.appliedFilters.push(facetingUtils.getNotNullFilter());
                            }
                        }

                        // not-null might not be available and this could be 0
                        var nullFilterIndex = 1;

                        // show null
                        if (!scope.facetColumn.hideNullChoice) {
                            nullFilterIndex = scope.checkboxRows.push(facetingUtils.getNullFilter()) - 1;
                            if (scope.facetColumn.hasNullFilter) {
                                scope.checkboxRows[nullFilterIndex].selected = true;
                                scope.facetModel.appliedFilters.push(facetingUtils.getNullFilter());
                            }
                        }


                        return defer.resolve(true), defer.promise;
                    };

                    scope.preProcessFacetColumn = function () {
                        var defer = $q.defer();
                        // this function is expected but we don't need any extra logic here.
                        return defer.resolve(true), defer.promise;
                    };

                    scope.onRowClick = function (row, $event) {
                        var cause = row.selected ? logService.updateCauses.FACET_SELECT : logService.updateCauses.FACET_DESELECT;

                        var ref;
                        if (row.isNotNull) {
                            if (row.selected) {
                                ref = scope.facetColumn.addNotNullFilter();
                            } else {
                                ref = scope.facetColumn.removeNotNullFilter();
                            }
                            $log.debug("faceting: request for facet (index=" + scope.facetColumn.index + ") add not-null filter.'");
                        } else {
                            if (row.selected) {
                                ref = scope.facetColumn.addChoiceFilters([row.uniqueId]);
                            } else {
                                ref = scope.facetColumn.removeChoiceFilters([row.uniqueId]);
                            }
                            $log.debug("faceting: request for facet (index=" + scope.facetColumn.index + ") choice add null filter.");
                        }

                        if (!scope.parentCtrl.updateVMReference(ref, scope.index, cause)) {
                            $log.debug("faceting: URL limit reached. Reverting the change.");
                            row.selected = !row.selected;
                            $event.preventDefault();
                            return;
                        }

                        if (row.selected) {
                            scope.facetModel.appliedFilters.push(row.isNotNull ? facetingUtils.getNotNullFilter() : facetingUtils.getNullFilter());
                        } else {
                            scope.facetModel.appliedFilters = scope.facetModel.appliedFilters.filter(function (f) {
                                return f.uniqueId !== row.uniqueId;
                            });
                        }

                    };
                }
            };

        }]);
})();
