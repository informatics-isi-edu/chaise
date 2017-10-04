/*
    The MIT License (MIT)
    Copyright (c) 2014 Alon Horev

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software
    and associated documentation files (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
    and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
    LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
    OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
(function () {
    'use strict';
    angular.module('plotly', []).directive('plotly', [
        '$window',
        function ($window) {
            return {
                restrict: 'E',
                template: '<div></div>',
                scope: {
                    plotlyData: '=',
                    plotlyLayout: '=',
                    plotlyOptions: '=',
                    plotlyEvents: '=',
                    plotlyManualDataUpdate: '='
                },
                link: function (scope, element) {
                    var graph = element[0].children[0];
                    var initialized = false;

                    function subscribeToEvents(graph) {
                        scope.plotlyEvents(graph);
                    }

                    function onUpdate() {
                        //No data yet, or clearing out old data
                        if (!(scope.plotlyData)) {
                            if (initialized) {
                                Plotly.Plots.purge(graph);
                                graph.innerHTML = '';
                            }
                            return;
                        }
                        //If this is the first run with data, initialize
                        if (!initialized) {
                            initialized = true;
                            Plotly.newPlot(graph, scope.plotlyData, scope.plotlyLayout, scope.plotlyOptions);
                            if (scope.plotlyEvents) {
                                subscribeToEvents(graph);
                            }
                        }
                        graph.layout = scope.plotlyLayout;
                        graph.data = scope.plotlyData;
                        Plotly.redraw(graph);
                        Plotly.Plots.resize(graph);
                    }

                    function onResize() {
                        if (!(initialized && scope.plotlyData)) return;
                        Plotly.Plots.resize(graph);
                    }

                    scope.$watch(
                        function (scope) {
                            return scope.plotlyLayout;
                        },
                        function (newValue, oldValue) {
                            if (angular.equals(newValue, oldValue) && initialized) return;
                            onUpdate();
                        }, true);

                    if (!scope.plotlyManualDataUpdate) {
                        scope.$watch(
                            function (scope) {
                                return scope.plotlyData;
                            },
                            function (newValue, oldValue) {
                                if (angular.equals(newValue, oldValue) && initialized) return;
                                onUpdate();
                            }, true);
                    }

                    /**
                     * Listens to 'tracesUpdated' event broadcasted from controller to update plot.
                     */
                    scope.$on('tracesUpdated', function () {
                        onUpdate();
                    });

                    scope.$watch(function () {
                        return {
                            'h': graph.offsetHeight,
                            'w': graph.offsetWidth
                        };
                    }, function (newValue, oldValue) {
                        if (angular.equals(newValue, oldValue)) return;
                        onResize();
                    }, true);

                    angular.element($window).bind('resize', onResize);
                }
            };
        }
    ]);
})();