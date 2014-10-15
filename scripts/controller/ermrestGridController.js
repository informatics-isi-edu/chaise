'use strict';

/* Controllers */

var ermGridController = angular.module('ermGridController', []);

ermGridController.controller('GridListCtrl', ['$scope', '$timeout', '$location',
                                               function($scope, $timeout, $location) {
	$('footer').hide();
	$('.panel-collapse').on('hide.bs.collapse', function () {
	      $(this).prev('.panel-heading').find('.glyphicon').removeClass('glyphicon-minus').addClass('glyphicon-plus');
	});
	$('.panel-collapse').on('show.bs.collapse', function () {
	      $(this).prev('.panel-heading').find('.glyphicon').removeClass('glyphicon-plus').addClass('glyphicon-minus');
	});

	$('#attrsort').click(function(){
		if ($('span').hasClass("glyphicon-sort-by-attributes")) {
		$("#attrsort span.glyphicon").removeClass("glyphicon-sort-by-attributes").addClass("glyphicon-sort-by-attributes-alt");
		}
		else {
		$("#attrsort span.glyphicon").removeClass("glyphicon-sort-by-attributes-alt").addClass("glyphicon-sort-by-attributes");
		}
	});
	if ($location.search()['schema'] != null) {
		SCHEMA = $location.search()['schema'];
	} else if (SCHEMA == null) {
		SCHEMA = 'facebase';
	}
	initApplication();
	$scope.table = '';
	$scope.tables = [];

	$scope.ready = false;
	$scope.filterAllText = '';
	$scope.moreFlag = false;
	$scope.facetClass = {};
	$scope.chooseColumns = {};
	$scope.score = [];
	$scope.narrow = {};
	$scope.box = {};
	$scope.filterTextTimeout = null;
	$scope.filterSliderTimeout = null;
	$scope.filterSearchAllTimeout = null;

	$scope.facets = [];
	$scope.ermrestData = [];
	$scope.metadata = {};
	$scope.colsDescr = {};
	$scope.colsGroup = {};
	$scope.colsDefs = [];
	$scope.filterOptions = {
			filterText: "",
			useExternalFilter: true
	};
	$scope.totalServerItems = 0;
	$scope.pagingOptions = {
			pageSizes: [25, 50, 100],
			pageSize: 25,
			currentPage: 1
	};  
	$scope.sortInfo = {'fields': [], 'directions': []};
	$scope.setPagingData = function(data, totalItems, page, pageSize){	
		$scope.options['ermrestData'] = $scope.ermrestData = data;
		$scope.totalServerItems = totalItems;
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};
	$scope.getPagedDataAsync = function (pageSize, page, searchText, sortOption) {
		setTimeout(function () {
			if (sortOption != null && sortOption['fields'].length > 1) {
				sortOption = null;
			}
			$scope.options['sortOption'] = sortOption;
			if (searchText) {
				getPage($scope.options, $scope.totalServerItems, $scope.setPagingData);
			} else {
				getPage($scope.options, $scope.totalServerItems, $scope.setPagingData);
			}
		}, 100);
	};
	$scope.$watch('pagingOptions', function (newVal, oldVal) {
		if ($scope.ready && newVal !== oldVal && 
				(newVal.currentPage !== oldVal.currentPage || newVal.pageSize !== oldVal.pageSize)) {
			$scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText, $scope.sortInfo);
		}
	}, true);
	
	$scope.$watch('filterOptions', function (newVal, oldVal) {
		if ($scope.ready && newVal !== oldVal) {
			$scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText, $scope.sortInfo);
		}
	}, true);
	
	$scope.$watch('sortInfo', function (newVal, oldVal) {
		if ($scope.ready && newVal !== oldVal) {
			if ($scope.options['sortInfo']['fields'].length > 1) {
				$('div.ngSortButtonUp').addClass('ng-hide');
			}
			$scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText, newVal);
		}
	}, true);

	$scope.gridOptions = {
			data: 'ermrestData',
			enablePaging: true,
			showFooter: true,
			//showFilter: true,
			totalServerItems: 'totalServerItems',
			pagingOptions: $scope.pagingOptions,
			enableSorting: true,
			enableColumnResize: true,
			enableCellSelection: true,
			enableColumnReordering: true,
			showColumnMenu: true,
			enableCellEdit: true,
			columnDefs: 'colsDefs',
			filterOptions: $scope.filterOptions,
			sortInfo: $scope.sortInfo,
			useExternalSorting: true
	};
	
	$scope.options = {
			'box': $scope.box,
			'chooseColumns': $scope.chooseColumns,
			'colsDefs': $scope.colsDefs,
			'colsDescr': $scope.colsDescr,
			'colsGroup': $scope.colsGroup,
			'ermrestData': $scope.ermrestData,
			'facetClass': $scope.facetClass,
			'facets': $scope.facets,
			'filterOptions': $scope.filterOptions,
			'filterAllText': $scope.filterAllText,
			'metadata': $scope.metadata,
			'narrow': $scope.narrow,
			'pagingOptions': $scope.pagingOptions,
			'score': $scope.score,
			'sortInfo': $scope.sortInfo,
			'sortOption': null,
			'table': $scope.table
	};

	$scope.setSortOption = function setSortOption() {
		var sortOption = $scope.sortInfo;
		if (sortOption != null && sortOption['fields'].length > 1) {
			sortOption = null;
		}
		$scope.options['sortOption'] = sortOption;
	};
	
	$scope.initTable = function initTable() {
		$scope.ready = false;
		$scope.moreFlag = false;
		$scope.filterTextTimeout = null;
		$scope.filterSliderTimeout = null;
		$scope.filterSearchAllTimeout = null;
		$scope.totalServerItems = 0;
		$scope.options['filterAllText'] = $scope.filterAllText = '';
		$scope.options['table'] = $scope.table;
		clearFacets($scope.options);
	};

	$scope.successUpdateModels = function successUpdateModels() {
		$scope.$apply();
		$scope.$broadcast('reCalcViewDimensions');
	};

	$scope.successUpdateCount = function successUpdateCount() {
		$scope.ready = true;
		$scope.$apply();
		//console.log(JSON.stringify($scope.options, null, 4));
	};

	$scope.successInitModels = function successInitModels() {
		updateCount($scope.options, $scope.successUpdateCount);
		$scope.$apply();
	};

	$scope.successGetColumnDescriptions = function successGetColumnDescriptions(data, textStatus, jqXHR) {
		$scope.options['colsDescr'] = $scope.colsDescr = data;
		initModels($scope.options, $scope.successInitModels);
	};

	$scope.successGetErmrestData = function successGetErmrestData(data, totalItems, page, pageSize) {
		$scope.options['ermrestData'] = $scope.ermrestData = data;
		$scope.totalServerItems = totalItems;
		$scope.$apply();
		$('div.ngSortButtonUp').addClass('ng-hide');
		getColumnDescriptions($scope.options, $scope.successGetColumnDescriptions);
	};

	$scope.successGetTableColumnsUniques = function successGetTableColumnsUniques() {
		//alert(JSON.stringify($scope.score, null, 4));
		$scope.setSortOption();
		getErmrestData($scope.options, $scope.successGetErmrestData, $scope.successUpdateModels);
	};

	$scope.successGetMetadata = function successGetMetadata(data, textStatus, jqXHR) {
		$scope.options['metadata'] = $scope.metadata = data;
		var columns  = getTableColumns($scope.options);
		$scope.options['facets'] = $scope.facets = columns['facets'];
		$scope.options['colsDefs'] = $scope.colsDefs = columns['colsDefs'];
		$scope.$apply();
		getTableColumnsUniques($scope.options, $scope.successGetTableColumnsUniques);
	};
	
	$scope.successGetTables = function successGetTables() {
		$scope.options['table'] = $scope.table = $scope.tables[0];
		getMetadata($scope.table, $scope.successGetMetadata);
	};

	getTables($scope.tables, $scope.successGetTables);

	$scope.successSearchFacets = function successSearchFacets(data, totalItems, page, pageSize) {
		$scope.options['ermrestData'] = $scope.ermrestData = data;
		$scope.totalServerItems = totalItems;
		$scope.$apply();
	};

	this.if_type = function if_type(facet, facet_type) {
		var ret = ($scope.colsDescr[facet]['type'] == facet_type);
		if (facet_type == 'bigint') {
			ret = psqlNumeric.contains($scope.colsDescr[facet]['type']);
		} else if (facet_type == 'text') {
			ret = psqlText.contains($scope.colsDescr[facet]['type']);
		}
		return ret;
	};

	this.showApplication = function showApplication() {
		return true;
	};

	this.hideSpinner = function hideSpinner() {
		return true;
	};

	this.delay_predicate = function delay_predicate(facet,keyCode) {
		if ($scope.filterTextTimeout != null) {
			$timeout.cancel($scope.filterTextTimeout);
		}
		$scope.filterTextTimeout = $timeout(function(){$scope.predicate(facet,keyCode);}, 1000); // delay 1000 ms
	};

	$scope.predicate = function predicate(facet,keyCode) {
		if ($scope.box[facet]['value'] == '') {
			$scope.facetClass[facet] = '';
		} else {
			$scope.facetClass[facet] = 'selectedFacet';
		}
		$scope.setSortOption();
		getErmrestData($scope.options, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.delay_slider = function delay_slider(facet) {
		if ($scope.filterSliderTimeout != null) {
			$timeout.cancel($scope.filterSliderTimeout);
		}
		$scope.filterSliderTimeout = $timeout(function(){$scope.predicate_slider(facet);}, 1); // delay 1 ms
	};

	$scope.predicate_slider = function predicate_slider(facet) {
		if ($scope.box[facet]['min'] > $scope.box[facet]['floor']) {
			$scope.box[facet]['left'] = true;
		} else if ($scope.box[facet]['left'] && $scope.box[facet]['min'] == $scope.box[facet]['floor']) {
			delete $scope.box[facet]['left'];
		}
		if ($scope.box[facet]['max'] < $scope.box[facet]['ceil']) {
			$scope.box[facet]['right'] = true;
		} else if ($scope.box[facet]['right'] && $scope.box[facet]['max'] == $scope.box[facet]['original_ceil']) {
			delete $scope.box[facet]['right'];
		}
		setFacetClass($scope.options, facet, $scope.facetClass);
		$scope.setSortOption();
		getErmrestData($scope.options, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.delay_search_all = function delay_search_all() {
		if ($scope.filterSearchAllTimeout != null) {
			$timeout.cancel($scope.filterSearchAllTimeout);
		}
		$scope.filterSearchAllTimeout = $timeout(function(){$scope.predicate_search_all();}, 1000); // delay 1 s
	};

	$scope.predicate_search_all = function predicate_search_all() {
		$scope.options['filterAllText'] = $scope.filterAllText;
		$scope.setSortOption();
		getErmrestData($scope.options, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.predicate_checkbox = function predicate_checkbox(facet) {
		setFacetClass($scope.options, facet, $scope.facetClass);
		$scope.setSortOption();
		getErmrestData($scope.options, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.predicate_select = function predicate_select(facet) {
		setFacetClass($scope.options, facet, $scope.facetClass);
		$scope.setSortOption();
		getErmrestData($scope.options, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.table_select = function table_select() {
		$scope.initTable();
		getMetadata($scope.table, $scope.successGetMetadata);
	};

	this.showFacetValue = function showFacetValue(facet, value) {
		return ($scope.colsGroup[facet][value] == 0 && !$scope.box[facet]['values'][value]);
	};
	this.display = function display(facet) {
		return getColumnDisplay(facet, $scope.colsGroup);
	};
	this.displayValue = function displayValue(facet, value) {
		return getValueDisplay(facet, value, $scope.colsGroup);
	};
	this.show = function show(facet) {
		return ($scope.narrow[facet] == null && $scope.ready && $scope.chooseColumns[facet] && 
				($scope.box[facet]['facetcount'] > 0 || 
						$scope.colsDescr[facet]['type'] == 'enum' && hasCheckedValues($scope.box, facet)));
	};
	this.showFacetCount = function showFacetCount(facet) {
		return ($scope.chooseColumns[facet] && 
				($scope.box[facet]['facetcount'] > 0 || 
						$scope.colsDescr[facet]['type'] == 'enum' && hasCheckedValues($scope.box, facet)));
	};
	this.showClearButton = function showClearButton() {
		return $scope.ready;
	};
	this.hide = function hide(facet) {
		return ($scope.narrow[facet] == null || !$scope.chooseColumns[facet] || 
				($scope.box[facet]['facetcount'] == 0 && 
						($scope.colsDescr[facet]['type'] == 'bigint' ||
								$scope.colsDescr[facet]['type'] == 'enum' && !hasCheckedValues($scope.box, facet))));
	};
	this.expand = function expand(facet) {
		$scope.narrow[facet] = true;
	};
	this.collapse = function collapse(facet) {
		delete $scope.narrow[facet];
	};
	this.preventRoute = function preventRoute(event, facet) {
		event.preventDefault();
		if ($scope.narrow[facet] == null) {
			$scope.narrow[facet] = true;
		} else {
			delete $scope.narrow[facet];
		}
	};
	this.logout = function logout() {
		var res = submitLogout();
		window.location = '#/login';
	};
	this.clear = function clear() {
		//window.location = '#';
		$scope.initTable();
		getMetadata($scope.table, $scope.successGetMetadata);
	};
	
	this.displayMore = function displayMore(event) {
		event.preventDefault();
		$scope.moreFlag = !$scope.moreFlag;
	};
	this.showMore = function showMore() {
		return (!$scope.moreFlag && $scope.ready);
	};
	this.hideMore = function hideMore() {
		return (!$scope.moreFlag);
	};
	this.expandMore = function expandMore() {
		$scope.moreFlag = true;
	};
	this.collapseMore = function collapseMore() {
		$scope.moreFlag = false;
	};
	this.showMoreButton = function showMoreButton() {
		return $scope.ready;
	};
	this.showSearchBox = function showSearchBox() {
		return $scope.ready;
	};
}]);

