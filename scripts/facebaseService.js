//'use strict';

/* Service Module */

var facebaseService = angular.module('facebaseService', ['facebaseModel']);

//angular.module('ermrestApp').service('FacebaseService', ['$sce', 'FacebaseData', function($sce, FacebaseData) {
facebaseService.service('FacebaseService', ['$sce', 'FacebaseData', function($sce, FacebaseData) {
	this.closeModal = function (event) {
		FacebaseData.spinner[FacebaseData.modalIndex] = false;
	};
	
	this.display = function (table, column) {
		return COLUMNS_ALIAS[table][column];
	};
	
	this.html = function (table, column, data) {
		return hasAnnotation(table, column, 'html') ? $sce.trustAsHtml(data) : data;
	};
	
	this.setSortOption = function () {
		var sortOption = FacebaseData.sortInfo;
		if (sortOption != null && sortOption['fields'].length > 1) {
			sortOption = null;
		}
		FacebaseData['sortOption'] = sortOption;
	};
	
	this.successSearchFacets = function (data, totalItems, page, pageSize) {
		FacebaseData.ermrestData = data;
		FacebaseData.collectionsPredicate = getCollectionsPredicate(FacebaseData.entityPredicates, FacebaseData);
		FacebaseData.totalServerItems = totalItems;
		if (FacebaseData.selectedEntity != null) {
			FacebaseData.selectedEntity['count'] = totalItems;
		}
		FacebaseData.maxPages = Math.floor(FacebaseData.totalServerItems/FacebaseData.pagingOptions.pageSize);
		if (FacebaseData.totalServerItems%FacebaseData.pagingOptions.pageSize != 0) {
			FacebaseData.maxPages++;
		}
	};
	
	this.initTable = function () {
		$('footer').hide();
		$('#headerSearch').val('');
		FacebaseData.ready = false;
		FacebaseData.moreFlag = false;
		FacebaseData.filterTextTimeout = null;
		FacebaseData.filterSliderTimeout = null;
		FacebaseData.filterSearchAllTimeout = null;
		FacebaseData.totalServerItems = 0;
		FacebaseData.filterAllText = '';
		FacebaseData.sortColumns = [''];
		FacebaseData.pageRange = [];
		FacebaseData.pageMap = {};
		FacebaseData.maxPages = 0;
		FacebaseData.sortFacet = '';
		FacebaseData.sortDirection = 'asc';
		FacebaseData.details = false;
		FacebaseData.entryRow = [];
		FacebaseData.detailColumns = [];
		FacebaseData.detailRows = [];
		FacebaseData.textEntryRow = [];
		FacebaseData.entry3Dview = '';
		FacebaseData.entryTitle = '';
		FacebaseData.entrySubtitle = '';
		this.initPageRange();
        FacebaseData.spinner = [];
        FacebaseData.modalIndex = -1;
		clearFacets(FacebaseData);
	};
	
	this.initPageRange = function () {
	    for (var i = 1; i <= FacebaseData.tagPages; i++) {
	    	FacebaseData.pageRange.push(i);
	    	FacebaseData.pageMap[i] = i;
	    }
	};
}]);
