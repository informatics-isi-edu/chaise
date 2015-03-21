'use strict';

/* Controllers */

var ermSideBarController = angular.module('ermSideBarController', ['facetsModel', 'facetsService']);

//angular.module('ermrestApp').controller('SideBarCtrl', ['$scope', '$timeout', 'FacetsData', 'FacetsService',
ermSideBarController.controller('SideBarCtrl', ['$scope', '$timeout', 'FacetsData', 'FacetsService', 'numberFilter',
                                                      function($scope, $timeout, FacetsData, FacetsService, numberFilter) {
	
	$scope.FacetsData = FacetsData;
	
	$scope.translate = function(value)
	{
	    return numberFilter(value);
	}
	
	this.slideFilter = function slideFilter(event, toggle, tag) {
		event.preventDefault();
		$scope.FacetsData.tag = tag;
		emptyJSON($scope.FacetsData.facetPreviousValues);
    	if ($scope.if_type($scope.FacetsData.tag, 'bigint')) {
    		$scope.FacetsData.facetPreviousValues['min'] = $scope.FacetsData.box[tag['table']][tag['name']]['min'];
    		$scope.FacetsData.facetPreviousValues['max'] = $scope.FacetsData.box[tag['table']][tag['name']]['max'];
    	} else if ($scope.if_type($scope.FacetsData.tag, 'text')) {
    		$scope.FacetsData.facetPreviousValues['value'] = $scope.FacetsData.box[tag['table']][tag['name']]['value'];
    	} else if ($scope.if_type($scope.FacetsData.tag, 'enum')) {
    		var values = {};
    		$.each($scope.FacetsData.box[tag['table']][tag['name']]['values'], function(key, value) {
    			values[key] = value;
    		});
    		$scope.FacetsData.facetPreviousValues['values'] = values;
    	}
		//alert(JSON.stringify($scope.FacetsData.box[tag['table']][tag['name']], null, 4));
		//alert(JSON.stringify($scope.FacetsData.facetPreviousValues, null, 4));
    	FacetsService.sidebarClick(toggle);
    	if (toggle == 'field-toggle') {
    		setTimeout(function () {
    			if (!$scope.$$phase) {
    				$scope.$apply();
    			}
    			$scope.$broadcast('reCalcViewDimensions');
    		}, 1000);
    	}
	};

    this.sidebarClick = function sidebarClick(event, toggle, done) {
    	event.stopPropagation();
    	FacetsService.sidebarClick(toggle);
    	if (toggle == 'field-toggle' && done) {
        	FacetsService.sidebarClick('sidebar-toggle');
    	}
	}
    
	this.preventDefault = function preventDefault(event) {
		event.preventDefault();
	};

    this.editFilterDone = function editFilterDone(event, toggle, done) {
    	event.stopPropagation();
    	if (!done) {
    		event.preventDefault();
    	}
    	if ($scope.if_type($scope.FacetsData.tag, 'bigint')) {
    		if ($scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['min'] != $scope.FacetsData.facetPreviousValues['min'] ||
    				$scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['max'] != $scope.FacetsData.facetPreviousValues['max']) {
        		$scope.delay_slider($scope.FacetsData.tag);
    		}
    	} else if ($scope.if_type($scope.FacetsData.tag, 'text')) {
    		if ($scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['value'] != $scope.FacetsData.facetPreviousValues['value']) {
        		$scope.delay_predicate($scope.FacetsData.tag, event.keyCode);
    		}
    	} else if ($scope.if_type($scope.FacetsData.tag, 'enum')) {
    		var hasChanged = false;
    		$.each($scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['values'], function(key, value) {
    			hasChanged = $scope.FacetsData.facetPreviousValues['values'][key] == null && value ||
    				$scope.FacetsData.facetPreviousValues['values'][key] != null && $scope.FacetsData.facetPreviousValues['values'][key] != value;
    		});
    		if (hasChanged) {
        		$scope.predicate_checkbox($scope.FacetsData.tag);
    		}
    	}
    	FacetsService.sidebarClick(toggle);
    	if (done) {
        	FacetsService.sidebarClick('sidebar-toggle');
    	}
	}
    
    this.removeFilter = function removeFilter(event, facet) {
    	//event.stopPropagation();
    	event.preventDefault();
    	if ($scope.if_type(facet, 'bigint')) {
    		$scope.FacetsData.box[facet['table']][facet['name']]['min'] = $scope.FacetsData.box[facet['table']][facet['name']]['floor'];
    		$scope.FacetsData.box[facet['table']][facet['name']]['max'] = $scope.FacetsData.box[facet['table']][facet['name']]['ceil'];
    	} else if ($scope.if_type(facet, 'text')) {
    		$scope.FacetsData.box[facet['table']][facet['name']]['value'] = '';
    	} else if ($scope.if_type(facet, 'enum')) {
    		var hasChanged = false;
    		$.each($scope.FacetsData.box[facet['table']][facet['name']]['values'], function(key, value) {
    			$scope.FacetsData.box[facet['table']][facet['name']]['values'][key] = false;
    		});
    	}
	}
    
    // Function from Filters

	this.displayMore = function displayMore(event) {
		event.preventDefault();
		$scope.FacetsData.moreFlag = !$scope.FacetsData.moreFlag;
	};

	this.showFacetCount = function showFacetCount(facet) {
		return ($scope.FacetsData.chooseColumns[facet['table']][facet['name']] && 
				($scope.FacetsData.box[facet['table']][facet['name']]['facetcount'] > 0 || 
						$scope.FacetsData.colsDescr[facet['table']][facet['name']]['type'] == 'enum' && hasCheckedValues($scope.FacetsData.box, facet)));
	};

	this.hide = function hide(facet) {
		return false;
	};

	this.if_type = $scope.if_type = function if_type(facet, facet_type) {
		var ret = false;
		if (facet != null && $scope.FacetsData.colsDescr[facet['table']] != null && $scope.FacetsData.colsDescr[facet['table']][facet['name']] != null) {
			ret = ($scope.FacetsData.colsDescr[facet['table']][facet['name']]['type'] == facet_type);
			if (facet_type == 'bigint') {
				ret = psqlNumeric.contains($scope.FacetsData.colsDescr[facet['table']][facet['name']]['type']);
			} else if (facet_type == 'text') {
				ret = psqlText.contains($scope.FacetsData.colsDescr[facet['table']][facet['name']]['type']);
			}
		}
		return ret;
	};

	$scope.successSearchFacets = function successSearchFacets(data, totalItems, page, pageSize) {
		FacetsService.successSearchFacets(data, totalItems, page, pageSize);
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};

	$scope.successUpdateModels = function successUpdateModels() {
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		$scope.$broadcast('reCalcViewDimensions');
	};

	$scope.predicate_slider = function predicate_slider(facet) {
		if ($scope.FacetsData.box[facet['table']][facet['name']]['min'] > $scope.FacetsData.box[facet['table']][facet['name']]['floor']) {
			$scope.FacetsData.box[facet['table']][facet['name']]['left'] = true;
		} else if ($scope.FacetsData.box[facet['table']][facet['name']]['left'] && $scope.FacetsData.box[facet['table']][facet['name']]['min'] == $scope.FacetsData.box[facet['table']][facet['name']]['floor']) {
			delete $scope.FacetsData.box[facet['table']][facet['name']]['left'];
		}
		if ($scope.FacetsData.box[facet['table']][facet['name']]['max'] < $scope.FacetsData.box[facet['table']][facet['name']]['ceil']) {
			$scope.FacetsData.box[facet['table']][facet['name']]['right'] = true;
		} else if ($scope.FacetsData.box[facet['table']][facet['name']]['right'] && $scope.FacetsData.box[facet['table']][facet['name']]['max'] == $scope.FacetsData.box[facet['table']][facet['name']]['original_ceil']) {
			delete $scope.FacetsData.box[facet['table']][facet['name']]['right'];
		}
		setFacetClass($scope.FacetsData, facet, $scope.FacetsData.facetClass);
		FacetsService.setSortOption();
		$scope.FacetsData.pagingOptions.currentPage = 1;
		getErmrestData($scope.FacetsData, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	$scope.predicate = function predicate(facet,keyCode) {
		if ($scope.FacetsData.box[facet['table']][facet['name']]['value'] == '') {
			$scope.FacetsData.facetClass[facet['table']][facet['name']] = '';
		} else {
			$scope.FacetsData.facetClass[facet['table']][facet['name']] = 'selectedFacet';
		}
		FacetsService.setSortOption();
		$scope.FacetsData.pagingOptions.currentPage = 1;
		getErmrestData($scope.FacetsData, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.delay_slider = $scope.delay_slider = function delay_slider(facet) {
		if ($scope.FacetsData.filterSliderTimeout != null) {
			$timeout.cancel($scope.FacetsData.filterSliderTimeout);
		}
		$scope.FacetsData.filterSliderTimeout = $timeout(function(){$scope.predicate_slider(facet);}, 1); // delay 1 ms
	};

	this.delay_predicate = $scope.delay_predicate = function delay_predicate(facet,keyCode) {
		if ($scope.FacetsData.filterTextTimeout != null) {
			$timeout.cancel($scope.FacetsData.filterTextTimeout);
		}
		$scope.FacetsData.filterTextTimeout = $timeout(function(){$scope.predicate(facet,keyCode);}, 1000); // delay 1000 ms
	};

	this.showFacetValue = function showFacetValue(facet, value) {
		return ($scope.FacetsData.colsGroup[facet['table']][facet['name']][value] == 0 && !$scope.FacetsData.box[facet['table']][facet['name']]['values'][value]);
	};

	this.predicate_checkbox = $scope.predicate_checkbox = function predicate_checkbox(facet) {
		setFacetClass($scope.FacetsData, facet, $scope.FacetsData.facetClass);
		FacetsService.setSortOption();
		$scope.FacetsData.pagingOptions.currentPage = 1;
		getErmrestData($scope.FacetsData, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.expandCollapse = function expandCollapse(data, show) {
		data.expand = !data.expand;
		data.show = show;
	};

	$scope.initTable = function initTable() {
    	FacetsService.initTable();
	};

	$scope.initSortOption = function initSortOption() {
		$.each($scope.FacetsData.colsDefs, function(i, col) {
			if (isSortable($scope.FacetsData.table, col.field)) {
				$scope.FacetsData.sortColumns.push(col.field);
			}
		});
	};
	
	$scope.successUpdateCount = function successUpdateCount() {
		$scope.FacetsData.ready = true;
		$('footer').show();
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		//console.log(JSON.stringify($scope.options, null, 4));
	};

	$scope.successInitModels = function successInitModels() {
		updateCount($scope.FacetsData, $scope.successUpdateCount);
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};

	$scope.successGetColumnDescriptions = function successGetColumnDescriptions(data, textStatus, jqXHR) {
		initModels($scope.FacetsData, $scope.successInitModels);
	};

	$scope.successGetErmrestData = function successGetErmrestData(data, totalItems, page, pageSize) {
		if (page == 1) {
			$scope.FacetsData.ermrestData = data;
		} else {
			$scope.FacetsData.ermrestData = $scope.FacetsData.ermrestData.concat(data);
		}
		$scope.FacetsData.totalServerItems = totalItems;
		$scope.FacetsData.collectionsPredicate = getCollectionsPredicate($scope.FacetsData.entityPredicates, $scope.FacetsData);
		if ($scope.FacetsData.selectedEntity != null) {
			$scope.FacetsData.selectedEntity['count'] = totalItems;
		}
		$scope.FacetsData.maxPages = Math.floor($scope.FacetsData.totalServerItems/$scope.FacetsData.pagingOptions.pageSize);
		if ($scope.FacetsData.totalServerItems%$scope.FacetsData.pagingOptions.pageSize != 0) {
			$scope.FacetsData.maxPages++;
		}
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		$('div.ngSortButtonUp').addClass('ng-hide');
		getColumnDescriptions($scope.FacetsData, $scope.successGetColumnDescriptions);
	};

	$scope.successGetTableColumnsUniques = function successGetTableColumnsUniques() {
		//alert(JSON.stringify($scope.score, null, 4));
		FacetsService.setSortOption();
		getErmrestData($scope.FacetsData, $scope.successGetErmrestData, $scope.successUpdateModels);
	};

	$scope.successGetTableColumns = function successGetTableColumns(columns) {
		$scope.FacetsData['facets'] = columns['facets'];
		$scope.FacetsData['colsDefs'] = columns['colsDefs'];
		$scope.initSortOption();
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		getTableColumnsUniques($scope.FacetsData, $scope.successGetTableColumnsUniques);
	};
	
	$scope.successGetMetadata = function successGetMetadata(data, textStatus, jqXHR) {
		$scope.FacetsData['metadata'] = data;
		getTableColumns($scope.FacetsData, $scope.successGetTableColumns);
	};
	
	this.getEntityResults = function getEntityResults(event, data) {
		var isNewSchema = (SCHEMA != data.schema);
		if (isNewSchema) {
			initSchema(data.schema);
		}
		var peviousTable = $scope.FacetsData.table;
		var node = $('label.highlighted', $('#treeDiv'));
		var isNew = (node.length == 0 || node[0] !== event.target);
		if (isNew) {
			$("#attrsort span.glyphicon").removeClass("glyphicon-sort-by-attributes-alt").addClass("glyphicon-sort-by-attributes");
		}
		if (data.level != -1 && isNew) {
			$('#headerSearch').removeAttr('disabled');
			collapseTree($scope.FacetsData.tree[0], data);
			$('label', $('#treeDiv')).removeClass('highlighted');
			$(event.target).addClass('highlighted');
			var newBranch = false;
			if (!isNewSchema && data.level > 0 && $scope.FacetsData.level >= 0) {
				var oldRoot = null;
				if ($scope.FacetsData.level > 0) {
					var oldRootParent = $scope.FacetsData.selectedEntity.parent;
					while (oldRootParent.parent != null) {
						oldRootParent = oldRootParent.parent;
					}
					oldRoot = oldRootParent.name;
				} else {
					oldRoot = $scope.FacetsData.selectedEntity.name;
				}
				var newRootParent = data.parent;
				while (newRootParent.parent != null) {
					newRootParent = newRootParent.parent;
				}
				if ((oldRoot != null || $scope.FacetsData.entityPredicates.length == 0) && newRootParent.name != oldRoot) {
					$scope.FacetsData.level = 0;
					$scope.FacetsData.entityPredicates.length = 1;
					$scope.FacetsData.entityPredicates[0] = encodeSafeURIComponent(newRootParent.name);
					newBranch = true;
				}
			}
			$scope.FacetsData.selectedEntity = data;
			$scope.FacetsData.table = data.name;
			if (data.level == 0 || isNewSchema) {
				resetTreeCount(data);
				$scope.FacetsData.entityPredicates.length = 0;
				if (isNewSchema && data.level > 0) {
					var node = data.parent;
					for (var i=data.level-1; i>=0; i--) {
						$scope.FacetsData.entityPredicates[i] = encodeSafeURIComponent(node.name);
						node = node.parent;
					}
				}
				$scope.FacetsData.entityPredicates.push(encodeSafeURIComponent($scope.FacetsData.table));
				$scope.FacetsData.level = data.level;
				updateTreeCount(data, $scope.FacetsData.entityPredicates);
				$scope.initTable();
				getMetadata(data.name, $scope.successGetMetadata);
			} else if (data.level > $scope.FacetsData.level) {
				$scope.FacetsData.entityPredicates.length = data.level+1;
				$scope.FacetsData.entityPredicates[data.level] = encodeSafeURIComponent(data.name);
				if (!newBranch) {
					var predicate = getPredicate($scope.FacetsData, null, null, peviousTable);
					if (predicate.length > 0) {
						$scope.FacetsData.entityPredicates[$scope.FacetsData.level] += '/' + predicate.join('/');
					}
				}
				var node = data.parent;
				for (var i=data.level-1; i>$scope.FacetsData.level; i--) {
					$scope.FacetsData.entityPredicates[i] = encodeSafeURIComponent(node.name);
					node = node.parent;
				}
				updateTreeCount(data, $scope.FacetsData.entityPredicates);
				$scope.FacetsData.level = data.level;
				$scope.initTable();
				getMetadata(data.name, $scope.successGetMetadata);
			} else if (data.level < $scope.FacetsData.level) {
				resetTreeCount(data);
				$scope.FacetsData.entityPredicates.length = data.level+1;
				$scope.FacetsData.entityPredicates[data.level] = encodeSafeURIComponent(data.name);
				updateTreeCount(data, $scope.FacetsData.entityPredicates);
				$scope.FacetsData.level = data.level;
				$scope.initTable();
				getMetadata(data.name, $scope.successGetMetadata);
			} else if (data.level == $scope.FacetsData.level) {
				$scope.FacetsData.entityPredicates[data.level] = encodeSafeURIComponent(data.name);
				updateTreeCount(data, $scope.FacetsData.entityPredicates);
				$scope.FacetsData.level = data.level;
				$scope.initTable();
				getMetadata(data.name, $scope.successGetMetadata);
			}
		}
	};
	
	this.displayTreeCount = function displayTreeCount(data) {
		var ret = '';
		if (data.count > 0) {
			ret = '(' + data.count + ')';
		}
		return ret;
	};

	this.setListClass = function setListClass(facet) {
		var value = $scope.FacetsData.box[facet['table']][facet['name']];
		var values = [];
		$.each(value['values'], function(checkbox_key, checkbox_value) {
			if (checkbox_value) {
				values.push(checkbox_value);
			}
		});
		return (values.length > 1) ? 'multi_values' : 'single_value';
	};
	
	this.getFacetValues = $scope.getFacetValues = function getFacetValues(facet) {
		var value = $scope.FacetsData.box[facet['table']][facet['name']];
		var values = [];
		$.each(value['values'], function(checkbox_key, checkbox_value) {
			if (checkbox_value) {
				values.push(checkbox_key);
			}
		});
		return values;
	};
	
	this.displayTitle = function displayTitle(facet) {
		var values = $scope.getFacetValues(facet);
		var ret = '';
		$.each(values, function(i, value) {
			if (i > 0) {
				ret += ', ';
			}
			ret += value;
		});
		return ret;
	};
	
	this.checkedFilter = function checkedFilter(event) {
		//var target = $(event.target).parent();
		//target[0].classList.toggle('disabled');
		//target.prev()[0].classList.toggle('toggler--is-active');
		//target.next()[0].classList.toggle('toggler--is-active');
	};
	
	this.getFilterClass = function getFilterClass(facet, value) {
		var model = $scope.FacetsData.box[facet['table']][facet['name']]['values'][value];
		var ret = 'toggler';
		if (model == null || !model) {
			ret += ' toggler--is-active';
		}
		return ret;
	};
	
	this.getFieldSwitchClass = function getFieldSwitchClass(facet, value) {
		var model = $scope.FacetsData.box[facet['table']][facet['name']]['values'][value];
		var ret = 'toggle';
		if (model == null || !model) {
			ret += ' disabled';
		}
		return ret;
	};
	
	this.getFieldValueClass = function getFieldValueClass(facet, value) {
		var model = $scope.FacetsData.box[facet['table']][facet['name']]['values'][value];
		var ret = 'toggler';
		if (model != null && model) {
			ret += ' toggler--is-active';
		}
		return ret;
	};
	
	this.getMoreFilterClass = function getMoreFilterClass(facet) {
		var model = $scope.FacetsData.chooseColumns[facet['table']][facet['name']];
		var ret = 'toggler';
		if (!model) {
			ret += ' toggler--is-active';
		}
		return ret;
	};
	
	this.getMoreFieldSwitchClass = function getMoreFieldSwitchClass(facet) {
		var model = $scope.FacetsData.chooseColumns[facet['table']][facet['name']];
		var ret = 'toggle';
		if (!model) {
			ret += ' disabled';
		}
		return ret;
	};
	
	this.getMoreFieldValueClass = function getMoreFieldValueClass(facet) {
		var model = $scope.FacetsData.chooseColumns[facet['table']][facet['name']];
		var ret = 'toggler';
		if (model) {
			ret += ' toggler--is-active';
		}
		return ret;
	};
	
	this.getEnabledFilters = function getEnabledFilters() {
		var ret = 0;
		$.each($scope.FacetsData.facets, function(i, facet) {
			if ($scope.FacetsData.chooseColumns[facet['table']][facet['name']]) {
				ret++;
			}
		});
		return ret;
	};
	
    this.editMoreFilterDone = function editMoreFilterDone(event, toggle) {
    	event.stopPropagation();
		event.preventDefault();
    	FacetsService.sidebarClick(toggle);
	}
    
	this.slideMoreFilter = function slideMoreFilter(event, toggle) {
		event.preventDefault();
		event.preventDefault();
    	FacetsService.sidebarClick(toggle);
	};

}]);
