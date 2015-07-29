'use strict';

/* Controllers */

var ermInitController = angular.module('ermInitController', ['facetsModel', 'facetsService']);

//angular.module('ermrestApp').controller('InitListCtrl', ['$scope', '$location', 'FacetsData',
ermInitController.controller('InitListCtrl', ['$scope', '$location', '$window', 'FacetsData', 'FacetsService', 'ermrest',
                                                      function($scope, $location, $window, FacetsData, FacetsService, ermrest) {
	
	$('footer').hide();
	$('.panel-collapse').on('hide.bs.collapse', function () {
	      $(this).prev('.panel-heading').find('.glyphicon').removeClass('glyphicon-minus').addClass('glyphicon-plus');
	});
	$('.panel-collapse').on('show.bs.collapse', function () {
	      $(this).prev('.panel-heading').find('.glyphicon').removeClass('glyphicon-plus').addClass('glyphicon-minus');
	});

	$('#attrsort').click(function(){
		if ($('span').hasClass("glyphicon-sort-by-attributes")) {
		$("#attrsort span.glyphicon").removeClass("glyphicon-sort-by-attributes").addClass("glyphicon-sort-by-attributes-alt");
		}
		else {
		$("#attrsort span.glyphicon").removeClass("glyphicon-sort-by-attributes-alt").addClass("glyphicon-sort-by-attributes");
		}
	});
	
	$('.sidebar-overlay').click(function(event) {
    	if (!$('#editfilter').hasClass('open') && $('.sidebar-overlay').hasClass('active')) {
	        $('.sidebar-overlay').removeClass('active');
    		if ($('#sidebar').hasClass('open')) {
    	        $('#sidebar').toggleClass('open');
    		} else if ($('#collectionsTree').hasClass('open')) {
    	        $('#collectionsTree').toggleClass('open');
    		}
    	}
	});


	if ($location.search()['schema'] != null) {
		SCHEMA = $location.search()['schema'];
	} else if (SCHEMA == null) {
		//SCHEMA = 'legacy';
	}
	if ($location.search()['catalog'] != null) {
		CATALOG = $location.search()['catalog'];
	} else if (CATALOG == null) {
		CATALOG = ermrest.catalog;
	}
	authnProvider = ermrest.authnProvider;
	
	$scope.FacetsData = FacetsData;
	
	FacetsService.initTable();

	if ($location.search()['table'] != null) {
		$scope.FacetsData.table = $location.search()['table'];
	} else {
		$scope.FacetsData.table = '';
	}

	if ($location.search()['filter'] != null) {
		$scope.FacetsData.filter = JSON.parse(decodeURIComponent($location.search()['filter']));
	} else {
		$scope.FacetsData.filter = null;
	}

	$window.addEventListener('popstate', function(event) {
    	event.stopPropagation();
		event.preventDefault();
		$scope.FacetsData.isDetail = false;
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	});

	$scope.FacetsData.location = $location;
	initApplication();
	
	this.hideSpinner = function hideSpinner() {
		//return !$scope.FacetsData.progress;
		return true;
	};
}]);
