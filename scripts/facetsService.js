//'use strict';

/* Service Module */

var facetsService = angular.module('facetsService', ['facetsModel']);

facetsService.service('FacetsService', ['$sce', 'FacetsData', function($sce, FacetsData) {
	this.display = function (table, column) {
		return COLUMNS_ALIAS != null && COLUMNS_ALIAS[table] != null ? COLUMNS_ALIAS[table][column] : '';
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
		this.renderPlot();
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
				var sortOrder = getTableAnnotation(FacetsData.table, TABLES_MAP_URI, 'sortOrder');
				if (sortOrder != null) {
					FacetsData.sortOrder = sortOrder;
				}
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
			if ((sidebar.hasClass('sidebar-fixed-left') || sidebar.hasClass('sidebar-fixed-right')) && sidebar.hasClass('open')) {
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
		this.updateExportFormats()
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
	};

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

    // Build ermrest predicate base on JSON params
    this.buildPredicate = function(keys, entity){
        // Build an array of predicates for the Ermrest Filter lanaguage
        var predicates = [];
        if (display_columns['title'] != null && keys.contains(display_columns['title'])) {
            predicates.push(encodeSafeURIComponent(display_columns['title']) + '=' + encodeSafeURIComponent(entity[display_columns['title']]));
        } else {
            for (var i = 0; i< keys.length; i++){
            	// the PRIMARY_KEY array has the keys already encoded, so decode them in order to extract the value from the row
                var key = decodeURIComponent(keys[i]);
                var predicate = encodeSafeURIComponent(key) + '=' + encodeSafeURIComponent(entity[key]);
                predicates.push(predicate);
            }
        }

        // Join predicates with a conjunctive filter '&'
        return predicates.join('&');
    };


	// Returns the path for a given row
    this.rowPath = function(row){
        var prefix = window.location.href;

        // match /search/ of /search/index.html in the url
        // everything before /search/ is the base url
        var index = prefix.indexOf('\/search\/index.html');
        if (index == -1) {
        	index = prefix.indexOf('\/search\/');
        }
        if (index != -1) {
            prefix = prefix.substring(0, index);
        }
        // in case we have a view, we want the "original" table in the detail
        var table_name = getTableAnnotation(FacetsData.table, TABLES_MAP_URI, 'originalTable');
        if (table_name == null) {
        	table_name = FacetsData.table;
        }

        // defaults
        var resource = "record/";
        var mode = 'tag:isrd.isi.edu,2016:recordlink/fragmentfilter';

        // schema Record Link overwrites the defaults
        var recordLink = getSchemaAnnotation(SCHEMA, SCHEMA_RECORD_LINK_URI);
        if (recordLink != null) {
        	resource = recordLink['resource'];
        	mode = recordLink['mode'];
        }

        // table Record Link overwrites the defaults or schema Record Link
        recordLink = getTableAnnotationValue(table_name, TABLE_RECORD_LINK_URI);
        if (recordLink != null) {
        	resource = recordLink['resource'];
        	mode = recordLink['mode'];
        }

        var suffix = '';
        if (mode == 'tag:isrd.isi.edu,2016:recordlink/fragmentfilter') {
        	suffix = '#' + CATALOG + '/' + SCHEMA + ':' +  encodeSafeURIComponent(table_name) + '/' + this.buildPredicate(PRIMARY_KEY, row);
        }

        var detailPath = prefix + '/' + resource + suffix;
        return detailPath;
    };

	this.updateExportFormats = function updateExportFormats() {
		FacetsData.exportOptions.format = JSON.parse(JSON.stringify(FacetsData.exportOptions.defaultFormat));
		FacetsData.exportOptions.supportedFormats = JSON.parse(JSON.stringify(FacetsData.exportOptions.defaultFormats));
		var exportAnnotations = FacetsData.metadata.annotations["tag:isrd.isi.edu,2016:export"];
		var templates = (exportAnnotations !== undefined) ? exportAnnotations["templates"] : null;
		if (templates == null) {
			return;
		}
		$.each(templates, function(i, template) {
			var name = template['name'];
			var format_name = template['format_name'] || null;
			var format_type = template['format_type'] || "FILE";
			if (format_name) {
				var format = {name:format_name, type:format_type, template: template};
				FacetsData.exportOptions.supportedFormats.push(format);
			}
		});
	};

	this.updateExportFormatOptions = function updateExportFormatOptions() {
		FacetsData.exportOptions.formatOptions = {};
		var format = FacetsData.exportOptions.format;
		if (format["type"] == "BAG") {
			// setup some defaults
			var bagFormatOpts = {};
			bagFormatOpts["name"] = FacetsData.selectedEntity.display || FacetsData.selectedEntity.name;
			bagFormatOpts["archiver"] = "zip";
			bagFormatOpts["metadata"] =	{};
			bagFormatOpts["table_format"] = "csv";
			FacetsData.exportOptions.formatOptions["bag"] = bagFormatOpts;
		}
	};

	this.getPredicateTableAliasByEntityName = function getPredicateTableAliasByEntityName(exportPredicate, entityName)
	{
		var predicates = exportPredicate.split("/$A/");
		for (var f=0; f<predicates.length; f++) {
			var predicate = predicates[f];
			if (predicate.indexOf(":=") != -1) {
				var entity = predicate.substring(predicate.indexOf(":=")+2, predicate.indexOf("/"));
				if (entity == entityName) {
					return "/$" + predicate.substring(0, predicate.indexOf(":="));
				}
			}
		}
		return '';
	};

	this.createExportParameters = function createExportParameters() {
		var exportOpts = FacetsData.exportOptions;
		var exportParameters = {};

		var bagFormatOpts = FacetsData.exportOptions.formatOptions["bag"];
		if (bagFormatOpts !== undefined) {
			var bagParameters = {};
			exportParameters["bag"] = bagParameters;
			bagParameters["bag_name"] = bagFormatOpts["name"];
			bagParameters["bag_archiver"] = bagFormatOpts["archiver"];
			bagParameters["bag_metadata"] = bagFormatOpts["metadata"];
		}

		var catalogParameters = {};
		exportParameters["catalog"] = catalogParameters;
		catalogParameters["host"] = HOME;
		catalogParameters["path"] = ERMREST_CATALOG_PATH + CATALOG;
		var queries = [];
		catalogParameters["queries"] = queries;

		var template = exportOpts.format["template"];
		if (!template) {
			// this is basically the same as a single file CSV or JSON export but packaged as a bag
			var query = {};
			query["output_path"] = bagFormatOpts["name"];
			query["output_format"] = bagFormatOpts["table_format"];
			query["query_path"] = exportOpts.exportUrl.substring(ERMREST_DATA_HOME.length) + "?limit=none";
			queries.push(query);
		} else {
			var outputs = template["outputs"];
			if ((outputs === undefined) || (outputs && outputs.length === 0)) {
				var error = "No outputs configured in template: " + template["name"];
				alert(error);
				throw new Error(error);
			}
			var base = this;
			var depth = 1;
			var baseTableAlias = "E";
			var tableAliasToken = baseTableAlias + depth;
			$.each(outputs, function(i, output) {
				var query = {};
				var queryFrags = [];
				var source = output["source"];
				var sourceName = source["name"];
				var sourceType = source["type"];
				var dest = output["destination"];
				var destName = dest["name"];
				var destType = dest["type"];
				var destParams = dest["params"];
				var predicate = exportOpts.exportPredicate;

				queryFrags.push(sourceType);
				var predicateContainsTargetEntity = predicate.indexOf(sourceName) != -1;
				if (predicateContainsTargetEntity) {
					predicate += base.getPredicateTableAliasByEntityName(predicate,sourceName);
					queryFrags.push(predicate);
				} else {
					queryFrags.push(predicate);
					queryFrags.push("$A");
					queryFrags.push(tableAliasToken + ":=" + sourceName);
				}
				if (source["filter"] !== undefined) {
					queryFrags.push(source["filter"]);
				}
				if ((sourceType === "attribute") || (sourceType === "attributegroup")) {
					var columnRefs = [];
					var columnMap = source["column_map"];
					if (columnMap !== undefined) {
						for (var col in columnMap) {
							if (columnMap.hasOwnProperty(col)) {
								columnRefs.push(col + ":=" + columnMap[col]);
							}
						}
					}
					queryFrags.push(columnRefs.join(","))
				}
				query["query_path"] = "/" + queryFrags.join("/") + "?limit=none";
				query["output_path"] = destName || sourceName;
				query["output_format"] = destType || bagFormatOpts["table_format"];
				if (destParams != null) {
					query["output_format_params"] = destParams;
				}
				queries.push(query);
			});
		}

		return exportParameters;
	};

	this.invokeExternalExport = function invokeExternalExport() {
		var exportParameters = JSON.stringify(this.createExportParameters(), null, "  ");
		var serviceUrl = HOME + "/iobox/export/" + // TODO: this service base url needs to be configurable
			(FacetsData.exportOptions.format["type"] == "BAG" ? "bdbag" : "file");
		console.info("Executing external export with the following parameters:\n" + exportParameters);
		console.time('External export duration');
		document.body.style.cursor = 'wait';
		$.ajax({
			url: serviceUrl,
			type: 'POST',
			contentType: 'application/json',
			data: exportParameters,
			dataType: 'text',
			headers: make_headers(),
			timeout: AJAX_TIMEOUT,
			async: true,
			success: function(data, textStatus, jqXHR) {
				document.body.style.cursor = 'default';
				var uriList = data.split("\n");
				if (uriList) {
					location.href = uriList[0];
				}
				console.timeEnd('External export duration');
			},
			error: function(jqXHR, textStatus, errorThrown) {
				handleError(jqXHR, textStatus, errorThrown, serviceUrl);
				console.timeEnd('External export duration');
			}
		});
	};

	this.doExport = function doExport() {
		var exportOpts = FacetsData.exportOptions;
		var baseName = FacetsData.selectedEntity.display || FacetsData.selectedEntity.name;
		var baseOpts = "?limit=none&download=" + fixedEncodeURIComponent(baseName);
		var exportFormatName = exportOpts.format["name"];
		var exportFormatType = exportOpts.format["type"];
		switch (exportFormatType) {
			case "DIRECT":
				if (exportFormatName == "CSV") {
					location.href = exportOpts.exportUrl + baseOpts + "&accept=csv";
				} else if (exportFormatName == "JSON") {
					location.href = exportOpts.exportUrl + baseOpts + "&accept=json";
				}
				break;
			case "BAG":
			case "FILE":
				this.invokeExternalExport();
				break;
			default:
				alert("Unsupported export format: " + exportOpts.format["type"]);
		}
	};

	this.updatePlotFormatOptions = function updatePlotFormatOptions() {
		this.updatePlotCoordinateOptions();
	};

	this.updatePlotCoordinateOptions = function updatePlotCoordinateOptions()
	{
		var coordinates = FacetsData.plotOptions.coordinates;

		coordinates.x.display = this.display(FacetsData.table, coordinates.x.column);
		coordinates.y.display = this.display(FacetsData.table, coordinates.y.column);
		coordinates.z.display = this.display(FacetsData.table, coordinates.z.column);

		this.renderPlot();
	};

	this.canRenderPlot = function canRenderPlot() {
		var canRender = false;
		var coordinates = FacetsData.plotOptions.coordinates;
		var formatCoordinates = FacetsData.plotOptions.format.coordinates;

		if ((formatCoordinates.length == 3) &&
			(formatCoordinates.contains('x') && coordinates.x.column) &&
			(formatCoordinates.contains('y') && coordinates.y.column) &&
			(formatCoordinates.contains('z') && coordinates.z.column)) {
			canRender = true;
		} else if ((formatCoordinates.length == 2) &&
			(formatCoordinates.contains('x') && coordinates.x.column) &&
			(formatCoordinates.contains('y') && coordinates.y.column)) {
			canRender = true;
		} else if ((formatCoordinates.length == 1) &&
			(formatCoordinates.contains('x') && coordinates.x.column)) {
			canRender = true;
		}
		return canRender;
	};

	this.renderPlot = function renderPlot() {
		if (!((FacetsData.view=='plot') && (this.canRenderPlot()))) {
			return;
		}

		var plotOpts = FacetsData.plotOptions;
		var plotUrl = plotOpts.dataUrl;
		var plotKeys = plotOpts.keys;
		var coordinates = plotOpts.coordinates;
		plotUrl += '/';
        for (var k=0; k < plotKeys.length; k++) {
			if (k > 0) {
				plotUrl += ',';
			}
			plotUrl += 'A:' + plotKeys[k];
		}
		if (coordinates.x.column != null) {
			plotUrl += ',x:=A:' + coordinates.x.column;
		}
		if (coordinates.y.column != null) {
			plotUrl += ',y:=A:' + coordinates.y.column;
		}
		if (coordinates.z.column != null) {
			plotUrl += ',z:=A:' + coordinates.z.column;
		}
		plotUrl += '?limit=none';
		ERMREST.GET(plotUrl, 'application/x-www-form-urlencoded; charset=UTF-8',this.successGetPlotData, null, this);

	};

	this.successGetPlotData = function (data, textStatus, jqXHR, facetService) {
		var plotOpts = FacetsData.plotOptions;
		var plotKeys = plotOpts.keys;
		var xDisplay = plotOpts.coordinates.x.display;
		var yDisplay = plotOpts.coordinates.y.display;
		var zDisplay = plotOpts.coordinates.z.display;
		var layout = JSON.parse(JSON.stringify(plotOpts.format.layout));
		var formatCoordinates = FacetsData.plotOptions.format.coordinates;

		plotOpts.data = data;

		layout["xaxis"] = {
			title: (xDisplay != null) ? xDisplay : '',
			showline:true
		};
		layout["yaxis"] = {
			title: (yDisplay != null) ? yDisplay : "Count",
			tickangle:40,
			showline:true
		};
		layout["zaxis"] = {title: (zDisplay != null) ? zDisplay : ''};

		var unpackPlotData = function unpackPlotData(key, data, callback) {
			var value;
			var result = [];
			$.each(data, function (i, datum) {
				value = datum[key] != null ? datum[key] : 'N/A';
				if (callback) {
					value = callback(value);
				}
				result[i] = value;
			});
			return result;
		};

		var l, x, y, z = null;

		if (!((formatCoordinates.length == 1) && (formatCoordinates.contains('x')))) {
			for (var k=0; k < plotKeys.length; k++) {
				l = unpackPlotData(plotKeys[k], data, function (value) {
					return plotOpts.keyLabels[k] + ": " + value + '\n';
				});
			}
		}

		if (formatCoordinates.contains('x')) {
			x = unpackPlotData('x', data);
		}
		if (formatCoordinates.contains('y')) {
			y = unpackPlotData('y', data);
		}
		if (formatCoordinates.contains('z')) {
			z = unpackPlotData('z', data);
		}

		var plotData = [
			{
				x: x,
				y: y,
				z: z,
				text: l,
				type: plotOpts.format.type,
				mode: plotOpts.format.mode,
				marker: plotOpts.format.marker
			}
		];
		Plotly.newPlot('results-plot-view', plotData, layout, {displaylogo: false});

		// click handler
		var node = document.getElementById('results-plot-view');
		if (node) {
			node.on('plotly_click', function (data) {
				var pointData;
				for (var i = 0; i < data.points.length; i++) {
					pointData = FacetsData.plotOptions.data[data.points[i].pointNumber];
					if (pointData) {
						var url = facetService.rowPath(pointData);
						window.open(url, '_blank');
					}
				}
			});
		}
	}
}]);
