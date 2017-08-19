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
            
            function updateFacetColumn(scope) {
                console.log(scope.facetColumn.displayname.value + ": updating domainRef");
                scope.selectDomainRef = scope.facetColumn.column.groupAggregate.entityCounts;
                scope.selectedRows = [];
                // TODO when you load the page, how can I set the selectedRows??
                // scope.selectedRows = scope.facetColumn.choiceFilters.map(function (f) { 
                //     return {
                //         displayname: f.toString(), 
                //         key: f.term
                //     };
                // });
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
                    
                    scope.selectFetched = false;
                    
                    updateFacetColumn(scope);
                    scope.selectDomainModel = {
                        hasLoaded: !scope.loading,
                        tableDisplayName: null, //TODO
                        reference: scope.selectDomainRef,
                        columns: scope.selectDomainRef.columns,
                        enableAutoSearch: true,
                        enableSort: true,
                        page: null,
                        sortby: "c1",
                        sortOrder: "asc",
                        rowValues: [],
                        selectedRows: scope.selectedRows,
                        pageLimit: 5,
                        config: {
                            viewable: false, editable: false, deletable: false, selectMode: "multi-select",
                            hideTotalCount: true, hideSelectedRows: true
                        }
                    };
                    
                    // this should be part of recordset directive to do it by default if the page is not defined
                    var fetchRecords = function() {
                        scope.loading = true;
                        console.log(scope.facetColumn.displayname.value + ": fetching " + scope.selectDomainRef.uri);
                        scope.selectDomainRef.read(5).then(function getPseudoData(page) {
                            
                            scope.selectDomainModel.hasLoaded = true;
                            scope.selectDomainModel.initialized = true;
                            scope.selectDomainModel.page = page;
                            scope.selectDomainModel.rowValues = DataUtils.getRowValuesFromPage(page);
                            
                            scope.selectFetched = true;
                        }, function(exception) {
                            throw exception;
                        });
                    }
                    
                    // METHODS:
                    scope.changeFilters = function (tuples, isSelected) {
                        var ref;
                        var terms = tuples.map(function (t) {
                            return t.uniqueId;
                        });
                        if (isSelected) {
                            ref = scope.facetColumn.addChoiceFilters(terms);
                        } else {
                            ref = scope.facetColumn.removeChoiceFilters(terms);
                        }
                        
                        scope.vm.reference = ref;
                        scope.$emit("facet-modified");
                    };
                    
                    scope.addSearchFilter = function (term) {
                        scope.vm.reference = scope.facetColumn.addSearchFilter(term);
                    }
                    
                    scope.$on('data-modified', function ($event) {
                        //TODO fix this
                        scope.facetColumn = scope.vm.facetColumns[scope.facetColumn.index];
                        
                        console.log('data-modified in facet');
                        updateFacetColumn(scope);
                        scope.selectFetched = false;
                        if (scope.isOpen) {
                            fetchRecords();
                        }
                    });
                    
                    scope.$watch("isOpen", function (newVal, oldVal) {
                        if (newVal && !scope.fetched) {
                            console.log(scope.facetColumn.displayname.value + ": opened!");
                            fetchRecords();
                        }
                    });   
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
        
        .directive('integerRangePicker', ['$timeout', function ($timeout) {
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/integer-range-picker.html',
                scope: {
                    vm: "=",
                    facetColumn: "=",
                    isOpen: "="
                },
                link: function (scope, element, attr) {
                    //TODO use this reference to get the values
                    scope.internalReference = null;
                    scope.fetched = false;

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

                    // Add new integer filter
                    scope.addFilter = function () {
                        scope.isDirty = true;
                        var ref = scope.facetColumn.addRangeFilter(scope.min, scope.max);
                        scope.vm.reference = ref;
                        scope.$emit("facet-modified");
                    //     scope.appliedFilters[++scope.appliedFilterCount] = {
                    //         "content": scope.min + "-" + scope.max,
                    //         "min": scope.min,
                    //         "max": scope.max
                    //     };
                    };

                    scope.initialFacetData = function () {
                        var agg = scope.facetColumn.column.aggregate;
                        var aggregateList = [
                            agg.minAgg,
                            agg.maxAgg
                        ];

                        scope.facetColumn.sourceReference.getAggregates(aggregateList).then(function(response) {
                            console.log("Facet " + scope.facetColumn.displayname.value + " min/max: ", response);
                            scope.absMin = response[0];
                            scope.absMax = response[1];
                        });
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
