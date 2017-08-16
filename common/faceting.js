(function () {
    'use strict';

    angular.module('chaise.faceting', ['plotly'])

        .directive('faceting', ['$document', function ($document) {
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/faceting.html',
                scope: {
                    vm: "=",
                },
                link: function (scope, element, attr) {
                    
                    scope.isOpen = [];
                    scope.hasFilter = function (col) {
                        if (typeof col === 'undefined') {
                            return scope.vm.reference.location.facets !== null; //TODO
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
                        scope.$emit("reference-updated");
                    };
                    
                    scope.toggleFacet = function (index) {
                        if (scope.isOpen[index]) {
                            scope.isOpen[index] = false;
                        } else {
                            scope.isOpen[index] = true;
                        }
                    };

                    // TODO I am attaching the removeFilter to the vm here, maybe I shouldn't?
                    scope.vm.removeFilter = function (colId, id) {
                        scope.removeFilter(colId, id);
                    }
                    
                    // scope.$on('reference-updated', function (event, data) {
                    //     scope.$broadcast('reference-updated');
                    //     console.log('reference updated in faceting');
                    // });
                }
            };
        }])

        .directive('stringPicker', ['$window', 'DataUtils', function ($window, DataUtils) {
            
            function updateFacetColumn(scope) {
                scope.domainRef = scope.facetColumn.column.groupAggregate.entityCounts;
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
                    
                    scope.fetched = false;
                    scope.loading = true;
                    
                    scope.domainRef = scope.facetColumn.column.groupAggregate.entityCounts;
                    scope.domainModel = {
                        hasLoaded: !scope.loading,
                        tableDisplayName: null, //TODO
                        reference: scope.domainRef,
                        columns: scope.domainRef.columns,
                        enableAutoSearch: true,
                        enableSort: true,
                        page: null,
                        sortby: null,
                        sortOrder: null,
                        rowValues: [],
                        selectedRows: [],
                        pageLimit: 5,
                        config: {viewable: false, editable: false, deletable: false, selectMode: "multi-select"}
                    };
                    
                    // this should be part of recordset directive to do it by default if the page is not defined
                    var fetchRecords = function() {
                        // TODO this should not be a hardcoded value, either need a pageInfo object across apps or part of user settings
                        scope.loading = true;
                        console.log('reading: ');
                        console.log(scope.domainRef.uri);
                        scope.domainRef.read(5).then(function getPseudoData(page) {
                            scope.domainModel.hasLoaded = true;
                            scope.domainModel.initialized = true;
                            scope.domainModel.page = page;
                            scope.domainModel.rowValues = DataUtils.getRowValuesFromPage(page);
                            scope.fetched = true;
                            scope.loading = false;
                            // $scope.$broadcast('recordset-update');
                        }, function(exception) {
                            scope.loading = false;
                            throw exception;
                        });
                    }
                    
                    
                    // METHODS:
                    scope.addFilter = function () {
                        if(scope.searchKey === undefined || scope.searchKey === null || scope.searchKey.trim().length == 0) {
                            return;
                        }
                        var value = scope.searchKey.trim();
                        
                        scope.vm.reference = scope.facetColumn.addSearchFilter(value);
                        scope.$emit("reference-updated");
                    };
                    
                    scope.$on('reference-updated', function (event, data) {
                        console.log('reference updated in string picker for ' + scope.facetColumn.column.name);
                        updateFacetColumn(scope);
                        scope.fetched = false;
                    });
                    
                    scope.$watch("isOpen", function (newVal, oldVal) {
                        console.log('opened!!!!');
                        if (newVal && !scope.fetched) {
                            fetchRecords();
                        }
                    });   
                }
            };
        }]);
        
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
        
        .directive('integerRangePicker', ['$timeout', function ($timeout) {
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/integer-range-picker.html',
                scope: {
                    vm: "=",
                    facetColumn: "=",
                },
                link: function (scope, element, attr) {
                    //TODO use this reference to get the values
                    scope.internalReference = null;

                    // draw the plot
                    // TODO change the data
                    scope.plot = {
                        data: [{
                            x: ["0-1", "1-2", "3-4", "5-6", "6-7", "7-8", "8-9"],
                            y: [5, 10, 12, 4, 11, 4, 58],
                            type: 'bar'
                        }],
                        options: {
                            displayLogo: false
                        },
                        layout: {
                            autosize: false,
                            width: 400,
                            height: 150,
                            margin: {
                                l: 15,
                                r: 10,
                                b: 20,
                                t: 20,
                                pad: 2
                            },
                            yaxis: {
                                fixedrange: true
                            },
                            bargap: 0
                        }
                    }

                    // scope.appliedFilterCount = Object.keys(scope.appliedFilters).length;

                    // Add new integer filter
                    scope.addFilter = function () {
                    //     scope.isDirty = true;
                    //     scope.appliedFilters[++scope.appliedFilterCount] = {
                    //         "content": scope.min + "-" + scope.max,
                    //         "min": scope.min,
                    //         "max": scope.max
                    //     };
                    };

                    //  all the events related to the plot
                    scope.plotlyEvents = function (graph) {
                        graph.on('plotly_relayout', function (event) {
                            $timeout(function () {
                                scope.min = Math.floor(event['xaxis.range[0]']);
                                scope.max = Math.ceil(event['xaxis.range[1]']);
                            });
                        });

                    };
                    
                    scope.$on('reference-updated', function (event, data) {
                        console.log('reference updated in integer picker');
                    });
                }
            };
        }])
                
        */
})();
