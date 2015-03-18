//'use strict';

/* Service Module */

var facetsService = angular.module('facetsService', ['facetsModel']);

//angular.module('ermrestApp').service('FacetsService', ['$sce', 'FacetsData', function($sce, FacetsData) {
facetsService.service('FacetsService', ['$sce', 'FacetsData', function($sce, FacetsData) {
	this.closeModal = function (event) {
		FacetsData.spinner[FacetsData.modalIndex] = false;
	};
	
	this.display = function (table, column) {
		return COLUMNS_ALIAS[table] != null ? COLUMNS_ALIAS[table][column] : '';
	};
	
	this.html = function (table, column, data) {
		return hasAnnotation(table, column, 'html') ? $sce.trustAsHtml(data) : data;
	};
	
	this.setSortOption = function () {
		var sortOption = FacetsData.sortInfo;
		if (sortOption != null && sortOption['fields'].length > 1) {
			sortOption = null;
		}
		FacetsData['sortOption'] = sortOption;
	};
	
	this.successSearchFacets = function (data, totalItems, page, pageSize) {
		FacetsData.ermrestData = data;
		FacetsData.collectionsPredicate = getCollectionsPredicate(FacetsData.entityPredicates, FacetsData);
		FacetsData.totalServerItems = totalItems;
		if (FacetsData.selectedEntity != null) {
			FacetsData.selectedEntity['count'] = totalItems;
		}
		FacetsData.maxPages = Math.floor(FacetsData.totalServerItems/FacetsData.pagingOptions.pageSize);
		if (FacetsData.totalServerItems%FacetsData.pagingOptions.pageSize != 0) {
			FacetsData.maxPages++;
		}
	};
	
	this.initTable = function () {
		$('footer').hide();
		$('#headerSearch').val('');
		FacetsData.ready = false;
		FacetsData.moreFlag = false;
		FacetsData.filterTextTimeout = null;
		FacetsData.filterSliderTimeout = null;
		FacetsData.filterSearchAllTimeout = null;
		FacetsData.totalServerItems = 0;
		FacetsData.filterAllText = '';
		FacetsData.sortColumns = [''];
		FacetsData.pageRange = [];
		FacetsData.pageMap = {};
		FacetsData.maxPages = 0;
		FacetsData.sortFacet = '';
		FacetsData.sortDirection = 'asc';
		FacetsData.details = false;
		FacetsData.entryRow = [];
		FacetsData.detailColumns = [];
		FacetsData.detailRows = [];
		FacetsData.textEntryRow = [];
		FacetsData.entry3Dview = '';
		FacetsData.entryTitle = '';
		FacetsData.entrySubtitle = '';
		this.initPageRange();
        FacetsData.spinner = [];
        FacetsData.modalIndex = -1;
		clearFacets(FacetsData);
	};
	
	this.initPageRange = function () {
	    for (var i = 1; i <= FacetsData.tagPages; i++) {
	    	FacetsData.pageRange.push(i);
	    	FacetsData.pageMap[i] = i;
	    }
	};
	
	this.sidebarClick = function (toggle) {
	    var overlay = $('.sidebar-overlay');
	    
	    if (toggle == 'sidebar-toggle') {
	        var sidebar = $('#sidebar');
	        sidebar.toggleClass('open');
	        if (sidebar.hasClass('sidebar-fixed-right') && sidebar.hasClass('open')) {
	            overlay.addClass('active');
	        } else {
	            overlay.removeClass('active');
	        }
	    } else if (toggle == 'field-toggle') {
	        var sidebar = $('#editfilter');
	        sidebar.toggleClass('open');
	        if (sidebar.hasClass('sidebar-fixed-right') && sidebar.hasClass('open')) {
	            //overlay.addClass('active');
	        } else {
	            //overlay.removeClass('active');
	        }
	    } else if (toggle == 'collections-toggle') {
	        var sidebar = $('#collectionsTree');
	        sidebar.toggleClass('open');
	        if (sidebar.hasClass('sidebar-fixed-right') && sidebar.hasClass('open')) {
	            overlay.addClass('active');
	        } else {
	            overlay.removeClass('active');
	        }
	    }
	};
	
}]);
