'use strict';

/* Controllers */

var ermResultsController = angular.module('ermResultsController', ['facebaseModel', 'facebaseService']);

//angular.module('ermrestApp').controller('ResultsListCtrl', ['$scope', '$timeout', '$sce', 'FacebaseData', 'FacebaseService',
ermResultsController.controller('ResultsListCtrl', ['$scope', '$timeout', '$sce', 'FacebaseData', 'FacebaseService',
                                                      function($scope, $timeout, $sce, FacebaseData, FacebaseService) {

	$scope.FacebaseData = FacebaseData;
	
	$scope.predicate_search_all = function predicate_search_all() {
		FacebaseService.setSortOption();
		$scope.FacebaseData.pagingOptions.currentPage = 1;
		getErmrestData($scope.FacebaseData, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	$scope.successSearchFacets = function successSearchFacets(data, totalItems, page, pageSize) {
		FacebaseService.successSearchFacets(data, totalItems, page, pageSize);
	};

	$scope.successUpdateModels = function successUpdateModels() {
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		$scope.$broadcast('reCalcViewDimensions');
	};

	this.cantPageBackward = function cantPageBackward() {
		return $scope.FacebaseData.pagingOptions.currentPage == 1;
	};

	this.canPageForward = function canPageForward() {
		return $scope.FacebaseData.pagingOptions.currentPage < $scope.FacebaseData.maxPages;
	};

	// "m" is the number of columns per row
	this.clicker = function clicker(event, row, m, index) {
		event.preventDefault();
		if (row == null) {
			$scope.FacebaseData.details = false;
			$scope.FacebaseData.entryRow = [];
			$scope.FacebaseData.detailColumns = [];
			$scope.FacebaseData.detailRows = [];
			$scope.FacebaseData.textEntryRow = [];
			$scope.FacebaseData.entry3Dview = '';
			$scope.FacebaseData.entryTitle = '';
			$scope.FacebaseData.entrySubtitle = '';
            $scope.FacebaseData.tiles = [];
            $scope.FacebaseData.files = [];
            $scope.FacebaseData.viewer3dFile = [];
		} else {
            $scope.FacebaseData.modalIndex = index;
            $scope.FacebaseData.spinner[index] = true;
			$scope.FacebaseData.entryRow = row;
			$scope.FacebaseData.detailColumns = getDetailColumns(row);
			$scope.FacebaseData.detailRows = getDetailRows(row, m);
			$scope.FacebaseData.textEntryRow = getLongTextColumns(row);
			$scope.FacebaseData.entryTitle = getEntryTitle(row);
			$scope.FacebaseData.entrySubtitle = getEntrySubtitle(row);
			$scope.FacebaseData.details = true;
			entityDenormalize(getEntityTable($scope.FacebaseData), row, $scope.FacebaseData.denormalizedView);
			entityLinearize($scope.FacebaseData.denormalizedView, $scope.FacebaseData.linearizeView);
            getDenormalizedFiles($scope.FacebaseData.table, row, $scope.FacebaseData.datasetFiles);
            $scope.FacebaseData.tiles = getTilesLayout($scope.FacebaseData.datasetFiles, 3);
            $scope.FacebaseData.files = getFilesLayout($scope.FacebaseData.datasetFiles);
            $scope.FacebaseData.viewer3dFile = getViewer3d($scope.FacebaseData.datasetFiles);
		}
	};
	
    this.closeModal = function closeModal(event) {
    	FacebaseService.closeModal(event);
	}

	this.delay_search_all = function delay_search_all() {
		if ($scope.FacebaseData.filterSearchAllTimeout != null) {
			$timeout.cancel($scope.FacebaseData.filterSearchAllTimeout);
		}
		$scope.FacebaseData.filterSearchAllTimeout = $timeout(function(){$scope.predicate_search_all();}, 1000); // delay 1 s
	};

	this.display = function display(table, column) {
		return FacebaseService.display(table, column);
	};

	// "m" is the number of columns per row
	// "maxRows" is the maxim number of rows to be displayed
	this.displayColumns = function displayColumns(row, m, maxRows) {
		return getDisplayColumns(row, m, maxRows, $scope.FacebaseData.table);
	};

	this.html = function html(table, column, data) {
		return FacebaseService.html(table, column, data);
	};

	this.if_hasThumbnail = function if_hasThumbnail() {
		var ret = display_columns['thumbnail'].length > 0;
		if (!ret) {
			ret = hasAssociationThumnbnail($scope.FacebaseData.table);
		}
		return ret;
	};

	this.isSummary = function isSummary(table, column) {
		return hasAnnotation(table, column, 'summary');
	};

	this.itemThumbnail = function itemThumbnail(row) {
		var ret = getEntryThumbnail(row);
		if (ret == null) {
			ret = getAssociationThumbnail($scope.FacebaseData.table, row);
		}
		return ret;
	};
	
	this.itemTitle = function itemTitle(row) {
		return getEntryTitle(row);
	};

	this.lastRecord = function lastRecord() {
		var ret = $scope.FacebaseData.pagingOptions.currentPage * $scope.FacebaseData.pagingOptions.pageSize;
		if (ret > $scope.FacebaseData.totalServerItems) {
			ret = $scope.FacebaseData.totalServerItems;
		}
		return ret;
	};

	this.pageBackward = function pageBackward(event) {
		event.preventDefault();
		$scope.FacebaseData.pagingOptions.currentPage = updatePageTag('backward', $scope.FacebaseData.pagingOptions.currentPage, $scope.FacebaseData.pageMap, $scope.FacebaseData.tagPages, $scope.FacebaseData.maxPages);
		setActivePage($scope.FacebaseData.pagingOptions.currentPage, $scope.FacebaseData.pageMap);
	};

	this.pageButton = function pageButton(page) {
		return $scope.FacebaseData.pageMap[page];
	};

	this.pageForward = function pageForward(event) {
		event.preventDefault();
		$scope.FacebaseData.pagingOptions.currentPage = updatePageTag('forward', $scope.FacebaseData.pagingOptions.currentPage, $scope.FacebaseData.pageMap, $scope.FacebaseData.tagPages, $scope.FacebaseData.maxPages);
		setActivePage($scope.FacebaseData.pagingOptions.currentPage, $scope.FacebaseData.pageMap);
	};

	this.pageInRange = function pageInRange(page) {
		return $scope.FacebaseData.pageMap[page] <= $scope.FacebaseData.maxPages;
	};

	this.pageToFirst = function pageToFirst(event) {
		event.preventDefault();
		$scope.FacebaseData.pagingOptions.currentPage = 2;
		$scope.FacebaseData.pagingOptions.currentPage = updatePageTag('backward', $scope.FacebaseData.pagingOptions.currentPage, $scope.FacebaseData.pageMap, $scope.FacebaseData.tagPages, $scope.FacebaseData.maxPages);
		setActivePage($scope.FacebaseData.pagingOptions.currentPage, $scope.FacebaseData.pageMap);
	};

	this.pageToLast = function pageToLast(event) {
		event.preventDefault();
		$scope.FacebaseData.pagingOptions.currentPage = $scope.FacebaseData.maxPages - 1;
		$scope.FacebaseData.pagingOptions.currentPage = updatePageTag('forward', $scope.FacebaseData.pagingOptions.currentPage, $scope.FacebaseData.pageMap, $scope.FacebaseData.tagPages, $scope.FacebaseData.maxPages);
		setActivePage($scope.FacebaseData.pagingOptions.currentPage, $scope.FacebaseData.pageMap);
	};

	this.selectPage = function selectPage(event, page) {
		event.preventDefault();
		$scope.FacebaseData.pagingOptions.currentPage = $scope.FacebaseData.pageMap[page];
		setActivePage($scope.FacebaseData.pagingOptions.currentPage, $scope.FacebaseData.pageMap);
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
		return $scope.FacebaseData.spinner[index] == true;
	};
	
}]);
