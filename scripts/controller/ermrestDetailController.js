'use strict';

/* Controllers */

var ermDetailController = angular.module('ermDetailController', ['facetsModel', 'facetsService']);

//angular.module('ermrestApp').controller('DetailListCtrl', ['$scope', '$sce', 'FacetsData', 'FacetsService',
ermDetailController.controller('DetailListCtrl', ['$scope', '$sce', 'FacetsData', 'FacetsService',
                                                      function($scope, $sce, FacetsData, FacetsService) {
	
	$scope.FacetsData = FacetsData;
	
    this.closeModal = function closeModal(event) {
    	FacetsService.closeModal(event);
	}
    
	this.detailValue = function detailValue(table, column, data) {
		return hasAnnotation(table, column, 'html') ? '' : data;
	};

	this.display = function display(table, column) {
		return FacetsService.display(table, column);
	};

	this.displayTable = function displayTable(table) {
		return getTableDisplayName(table);
	};
	
	this.download = function download(event, url) {
		window.open(url, '_blank');
	};

	this.enlarge = function enlarge(event, url) {
		event.preventDefault();
		window.open(url, '_blank');
	};
	
	this.geoValue = function geoValue(table, row, column) {
		return getGeoValue(table, row, column);
	};

	this.html = function html(table, column, data) {
		return FacetsService.html(table, column, data);
	};

	this.init3Dview = function init3Dview(url) {
		return $sce.trustAsResourceUrl(url);
	};

	this.is3dView = function is3dView(table, column) {
		return hasAnnotation(table, column, '3dview');
	};

	this.isAttribute = function isAttribute(table, column) {
		return !hasAnnotation(table, column, 'dataset') && !hasAnnotation(table, column, 'image') && 
                        !hasAnnotation(table, column, 'download') && !hasAnnotation(table, column, 'geo_gds') &&
                        !hasAnnotation(table, column, 'geo_gse');
	};
	
	this.isDownload = function isDownload(table, column) {
		return hasAnnotation(table, column, 'file');
	};

	this.isGeoGDS = function isGeoGDS(table, column) {
		return hasAnnotation(table, column, 'geo_gds');
	};

	this.isGeoGSE = function isGeoGSE(table, column) {
		return hasAnnotation(table, column, 'geo_gse');
	};

	this.isHTML = function isHTML(table, column) {
		return hasAnnotation(table, column, 'html');
	};

	this.isText = function isText(table, column) {
		return !hasAnnotation(table, column, 'thumbnail') &&
		!hasAnnotation(table, column, '3dview') &&
		!hasAnnotation(table, column, 'zoomify') &&
		!hasAnnotation(table, column, 'file') &&
		!hasAnnotation(table, column, 'html');
	};

	this.isThumbnail = function isThumbnail(table, column) {
		return hasAnnotation(table, column, 'thumbnail');
	};
	
	this.isZoomify = function isZoomify(table, column) {
		return hasAnnotation(table, column, 'zoomify');
	};

	this.itemAssociate3dView = function itemAssociate3dView(table, row, column) {
		return getDenormalized3dView(table, row, column);
	};

	this.itemAssociateFile = function itemAssociateFile(table, row, column) {
		return getDenormalizedFile(table, row, column);
	};

	this.itemAssociateThumbnail = function itemAssociateThumbnail(table, row, column) {
		return getDenormalizedThumbnail(table, row, column);
	};

	this.itemDenormalizedValue = function itemDenormalizedValue(table, row, column, val) {
		return getItemDenormalizedValue(table, row, column, val);
	};

	this.openZoomify = function openZoomify(event, url) {
		window.open(url, '_blank');
	};

	this.setListClass = function setListClass(values) {
		return (values.length > 1) ? 'multi_values' : 'single_value';
	};
	
	this.setPreviewClass = function setPreviewClass() {
		return ($scope.FacetsData.viewer3dFile.length>0) ? 'preview' : 'no_preview';
	};

}]);
