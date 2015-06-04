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

	this.display = $scope.display = function display(table, column, row) {
		return (row != null && Object.keys(row[0]).length > 3) ? getTableLabelName(table) : FacetsService.display(table, column);
	};

	this.displayTableName = function displayTableName(table) {
		return getTableLabelName(table);
	};

	this.displayTable = $scope.displayTable = function displayTable(table) {
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

	this.isAttribute = function isAttribute(table, column, row) {
		return Object.keys(row).length == 3 && !hasAnnotation(table, column, 'dataset') && !hasAnnotation(table, column, 'image') && 
			!hasAnnotation(table, column, 'preview') && !hasAnnotation(table, column, 'download') && 
			!hasAnnotation(table, column, 'geo_gds') && !hasAnnotation(table, column, 'geo_gse');
	};
	
	this.isMultiAttribute = function isMultiAttribute(table, column, row) {
		return Object.keys(row).length > 3;
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
		!hasAnnotation(table, column, 'html') &&
		!hasAnnotation(table, column, 'url');
	};

	this.isThumbnail = function isThumbnail(table, column) {
		return hasAnnotation(table, column, 'thumbnail');
	};
	
	this.isUrl = function isUrl(table, column) {
		return hasAnnotation(table, column, 'url');
	};
	
	this.isZoomify = function isZoomify(table, column) {
		return hasAnnotation(table, column, 'zoomify');
	};

	this.itemAssociate3dView = function itemAssociate3dView(table, row, column) {
		return getDenormalized3dView(table, row, column, $scope.FacetsData.table);
	};

	this.itemAssociateFile = function itemAssociateFile(table, row, column) {
		return getDenormalizedFile(table, row, column, $scope.FacetsData.table);
	};

	this.itemAssociateThumbnail = function itemAssociateThumbnail(table, row, column) {
		return getDenormalizedThumbnail(table, row, column, $scope.FacetsData.table);
	};

	this.itemDenormalizedValue = function itemDenormalizedValue(table, row, column, val) {
		return getItemDenormalizedValue(table, row, column, val, $scope.FacetsData.table);
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

	this.isNested = function isNested(table, values) {
		return values.length > 0 && !hasTableAnnotation(table, 'association');
	};

	this.isGEO = function isGEO(table) {
		return hasTableAnnotation(table, 'geo');
	};

	this.isReference = function isReference(table) {
		return hasTableAnnotation(table, 'reference');
	};

	this.isAssociation = function isAssociation(table, values) {
		return values.length > 0 && hasTableAnnotation(table, 'association') && 
			!hasTableAnnotation(table, 'image') && !hasTableAnnotation(table, 'viewer') && 
			!hasTableAnnotation(table, 'preview') && !hasTableAnnotation(table, 'download');
	};

	this.isMultiColumn = function isMultiColumn(table, column) {
		return !hasAnnotation(table, column, 'dataset');
	};
	
	this.setEntityDetailClass = function setEntityDetailClass() {
		return 'entity_detail';
	};
	
	this.showDetail = function showDetail() {
		return $scope.FacetsData.isDetail;
	};

	this.goBack = function goBack() {
        var isIE = /*@cc_on!@*/false || !!document.documentMode;
        if (!isIE) {
    		window.history.back();
        } else {
    		$scope.FacetsData.isDetail = false;
        }
	};

	this.isAssociationAttribute = function isAssociationAttribute(table, column) {
		return !hasAnnotation(table, column, 'dataset') && !hasAnnotation(table, column, 'image') && 
		!hasAnnotation(table, column, 'preview') && !hasAnnotation(table, column, 'download');
	};
	
	this.isCommonAttribute = function isCommonAttribute(table, column) {
		return !hasAnnotation(table, column, 'dataset') && !hasAnnotation(table, column, 'image') && !hasAnnotation(table, column, 'preview') &&
                        !hasAnnotation(table, column, 'download') && !hasAnnotation(table, column, 'url') &&
                        !hasAnnotation(table, column, 'geo_gds') && !hasAnnotation(table, column, 'geo_gse');
	};
	
	this.isMultipleAttribute = function isMultipleAttribute(row) {
		return Object.keys(row).length > 3;
	};
	
	this.referenceColumns = function referenceColumns(table, row) {
		var ret = [];
		$.each(row, function(column, val) {
			if (column != '$$hashKey' && !hasAnnotation(table, column, 'dataset') && !hasAnnotation(table, column, 'url')) {
				ret.push(column);
			}
		});
		return ret;
	};
	
	this.urlLink = function urlLink(table, column, value) {
		var ret = value;
		var urlPattern = getUrlPattern(table, column, 'url_pattern');
		if (urlPattern != null) {
			ret = urlPattern.replace('{value}', value);
		}
		return ret;
	};
	
}]);
