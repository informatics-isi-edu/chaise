(function () {
    'use strict';

    angular.module('chaise.faceting', ['plotly'])

        .directive('faceting', [function () {
            var MAX_CONCURENT_REQUEST = 4;
            
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/faceting.html',
                scope: {
                    vm: "="
                },
                controller: ['$scope', function ($scope) {
                    var ctrl = this;
                    
                    ctrl.childCtrls = []; // child controllers
                    ctrl.outStandingRequestCount = 0; // number of pending requests
                    ctrl.doneRequests = []; // to keep track of requests that are done
                    
                    // register a children controller in here
                    ctrl.register = function (childCtrl, index, facetColumn) {
                        ctrl.childCtrls[index] = childCtrl;
                        //TODO this should be changed for openning facets when we load the page
                        $scope.isOpen[index] = false;
                        $scope.isLoading[index] = false;
                        $scope.initialized[index] = false;
                    };
                    
                    ctrl.updateFacets = function () {
                        if(!$scope.vm.isIdle) {
                            return;
                        }
                        
                        $scope.vm.reference.facetColumns.forEach(function (fc, index) {
                            if (ctrl.doneRequests[index] || !$scope.isOpen[index] || ctrl.outStandingRequestCount >= (MAX_CONCURENT_REQUEST-1) || !$scope.isLoading[index]) {
                                return;
                            }
                            
                            ctrl.outStandingRequestCount += 1;
                            console.log("asking for the " + index + ". waiting requests:" + ctrl.outStandingRequestCount);
                            ctrl.doneRequests[index] = true;
                            ctrl.childCtrls[index].updateFacet();
                        });
                    };
                    
                    ctrl.initializeFacet = function (index) {
                        ctrl.childCtrls[index].initializeFacet();
                    }
                    
                }],
                require: 'faceting',
                link: function (scope, element, attr, currentCtrl) {
                    
                    scope.isOpen = [];
                    scope.isLoading = [];
                    scope.initialized = [];
                    
                    scope.hasFilter = function (col) {
                        if(scope.vm.reference == null) {
                            return false;
                        }
                        
                        if (typeof col === 'undefined') {
                            return scope.vm.reference.location.facets != null; //TODO
                        } else {
                            return col.filters.length !== 0;
                        }
                    };

                    scope.removeFilter = function (col, filterIndex) {
                        var newRef;
                        if (typeof col === 'undefined') {
                            // // delete all filters
                            newRef = scope.vm.reference.removeAllFacetFilters();
                        } else if (typeof filterIndex === "undefined") {
                            // delete all fitler for one column
                            newRef = col.removeAllFilters();
                        } else {
                            // delete individual filter
                            newRef = col.removeFilter(filterIndex);
                        }
                        scope.vm.reference = newRef;
                        scope.$emit("facet-modified");
                    };
                    
                    scope.toggleFacet = function (index) {
                        scope.isOpen[index] = !scope.isOpen[index];
                        
                        if (!scope.initialized[index]) {
                            currentCtrl.initializeFacet(index);
                        }
                    };
                    
                    scope.vm.openFacet = function (fc) {
                        var el = document.getElementById('ft-heading-1-' + fc.index);
                        var container = document.getElementsByClassName('faceting-container')[0];
                        setTimeout(function() {
                            container.scrollTop = el.offsetTop - 50;
                            if (!scope.isOpen[fc.index]) {
                                el.click();
                            }
                        }, 0);
                    };
                    
                    // TODO I am attaching the removeFilter to the vm here, maybe I shouldn't?
                    scope.vm.hasFilter = function (col) {
                        return scope.hasFilter(col);
                    }

                    // TODO I am attaching the removeFilter to the vm here, maybe I shouldn't?
                    scope.vm.removeFilter = function (colId, id) {
                        scope.removeFilter(colId, id);
                    }
                    
                    // when the data has been modified, we need to get the new faceting data
                    scope.$on('data-modified', function ($event) {
                        console.log('data-modified in faceting');
                        currentCtrl.doneRequests = [];
                        currentCtrl.updateFacets();
                    })
                    
                    // make sure to change the state of open and close facets on each update
                    scope.$on('facet-modified', function ($event) {
                        scope.isOpen.forEach(function (val, index) {
                            if (val) {
                                scope.isLoading[index] = true;
                            } else {
                                scope.initialized[index] = false;
                            }
                        });
                    });
                }
            };
        }])

        .directive('stringPicker', ['$window', 'DataUtils', function ($window, DataUtils) {
            var PAGE_SIZE = 5;
            
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
                
                model.reference.read(PAGE_SIZE).then(function getPseudoData(page) {
                    
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
                        pageLimit: PAGE_SIZE,
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
                        pageLimit: PAGE_SIZE,
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

        .directive('rangePicker', ['$timeout', function ($timeout) {
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/range-picker.html',
                scope: {
                    vm: "=",
                    facetColumn: "=",
                    isLoading: "=",
                    initialized: "=",
                    index: "="
                },
                controller: ['$scope', function ($scope) {
                    var ctrl = this;
                    
                    /**
                     * update the current parent
                     * @param  {boolean} callParent if true, will call the updateFacets in faceting directive
                     */
                    ctrl.updateFacet = function () {
                        $scope.updateFacetData(true);
                    }
                    
                    ctrl.initializeFacet = function () {
                        $scope.initialRows();
                        $scope.updateFacetData();
                    }
                }],
                require: ['^faceting', 'rangePicker'],
                link: function (scope, element, attr, ctrls) {
                    var parentCtrl = ctrls[0],
                        currentCtrl = ctrls[1];
                    
                    // register this controller in the parent
                    parentCtrl.register(currentCtrl, scope.index, scope.facetColumn);
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
                            displayname: filter.displayname,
                            selected: selected,
                            metaData: {
                                min: filter.min,
                                max: filter.max
                            }
                        };
                    };

                    scope.onSelect = function (row) {
                        var res;
                        if (row.selected) {
                            res = scope.facetColumn.addRangeFilter(row.metaData.min, row.metaData.max);
                        } else {
                            res = scope.facetColumn.removeRangeFilter(row.metaData.min, row.metaData.max);
                        }
                        scope.vm.reference = res.reference;
                        scope.$emit("facet-modified");
                    };

                    // Add new integer filter, used as the callback function to range-inputs
                    scope.addFilter = function (min, max) {
                        var res = scope.facetColumn.addRangeFilter(min, max);
                        if (!res) return;

                        scope.ranges.push(createChoiceDisplay(res.filter, true));
                        scope.vm.reference = res.reference;
                        scope.$emit("facet-modified");
                    };

                    // Look at the filters available for the facet and add rows to represent the preset filters
                    scope.initialRows = function () {
                        scope.ranges = [];
                        
                        for (var i = 0; i < scope.facetColumn.filters.length; i++) {
                            var filter = scope.facetColumn.filters[i];

                            var rowIndex = scope.ranges.findIndex(function (obj) {
                                return obj.uniqueId == filter.uniqueId;
                            });

                            // if the row is not in the set of choices, add it
                            if (rowIndex == -1) {
                                scope.ranges.push(createChoiceDisplay(filter, true));
                            }
                        }
                    };

                    // Gets the facet data for min/max
                    // TODO get the histogram data
                    scope.updateFacetData = function (callParent) {
                        scope.isLoading[scope.index] = true;
                        
                        var agg = scope.facetColumn.column.aggregate;
                        var aggregateList = [
                            agg.minAgg,
                            agg.maxAgg
                        ];
                        
                        (function (facetColumn, callParent) {
                            facetColumn.sourceReference.getAggregates(aggregateList).then(function(response) {
                                console.log("Facet " + facetColumn.displayname.value + " min/max: ", response);
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

                                scope.initialized[scope.index] = true;
                                scope.isLoading[scope.index] = false;
                                
                                if (callParent) {
                                    scope.parentCtrl.outStandingRequestCount -= 1;
                                    console.log("got resposne for the " + scope.index + ". waiting requests:" + scope.parentCtrl.outStandingRequestCount);
                                    scope.parentCtrl.updateFacets();
                                }
                            });
                        })(scope.facetColumn, callParent); 
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
        
        .directive('choicePicker', ['recordTableUtils', '$uibModal', function (recordTableUtils, $uibModal) {
            var PAGE_SIZE = 10;
            
            // TODO right now I am keeping multiple boolean 
            // it can be in a single object! (facetModel)
            
            function updateFacetColumn(scope, callParent) {
                console.log("updating FACET: " + scope.index);
                scope.isLoading[scope.index] = true;
                
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
                
                // read new data if neede                
                (function (reference, facetColumn,  callParent) {
                    var currentValues = {};
                    
                    // get the list of applied filters
                    scope.checkboxRows = facetColumn.choiceFilters.map(function(f) {
                        currentValues[f.uniqueId] = true;
                        return {
                            selected: true, displayname: f.displayname, 
                            uniqueId: f.uniqueId, data: {value: f.term}
                        }; // what about the count? do we want to read or not?
                    });

                    var appliedLen = scope.checkboxRows.length;
                    
                    if (appliedLen < PAGE_SIZE) {
                        reference.read(appliedLen + PAGE_SIZE).then(function (page) {
                            page.tuples.forEach(function (tuple) {
                                // if this is not the result of latest facet change
                                if (scope.reference.uri !== reference.uri) {
                                    return;
                                }
                                // if we're showing enough rows
                                if (scope.checkboxRows.length == PAGE_SIZE) {
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
                                
                                if (!(value in currentValues)) {
                                    var row = {
                                        selected: false,
                                        displayname: tuple.displayname,
                                        uniqueId: value,
                                        data: {value: value}
                                    };
                                    
                                    currentValues[value] = true;
                                    scope.checkboxRows.push(row);
                                }
                            });
                            
                            scope.hasMore = page.hasNext;    
                            
                            //TODO refactor this
                            scope.initialized[scope.index] = true;
                            scope.isLoading[scope.index] = false;
                            
                            if (callParent) {
                                scope.parentCtrl.outStandingRequestCount -= 1;
                                console.log("got resposne for the " + scope.index + ". waiting requests:" + scope.parentCtrl.outStandingRequestCount);
                                scope.parentCtrl.updateFacets();
                            }
                            
                        }, function (err) {
                            scope.initialized[scope.index] = true;
                            scope.isLoading[scope.index] = false;
                            throw err;
                        });
                        
                    } else {
                        scope.initialized[scope.index] = true;
                        scope.isLoading[scope.index] = false;
                    }
                })(scope.reference, scope.facetColumn, callParent);
                
            }

            function updateVMReference(scope, ref) {
                scope.vm.reference = ref;
                scope.$emit('facet-modified');
            }
            
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/choice-picker.html',
                scope: {
                    vm: "=",
                    facetColumn: "=",
                    initialized: "=",
                    isLoading: "=",
                    index: "="
                },
                controller: ['$scope', function ($scope) {
                    var ctrl = this;
                    
                    /**
                     * update the current parent
                     * @param  {boolean} callParent if true, will call the updateFacets in faceting directive
                     */
                    ctrl.updateFacet = function () {
                        updateFacetColumn($scope, true);
                    }
                    
                    ctrl.initializeFacet = function () {
                        updateFacetColumn($scope);
                    }
                }],
                require: ['^faceting', 'choicePicker'],
                link: function (scope, element, attr, ctrls) {
                    var parentCtrl = ctrls[0],
                        currentCtrl = ctrls[1];
                    
                    // register this controller in the parent
                    parentCtrl.register(currentCtrl, scope.index, scope.facetColumn);
                    scope.parentCtrl = parentCtrl;

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
                            controllerAs: "ctrl",
                            resolve: {
                                params: params
                            },
                            size: "lg",
                            templateUrl: "../common/templates/searchPopup.modal.html"
                        });

                        modalInstance.result.then(function dataSelected(tuples) {
                            var ref = scope.facetColumn.replaceAllChoiceFilters(tuples.map(function (t) {
                                var value;
                                if (scope.facetColumn.isEntityMode) {
                                    value = t.data[scope.facetColumn.column.name];
                                } else {
                                    value = t.uniqueId;
                                }
                                return {value: value, displayvalue: t.displayname.value, isHTML: t.displayname.isHTML};
                            }));
                            updateVMReference(scope, ref);
                        });
                    }

                    scope.onRowClick = function(row) {
                        var ref;
                        if (row.selected) {
                            ref = scope.facetColumn.addChoiceFilters([{
                                value: row.uniqueId,
                                displayvalue: row.displayname.value,
                                isHTML: row.displayname.isHTML
                            }]);
                        } else {
                            ref = scope.facetColumn.removeChoiceFilters([row.uniqueId]);
                        }
                        updateVMReference(scope, ref);
                    };

                    // change the searchTerm and fire the updateFacetColumn
                    scope.enterPressed = function() {
                        var term = null;
                        if (scope.searchTerm) {
                            term = scope.searchTerm.trim();
                        } 
                        scope.searchTerm = term;
                        updateFacetColumn(scope);
                    }

                    // clear the search, if reference has search then fire update
                    scope.clearSearch = function() {
                        scope.searchTerm = null;
                        if (scope.reference.location.searchTerm) {
                            updateFacetColumn(scope);
                        }
                    };
                }
            };
            
        }]);
})();
