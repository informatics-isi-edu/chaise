'use strict';

/* Controllers */

var ermSelectController = angular.module('ermSelectController', ['facetsModel', 'facetsService']);

//angular.module('ermrestApp').controller('ResultsListCtrl', ['$scope', '$timeout', '$sce', 'FacetsData', 'FacetsService',
ermSelectController.controller('SelectCtrl', ['$scope', '$window', '$timeout', '$sce', 'FacetsData', 'FacetsService', '$location',
                                                      function($scope, $window, $timeout, $sce, FacetsData, FacetsService, $location) {

	//TODO: GET THIS FROM ERMREST EVENTUALLY
	var catalogIds = [1,2];

	$scope.FacetsData = FacetsData;
	if (catalogIds.length==0){
	    $scope.FacetsData.showSelect = false;
	    $('.sidebar-overlay').removeClass('active');
	}

	for (var i = 0; i < catalogIds.length; i++){
	    $scope.FacetsData.catalogs[catalogIds[i]] = getCatalogPreview(catalogIds[i]);
	}
							  
	this.selectorClose = function selectorClose (){
	    $scope.FacetsData.showSelect = false;
	     $('.sidebar-overlay').removeClass('active');
	}

	this.selectCatalog = function selectCatalog (catalogId){
	    $location.search("catalog", catalogId);
	    $scope.FacetsData.showSelect = false;
	    $('.sidebar-overlay').removeClass('active');
	 }
							  
}]);

