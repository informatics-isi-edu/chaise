'use strict';

/* Controllers */

var ermSettingsController = angular.module('ermSettingsController', ['facetsModel', 'facetsService']);

//angular.module('ermrestApp').controller('SideBarCtrl', ['$scope', '$timeout', 'FacetsData', 'FacetsService',
ermSettingsController.controller('SettingsCtrl', ['$scope', '$filter', '$timeout', 'FacetsData', 'FacetsService', 'numberFilter', '$location',
                                                  function($scope, $filter, $timeout, FacetsData, FacetsService, numberFilter, $location)
{
    $scope.FacetsData = FacetsData;
    var catalogIds = [];
    $scope.FacetsData = FacetsData;
    if (catalogIds.length==0){
	$scope.FacetsData.showSelect = false;
	$('.sidebar-overlay').removeClass('active');
    }
    for (var i = 0; i < catalogIds.length; i++){
	$scope.FacetsData.catalogs[catalogIds[i]] = getCatalogPreview(catalogIds[i]);
    }

    this.sidebarClick = function sidebarClick(event, toggle, done) {
    	event.stopPropagation();
    	FacetsService.sidebarClick(toggle);
    	if (toggle == 'field-toggle' && done) {
        	FacetsService.sidebarClick('sidebar-toggle');
    	}
	}
    
	this.preventDefault = function preventDefault(event) {
		event.preventDefault();
	};

    	this.selectCatalog = function selectCatalog (catalogId){
	    $location.search("catalog", catalogId);
	    $scope.FacetsData.showSelect = false;
	    $('.sidebar-overlay').removeClass('active');
	 }

}]);
