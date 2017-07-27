(function () {
    'use strict';

    angular.module('chaise.faceting', ['plotly'])

        .directive('faceting', ['$document', function ($document) {
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/faceting.html',
                scope: {
                    reference: "=",
                    totalAppliedFilters: "=",
                    vm: "=",
                },
                link: function (scope, element, attr) {

                    //TODO dynamic
                    scope.columns = [
                        {"name": "Integer Column", "type": "int"},
                        {"name": "Vocabulary Column", "type": "vocab"},
                        {"name": "Text Column", "type": "text"},
                        {"name": "Integer Column 2", "type": "int"}
                    ];
                    scope.filters = [{}, {}, {}, {}];

                    scope.totalAppliedFilters = [];
                    scope.isDirty = [false];

                    scope.hasFilter = function (colId) {
                        return !angular.equals({}, scope.filters[colId]);
                    };

                    scope.removeFilter = function (colId, id) {
                        if (typeof colId === 'undefined') {
                            // delete all filters
                            scope.filters = [{}, {}, {}, {}];
                        } else if (typeof id === "undefined") {
                            // delete all fitler for one column
                            scope.filters[colId] = {};
                        } else {
                            // delete individual filter
                            delete scope.filters[colId][id];
                        }
                        scope.isDirty[0] = true; // fix
                    };

                    scope.updateAppliedFilters = function (colId) {
                        var filters = [], content;
                        for(var i = 0; i < scope.filters.length; i++) {
                            if (Object.keys(scope.filters[i]).length === 0) {
                                continue;
                            }
                            content = [];
                            angular.forEach(scope.filters[i], function(filter){
                                content.push(filter.content);
                            });

                            filters.push({
                                "colId": i,
                                "name": scope.columns[i].name,
                                "content": content.join(", ")
                            });
                        }
                        scope.totalAppliedFilters = filters;
                        scope.isDirty[0] = false; // fix
                    }

                    scope.vm.removeFilter = function (colId, id) {
                        scope.removeFilter(colId, id);
                        scope.updateAppliedFilters(colId);
                    }

                    scope.anyDirty = function() {
                        return scope.isDirty.some(function(val) {
                            return val;
                        });
                    }
                }
            };
        }])

        .directive('integerRangePicker', ['$timeout', function ($timeout) {
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/integer-range-picker.html',
                scope: {
                    reference: "=",
                    appliedFilters: "=",
                    isDirty: "=",
                },
                link: function (scope, element, attr) {
                    //TODO use this reference to get the values
                    scope.internalReference = null;

                    // draw the plot
                    // TODO change the data
                    scope.plot = {
                        data: [{
                            x: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                            y: [0, 5, 4, 9, 6, 6, 7, 4, 8],
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
                            }
                        }
                    }

                    scope.appliedFilterCount = Object.keys(scope.appliedFilters).length;

                    /**
                     * Add new integer filter
                     */
                    scope.addFilter = function () {
                        scope.isDirty = true;
                        scope.appliedFilters[++scope.appliedFilterCount] = {
                            "content": scope.min + "-" + scope.max,
                            "min": scope.min,
                            "max": scope.max
                        };
                    };

                    /**
                     * all the events related to the plot
                     */
                    scope.plotlyEvents = function (graph) {
                        graph.on('plotly_relayout', function (event) {
                            $timeout(function () {
                                scope.min = Math.floor(event['xaxis.range[0]']);
                                scope.max = Math.ceil(event['xaxis.range[1]']);
                            });
                        });

                    };
                }
            };
        }])

        .directive('vocabularyPicker', ['$window', function ($window) {
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/vocabulary-picker.html',
                scope: {
                    reference: "=",
                    appliedFilters: "=",
                    isDirty: "=",
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

        .directive('stringPicker', ['$window', function ($window) {
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/string-picker.html',
                scope: {
                    reference: "=",
                    appliedFilters: "=",
                    isDirty: "=",
                },
                link: function (scope, element, attr) {
                    //TODO use this reference to get the values
                    scope.internalReference = null;
                    scope.totalCount = 54;
                    // TODO dynamic values
                    scope.values = [
                        {"value": "valued 1"},
                        {"value": "value 2"},
                        {"value": "value 3"},
                    ];

                    // METHODS:
                    scope.addFilter = function () {
                        if(scope.searchKey === undefined || scope.searchKey === null || scope.searchKey.trim().length == 0) {
                            return;
                        }
                        scope.isDirty = true;
                        var value = scope.searchKey.trim();
                        scope.appliedFilters[value] = {
                            "content": value
                        };
                    };

                    scope.isSelected = function (value) {
                        return value in scope.appliedFilters;
                    };

                }
            };
        }]);
})();
