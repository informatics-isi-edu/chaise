'use strict';

/* Controllers */

var ermFilterController = angular.module('ermFilterController', ['facetsModel', 'facetsService']);

//angular.module('ermrestApp').controller('FilterListCtrl', ['$scope', '$timeout', 'FacetsData', 'FacetsService',
ermFilterController.controller('FilterListCtrl', ['$scope', '$timeout', 'FacetsData', 'FacetsService',
                                                      function($scope, $timeout, FacetsData, FacetsService) {
	
	$scope.FacetsData = FacetsData;
	
	$scope.$watch('FacetsData.filterOptions', function (newVal, oldVal) {
		if ($scope.FacetsData.ready && newVal !== oldVal) {
			$scope.FacetsData.pagingOptions.currentPage = 1;
			$scope.getPagedDataAsync($scope.FacetsData.pagingOptions.pageSize, $scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.filterOptions.filterText, $scope.FacetsData.sortInfo);
		}
	}, true);
	
	$scope.$watch('FacetsData.pagingOptions', function (newVal, oldVal) {
		if ($scope.FacetsData.ready && newVal !== oldVal && 
				(newVal.currentPage !== oldVal.currentPage || newVal.pageSize !== oldVal.pageSize)) {
			$scope.getPagedDataAsync($scope.FacetsData.pagingOptions.pageSize, $scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.filterOptions.filterText, $scope.FacetsData.sortInfo);
		}
	}, true);
	
	$scope.$watch('FacetsData.sortInfo', function (newVal, oldVal) {
		if ($scope.FacetsData.ready && newVal !== oldVal) {
			if ($scope.FacetsData['sortInfo']['fields'].length > 1) {
				$('div.ngSortButtonUp').addClass('ng-hide');
			}
			$scope.FacetsData.pagingOptions.currentPage = 1;
			$scope.getPagedDataAsync($scope.FacetsData.pagingOptions.pageSize, $scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.filterOptions.filterText, newVal);
		}
	}, true);

	$scope.getPagedDataAsync = function (pageSize, page, searchText, sortOption) {
		setTimeout(function () {
			if (sortOption != null && sortOption['fields'].length > 1) {
				sortOption = null;
			}
			$scope.FacetsData['sortOption'] = sortOption;
			if (searchText) {
				getPage($scope.FacetsData, $scope.FacetsData.totalServerItems, $scope.setPagingData);
			} else {
				getPage($scope.FacetsData, $scope.FacetsData.totalServerItems, $scope.setPagingData);
			}
		}, 100);
	};

	$scope.initPageRange = function () {
    	FacetsService.initPageRange();
	}
	
	$scope.initSortOption = function initSortOption() {
		$.each($scope.FacetsData.colsDefs, function(i, col) {
			if (isSortable($scope.FacetsData.table, col.field)) {
				$scope.FacetsData.sortColumns.push(col.field);
			}
		});
	};
	
	$scope.initTable = function initTable() {
    	FacetsService.initTable();
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

	$scope.setPagingData = function(data, totalItems, page, pageSize){	
		if (page == 1) {
			$scope.FacetsData.ermrestData = data;
		} else {
			$scope.FacetsData.ermrestData = $scope.FacetsData.ermrestData.concat(data);
		}
		$scope.FacetsData.collectionsPredicate = getCollectionsPredicate($scope.FacetsData.entityPredicates, $scope.FacetsData);
		$scope.FacetsData.totalServerItems = totalItems;
		$scope.FacetsData.maxPages = Math.floor($scope.FacetsData.totalServerItems/$scope.FacetsData.pagingOptions.pageSize);
		if ($scope.FacetsData.totalServerItems%$scope.FacetsData.pagingOptions.pageSize != 0) {
			$scope.FacetsData.maxPages++;
		}
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

	$scope.successGetMetadata = function successGetMetadata(data, textStatus, jqXHR) {
		$scope.FacetsData['metadata'] = data;
		getTableColumns($scope.FacetsData, $scope.successGetTableColumns);
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
	
	$scope.successGetTableColumnsUniques = function successGetTableColumnsUniques() {
		//alert(JSON.stringify($scope.score, null, 4));
		FacetsService.setSortOption();
		getErmrestData($scope.FacetsData, $scope.successGetErmrestData, $scope.successUpdateModels);
	};

	$scope.successGetTables = function successGetTables() {
		$('#headerSearch').attr('disabled', 'disabled');
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		selectCollection();
	};

	$scope.successInitModels = function successInitModels() {
		updateCount($scope.FacetsData, $scope.successUpdateCount);
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};

	$scope.successSearchFacets = function successSearchFacets(data, totalItems, page, pageSize) {
		FacetsService.successSearchFacets(data, totalItems, page, pageSize);
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};

	$scope.successUpdateCount = function successUpdateCount() {
		$scope.FacetsData.ready = true;
		$('footer').show();
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		//console.log(JSON.stringify($scope.options, null, 4));
	};

	$scope.successUpdateModels = function successUpdateModels() {
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		$scope.$broadcast('reCalcViewDimensions');
	};

	this.changeSortDirection = function changeSortDirection(event) {
		event.preventDefault();
		if ($scope.FacetsData.sortInfo.fields.length == 1) {
			$scope.FacetsData.sortInfo.directions.length = 1;
			if ($scope.FacetsData.sortDirection == $scope.FacetsData.sortDirectionOptions[0]) {
				$scope.FacetsData.sortDirection = $scope.FacetsData.sortDirectionOptions[1];
			} else {
				$scope.FacetsData.sortDirection = $scope.FacetsData.sortDirectionOptions[0];
			}
			$scope.FacetsData.sortInfo.directions[0] = $scope.FacetsData.sortDirection;
		}
	};

	this.changeSortOption = function changeSortOption() {
		$scope.FacetsData.sortInfo.fields.length = 1;
		$scope.FacetsData.sortInfo.directions.length = 1;
		$scope.FacetsData.sortInfo.fields[0] = $scope.FacetsData.sortFacet;
		$scope.FacetsData.sortInfo.directions[0] = $scope.FacetsData.sortDirection;
		if ($scope.FacetsData.sortFacet=='') {
			$scope.FacetsData.sortInfo.fields.push('Not Sorted');
		}
	};
	
	this.clear = function clear(event) {
		//window.location = '#';
		event.preventDefault();
		$scope.FacetsData.entityPredicates.length = 0;
		$scope.initTable();
		selectCollection();
		getMetadata($scope.FacetsData.table, $scope.successGetMetadata);
	};
	
    this.closeModal = function closeModal(event) {
    	FacetsService.closeModal(event);
	}

	this.delay_predicate = function delay_predicate(facet,keyCode) {
		if ($scope.FacetsData.filterTextTimeout != null) {
			$timeout.cancel($scope.FacetsData.filterTextTimeout);
		}
		$scope.FacetsData.filterTextTimeout = $timeout(function(){$scope.predicate(facet,keyCode);}, 1000); // delay 1000 ms
	};

	this.delay_slider = function delay_slider(facet) {
		if ($scope.FacetsData.filterSliderTimeout != null) {
			$timeout.cancel($scope.FacetsData.filterSliderTimeout);
		}
		$scope.FacetsData.filterSliderTimeout = $timeout(function(){$scope.predicate_slider(facet);}, 1); // delay 1 ms
	};

	this.displayMore = function displayMore(event) {
		event.preventDefault();
		$scope.FacetsData.moreFlag = !$scope.FacetsData.moreFlag;
	};

	this.displayTreeCount = function displayTreeCount(data) {
		var ret = '';
		if (data.count > 0) {
			ret = '(' + data.count + ')';
		}
		return ret;
	};

	this.expandCollapse = function expandCollapse(data, show) {
		data.expand = !data.expand;
		data.show = show;
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
	
	this.hide = function hide(facet) {
		return ($scope.FacetsData.narrow[facet['table']][facet['name']] == null || !$scope.FacetsData.chooseColumns[facet['table']][facet['name']] || 
				($scope.FacetsData.box[facet['table']][facet['name']]['facetcount'] == 0 && 
						($scope.FacetsData.colsDescr[facet['table']][facet['name']]['type'] == 'bigint' ||
								$scope.FacetsData.colsDescr[facet['table']][facet['name']]['type'] == 'enum' && !hasCheckedValues($scope.FacetsData.box, facet))));
	};

	this.if_type = $scope.if_type = function if_type(facet, facet_type) {
		var ret = false;
		if ($scope.FacetsData.colsDescr[facet['table']] != null && $scope.FacetsData.colsDescr[facet['table']][facet['name']] != null) {
			ret = ($scope.FacetsData.colsDescr[facet['table']][facet['name']]['type'] == facet_type);
			if (facet_type == 'bigint') {
				ret = psqlNumeric.contains($scope.FacetsData.colsDescr[facet['table']][facet['name']]['type']);
			} else if (facet_type == 'text') {
				ret = psqlText.contains($scope.FacetsData.colsDescr[facet['table']][facet['name']]['type']);
			}
		}
		return ret;
	};

	this.predicate_checkbox = function predicate_checkbox(facet) {
		setFacetClass($scope.FacetsData, facet, $scope.FacetsData.facetClass);
		FacetsService.setSortOption();
		$scope.FacetsData.pagingOptions.currentPage = 1;
		getErmrestData($scope.FacetsData, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.preventDefault = function preventDefault(event) {
		event.preventDefault();
	};

	this.showClearButton = function showClearButton() {
		return $scope.FacetsData.ready;
	};

	this.showFacetCount = function showFacetCount(facet) {
		return ($scope.FacetsData.chooseColumns[facet['table']][facet['name']] && 
				($scope.FacetsData.box[facet['table']][facet['name']]['facetcount'] > 0 || 
						$scope.FacetsData.colsDescr[facet['table']][facet['name']]['type'] == 'enum' && hasCheckedValues($scope.FacetsData.box, facet)));
	};

	this.showFacetValue = function showFacetValue(facet, value) {
		return ($scope.FacetsData.colsGroup[facet['table']][facet['name']][value] == 0 && !$scope.FacetsData.box[facet['table']][facet['name']]['values'][value]);
	};

	this.showFilters = function showFilters() {
		return true;
	};

	this.showRefine = function showRefine() {
		return $('.highlighted', $('#treeDiv')).length > 0;
	};

	this.showSort = function showSort() {
		return false;
	};

	this.showTableSelect = function showTableSelect() {
		return false;
	};

	this.showTree = function showTree() {
		return true;
	};

	this.table_select = function table_select() {
		$scope.FacetsData.entityPredicates.length = 0;
		$scope.FacetsData.selectedEntity = null;
		$scope.initTable();
		getMetadata($scope.FacetsData.table, $scope.successGetMetadata);
	};

	this.toggleFacet = function toggleFacet(event, facet) {
		if ($scope.FacetsData.narrow[facet['table']][facet['name']] == null) {
			$scope.FacetsData.narrow[facet['table']][facet['name']] = true;
			$(event.target).addClass('collapsed');
			$(event.target).find('.glyphicon').removeClass('glyphicon-plus').addClass('glyphicon-minus');
			setTimeout(function () {
				$scope.$broadcast('reCalcViewDimensions');
			}, 1);
		} else if ($scope.if_type(facet, 'enum')) {
			if (!hasCheckedValues($scope.FacetsData.box, facet) && !$(event.target).is(':checkbox')) {
				$(event.target).removeClass('collapsed');
				$(event.target).find('.glyphicon').removeClass('glyphicon-minus').addClass('glyphicon-plus');
				delete $scope.FacetsData.narrow[facet['table']][facet['name']];
			}
		} else if ($scope.if_type(facet, 'bigint') && !$(event.target).is('rzslider')) {
			if ($scope.FacetsData.box[facet['table']][facet['name']]['min'] == $scope.FacetsData.box[facet['table']][facet['name']]['floor'] && $scope.FacetsData.box[facet['table']][facet['name']]['max'] == $scope.FacetsData.box[facet['table']][facet['name']]['ceil']) {
				$(event.target).removeClass('collapsed');
				$(event.target).find('.glyphicon').removeClass('glyphicon-minus').addClass('glyphicon-plus');
				delete $scope.FacetsData.narrow[facet['table']][facet['name']];
			}
		} else if ($scope.if_type(facet, 'text') && !$(event.target).is('input:text')) {
			if ($scope.FacetsData.box[facet['table']][facet['name']]['value'].length == 0) {
				$(event.target).removeClass('collapsed');
				$(event.target).find('.glyphicon').removeClass('glyphicon-minus').addClass('glyphicon-plus');
				delete $scope.FacetsData.narrow[facet['table']][facet['name']];
			}
		}
	};
	
	$scope.initPageRange();
	setTimeout(function () {
		// delay is necessary for Angular render activity
		getTables($scope.FacetsData.tables, $scope.FacetsData, $scope.successGetTables);
	}, 1);
}]);
