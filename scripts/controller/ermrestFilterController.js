'use strict';

/* Controllers */

var ermFilterController = angular.module('ermFilterController', ['facetsModel', 'facetsService']);

//angular.module('ermrestApp').controller('FilterListCtrl', ['$scope', '$timeout', 'FacetsData', 'FacetsService',
ermFilterController.controller('FilterListCtrl', ['$rootScope', '$scope', '$timeout', 'FacetsData', 'FacetsService',
                                                      function($rootScope, $scope, $timeout, FacetsData, FacetsService) {
	
	$scope.FacetsData = FacetsData;
	$rootScope.preventSortOrder = false;
	
	$scope.$watch('FacetsData.sortFacet', function (newVal, oldVal) {
		if ($scope.FacetsData.ready && newVal !== oldVal) {
			$scope.FacetsData.pagingOptions.currentPage = 1;
			$rootScope.preventSortOrder = true;
			$scope.getPagedDataAsync($scope.FacetsData.pagingOptions.pageSize, $scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.filterOptions.filterText, $scope.FacetsData.sortInfo);
		}
	}, true);
	
	$scope.$watch('FacetsData.sortOrder', function (newVal, oldVal) {
		if ($scope.FacetsData.ready && newVal !== oldVal) {
			if ($rootScope.preventSortOrder) {
				// the data was already got from sortFacet
				$rootScope.preventSortOrder = false;
			} else {
				$scope.FacetsData.pagingOptions.currentPage = 1;
				$scope.getPagedDataAsync($scope.FacetsData.pagingOptions.pageSize, $scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.filterOptions.filterText, $scope.FacetsData.sortInfo);
			}
		}
	}, true);
	
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
		setBookmark($scope.FacetsData);
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};

	$scope.successGetTables = function successGetTables() {
		$('#headerSearch').attr('disabled', 'disabled');
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		selectCollection();
	};

	$scope.initPageRange();
	setTimeout(function () {
		// delay is necessary for Angular render activity
		getTables($scope.FacetsData.tables, $scope.FacetsData, $scope.successGetTables);
	}, 1);
}]);
