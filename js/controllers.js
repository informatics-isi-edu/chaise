'use strict';

/* Controllers */

var facetsControllers = angular.module('facetsControllers', []);

facetsControllers.controller('FacetListCtrl', ['$scope', '$timeout',
                                               function($scope, $timeout) {
	initFacebase();
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
	$scope.facebaseData = [];
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
		$scope.facebaseData = data;
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
			var data;
			if (searchText) {
				getPage($scope.table, $scope.box, $scope.colsDescr, pageSize, page, $scope.totalServerItems, sortOption, $scope.filterAllText, $scope.setPagingData);
			} else {
				getPage($scope.table, $scope.box, $scope.colsDescr, pageSize, page, $scope.totalServerItems, sortOption, $scope.filterAllText, $scope.setPagingData);
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
			$scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText, newVal);
		}
	}, true);

	$scope.gridOptions = {
			data: 'facebaseData',
			enablePaging: true,
			showFooter: true,
			//showFilter: true,
			totalServerItems: 'totalServerItems',
			pagingOptions: $scope.pagingOptions,
			enableSorting: true,
			enableColumnResize: true,
			enableCellSelection: true,
			showColumnMenu: true,
			enableCellEdit: true,
			columnDefs: 'colsDefs',
			filterOptions: $scope.filterOptions,
			sortInfo: $scope.sortInfo,
			useExternalSorting: true
	};

	$scope.initTable = function initTable() {
		$scope.ready = false;
		$scope.moreFlag = false;
		$scope.filterTextTimeout = null;
		$scope.filterSliderTimeout = null;
		$scope.filterSearchAllTimeout = null;
		$scope.totalServerItems = 0;
		$scope.filterAllText = '';
		clearFacets($scope.narrow, 
				$scope.box, 
				$scope.facets, 
				$scope.facebaseData, 
				$scope.metadata, 
				$scope.colsDescr, 
				$scope.colsGroup, 
				$scope.colsDefs,
				$scope.filterOptions, 
				$scope.pagingOptions, 
				$scope.sortInfo,
				$scope.chooseColumns,
				$scope.facetClass,
				$scope.score)
	};

	$scope.successUpdateModels = function successUpdateModels() {
		$scope.$apply();
	};

	$scope.successUpdateCount = function successUpdateCount() {
		$scope.ready = true;
		$scope.$apply();
	};

	$scope.successInitModels = function successInitModels() {
		updateCount($scope.box, $scope.colsDescr, $scope.table, $scope.filterAllText, $scope.chooseColumns, $scope.successUpdateCount);
		$scope.$apply();
	};

	$scope.successGetColumnDescriptions = function successGetColumnDescriptions(data, textStatus, jqXHR) {
		$scope.colsDescr = data;
		initModels($scope.box, $scope.narrow, $scope.colsDescr, $scope.colsGroup, $scope.metadata, $scope.chooseColumns, $scope.facetClass, $scope.score, $scope.filterAllText, $scope.successInitModels);
	};

	$scope.successGetFacebaseData = function successGetFacebaseData(data, totalItems, page, pageSize) {
		$scope.facebaseData = data;
		$scope.totalServerItems = totalItems;
		$scope.$apply();
		getColumnDescriptions($scope.metadata, $scope.facebaseData, $scope.successGetColumnDescriptions);
	};

	$scope.successGetTableColumnsUniques = function successGetTableColumnsUniques() {
		//alert(JSON.stringify($scope.score, null, 4));
		var sortOption = $scope.sortInfo;
		if (sortOption != null && sortOption['fields'].length > 1) {
			sortOption = null;
		}
		getFacebaseData($scope.table, null, $scope.box, $scope.colsDefs, $scope.colsDescr, $scope.colsGroup, 
				$scope.gridOptions.pagingOptions.currentPage, $scope.gridOptions.pagingOptions.pageSize, 
				sortOption, $scope.filterAllText, $scope.chooseColumns, $scope.successGetFacebaseData, $scope.successUpdateModels);
	};

	$scope.successGetMetadata = function successGetMetadata(data, textStatus, jqXHR) {
		$scope.metadata = data;
		var columns  = getTableColumns($scope.metadata, $scope.sortInfo);
		$scope.facets = columns['facets'];
		$scope.colsDefs = columns['colsDefs'];
		$scope.$apply();
		getTableColumnsUniques($scope.metadata, $scope.score, $scope.successGetTableColumnsUniques);
	};
	$scope.successGetTables = function successGetTables() {
		$scope.table = $scope.tables[0];
		getMetadata($scope.table, $scope.successGetMetadata);
	};

	getTables($scope.tables, $scope.successGetTables);

	$scope.successSearchFacets = function successSearchFacets(data, totalItems, page, pageSize) {
		$scope.facebaseData = data;
		$scope.totalServerItems = totalItems;
		$scope.$apply();
	};

	this.if_type = function if_type(facet, facet_type) {
		return $scope.colsDescr[facet]['type'] == facet_type;
	};

	this.showFacebase = function showFacebase() {
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
		getFacebaseData($scope.table, facet, $scope.box, $scope.colsDefs, $scope.colsDescr, $scope.colsGroup, 
				$scope.gridOptions.pagingOptions.currentPage, $scope.gridOptions.pagingOptions.pageSize, 
				$scope.sortInfo, $scope.filterAllText, $scope.chooseColumns, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.delay_slider = function delay_slider(facet) {
		if ($scope.filterSliderTimeout != null) {
			$timeout.cancel($scope.filterSliderTimeout);
		}
		$scope.filterSliderTimeout = $timeout(function(){$scope.predicate_slider(facet);}, 1); // delay 1 ms
	};

	$scope.predicate_slider = function predicate_slider(facet) {
		setFacetClass(facet, $scope.box, $scope.colsDescr, $scope.facetClass);
		getFacebaseData($scope.table, facet, $scope.box, $scope.colsDefs, $scope.colsDescr, $scope.colsGroup, 
				$scope.gridOptions.pagingOptions.currentPage, $scope.gridOptions.pagingOptions.pageSize, 
				$scope.sortInfo, $scope.filterAllText, $scope.chooseColumns, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.delay_search_all = function delay_search_all() {
		if ($scope.filterSearchAllTimeout != null) {
			$timeout.cancel($scope.filterSearchAllTimeout);
		}
		$scope.filterSearchAllTimeout = $timeout(function(){$scope.predicate_search_all();}, 1000); // delay 1 s
	};

	$scope.predicate_search_all = function predicate_search_all() {
		getFacebaseData($scope.table, null, $scope.box, $scope.colsDefs, $scope.colsDescr, $scope.colsGroup, 
				$scope.gridOptions.pagingOptions.currentPage, $scope.gridOptions.pagingOptions.pageSize, 
				$scope.sortInfo, $scope.filterAllText, $scope.chooseColumns, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.predicate_checkbox = function predicate_checkbox(facet) {
		setFacetClass(facet, $scope.box, $scope.colsDescr, $scope.facetClass);
		getFacebaseData($scope.table, facet, $scope.box, $scope.colsDefs, $scope.colsDescr, $scope.colsGroup, 
				$scope.gridOptions.pagingOptions.currentPage, $scope.gridOptions.pagingOptions.pageSize, 
				$scope.sortInfo, $scope.filterAllText, $scope.chooseColumns, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.predicate_select = function predicate_select(facet) {
		setFacetClass(facet, $scope.box, $scope.colsDescr, $scope.facetClass);
		getFacebaseData($scope.table, facet, $scope.box, $scope.colsDefs, $scope.colsDescr, $scope.colsGroup, 
				$scope.gridOptions.pagingOptions.currentPage, $scope.gridOptions.pagingOptions.pageSize, 
				$scope.sortInfo, $scope.filterAllText, $scope.chooseColumns, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.table_select = function table_select() {
		$scope.initTable();
		getMetadata($scope.table, $scope.successGetMetadata);
	};

	this.showFacetValue = function showFacetValue(facet, value) {
		return ($scope.colsGroup[facet][value] == 0);
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
						$scope.colsDescr[facet]['type'] == 'text' && $scope.box[facet]['value'] != '' ||
						$scope.colsDescr[facet]['type'] == 'enum' && hasCheckedValues($scope.box, facet)));
	};
	this.showFacetCount = function showFacetCount(facet) {
		return ($scope.chooseColumns[facet] && 
				($scope.box[facet]['facetcount'] > 0 || 
						$scope.colsDescr[facet]['type'] == 'text' && $scope.box[facet]['value'] != '' ||
						$scope.colsDescr[facet]['type'] == 'enum' && hasCheckedValues($scope.box, facet)));
	};
	this.showClearButton = function showClearButton() {
		return $scope.ready;
	};
	this.hide = function hide(facet) {
		return ($scope.narrow[facet] == null || !$scope.chooseColumns[facet] || 
				($scope.box[facet]['facetcount'] == 0 && 
						($scope.colsDescr[facet]['type'] == 'text' && $scope.box[facet]['value'] == '' ||
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

facetsControllers.controller('TopPanelCtrl', ['$scope',
                                              function($scope) {
	this.showTop = function showTop() {
		return TOP_DISPLAY;
	};
	this.show = function show() {
		return (USER != null);
	};
	this.hide = function hide() {
		return (USER != null);
	};
	this.welcome = function welcome() {
		return (USER != null ? ('Welcome ' + USER + '!') : '');
	};
	this.preventRoute = function preventRoute(event) {
		event.preventDefault();
	};
}]);

facetsControllers.controller('FacetRefineCtrl', ['$scope',
                                                 function($scope) {
	this.logout = function logout() {
		var res = submitLogout();
		window.location = '#/facets';
	};
}]);

facetsControllers.controller('LoginCtrl', ['$scope',
                                           function($scope) {
	TOP_DISPLAY = false;
	$scope.isVisible = true;
	this.show = function show(facet) {
		return $scope.isVisible;
	};
	this.login = function login() {
		var myToken = submitGlobusLogin($scope.username, $scope.password);
		if (myToken != null) {
			$scope.isVisible = false;
			TOP_DISPLAY = true;
			window.location = '#/facets';
		}
	};
	this.cancelLogin = function cancelLogin() {
		TOP_DISPLAY = true;
		window.location = '#/facets';
	};
	this.checkLogin = function checkLogin(keyCode) {
		if (keyCode == 13 && $scope.username && $scope.password) {
			this.login();
		}
	};
	this.disableLoginButton = function disableLoginButton() {
		return (!$scope.username || !$scope.password);
	};
}]);

facetsControllers.controller('LogoutCtrl', ['$scope',
                                            function($scope) {
	submitLogout();
	TOP_DISPLAY = true;
	window.location = '#/facets';
}]);


