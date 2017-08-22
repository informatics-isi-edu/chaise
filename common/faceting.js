(function () {
    'use strict';

    angular.module('chaise.faceting', ['plotly'])

        .directive('faceting', ['$document', function ($document) {
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/faceting.html',
                scope: {
                    vm: "="
                },
                link: function (scope, element, attr) {
                    
                    scope.isOpen = [];
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
                        if (scope.isOpen[index]) {
                            scope.isOpen[index] = false;
                        } else {
                            scope.isOpen[index] = true;
                        }
                    };
                    
                    // TODO I am attaching the removeFilter to the vm here, maybe I shouldn't?
                    scope.vm.hasFilter = function (col) {
                        return scope.hasFilter(col);
                    }

                    // TODO I am attaching the removeFilter to the vm here, maybe I shouldn't?
                    scope.vm.removeFilter = function (colId, id) {
                        scope.removeFilter(colId, id);
                    }
                    
                    scope.$on('data-modified', function ($event) {
                        console.log('data-modified in faceting');
                    })
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
                        var terms = tuples.map(function (t) {
                            return t.uniqueId;
                        });
                        var ref;
                        if (isSelected) {
                            ref = scope.facetColumn.addChoiceFilters(terms);
                        } else {
                            ref = scope.facetColumn.removeChoiceFilters(terms);
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
        
        /*
        .directive('vocabularyPicker', ['$window', function ($window) {
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/vocabulary-picker.html',
                scope: {
                    reference: "=",
                    facetColumn: "="
                },
                link: function (scope, element, attr) {
                    //TODO use this reference to get the values
                    scope.internalReference = null;
                    scope.totalCount = 54;
                    // TODO dynamic values
                    scope.values = [
                        {"value": "valued 1", "count": 12},
                        {"value": "value 2", "count": 5},
                        {"value": "value 3", "count": 4},
                    ];

                    // METHODS:
                    scope.addFilter = function (value) {
                        scope.appliedFilters[value] = {
                            "content": value
                        };
                    };

                    scope.removeFilter = function (value) {
                        delete scope.appliedFilters[value];
                    }

                    scope.toggleFilter = function (event, value) {
                        scope.isDirty = true;
                        if (event.target.checked) {
                            scope.addFilter(value);
                        } else {
                            scope.removeFilter(value);
                        }
                    };

                    scope.isSelected = function (value) {
                        return value in scope.appliedFilters;
                    };

                }
            };
        }])
        */
        
        .directive('rangePicker', ['$timeout', function ($timeout) {
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/range-picker.html',
                scope: {
                    vm: "=",
                    facetColumn: "=",
                    isOpen: "="
                },
                link: function (scope, element, attr) {
                    //TODO use this reference to get the values
                    scope.internalReference = null;
                    scope.fetched = false;

                    // mask options for time and date inputs
                    scope.maskOptions = {
                        date: {
                            maskDefinitions: {'1': /[0-1]/, '2': /[0-2]/, '3': /[0-3]/},
                            clearOnBlur: true
                        },
                        time: {
                            maskDefinitions: {'1': /[0-1]/, '2': /[0-2]/, '5': /[0-5]/},
                            clearOnBlur: true
                        }
                    };

                    // sets the date and time inputs to current date and time
                    scope.applyCurrentDatetime = function (modelVal) {
                        if (scope.isTimestamp()) {
                            return scope[modelVal] = {
                                date: moment().format('YYYY-MM-DD'),
                                time: moment().format('hh:mm:ss')
                            }
                        }
                        return scope[modelVal] = moment().format('YYYY-MM-DD');
                    };

                    // clears the date and time inputs
                    scope.clearInput = function (modelVal) {
                        if (scope.isTimestamp()) {
                            return scope[modelVal] = {date: null, time: null};
                        }
                        return scope[modelVal] = null;
                    };

                    // draw the plot
                    // TODO change the data
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

                    // scope.appliedFilterCount = Object.keys(scope.appliedFilters).length;

                    // returns a boolean to disable the add button if both min and max are not set
                    scope.disableAdd = function () {
                        return ( (scope.min == '' || scope.min == null || scope.min == undefined) && (scope.max == '' || scope.max == null || scope.max == undefined) )
                    };

                    // Add new integer filter
                    scope.addFilter = function () {
                        var min, max;
                        scope.isDirty = true;
                        // data for timestamp[tz] needs to be formatted properly
                        if (scope.isTimestamp()) {
                            min = moment(scope.min.date + scope.min.time, 'YYYY-MM-DDHH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                            max = moment(scope.max.date + scope.max.time, 'YYYY-MM-DDHH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                        } else {
                            min = scope.min;
                            max = scope.max;
                        }

                        if (min == '') min = null;
                        if (max == '') max = null;
                        var ref = scope.facetColumn.addRangeFilter(min, max);
                        scope.vm.reference = ref;
                        scope.$emit("facet-modified");
                    //     scope.appliedFilters[++scope.appliedFilterCount] = {
                    //         "content": scope.min + "-" + scope.max,
                    //         "min": scope.min,
                    //         "max": scope.max
                    //     };
                    };

                    // Gets the facet data for min/max
                    // TODO get the histogram data
                    scope.initialFacetData = function () {
                        var agg = scope.facetColumn.column.aggregate;
                        var aggregateList = [
                            agg.minAgg,
                            agg.maxAgg
                        ];

                        scope.facetColumn.sourceReference.getAggregates(aggregateList).then(function(response) {
                            console.log("Facet " + scope.facetColumn.displayname.value + " min/max: ", response);
                            if (scope.isTimestamp()) {
                                var minTs = moment(response[0]);
                                var maxTs = moment(response[1]);

                                scope.absMin = {
                                    date: minTs.format('YYYY-MM-DD'),
                                    time: minTs.format('hh:mm:ss')
                                };
                                scope.absMax = {
                                    date: maxTs.format('YYYY-MM-DD'),
                                    time: maxTs.format('hh:mm:ss')
                                };
                            } else {
                                scope.absMin = response[0];
                                scope.absMax = response[1];
                            }
                        });
                    };

                    // checks whether the type is integer (int2, int4, int8) or float (float4, float8)
                    scope.isNumeric = function () {
                        return (scope.facetColumn.column.type.name.indexOf("int") > -1 || scope.facetColumn.column.type.name.indexOf("float") > -1)
                    };

                    // checks whether the type is date
                    scope.isDate = function () {
                        return scope.facetColumn.column.type.name == 'date';
                    };

                    // checks whether the input is timestamp or timestamptz
                    scope.isTimestamp = function () {
                        return scope.facetColumn.column.type.name.indexOf('timestamp') > -1;
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

                    scope.$on("data-modified", function ($event) {
                        scope.facetColumn = scope.vm.facetColumns[scope.facetColumn.index];
                        if (scope.isOpen) {
                            scope.initialFacetData();
                        }
                    });

                    scope.$watch("isOpen", function (newVal, oldVal) {
                        console.log("Open or close: ", newVal);
                        if (newVal && !scope.fetched) {
                            scope.initialFacetData();
                        }
                    });
                }
            };
        }]);
})();
