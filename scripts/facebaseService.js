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
}]);
