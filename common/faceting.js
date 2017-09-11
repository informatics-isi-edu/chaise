(function () {
    'use strict';

    angular.module('chaise.faceting', ['plotly'])

        .directive('faceting', ['recordTableUtils', '$timeout', function (recordTableUtils, $timeout) {
            
            return {
                restrict: 'AE',
                templateUrl: '../common/templates/faceting/faceting.html',
                scope: {
                    vm: "="
                },
                controller: ['$scope', function ($scope) {
                    var ctrl = this;
                    
                    ctrl.childCtrls = []; // child controllers
                    
                    // register a children controller in here
                    ctrl.register = function (childCtrl, facetColumn, index) {
                        ctrl.childCtrls[index] = childCtrl;
                        
                        //TODO this should be changed for openning facets when we load the page
                        $scope.vm.facetModels[index] = {
                            initialized: false,
                            isOpen: false,
                            isLoading: false,
                            processed: true,
                            updateFacet: childCtrl.updateFacet
                        };
                        
                        if (facetColumn.filters.length > 0) {
                            $scope.vm.openFacet(index);
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
                        recordTableUtils.updatePage($scope);
                    };
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
                            
                            scope.vm.search = null;
                            if (scope.vm.reference.location.searchTerm) {
                                newRef = newRef.search();
                            }
                            
                        } else if (typeof filterIndex === "undefined") {
                            // delete all fitler for one column
                            newRef = col.removeAllFilters();
                        } else {
                            // delete individual filter
                            newRef = col.removeFilter(filterIndex);
                        }
                        scope.updateReference(newRef, -1);
                    };
                    
                    /**
                     * open or close the facet given its index
                     * @param  {int} index index of facet
                     */
                    scope.toggleFacet = function (index) {
                        var fm = scope.vm.facetModels[index];
                        
                        // toggle the isOpen booelan
                        fm.isOpen = !fm.isOpen;
                        
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
                    };
                    
                    /**
                     * Open the facet by clicking on its header
                     * //TODO change be changed to use the index
                     * @param  {FacetColumn} fc the facet column
                     */
                    scope.vm.openFacet = function (index) {
                        var el = document.getElementById('ft-heading-1-' + index);
                        var container = document.getElementsByClassName('faceting-container')[0];
                        $timeout(function() {
                            container.scrollTop = el.offsetTop - 50;
                            if (!scope.vm.facetModels[index].isOpen) {
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
                    
                }
            };
        }])

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
                    
                    /**
                     * update the current parent
                     * @param  {boolean} callParent if true, will call the updateFacets in faceting directive
                     */
                    ctrl.updateFacet = function () {
                        if (!$scope.facetModel.initialized) {
                            $scope.initialRows();
                        } else {
                            $scope.syncSelected();
                        }
                        return $scope.updateFacetData();
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
                        scope.parentCtrl.updateVMReference(res.reference, scope.index);
                    };

                    // Add new integer filter, used as the callback function to range-inputs
                    scope.addFilter = function (min, max) {
                        var res = scope.facetColumn.addRangeFilter(min, max);
                        if (!res) return;

                        var rowIndex = scope.ranges.findIndex(function (obj) {
                            return obj.uniqueId == res.filter.uniqueId;
                        });
                        
                        if (rowIndex === -1) {
                            //we should create a new filter
                            scope.ranges.push(createChoiceDisplay(res.filter, true));
                        } else {
                            // filter already exists, we should just change it to selected
                            scope.ranges[rowIndex].selected = true;
                        }
                        
                        scope.parentCtrl.updateVMReference(res.reference, scope.index);
                    };

                    // Look at the filters available for the facet and add rows to represent the preset filters
                    scope.initialRows = function () {
                        scope.ranges = [];
                        
                        for (var i = 0; i < scope.facetColumn.rangeFilters.length; i++) {
                            var filter = scope.facetColumn.rangeFilters[i];

                            var rowIndex = scope.ranges.findIndex(function (obj) {
                                return obj.uniqueId == filter.uniqueId;
                            });

                            // if the row is not in the set of choices, add it
                            if (rowIndex == -1) {
                                scope.ranges.push(createChoiceDisplay(filter, true));
                            }
                        }
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
                                
                                    console.log("Facet " + scope.facetColumn.displayname.value + " min/max: ", response);
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
            
            // TODO right now I am keeping multiple boolean 
            // it can be in a single object! (facetModel)
            
            function updateFacetColumn(scope, callParent) {
                var defer = $q.defer();
                
                console.log("updating FACET: " + scope.index);
                
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
                
                // get the list of applied filters
                var currentValues;
                var alreadyAppliedRows = function () {
                    currentValues = {};
                    return scope.facetColumn.choiceFilters.map(function(f) {
                        currentValues[f.uniqueId] = true;
                        return {
                            selected: true, displayname: f.displayname, 
                            uniqueId: f.uniqueId, data: {value: f.term}
                        }; // what about the count? do we want to read or not?
                    });
                }
                
                var appliedLen = scope.facetColumn.choiceFilters.length;
                if (appliedLen >= tableConstants.PAGE_SIZE) {
                    scope.checkboxRows = alreadyAppliedRows();
                    defer.resolve(true);
                } else {
                    // read new data if neede                
                    (function (uri) {
                        scope.reference.read(appliedLen + tableConstants.PAGE_SIZE).then(function (page) {
                            // if this is not the result of latest facet change
                            if (scope.reference.uri !== uri) {
                                defer.resolve(false);
                            } else {
                                scope.checkboxRows = alreadyAppliedRows();
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
                                    
                                    if (!(value in currentValues)) {
                                        currentValues[value] = true;
                                        scope.checkboxRows.push({
                                            selected: false,
                                            displayname: tuple.displayname,
                                            uniqueId: value,
                                            data: {value: value}
                                        });
                                    }
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
                    
                    ctrl.updateFacet = function () {
                        return updateFacetColumn($scope);
                    }
                }],
                require: ['^faceting', 'choicePicker'],
                link: function (scope, element, attr, ctrls) {
                    var parentCtrl = ctrls[0],
                        currentCtrl = ctrls[1];
                    
                    // register this controller in the parent
                    parentCtrl.register(currentCtrl, scope.facetColumn, scope.index);
                    scope.parentCtrl = parentCtrl;

                    scope.openSearchPopup = function() {
                        var params = {};
                        // TODO since emrest cnt has bug, we should not sort based on count
                        params.reference = scope.reference;
                        if (!scope.facetColumn.isEntityMode) {
                            params.reference = params.reference.sort([{
                                "column": "value", "descending": false
                            }]); 
                        }
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
                            size: "xl",
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
                            scope.parentCtrl.setInitialized();
                            scope.parentCtrl.updateVMReference(ref, -1);
                        });
                    }

                    scope.onRowClick = function(row, $event) {
                        var ref;
                        if (row.selected) {
                            console.log('selected!');
                            ref = scope.facetColumn.addChoiceFilters([{
                                value: row.uniqueId,
                                displayvalue: row.displayname.value,
                                isHTML: row.displayname.isHTML
                            }]);
                        } else {
                            console.log('unselected!');
                            ref = scope.facetColumn.removeChoiceFilters([row.uniqueId]);
                        }
                        
                        if (!scope.parentCtrl.updateVMReference(ref, scope.index)) {
                            row.selected = !row.selected;
                            $event.preventDefault();
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
                    }

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
                        var findMoreHeight = 30;
                        if (newVal) {
                            $timeout(function () {
                                var choicePickerElem = element[0].getElementsByClassName("choice-picker")[0];
                                var addedHeight = choicePickerElem.scrollHeight;
                                // if the load more text link isn't present, save some space for it
                                if (!scope.hasMore) addedHeight += findMoreHeight;
                                choicePickerElem.style.height = addedHeight + "px";
                            }, 0);
                        } else if (newVal == false) {
                            var choicePickerElem = element[0].getElementsByClassName("choice-picker")[0];
                            choicePickerElem.style.height = "";
                        }
                    })
                }
            };
            
        }]);
})();
