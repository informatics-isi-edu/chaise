(function () {
    'use strict';

    angular.module('chaise.faceting', ['plotly'])

        .directive('faceting', ['recordTableUtils', '$timeout', '$rootScope', function (recordTableUtils, $timeout, $rootScope) {
            
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/faceting.html',
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
                        
                        $scope.vm.facetModels[index] = {
                            initialized: false,
                            isOpen: false,
                            isLoading: false,
                            processed: true,
                            appliedFilters: [],
                            updateFacet: childCtrl.updateFacet,
                            initializeFacet: childCtrl.initializeFacet
                        };
                        
                        if (ctrl.facetingCount === $scope.vm.reference.facetColumns.length) {
                            $rootScope.facetsLoaded = true;
                        }
                    };
                    
                    ctrl.updateVMReference = function (reference, index) {
                        return $scope.updateReference(reference, index);
                    };
                    
                    ctrl.setInitialized = function () {
                        $scope.vm.facetModels.forEach(function (fm, index) {
                            if (fm.isOpen) fm.initialized = false;
                        });
                    };
                    
                    ctrl.updateFacetColumn = function (index) {
                        var fm = $scope.vm.facetModels[index];
                        fm.processed = false;
                        fm.isLoading = true;
                        recordTableUtils.updatePage($scope.vm);
                    };
                    
                    ctrl.focusOnFacet = function (index) {
                        $scope.focusOnFacet(index);
                    }
                }],
                require: 'faceting',
                link: function (scope, element, attr, currentCtrl) {
                    scope.updateReference = function (reference, index) {
                        if (!scope.$root.checkReferenceURL(reference)) {
                            return false;
                        }
                        scope.vm.lastActiveFacet = index;
                        scope.vm.reference = reference;
                        scope.$emit('facet-modified');
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
                        var newRef;
                        if (typeof index === 'undefined') {
                            // // delete all filters
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
                        } 
                        
                        scope.updateReference(newRef, -1);
                    };
                    
                    /**
                     * open or close the facet given its index
                     * @param  {int} index index of facet
                     */
                    scope.toggleFacet = function (index) {
                        $timeout(function() {
                            var fm = scope.vm.facetModels[index];
                            
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
                        });
                    };
                    
                    scope.scrollToFacet = function (index) {
                        var container = angular.element(document.getElementsByClassName('faceting-container')[0]);
                        var el = angular.element(document.getElementById('fc-'+index));
                        container.scrollToElementAnimated(el, 5).then(function () {
                            $timeout(function () {
                                el.addClass("active");
                            }, 100);
                            $timeout(function () {
                                el.removeClass('active');
                            }, 500);
                        });
                    }
                    
                    scope.focusOnFacet = function (index) {
                        var fm = scope.vm.facetModels[index];
                        
                        if (!fm.isOpen) {
                            fm.isOpen = true;
                            scope.toggleFacet(index);
                        }
                        
                        scope.scrollToFacet(index);
                    };
                    
                    scope.vm.focusOnFacet = function (index) {
                        return scope.focusOnFacet(index);
                    }
                    
                    // TODO I am attaching the removeFilter to the vm here, maybe I shouldn't?
                    scope.vm.hasFilter = function (col) {
                        return scope.hasFilter(col);
                    }

                    // TODO I am attaching the removeFilter to the vm here, maybe I shouldn't?
                    scope.vm.removeFilter = function (colId, id) {
                        scope.removeFilter(colId, id);
                    }
                }
            };
        }])

        // NOTE This directive has not been used
        .directive('stringPicker', ['$window', 'DataUtils', 'tableConstants', function ($window, DataUtils, tableConstants) {
            
            /**
             * Should be called each time facetColumn has been modified.
             * Will populate the following:
             *  - scope.selectModel.reference
             *  - scope.selectModel.columns
             *  - scope.selectModel.selectedRows
             *  - scope.selectFetched
             *  - scope.searchModel.reference
             *  - scope.searchModel.columns
             *  - scope.searchModel.selectedRows
             *  - scope.searchFetched
             */
            function updateFacetColumn(scope) {
                
                // update the selectModel reference
                var ref = scope.facetColumn.column.groupAggregate.entityCounts;
                if (scope.selectModel.search) {
                    ref = ref.search(scope.selectModel.search);
                }
                scope.selectModel.reference = ref;
                scope.selectModel.columns = ref.columns;
                scope.selectFetched = false;
                
                // update the selectred rows
                scope.selectModel.selectedRows = scope.facetColumn.choiceFilters.map(function (f) { 
                    return {
                        displayname: f.displayname,
                        uniqueId: f.term
                    };
                });
                
                // update the searchModel reference
                ref = scope.facetColumn.column.groupAggregate.entityValues;
                if (scope.searchModel.search) {
                    ref = ref.search(scope.searchModel.search);
                }
                scope.searchModel.reference = ref;
                scope.searchModel.columns = ref.columns;
                scope.searchFetched = false;
            }
            
            /**
             * Fetch the records for the active tab, if already not fetched
             */
            function fetchRecords(scope) {
                var isSelect = scope.activeTab === scope.SELECT_TAB;
    
                // make sure data has not been fetched before.
                if ( (isSelect && scope.selectFetched) || (!isSelect && scope.searchFetched)) {
                    return;
                }
                
                var model = isSelect ? scope.selectModel : scope.searchModel;
                
                model.reference.read(tableConstants.PAGE_SIZE).then(function getPseudoData(page) {
                    
                    model.hasLoaded = true;
                    model.initialized = true;
                    model.page = page;
                    model.rowValues = DataUtils.getRowValuesFromPage(page);
                    
                    if (isSelect) {
                        scope.selectFetched = true;
                    } else {
                        scope.searchFetched = true;
                    }
                    
                }, function(exception) {
                    throw exception;
                });
            }
            
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/string-picker.html',
                scope: {
                    vm: "=",
                    facetColumn: "=",
                    isOpen: "="
                },
                link: function (scope, element, attr) {
                    scope.SELECT_TAB = 'select';
                    scope.SEARCH_TAB = 'search';
                    
                    // used for the scalar multi-select
                    scope.selectModel = {
                        selectedRows: [],
                        enableAutoSearch: true,
                        enableSort: true,
                        sortby: "c1",
                        sortOrder: "asc",
                        pageLimit: tableConstants.PAGE_SIZE,
                        config: {
                            viewable: false, editable: false, deletable: false, selectMode: "multi-select",
                            hideTotalCount: true, hideSelectedRows: true, hidePageSettings: true
                        }
                    };
                    // used for the scalar search
                    scope.searchModel = {
                        selectedRows: [], //TODO this should be optional
                        enableAutoSearch: true,
                        enableSort: true,
                        sortby: "c1",
                        sortOrder: "asc",
                        pageLimit: tableConstants.PAGE_SIZE,
                        config: {
                            viewable: false, editable: false, deletable: false, selectMode: "no-select",
                            hideTotalCount: true, hideSelectedRows: true, hidePageSettings: true
                        }
                    }
                    
                    // populate the search and select model reference and selected rows
                    updateFacetColumn(scope);
                    
                    scope.changeFilters = function (tuples, isSelected) {
                        var ref;
                        if (isSelected) {
                            ref = scope.facetColumn.addChoiceFilters(tuples.map(function (t) {
                                return {value: t.uniqueId, displayvalue: t.uniqueId, isHTML: false};
                            }));
                        } else {
                            ref = scope.facetColumn.removeChoiceFilters(tuples.map(function (t) {
                                return t.uniqueId;
                            }));
                        }
                        
                        scope.vm.reference = ref;
                        scope.$emit("facet-modified");
                    };
                    
                    scope.addSearchFilter = function (term) {
                        var sf = scope.facetColumn.searchFilters.filter(function (f) {
                            return f.term === term;
                        });
                        if (sf.length !== 0) {
                            return; // already exists
                        }
                        scope.vm.reference = scope.facetColumn.addSearchFilter(term);
                        scope.$emit("facet-modified");
                    }
                    
                    scope.$on('data-modified', function ($event) {
                        //TODO fix this
                        scope.facetColumn = scope.vm.facetColumns[scope.facetColumn.index];
                        
                        updateFacetColumn(scope);
                        if (scope.isOpen) {
                            fetchRecords(scope);
                        }
                    });
                    
                    scope.$watch("isOpen", function (newValue, oldValue) {
                        if(angular.equals(newValue, oldValue) || !newValue){
                            return;
                        }
                        fetchRecords(scope);
                    });
                    
                    scope.onTabSelected = function (tab) {
                        scope.activeTab = tab;
                        if (scope.isOpen) {
                            fetchRecords(scope);
                        }
                    }
                }
            };
        }])
        
        // NOTE This directive has not been used
        .directive('entityPicker', ['$uibModal', function ($uibModal) {
            /**
             * Should be called each time facetColumn has been modified.
             * Will populate the following:
             *  - scope.entityModel.selectedRows
             */
            function updateFacetColumn(scope) {
                // update the selected rows
                scope.entityModel.selectedRows = scope.facetColumn.choiceFilters.map(function (f) { 
                    return {
                        displayname: f.displayname,
                        uniqueId: f.term
                    };
                });
            }
            
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/entity-picker.html',
                scope: {
                    vm: "=",
                    facetColumn: "=",
                    isOpen: "="
                },
                link: function (scope, element, attr) {
                    scope.entityModel = {
                        selectedRows: []
                    }

                    updateFacetColumn(scope);

                    scope.openEntityPicker = function () {
                        var params = {};

                        params.reference = scope.facetColumn.sourceReference;
                        params.reference.session = scope.$root.session;
                        params.context = "compact/select";
                        params.selectMode = "multi-select";
                        params.selectedRows = scope.entityModel.selectedRows;

                        var modalInstance = $uibModal.open({
                            animation: false,
                            controller: "SearchPopupController",
                            controllerAs: "ctrl",
                            resolve: {
                                params: params
                            },
                            size: "lg",
                            templateUrl: "../common/templates/searchPopup.modal.html"
                        });

                        modalInstance.result.then(function dataSelected(tuples) {
                            var ref = scope.facetColumn.replaceAllChoiceFilters(tuples.map(function (t) {
                                return {value: t.uniqueId, displayvalue: t.displayname.value, isHTML: t.displayname.isHTML};
                            }));

                            scope.vm.reference = ref;
                            scope.$emit("facet-modified");
                        });
                    };
                }
            };
        }])

        .directive('rangePicker', ['$timeout', '$q', function ($timeout, $q) {
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/range-picker.html',
                scope: {
                    facetColumn: "=",
                    facetModel: "=",
                    index: "="
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
                    
                    ctrl.initializeFacet = function () {
                        return $scope.initialRows();;
                    }
                }],
                require: ['^faceting', 'rangePicker'],
                link: function (scope, element, attr, ctrls) {
                    var parentCtrl = ctrls[0],
                        currentCtrl = ctrls[1];
                    
                    // register this controller in the parent
                    parentCtrl.register(currentCtrl, scope.facetColumn, scope.index);
                    scope.parentCtrl = parentCtrl;
                    
                    scope.ranges = [];
                    // draw the plot
                    // scope.plot = {
                    //     data: [{
                    //         x: ["0-1", "1-2", "3-4", "5-6", "6-7", "7-8", "8-9"],
                    //         y: [5, 10, 12, 4, 11, 4, 58],
                    //         type: 'bar'
                    //     }],
                    //     options: {
                    //         displayLogo: false
                    //     },
                    //     layout: {
                    //         autosize: false,
                    //         width: 400,
                    //         height: 150,
                    //         margin: {
                    //             l: 15,
                    //             r: 10,
                    //             b: 20,
                    //             t: 20,
                    //             pad: 2
                    //         },
                    //         yaxis: {
                    //             fixedrange: true
                    //         },
                    //         bargap: 0
                    //     }
                    // }
                    
                    function createChoiceDisplay(filter, selected) { 
                        return {
                            uniqueId: filter.uniqueId,
                            displayname: {value: filter.toString(), isHTML: false},
                            selected: selected,
                            metaData: {
                                min: filter.min,
                                max: filter.max
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
                    
                    // callback for the list directive
                    scope.onSelect = function (row, $event) {
                        var res;
                        if (row.selected) {
                            res = scope.facetColumn.addRangeFilter(row.metaData.min, row.metaData.max);
                        } else {
                            res = scope.facetColumn.removeRangeFilter(row.metaData.min, row.metaData.max);
                        }
                        
                        if (res && !scope.parentCtrl.updateVMReference(res.reference, scope.index)) {
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
                        var res = scope.facetColumn.addRangeFilter(min, max);
                        if (!res) {
                            return; // duplicate filter
                        }
                        
                        if (!scope.parentCtrl.updateVMReference(res.reference, scope.index)) {
                            return; // uri limit
                        }

                        var rowIndex = scope.ranges.findIndex(function (obj) {
                            return obj.uniqueId == res.filter.uniqueId;
                        });
                        
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
                        scope.ranges = [];
                        scope.facetModel.appliedFilters = [];
                        
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
                        
                        defer.resolve();
                        return defer.promise;
                    };
                    
                    // some of the facets might have been cleared, this function will unselect those
                    scope.syncSelected = function () {
                        var filterIndex = function (uniqueId) {
                            return scope.facetColumn.rangeFilters.findIndex(function (f) {
                                return f.uniqueId = uniqueId;
                            });
                        }
                        
                        for (var i = 0; i < scope.ranges.length; i++) {
                            // if couldn't find the filter, then it should be unselected
                            if (filterIndex(scope.ranges[i].uniqueId) === -1) {
                                scope.ranges[i].selected = false;
                            }
                        }
                    };

                    // Gets the facet data for min/max
                    // TODO get the histogram data
                    scope.updateFacetData = function () {
                        var defer = $q.defer();
                        
                        (function (uri) {
                            var agg = scope.facetColumn.column.aggregate;
                            var aggregateList = [
                                agg.minAgg,
                                agg.maxAgg
                            ];
                            
                            scope.facetColumn.sourceReference.getAggregates(aggregateList).then(function(response) {
                                if (scope.facetColumn.sourceReference.uri !== uri) {
                                    defer.resolve(false);
                                } else {
                                
                                    // console.log("Facet " + scope.facetColumn.displayname.value + " min/max: ", response);
                                    if (scope.facetColumn.column.type.name.indexOf("timestamp") > -1) {
                                        // convert and set the values if they are defined.
                                        // if values are null, undefined, false, 0, or '' we don't want to show anything
                                        if (response[0] && response[1]) { 
                                            var minTs = moment(response[0]);
                                            var maxTs = moment(response[1]);

                                            scope.rangeOptions.absMin = {
                                                date: minTs.format('YYYY-MM-DD'),
                                                time: minTs.format('hh:mm:ss')
                                            };
                                            scope.rangeOptions.absMax = {
                                                date: maxTs.format('YYYY-MM-DD'),
                                                time: maxTs.format('hh:mm:ss')
                                            };
                                        }
                                    } else {
                                        scope.rangeOptions.absMin = response[0];
                                        scope.rangeOptions.absMax = response[1];
                                    }
                                    
                                    defer.resolve(true);
                                }
                            }).catch(function (err) {
                                defer.reject(err);
                            });
                        })(scope.facetColumn.sourceReference.uri); 
                        
                        return defer.promise;
                    };

                    //  all the events related to the plot
                    // scope.plotlyEvents = function (graph) {
                    //     graph.on('plotly_relayout', function (event) {
                    //         $timeout(function () {
                    //             scope.min = Math.floor(event['xaxis.range[0]']);
                    //             scope.max = Math.ceil(event['xaxis.range[1]']);
                    //         });
                    //     });
                    // 
                    // };
                    scope.rangeOptions = {
                        type: scope.facetColumn.column.type,
                        callback: scope.addFilter
                    }
                }
            };
        }])
        
        .directive('choicePicker', ['$q', '$timeout', '$uibModal', 'tableConstants', function ($q, $timeout, $uibModal, tableConstants) {

            /**
             * Initialzie facet column.
             * This will take care of getting the displaynames of rows. 
             * (If it's a entity picker, the displayname will be different than the value.).
             *
             * NOTE should not be used directly in this directive.
             * @param  {obj} scope The current scope
             */
            function initializeFacetColumn(scope) {
                var defer = $q.defer();
                
                if (scope.facetColumn.choiceFilters.length === 0) {
                    defer.resolve();
                } else {
                    scope.facetColumn.getChoiceDisplaynames().then(function (filters) {
                        filters.forEach(function (f) {
                            scope.facetModel.appliedFilters.push({
                                uniqueId: f.uniqueId,
                                displayname: f.displayname                                
                            });
                        });
                        
                        defer.resolve();
                    }).catch(function (error) {
                        throw error;
                    });
                }
                return defer.promise;
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
                
                var appliedFilterToRow = function (f) {
                    return {
                        uniqueId: f.uniqueId,
                        displayname: f.displayname,
                        selected: true
                    }
                }
                
                // console.log("updating FACET: " + scope.index);
                
                // facetColumn has changed so create the new reference
                if (scope.facetColumn.isEntityMode) {
                    scope.reference = scope.facetColumn.sourceReference.contextualize.compact;
                } else {
                    scope.reference = scope.facetColumn.column.groupAggregate.entityCounts;
                }
                
                // make sure to add the search term
                if (scope.searchTerm) {
                    scope.reference = scope.reference.search(scope.searchTerm);
                }

                
                var appliedLen = scope.facetModel.appliedFilters.length;
                if (appliedLen >= tableConstants.PAGE_SIZE) {
                    scope.checkboxRows = scope.facetModel.appliedFilters.map(appliedFilterToRow);
                    defer.resolve(true);
                } else {
                    // read new data if neede                
                    (function (uri) {
                        scope.reference.read(appliedLen + tableConstants.PAGE_SIZE).then(function (page) {
                            // if this is not the result of latest facet change
                            if (scope.reference.uri !== uri) {
                                defer.resolve(false);
                            } else {
                                scope.checkboxRows = scope.facetModel.appliedFilters.map(appliedFilterToRow);
                                page.tuples.forEach(function (tuple) {
                                    // if we're showing enough rows
                                    if (scope.checkboxRows.length == tableConstants.PAGE_SIZE) {
                                        return;
                                    }
                                    
                                    var value;
                                    if (scope.facetColumn.isEntityMode) {
                                        // the filter might not be on the shortest key,
                                        // therefore the uniqueId is not correct.
                                        value = tuple.data[scope.facetColumn.column.name];
                                    } else {
                                        // The name of column is value
                                        value = tuple.data['value'];
                                    }
                                    
                                    var i = scope.facetModel.appliedFilters.findIndex(function (row) {
                                        return row.uniqueId == value;
                                    })
                                    if (i !== -1) {
                                        return;
                                    }
                                    
                                    // currentValues[value] = true;
                                    scope.checkboxRows.push({
                                        selected: false,
                                        displayname: value == null ? {value: null, isHTML: false} : tuple.displayname,
                                        uniqueId: value
                                    });
                                });
                                
                                scope.hasMore = page.hasNext;    
                                
                                defer.resolve(true);
                            }
                            
                        }).catch(function (err) {
                            defer.reject(err);
                        });
                    })(scope.reference.uri);
                }
                
                return defer.promise;
            }

            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/choice-picker.html',
                scope: {
                    facetColumn: "=",
                    facetModel: "=",
                    index: "="
                },
                controller: ['$scope', function ($scope) {
                    var ctrl = this;
                    
                    // register the update facet function
                    ctrl.updateFacet = function () {
                        return updateFacetColumn($scope);
                    }
                    
                    // register the initialize facet function
                    ctrl.initializeFacet =  function () {
                        return initializeFacetColumn($scope);
                    }
                }],
                require: ['^faceting', 'choicePicker'],
                link: function (scope, element, attr, ctrls) {
                    
                    var parentCtrl = ctrls[0],
                        currentCtrl = ctrls[1];
                    
                    // register this controller in the parent
                    parentCtrl.register(currentCtrl, scope.facetColumn, scope.index);
                    scope.parentCtrl = parentCtrl;
                    
                    scope.checkboxRows = [];

                    // for the search popup selector
                    scope.openSearchPopup = function() {
                        var params = {};
                        params.reference = scope.reference;
                        params.reference.session = scope.$root.session;
                        params.displayname = scope.facetColumn.displayname;
                        params.context = "compact/select";
                        params.selectMode = "multi-select";
                        params.selectedRows = scope.checkboxRows.filter(function (row) {
                            return row.selected;
                        });

                        var modalInstance = $uibModal.open({
                            animation: false,
                            controller: "SearchPopupController",
                            windowClass: "search-popup",
                            controllerAs: "ctrl",
                            resolve: {
                                params: params
                            },
                            size: "xl",
                            templateUrl: "../common/templates/searchPopup.modal.html"
                        });

                        modalInstance.result.then(function dataSelected(tuples) {
                            // TODO needs refactoring.
                            // If the data was preselected, we won't have the data object attached
                            // to the tuples. In case of entity picker we must always get the value from data.
                            // NOTE This might be buggy.
                            var getTupleValue = function (t) {
                                var col_name = scope.facetColumn.isEntityMode ? scope.facetColumn.column.name : "value";
                                if (t.data && col_name in t.data) {
                                    return t.data[col_name];
                                } else {
                                    return t.uniqueId;
                                }
                            }
                            
                            var ref = scope.facetColumn.replaceAllChoiceFilters(tuples.map(function (t) {
                                return getTupleValue(t);
                            }));
                            scope.facetModel.appliedFilters = tuples.map(function (t) {
                                var val = getTupleValue(t);
                                // NOTE displayname will always be string, but we want to treat null and empty string differently,
                                // therefore we have a extra case for null, to just return null.
                                return {
                                    uniqueId: val, 
                                    displayname: (val == null) ? {value: null, isHTML: false} : t.displayname
                                };
                            });
                            
                            // make sure to update all the opened facets
                            scope.parentCtrl.setInitialized();
                            
                            // update the reference
                            scope.parentCtrl.updateVMReference(ref, -1);
                            
                            // focus on the current facet
                            scope.parentCtrl.focusOnFacet(scope.index);
                        });
                    }

                    // for clicking on each row (will be registerd as a callback for list directive)
                    scope.onRowClick = function(row, $event) {
                        var ref;
                        if (row.selected) {
                            ref = scope.facetColumn.addChoiceFilters([row.uniqueId]);
                        } else {
                            ref = scope.facetColumn.removeChoiceFilters([row.uniqueId]);
                        }
                        
                        // if the updateVMReference failed (due to url length limit),
                        // we should revert the change back
                        if (!scope.parentCtrl.updateVMReference(ref, scope.index)) {
                            row.selected = !row.selected;
                            $event.preventDefault();
                        } else {
                            // update the appliedFilters
                            if (row.selected) {
                                scope.facetModel.appliedFilters.push({
                                    selected: true,
                                    uniqueId: row.uniqueId,
                                    displayname: row.displayname
                                });
                            } else {
                                scope.facetModel.appliedFilters = scope.facetModel.appliedFilters.filter(function (f) {
                                    return f.uniqueId !== row.uniqueId;
                                });
                            }
                            
                        }
                    };

                    // change the searchTerm and fire the updateFacetColumn
                    scope.enterPressed = function() {
                        var term = null;
                        if (scope.searchTerm) {
                            term = scope.searchTerm.trim();
                        } 
                        var ref = scope.reference.search(term);
                        if (scope.$root.checkReferenceURL(ref)) {
                            scope.searchTerm = term;
                            scope.parentCtrl.updateFacetColumn(scope.index);
                        }
                    };
                    
                    scope.inputChangedPromise = undefined;
                    
                    scope.inputChanged = function() {
                        // Cancel previous promise for background search that was queued to be called
                        if (scope.inputChangedPromise) {
                            $timeout.cancel(scope.inputChangedPromise);
                        }

                        // Wait for the user to stop typing for a second and then fire the search
                        scope.inputChangedPromise = $timeout(function() {
                            scope.inputChangedPromise = null;
                            scope.parentCtrl.updateFacetColumn(scope.index);
                        }, 1000);
                    };

                    // clear the search, if reference has search then fire update
                    scope.clearSearch = function() {
                        scope.searchTerm = null;
                        if (scope.reference.location.searchTerm) {
                            scope.parentCtrl.updateFacetColumn(scope.index);
                        }
                    };

                    scope.$watch(function () {
                        return scope.facetModel.isOpen && scope.facetModel.initialized;
                    }, function (newVal, oldVal) {
                        var findMoreHeight = 25;
                        if (newVal) {
                            $timeout(function () {
                                var choicePickerElem = element[0].getElementsByClassName("choice-picker")[0];
                                var addedHeight = choicePickerElem.scrollHeight;
                                // if the load more text link isn't present, save some space for it
                                // TODO: seems like showFindMore solved the case of adding the extra height twice
                                //   - i think because the below (isOpen and !isLoading) watch event fires off first
                                if (!scope.hasMore && !scope.showFindMore) addedHeight += findMoreHeight;
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
                                    scope.showFindMore = listElem.scrollHeight > listElem.offsetHeight
                                }
                            });
                        }
                    });
                }
            };
            
        }]);
})();
