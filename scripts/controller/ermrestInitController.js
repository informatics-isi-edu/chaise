'use strict';

/* Controllers */

var ermInitController = angular.module('ermInitController', ['facebaseModel']);

//angular.module('ermrestApp').controller('InitListCtrl', ['$scope', '$location', 'FacebaseData',
ermInitController.controller('InitListCtrl', ['$scope', '$location', 'FacebaseData',
                                                      function($scope, $location, FacebaseData) {
	
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
	
	if ($location.search()['schema'] != null) {
		SCHEMA = $location.search()['schema'];
	} else if (SCHEMA == null) {
		SCHEMA = 'legacy';
	}
	if ($location.search()['catalog'] != null) {
		CATALOG = $location.search()['catalog'];
	} else if (CATALOG == null) {
		CATALOG = 1;
	}
	
	initApplication();
	
	$scope.FacebaseData = FacebaseData;
	
	if ($location.search()['table'] != null) {
		$scope.FacebaseData.table = $location.search()['table'];
	}
	
	this.hideSpinner = function hideSpinner() {
		return true;
	};

}]);
