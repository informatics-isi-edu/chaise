'use strict';

/* Controllers */

var ermSideBarController = angular.module('ermSideBarController', ['facetsModel', 'facetsService']);

//angular.module('ermrestApp').controller('SideBarCtrl', ['$scope', '$timeout', 'FacetsData', 'FacetsService',
ermSideBarController.controller('SideBarCtrl', ['$scope', '$filter', '$timeout', 'FacetsData', 'FacetsService', 'numberFilter',
                                                      function($scope, $filter, $timeout, FacetsData, FacetsService, numberFilter) {

    $scope.FacetsData = FacetsData;
    $scope.filtersStatus = {};
    $scope.filtersMatch = {};
    $scope.selectedCollection = '';
    $scope.requestCounter = 0;
    $scope.chaiseConfig = chaiseConfig;
    $('[data-toggle="tooltip"]').tooltip();
  	$scope.translate = function(value)
	{
	    return numberFilter(value);
	}

  	$scope.hashHasChanged = function hashHasChanged(event) {
  		if (!assignBookmark) {
	  	  	var searchQuery = getSearchQuery(event.newURL);
	  	  	if (searchQuery['entity'] != null) {
	  	  		var values = searchQuery['entity'].split(':');
	  	  		searchQuery['schema'] = decodeURIComponent(values[0]);
	  	  		searchQuery['table'] = decodeURIComponent(values[1]);
	  	  	}
	  	  	if (searchQuery['schema'] != null) {
	  	  		SCHEMA = searchQuery['schema'];
	  	  	}
	  	  	if (searchQuery['catalog'] != null) {
	  	  		CATALOG = searchQuery['catalog'];
	  	  	}
	  	  	if (searchQuery['table'] != null) {
	  	  		$scope.FacetsData.table = searchQuery['table'];
	  	  	}
	  	  	if (searchQuery['page'] != null) {
	  	  		$scope.FacetsData.bookmarkPage = searchQuery['page'];
	  	  	}
	  	  	if (searchQuery['facets'] != null) {
	  	  		$scope.FacetsData.filter = decodeFilter(searchQuery['facets']);
	  	  	}
	  	  	if (searchQuery['layout'] != null) {
	  	  		$scope.FacetsData.view = searchQuery['layout'];
	  	  	}
	  		$.each($scope.FacetsData.box, function(table,columns) {
	  			var colsDescr = $scope.FacetsData['colsDescr'][table];
	  			$.each(columns, function(key, value) {
	  				if (searchBoxPresentation.contains(colsDescr[key]['type'])) {
	  					columns[key]['value'] = '';
	  				} else if (colsDescr[key]['type'] == 'enum') {
	  					if (value['values'] != null) {
	  						$.each(value['values'], function(checkbox_key, checkbox_value) {
	  							value['values'][checkbox_key] = false;
	  						});
	  					}
	  				} else if (sliderPresentation.contains(colsDescr[key]['type']) || datepickerPresentation.contains(colsDescr[key]['type'])) {
	  					if (!hasAnnotation(table, key, 'hidden') && !hasAnnotation(table, key, 'download')) {
	  						if (value['left']) {
	  							delete columns[key]['left'];
	  						}
	  						if (value['right']) {
	  							delete columns[key]['right'];
	  						}
	  						columns[key]['min'] = columns[key]['floor'];
	  						columns[key]['max'] = columns[key]['ceil'];
	  					}
	  				}
	  			});
	  		});
			if ($scope.FacetsData.filter != null) {
				$.each($scope.FacetsData.filter, function(table, columns) {
					$.each(columns, function(column, values) {
						$.each(values, function(key, value) {
							$scope.FacetsData.box[table][column][key] = value;
						});
					});
				});
			}
			$scope.FacetsData.filter = null;
			suppressBookmark = true;
			getErmrestData($scope.FacetsData, $scope.successSearchFacets, $scope.successUpdateModels);
			if ($scope.FacetsData.bookmarkPage != null) {
	    		setTimeout(function () {
	    			$scope.morePage();
	    		}, 200);
			} else {
				suppressBookmark = false;
			}
 		}
  	};

    window.onhashchange = $scope.hashHasChanged;

  $scope.predicate_search_all = function predicate_search_all() {
    FacetsService.setSortOption();
    $scope.FacetsData.pagingOptions.currentPage = 1;
    getErmrestData($scope.FacetsData, $scope.successSearchFacets, $scope.successUpdateModels);
  };

	this.slideFilter = function slideFilter(event, toggle, tag) {
		event.preventDefault();
		$scope.FacetsData.tag = tag;
		emptyJSON($scope.FacetsData.facetPreviousValues);
		if ($scope.if_type($scope.FacetsData.tag, 'slider')) {
			$scope.FacetsData.facetPreviousValues['min'] = $scope.FacetsData.box[tag['table']][tag['name']]['min'];
			$scope.FacetsData.facetPreviousValues['max'] = $scope.FacetsData.box[tag['table']][tag['name']]['max'];
		} else if ($scope.if_type($scope.FacetsData.tag, 'date')) {
			$scope.FacetsData.facetPreviousValues['min'] = $scope.FacetsData.box[tag['table']][tag['name']]['min'];
			$scope.FacetsData.facetPreviousValues['max'] = $scope.FacetsData.box[tag['table']][tag['name']]['max'];

			// Replaces hyphens with forward slashes in dates so Angular-Datepicker will display default date correctly
			this.formatDefaultDatepickerDate = function formatDefaultDatepickerDate(date) {
				return date.replace(/-/g, '/');
			}

			$scope.defaultMinDate = this.formatDefaultDatepickerDate($scope.FacetsData.box[tag['table']][tag['name']]['min']);
			$scope.defaultMaxDate = this.formatDefaultDatepickerDate($scope.FacetsData.box[tag['table']][tag['name']]['max']);

			//Offsetting Angular-Datepicker's date-max-limit attr by 2 days so that users can pick the max-limit date itself as well
			this.adjustMaxDate = function adjustMaxDate(date) {
				var newDate = new Date(date);
				newDate = newDate.setDate(newDate.getDate() + 2);
				newDate = $filter('date')(newDate, 'yyyy-MM-dd');
				return newDate;
			}

			$scope.floorDate = this.adjustMaxDate($scope.FacetsData.box[tag['table']][tag['name']]['ceil']);

		} else if ($scope.if_type($scope.FacetsData.tag, 'text')) {
    		$scope.FacetsData.facetPreviousValues['value'] = $scope.FacetsData.box[tag['table']][tag['name']]['value'];
    	} else if ($scope.if_type($scope.FacetsData.tag, 'enum')) {
			var values = {};
    		$.each($scope.FacetsData.box[tag['table']][tag['name']]['values'], function(key, value) {
    			values[key] = value;
    		});
    		$scope.FacetsData.facetPreviousValues['values'] = values;
    	}

		//alert(JSON.stringify($scope.FacetsData.box[tag['table']][tag['name']], null, 4));
		//alert(JSON.stringify($scope.FacetsData.facetPreviousValues, null, 4));
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

    this.editFilterDone = function editFilterDone(event, toggle, done) {
    	event.stopPropagation();
    	if (!done) {
    		event.preventDefault();
    	}
    	if ($scope.if_type($scope.FacetsData.tag, 'slider')) {
    		if ($scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['min'] != $scope.FacetsData.facetPreviousValues['min'] ||
    				$scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['max'] != $scope.FacetsData.facetPreviousValues['max'] ||
    				$scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['min'] == $scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['max']) {
        		//$scope.delay_slider($scope.FacetsData.tag);
    		}
    	} else if ($scope.if_type($scope.FacetsData.tag, 'text')) {
			if ($scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['value'] != $scope.FacetsData.facetPreviousValues['value']) {
				//$scope.delay_predicate($scope.FacetsData.tag, event.keyCode);
			}
		} else if ($scope.if_type($scope.FacetsData.tag, 'date')) {
			if ($scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['min'] != $scope.FacetsData.facetPreviousValues['min'] ||
				$scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['max'] != $scope.FacetsData.facetPreviousValues['max'] ||
				$scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['min'] == $scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['max']) {
				//$scope.delay_slider($scope.FacetsData.tag);
			}
		} else if ($scope.if_type($scope.FacetsData.tag, 'enum')) {
    		var hasChanged = false;
    		$.each($scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['values'], function(key, value) {
    			hasChanged = $scope.FacetsData.facetPreviousValues['values'][key] == null && value ||
    				$scope.FacetsData.facetPreviousValues['values'][key] != null && $scope.FacetsData.facetPreviousValues['values'][key] != value;
    			if (hasChanged) {
    				return false;
    			}
    		});
    		if (hasChanged) {
        		//$scope.predicate_checkbox($scope.FacetsData.tag);
    		}
    	}
    	FacetsService.sidebarClick(toggle);
    	if (done) {
        	FacetsService.sidebarClick('sidebar-toggle');
    	}
	}

    this.removeFilter = function removeFilter(event, facet) {
    	//event.stopPropagation();
    	event.preventDefault();
    	if ($scope.if_type(facet, 'slider')) {
    		$scope.FacetsData.box[facet['table']][facet['name']]['min'] = $scope.FacetsData.box[facet['table']][facet['name']]['floor'];
    		$scope.FacetsData.box[facet['table']][facet['name']]['max'] = $scope.FacetsData.box[facet['table']][facet['name']]['ceil'];
    	} else if ($scope.if_type(facet, 'text')) {
    		$scope.FacetsData.box[facet['table']][facet['name']]['value'] = '';
		} else if ($scope.if_type(facet, 'date')) {
			$scope.FacetsData.box[facet['table']][facet['name']]['min'] = $scope.FacetsData.box[facet['table']][facet['name']]['floor'];
			$scope.FacetsData.box[facet['table']][facet['name']]['max'] = $scope.FacetsData.box[facet['table']][facet['name']]['ceil'];
    	} else if ($scope.if_type(facet, 'enum')) {
    		var hasChanged = false;
    		$.each($scope.FacetsData.box[facet['table']][facet['name']]['values'], function(key, value) {
    			$scope.FacetsData.box[facet['table']][facet['name']]['values'][key] = false;
    		});
    	}
	}

    // Function from Filters

	this.displayMore = function displayMore(event) {
		event.preventDefault();
		$scope.FacetsData.moreFlag = !$scope.FacetsData.moreFlag;
	};

	this.showFacetCount = function showFacetCount(facet) {
		return FacetsService.showFacetCount(facet);
	};

	this.showFacetMatch = function showFacetMatch(facet) {
		var ret = ($scope.FacetsData.searchFilter.length > 0) && (new RegExp($scope.FacetsData.searchFilter, 'i')).test(facet['display']) &&
			($scope.FacetsData.box[facet['table']][facet['name']]['facetcount'] > 0 ||
					$scope.FacetsData.colsDescr[facet['table']][facet['name']]['type'] == 'enum' && hasCheckedValues($scope.FacetsData.box, facet) ||
					$scope.FacetsData.colsDescr[facet['table']][facet['name']]['type'] == 'date' && hasCheckedValues($scope.FacetsData.box, facet));
		if (ret) {
			$scope.FacetsData.searchFilterValue[facet['table']][facet['name']] = '';
			if ($scope.filtersMatch[facet['table']] == null) {
				$scope.filtersMatch[facet['table']] = [];
			}
			if (!$scope.filtersMatch[facet['table']].contains(facet['name'])) {
				$scope.filtersMatch[facet['table']].push(facet['name']);
				$scope.FacetsData.chooseColumns[facet['table']][facet['name']] = true;
			}
		}
		return ret;
	};

	this.hide = function hide(facet) {
		return false;
	};

	this.if_type = $scope.if_type = function if_type(facet, facet_type) {
		return FacetsService.if_type(facet, facet_type);
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

	$scope.success_search_filters = function success_search_filters(data, textStatus, jqXHR) {
    	$.each($scope.FacetsData.facets, function(i, facet) {
    		if ($scope.FacetsData.enabledFilters[facet['table']] != null && $scope.FacetsData.enabledFilters[facet['table']].contains([facet['name']])) {
    			$scope.FacetsData.chooseColumns[facet['table']][facet['name']] = true;
    		} else {
    			$scope.FacetsData.chooseColumns[facet['table']][facet['name']] = false;
    		}
    		if ($scope.if_type(facet, 'enum') || $scope.if_type(facet, 'date')) {
    			$scope.FacetsData.searchFilterValue[facet['table']][facet['name']] = $scope.FacetsData.searchFilter;
    		}
    	});
    	$scope.filtersMatch = {};
    	$scope.FacetsData.narrowFilter = $scope.FacetsData.searchFilter;
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};

	$scope.search_filters = function search_filters() {
		if ($scope.FacetsData.searchFilter != null && $scope.FacetsData.searchFilter.length == 0) {
			$scope.clear();
		} else {
			searchFilters($scope.FacetsData, $scope.success_search_filters);
		}
	};

	this.delay_search_filters = $scope.delay_search_filters = function delay_search_filters(keyCode) {
		if ($scope.FacetsData.searchFilterTimeout != null) {
			$timeout.cancel($scope.FacetsData.searchFilterTimeout);
		}
		$scope.FacetsData.searchFilterTimeout = $timeout(function(){$scope.search_filters(keyCode);}, 1000); // delay 1000 ms
	};

	this.showFacetValue = function showFacetValue(facet, value) {
		return ($scope.FacetsData.colsGroup[facet['table']][facet['name']][value] == 0 && !$scope.FacetsData.box[facet['table']][facet['name']]['values'][value]) ||
			($scope.FacetsData.searchFilterValue[facet['table']][facet['name']].length > 0 && !(new RegExp($scope.FacetsData.searchFilterValue[facet['table']][facet['name']], 'i')).test(value));
	};

	this.predicate_checkbox = $scope.predicate_checkbox = function predicate_checkbox(facet) {
		FacetsService.predicate_checkbox(facet, $scope.successSearchFacets, $scope.successUpdateModels);
	};

	this.expandCollapse = function expandCollapse(data, show) {
		data.expand = !data.expand;
		data.show = show;
	};

	$scope.initSortOption = function initSortOption() {
    	FacetsService.initSortOption();
	};

	$scope.successUpdateCount = function successUpdateCount() {
		$scope.FacetsData.ready = true;
		$('footer').show();
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		//console.log(JSON.stringify($scope.options, null, 4));
	};

	$scope.successInitModels = function successInitModels(done) {
		var ready = false;
		if (done) {
			ready = true;
			$scope.requestCounter = 0;
		} else {
			if ($scope.requestCounter > 0) {
				ready = true;
				$scope.requestCounter = 0;
			} else {
				$scope.requestCounter++;
			}
		}
		if (!ready) {
			return;
		}
		updateCount($scope.FacetsData, $scope.successUpdateCount);
		var sessionFilters = $scope.FacetsData['sessionFilters'];
		emptyJSON(sessionFilters);
    	$.each($scope.FacetsData.facets, function(i, facet) {
    		if ($scope.FacetsData.chooseColumns[facet['table']] != null && $scope.FacetsData.chooseColumns[facet['table']][facet['name']]) {
    			if (sessionFilters[facet['table']] == null) {
    				sessionFilters[facet['table']] = [];
    			}
    			sessionFilters[facet['table']].push(facet['name']);
    		}
    	});
		if (!$scope.$$phase) {
			$scope.$apply();
		}

		if ($scope.FacetsData.filter != null) {
			$.each($scope.FacetsData.filter, function(table, columns) {
				$.each(columns, function(column, values) {
					$.each(values, function(key, value) {
						$scope.FacetsData.box[table][column][key] = value;
					});
				});
			});
			$scope.FacetsData.filter = null;
			getErmrestData($scope.FacetsData, $scope.successSearchFacets, $scope.successUpdateModels);
			if ($scope.FacetsData.bookmarkPage != null) {
	    		setTimeout(function () {
	    			$scope.morePage();
	    		}, 200);
			}
		}
		$scope.FacetsData.progress = false;
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};

	$scope.morePage = function morePage() {
		var page = $scope.FacetsData.bookmark.match(/page=([^&]+)/)[1];
		if ($scope.FacetsData.bookmarkPage != $scope.FacetsData.pagingOptions.currentPage) {
			if (page >= $scope.FacetsData.pagingOptions.currentPage) {
			    $('#moreButton').click();
		   		setTimeout(function () {
	    			$scope.morePage();
	    		}, 200);
			} else {
		   		setTimeout(function () {
	    			$scope.morePage();
	    		}, 1);
			}
 		} else {
			$scope.FacetsData.bookmarkPage = null;
			suppressBookmark = false;
		}
	}

	$scope.successGetColumnDescriptions = function successGetColumnDescriptions(data, textStatus, jqXHR) {
	    $scope.requestCounter = 0;
		initModels($scope.FacetsData, $scope.successInitModels);
	};

	$scope.successGetErmrestData = function successGetErmrestData(data, totalItems, page, pageSize) {
    	FacetsService.successGetErmrestData(data, totalItems, page, pageSize);
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		$('div.ngSortButtonUp').addClass('ng-hide');
		getColumnDescriptions($scope.FacetsData, $scope.successGetColumnDescriptions);
	};

	$scope.successGetTableColumnsUniques = function successGetTableColumnsUniques() {
		//alert(JSON.stringify($scope.score, null, 4));
		FacetsService.setSortOption();
		getErmrestData($scope.FacetsData, $scope.successGetErmrestData, $scope.successUpdateModels);
	};

	$scope.successGetTableColumns = function successGetTableColumns(columns) {
    	FacetsService.successGetTableColumns(columns);
		if (!$scope.$$phase) {
			$scope.$apply();
		}
		getTableColumnsUniques($scope.FacetsData, $scope.successGetTableColumnsUniques);
	};

	$scope.successGetMetadata = function successGetMetadata(data, textStatus, jqXHR) {
    	FacetsService.successGetMetadata(data, textStatus, jqXHR, $scope.successGetTableColumns);
	};

	this.getEntityResults = function getEntityResults(event, data) {
    	FacetsService.getEntityResults(event, data, $scope.successGetMetadata);
	};

	this.searchCollection = function searchCollection(event, data) {
		if (!$(event.target).is('span')) {
			$scope.selectedCollection = data['display'];
	    	FacetsService.getEntityResults(event, data, $scope.successGetMetadata);
	    	if ($('#collectionsTree').hasClass('open')) {
	    		setTimeout(function () {
	    		    $('.sidebar-overlay').click();
	    		}, 1);
	    		setTimeout(function () {
	    			if ($('#editfilter').hasClass('open')) {
		    		    $('#attributeValues').click();
	    			}
	    		}, 200);
	    	}
		}
	};

	this.displayTreeCount = function displayTreeCount(data) {
		var ret = '';
		if (data.count > 0) {
			ret = '(' + data.count + ')';
		}
		return ret;
	};

	this.setListClass = function setListClass(facet) {
		var value = $scope.FacetsData.box[facet['table']][facet['name']];
		var values = [];
		$.each(value['values'], function(checkbox_key, checkbox_value) {
			if (checkbox_value) {
				values.push(checkbox_value);
			}
		});
		return (values.length > 1) ? 'multi_values' : 'single_value';
	};

	this.getFacetValues = $scope.getFacetValues = function getFacetValues(facet) {
		var value = $scope.FacetsData.box[facet['table']][facet['name']];
		var values = [];
		$.each(value['values'], function(checkbox_key, checkbox_value) {
			if (checkbox_value) {
				values.push(checkbox_key);
			}
		});
		return values;
	};

	this.displayTitle = function displayTitle(facet) {
		var values = $scope.getFacetValues(facet);
		var ret = '';
		$.each(values, function(i, value) {
			if (i > 0) {
				ret += ', ';
			}
			ret += value;
		});
		return ret;
	};

	this.checkedFilter = function checkedFilter(event) {
		//var target = $(event.target).parent();
		//target[0].classList.toggle('disabled');
		//target.prev()[0].classList.toggle('toggler--is-active');
		//target.next()[0].classList.toggle('toggler--is-active');
	};

	this.getFilterClass = function getFilterClass(facet, value) {
		var model = $scope.FacetsData.box[facet['table']][facet['name']]['values'][value];
		var ret = 'toggler';
		if (model == null || !model) {
			ret += ' toggler--is-active';
		}
		return ret;
	};

	this.getFieldSwitchClass = function getFieldSwitchClass(facet, value) {
		var model = $scope.FacetsData.box[facet['table']][facet['name']]['values'][value];
		var ret = 'toggle';
		if (model == null || !model) {
			ret += ' disabled';
		}
		return ret;
	};

	this.getFieldValueClass = function getFieldValueClass(facet, value) {
		var model = $scope.FacetsData.box[facet['table']][facet['name']]['values'][value];
		var ret = 'toggler truncate';
		if (model != null && model) {
			ret += ' toggler--is-active';
		}
		return ret;
	};

	this.getMoreFilterClass = function getMoreFilterClass(facet) {
		var model = $scope.FacetsData.chooseColumns[facet['table']][facet['name']];
		var ret = 'toggler';
		if (!model) {
			ret += ' toggler--is-active';
		}
		return ret;
	};

	this.getMoreFieldSwitchClass = function getMoreFieldSwitchClass(facet) {
		var model = $scope.FacetsData.chooseColumns[facet['table']][facet['name']];
		var ret = 'toggle';
		if (!model) {
			ret += ' disabled';
		}
		return ret;
	};

	this.getMoreFieldValueClass = function getMoreFieldValueClass(facet) {
		var model = $scope.FacetsData.chooseColumns[facet['table']][facet['name']];
		var ret = 'toggler truncate';
		if (model) {
			ret += ' toggler--is-active';
		}
		return ret;
	};

	this.getEnabledFilters = function getEnabledFilters() {
		var ret = 0;
		$.each($scope.FacetsData.facets, function(i, facet) {
			if ($scope.FacetsData.chooseColumns[facet['table']][facet['name']] && $scope.showSearchFilter(facet)) {
				ret++;
			}
		});
		return ret;
	};

    this.editMoreFilterDone = function editMoreFilterDone(event, toggle) {
    	event.stopPropagation();
		event.preventDefault();
		$scope.FacetsData.facetSelection = checkFacetSelection($scope.FacetsData, $scope.filtersStatus);
    	FacetsService.sidebarClick(toggle);
	}

	this.slideMoreFilter = function slideMoreFilter(event, toggle) {
		event.preventDefault();
		$scope.filtersStatus = saveSessionFilters($scope.FacetsData);
    	FacetsService.sidebarClick(toggle);
	};

	$scope.showSearchFilter = function showSearchFilter(facet) {
		var ret = false;
		if ($scope.FacetsData.box[facet['table']][facet['name']] != null) {
			ret = $scope.FacetsData.box[facet['table']][facet['name']]['facetcount'] > 0 ||
				$scope.FacetsData.colsDescr[facet['table']][facet['name']]['type'] == 'enum' && hasCheckedValues($scope.FacetsData.box, facet) ||
				$scope.FacetsData.colsDescr[facet['table']][facet['name']]['type'] == 'date' && hasCheckedValues($scope.FacetsData.box, facet);
		}
		return ret;
	};

	this.showUsableFilter = function showUsableFilter(facet) {
		var ret = $scope.showSearchFilter(facet) &&
			($scope.FacetsData.narrowFilter.length == 0 || $scope.FacetsData.chooseColumns[facet['table']][facet['name']] || (new RegExp($scope.FacetsData.narrowFilter, 'i')).test(facet['display']));
			//($scope.FacetsData..length == 0 || $scope.FacetsData.chooseColumns[facet['table']][facet['name']] || $scope.FacetsData.box[facet['table']][facet['name']]['facetcount'] > 0);
		return ret;
	};

	this.getUsableFiltersCount = function getUsableFiltersCount() {
		var count = 0;
		$.each($scope.FacetsData.facets, function(i, facet) {
			var ret = $scope.showSearchFilter(facet) &&
				($scope.FacetsData.narrowFilter.length == 0 || $scope.FacetsData.chooseColumns[facet['table']][facet['name']] || (new RegExp($scope.FacetsData.narrowFilter, 'i')).test(facet['display']));
			if (ret) {
				count++;
			}
		});
		return count;
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

	this.enableDisableAll = function enableDisableAll() {
    	$.each($scope.FacetsData.facets, function(i, facet) {
			$scope.FacetsData.chooseColumns[facet['table']][facet['name']] = $scope.FacetsData.enableAll;
    	});
	};

	this.checkUncheck = function checkUncheck(event, value) {
		if (!$(event.target).is('input')) {
			$scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['values'][value] = !$scope.FacetsData.box[$scope.FacetsData.tag['table']][$scope.FacetsData.tag['name']]['values'][value];
		}
		$scope.predicate_checkbox($scope.FacetsData.tag);
	};

	this.clickFacet = function clickFacet(event, facet, from) {
		if (from == 'label') {
			$scope.FacetsData.chooseColumns[facet['table']][facet['name']] = !$scope.FacetsData.chooseColumns[facet['table']][facet['name']];
		}
		updateFacetCount($scope.FacetsData, facet, $scope.refresh);
	};

	this.displayFacetCount = function displayFacetCount(facet) {
		return getFacetCount($scope.FacetsData, facet);
	};

	$scope.refresh = function refresh() {
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	};

	this.showSidebar = function showSidebar() {
		return !$scope.FacetsData.progress;
	};

	this.displaySidebar = function displaySidebar() {
		return !$scope.FacetsData.error;
	};

	this.hideSearchTextFacet = function hideSearchTextFacet() {
		return chaiseConfig['hideSearchTextFacet'];
	};

}]);
