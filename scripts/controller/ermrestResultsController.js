'use strict';

/* Controllers */

var ermResultsController = angular.module('ermResultsController', ['facetsModel', 'facetsService']);

//angular.module('ermrestApp').controller('ResultsListCtrl', ['$scope', '$timeout', '$sce', 'FacetsData', 'FacetsService',

ermResultsController.controller('ResultsListCtrl', ['$scope', '$window', '$timeout', '$sce', 'FacetsData', 'FacetsService',
                                                      function($scope, $window, $timeout, $sce, FacetsData, FacetsService) {

	$scope.FacetsData = FacetsData;
  $scope.chaiseConfig = chaiseConfig;

	$scope.predicate_search_all = function predicate_search_all() {
		FacetsService.setSortOption();
		$scope.FacetsData.pagingOptions.currentPage = 1;
		getErmrestData($scope.FacetsData, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	$scope.successSearchFacets = function successSearchFacets(data, totalItems, page, pageSize) {
		FacetsService.successSearchFacets(data, totalItems, page, pageSize);
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};

	$scope.successUpdateModels = function successUpdateModels() {
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		$scope.$broadcast('reCalcViewDimensions');
	};

	this.cantPageBackward = function cantPageBackward() {
		return $scope.FacetsData.pagingOptions.currentPage == 1;
	};

	this.canPageForward = function canPageForward() {
		return $scope.FacetsData.ermrestData.length > 0 && $scope.FacetsData.pagingOptions.currentPage < $scope.FacetsData.maxPages;
	};

    // Build ermrest predicate base on JSON params
    this.buildPredicate = function(keys, entity){
        // Build an array of predicates for the Ermrest Filter lanaguage
        var predicates = [];

        for (var i = 0; i< keys.length; i++){
            var key = keys[i];
            var predicate = encodeSafeURIComponent(key) + '=' + encodeSafeURIComponent(entity[key]);
            predicates.push(predicate);
        }
        // Join predicates with a conjunctive filter '&'
        return predicates.join('&');
    };

    // Returns the path for a given row
    this.rowPath = function(row){

    	var prefix = window.location.href;
    	var index = prefix.indexOf('#');
    	if (index != -1) {
    		prefix = prefix.substring(0, index);
    	}
		var detailPath = prefix.replace('/search/','/record/#') + CATALOG + '/' + SCHEMA + ':' +  $scope.FacetsData.table + '/' + this.buildPredicate(PRIMARY_KEY, row);
        return detailPath;
    };

	// "m" is the number of columns per row
	this.clicker = function clicker(event, row, m, index) {

		event.preventDefault();

        window.location.href = this.rowPath(row);
        return false;

		if (row == null) {
			$scope.FacetsData.details = false;
			$scope.FacetsData.entryRow = [];
			$scope.FacetsData.detailColumns = [];
			$scope.FacetsData.detailRows = [];
			$scope.FacetsData.textEntryRow = [];
			$scope.FacetsData.entry3Dview = '';
			$scope.FacetsData.entryTitle = '';
			$scope.FacetsData.entrySubtitle = '';
            $scope.FacetsData.tiles = [];
            $scope.FacetsData.files = [];
            $scope.FacetsData.viewer3dFile = [];
            $scope.FacetsData.externalReferenceRows = [];
		} else {
			$scope.FacetsData.entryRow = row;
			$scope.FacetsData.detailColumns = getDetailColumns(row);
			$scope.FacetsData.detailRows = getDetailRows(row, m);
			$scope.FacetsData.textEntryRow = getLongTextColumns(row);
			$scope.FacetsData.entryTitle = getEntryTitle(row);
			$scope.FacetsData.entrySubtitle = getEntrySubtitle(row);
			$scope.FacetsData.details = true;
			entityDenormalize(getEntityTable($scope.FacetsData), row, $scope.FacetsData.denormalizedView);
			entityLinearize($scope.FacetsData.denormalizedView, $scope.FacetsData.linearizeView);
            getDenormalizedFiles($scope.FacetsData.table, row, $scope.FacetsData.datasetFiles);
            $scope.FacetsData.tiles = getTilesLayout($scope.FacetsData.datasetFiles, 3);
            $scope.FacetsData.files = getFilesLayout($scope.FacetsData.datasetFiles);
            $scope.FacetsData.viewer3dFile = getViewer3d($scope.FacetsData.datasetFiles);
            $scope.FacetsData.externalReferenceRows = getReferenceRows($scope.FacetsData.linearizeView);
            $scope.FacetsData.isDetail = true;
            var isIE = /*@cc_on!@*/false || !!document.documentMode;
            if (!isIE) {
                //$window.history.pushState({'ermrest': 'detail'}, '', '');
            }
		}
	};

	this.delay_search_all = function delay_search_all() {
		if ($scope.FacetsData.filterSearchAllTimeout != null) {
			$timeout.cancel($scope.FacetsData.filterSearchAllTimeout);
		}
		$scope.FacetsData.filterSearchAllTimeout = $timeout(function(){$scope.predicate_search_all();}, 1000); // delay 1 s
	};

	this.display = function display(table, column) {
		return FacetsService.display(table, column);
	};

	this.viewColumns = function viewColumns(row, m, maxRows) {
		return getViewColumns(row, m, maxRows, $scope.FacetsData.table);
	}

	this.html = function html(table, column, data) {
		return FacetsService.html(table, column, data);
	};

	this.itemThumbnail = function itemThumbnail(row) {
		var ret = getEntryThumbnail(row);
		if (ret == null) {
			//ret = getAssociationThumbnail($scope.FacetsData.table, row);
			ret = getReferenceThumbnail($scope.FacetsData.table, row);
		}
		return ret;
	};

	this.itemTitle = function itemTitle(row) {
		return getEntryTitle(row);
	};

	this.titleName = function titleName() {
		return getTitleName();
	};

	this.tableColumns = function tableColumns(table_name, maxCols) {
		return getTableColumnsNames(table_name, maxCols);
	};

	this.lastRecord = function lastRecord() {
		var ret = $scope.FacetsData.pagingOptions.currentPage * $scope.FacetsData.pagingOptions.pageSize;
		if (ret > $scope.FacetsData.totalServerItems) {
			ret = $scope.FacetsData.totalServerItems;
		}
		return ret;
	};

	this.pageBackward = function pageBackward(event) {
		event.preventDefault();
		$scope.FacetsData.pagingOptions.currentPage = updatePageTag('backward', $scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap, $scope.FacetsData.tagPages, $scope.FacetsData.maxPages);
		setActivePage($scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap);
	};

	this.pageButton = function pageButton(page) {
		return $scope.FacetsData.pageMap[page];
	};

	this.pageForward = function pageForward(event) {
		event.preventDefault();
		$scope.FacetsData.pagingOptions.currentPage = updatePageTag('forward', $scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap, $scope.FacetsData.tagPages, $scope.FacetsData.maxPages);
		setActivePage($scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap);
	};

	this.pageInRange = function pageInRange(page) {
		return $scope.FacetsData.pageMap[page] <= $scope.FacetsData.maxPages;
	};

	this.pageToFirst = function pageToFirst(event) {
		event.preventDefault();
		$scope.FacetsData.pagingOptions.currentPage = 2;
		$scope.FacetsData.pagingOptions.currentPage = updatePageTag('backward', $scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap, $scope.FacetsData.tagPages, $scope.FacetsData.maxPages);
		setActivePage($scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap);
	};

	this.pageToLast = function pageToLast(event) {
		event.preventDefault();
		$scope.FacetsData.pagingOptions.currentPage = $scope.FacetsData.maxPages - 1;
		$scope.FacetsData.pagingOptions.currentPage = updatePageTag('forward', $scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap, $scope.FacetsData.tagPages, $scope.FacetsData.maxPages);
		setActivePage($scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap);
	};

	this.selectPage = function selectPage(event, page) {
		event.preventDefault();
		$scope.FacetsData.pagingOptions.currentPage = $scope.FacetsData.pageMap[page];
		setActivePage($scope.FacetsData.pagingOptions.currentPage, $scope.FacetsData.pageMap);
	};

	this.setActiveClass = function setActiveClass(index) {
		var ret = 'page-selector';
		if (index == 0) {
			ret += ' active';
		}
		return ret;
	};

	this.showResults = function showResults() {
		return !$scope.FacetsData.progress;
	};

	this.selectView = function selectView(event, view) {
		event.preventDefault();
		$scope.FacetsData.view = view;
		setBookmark($scope.FacetsData);
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	}

    this.sidebarClick = function sidebarClick(event, toggle, selection) {
    	event.stopPropagation();
    	if (toggle == 'collections-toggle') {
    		event.preventDefault();
    	}
    	if (selection) {
    		$scope.FacetsData.narrowFilter = $scope.FacetsData.searchFilter = '';
        	$.each($scope.FacetsData.facets, function(i, facet) {
        		if ($scope.FacetsData['sessionFilters'][facet['table']] != null && $scope.FacetsData['sessionFilters'][facet['table']].contains(facet['name'])) {
        			$scope.FacetsData.chooseColumns[facet['table']][facet['name']] = true;
        		} else {
        			$scope.FacetsData.chooseColumns[facet['table']][facet['name']] = false;
        		}
        		if ($scope.if_type(facet, 'enum')) {
        			$scope.FacetsData.searchFilterValue[facet['table']][facet['name']] = '';
        		}
        	});
    	}
    	FacetsService.sidebarClick(toggle);
	}

	this.preventDefault = function preventDefault(event) {
		event.preventDefault();
	};

	this.displayTreeCount = function displayTreeCount(data) {
		var ret = '';
		if (data != null && data.count > 0) {
			ret = '(' + data.count + ')';
		}
		return ret;
	};

	this.if_type = $scope.if_type = function if_type(facet, facet_type) {
		return FacetsService.if_type(facet, facet_type);
	};

	this.showFacetValues = $scope.showFacetValues  = function showFacetValues(facet, facet_type) {
		return FacetsService.showFacetValues(facet, facet_type);
	};

	this.getFacetValues = $scope.getFacetValues = function getFacetValues(facet) {
		return FacetsService.getFacetValues(facet);
	};

	this.displayTitle = function displayTitle(facet) {
		return FacetsService.displayTitle(facet);
	};

	this.hasFilters = $scope.hasFilters = function hasFilters() {
		var ret = false;
		$.each($scope.FacetsData.facets, function(i, facet) {
			if ($scope.FacetsData.colsDescr[facet['table']] != null && $scope.FacetsData.colsDescr[facet['table']][facet['name']] != null) {
				var facet_type = $scope.FacetsData.colsDescr[facet['table']][facet['name']]['type'];
				if ($scope.if_type(facet, 'slider')) {
					facet_type = 'slider';
				} else if ($scope.if_type(facet, 'text')) {
					facet_type = 'text';
				}
				ret = $scope.showFacetValues(facet, facet_type);
				if (ret) {
					return false;
				}
			}
		});

		return ret;
	};

	this.setFilterClass = function setFilterClass() {
		return $scope.hasFilters() ? 'filter-bg-hide' : 'filter-bg';
	};

  this.removeFilter = function removeFilter(event, facet) {
  	//event.stopPropagation();
  	event.preventDefault();
  	if ($scope.if_type(facet, 'slider')) {
  		$scope.FacetsData.box[facet['table']][facet['name']]['min'] = $scope.FacetsData.box[facet['table']][facet['name']]['floor'];
  		$scope.FacetsData.box[facet['table']][facet['name']]['max'] = $scope.FacetsData.box[facet['table']][facet['name']]['ceil'];
  		$scope.delay_slider(facet);
  	} else if ($scope.if_type(facet, 'text')) {
  		$scope.FacetsData.box[facet['table']][facet['name']]['value'] = '';
  		$scope.delay_predicate(facet, event.keyCode);
  	} else if ($scope.if_type(facet, 'enum')) {
  		$.each($scope.FacetsData.box[facet['table']][facet['name']]['values'], function(key, value) {
  			$scope.FacetsData.box[facet['table']][facet['name']]['values'][key] = false;
  		});
  		$scope.predicate_checkbox(facet);
  	}
	};

	$scope.predicate_slider = function predicate_slider(facet) {
    	FacetsService.predicate_slider(facet, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	$scope.predicate = function predicate(facet,keyCode) {
    	FacetsService.predicate(facet, keyCode, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.delay_slider = $scope.delay_slider = function delay_slider(facet) {
		if ($scope.FacetsData.filterSliderTimeout != null) {
			$timeout.cancel($scope.FacetsData.filterSliderTimeout);
		}
		$scope.FacetsData.filterSliderTimeout = $timeout(function(){$scope.predicate_slider(facet);}, 1); // delay 1 ms
	};

	this.delay_predicate = $scope.delay_predicate = function delay_predicate(facet,keyCode) {
		if ($scope.FacetsData.filterTextTimeout != null) {
			$timeout.cancel($scope.FacetsData.filterTextTimeout);
		}
		$scope.FacetsData.filterTextTimeout = $timeout(function(){$scope.predicate(facet,keyCode);}, 1000); // delay 1000 ms
	};

	this.showFacetValue = function showFacetValue(facet, value) {
		return ($scope.FacetsData.colsGroup[facet['table']][facet['name']][value] == 0 && !$scope.FacetsData.box[facet['table']][facet['name']]['values'][value]);
	};

	this.predicate_checkbox = $scope.predicate_checkbox = function predicate_checkbox(facet) {
		FacetsService.predicate_checkbox(facet, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.showChiclet = $scope.showChiclet  = function showChiclet(facet) {
		return FacetsService.showChiclet(facet);
	};

	$scope.slideFilter = function slideFilter(event, toggle, tag) {
		//event.preventDefault();
		$scope.FacetsData.tag = tag;
		emptyJSON($scope.FacetsData.facetPreviousValues);
    	if ($scope.if_type($scope.FacetsData.tag, 'slider')) {
    		$scope.FacetsData.facetPreviousValues['min'] = $scope.FacetsData.box[tag['table']][tag['name']]['min'];
    		$scope.FacetsData.facetPreviousValues['max'] = $scope.FacetsData.box[tag['table']][tag['name']]['max'];
    	} else if ($scope.if_type($scope.FacetsData.tag, 'text')) {
    		$scope.FacetsData.facetPreviousValues['value'] = $scope.FacetsData.box[tag['table']][tag['name']]['value'];
    	} else if ($scope.if_type($scope.FacetsData.tag, 'enum')) {
    		var values = {};
    		$.each($scope.FacetsData.box[tag['table']][tag['name']]['values'], function(key, value) {
    			values[key] = value;
    		});
    		$scope.FacetsData.facetPreviousValues['values'] = values;
    	}
    	FacetsService.sidebarClick(toggle);
    	if (toggle == 'field-toggle') {
    		setTimeout(function () {
    			if (!$scope.$$phase) {
    				$scope.$apply();
    			}
    			$scope.$broadcast('reCalcViewDimensions');
    		}, 1000);
    	}
	};

	this.editFacet = function editFacet(event, facet) {
    	event.preventDefault();
		setTimeout(function () {
			$('#filterButton').click();
			setTimeout(function () {
				$scope.slideFilter(null, 'field-toggle', facet);
			}, 1);
		}, 1);
		//alert(facet['display']);
	};

	this.display = $scope.display = function display(table, column, row) {
		return (row != null && Object.keys(row[0]).length > 3) ? getTableLabelName(table) : FacetsService.display(table, column);
	};

	this.setViewClass = function setViewClass() {
		var ret = '';
		if ($scope.FacetsData.view == 'list') {
			ret = 'md-view-list md-lg';
		} else if ($scope.FacetsData.view == 'table') {
			ret = 'md-view-column md-lg';
		} else if ($scope.FacetsData.view == 'card') {
			ret = 'md-view-module md-lg';
		}
		return ret;
	};

  this.urlBookmark = function urlBookmark() {
    return $scope.FacetsData.bookmark;
  };

	this.isUrl = function isUrl(table, column) {
		return hasAnnotation(table, column, 'url');
	};

	this.urlLink = function urlLink(table, column, value) {
		var ret = [];
		if (value != null) {
			var values = value.split(',');
			$.each(values, function(i, val) {
				var vals = [];
				vals.push(val);
				var urlPattern = getUrlPattern(table, column, 'url_pattern');
				if (urlPattern != null) {
					val = urlPattern.replace('{value}', val);
				}
				vals.push(val);
				ret.push(vals);
			});
		}
		return ret;
	};

	this.displayRange = function displayRange() {
		return (FacetsData.ermrestData.length == 0) ? '0-0' : '1-'+$scope.FacetsData.ermrestData.length;
	};

  this.hasSelectedFacets = function hasSelectedFacets() {
    var selectedFacets = false;
    $.each($scope.FacetsData.box, function(table, columns) {
      var colsDescr = $scope.FacetsData['colsDescr'][table];
      $.each(columns, function(key, value) {
        if(searchBoxPresentation.contains(colsDescr[key]['type'])) {
          if (value['value'] != '') {
            selectedFacets = true;
            return false;
          }
        }
        else if (colsDescr[key]['type'] == 'enum') {
            if (value['values'] != null) {
              $.each(value['values'], function(checkbox_key, checkbox_value) {
                if(checkbox_value) {
                  selectedFacets = true;
                  return true;
                }
              });
            }
        }
        else if (sliderPresentation.contains(colsDescr[key]['type']) || datepickerPresentation.contains(colsDescr[key]['type'])) {
            if (!hasAnnotation(table, key, 'download')) {
              if (value['left']) {
                selectedFacets = true;
                return true;
              }
              if (value['right']) {
                selectedFacets = true;
                return true;
              }
            }
        }
      });
    });
    return selectedFacets;
  };

  this.resetSearch = function resetSearch() {
    // Reset the search box
    $scope.FacetsData.searchFilter = '';
    this.clear();
    // Reset selected facets & search again
    $.each($scope.FacetsData.box, function(table, columns) {
      var colsDescr = $scope.FacetsData['colsDescr'][table];
      $.each(columns, function(key, value) {
        if(searchBoxPresentation.contains(colsDescr[key]['type'])) {
          if (value['value'] != '') {
            value['value'] = '';
          }
        }
        else if (colsDescr[key]['type'] == 'enum') {
            if (value['values'] != null) {
              $.each(value['values'], function(checkbox_key, checkbox_value) {
                if(checkbox_value) {
                  value['values'][checkbox_key] = false;
                }
              });
            }
        }
        else if (sliderPresentation.contains(colsDescr[key]['type']) || datepickerPresentation.contains(colsDescr[key]['type'])) {
            if (!hasAnnotation(table, key, 'download')) {
              if (value['left']) {
                delete value['left'];
              }
              if (value['right']) {
                delete value['right'];
              }
              value['min'] = value['floor'];
              value['max'] = value['ceil'];
            }
        }
      });
    });
    $scope.predicate_search_all();
    // Resets sidebar view to top-level facet view
    $('#morefilters.open,#editfilter.open,#collectionsTree.open').removeClass('open');
  };

  this.clear = $scope.clear = function clear() {
		$scope.FacetsData.narrowFilter = '';
    	$.each($scope.FacetsData.facets, function(i, facet) {
    		if ($scope.FacetsData['sessionFilters'][facet['table']] != null && $scope.FacetsData['sessionFilters'][facet['table']].contains(facet['name'])) {
    			$scope.FacetsData.chooseColumns[facet['table']][facet['name']] = true;
    		} else {
    			$scope.FacetsData.chooseColumns[facet['table']][facet['name']] = false;
    		}
    		if ($scope.if_type(facet, 'enum') || $scope.if_type(facet, 'date')) {
    			$scope.FacetsData.searchFilterValue[facet['table']][facet['name']] = '';
    		}
    	});
    	$scope.FacetsData.narrowFilter = '';
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};

}]);
