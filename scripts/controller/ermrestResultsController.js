'use strict';

/* Controllers */

var ermResultsController = angular.module('ermResultsController', ['facetsModel', 'facetsService']);

//angular.module('ermrestApp').controller('ResultsListCtrl', ['$scope', '$timeout', '$sce', 'FacetsData', 'FacetsService',
ermResultsController.controller('ResultsListCtrl', ['$scope', '$timeout', '$sce', 'FacetsData', 'FacetsService',
                                                      function($scope, $timeout, $sce, FacetsData, FacetsService) {

	$scope.FacetsData = FacetsData;
	
	$scope.predicate_search_all = function predicate_search_all() {
		FacetsService.setSortOption();
		$scope.FacetsData.pagingOptions.currentPage = 1;
		getErmrestData($scope.FacetsData, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	$scope.successSearchFacets = function successSearchFacets(data, totalItems, page, pageSize) {
		FacetsService.successSearchFacets(data, totalItems, page, pageSize);
	};

	$scope.successUpdateModels = function successUpdateModels() {
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		$scope.$broadcast('reCalcViewDimensions');
	};

	this.cantPageBackward = function cantPageBackward() {
		return $scope.FacetsData.pagingOptions.currentPage == 1;
	};

	this.canPageForward = function canPageForward() {
		return $scope.FacetsData.pagingOptions.currentPage < $scope.FacetsData.maxPages;
	};

	// "m" is the number of columns per row
	this.clicker = function clicker(event, row, m, index) {
		event.preventDefault();
		if (row == null) {
			$scope.FacetsData.details = false;
			$scope.FacetsData.entryRow = [];
			$scope.FacetsData.detailColumns = [];
			$scope.FacetsData.detailRows = [];
			$scope.FacetsData.textEntryRow = [];
			$scope.FacetsData.entry3Dview = '';
			$scope.FacetsData.entryTitle = '';
			$scope.FacetsData.entrySubtitle = '';
            $scope.FacetsData.tiles = [];
            $scope.FacetsData.files = [];
            $scope.FacetsData.viewer3dFile = [];
		} else {
            $scope.FacetsData.modalIndex = index;
            $scope.FacetsData.spinner[index] = true;
			$scope.FacetsData.entryRow = row;
			$scope.FacetsData.detailColumns = getDetailColumns(row);
			$scope.FacetsData.detailRows = getDetailRows(row, m);
			$scope.FacetsData.textEntryRow = getLongTextColumns(row);
			$scope.FacetsData.entryTitle = getEntryTitle(row);
			$scope.FacetsData.entrySubtitle = getEntrySubtitle(row);
			$scope.FacetsData.details = true;
			entityDenormalize(getEntityTable($scope.FacetsData), row, $scope.FacetsData.denormalizedView);
			entityLinearize($scope.FacetsData.denormalizedView, $scope.FacetsData.linearizeView);
            getDenormalizedFiles($scope.FacetsData.table, row, $scope.FacetsData.datasetFiles);
            $scope.FacetsData.tiles = getTilesLayout($scope.FacetsData.datasetFiles, 3);
            $scope.FacetsData.files = getFilesLayout($scope.FacetsData.datasetFiles);
            $scope.FacetsData.viewer3dFile = getViewer3d($scope.FacetsData.datasetFiles);
		}
	};
	
    this.closeModal = function closeModal(event) {
    	FacetsService.closeModal(event);
	}

	this.delay_search_all = function delay_search_all() {
		if ($scope.FacetsData.filterSearchAllTimeout != null) {
			$timeout.cancel($scope.FacetsData.filterSearchAllTimeout);
		}
		$scope.FacetsData.filterSearchAllTimeout = $timeout(function(){$scope.predicate_search_all();}, 1000); // delay 1 s
	};

	this.display = function display(table, column) {
		return FacetsService.display(table, column);
	};

	// "m" is the number of columns per row
	// "maxRows" is the maxim number of rows to be displayed
	this.displayColumns = function displayColumns(row, m, maxRows) {
		return getDisplayColumns(row, m, maxRows, $scope.FacetsData.table);
	};

	this.html = function html(table, column, data) {
		return FacetsService.html(table, column, data);
	};

	this.if_hasThumbnail = function if_hasThumbnail() {
		var ret = display_columns['thumbnail'].length > 0;
		if (!ret) {
			ret = hasAssociationThumnbnail($scope.FacetsData.table);
		}
		return ret;
	};

	this.isSummary = function isSummary(table, column) {
		return hasAnnotation(table, column, 'summary');
	};

	this.itemThumbnail = function itemThumbnail(row) {
		var ret = getEntryThumbnail(row);
		if (ret == null) {
			ret = getAssociationThumbnail($scope.FacetsData.table, row);
		}
		return ret;
	};
	
	this.itemTitle = function itemTitle(row) {
		return getEntryTitle(row);
	};

	this.lastRecord = function lastRecord() {
		var ret = $scope.FacetsData.pagingOptions.currentPage * $scope.FacetsData.pagingOptions.pageSize;
		if (ret > $scope.FacetsData.totalServerItems) {
			ret = $scope.FacetsData.totalServerItems;
		}
		return ret;
	};

	this.pageBackward = function pageBackward(event) {
		event.preventDefault();
		$scope.FacetsData.pagingOptions.currentPage = updatePageTag('backward', $scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap, $scope.FacetsData.tagPages, $scope.FacetsData.maxPages);
		setActivePage($scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap);
	};

	this.pageButton = function pageButton(page) {
		return $scope.FacetsData.pageMap[page];
	};

	this.pageForward = function pageForward(event) {
		event.preventDefault();
		$scope.FacetsData.pagingOptions.currentPage = updatePageTag('forward', $scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap, $scope.FacetsData.tagPages, $scope.FacetsData.maxPages);
		setActivePage($scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap);
	};

	this.pageInRange = function pageInRange(page) {
		return $scope.FacetsData.pageMap[page] <= $scope.FacetsData.maxPages;
	};

	this.pageToFirst = function pageToFirst(event) {
		event.preventDefault();
		$scope.FacetsData.pagingOptions.currentPage = 2;
		$scope.FacetsData.pagingOptions.currentPage = updatePageTag('backward', $scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap, $scope.FacetsData.tagPages, $scope.FacetsData.maxPages);
		setActivePage($scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap);
	};

	this.pageToLast = function pageToLast(event) {
		event.preventDefault();
		$scope.FacetsData.pagingOptions.currentPage = $scope.FacetsData.maxPages - 1;
		$scope.FacetsData.pagingOptions.currentPage = updatePageTag('forward', $scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap, $scope.FacetsData.tagPages, $scope.FacetsData.maxPages);
		setActivePage($scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap);
	};

	this.selectPage = function selectPage(event, page) {
		event.preventDefault();
		$scope.FacetsData.pagingOptions.currentPage = $scope.FacetsData.pageMap[page];
		setActivePage($scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap);
	};

	this.setActiveClass = function setActiveClass(index) {
		var ret = 'page-selector';
		if (index == 0) {
			ret += ' active';
		}
		return ret;
	};

	this.setSummaryClass = function setSummaryClass(table, column, value) {
		return value + (hasAnnotation(table, column, 'summary') ? ' summary' : ' truncate');
	};


	this.showResults = function showResults() {
		return true;
	};

	this.showSpinner = function showSpinner(index) {
		return $scope.FacetsData.spinner[index] == true;
	};
	
}]);
