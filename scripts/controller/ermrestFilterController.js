'use strict';

/* Controllers */

var ermFilterController = angular.module('ermFilterController', ['facebaseModel', 'facebaseService']);

//angular.module('ermrestApp').controller('FilterListCtrl', ['$scope', '$timeout', 'FacebaseData', 'FacebaseService',
ermFilterController.controller('FilterListCtrl', ['$scope', '$timeout', 'FacebaseData', 'FacebaseService',
                                                      function($scope, $timeout, FacebaseData, FacebaseService) {
	
	$scope.FacebaseData = FacebaseData;
	
	$scope.$watch('FacebaseData.filterOptions', function (newVal, oldVal) {
		if ($scope.FacebaseData.ready && newVal !== oldVal) {
			$scope.FacebaseData.pagingOptions.currentPage = 1;
			$scope.getPagedDataAsync($scope.FacebaseData.pagingOptions.pageSize, $scope.FacebaseData.pagingOptions.currentPage, $scope.FacebaseData.filterOptions.filterText, $scope.FacebaseData.sortInfo);
		}
	}, true);
	
	$scope.$watch('FacebaseData.pagingOptions', function (newVal, oldVal) {
		if ($scope.FacebaseData.ready && newVal !== oldVal && 
				(newVal.currentPage !== oldVal.currentPage || newVal.pageSize !== oldVal.pageSize)) {
			$scope.getPagedDataAsync($scope.FacebaseData.pagingOptions.pageSize, $scope.FacebaseData.pagingOptions.currentPage, $scope.FacebaseData.filterOptions.filterText, $scope.FacebaseData.sortInfo);
		}
	}, true);
	
	$scope.$watch('FacebaseData.sortInfo', function (newVal, oldVal) {
		if ($scope.FacebaseData.ready && newVal !== oldVal) {
			if ($scope.FacebaseData['sortInfo']['fields'].length > 1) {
				$('div.ngSortButtonUp').addClass('ng-hide');
			}
			$scope.FacebaseData.pagingOptions.currentPage = 1;
			$scope.getPagedDataAsync($scope.FacebaseData.pagingOptions.pageSize, $scope.FacebaseData.pagingOptions.currentPage, $scope.FacebaseData.filterOptions.filterText, newVal);
		}
	}, true);

	$scope.getPagedDataAsync = function (pageSize, page, searchText, sortOption) {
		setTimeout(function () {
			if (sortOption != null && sortOption['fields'].length > 1) {
				sortOption = null;
			}
			$scope.FacebaseData['sortOption'] = sortOption;
			if (searchText) {
				getPage($scope.FacebaseData, $scope.FacebaseData.totalServerItems, $scope.setPagingData);
			} else {
				getPage($scope.FacebaseData, $scope.FacebaseData.totalServerItems, $scope.setPagingData);
			}
		}, 100);
	};

	$scope.initPageRange = function () {
    	FacebaseService.initPageRange();
	}
	
	$scope.initSortOption = function initSortOption() {
		$.each($scope.FacebaseData.colsDefs, function(i, col) {
			if (isSortable($scope.FacebaseData.table, col.field)) {
				$scope.FacebaseData.sortColumns.push(col.field);
			}
		});
	};
	
	$scope.initTable = function initTable() {
    	FacebaseService.initTable();
	};

	$scope.predicate = function predicate(facet,keyCode) {
		if ($scope.FacebaseData.box[facet['table']][facet['name']]['value'] == '') {
			$scope.FacebaseData.facetClass[facet['table']][facet['name']] = '';
		} else {
			$scope.FacebaseData.facetClass[facet['table']][facet['name']] = 'selectedFacet';
		}
		FacebaseService.setSortOption();
		$scope.FacebaseData.pagingOptions.currentPage = 1;
		getErmrestData($scope.FacebaseData, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	$scope.predicate_slider = function predicate_slider(facet) {
		if ($scope.FacebaseData.box[facet['table']][facet['name']]['min'] > $scope.FacebaseData.box[facet['table']][facet['name']]['floor']) {
			$scope.FacebaseData.box[facet['table']][facet['name']]['left'] = true;
		} else if ($scope.FacebaseData.box[facet['table']][facet['name']]['left'] && $scope.FacebaseData.box[facet['table']][facet['name']]['min'] == $scope.FacebaseData.box[facet['table']][facet['name']]['floor']) {
			delete $scope.FacebaseData.box[facet['table']][facet['name']]['left'];
		}
		if ($scope.FacebaseData.box[facet['table']][facet['name']]['max'] < $scope.FacebaseData.box[facet['table']][facet['name']]['ceil']) {
			$scope.FacebaseData.box[facet['table']][facet['name']]['right'] = true;
		} else if ($scope.FacebaseData.box[facet['table']][facet['name']]['right'] && $scope.FacebaseData.box[facet['table']][facet['name']]['max'] == $scope.FacebaseData.box[facet['table']][facet['name']]['original_ceil']) {
			delete $scope.FacebaseData.box[facet['table']][facet['name']]['right'];
		}
		setFacetClass($scope.FacebaseData, facet, $scope.FacebaseData.facetClass);
		FacebaseService.setSortOption();
		$scope.FacebaseData.pagingOptions.currentPage = 1;
		getErmrestData($scope.FacebaseData, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	$scope.setPagingData = function(data, totalItems, page, pageSize){	
		if (page == 1) {
			$scope.FacebaseData.ermrestData = data;
		} else {
			$scope.FacebaseData.ermrestData = $scope.FacebaseData.ermrestData.concat(data);
		}
		$scope.FacebaseData.collectionsPredicate = getCollectionsPredicate($scope.FacebaseData.entityPredicates, $scope.FacebaseData);
		$scope.FacebaseData.totalServerItems = totalItems;
		$scope.FacebaseData.maxPages = Math.floor($scope.FacebaseData.totalServerItems/$scope.FacebaseData.pagingOptions.pageSize);
		if ($scope.FacebaseData.totalServerItems%$scope.FacebaseData.pagingOptions.pageSize != 0) {
			$scope.FacebaseData.maxPages++;
		}
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};

	$scope.successGetColumnDescriptions = function successGetColumnDescriptions(data, textStatus, jqXHR) {
		initModels($scope.FacebaseData, $scope.successInitModels);
	};

	$scope.successGetErmrestData = function successGetErmrestData(data, totalItems, page, pageSize) {
		if (page == 1) {
			$scope.FacebaseData.ermrestData = data;
		} else {
			$scope.FacebaseData.ermrestData = $scope.FacebaseData.ermrestData.concat(data);
		}
		$scope.FacebaseData.totalServerItems = totalItems;
		$scope.FacebaseData.collectionsPredicate = getCollectionsPredicate($scope.FacebaseData.entityPredicates, $scope.FacebaseData);
		if ($scope.FacebaseData.selectedEntity != null) {
			$scope.FacebaseData.selectedEntity['count'] = totalItems;
		}
		$scope.FacebaseData.maxPages = Math.floor($scope.FacebaseData.totalServerItems/$scope.FacebaseData.pagingOptions.pageSize);
		if ($scope.FacebaseData.totalServerItems%$scope.FacebaseData.pagingOptions.pageSize != 0) {
			$scope.FacebaseData.maxPages++;
		}
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		$('div.ngSortButtonUp').addClass('ng-hide');
		getColumnDescriptions($scope.FacebaseData, $scope.successGetColumnDescriptions);
	};

	$scope.successGetMetadata = function successGetMetadata(data, textStatus, jqXHR) {
		$scope.FacebaseData['metadata'] = data;
		getTableColumns($scope.FacebaseData, $scope.successGetTableColumns);
	};
	
	$scope.successGetTableColumns = function successGetTableColumns(columns) {
		$scope.FacebaseData['facets'] = columns['facets'];
		$scope.FacebaseData['colsDefs'] = columns['colsDefs'];
		$scope.initSortOption();
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		getTableColumnsUniques($scope.FacebaseData, $scope.successGetTableColumnsUniques);
	};
	
	$scope.successGetTableColumnsUniques = function successGetTableColumnsUniques() {
		//alert(JSON.stringify($scope.score, null, 4));
		FacebaseService.setSortOption();
		getErmrestData($scope.FacebaseData, $scope.successGetErmrestData, $scope.successUpdateModels);
	};

	$scope.successGetTables = function successGetTables() {
		$('#headerSearch').attr('disabled', 'disabled');
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		selectCollection();
	};

	$scope.successInitModels = function successInitModels() {
		updateCount($scope.FacebaseData, $scope.successUpdateCount);
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};

	$scope.successSearchFacets = function successSearchFacets(data, totalItems, page, pageSize) {
		FacebaseService.successSearchFacets(data, totalItems, page, pageSize);
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};

	$scope.successUpdateCount = function successUpdateCount() {
		$scope.FacebaseData.ready = true;
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
		if ($scope.FacebaseData.sortInfo.fields.length == 1) {
			$scope.FacebaseData.sortInfo.directions.length = 1;
			if ($scope.FacebaseData.sortDirection == $scope.FacebaseData.sortDirectionOptions[0]) {
				$scope.FacebaseData.sortDirection = $scope.FacebaseData.sortDirectionOptions[1];
			} else {
				$scope.FacebaseData.sortDirection = $scope.FacebaseData.sortDirectionOptions[0];
			}
			$scope.FacebaseData.sortInfo.directions[0] = $scope.FacebaseData.sortDirection;
		}
	};

	this.changeSortOption = function changeSortOption() {
		$scope.FacebaseData.sortInfo.fields.length = 1;
		$scope.FacebaseData.sortInfo.directions.length = 1;
		$scope.FacebaseData.sortInfo.fields[0] = $scope.FacebaseData.sortFacet;
		$scope.FacebaseData.sortInfo.directions[0] = $scope.FacebaseData.sortDirection;
		if ($scope.FacebaseData.sortFacet=='') {
			$scope.FacebaseData.sortInfo.fields.push('Not Sorted');
		}
	};
	
	this.clear = function clear(event) {
		//window.location = '#';
		event.preventDefault();
		$scope.FacebaseData.entityPredicates.length = 0;
		$scope.initTable();
		selectCollection();
		getMetadata($scope.FacebaseData.table, $scope.successGetMetadata);
	};
	
    this.closeModal = function closeModal(event) {
    	FacebaseService.closeModal(event);
	}

	this.delay_predicate = function delay_predicate(facet,keyCode) {
		if ($scope.FacebaseData.filterTextTimeout != null) {
			$timeout.cancel($scope.FacebaseData.filterTextTimeout);
		}
		$scope.FacebaseData.filterTextTimeout = $timeout(function(){$scope.predicate(facet,keyCode);}, 1000); // delay 1000 ms
	};

	this.delay_slider = function delay_slider(facet) {
		if ($scope.FacebaseData.filterSliderTimeout != null) {
			$timeout.cancel($scope.FacebaseData.filterSliderTimeout);
		}
		$scope.FacebaseData.filterSliderTimeout = $timeout(function(){$scope.predicate_slider(facet);}, 1); // delay 1 ms
	};

	this.displayMore = function displayMore(event) {
		event.preventDefault();
		$scope.FacebaseData.moreFlag = !$scope.FacebaseData.moreFlag;
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
		var peviousTable = $scope.FacebaseData.table;
		var node = $('label.highlighted', $('#treeDiv'));
		var isNew = (node.length == 0 || node[0] !== event.target);
		if (isNew) {
			$("#attrsort span.glyphicon").removeClass("glyphicon-sort-by-attributes-alt").addClass("glyphicon-sort-by-attributes");
		}
		if (data.level != -1 && isNew) {
			$('#headerSearch').removeAttr('disabled');
			collapseTree($scope.FacebaseData.tree[0], data);
			$('label', $('#treeDiv')).removeClass('highlighted');
			$(event.target).addClass('highlighted');
			var newBranch = false;
			if (!isNewSchema && data.level > 0 && $scope.FacebaseData.level >= 0) {
				var oldRoot = null;
				if ($scope.FacebaseData.level > 0) {
					var oldRootParent = $scope.FacebaseData.selectedEntity.parent;
					while (oldRootParent.parent != null) {
						oldRootParent = oldRootParent.parent;
					}
					oldRoot = oldRootParent.name;
				} else {
					oldRoot = $scope.FacebaseData.selectedEntity.name;
				}
				var newRootParent = data.parent;
				while (newRootParent.parent != null) {
					newRootParent = newRootParent.parent;
				}
				if ((oldRoot != null || $scope.FacebaseData.entityPredicates.length == 0) && newRootParent.name != oldRoot) {
					$scope.FacebaseData.level = 0;
					$scope.FacebaseData.entityPredicates.length = 1;
					$scope.FacebaseData.entityPredicates[0] = encodeSafeURIComponent(newRootParent.name);
					newBranch = true;
				}
			}
			$scope.FacebaseData.selectedEntity = data;
			$scope.FacebaseData.table = data.name;
			if (data.level == 0 || isNewSchema) {
				resetTreeCount(data);
				$scope.FacebaseData.entityPredicates.length = 0;
				if (isNewSchema && data.level > 0) {
					var node = data.parent;
					for (var i=data.level-1; i>=0; i--) {
						$scope.FacebaseData.entityPredicates[i] = encodeSafeURIComponent(node.name);
						node = node.parent;
					}
				}
				$scope.FacebaseData.entityPredicates.push(encodeSafeURIComponent($scope.FacebaseData.table));
				$scope.FacebaseData.level = data.level;
				updateTreeCount(data, $scope.FacebaseData.entityPredicates);
				$scope.initTable();
				getMetadata(data.name, $scope.successGetMetadata);
			} else if (data.level > $scope.FacebaseData.level) {
				$scope.FacebaseData.entityPredicates.length = data.level+1;
				$scope.FacebaseData.entityPredicates[data.level] = encodeSafeURIComponent(data.name);
				if (!newBranch) {
					var predicate = getPredicate($scope.FacebaseData, null, null, peviousTable);
					if (predicate.length > 0) {
						$scope.FacebaseData.entityPredicates[$scope.FacebaseData.level] += '/' + predicate.join('/');
					}
				}
				var node = data.parent;
				for (var i=data.level-1; i>$scope.FacebaseData.level; i--) {
					$scope.FacebaseData.entityPredicates[i] = encodeSafeURIComponent(node.name);
					node = node.parent;
				}
				updateTreeCount(data, $scope.FacebaseData.entityPredicates);
				$scope.FacebaseData.level = data.level;
				$scope.initTable();
				getMetadata(data.name, $scope.successGetMetadata);
			} else if (data.level < $scope.FacebaseData.level) {
				resetTreeCount(data);
				$scope.FacebaseData.entityPredicates.length = data.level+1;
				$scope.FacebaseData.entityPredicates[data.level] = encodeSafeURIComponent(data.name);
				updateTreeCount(data, $scope.FacebaseData.entityPredicates);
				$scope.FacebaseData.level = data.level;
				$scope.initTable();
				getMetadata(data.name, $scope.successGetMetadata);
			} else if (data.level == $scope.FacebaseData.level) {
				$scope.FacebaseData.entityPredicates[data.level] = encodeSafeURIComponent(data.name);
				updateTreeCount(data, $scope.FacebaseData.entityPredicates);
				$scope.FacebaseData.level = data.level;
				$scope.initTable();
				getMetadata(data.name, $scope.successGetMetadata);
			}
		}
	};
	
	this.hide = function hide(facet) {
		return ($scope.FacebaseData.narrow[facet['table']][facet['name']] == null || !$scope.FacebaseData.chooseColumns[facet['table']][facet['name']] || 
				($scope.FacebaseData.box[facet['table']][facet['name']]['facetcount'] == 0 && 
						($scope.FacebaseData.colsDescr[facet['table']][facet['name']]['type'] == 'bigint' ||
								$scope.FacebaseData.colsDescr[facet['table']][facet['name']]['type'] == 'enum' && !hasCheckedValues($scope.FacebaseData.box, facet))));
	};

	this.if_type = $scope.if_type = function if_type(facet, facet_type) {
		var ret = false;
		if ($scope.FacebaseData.colsDescr[facet['table']] != null && $scope.FacebaseData.colsDescr[facet['table']][facet['name']] != null) {
			ret = ($scope.FacebaseData.colsDescr[facet['table']][facet['name']]['type'] == facet_type);
			if (facet_type == 'bigint') {
				ret = psqlNumeric.contains($scope.FacebaseData.colsDescr[facet['table']][facet['name']]['type']);
			} else if (facet_type == 'text') {
				ret = psqlText.contains($scope.FacebaseData.colsDescr[facet['table']][facet['name']]['type']);
			}
		}
		return ret;
	};

	this.predicate_checkbox = function predicate_checkbox(facet) {
		setFacetClass($scope.FacebaseData, facet, $scope.FacebaseData.facetClass);
		FacebaseService.setSortOption();
		$scope.FacebaseData.pagingOptions.currentPage = 1;
		getErmrestData($scope.FacebaseData, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.preventDefault = function preventDefault(event) {
		event.preventDefault();
	};

	this.showClearButton = function showClearButton() {
		return $scope.FacebaseData.ready;
	};

	this.showFacetCount = function showFacetCount(facet) {
		return ($scope.FacebaseData.chooseColumns[facet['table']][facet['name']] && 
				($scope.FacebaseData.box[facet['table']][facet['name']]['facetcount'] > 0 || 
						$scope.FacebaseData.colsDescr[facet['table']][facet['name']]['type'] == 'enum' && hasCheckedValues($scope.FacebaseData.box, facet)));
	};

	this.showFacetValue = function showFacetValue(facet, value) {
		return ($scope.FacebaseData.colsGroup[facet['table']][facet['name']][value] == 0 && !$scope.FacebaseData.box[facet['table']][facet['name']]['values'][value]);
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
		$scope.FacebaseData.entityPredicates.length = 0;
		$scope.FacebaseData.selectedEntity = null;
		$scope.initTable();
		getMetadata($scope.FacebaseData.table, $scope.successGetMetadata);
	};

	this.toggleFacet = function toggleFacet(event, facet) {
		if ($scope.FacebaseData.narrow[facet['table']][facet['name']] == null) {
			$scope.FacebaseData.narrow[facet['table']][facet['name']] = true;
			$(event.target).addClass('collapsed');
			$(event.target).find('.glyphicon').removeClass('glyphicon-plus').addClass('glyphicon-minus');
			setTimeout(function () {
				$scope.$broadcast('reCalcViewDimensions');
			}, 1);
		} else if ($scope.if_type(facet, 'enum')) {
			if (!hasCheckedValues($scope.FacebaseData.box, facet) && !$(event.target).is(':checkbox')) {
				$(event.target).removeClass('collapsed');
				$(event.target).find('.glyphicon').removeClass('glyphicon-minus').addClass('glyphicon-plus');
				delete $scope.FacebaseData.narrow[facet['table']][facet['name']];
			}
		} else if ($scope.if_type(facet, 'bigint') && !$(event.target).is('rzslider')) {
			if ($scope.FacebaseData.box[facet['table']][facet['name']]['min'] == $scope.FacebaseData.box[facet['table']][facet['name']]['floor'] && $scope.FacebaseData.box[facet['table']][facet['name']]['max'] == $scope.FacebaseData.box[facet['table']][facet['name']]['ceil']) {
				$(event.target).removeClass('collapsed');
				$(event.target).find('.glyphicon').removeClass('glyphicon-minus').addClass('glyphicon-plus');
				delete $scope.FacebaseData.narrow[facet['table']][facet['name']];
			}
		} else if ($scope.if_type(facet, 'text') && !$(event.target).is('input:text')) {
			if ($scope.FacebaseData.box[facet['table']][facet['name']]['value'].length == 0) {
				$(event.target).removeClass('collapsed');
				$(event.target).find('.glyphicon').removeClass('glyphicon-minus').addClass('glyphicon-plus');
				delete $scope.FacebaseData.narrow[facet['table']][facet['name']];
			}
		}
	};
	
	$scope.initPageRange();
	setTimeout(function () {
		// delay is necessary for Angular render activity
		getTables($scope.FacebaseData.tables, $scope.FacebaseData, $scope.successGetTables);
	}, 1);
}]);
