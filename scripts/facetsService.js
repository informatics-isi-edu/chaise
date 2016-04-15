//'use strict';

/* Service Module */

var facetsService = angular.module('facetsService', ['facetsModel']);

facetsService.service('FacetsService', ['$sce', 'FacetsData', function($sce, FacetsData) {
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
		//FacetsData.progress = false;
	};

	this.initTable = function () {
		$('footer').hide();
		$('#headerSearch').val('');
		FacetsData.ready = false;
		FacetsData.progress = true;
		FacetsData.error = false;
		FacetsData.moreFlag = false;
		FacetsData.isDetail = false;
		FacetsData.enableAll = false;
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
		FacetsData.sortOrder = null;
		FacetsData.sortDirection = 'asc';
		FacetsData.details = false;
		FacetsData.entryRow = [];
		FacetsData.detailColumns = [];
		FacetsData.detailRows = [];
		FacetsData.textEntryRow = [];
		FacetsData.entry3Dview = '';
		FacetsData.bookmark = '#';
		FacetsData.entryTitle = '';
		FacetsData.searchFilter = '';
		FacetsData.narrowFilter = '';
		FacetsData.entrySubtitle = '';
		this.initPageRange();
		clearFacets(FacetsData);
		if (FacetsData.table != null) {
			var sortColumn = getTableAnnotation(FacetsData.table, TABLES_MAP_URI, 'sortedBy');
			if (sortColumn != null) {
				FacetsData.sortFacet = sortColumn;
				FacetsData.sortOrder = 'asc';
			}
		}
	};

	this.initPageRange = function () {
	    for (var i = 1; i <= FacetsData.tagPages; i++) {
	    	FacetsData.pageRange.push(i);
	    	FacetsData.pageMap[i] = i;
	    }
	};

	this.updateSessionFilter = function () {
		emptyJSON(FacetsData.sessionFilters);
    	$.each(FacetsData.facets, function(i, facet) {
    		if (FacetsData.chooseColumns[facet['table']][facet['name']]) {
    			if (FacetsData.sessionFilters[facet['table']] == null) {
    				FacetsData.sessionFilters[facet['table']] = [];
    			}
    			FacetsData.sessionFilters[facet['table']].push(facet['name']);
    		}
    	});
	};

	this.sidebarClick = function (toggle) {
		// var mainContent = $('#main-content');
		// var openSideBtn = $('div.open-side');
	    if (toggle == 'sidebar-toggle') {
				$('#sidebar').toggleClass('open');
	    } else if (toggle == 'field-toggle') {
        $('#editfilter').toggleClass('open');
	    } else if (toggle == 'collections-toggle') {
				var overlay = $('.sidebar-overlay');
				var sidebar = $('#collectionsTree');
				sidebar.toggleClass('open');
				if (sidebar.hasClass('sidebar-fixed-right') && sidebar.hasClass('open')) {
            overlay.addClass('active');
        } else {
            overlay.removeClass('active');
        }

	    } else if (toggle == 'more-field-toggle') {
	    	if (FacetsData.facetSelection) {
		    	this.updateSessionFilter();
	    	}
        $('#morefilters').toggleClass('open');
	    }
		// Resize main content pane depending on sidebar open or close
		// Show/hide .open-side button depending on sidebar open or close
		// if ($('.sidebar').hasClass('open')) {
		// 	mainContent.removeClass('col-xs-12 col-sm-12 col-md-12 col-lg-12').addClass('col-xs-6 col-sm-6 col-md-7 col-lg-8');
		// 	openSideBtn.removeClass('show').addClass('hidden');
		// } else {
		// 	mainContent.removeClass('col-xs-6 col-sm-6 col-md-7 col-lg-8').addClass('col-xs-12 col-sm-12 col-md-12 col-lg-12');
		// 	openSideBtn.removeClass('hidden').addClass('show');
		// }
	};

	this.initSortOption = function () {
		$.each(FacetsData.colsDefs, function(i, col) {
			if (isSortable(FacetsData.table, col.field)) {
				FacetsData.sortColumns.push(col.field);
			}
		});
		FacetsData.sortColumns.sort();
	};

	this.predicate = function (facet, keyCode, successSearchFacets, successUpdateModels) {
		if (FacetsData.box[facet['table']][facet['name']]['value'] == '') {
			FacetsData.facetClass[facet['table']][facet['name']] = '';
		} else {
			FacetsData.facetClass[facet['table']][facet['name']] = 'selectedFacet';
		}
		this.setSortOption();
		FacetsData.pagingOptions.currentPage = 1;
		getErmrestData(FacetsData, successSearchFacets, successUpdateModels);
	};

	this.predicate_slider = function (facet, successSearchFacets, successUpdateModels) {
		if (FacetsData.box[facet['table']][facet['name']]['min'] > FacetsData.box[facet['table']][facet['name']]['floor']) {
			FacetsData.box[facet['table']][facet['name']]['left'] = true;
		} else if (FacetsData.box[facet['table']][facet['name']]['left'] && FacetsData.box[facet['table']][facet['name']]['min'] == FacetsData.box[facet['table']][facet['name']]['floor']) {
			delete FacetsData.box[facet['table']][facet['name']]['left'];
		}
		if (FacetsData.box[facet['table']][facet['name']]['max'] < FacetsData.box[facet['table']][facet['name']]['ceil']) {
			FacetsData.box[facet['table']][facet['name']]['right'] = true;
		} else if (FacetsData.box[facet['table']][facet['name']]['right'] && FacetsData.box[facet['table']][facet['name']]['max'] == FacetsData.box[facet['table']][facet['name']]['original_ceil']) {
			delete FacetsData.box[facet['table']][facet['name']]['right'];
		}
		setFacetClass(FacetsData, facet, FacetsData.facetClass);
		this.setSortOption();
		FacetsData.pagingOptions.currentPage = 1;
		getErmrestData(FacetsData, successSearchFacets, successUpdateModels);
	};

	this.successGetErmrestData = function (data, totalItems, page, pageSize) {
		if (page == 1) {
			FacetsData.ermrestData = (FacetsData.filter == null) ? data : [];
		} else {
			FacetsData.ermrestData = FacetsData.ermrestData.concat(data);
		}
		FacetsData.totalServerItems = (FacetsData.filter == null) ? totalItems : 0;
		FacetsData.collectionsPredicate = getCollectionsPredicate(FacetsData.entityPredicates, FacetsData);
		if (FacetsData.selectedEntity != null) {
			FacetsData.selectedEntity['count'] = totalItems;
		}
		FacetsData.maxPages = Math.floor(FacetsData.totalServerItems/FacetsData.pagingOptions.pageSize);
		if (FacetsData.totalServerItems%FacetsData.pagingOptions.pageSize != 0) {
			FacetsData.maxPages++;
		}
		//FacetsData.progress = false;
	};

	this.successGetMetadata = function (data, textStatus, jqXHR, successGetTableColumns) {
		FacetsData['metadata'] = data;
		getTableColumns(FacetsData, successGetTableColumns);
	};

	this.successGetTableColumns = function (columns) {
		FacetsData['facets'] = columns['facets'];
		FacetsData['colsDefs'] = columns['colsDefs'];
		this.initSortOption();
	};

	this.hide = function (facet) {
		return (FacetsData.narrow[facet['table']][facet['name']] == null || !FacetsData.chooseColumns[facet['table']][facet['name']] ||
				(FacetsData.box[facet['table']][facet['name']]['facetcount'] == 0 &&
						(FacetsData.colsDescr[facet['table']][facet['name']]['type'] == 'slider' ||
								FacetsData.colsDescr[facet['table']][facet['name']]['type'] == 'enum' && !hasCheckedValues(FacetsData.box, facet))));
	};

	this.if_type = function (facet, facet_type) {
		var ret = false;
		if (facet != null && FacetsData.colsDescr[facet['table']] != null && FacetsData.colsDescr[facet['table']][facet['name']] != null) {
			ret = (FacetsData.colsDescr[facet['table']][facet['name']]['type'] == facet_type);
			if (facet_type == 'slider') {
				ret = sliderPresentation.contains(FacetsData.colsDescr[facet['table']][facet['name']]['type']);
			} else if (facet_type == 'text') {
				ret = searchBoxPresentation.contains(FacetsData.colsDescr[facet['table']][facet['name']]['type']);
			} else if (facet_type == 'date') {
				ret = datepickerPresentation.contains(FacetsData.colsDescr[facet['table']][facet['name']]['type']);
			}
		}
		return ret;
	};

	this.predicate_checkbox = function (facet, successSearchFacets, successUpdateModels) {
		setFacetClass(FacetsData, facet, FacetsData.facetClass);
		this.setSortOption();
		FacetsData.pagingOptions.currentPage = 1;
		getErmrestData(FacetsData, successSearchFacets, successUpdateModels);
	};

	this.showFacetCount = function (facet) {
		return (FacetsData.chooseColumns[facet['table']][facet['name']] &&
				(FacetsData.box[facet['table']][facet['name']] != null && FacetsData.box[facet['table']][facet['name']]['facetcount'] > 0 ||
						FacetsData.colsDescr[facet['table']] != null && FacetsData.colsDescr[facet['table']][facet['name']] != null &&
						FacetsData.colsDescr[facet['table']][facet['name']]['type'] == 'enum' && hasCheckedValues(FacetsData.box, facet)));
	};

	this.getEntityResults = function (event, data, successGetMetadata) {
		var label = $(event.target).is('label') ? $(event.target) : $(event.target).parent();
		var isNewSchema = (SCHEMA != data.schema);
		if (isNewSchema) {
			initSchema(data.schema);
		}
		this.setCollectionChiclets(data, isNewSchema, this);
		var peviousTable = FacetsData.table;
		var node = $('label.highlighted', $('#treeDiv'));
		var isNew = (node.length == 0 || node[0] !== label[0]);
		if (isNew) {
			$("#attrsort span.glyphicon").removeClass("glyphicon-sort-by-attributes-alt").addClass("glyphicon-sort-by-attributes");
		}
		if (data.level != -1 && isNew) {
			$('#headerSearch').removeAttr('disabled');
			collapseTree(FacetsData.tree[0], data);
			$('label', $('#treeDiv')).removeClass('highlighted');
			label.addClass('highlighted');
			var newBranch = false;
			if (!isNewSchema && data.level > 0 && FacetsData.level >= 0) {
				var oldRoot = null;
				if (FacetsData.level > 0) {
					var oldRootParent = FacetsData.selectedEntity.parent;
					while (oldRootParent.parent != null) {
						oldRootParent = oldRootParent.parent;
					}
					oldRoot = oldRootParent.name;
				} else {
					oldRoot = FacetsData.selectedEntity.name;
				}
				var newRootParent = data.parent;
				while (newRootParent.parent != null) {
					newRootParent = newRootParent.parent;
				}
				if ((oldRoot != null || FacetsData.entityPredicates.length == 0) && newRootParent.name != oldRoot) {
					FacetsData.level = 0;
					FacetsData.entityPredicates.length = 1;
					FacetsData.entityPredicates[0] = encodeSafeURIComponent(newRootParent.name);
					newBranch = true;
				}
			}
			FacetsData.selectedEntity = data;
			FacetsData.table = data.name;
			if (data.level == 0 || isNewSchema) {
				resetTreeCount(data);
				FacetsData.entityPredicates.length = 0;
				if (isNewSchema && data.level > 0) {
					var node = data.parent;
					for (var i=data.level-1; i>=0; i--) {
						FacetsData.entityPredicates[i] = encodeSafeURIComponent(node.name);
						node = node.parent;
					}
				}
				FacetsData.entityPredicates.push(encodeSafeURIComponent(FacetsData.table));
				FacetsData.level = data.level;
				updateTreeCount(data, FacetsData.entityPredicates);
				this.initTable();
				getMetadata(data.name, successGetMetadata);
			} else if (data.level > FacetsData.level) {
				FacetsData.entityPredicates.length = data.level+1;
				FacetsData.entityPredicates[data.level] = encodeSafeURIComponent(data.name);
				if (!newBranch) {
					var predicate = getPredicate(FacetsData, null, null, peviousTable);
					if (predicate.length > 0) {
						FacetsData.entityPredicates[FacetsData.level] += '/' + predicate.join('/');
					}
				}
				var node = data.parent;
				for (var i=data.level-1; i>FacetsData.level; i--) {
					FacetsData.entityPredicates[i] = encodeSafeURIComponent(node.name);
					node = node.parent;
				}
				updateTreeCount(data, FacetsData.entityPredicates);
				FacetsData.level = data.level;
				this.initTable();
				getMetadata(data.name, successGetMetadata);
			} else if (data.level < FacetsData.level) {
				resetTreeCount(data);
				FacetsData.entityPredicates.length = data.level+1;
				FacetsData.entityPredicates[data.level] = encodeSafeURIComponent(data.name);
				updateTreeCount(data, FacetsData.entityPredicates);
				FacetsData.level = data.level;
				this.initTable();
				getMetadata(data.name, successGetMetadata);
			} else if (data.level == FacetsData.level) {
				FacetsData.entityPredicates[data.level] = encodeSafeURIComponent(data.name);
				updateTreeCount(data, FacetsData.entityPredicates);
				FacetsData.level = data.level;
				this.initTable();
				getMetadata(data.name, successGetMetadata);
			}
		}
	};

	this.getFacetValues = function getFacetValues(facet) {
		var value = FacetsData.box[facet['table']][facet['name']];
		var values = [];
		if (value != null) {
			$.each(value['values'], function(checkbox_key, checkbox_value) {
				if (checkbox_value) {
					values.push(checkbox_key);
				}
			});
		}
		return values;
	};

	this.displayTitle = function displayTitle(facet) {
		var values = this.getFacetValues(facet);
		var ret = '';
		$.each(values, function(i, value) {
			if (i > 0) {
				ret += ', ';
			}
			ret += value;
		});
		return ret;
	};

	this.setCollectionChiclets = function setCollectionChiclets(data, isNewSchema, that) {
		var oldRoot = null;
		var newRoot = null;
		if (FacetsData.selectedEntity != null) {
			if (FacetsData.level > 0) {
				var oldRootParent = FacetsData.selectedEntity.parent;
				while (oldRootParent.parent != null) {
					oldRootParent = oldRootParent.parent;
				}
				oldRoot = oldRootParent.name;
			} else {
				oldRoot = FacetsData.selectedEntity.name;
			}
		}
		var newRootParent = data.parent;
		if (newRootParent != null) {
			while (newRootParent.parent != null) {
				newRootParent = newRootParent.parent;
			}
			newRoot = newRootParent.name;
		}

		var isNewRoot = (oldRoot != newRoot);

		if (isNewSchema || isNewRoot) {
			FacetsData['tablesStack'].empty();
		} else {
			if (data.level > FacetsData['tablesStack'].length) {
				var item = {};
				item['Collection'] = getTableDisplayName(FacetsData.table);
				var chiclets = {};
				$.each(FacetsData.facets, function(i, facet) {
					if (!that.showChiclet(facet)) {
						return true;
					}
					var chiclet = {};
					chiclet['display'] = that.display(FacetsData.table, facet['name']);
					if (that.if_type(facet, 'slider')) {
						chiclet['type'] = 'slider';
						chiclet['min'] = FacetsData.box[facet['table']][facet['name']]['min'];
						chiclet['max'] = FacetsData.box[facet['table']][facet['name']]['max'];
					} else if (that.if_type(facet, 'date')) {
						chiclet['type'] = 'date';
						chiclet['min'] = FacetsData.box[facet['table']][facet['name']]['min'];
						chiclet['max'] = FacetsData.box[facet['table']][facet['name']]['max'];
					} else if (that.if_type(facet, 'text')) {
						chiclet['type'] = 'text';
						chiclet['value'] = FacetsData.box[facet['table']][facet['name']]['value'];
					} else if (that.if_type(facet, 'enum')) {
						chiclet['type'] = 'enum';
						chiclet['value'] = that.displayTitle(facet);
					}
					chiclets[facet['name']] = chiclet;
				});
				item['chiclets'] = chiclets;
				FacetsData['tablesStack'].push(item);
			} else if (data.level >= 0) {
				FacetsData['tablesStack'].length = data.level;
			} else {
				FacetsData['tablesStack'].length = 0;
			}
		}
		var tables = [];
		var crt = data.parent;
		while (crt != null) {
			tables.unshift(crt.display);
			crt = crt.parent;
		}
		var delta = data.level - FacetsData['tablesStack'].length;
		if (delta > 0) {
			var index = (FacetsData['tablesStack'].length == 0) ? delta-1 : delta;
			for (var i=FacetsData['tablesStack'].length; i <= index; i++) {
				var item = {};
				item['Collection'] = getTableDisplayName(tables[i]);
				item['chiclets'] = {};
				FacetsData['tablesStack'].push(item);
			}
		}
	}

	this.showChiclet = function showChiclet(facet) {
		var facet_type = null;
		if (this.if_type(facet, 'slider')) {
			facet_type = 'slider';
		} else if (this.if_type(facet, 'text')) {
			facet_type = 'text';
		} else if (this.if_type(facet, 'date')) {
			facet_type = 'date';
		} else if (this.if_type(facet, 'enum')) {
			facet_type = 'enum';
		}
		var ret = facet_type != null ? this.showFacetValues(facet, facet_type) : false;
		return ret;
	};

	this.showFacetValues = function showFacetValues(facet, facet_type) {
		var ret = false;
		var value = FacetsData.box[facet['table']][facet['name']];
		if (value != null) {
			if (facet_type == 'slider') {
				ret = value['left'] || value['right'];
			} else if (facet_type == 'text') {
				ret = value['value'].length > 0;
			} else if (facet_type == 'date') {
				ret = value['left'] || value['right'];
			} else if (facet_type == 'enum') {
				$.each(value['values'], function(checkbox_key, checkbox_value) {
					if (checkbox_value) {
						ret = true;
						return false;
					}
				});
			}
		}
		return ret;
	};

}]);
