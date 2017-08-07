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
                    
                    //TODO dynamic
                    // scope.columns = scope.vm.facetColumns;

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

                    scope.vm.removeFilter = function (colId, id) {
                        scope.removeFilter(colId, id);
                        scope.updateAppliedFilters(colId);
                    }
                    
                    scope.$on('reference-updated', function (event, data) {
                        console.log('reference updated in faceting');
                    });
                }
            };
        }])

        .directive('stringPicker', ['$window', function ($window) {
            
            function updateMinMax(scope) {
                console.log('getting min and max for ' + scope.facetColumn.column.name);
                var aggregateList = [
                    scope.facetColumn.column.aggregate.minAgg,
                    scope.facetColumn.column.aggregate.maxAgg
                ];
                
                scope.facetColumn.sourceReference.getAggregates(aggregateList).then(function (res) {
                    scope.min = res[0];
                    scope.max = res[1];
                }).catch(function (err) {
                    console.log(err);
                    // throw error;
                });
            }
            
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/string-picker.html',
                scope: {
                    vm: "=",
                    facetColumn: "="
                },
                link: function (scope, element, attr) {
                    
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
                        updateMinMax(scope);
                        console.log('reference updated in string picker');
                    });
                    
                    updateMinMax(scope);
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
