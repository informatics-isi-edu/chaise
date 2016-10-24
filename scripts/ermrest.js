var MULTI_SELECT_LIMIT = 1000;
var AJAX_TIMEOUT = 300000;
var goauth_cookie = 'globusonline-goauth';
var token = null;
var SCHEMA = null;
var CATALOG = null;
var ERMREST_CATALOG_PATH = '/ermrest/catalog/';
var ERMREST_SCHEMA_HOME = null;
var ERMREST_DATA_HOME = null;
var URL_ESCAPE = new String("~!()'");
var USER = null;
var CHAISE_DATA = {};
var DISPLAY_ERROR = null;

var PRIMARY_KEY = [];
var uniquenessColumns = [];
var textColumns = [];
var initializedFacets = {};

// initialize here as Angular might need no null values for them while rendering a page too early...
var display_columns = {
		'text_columns': [],
		'file': [],
		'thumbnail': [],
		'zoomify': [],
		'3dview': [],
		'hidden': [],
		'url': [],
		'top_columns': [],
		'top_columns_annotation': []
};

var back_references = {};
var association_tables = {};
var association_tables_names = [];
var catalog_association_tables = {};
var catalog_association_tables_names = {};
var catalog_back_references = {};

var SCHEMA_METADATA = [];
var DEFAULT_TABLE = null;
var COLUMNS_ALIAS = {};

var CATALOG_SCHEMAS = {};
var CATALOG_METADATA = {};
var CATALOG_COLUMNS_ALIAS = {};

var COLUMNS_LIST_URI = 'comment';
var TABLES_LIST_URI = 'comment';
var SCHEMAS_LIST_URI = 'comment';
var SCHEMA_RECORD_LINK_URI = 'tag:isrd.isi.edu,2016:recordlink';
var TABLE_RECORD_LINK_URI = 'tag:isrd.isi.edu,2016:recordlink';
var COLUMNS_MAP_URI = 'description';
var TABLES_MAP_URI = 'description';
var COLUMNS_FACET_URI = 'facet';
var TABLES_FACET_URI = 'facet';
var COLUMNS_FACET_ORDER_URI = 'facetOrder';

var thumbnailFileTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/tiff'];
var viewer3dFileTypes = ['image/x.nifti'];

var sliderPresentation = [ 'numeric', 'float4', 'int8', 'int4', 'int2', 'float8', 'serial4', 'serial8' ];

var searchBoxPresentation = [ 'text', 'varchar', 'jsonb', 'markdown', 'gene_sequence' ];
var checkBoxPresentation = [ 'boolean' ];

var datepickerPresentation = [ 'date', 'timestamp', 'timestamptz', 'time' ];

var unsortableColumns = [];
var suppressError = false;
var suppressBookmark = false;
var facetPolicy = null;
var assignBookmark = false;
var loadPage = true;

function isSortable(table, column) {
	return !unsortableColumns.contains(column);
}

function initApplicationHeader(tables) {
	// overwritten by the application
}

function loadApplicationFooter() {
	$( "#ermrestFooter" ).load( "../views/ermfooter.html" );
}

function initApplication(chaise_data, errorCallback) {
	CHAISE_DATA = chaise_data;
	DISPLAY_ERROR = errorCallback;
	loadApplicationFooter();
	initLocation();
	ERMREST_DATA_HOME = HOME + ERMREST_CATALOG_PATH + CATALOG;
	getSchemas();
	getSession();
	//alert(JSON.stringify(DATASET_COLUMNS, null, 4));
}

function setSchema() {
	if (SCHEMA == null) {
		$.each(CATALOG_SCHEMAS, function(schema, value) {
			var annotations = value['annotations'];
			if (annotations != null && annotations[SCHEMAS_LIST_URI] != null && annotations[SCHEMAS_LIST_URI].contains('default')) {
				SCHEMA = schema;
				return false;
			}
		});
	}
	if (SCHEMA == null) {
		$.each(CATALOG_SCHEMAS, function(schema, value) {
			$.each(value['tables'], function(i, table) {
				var isDefault = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null &&
					table['annotations'][TABLES_LIST_URI].contains('default');
				if (isDefault) {
					SCHEMA = schema;
					return false;
				}
			});
			if (SCHEMA != null) {
				return false;
			}
		});
		if (SCHEMA == null) {
			// get the first schema from the catalog
			$.each(CATALOG_SCHEMAS, function(schema, value) {
				SCHEMA = schema;
				return false;
			});
		}
	}
	ERMREST_SCHEMA_HOME = HOME + ERMREST_CATALOG_PATH + CATALOG + '/schema/'+ SCHEMA + '/table/';
}

/**
 * Handle an error from the AJAX request
 * @param jqXHR
 * 	the jQuery XMLHttpRequest
 * @param textStatus
 * 	the string describing the type of error
 * @param errorThrown
 * 	the textual portion of the HTTP status
 * @param url
 * 	the request url
 */
function handleError(jqXHR, textStatus, errorThrown, url) {
	switch (jqXHR.status) {
		case 0:
			return;
		case 401:
			// redirect to login in case of an Unauthorized error
			document.body.style.cursor = 'default';
			login(encodeSafeURIComponent(window.location.href));
			break;
		case 403:
			// Forbidden: pop up an alert window and redirect to the static home page
			document.body.style.cursor = 'default';
			alert('Access to the requested resource is forbidden.\nPlease contact the site administrator.\n');
			var redirect_url = window.location.origin;
			if (chaiseConfig['dataBrowser'] !== undefined) {
				redirect_url = chaiseConfig['dataBrowser'];
			}
			window.location = redirect_url;
			break;
		default:
			var msg = '';
			var err = jqXHR.status;
			if (err != null) {
				//msg += 'Status: ' + err + '\n';
			}
			err = jqXHR.responseText;
			if (err != null) {
				msg += 'ResponseText: ' + err;
				if (jqXHR.status == 403) {
					msg += 'Please contact the site administrator.\n';
				}
			}
			if (textStatus != null) {
				msg += 'TextStatus: ' + textStatus + '\n';
			}
			if (errorThrown != null) {
				msg += 'ErrorThrown: ' + errorThrown + '\n';
			}
			msg += 'URL: ' + url + '\n';
			document.body.style.cursor = 'default';
			if (!suppressError) {
				//alert(msg);
				DISPLAY_ERROR(jqXHR.status, msg);
			}
	}
}

var ERMREST = {
	POST: function(url, contentType, async, processData, obj, successCallback, errorCallback, param) {
		CHAISE_DATA['error'] = false;
		document.body.style.cursor = 'wait';
		var res = null;
		$.ajax({
			url: url,
			contentType: contentType,
			headers: make_headers(),
			type: 'POST',
			data: (processData ? obj : JSON.stringify(obj)),
			dataType: 'text',
			timeout: AJAX_TIMEOUT,
			async: async,
			processData: processData,
			success: function(data, textStatus, jqXHR) {
				document.body.style.cursor = 'default';
				if (successCallback != null) {
					successCallback(data, textStatus, jqXHR, param);
				}
				res = data;
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (errorCallback == null) {
					handleError(jqXHR, textStatus, errorThrown, url);
				} else {
					errorCallback(jqXHR, textStatus, errorThrown, url, param);
				}
			}
		});
		return res;
	},
	GET: function(url, contentType, successCallback, errorCallback, param) {
		return ERMREST.fetch(url, contentType, true, true, [], successCallback, errorCallback, param);
	},
	fetch: function(url, contentType, async, processData, obj, successCallback, errorCallback, param) {
		CHAISE_DATA['error'] = false;
		document.body.style.cursor = 'wait';
		var res = null;
		$.ajax({
			url: url,
			contentType: contentType,
			headers: make_headers(),
			timeout: AJAX_TIMEOUT,
			async: async,
			accepts: {text: 'application/json'},
			processData: processData,
			data: (processData ? obj : JSON.stringify(obj)),
			dataType: 'json',
			success: function(data, textStatus, jqXHR) {
				document.body.style.cursor = 'default';
				if (successCallback != null) {
					successCallback(data, textStatus, jqXHR, param);
				}
				res = data;
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (errorCallback == null) {
					handleError(jqXHR, textStatus, errorThrown, url);
				} else {
					errorCallback(jqXHR, textStatus, errorThrown, url, param);
				}
			}
		});
		return res;
	},
	DELETE: function(url, successCallback, errorCallback, param) {
		return ERMREST.remove(url, true, successCallback, errorCallback, param);
	},
	remove: function(url, async, successCallback, errorCallback, param) {
		CHAISE_DATA['error'] = false;
		document.body.style.cursor = 'wait';
		var res = null;
		$.ajax({
			url: url,
			headers: make_headers(),
			type: 'DELETE',
			timeout: AJAX_TIMEOUT,
			async: async,
			dataType: 'text',
			success: function(data, textStatus, jqXHR) {
				document.body.style.cursor = 'default';
				if (successCallback != null) {
					successCallback(data, textStatus, jqXHR, param);
				}
				res = data;
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (errorCallback == null) {
					handleError(jqXHR, textStatus, errorThrown, url);
				} else {
					errorCallback(jqXHR, textStatus, errorThrown, url, param);
				}
			}
		});
		return res;
	},
	PUT: function(url, contentType, async, processData, obj, successCallback, errorCallback, param) {
		CHAISE_DATA['error'] = false;
		document.body.style.cursor = 'wait';
		var res = null;
		$.ajax({
			url: url,
			contentType: contentType,
			headers: make_headers(),
			type: 'PUT',
			data: (processData ? obj : JSON.stringify(obj)),
			dataType: 'json',
			timeout: AJAX_TIMEOUT,
			processData: processData,
			async: async,
			success: function(data, textStatus, jqXHR) {
				document.body.style.cursor = 'default';
				if (successCallback != null) {
					successCallback(data, textStatus, jqXHR, param);
				}
				res = data;
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (errorCallback == null) {
					handleError(jqXHR, textStatus, errorThrown, url);
				} else {
					errorCallback(jqXHR, textStatus, errorThrown, url, param);
				}
			}
		});
		return res;
	}
};

function make_headers() {
	var res = {};
	token = $.cookie(goauth_cookie);
	if (token != null) {
		res['Authorization'] = 'Globus-Goauthtoken ' + token;
	}
	return res;
}

function submitLogin(username, password, referrer, action, input_user, input_password) {
	var url = HOME + (action != null ? action : '/ermrest/authn/session');
	var obj = {};

	if (input_user != null) {
		obj[input_user] = username;
	} else {
		obj['username'] = username;
	}
	if (input_password != null) {
		obj[input_password] = password;
	} else {
		obj['password'] = password;
	}
	var param = {};
	param['referrer'] = referrer;
	ERMREST.POST(url, 'application/x-www-form-urlencoded; charset=UTF-8', true, true, obj, successSubmitLogin, errorSubmitLogin, param);
}

function successSubmitLogin(data, textStatus, jqXHR, param) {
	var referrer = param['referrer'];
	window.location = referrer;
}

function errorSubmitLogin(jqXHR, textStatus, errorThrown, url, param) {
	if (jqXHR.status != 401) {
		handleError(jqXHR, textStatus, errorThrown, url);
	} else {
		var msg = '';
		var err = jqXHR.status;
		if (err != null) {
			msg += 'Status: ' + err + '\n';
		}
		err = jqXHR.responseText;
		if (err != null) {
			msg += 'ResponseText: ' + err + '\n';
		}
		if (textStatus != null) {
			msg += 'TextStatus: ' + textStatus + '\n';
		}
		if (errorThrown != null) {
			msg += 'ErrorThrown: ' + errorThrown + '\n';
		}
		msg += 'URL: ' + url + '\n';
		document.body.style.cursor = 'default';
		if (!suppressError) {
			alert(msg);
		}
	}
}

function make_basic_auth(user, password) {
	var tok = user + ':' + password;
	var hash = btoa(tok);
	return 'Basic ' + hash;
}

function submitLogout(logout_uri) {
	if (token != null) {
		$.removeCookie(goauth_cookie);
		token = null;
		USER = null;
	}
	$('#login_user').hide();
	$('#login_link').hide();
	$('#logout_link').hide();

	if (logout_uri == null) {
		logout_uri = chaiseConfig['logoutURL'];
	}
	var logout_url = (logout_uri != null ? logout_uri : '/chaise/logout');
	window.location = logout_url;
}

function encodeSafeURIComponent(value) {
	return fixedEncodeURIComponent(value);
}

function getMetadata(table, successCallback) {
	setAssociationTablesNames(table);
	var url = ERMREST_SCHEMA_HOME + encodeSafeURIComponent(table);
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successCallback, null, null);
}

function getTableColumns(options, successCallback) {
	setAssociationTables(options['table']);
	var metadata = options['metadata'];
	var sortInfo = options['sortInfo'];
	uniquenessColumns = [];
	initializedFacets = {};
	textColumns = [];
	unsortableColumns = [];

	// reset
	display_columns = {
		'text_columns': [],
		'file': [],
		'thumbnail': [],
		'zoomify': [],
		'3dview': [],
		'hidden': [],
		'url': [],
		'top_columns': [],
		'top_columns_annotation': []
	};

	PRIMARY_KEY = [];
	if (metadata['keys'] != null) {
		var unique_columns = [];
		$.each(metadata['keys'], function(i, key) {
			if (key['unique_columns'] != null) {
				unique_columns = key['unique_columns'];
				return false;
			}
		});
		$.each(unique_columns, function(i, col) {
			PRIMARY_KEY.push(encodeSafeURIComponent(col));
		});
	}
	var columns_definitions = [];
	var ret = [];
	if (metadata != null) {
		var column_definitions = metadata['column_definitions'];
		$.each(column_definitions, function(i, col) {
			if (col['annotations'] != null && col['annotations'][COLUMNS_LIST_URI] != null) {
				var comments = col['annotations'][COLUMNS_LIST_URI];
				if (comments.contains('top')) {
					uniquenessColumns.push(col['name']);
				}
				if (comments.contains('text')) {
					textColumns.push(col['name']);
				}
				if (comments.contains('unsortable')) {
					unsortableColumns.push(col['name']);
				}
				if (comments.contains('title')) {
					display_columns['title'] = col['name'];
				}
				if (comments.contains('subtitle')) {
					display_columns['subtitle'] = col['name'];
				}
				if (comments.contains('summary')) {
					display_columns['summary'] = col['name'];
				}
				if (comments.contains('thumbnail')) {
					display_columns['thumbnail'].push(col['name']);
				}
				if (comments.contains('zoomify')) {
					display_columns['zoomify'].push(col['name']);
				}
				if (comments.contains('3dview')) {
					display_columns['3dview'].push(col['name']);
				}
				if (comments.contains('html')) {
					display_columns['text_columns'].push(col['name']);
				}
				if (comments.contains('file')) {
					display_columns['file'].push(col['name']);
				}
				if (comments.contains('hidden')) {
					display_columns['hidden'].push(col['name']);
				}
				if (comments.contains('url')) {
					display_columns['url'].push(col['name']);
				}
			}
			if (!hasAnnotation(options['table'], col['name'], 'hidden')) {
				var col_def = {};
				col_def['field'] = col['name'];
				columns_definitions.push(col_def);
				var display = getColumnDisplayName(col['name']);
				if (col['annotations'] != null && col['annotations'][COLUMNS_MAP_URI] != null && col['annotations'][COLUMNS_MAP_URI]['display'] != null) {
					display = col['annotations'][COLUMNS_MAP_URI]['display'];
				}
				ret.push({'name': col['name'],
					'display': display,
					'table': options['table'],
					'alias': 'A'});
				sortInfo['fields'].push(col['name']);
				sortInfo['directions'].push('desc');
			}
		});
	}
	if (PRIMARY_KEY.length == 0) {
		$.each(ret, function(i, col) {
			PRIMARY_KEY.push(encodeSafeURIComponent(col['name']));
		});
	}

	if (display_columns['title'] == null && display_columns['thumbnail'].length == 0) {
		display_columns['title'] = decodeURIComponent(PRIMARY_KEY[0]);
	}

	var table = options['table'];
	options['box'][table] = {};
	options['colsGroup'][table] = {};
	options['facetClass'][table] = {};
	options['chooseColumns'][table] = {};
	options['searchFilterValue'][table] = {};
	options['narrow'][table] = {};

	var facets = ret;
	facets.sort(compareFacets);
	$.each(facets, function(i, facet) {
		if (getFacetOrder(facet) != null || hasAnnotation(facet['table'], facet['name'], 'top') || facetIsInBookmark(facet['table'], facet['name'], options.filter)) {
			options['chooseColumns'][facet['table']][facet['name']] = true;
		}
	});

	var columns = {'facets': ret,
			'sortInfo': sortInfo,
			'colsDefs': columns_definitions};

	getAssociationTableColumns(options, successCallback, columns);
}

function getPredicate(options, excludeColumn, table_name, peviousTable, aliases) {
	if (table_name == null) {
		table_name = options['table'];
	}
	var tables = (peviousTable != null ? [peviousTable] : [options['table']].concat(association_tables_names));
	var filterAllText = options['filterAllText'];
	var predicate = [];
	$.each(tables, function(i,table) {
		var tablePredicate = [];
		var colsDescr = options['colsDescr'][table];
		$.each(options['box'][table], function(key, value) {
			if (table == table_name && key == excludeColumn) {
				return true;
			}
			if (searchBoxPresentation.contains(colsDescr[key]['type'])) {
				value = value['value'].split(' ');
				$.each(value, function(i, val) {
					if (val.length > 0) {
						tablePredicate.push(encodeSafeURIComponent(key) + '::ciregexp::' + encodeSafeURIComponent(encodeRegularExpression(val)));
					}
				});
			} else if (sliderPresentation.contains(colsDescr[key]['type']) || datepickerPresentation.contains(colsDescr[key]['type'])) {
				if (value['left']) {
					tablePredicate.push(encodeSafeURIComponent(key) + '::geq::' + encodeSafeURIComponent(value['min']));
				}
				if (value['right']) {
					tablePredicate.push(encodeSafeURIComponent(key) + '::leq::' + encodeSafeURIComponent(value['max']));
				}
			} else if (colsDescr[key]['type'] == 'enum') {
				var checkValues = [];
				$.each(value['values'], function(checkbox_key, checkbox_value) {
					if (checkbox_value) {
						checkValues.push(encodeSafeURIComponent(key) + '=' + encodeSafeURIComponent(checkbox_key));
					}
				});
				checkValues = checkValues.join(';');
				if (checkValues.length > 0) {
					tablePredicate.push(checkValues);
				}
			} else if (colsDescr[key]['type'] == 'select') {
				var selectedValues = [];
				$.each(value['value'], function(i, selectedValue) {
					selectedValues.push(encodeSafeURIComponent(key) + '=' + encodeSafeURIComponent(selectedValue));
				});
				selectedValues = selectedValues.join(';');
				if (selectedValues.length > 0) {
					tablePredicate.push(selectedValues);
				}
			}
		});
		if (tablePredicate.length > 0) {
			if (table != options['table'] && association_tables[table] != null) {
				predicate.push('$A');
				predicate.push(association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table));
				if (aliases != null) {
					aliases.push(association_tables[table]['alias']);
				}
			}
			predicate = predicate.concat(tablePredicate);
		}
	});

	if (filterAllText && filterAllText != '') {
		predicate.push(encodeSafeURIComponent('*') + '::ciregexp::' + encodeSafeURIComponent(encodeRegularExpression(filterAllText)));
	}
	return predicate;
}

function getErmrestData(options, successCallback, successUpdateModels) {
	//options.progress = true;
	setBookmark(options);
	updateCount(options, successUpdateModels);
	var url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options);
	var predicate = getPredicate(options, null, null, null, null);
	if (predicate.length > 0) {
		url += '/' + predicate.join('/');
	}
	updateGroups(options, successUpdateModels);
	updateSliders(options, successUpdateModels);
	var aggregateFunction = (PRIMARY_KEY.length >= 1) ? 'cnt_d(' + PRIMARY_KEY[0] + ')' : 'cnt(*)';
	url += '/$A/cnt:=' + aggregateFunction;
	var param = {};
	param['options'] = options;
	param['successCallback'] = successCallback;
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successTotalCount, null, param);
}

function searchFilters(options, successCallback) {
	var url = ERMREST_DATA_HOME + '/textfacet/' + encodeSafeURIComponent(options.searchFilter);
	var param = {};
	param['options'] = options;
	param['successCallback'] = successCallback;
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successSearchFilters, null, param);
}

function successSearchFilters(data, textStatus, jqXHR, param) {
	var options = param['options'];
	emptyJSON(options['enabledFilters']);
	var enabledFilters = options['enabledFilters'];
	$.each(data, function(i, item) {
		if (item['schema'] != SCHEMA) {
			return true;
		}
		if (enabledFilters[item['table']] == null) {
			enabledFilters[item['table']] = [];
		}
		enabledFilters[item['table']].push(item['column']);
	});

	param['successCallback']();
}

function successTotalCount(data, textStatus, jqXHR, param) {
	getPage(param['options'], data[0]['cnt'], param['successCallback'])
}

function initModels(options, successCallback) {
	var allAttributes = (chaiseConfig['showAllAttributes'] ? true : false);
	var table = options['table'];
	var box = options['box'][table];
	var colsDescr = options['colsDescr'][options['table']];
	var colsGroup = options['colsGroup'][options['table']];
	var topN = {};
	var j = 0;
	$.each(options['chooseColumns'], function(facetTable, chooseColumns) {
		$.each(chooseColumns, function(facetColumn, value) {
			if (value) {
				j++;
				if (topN[facetTable] == null) {
					topN[facetTable] = [];
				}
				topN[facetTable].push(facetColumn);
			}
		});
	});
	var topColumns = getTableAnnotation(table, TABLES_MAP_URI, 'top_columns');
	if (topColumns != null) {
		display_columns['top_columns_annotation'] = topColumns;
		display_columns['top_columns'] = [];
		$.each(topColumns, function(i,col) {
			display_columns['top_columns'].push(col);
		});
	}

	var facetOrder = j;
	var extraFacets = [];
	$.each(options['score'], function(i,col) {
		if ((topN[options['table']] == null || !topN[options['table']].contains(col['name'])) && !hasAnnotation(options['table'], col['name'], 'hidden') && !hasAnnotation(options['table'], col['name'], 'thumbnail')) {
			if (allAttributes || j < 10) {
				extraFacets.push(col['name']);
				j++;
			} else {
				return false;
			}
		}
	});
	var sentRequests = false;
	if (colsDescr != null) {
		$.each(colsDescr, function(col, value) {
			if (hasAnnotation(table, col, 'hidden')) {
				return true;
			}
			options['chooseColumns'][table][col] = topN[options['table']] != null && topN[options['table']].contains(col) || extraFacets.contains(col);
			options['searchFilterValue'][table][col] = '';
			options['facetClass'][table][col] = '';
			box[col] = {};
			box[col]['count'] = col;
			box[col]['facetcount'] = 0;
			if (value['type'] == 'enum') {
				colsGroup[col] = {};
				colsGroup[col]['ready'] = false;
				box[col]['values'] = {};
				sentRequests = true;
			} else if (value['type'] == 'select') {
				box[col]['value'] = [];
			} else if (searchBoxPresentation.contains(value['type'])) {
				box[col]['value'] = '';
			} else if (datepickerPresentation.contains(value['type'])) {
				box[col]['min'] = box[col]['floor'] = getDateString(value['min'], 'min');
				box[col]['max'] = box[col]['ceil'] = getDateString(value['max'], 'max');
				sentRequests = true;
			} else if (sliderPresentation.contains(value['type'])) {
				box[col]['min'] = box[col]['floor'] = value['min'];
				box[col]['max'] = box[col]['ceil'] = value['max'];
				sentRequests = true;
			}
		});
	}
	var topCount = 0;
	$.each(association_tables_names, function(i, table) {
		if (hasTableFacetsHidden(table)) {
			return true;
		}
		var box = options['box'][table];
		var colsDescr = options['colsDescr'][table];
		var colsGroup = options['colsGroup'][table];
		if (colsDescr != null) {
			$.each(colsDescr, function(col, value) {
				var hasTop = (hasTableFacetsHidden(table) || hasColumnFacetHidden(table, col)) ? false : topN[table] != null && topN[table].contains(col) || hasAnnotation(table, col, 'top');
				options['chooseColumns'][table][col] = hasTop;
				options['searchFilterValue'][table][col] = '';
				if (hasTop) {
					topCount++;
				}
				options['facetClass'][table][col] = '';
				box[col] = {};
				box[col]['count'] = col;
				box[col]['facetcount'] = 0;
				if (value['type'] == 'enum') {
					colsGroup[col] = {};
					colsGroup[col]['ready'] = false;
					box[col]['values'] = {};
					sentRequests = true;
				} else if (value['type'] == 'select') {
					box[col]['value'] = [];
				} else if (searchBoxPresentation.contains(value['type'])) {
					box[col]['value'] = '';
				} else if (datepickerPresentation.contains(value['type'])) {
					box[col]['min'] = box[col]['floor'] = getDateString(value['min'], 'min');
					box[col]['max'] = box[col]['ceil'] = getDateString(value['max'], 'max');
					sentRequests = true;
				} else if (sliderPresentation.contains(value['type'])) {
					box[col]['min'] = box[col]['floor'] = value['min'];
					box[col]['max'] = box[col]['ceil'] = value['max'];
					sentRequests = true;
				}
			});
		}
	});
	var index = 10 - facetOrder - topCount;
	var table = options['table'];
	if (!allAttributes && index > 0) {
		$.each(extraFacets, function(i, col) {
			options['chooseColumns'][table][extraFacets[i]] = false;
			options['searchFilterValue'][table][extraFacets[i]] = '';
		});
	}

	if (!sentRequests) {
		successCallback(true);
	} else {
		updateGroups(options, successCallback);
		updateSliders(options, successCallback);
	}
}

function updateCount(options, successCallback) {
	var predicateAttributes = getPredicateAttributes(options);
	var nonPredicateAttributes = {};
	var tables = [options['table']].concat(association_tables_names);
	var alertObject = {'display': true};
	var sentRequest = false;
	var urlPrefix = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options) + '/';
	$.each(tables, function(i, table) {
		if (!hasTableFacetsHidden(table)) {
			var box = options['box'][table];
			$.each(box, function(col, value) {
				if (!hasColumnFacetHidden(table, col) && !isColumnFacetOnDemand(options, table, col) && !hasAnnotation(table, col, 'hidden')) {
					box[col]['ready'] = false;
				}
			});
			$.each(box, function(col, value) {
				if (!hasColumnFacetHidden(table, col) && !isColumnFacetOnDemand(options, table, col) && !hasAnnotation(table, col, 'hidden')) {
					if (predicateAttributes[table] == null || !predicateAttributes[table].contains(col)) {
						if (nonPredicateAttributes[table] == null) {
							nonPredicateAttributes[table] = [];
						}
						nonPredicateAttributes[table].push(col);
						return true;
					}
					var aliases = [];
					var predicate = getPredicate(options, col, table, null, aliases);
					var url = urlPrefix;
					if (predicate != null && predicate.length > 0) {
						url += predicate.join('/') + '/' ;
					}
					var aliasDef = '';
					if (association_tables_names.contains(table)) {
						if (!aliases.contains(association_tables[table]['alias'])) {
							aliasDef = '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table) + '/';
						}
					}
					var tableRef = (association_tables_names.contains(table)
						? aliasDef + '$A/$' + association_tables[table]['alias']
						: '$A');
					url += tableRef +  '/' + 'cnt_' + encodeSafeURIComponent(col) + ':=cnt(' + encodeSafeURIComponent(col) + ')';
					var param = {};
					param['options'] = options;
					param['table'] = table;
					param['cols'] = [col];
					param['alert'] = alertObject;
					param['successCallback'] = successCallback;
					sentRequest = true;
					ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateCount, errorErmrest, param);
				} else if (isColumnFacetOnDemand(options, table, col)) {
					box[col]['count'] = col + ' (1)';
					box[col]['facetcount'] = 1;
				}
			});
		}
	});
	$.each(nonPredicateAttributes, function(table, cols) {
		var urlSuffix = [];
		$.each(cols, function(i, col) {
			urlSuffix.push('cnt_' + encodeSafeURIComponent(col) + ':=cnt(' + encodeSafeURIComponent(col) + ')');
		});
		urlSuffix = urlSuffix.join(',');
		var aliases = [];
		var predicate = getPredicate(options, null, table, null, aliases);
		var url = urlPrefix;
		if (predicate != null && predicate.length > 0) {
			url += predicate.join('/') + '/' ;
		}
		var aliasDef = '';
		if (association_tables_names.contains(table)) {
			if (!aliases.contains(association_tables[table]['alias'])) {
				aliasDef = '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table) + '/';
			}
		}
		var tableRef = (association_tables_names.contains(table)
			? aliasDef + '$A/$' + association_tables[table]['alias']
			: '$A');
		url += tableRef +  '/' + urlSuffix;
		var param = {};
		param['options'] = options;
		param['table'] = table;
		param['cols'] = cols;
		param['alert'] = alertObject;
		param['successCallback'] = successCallback;
		sentRequest = true;
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateCount, errorErmrest, param);
	});
	if (!sentRequest) {
		successCallback();
	}
}

function successUpdateCount(data, textStatus, jqXHR, param) {
	var options = param['options'];
	var table = param['table'];
	if (table == null) {
		table = param['options']['table'];
	}
	var box = param['options']['box'][table];
	var cols = param['cols'];
	$.each(cols, function(i, col) {
		box[col]['ready'] = true;
		box[col]['count'] = col + ' (' + data[0][('cnt_' + col).substring(0,63)] + ')';
		box[col]['facetcount'] = data[0][('cnt_' + col).substring(0,63)];
	});
	var ready = true;
	var tables = [options['table']].concat(association_tables_names);
	$.each(tables, function(i, table) {
		if (!hasTableFacetsHidden(table)) {
			var box = param['options']['box'][table];
			$.each(box, function(col, value) {
				if (!hasColumnFacetHidden(table, col) && !isColumnFacetOnDemand(options, table, col) && !hasAnnotation(table, col, 'hidden')) {
					if (!value['ready']) {
						ready = false;
						return false;
					}
				}
			});
			if (!ready) {
				return false;
			}
		}
	});
	if (ready) {
		$.each(tables, function(i, table) {
			if (!hasTableFacetsHidden(table)) {
				var box = param['options']['box'][table];
				$.each(box, function(key, value) {
					if (!hasColumnFacetHidden(table, key) && !isColumnFacetOnDemand(options, table, key)) {
						delete value['ready'];
					}
				});
			}
		});
		param['successCallback']();
	}
}

function updateGroups(options, successCallback) {
	var tables = [options['table']].concat(association_tables_names);
	var alertObject = {'display': true};
	var sentRequest = false;
	$.each(tables, function(i, table) {
		if (!hasTableFacetsHidden(table)) {
			$.each(options['colsGroup'][table], function(col, values) {
				if (hasAnnotation(table, col, 'dataset')) {
					options['colsGroup'][table][col]['cnt'] = 0;
					options['colsGroup'][table][col]['ready'] = true;
					return true;
				}
				if (!hasAnnotation(table, col, 'hidden')  || !hasColumnFacetHidden(table, col) && !isColumnFacetOnDemand(options, table, col)) {
					var aliases = [];
					var predicate = getPredicate(options, col, table, null, aliases);
					var aliasDef = '';
					if (association_tables_names.contains(table)) {
						if (!aliases.contains(association_tables[table]['alias'])) {
							aliasDef = '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table) + '/';
						}
					}
					var tableRef = (association_tables_names.contains(table)
						? aliasDef + '$A/$' + association_tables[table]['alias']
						: '$A');
					var param = {};
					param['alert'] = alertObject;
					var col_name = encodeSafeURIComponent(col);
					param['successCallback'] = successCallback;
					param['options'] = options;
					param['col'] = col;
					param['table'] = table;
					var url = ERMREST_DATA_HOME + '/attributegroup/' + getQueryPredicate(options) + '/';
					if (predicate != null && predicate.length > 0) {
						url += predicate.join('/') + '/';
					}
					url += tableRef +  '/' + col_name + ';cnt:=cnt(' + col_name + ')';
					ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateGroups, errorErmrest, param);
					sentRequest = true;
				}
			});
		}
	});
	if (!sentRequest) {
		successCallback();
	}
}

function successUpdateGroups(data, textStatus, jqXHR, param) {
	var options = param['options'];
	var table = param['table'];
	var values = [];
	var hideValues = [];
	var colsGroup = param['options']['colsGroup'][table];
	var col = param['col'];
	var box = param['options']['box'][table];
	colsGroup[col]['ready'] = true;
	$.each(data, function(i, value) {
		var key = value[col];
		if (key != null) {
			colsGroup[col][key] = value['cnt'];
			if (key===true) {
				values.push('true');
			} else if (key===false) {
				values.push('false');
			} else {
				values.push(key);
			}
		}
	});
	$.each(colsGroup[col], function(key, value) {
		if (key != 'ready' && !values.contains(key)) {
			hideValues.push(key);
		}
	});
	$.each(hideValues, function(i, key) {
		colsGroup[col][key] = 0;
	});
	var ready = true;
	var tables = [options['table']].concat(association_tables_names);
	$.each(tables, function(i, table) {
		if (!hasTableFacetsHidden(table)) {
			var colsGroup = param['options']['colsGroup'][table];
			$.each(colsGroup, function(key, value) {
				if (!hasColumnFacetHidden(table, key) && !isColumnFacetOnDemand(options, table, key)) {
					if (!value['ready']) {
						ready = false;
						return false;
					}
				}
			});
			if (!ready) {
				return false;
			}
		}
	});
	if (ready) {
		$.each(tables, function(i, table) {
			if (!hasTableFacetsHidden(table)) {
				var colsGroup = param['options']['colsGroup'][table];
				$.each(colsGroup, function(key, value) {
					if (!hasColumnFacetHidden(table, key) && !isColumnFacetOnDemand(options, table, key)) {
						delete value['ready'];
					}
				});
			}
		});
		param['successCallback']();
	}
}

function updateSliders(options, successCallback) {
	var tables = [options['table']].concat(association_tables_names);
	var alertObject = {'display': true};
	var sentRequest = false;
	var urlPrefix = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options) + '/';
	var predicateAttributes = getPredicateAttributes(options);
	var nonPredicateAttributes = {};
	$.each(tables, function(i, table) {
		if (!hasTableFacetsHidden(table)) {
			$.each(options['box'][table], function(col, values) {
				if (!hasColumnFacetHidden(table, col) && !isColumnFacetOnDemand(options, table, col)) {
					if (values['floor'] != null) {
						if (predicateAttributes[table] == null || !predicateAttributes[table].contains(col)) {
							if (nonPredicateAttributes[table] == null) {
								nonPredicateAttributes[table] = [];
							}
							nonPredicateAttributes[table].push(col);
							return true;
						}
						var aliases = [];
						var predicate = getPredicate(options, values['left'] || values['right'] ? null : col, table, null, aliases);
						var aliasDef = '';
						if (association_tables_names.contains(table)) {
							if (!aliases.contains(association_tables[table]['alias'])) {
								aliasDef = '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table) + '/';
							}
						}
						var tableRef = (association_tables_names.contains(table)
							? aliasDef + '$A/$' + association_tables[table]['alias']
							: '$A');
						var param = {};
						param['alert'] = alertObject;
						param['successCallback'] = successCallback;
						param['options'] = options;
						param['col'] = [col];
						param['table'] = table;
						var url = urlPrefix;
						if (predicate != null && predicate.length > 0) {
							url += predicate.join('/') + '/';
						}
						url += tableRef +  '/' + 'min_' + encodeSafeURIComponent(col) + ':=min(' + encodeSafeURIComponent(col) + '),max_' + encodeSafeURIComponent(col) + ':=max(' + encodeSafeURIComponent(col) + ')';
						ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateSliders, errorErmrest, param);
						sentRequest = true;
					}
				}
			});
		}
	});
	$.each(nonPredicateAttributes, function(table, cols) {
		var urlSuffix = [];
		$.each(cols, function(i, col) {
			urlSuffix.push('min_' + encodeSafeURIComponent(col) + ':=min(' + encodeSafeURIComponent(col) + ')' + ',' + 'max_' + encodeSafeURIComponent(col) + ':=max(' + encodeSafeURIComponent(col) + ')');
		});
		urlSuffix = urlSuffix.join(',');
		var aliases = [];
		var predicate = getPredicate(options, null, table, null, aliases);
		var aliasDef = '';
		if (association_tables_names.contains(table)) {
			if (!aliases.contains(association_tables[table]['alias'])) {
				aliasDef = '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table) + '/';
			}
		}
		var tableRef = (association_tables_names.contains(table)
			? aliasDef + '$A/$' + association_tables[table]['alias']
			: '$A');
		var param = {};
		param['alert'] = alertObject;
		param['successCallback'] = successCallback;
		param['options'] = options;
		param['cols'] = cols;
		param['table'] = table;
		var url = urlPrefix;
		if (predicate != null && predicate.length > 0) {
			url += predicate.join('/') + '/';
		}
		url += tableRef +  '/' + urlSuffix;
		var param = {};
		param['options'] = options;
		param['table'] = table;
		param['cols'] = cols;
		param['alert'] = alertObject;
		param['successCallback'] = successCallback;
		sentRequest = true;
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateSliders, errorErmrest, param);
	});
	if (!sentRequest) {
		successCallback();
	}
}

function successUpdateSliders(data, textStatus, jqXHR, param) {
	var options = param['options'];
	var table = param['table'];
	var cols = param['cols'];
	var box = param['options']['box'][table];
    if (cols !== undefined) {
        $.each(cols, function (i, col) {
            box[col]['ready'] = true;
            if (data[0]['min_' + encodeSafeURIComponent(col)] != null) {
                var colType = options['colsDescr'][table][col]['type'];
                if (!box[col]['left']) {
                    box[col]['min'] = data[0]['min_' + encodeSafeURIComponent(col)];
                    if (datepickerPresentation.contains(colType)) {
                        box[col]['min'] = getDateString(box[col]['min'], 'min');
                    }
                }
                if (!box[col]['right']) {
                    box[col]['max'] = data[0]['max_' + encodeSafeURIComponent(col)];
                    if (datepickerPresentation.contains(colType)) {
                        box[col]['max'] = getDateString(box[col]['max'], 'max');
                    }
                }
                if (box[col]['right'] && box[col]['max'] == box[col]['ceil']) {
                    delete box[col]['right'];
                }
                if (box[col]['left'] && box[col]['min'] == box[col]['floor']) {
                    delete box[col]['left'];
                }
            }
        });
    }
	var ready = true;
	var tables = [options['table']].concat(association_tables_names);
	$.each(tables, function(i, table) {
		if (!hasTableFacetsHidden(table)) {
			var box = param['options']['box'][table];
			$.each(box, function(key, value) {
				if (!hasColumnFacetHidden(table, key) && !isColumnFacetOnDemand(options, table, key)) {
					if (value['floor'] != null && !value['ready']) {
						ready = false;
						return false;
					}
				}
			});
			if (!ready) {
				return false;
			}
		}
	});
	if (ready) {
		$.each(tables, function(i, table) {
			if (!hasTableFacetsHidden(table)) {
				var box = param['options']['box'][table];
				$.each(box, function(key, value) {
					if (!hasColumnFacetHidden(table, key) && !isColumnFacetOnDemand(options, table, key)) {
						if (value['floor'] != null) {
							delete value['ready'];
						}
					}
				});
			}
		});
		param['successCallback']();
	}
}

function getColumnDescriptions(options, successCallback) {
	var ret = {};
	var metadata = options['metadata'];
	if (metadata != null) {
		var column_definitions = metadata['column_definitions'];
		$.each(column_definitions, function(i, col) {
			if (col['type']['typename'] != 'json' && !hasColumnFacetHidden(options['table'], col['name']) && !hasAnnotation(options['table'], col['name'], 'hidden')) {
				var col_name = col['name'];
				var col_type = col['type']['typename'];
				var obj = {};
				obj['type'] = col_type;
				obj['ready'] = (facetPolicy != 'on_demand' || isSelectedColumnFacetOnDemand(options, options['table'], col['name']) || facetIsInBookmark(options['table'], col['name'], options.filter)) ? false : true;
				ret[col_name] = obj;
			}
		});
		var alertObject = {'display': true};
		var sentRequests = false;
		var urlSuffixes = [];
		var cols = [];
		$.each(ret, function(col, obj) {
			if (obj['ready']) {
				return true;
			}
			var urlSuffix = null;
			if (!searchBoxPresentation.contains(obj['type']) && !checkBoxPresentation.contains(obj['type']) && !sliderPresentation.contains(obj['type']) && !datepickerPresentation.contains(obj['type'])) {
				searchBoxPresentation.push(obj['type']);
			}
			if (searchBoxPresentation.contains(obj['type']) || checkBoxPresentation.contains(obj['type'])) {
				urlSuffix = 'cnt_d_' + encodeSafeURIComponent(col) + ':=cnt_d(' + encodeSafeURIComponent(col) + ')';
			} else if (sliderPresentation.contains(obj['type']) || datepickerPresentation.contains(obj['type'])) {
				urlSuffix = 'min_' + encodeSafeURIComponent(col) + ':=min(' + encodeSafeURIComponent(col) + '),max_' + encodeSafeURIComponent(col) + ':=max(' + encodeSafeURIComponent(col) + ')';
			} else {
				console.log('Type not found: '+obj['type']);
			}
			if (urlSuffix != null) {
				urlSuffixes.push(urlSuffix);
				cols.push(col);
			}
		});
		if (urlSuffixes.length > 0) {
			sentRequests = true;
			var param = {};
			param['options'] = options;
			param['alert'] = alertObject;
			param['successCallback'] = successCallback;
			param['entity'] = ret;
			param['cols'] = cols;
			var url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options) + '/$A/' + urlSuffixes.join(',');
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, errorErmrest, param);
		}

		if (!sentRequests) {
			$.each(ret, function(key, value) {
				delete value['ready'];
			});
			options['colsDescr'][options['table']] = ret;
			if (association_tables_names.length > 0) {
				getAssociationColumnsDescriptions(options, successCallback);
			} else {
				successCallback();
			}
		}
	} else {
		successCallback();
	}
}

function successGetColumnDescriptions(data, textStatus, jqXHR, param) {
	var cols = param['cols'];
	var entity = param['entity'];
	var options = param['options'];
	var alertObject = param['alert'];
	var successCallback = param['successCallback'];
	$.each(cols, function(i, col) {
		if (searchBoxPresentation.contains(entity[col]['type']) || checkBoxPresentation.contains(entity[col]['type'])) {
			if (data[0][('cnt_d_' + col).substring(0,63)] <= MULTI_SELECT_LIMIT && !textColumns.contains(col)) {
				var url = ERMREST_DATA_HOME + '/attributegroup/' + getQueryPredicate(options) + '/$A/' +
					getSortGroup(options['table'], col, 'rank') + '@sort(' + encodeSafeURIComponent(getSortColumn(options['table'], col, 'rank')) + ')?limit=none';
				var attributegroupParam = {};
				attributegroupParam['successCallback'] = successCallback;
				entity[col]['type'] = 'enum';
				attributegroupParam['entity'] = entity;
				attributegroupParam['cols'] = [col];
				attributegroupParam['options'] = options;
				attributegroupParam['alert'] = alertObject;
				ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, errorErmrest, attributegroupParam);
			} else if (data[0][('cnt_d_' + col).substring(0,63)] >= MULTI_SELECT_LIMIT) {
				var url = ERMREST_DATA_HOME + '/attributegroup/' + getQueryPredicate(param['options']) + '/$A/' +
					getSortGroup(options['table'], col, 'rank') + '@sort(' + encodeSafeURIComponent(getSortColumn(options['table'], col, 'rank')) + ')?limit=none';
				var attributegroupParam = {};
				attributegroupParam['successCallback'] = successCallback;
				//entity[col]['type'] = 'select';
				attributegroupParam['entity'] = entity;
				attributegroupParam['cols'] = [col];
				attributegroupParam['options'] = options;
				attributegroupParam['alert'] = alertObject;
				ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, errorErmrest, attributegroupParam);
			} else {
				entity[col]['ready'] = true;
			}
		} else if (entity[col]['type'] == 'enum') {
			entity[col]['ready'] = true;
			var values = [];
			$.each(data, function(i, row) {
				if (row[col] != null) {
					values.push(row[col]);
				}
			});
			entity[col]['values'] = values;
		} else if (entity[col]['type'] == 'select') {
			entity[col]['ready'] = true;
			var values = [];
			$.each(data, function(i, row) {
				if (row[col] != null) {
					values.push(row[col]);
				}
			});
			entity[col]['values'] = values;
		} else if (sliderPresentation.contains(entity[col]['type'])) {
			entity[col]['ready'] = true;
			entity[col]['min'] = data[0][('min_' + col).substring(0,63)];
			entity[col]['max'] = data[0][('max_' + col).substring(0,63)];
		} else if (datepickerPresentation.contains(entity[col]['type'])) {
			entity[col]['ready'] = true;
			entity[col]['min'] = getDateString(data[0][('min_' + col).substring(0,63)], 'min');
			entity[col]['max'] = getDateString(data[0][('max_' + col).substring(0,63)], 'max');
		}
	});
	var ready = true;
	$.each(entity, function(key, value) {
		if (!value['ready']) {
			ready = false;
			return false;
		}
	});
	if (ready) {
		$.each(entity, function(key, value) {
			delete value['ready'];
		});
		options['colsDescr'][options['table']] = entity;
		if (association_tables_names.length > 0) {
			getAssociationColumnsDescriptions(options, param['successCallback']);
		} else {
			param['successCallback']();
		}
	}
}

function getSortQuery(sortOption, isAttribute) {
	var field = encodeSafeURIComponent(sortOption['fields'][0]);
	var direction = sortOption['directions'][0];
	var columns = [];
	var sortColumns = [];
	sortColumns.push(direction=='desc' ? field+'::desc::' : field);
	if (PRIMARY_KEY != null) {
		$.each(PRIMARY_KEY, function(i, key) {
			if (key != field) {
				sortColumns.push(key);
			}
		});
		if (isAttribute) {
			columns.push(field);
			$.each(PRIMARY_KEY, function(i, key) {
				if (key != field) {
					columns.push(key);
				}
			});
		}
	}
	var ret = columns.join(',') + '@sort(' + sortColumns.join(',') + ')';
	return ret;
}

function getSortClause(sortOption, sortOrder, isAttribute) {
	var field = encodeSafeURIComponent(sortOption);
	var sortField = field;
	if (sortOrder == 'desc') {
		sortField += '::desc::';
	}
	var columns = [];
	var sortColumns = [];
	sortColumns.push(sortField);
	if (PRIMARY_KEY != null) {
		$.each(PRIMARY_KEY, function(i, key) {
			if (encodeSafeURIComponent(key) != field) {
				sortColumns.push(encodeSafeURIComponent(key));
			}
		});
		if (isAttribute) {
			columns.push(field);
			$.each(PRIMARY_KEY, function(i, key) {
				if (encodeSafeURIComponent(key) != field) {
					columns.push(encodeSafeURIComponent(key));
				}
			});
		}
	}
	var ret = columns.join(',') + '@sort(' + sortColumns.join(',') + ')';
	return ret;
}

function getPage(options, totalItems, successCallback) {
	var page = options['pagingOptions']['currentPage'];
	var pageSize = options['pagingOptions']['pageSize'];
	var sortOption = options['sortFacet'];
	var sortOrder = options['sortOrder'];
	if (!$.isNumeric(page) || Math.floor(page) != page || page <= 0) {
		successCallback([], totalItems, page, pageSize);
	} else {
		var url = ERMREST_DATA_HOME + '/attribute/' + getQueryPredicate(options);
		var predicate = getPredicate(options, null, null, null, null);
		if (predicate.length > 0) {
			url += '/' + predicate.join('/');
		}
		url += '/$A'
		if (sortOption != null && sortOption != '') {
			url += '/' + getSortClause(sortOption, sortOrder, true);
		} else if (PRIMARY_KEY.length > 0) {
			url += '/' + PRIMARY_KEY.join(',') + '@sort(' + PRIMARY_KEY.join(',') + ')';
		}
		url += '?limit=' + ((page-1)*pageSize + 1);
		var param = {};
		param['options'] = options;
		param['predicate'] = predicate;
		param['totalItems'] = totalItems;
		param['successCallback'] = successCallback;
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetPagePredicate, null, param);
	}
}

function primaryKeySortPredicate(uniqueKeys, values) {
	if (uniqueKeys.length == 0) {
		return [];
	} else {
		var value = values[decodeURIComponent(uniqueKeys[0])];
		if (value == null) {
			var ret = primaryKeySortPredicate(uniqueKeys.slice(1, uniqueKeys.length), values);
			for (var i=0; i < ret.length; i++) {
				ret[i] = [uniqueKeys[0] + '::null::'].concat(ret[i]);
			}
			return ret;
		} else {
			var part1 = primaryKeySortPredicate(uniqueKeys.slice(1, uniqueKeys.length), values);
			for (var i=0; i < part1.length; i++) {
				part1[i] = [uniqueKeys[0] + '=' + encodeSafeURIComponent(value)].concat(part1[i]);
			}
			var part2 = [[uniqueKeys[0] + '::gt::' + encodeSafeURIComponent(value)]];
			return part1.concat(part2);
		}
	}
}

function successGetPagePredicate(data, textStatus, jqXHR, param) {
	var page = param['options']['pagingOptions']['currentPage'];
	var pageSize = param['options']['pagingOptions']['pageSize'];
	var sortOption = param['options']['sortFacet'];
	var sortOrder = param['options']['sortOrder'];
	if (data.length < (page-1)*pageSize + 1) {
		param['successCallback']([], param['totalItems']);
	} else {
		param['queryPath'] = param['predicate'].slice();
		var predicate = param['predicate'];
		var exportPredicate = predicate.slice();
		if (sortOption != null && sortOption != '') {
			var sortPredicate = getSortPredicate(data, sortOption, sortOrder, page, pageSize);
			predicate.push('$A/' + sortPredicate.join(';'));
			var exportSortPredicate = getExportSortPredicate(data, sortOption, sortOrder);
			exportPredicate.push('$A/' + exportSortPredicate.join(';'));
		} else {
			if (page > 1) {
				var firstRow = [];
				for (var i=0; i < PRIMARY_KEY.length; i++) {
					var value = data[(page-1)*pageSize][decodeURIComponent(PRIMARY_KEY[i])];
					if (value == null) {
						firstRow.push(PRIMARY_KEY[i] + '::null::');
					} else {
						firstRow.push(PRIMARY_KEY[i] + '=' + encodeSafeURIComponent(value));
					}
				}
				firstRow = [firstRow.join('&')];
				var primaryKeyPredicate = primaryKeySortPredicate(PRIMARY_KEY, data[(page-1)*pageSize]);
				$.each(primaryKeyPredicate, function(i, row) {
					primaryKeyPredicate[i] = row.join('&');
				});
				primaryKeyPredicate = firstRow.concat(primaryKeyPredicate);
				predicate.push('$A/' + primaryKeyPredicate.join(';'));
			}
		}
		var url = ERMREST_DATA_HOME + '/entity/' + getQueryPredicate(param['options']);
		var exportUrl = url;
		param['queryPredicate'] = getQueryPredicate(param['options']);
		param['primaryKey'] = PRIMARY_KEY[0];
		if (predicate.length > 0) {
  			url += '/' + predicate.join('/');
  		}
  		url += '/$A';
		param['options']['exportOptions']['exportPredicate'] = param['queryPredicate'];
        if (exportPredicate.length > 0) {
			var predicatePath = '/' + exportPredicate.join('/');
			param['options']['exportOptions']['exportPredicate'] += predicatePath;
			exportUrl += predicatePath;
		}
		exportUrl += '/$A';
		var sortClause = '@sort(' + PRIMARY_KEY.join(',') + ')';
		if (sortOption != null && sortOption != '') {
			sortClause = getSortClause(sortOption, sortOrder, false);
		}
		url += sortClause;
		exportUrl += sortClause;

		param['options']['exportOptions']['exportUrl'] = exportUrl;
		url += '?limit=' + pageSize;
		param['getPageUrl'] = url;
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetPage, null, param);
	}
}

function successGetPage(data, textStatus, jqXHR, param) {
	var fileTable = getReferenceThumbnailTable(param['options']['table']);
	var thumbnailColumn = (fileTable != null ? getThumbnailColumn(fileTable) : null);
	if (data.length > 0 && thumbnailColumn != null) {
		param['ermrestData'] = data;
		param['fileTable'] = fileTable;
		param['thumbnailColumn'] = thumbnailColumn;
		var url = param['getPageUrl'];
		var index = url.indexOf('/entity/');
		url = url.substring(0, index) + '/attribute/' + url.substring(index + '/entity/'.length);
		index = url.indexOf('@sort');
		var columnList = [];
		if (param['options']['sortFacet'] != null && param['options']['sortFacet'] != '') {
			columnList.push(encodeSafeURIComponent(param['options']['sortFacet']));
		}
		$.each(PRIMARY_KEY, function(i, col) {
			columnList.push(encodeSafeURIComponent(col));
		});
		columnList.push('B:' + encodeSafeURIComponent(thumbnailColumn));
		url = url.substring(0, index) + '/B:=' + encodeSafeURIComponent(fileTable) + '/$A/' + columnList.join(',') + url.substring(index);
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetThumbnailUri, null, param);
	} else {
		param['successCallback'](data, param['totalItems'], param['options']['pagingOptions']['currentPage'], param['options']['pagingOptions']['pageSize']);
	}
}

function successGetThumbnailUri(data, textStatus, jqXHR, param) {
	var thumbnails = param['options']['thumbnails'];
	if (param['options']['pagingOptions']['currentPage'] == 1) {
		emptyJSON(thumbnails);
	}
	$.each(data, function(i, row) {
		thumbnails[row[param['primaryKey']]] = row[param['thumbnailColumn']];
	});
	param['successCallback'](param['ermrestData'], param['totalItems'], param['options']['pagingOptions']['currentPage'], param['options']['pagingOptions']['pageSize']);
}

function getTables(tables, options, successCallback) {
	SCHEMA_METADATA = CATALOG_METADATA[SCHEMA];
	catalog_association_tables_names = {};
	DEFAULT_TABLE = null;
	var rootTables = [];
	$.each(CATALOG_METADATA, function(schema, metadata) {
		catalog_association_tables_names[schema] = [];
		$.each(metadata, function(i, table) {
			var exclude = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null &&
				(table['annotations'][TABLES_LIST_URI].contains('exclude') || table['annotations'][TABLES_LIST_URI].contains('association'));
			var nested = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null &&
				table['annotations'][TABLES_LIST_URI].contains('nested');
			if (!exclude && schema == SCHEMA) {
				tables.push(table['table_name']);
			}
			if (!exclude && !nested && schema == SCHEMA) {
				rootTables.push(table['table_name']);
				var isDefault = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null &&
					table['annotations'][TABLES_LIST_URI].contains('default');
				if (isDefault) {
					DEFAULT_TABLE = table['table_name'];
				}
			}
			if (table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null &&
				table['annotations'][TABLES_LIST_URI].contains('association')) {
				catalog_association_tables_names[schema].push(table['table_name']);
			}
		});
	});
	if (options.table != null && options.table != '') {
		DEFAULT_TABLE = options.table;
	}
	if (DEFAULT_TABLE == null) {
		DEFAULT_TABLE = rootTables[0];
	}
	setColumnsAlias();
	COLUMNS_ALIAS = CATALOG_COLUMNS_ALIAS[SCHEMA];
	setTablesBackReferences();
	back_references = catalog_back_references[SCHEMA];
	setCollectionsReferences(options['tree']);
	options['tree'][0].nodes.sort(compareCollections);
	initApplicationHeader(rootTables);
	successCallback();
}

function initSchema(newSchema) {
	SCHEMA = newSchema;
	ERMREST_SCHEMA_HOME = HOME + ERMREST_CATALOG_PATH + CATALOG + '/schema/'+ SCHEMA + '/table/';
	SCHEMA_METADATA = CATALOG_METADATA[SCHEMA];
	COLUMNS_ALIAS = CATALOG_COLUMNS_ALIAS[SCHEMA];
	back_references = catalog_back_references[SCHEMA];
}

function getTableColumnsUniques(options, successCallback) {
	var sentRequests = false;
	var tables = [options['table']].concat(association_tables_names);
	var alertObject = {'display': true};
	var obj = {};
	$.each(tables, function(i, table) {
		obj[table] = false;
	});
	var cols_table = {};
	$.each(tables, function(i, table) {
		cols_table[table] = {};
		var metadata = (table == options['table'] ? options['metadata'] : association_tables[table]['metadata']);
		if (metadata != null && !hasTableFacetsHidden(table)) {
			var column_definitions = metadata['column_definitions'];
			var url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options) + '/$A/';
			url += (table == options['table'] ? '' : '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table) + '/$A/$' + association_tables[table]['alias'] + '/');
			var cnt = [];
			$.each(column_definitions, function(i, col) {
				if (!hasColumnFacetHidden(table, col['name'])) {
					if (facetPolicy != 'on_demand' || hasAnnotation(table, col['name'], 'top') || facetIsInBookmark(table, col['name'], options.filter)) {
						cnt.push('cnt_'+encodeSafeURIComponent(col['name'])+':=cnt('+encodeSafeURIComponent(col['name'])+')');
					}
				}
			});
			if (cnt.length > 0) {
				var predicate = cnt.join(',');
				url += predicate;
				param = {};
				param['cols_table'] = cols_table;
				param['ready'] = obj;
				param['alert'] = alertObject;
				param['table'] = table;
				param['options'] = options;
				param['successCallback'] = successCallback;
				ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetTableColumnsUniques, errorErmrest, param);
				sentRequests = true;
			} else {
				delete obj[table];
			}
		}
	});
	if (!sentRequests) {
		successCallback();
	}
}

function successGetTableColumnsUniques(data, textStatus, jqXHR, param) {
	var table_name = param['table'];
	param['ready'][table_name] = true;
	var options = param['options'];
	var metadata = (table_name == options['table'] ? options['metadata'] : association_tables[table_name]['metadata']);
	var column_definitions = metadata['column_definitions'];
	var cols = {};
	$.each(column_definitions, function(i,col) {
		if (col['type']['typename'] != 'json' && !hasAnnotation(table_name, col['name'], 'hidden')) {
			cols[col['name']] = {};
			if (hasColumnFacetHidden(table_name, col['name'])) {
				cols[col['name']]['cnt'] = 0;
			} else if (facetPolicy == 'on_demand' && !facetIsInBookmark(table_name, col['name'], options.filter)) {
				cols[col['name']]['cnt'] = 1;
			} else {
				cols[col['name']]['cnt'] = data[0][('cnt_'+col['name']).substring(0,63)];
			}
			cols[col['name']]['distinct'] = -1;
		}
	});
	param['cols_table'][table_name]	= cols;
	var ready = true;
	var tables = [options['table']].concat(association_tables_names);
	$.each(tables, function(i, table) {
		if (!hasTableFacetsHidden(table) && param['ready'][table] != null && !param['ready'][table]) {
			ready = false;
			return false;
		}
	});

	if (ready) {
		var urlPrefix = ERMREST_DATA_HOME + '/attributegroup/' + getQueryPredicate(param['options']) + '/$A/';
		var alertObject = {'display': true};
		var tables = [options['table']].concat(association_tables_names);
		$.each(tables, function(i, table) {
			if (!hasTableFacetsHidden(table)) {
				var metadata = (table == options['table'] ? options['metadata'] : association_tables[table]['metadata']);
				var column_definitions = metadata['column_definitions'];
				var tableURL = (table == options['table'] ? '' : '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table) + '/$A/$' + association_tables[table]['alias'] + '/');
				$.each(column_definitions, function(i,col) {
					if (hasAnnotation(table, col['name'], 'dataset')) {
						return true;
					}
					if (col['type']['typename'] != 'json' && !hasColumnFacetHidden(table, col['name'])) {
						if (facetPolicy != 'on_demand' && !hasAnnotation(table, col['name'], 'hidden') || hasAnnotation(table, col['name'], 'top') || facetIsInBookmark(table, col['name'], options.filter)) {
							var params = {};
							params['alert'] = alertObject;
							params['options'] = param['options'];
							params['successCallback'] = param['successCallback'];
							params['cols'] = param['cols_table'];
							params['col'] = col['name'];
							params['table'] = table;
							var url = urlPrefix + tableURL + encodeSafeURIComponent(col['name']) + ';cnt:=cnt(' + encodeSafeURIComponent(col['name']) + ')';
							ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetTableColumnsDistinct, errorErmrest, params);
						}
					}
				});
			}
		});
	}
}

function successGetTableColumnsDistinct(data, textStatus, jqXHR, param) {
	var table_name = param['table'];
	var options = param['options'];

	var col = param['col'];
	var cols = param['cols'][table_name];
	var successCallback = param['successCallback'];
	var delta = 0;
	$.each(data, function(i,ret) {
		if (ret[col] == null) {
			delta = 1;
			return false;
		}
	});
	cols[col]['distinct'] = data.length - delta;
	var ready = true;
	var tables = [options['table']].concat(association_tables_names);
	$.each(tables, function(i, table) {
		if (!hasTableFacetsHidden(table)) {
			var cols = param['cols'][table];
			$.each(cols, function(key, value) {
				if (hasAnnotation(table, key, 'dataset')) {
					return true;
				}
				if (!hasColumnFacetHidden(table, key) || !hasAnnotation(table, key, 'hidden')) {
					if (facetPolicy != 'on_demand' || hasAnnotation(table, key, 'top') || facetIsInBookmark(table, key, options.filter)) {
						if (value['distinct'] == -1) {
							ready = false;
							return false;
						}
					}
				}
			});
			if (!ready) {
				return false;
			}
		}
	});
	if (ready) {
		var cols = param['cols'][options['table']]
		var score = param['options']['score'];
		$.each(cols, function(key, value) {
			if (!hasColumnFacetHidden(options['table'], key)) {
				if (facetPolicy != 'on_demand' || hasAnnotation(options['table'], key, 'top') || facetIsInBookmark(options['table'], key, options.filter)) {
					value['name'] = key;
					score.push(value);
				}
			}
		});
		score.sort(compareUniques);
		var top_columns = [];
		$.each(score, function(i, columns) {
			top_columns.push(columns['name']);
		});
		display_columns['top_columns'] = top_columns;
		successCallback();
	}
}

function compareUniques(item1, item2) {
	var ret = 0;
	var val1 = uniquenessColumns.contains(item1['name']) ? -1 : (item1['cnt'] == 0 ? 1 : item1['distinct'] / item1['cnt']) ;
	var val2 = uniquenessColumns.contains(item2['name']) ? -1 : (item2['cnt'] == 0 ? 1 : item2['distinct'] / item2['cnt']);
	if (val1 < val2) {
		ret = -1;
	} else if (val1 > val2) {
		ret = 1;
	}
	return ret;
}

function compareIgnoreCase(str1, str2) {
	var val1 = str1.toLowerCase();
	var val2 = str2.toLowerCase();
	if (val1 == val2) {
		return 0;
	} else if (val1 < val2) {
		return -1;
	} else {
		return 1;
	}
}

function compareCollections(item1, item2) {
	var val1 = item1['display'];
	var val2 = item2['display'];
	return compareIgnoreCase(val1, val2);
}

function compareFacets(facet1, facet2) {
	var val1 = getFacetOrder(facet1);
	var val2 = getFacetOrder(facet2);
	var ret = 0;
	if (val1 != null && val2 != null) {
		if (val1 < val2) {
			ret = -1;
		} else if (val1 > val2) {
			ret = 1;
		}
	} else if (val1 != null) {
		ret = -1;
	} else if (val2 != null) {
		ret = 1;
	}
	return ret;
}

function setFacetClass(options, facet, facetClass) {
	var cssClass = '';
	var colsDescr = options['colsDescr'][facet['table']];
	var value = options['box'][facet['table']][facet['name']];
	if (searchBoxPresentation.contains(colsDescr[facet['name']]['type'])) {
		if (value) {
			cssClass = 'selectedFacet';
		}
	} else if (datepickerPresentation.contains(colsDescr[facet['name']]['type'])) {
		if (value['left'] || value['right']) {
			cssClass = 'selectedFacet';
		}
	} else if (colsDescr[facet['name']]['type'] == 'enum') {
		var checkValues = [];
		$.each(value['values'], function(checkbox_key, checkbox_value) {
			if (checkbox_value) {
				cssClass = 'selectedFacet';
				return false;
			}
		});
	} else if (colsDescr[facet['name']]['type'] == 'select') {
		if (value['value'].length > 0) {
			cssClass = 'selectedFacet';
		}
	} else if (sliderPresentation.contains(colsDescr[facet['name']]['type'])) {
		if (value['left'] || value['right']) {
			cssClass = 'selectedFacet';
		}
	}
	facetClass[facet['table']][facet['name']] = cssClass;
}

function getSearchExpression(originalValue, delimiter) {
	var arr = originalValue.split(' ');
	var keywords = [];
	$.each(arr, function(i, value) {
		if (value != '') {
			keywords.push(value);
		}
	});
	keywords = keywords.join(delimiter);
	return keywords;
}

function errorErmrest(jqXHR, textStatus, errorThrown, url, param) {
	if (param == null || param['alert'] == null) {
		handleError(jqXHR, textStatus, errorThrown, url);
	} else if (param['alert']['display']) {
		param['alert']['display'] = false;
		handleError(jqXHR, textStatus, errorThrown, url);
	}
}

function deleteSession(param) {
	if (token == null) {
		var url = HOME + '/ermrest/authn/session';
		if (chaiseConfig['logoutURL'] != null) {
			url += '?logout_url=' + encodeSafeURIComponent(chaiseConfig['logoutURL']);
		}
		ERMREST.DELETE(url, successDeleteSession, errorDeleteSession, param);
	} else {
		submitLogout();
	}
}

function successDeleteSession(data, textStatus, jqXHR, param) {
	var logout_url = null;
	if (data !== undefined) {
		data = JSON.parse(data);
		logout_url = data['logout_url'];
	}
	submitLogout(logout_url);
}

function errorDeleteSession(jqXHR, textStatus, errorThrown, url, param) {
	if (jqXHR.status == 404 && jqXHR.responseText !== undefined) {
		// this might be a session timeout
		var logout_url = null;
		var data = JSON.parse(jqXHR.responseText);
		logout_url = data['logout_url'];
		submitLogout(logout_url);
	} else {
		handleError(jqXHR, textStatus, errorThrown, url);
	}
}

function getSession(param) {
	var url = HOME + '/ermrest/authn/session';
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetSession, errorGetSession, param);
}

function successGetSession(data, textStatus, jqXHR, param) {
	//alert(JSON.stringify(data, null, 4));
	if (data['client'] != null) {
        // New webauthen sends back a client Object
        // Check for display_name first
		if (data['client']['display_name'] !== undefined) {
			$('#login_user').html(data['client']['display_name']);
        // Then check for full_name
        } else if (data['client']['full_name'] !== undefined) {
			$('#login_user').html(data['client']['full_name']);
        // Then check for email
        } else if (data['client']['email'] !== undefined) {
			$('#login_user').html(data['client']['email']);
        // Default to client if none of the above because it's still using the old web authen service
		} else {
			$('#login_user').html(data['client']);
		}
		$('#login_link').hide();
		$('#logout_link').show();
	} else {
		setUserFromCookie();
		if (USER == null) {
			$('#login_user').html('');
			$('#login_link').show();
			$('#logout_link').hide();
			if (param != null) {
				if (window.location.href == param) {
					window.location.reload(true);
				} else {
					window.location.href = param;
				}
			}
		} else {
			$('#login_user').html(USER);
			$('#login_link').hide();
			$('#logout_link').show();
		}
	}
}

function setUserFromCookie() {
	USER = null;
	if (token != null) {
		var tokens = token.split('|');
		$.each(tokens, function(i, value) {
			var values = value.split('=');
			if (values[0] == 'un') {
				USER = values[1];
				return false;
			}
		});
	}
}

function errorGetSession(jqXHR, textStatus, errorThrown, url, param) {
	if (jqXHR.status == 401 || jqXHR.status == 404) {
		document.body.style.cursor = 'default';
		// Unauthorized or Not Found
		setUserFromCookie();
		if (USER == null) {
			$('#login_user').html('');
			$('#login_link').show();
			$('#logout_link').hide();
			if (param != null) {
				if (window.location.href == param) {
					window.location.reload(true);
				} else {
					window.location.href = param;
				}
			}
		} else {
			$('#login_user').html(USER);
			$('#login_link').hide();
			$('#logout_link').show();
		}
	} else {
		handleError(jqXHR, textStatus, errorThrown, url);
	}
}

function login(referrer) {
	var url = HOME + '/ermrest/authn/preauth?referrer='+referrer;
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successLogin, errorLogin, null);
}

function successLogin(data, textStatus, jqXHR) {
	if (data['redirect_url'] != null) {
		var url = data['redirect_url'];
		suppressError = true;
		window.open(url, '_self');
	} else {
		var login_form = data['login_form'];
		var login_url = '../login?referrer=' + encodeSafeURIComponent(window.location.href);
		if (login_form != null) {
			var method = login_form['method'];
			var action = encodeSafeURIComponent(login_form['action']);
			var text = '';
			var hidden = '';
			$.each(login_form['input_fields'], function(i, item) {
				if (item['type'] == 'text') {
					text = encodeSafeURIComponent(item['name']);
				} else {
					hidden = encodeSafeURIComponent(item['name']);
				}
			});
			login_url += '&method=' + method + '&action=' + action + '&text=' + text + '&hidden=' + hidden;
		}
		window.location = login_url;
	}
}

function errorLogin(jqXHR, textStatus, errorThrown, url, param) {
	handleError(jqXHR, textStatus, errorThrown, url);
}

function hasCheckedValues(box, facet) {
	var ret = false;
	if (box[facet['table']][facet['name']]['values'] != null) {
		$.each(box[facet['table']][facet['name']]['values'], function(i, value) {
			if (value) {
				ret = true;
				return false;
			}
		});
	}
	return ret;
}

function setTablesBackReferences() {
	catalog_back_references = {};
	$.each(CATALOG_METADATA, function(schema, metadata) {
		catalog_back_references[schema] = {};
		var tables = [];
		$.each(metadata, function(i, table) {
			var isNested = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null && table['annotations'][TABLES_LIST_URI].contains('nested');
			var exclude = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null &&
				(table['annotations'][TABLES_LIST_URI].contains('exclude') || table['annotations'][TABLES_LIST_URI].contains('association'));
			if (isNested || !exclude) {
				tables.push(table['table_name']);
			}
		});
		$.each(metadata, function(i, table) {
			$.each(table['foreign_keys'], function(j, fk) {
				$.each(fk['referenced_columns'], function(k, ref_column) {
					if (tables.contains(ref_column['table_name'])) {
						if (catalog_back_references[schema][ref_column['table_name']] == null) {
							catalog_back_references[schema][ref_column['table_name']] = [];
						}
						catalog_back_references[schema][ref_column['table_name']].push(table['table_name']);
					}
				});
			});
		});
	});
}

function setCollectionsReferences(tree) {
	tree.length = 0
	var nodes = [];
	var level = -1;
	var node = {'name': 'Collections',
		'display': 'Collections',
		'parent': null,
		'schema': null,
		'root': null,
		'level': level,
		'show': true,
		'expand': false,
		'count': 0,
		'nodes': nodes};
	tree.push(node);
	$.each(CATALOG_METADATA, function(schema, metadata) {
		if (schema != SCHEMA) {
			//return true;
		}
		var tables = [];
		$.each(metadata, function(i, table) {
			var exclude = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null &&
				(table['annotations'][TABLES_LIST_URI].contains('exclude') || table['annotations'][TABLES_LIST_URI].contains('association'));
			var nested = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null &&
				table['annotations'][TABLES_LIST_URI].contains('nested');
			if (!exclude && !nested) {
				tables.push(table['table_name']);
			}
		});
		$.each(tables, function(i, table) {
			setTreeReferences(nodes, table, node, schema);
		});
	});
}

function setTreeReferences(root, table, rootNode, schema) {
	var nodes = [];
	var level = 0;
	var node = {'name': table,
		'display': getTableDisplayName(table, CATALOG_METADATA[schema]),
		'parent': null,
		'schema': schema,
		'root': rootNode,
		'level': level,
		'show': false,
		'expand': true,
		'count': 0,
		'nodes': nodes};
	root.push(node);
	if (catalog_back_references[schema][table] != null) {
		$.each(catalog_back_references[schema][table], function(i, key) {
			if (!catalog_association_tables_names[schema].contains(key)) {
				addTreeReference(key, nodes, level+1, node, rootNode, schema);
			}
		});
	}
}

function addTreeReference(table, nodes, level, parent, rootNode, schema) {
	var subNodes = [];
	var node = {'name': table,
		'display': getTableDisplayName(table, CATALOG_METADATA[schema]),
		'parent': parent,
		'root': rootNode,
		'schema': schema,
		'level': level,
		'show': false,
		'expand': true,
		'count': 0,
		'nodes': subNodes};
	nodes.push(node);
	if (catalog_back_references[schema][table] != null) {
		$.each(catalog_back_references[schema][table], function(i, key) {
			if (key != table) {
				addTreeReference(key, subNodes, level+1, node, rootNode, schema);
			}
		});
	}
}

function entityDenormalize(table, row, result) {
	emptyJSON(result);
	var predicate = [];
	$.each(PRIMARY_KEY, function(i, primaryCol) {
		predicate.push(encodeSafeURIComponent(primaryCol) + '=' + encodeSafeURIComponent(row[primaryCol]));
	});
	predicate = predicate.join('/');
	var url = ERMREST_DATA_HOME + '/entity/' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table) + '/' + predicate;
	getDenormalizedValues(table, url, result);
}

function getDenormalizedValues(table, url, result) {
	if (back_references[table] != null) {
		$.each(back_references[table], function(i, key) {
			if (!hasTableAnnotation(key, 'exclude') && !hasTableAnnotation(key, 'hidden')) {
				var keyUrl = url + '/' + key;
				getDenormalizedValues(key, keyUrl, result);
				var data = ERMREST.fetch(keyUrl, 'application/x-www-form-urlencoded; charset=UTF-8', false, true, [], null, null, null);
				if (data != null) {
					$.each(data, function(i, row) {
						$.each(row, function(name, value) {
							if (value == null || value === '' || hasAnnotation(key, name, 'hidden')) {
								delete data[i][name];
							}
						});
					});
					if (result[key] == null) {
						result[key] = [];
					}
					result[key] = result[key].concat(data);
				}
			}
		});
	}
}

function getQueryPredicate(options, table) {
	var ret = null;

	if (options['entityPredicates'].length > 0) {
		ret = options['entityPredicates'].join('/');
		if (ret == encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(options['table'])) {
			ret = 'A:=' + ret;
		} else {
			ret = options['entityPredicates'].slice();
			ret[ret.length-1] = 'A:=' + encodeSafeURIComponent(SCHEMA) + ':' + ret[ret.length-1];
			ret = ret.join('/');
		}
	} else {
		ret = 'A:=' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(options['table']);
	}

	if (table != null && options['table'] != table) {
		ret += '/$A/' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table);
	}

	return ret;
}

function getEntityTable(options) {
	var ret = options['table'];
	var level = options['entityPredicates'].length;
	if (level > 0) {
		ret = decodeURIComponent(options['entityPredicates'][level-1]);
	}
	return ret;
}

function updateTreeCount(data, entityPredicates) {
	$.each(data.root.nodes, function(i, node) {
		if (node.name != data.name) {
			resetTreeCount(node);
		}
	});
	var predicates = [];
	$.each(entityPredicates, function(i, predicate) {
		predicates.push((predicate.indexOf(':') < 0 && predicate.indexOf('/') < 0) ? encodeSafeURIComponent(SCHEMA) + ':' + predicate : predicate);
	});
	var index = entityPredicates.length-1;
	var alertObject = {'display': true};
	while (data != null) {
		var url = ERMREST_DATA_HOME + '/aggregate/' + predicates.join('/') + '/cnt:=cnt(*)';
		var param = {};
		param['data'] = data;
		param['alert'] = alertObject;
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateTreeCount, errorErmrest, param);
		data = data.parent;
		predicates.length--;
	}
}

function successUpdateTreeCount(data, textStatus, jqXHR, param) {
	param['data']['count'] = data[0]['cnt'];
}

function resetTreeCount(data) {
	data['count'] = 0;
	if (data.nodes.length > 0) {
		$.each(data.nodes, function(i, node) {
			resetTreeCount(node);
		});
	}
}

function getCollectionsPredicate(entityPredicates, options) {
	var predicates = entityPredicates.slice();
	var index = predicates.length-1;
	var predicate = getPredicate(options, null, null, null, null);
	if (predicate.length > 0) {
		predicates[index] += '/' + predicate.join('/');
	}
	return decodeURIComponent(predicates.join('<b> ---> </b>'));
}

function collapseTree(tree, data) {
	var root = data;
	while (root.parent != null) {
		root = root.parent;
	}
	$.each(tree.nodes, function(i, node) {
		if (node.name != root.name) {
			node.expand = true;
			node.show = false;
		}
	});
}

function hasAnnotation(table_name, column_name, annotation) {
	var ret = false;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name']) {
			var column_definitions = table['column_definitions'];
			$.each(column_definitions, function(i, col) {
				if (col['name'] == column_name) {
					if (col['annotations'] != null && col['annotations'][COLUMNS_LIST_URI] != null) {
						var comments = col['annotations'][COLUMNS_LIST_URI];
						if (comments.contains(annotation)) {
							ret = true;
						}
					}
					return false;
				}
			});
			return false;
		}
	});
	return ret;
}

function getUrlPattern(table_name, column_name, annotation) {
	var ret = null;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name']) {
			var column_definitions = table['column_definitions'];
			$.each(column_definitions, function(i, col) {
				if (col['name'] == column_name) {
					if (col['annotations'] != null && col['annotations'][COLUMNS_MAP_URI] != null && col['annotations'][COLUMNS_MAP_URI][annotation] != null) {
						ret = col['annotations'][COLUMNS_MAP_URI][annotation];
					}
					return false;
				}
			});
			return false;
		}
	});
	return ret;
}

function selectCollection() {
	$('label', $('#treeDiv')).removeClass('highlighted');
	var clicked = false;
	$.each($('label', $('#treeDiv')), function(i, label) {
		$.each($('span', $(label)), function(j, span) {
			if ($(span).html().replace(/^\s*/, "").replace(/\s*$/, "") == getTableDisplayName(DEFAULT_TABLE) && $(span).attr('schema_name') == SCHEMA) {
				$(label).click();
				clicked = true;
				return false;
			}
		});
		if (clicked) {
			return false;
		}
	});
	if (!clicked) {
		setTimeout('selectCollection()', 1);
	}
}

function setAssociationTables(table_name) {
	association_tables = {};
	var index = 0;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (association_tables_names.contains(table['table_name'])) {
			var fk_columns = [];
			$.each(table['foreign_keys'], function(j, foreign_keys) {
				$.each(foreign_keys['referenced_columns'], function(k, referenced_column) {
					if (referenced_column['table_name'] == table_name) {
						fk_columns.push(foreign_keys['foreign_key_columns'][k]['column_name']);
					}
				});
			});
			if (fk_columns.length > 0) {
				var columns = [];
				$.each(table['column_definitions'], function(k, column_definition) {
					if (!fk_columns.contains(column_definition['name'])) {
						var display = getColumnDisplayName(column_definition['name']);
						if (column_definition['annotations'] != null && column_definition['annotations'][COLUMNS_MAP_URI] != null && column_definition['annotations'][COLUMNS_MAP_URI]['display'] != null) {
							display = column_definition['annotations'][COLUMNS_MAP_URI]['display'];
						}
						if (column_definition['annotations'] == null || column_definition['annotations'][COLUMNS_LIST_URI] == null || !column_definition['annotations'][COLUMNS_LIST_URI].contains('hidden')) {
							columns.push({'name': column_definition['name'],
								'display': display});
						}
					}
				});
				if (columns.length > 0) {
					association_tables[table['table_name']] = {
						'columns': columns,
						'metadata': table,
						'alias': 'A' + (++index)
					};
				}
			}
		}
	});
	setVocabularyTables(index);
}

function setVocabularyTables(index) {
	$.each(SCHEMA_METADATA, function(i, table) {
		if (association_tables[table['table_name']] == null && association_tables_names.contains(table['table_name'])) {
			var columns = [];
			$.each(table['column_definitions'], function(k, column_definition) {
				// if (column_definition['annotations'] != null && column_definition['annotations'][COLUMNS_LIST_URI] != null && !column_definition['annotations'][COLUMNS_LIST_URI].contains('hidden')) {
				if (column_definition['annotations'][COLUMNS_LIST_URI] == null || !column_definition['annotations'][COLUMNS_LIST_URI].contains('hidden')) {
					var display = getColumnDisplayName(column_definition['name']);
					if (column_definition['annotations'] != null && column_definition['annotations'][COLUMNS_MAP_URI] != null && column_definition['annotations'][COLUMNS_MAP_URI]['display'] != null) {
						display = column_definition['annotations'][COLUMNS_MAP_URI]['display'];
					}
					columns.push({'name': column_definition['name'],
						'display': display});
				}
			});
			if (columns.length > 0) {
				association_tables[table['table_name']] = {
					'columns': columns,
					'metadata': table,
					'alias': 'A' + (++index)
				};
			}
		}
	});
}

function isTextColumn(table, column) {
	var ret = false;
	var metadata = association_tables[table]['metadata'];
	var column_definitions = metadata['column_definitions'];
	$.each(column_definitions, function(i, col) {
		if (col['name'] == column && col['annotations'] != null &&
			col['annotations'][COLUMNS_LIST_URI] != null && col['annotations'][COLUMNS_LIST_URI].contains('text')) {
			ret = true;
			return false;
		}
	});
	return ret;
}

function getAssociationTableColumns(options, successCallback, columns) {
	var facets = columns['facets'];
	if (association_tables_names.length > 0) {
		//getAssociationColumnsDescriptions(options, successCallback, columns);
		$.each(association_tables, function(table, value) {
			options['box'][table] = {};
			options['colsGroup'][table] = {};
			options['facetClass'][table] = {};
			options['chooseColumns'][table] = {};
			options['searchFilterValue'][table] = {};
			options['narrow'][table] = {};
			$.each(value['columns'], function(i, obj) {
				facets.push({'name': obj['name'],
					'display': obj['display'],
					'table': table,
					'alias': value['alias']});
			});
		});
		facets.sort(compareFacets);
		$.each(facets, function(i, facet) {
			if (getFacetOrder(facet) != null || facetIsInBookmark(facet['table'], facet['name'], options.filter)) {
				options['chooseColumns'][facet['table']][facet['name']] = true;
			}
		});
		successCallback(columns);
	} else {
		facets.sort(compareFacets);
		$.each(facets, function(i, facet) {
			if (getFacetOrder(facet) != null || hasAnnotation(facet['table'], facet['name'], 'top') || facetIsInBookmark(facet['table'], facet['name'], options.filter)) {
				options['chooseColumns'][facet['table']][facet['name']] = true;
			}
		});
		successCallback(columns);
	}
}

function getAssociationColumn(table, column_name) {
	var ret = null;
	$.each(association_tables[table]['columns'], function(i, column) {
		if (column['name'] == column_name) {
			ret = column;
			return false;
		}
	});
	return ret;
}

function getAssociationColumnsDescriptions(options, successCallback) {
	var alertObject = {'display': true};
	var ret = {};
	var sentRequests = false;
	$.each(association_tables, function(table_name, value) {
		if (!hasTableFacetsHidden(table_name)) {
			var metadata = association_tables[table_name]['metadata'];
			if (metadata != null) {
				var column_definitions = metadata['column_definitions'];
				ret[table_name] = {};
				$.each(column_definitions, function(i, col) {
					if (col['type']['typename'] != 'json' && getAssociationColumn(table_name, col['name']) != null &&
							!hasColumnFacetHidden(table_name, col['name'])) {
						var col_name = col['name'];
						var col_type = col['type']['typename'];
						var obj = {};
						obj['type'] = col_type;
						obj['ready'] = (facetPolicy != 'on_demand' || isSelectedColumnFacetOnDemand(options, table_name, col['name']) || facetIsInBookmark(table_name, col['name'], options.filter)) ? false : true;
						ret[table_name][col_name] = obj;
					}
				});
			}
		}
	});
	$.each(ret, function(table, value) {
		$.each(value, function(col, obj) {
			if (obj['ready']) {
				return true;
			}
			var param = {};
			param['options'] = options;
			param['alert'] = alertObject;
			param['successCallback'] = successCallback;
			param['entity'] = ret;
			param['col'] = col;
			param['table'] = table;
			var url = null;
			if (searchBoxPresentation.contains(obj['type']) || checkBoxPresentation.contains(obj['type'])) {
				url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options, table) + '/cnt_d:=cnt_d(' + encodeSafeURIComponent(col) + ')';
			} else if (datepickerPresentation.contains(obj['type']) || sliderPresentation.contains(obj['type'])) {
				url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options, table) + '/min:=min(' + encodeSafeURIComponent(col) + '),max:=max(' + encodeSafeURIComponent(col) + ')';
			} else {
				console.log('Type for association column was not found: '+obj['type'])
			}
			if (url != null) {
				sentRequests = true;
				ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetAssociationColumnsDescriptions, errorErmrest, param);
			}
		});
	});
	if (!sentRequests) {
		$.each(ret, function(table, value) {
			options['colsDescr'][table] = value;
		});
		successCallback();
	}
}

function successGetAssociationColumnsDescriptions(data, textStatus, jqXHR, param) {
	var col = param['col'];
	var table = param['table'];
	var entities = param['entity'];
	var entity = entities[table];
	var options = param['options'];
	var alertObject = param['alert'];
	var successCallback = param['successCallback'];
	if (searchBoxPresentation.contains(entity[col]['type']) || checkBoxPresentation.contains(entity[col]['type'])) {
		var url = ERMREST_DATA_HOME + '/attributegroup/' + getQueryPredicate(param['options'], table) + '/' +
			getSortGroup(table, col, 'rank') + '@sort(' + encodeSafeURIComponent(getSortColumn(table, col, 'rank')) + ')?limit=none';
		var param = {};
		param['successCallback'] = successCallback;
		param['entity'] = entities;
		param['col'] = col;
		param['options'] = options;
		param['alert'] = alertObject;
		param['table'] = table;
		if (data[0]['cnt_d'] <= MULTI_SELECT_LIMIT && !isTextColumn(table, col)) {
			entity[col]['type'] = 'enum';
		} else if (data[0]['cnt_d'] >= MULTI_SELECT_LIMIT) {
			entity[col]['type'] = 'select';
		} else {
			entity[col]['ready'] = true;
			url = null;
		}
		if (url != null) {
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetAssociationColumnsDescriptions, errorErmrest, param);
		}
	} else if (entity[col]['type'] == 'enum' || entity[col]['type'] == 'select') {
		entity[col]['ready'] = true;
		var values = [];
		$.each(data, function(i, row) {
			if (row[col] != null) {
				values.push(row[col]);
			}
		});
		entity[col]['values'] = values;
	} else if (sliderPresentation.contains(entity[col]['type'])) {
		entity[col]['ready'] = true;
		entity[col]['min'] = data[0]['min'];
		entity[col]['max'] = data[0]['max'];
	} else if (datepickerPresentation.contains(entity[col]['type'])) {
		entity[col]['ready'] = true;
		entity[col]['min'] = getDateString(data[0]['min'], 'min');
		entity[col]['max'] = getDateString(data[0]['max'], 'max');
	} else {
		console.log('No match found for column type ', entity[col]['type']);
	}
	var ready = true;
	$.each(entities, function(table, value) {
		$.each(value, function(col, entity) {
			if (!entity['ready']) {
				ready = false;
				return false;
			}
		});
	});
	if (ready) {
		$.each(entities, function(table, value) {
			$.each(value, function(col, entity) {
				delete entity['ready'];
			});
			options['colsDescr'][table] = value;
		});
		param['successCallback']();
	}
}

function getColumnDisplayName(column) {
	var parts = column.split('_');
	$.each(parts, function(i, part) {
		parts[i] = part[0].toUpperCase() + part.substr(1);
	});
	return parts.join(' ');
}

function hasTableAnnotation(table_name, annotation) {
	var ret = false;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name'] && table['annotations'] != null &&
			table['annotations'][TABLES_LIST_URI] != null && table['annotations'][TABLES_LIST_URI].contains(annotation)) {
			ret = true;
			return false;
		}
	});
	return ret;
}

function getAssociationThumbnail(table_name, row) {
	var ret = null;
	var predicate = [];
	if (PRIMARY_KEY != null) {
		$.each(PRIMARY_KEY, function(i, key) {
			predicate.push(encodeSafeURIComponent(key) + '=' + encodeSafeURIComponent(row[key]));
		});
	}
	var imageTable = null;
	if (back_references[table_name] != null) {
		$.each(back_references[table_name], function(i, table) {
			if (hasTableAnnotation(table, 'image')) {
				imageTable = table;
				return false;
			}
		});
	}
	var fileTable = null;
	if (imageTable != null) {
		fileTable = getTablesBackReferences(imageTable, table_name);
	}
	var thumbnail = null;
	var sortColumn = null;
	var typeColumn = null;
	if (fileTable != null) {
		$.each(SCHEMA_METADATA, function(i, table) {
			if (fileTable == table['table_name']) {
				var column_definitions = table['column_definitions'];
				$.each(column_definitions, function(j, col) {
					if (col['annotations'] != null && col['annotations'][COLUMNS_LIST_URI] != null) {
						if (hasAnnotation(fileTable, col['name'], 'thumbnail')) {
							thumbnail = col['name'];
						}
						if (hasAnnotation(fileTable, col['name'], 'orderby')) {
							sortColumn = col['name'];
						}
						if (hasAnnotation(fileTable, col['name'], 'type')) {
							typeColumn = col['name'];
						}
					}
				});
				return false;
			}
		});
		var thumbnailPredicate = [];
		thumbnailPredicate.push(ERMREST_DATA_HOME);
		thumbnailPredicate.push('entity');
		thumbnailPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table_name));
		thumbnailPredicate.push(predicate.join('&'));
		thumbnailPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(imageTable));
		thumbnailPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(fileTable));
		var contentTypePredicate = [];
		$.each(thumbnailFileTypes, function(i, fileType) {
			contentTypePredicate.push(encodeSafeURIComponent(typeColumn) + '=' + encodeSafeURIComponent(fileType));
		});
		thumbnailPredicate.push(contentTypePredicate.join(';'));
		var url = thumbnailPredicate.join('/') + '@sort(' + encodeSafeURIComponent(sortColumn) + ')?limit=1';
		var data = ERMREST.fetch(url, 'application/x-www-form-urlencoded; charset=UTF-8', false, true, [], null, null, null);
		ret = (data == null || data.length == 0) ? null : data[0][thumbnail];
	}
	return ret;
}

function getReferenceThumbnail(table_name, row) {
	var ret = null;
	var predicate = [];
	if (PRIMARY_KEY != null) {
		$.each(PRIMARY_KEY, function(i, key) {
			predicate.push(encodeSafeURIComponent(key) + '=' + encodeSafeURIComponent(row[key]));
		});
	}
	var fileTable = getReferenceThumbnailTable(table_name);
	if (fileTable != null) {
		var thumbnailPredicate = [];
		thumbnailPredicate.push(ERMREST_DATA_HOME);
		thumbnailPredicate.push('entity');
		thumbnailPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table_name));
		thumbnailPredicate.push(predicate.join('&'));
		thumbnailPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(fileTable));
		var url = thumbnailPredicate.join('/') + '?limit=1';
		var data = ERMREST.fetch(url, 'application/x-www-form-urlencoded; charset=UTF-8', false, true, [], null, null, null);
		ret = (data == null || data.length == 0) ? null : data[0]['uri'];
	}
	return ret;
}

function getReferenceThumbnailTable(table_name) {
	var ret = null;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table["table_name"] == table_name) {
			$.each(table['foreign_keys'], function(i, fk) {
				if (fk['annotations']['comment'] != null && fk['annotations']['comment'].contains('thumbnail')) {
					ret = fk['referenced_columns'][0]['table_name'];
					return false;
				}
			});
		}
	});
	return ret;
}

function getTablesBackReferences(table_name, dataset) {
	var ret = null;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table['table_name'] == table_name) {
			$.each(table['foreign_keys'], function(j, fk) {
				$.each(fk['referenced_columns'], function(k, ref_column) {
					if (ref_column['table_name'] != table_name && ref_column['table_name'] != dataset) {
						ret = ref_column['table_name'];
						return false;
					}
				});
			});
			if (ret != null) {
				return false;
			}
		}
	});
	return ret;
}

function hasAssociationThumnbnail(table_name) {
	var ret = false;
	if (back_references[table_name] != null) {
		$.each(back_references[table_name], function(i, table) {
			if (hasTableAnnotation(table, 'image')) {
				ret = true;
				return false;
			}
		});
	}
	return ret;
}

function getDenormalizedThumbnail(table_name, row, column_name, dataset) {
	var ret = null;
	if (hasTableAnnotation(table_name, 'image')) {
		var dataset_id = null;
		var image_id = null;
		$.each(SCHEMA_METADATA, function(i, table) {
			if (table_name == table['table_name']) {
				var column_definitions = table['column_definitions'];
				$.each(column_definitions, function(j, col) {
					if (col['annotations'] != null && col['annotations'][COLUMNS_LIST_URI] != null) {
						if (hasAnnotation(table_name, col['name'], 'dataset')) {
							dataset_id = col['name'];
						}
						if (hasAnnotation(table_name, col['name'], 'image')) {
							image_id = col['name'];
						}
					}
				});
				return false;
			}
		});
		if (column_name != dataset_id) {
			var imageTable = table_name;
			var fileTable = getTablesBackReferences(imageTable, dataset);
			var thumbnail = null;
			var sortColumn = null;
			var typeColumn = null;
			if (fileTable != null) {
				$.each(SCHEMA_METADATA, function(i, table) {
					if (fileTable == table['table_name']) {
						var column_definitions = table['column_definitions'];
						$.each(column_definitions, function(j, col) {
							if (col['annotations'] != null && col['annotations'][COLUMNS_LIST_URI] != null) {
								if (hasAnnotation(fileTable, col['name'], 'thumbnail')) {
									thumbnail = col['name'];
								}
								if (hasAnnotation(fileTable, col['name'], 'orderby')) {
									sortColumn = col['name'];
								}
								if (hasAnnotation(fileTable, col['name'], 'type')) {
									typeColumn = col['name'];
								}
							}
						});
						return false;
					}
				});
			}
			var predicate = [];
			predicate.push(encodeSafeURIComponent(dataset_id) + '=' + encodeSafeURIComponent(row[dataset_id]));
			predicate.push(encodeSafeURIComponent(image_id) + '=' + encodeSafeURIComponent(row[image_id]));
			var thumbnailPredicate = [];
			thumbnailPredicate.push(ERMREST_DATA_HOME);
			thumbnailPredicate.push('entity');
			thumbnailPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(imageTable));
			thumbnailPredicate.push(predicate.join('&'));
			thumbnailPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(fileTable));
			var url = thumbnailPredicate.join('/') + '@sort(' + encodeSafeURIComponent(sortColumn) + ')?limit=1';
			var data = ERMREST.fetch(url, 'application/x-www-form-urlencoded; charset=UTF-8', false, true, [], null, null, null);
			if (data != null && data.length == 1) {
				ret = data[0][thumbnail];
			}
		}
	}
	return ret;
}

function setColumnsAlias() {
	CATALOG_COLUMNS_ALIAS = {};
	$.each(CATALOG_METADATA, function(schema, metadata) {
		CATALOG_COLUMNS_ALIAS[schema] = {};
		$.each(metadata, function(i, table) {
			var values = {};
			var column_definitions = table['column_definitions'];
			$.each(column_definitions, function(j, col) {
				var display = getColumnDisplayName(col['name']);
				if (col['annotations'] != null && col['annotations'][COLUMNS_MAP_URI] != null &&
					col['annotations'][COLUMNS_MAP_URI]['display'] != null) {
					display = col['annotations'][COLUMNS_MAP_URI]['display'];
				}
				values[col['name']] = display;
			});
			CATALOG_COLUMNS_ALIAS[schema][table['table_name']] = values;
		});
	});
}

function getDenormalized3dView(table_name, row, column_name, dataset) {
	var ret = null;
	if (hasTableAnnotation(table_name, 'viewer')) {
		var dataset_id = null;
		var file_id = null;
		$.each(SCHEMA_METADATA, function(i, table) {
			if (table_name == table['table_name']) {
				var column_definitions = table['column_definitions'];
				$.each(column_definitions, function(j, col) {
					if (col['annotations'] != null && col['annotations'][COLUMNS_LIST_URI] != null) {
						if (hasAnnotation(table_name, col['name'], 'dataset')) {
							dataset_id = col['name'];
						}
						if (hasAnnotation(table_name, col['name'], 'viewer')) {
							file_id = col['name'];
						}
					}
				});
				return false;
			}
		});
		if (file_id != null && column_name != dataset_id) {
			var imageTable = table_name;
			var fileTable = getTablesBackReferences(imageTable, dataset);
			var viewer = null;
			var sortColumn = null;
			var typeColumn = null;
			if (fileTable != null) {
				$.each(SCHEMA_METADATA, function(i, table) {
					if (fileTable == table['table_name']) {
						var column_definitions = table['column_definitions'];
						$.each(column_definitions, function(j, col) {
							if (col['annotations'] != null && col['annotations'][COLUMNS_LIST_URI] != null) {
								if (hasAnnotation(fileTable, col['name'], 'viewer')) {
									viewer = col['name'];
								}
								if (hasAnnotation(fileTable, col['name'], 'orderby')) {
									sortColumn = col['name'];
								}
								if (hasAnnotation(fileTable, col['name'], 'type')) {
									typeColumn = col['name'];
								}
							}
						});
						return false;
					}
				});
			}
			var predicate = [];
			predicate.push(encodeSafeURIComponent(dataset_id) + '=' + encodeSafeURIComponent(row[dataset_id]));
			predicate.push(encodeSafeURIComponent(file_id) + '=' + encodeSafeURIComponent(row[file_id]));
			var contentTypePredicate = [];
			$.each(viewer3dFileTypes, function(i, fileType) {
				contentTypePredicate.push(encodeSafeURIComponent(typeColumn) + '=' + encodeSafeURIComponent(fileType));
			});
			var viewerPredicate = [];
			viewerPredicate.push(ERMREST_DATA_HOME);
			viewerPredicate.push('entity');
			viewerPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(imageTable));
			viewerPredicate.push(predicate.join('&'));
			viewerPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(fileTable));
			viewerPredicate.push(contentTypePredicate.join(';'));
			var url = viewerPredicate.join('/') + '@sort(' + encodeSafeURIComponent(sortColumn) + ')?limit=1';
			var data = ERMREST.fetch(url, 'application/x-www-form-urlencoded; charset=UTF-8', false, true, [], null, null, null);
			if (data != null && data.length == 1) {
				ret = getTableAnnotation(fileTable, TABLES_MAP_URI, 'viewer_url');
				ret += '?url=' + data[0][viewer];
			}
		}
	}
	return ret;
}

function getTableAnnotation(table_name, annotation, key) {
	var ret = null;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name'] && table['annotations'] != null &&
			table['annotations'][annotation] != null) {
			ret = table['annotations'][annotation][key];
			return false;
		}
	});
	return ret;
}

function getDenormalizedFile(table_name, row, column_name, dataset) {
	var ret = null;
	if (hasTableAnnotation(table_name, 'download')) {
		var dataset_id = null;
		var file_id = null;
		$.each(SCHEMA_METADATA, function(i, table) {
			if (table_name == table['table_name']) {
				var column_definitions = table['column_definitions'];
				$.each(column_definitions, function(j, col) {
					if (col['annotations'] != null && col['annotations'][COLUMNS_LIST_URI] != null) {
						if (hasAnnotation(table_name, col['name'], 'dataset')) {
							dataset_id = col['name'];
						}
						if (hasAnnotation(table_name, col['name'], 'download')) {
							file_id = col['name'];
						}
					}
				});
				return false;
			}
		});
		if (file_id != null && column_name != dataset_id) {
			var downloadTable = table_name;
			var fileTable = getTablesBackReferences(downloadTable, dataset);
			var download = null;
			var sortColumn = null;
			var typeColumn = null;
			if (fileTable != null) {
				$.each(SCHEMA_METADATA, function(i, table) {
					if (fileTable == table['table_name']) {
						var column_definitions = table['column_definitions'];
						$.each(column_definitions, function(j, col) {
							if (col['annotations'] != null && col['annotations'][COLUMNS_LIST_URI] != null) {
								if (hasAnnotation(fileTable, col['name'], 'download')) {
									download = col['name'];
								}
								if (hasAnnotation(fileTable, col['name'], 'orderby')) {
									sortColumn = col['name'];
								}
								if (hasAnnotation(fileTable, col['name'], 'image')) {
									typeColumn = col['name'];
								}
							}
						});
						return false;
					}
				});
			}
			var predicate = [];
			predicate.push(encodeSafeURIComponent(dataset_id) + '=' + encodeSafeURIComponent(row[dataset_id]));
			predicate.push(encodeSafeURIComponent(file_id) + '=' + encodeSafeURIComponent(row[file_id]));
			var contentTypePredicate = [];
			contentTypePredicate.push(encodeSafeURIComponent(typeColumn) + '::null::');
			var downloadPredicate = [];
			downloadPredicate.push(ERMREST_DATA_HOME);
			downloadPredicate.push('entity');
			downloadPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(downloadTable));
			downloadPredicate.push(predicate.join('&'));
			downloadPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(fileTable));
			downloadPredicate.push(contentTypePredicate.join(';'));
			var url = downloadPredicate.join('/') + '@sort(' + encodeSafeURIComponent(sortColumn) + ')?limit=1';
			var data = ERMREST.fetch(url, 'application/x-www-form-urlencoded; charset=UTF-8', false, true, [], null, null, null);
			if (data != null && data.length == 1) {
				ret = data[0][download];
			}
		}
	}
	return ret;
}

function getItemDenormalizedValue(table_name, row, column_name, val, dataset) {
	var ret = val;
	if (hasTableAnnotation(table_name, 'download') || hasTableAnnotation(table_name, 'image')) {
		var dataset_id = null;
		var file_id = null;
		$.each(SCHEMA_METADATA, function(i, table) {
			if (table_name == table['table_name']) {
				var column_definitions = table['column_definitions'];
				$.each(column_definitions, function(j, col) {
					if (col['annotations'] != null && col['annotations'][COLUMNS_LIST_URI] != null) {
						if (hasAnnotation(table_name, col['name'], 'dataset')) {
							dataset_id = col['name'];
						}
						if (hasAnnotation(table_name, col['name'], 'download') || hasAnnotation(table_name, col['name'], 'image')) {
							file_id = col['name'];
						}
					}
				});
				return false;
			}
		});
		if (file_id != null && column_name != dataset_id) {
			var downloadTable = table_name;
			var fileTable = getTablesBackReferences(downloadTable, dataset);
			var download = null;
			var sortColumn = null;
			var nameColumn = null;
			if (fileTable != null) {
				$.each(SCHEMA_METADATA, function(i, table) {
					if (fileTable == table['table_name']) {
						var column_definitions = table['column_definitions'];
						$.each(column_definitions, function(j, col) {
							if (col['annotations'] != null && col['annotations'][COLUMNS_LIST_URI] != null) {
								if (hasAnnotation(fileTable, col['name'], 'download')) {
									download = col['name'];
								}
								if (hasAnnotation(fileTable, col['name'], 'orderby')) {
									sortColumn = col['name'];
								}
								if (hasAnnotation(fileTable, col['name'], 'name')) {
									nameColumn = col['name'];
								}
							}
						});
						return false;
					}
				});
			}
			var predicate = [];
			predicate.push(encodeSafeURIComponent(dataset_id) + '=' + encodeSafeURIComponent(row[dataset_id]));
			predicate.push(encodeSafeURIComponent(file_id) + '=' + encodeSafeURIComponent(row[file_id]));
			var downloadPredicate = [];
			downloadPredicate.push(ERMREST_DATA_HOME);
			downloadPredicate.push('entity');
			downloadPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(downloadTable));
			downloadPredicate.push(predicate.join('&'));
			downloadPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(fileTable));
			var url = downloadPredicate.join('/') + '@sort(' + encodeSafeURIComponent(sortColumn) + ')?limit=1';
			var data = ERMREST.fetch(url, 'application/x-www-form-urlencoded; charset=UTF-8', false, true, [], null, null, null);
			if (data != null && data.length == 1) {
				ret = data[0][nameColumn];
			}
		}
	}
	return ret;
}

function getColumnName(table_name, column_annotation) {
	var ret = null;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name']) {
			var column_definitions = table['column_definitions'];
			$.each(column_definitions, function(i, col) {
				if (col['annotations'] != null &&
					col['annotations'][COLUMNS_LIST_URI] != null && col['annotations'][COLUMNS_LIST_URI].contains(column_annotation)) {
					ret = col['name'];
					return false;
				}
			});
			return false;
		}
	});
	return ret;
}

function getDenormalizedFiles(root_table, row, result) {
	emptyJSON(result);
	var tables = {};
	var downloadFiles = [];
	var ret = getDatasetFiles(root_table, row, 'download', tables);
	var col_name = getColumnName(tables['download'], 'type');
	if (ret != null) {
		$.each(ret, function(i, data) {
			if (data[col_name] != 'image/x.nifti') {
				downloadFiles.push(data);
			}
		});
	}
	var preview = getColumnName(tables['download'], 'preview');
	var uri = getColumnName(tables['download'], 'download');
	var filename = getColumnName(tables['download'], 'name');
	var bytes = getColumnName(tables['download'], 'orderby');
	result['viewer_url'] = getTableAnnotation(tables['download'], TABLES_MAP_URI, 'viewer_url');
	result['preview_url'] = getTableAnnotation(tables['download'], TABLES_MAP_URI, 'preview_url');
	result['enlarge_url'] = getTableAnnotation(tables['download'], TABLES_MAP_URI, 'enlarge_url');
	result['uri'] = uri;
	result['preview'] = preview;
	result['name'] = filename;
	result['size'] = bytes;
	result['image3dFiles'] = getDatasetFiles(root_table, row, 'preview', tables);;
	result['downloadFiles'] = downloadFiles;
	result['thumbnailsFiles'] = getDatasetFiles(root_table, row, 'image', tables);
}

function getDatasetFiles(root_table, row, table_annotation, tables) {
	var ret = null;
	var table_name = null;
	if (back_references[root_table] != null) {
		$.each(back_references[root_table], function(i, key) {
			if (hasTableAnnotation(key, table_annotation)) {
				table_name = key;
				return false;
			}
		});
	}
	if (table_name != null) {
		var root_id = null;
		var dataset_id = null;
		var fileTable = null;
		$.each(SCHEMA_METADATA, function(i, table) {
			if (table_name == table['table_name']) {
				$.each(table['foreign_keys'], function(j, fk) {
					$.each(fk['referenced_columns'], function(k, fkcol) {
						if (fkcol['table_name'] == root_table) {
							root_id = fkcol['column_name'];
							dataset_id = fk['foreign_key_columns'][k]['column_name'];
						} else {
							fileTable = fkcol['table_name'];
							tables[table_annotation] = fileTable;
						}
					});
				});
				return false;
			}
		});
		var predicate = [];
		predicate.push(encodeSafeURIComponent(dataset_id) + '=' + encodeSafeURIComponent(row[root_id]));
		var downloadPredicate = [];
		downloadPredicate.push(ERMREST_DATA_HOME);
		downloadPredicate.push('entity');
		downloadPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table_name));
		downloadPredicate.push(predicate.join('&'));
		downloadPredicate.push(encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(fileTable));
		var url = downloadPredicate.join('/');
		var data = ERMREST.fetch(url, 'application/x-www-form-urlencoded; charset=UTF-8', false, true, [], null, null, null);
		ret = data;
	}
	return ret;
}

function getTableDisplayName(table_name, schema) {
	if (schema == null) {
		schema = SCHEMA_METADATA;
	}
	var ret = table_name;
	if (schema != null) {
		$.each(schema, function(i, table) {
			if (table_name == table['table_name']) {
				if (table['annotations'][TABLES_MAP_URI] != null && table['annotations'][TABLES_MAP_URI]['display'] != null) {
					ret = table['annotations'][TABLES_MAP_URI]['display'];
				}
				return false;
			}
		});
	}
	return ret;
}

function getGeoValue(table_name, row, column_name) {
	var ret = null;
	var geo_prefix = null;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name']) {
			geo_prefix = table['annotations'][TABLES_MAP_URI][column_name];
			return false;
		}
	});
	ret = geo_prefix + row[column_name];
	return ret;
}

function isTextAttribute(table, column) {
	return !hasAnnotation(table, column, 'dataset') && !hasAnnotation(table, column, 'image') &&
		!hasAnnotation(table, column, 'preview') && !hasAnnotation(table, column, 'download');
}

function entityLinearize(denormalizedView, linearizeView) {
	emptyJSON(linearizeView);
	$.each(denormalizedView, function(table, rows) {
		$.each(rows, function(i, row) {
			if (Object.keys(row).length > 2) {
				if (linearizeView[table] == null) {
					linearizeView[table] = {'table': table, 'rows': []};
				}
				linearizeView[table]['rows'].push(row);
			} else {
				$.each(row, function(column, val) {
					if (isTextAttribute(table, column)) {
						if (linearizeView[column] == null) {
							linearizeView[column] = {'table': table, 'rows': []};
						}
						linearizeView[column]['rows'].push(row);
					}
				});
			}
		});
	});
}

function getSchemas() {
	var url = ERMREST_DATA_HOME + '/schema';
	var data = ERMREST.fetch(url, 'application/x-www-form-urlencoded; charset=UTF-8', false, true, [], null, null, null);
	if (data != null) {
		CATALOG_SCHEMAS = data['schemas'];
		var excludeSchemas = [];
		$.each(CATALOG_SCHEMAS, function(schema, value) {
			var annotations = value['annotations'];
			if (annotations != null && annotations[SCHEMAS_LIST_URI] != null && annotations[SCHEMAS_LIST_URI].contains('exclude')) {
				excludeSchemas.push(schema);
			}
		});
		$.each(excludeSchemas, function(i, schema) {
			delete CATALOG_SCHEMAS[schema];
		});
		setSchema();
		setCatalogTables();
	}
}

function setCatalogTables() {
	CATALOG_METADATA = {};
	$.each(CATALOG_SCHEMAS, function(schema, value) {
		CATALOG_METADATA[schema] = [];
		$.each(value['tables'], function(key, table) {
			CATALOG_METADATA[schema].push(table);
		});
	});
}

function hasColumnAnnotation(table_name, annotation) {
	var ret = false;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name']) {
			var column_definitions = table['column_definitions'];
			$.each(column_definitions, function(i, col) {
				if (col['annotations'] != null && col['annotations'][COLUMNS_LIST_URI] != null) {
					var comments = col['annotations'][COLUMNS_LIST_URI];
					if (comments.contains(annotation)) {
						ret = true;
						return false;
					}
				}
			});
			return false;
		}
	});
	return ret;
}

function getTableLabelName(table_name) {
	var ret = getColumnDisplayName(table_name);
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name']) {
			if (table['annotations'][TABLES_MAP_URI] != null && table['annotations'][TABLES_MAP_URI]['display'] != null) {
				ret = table['annotations'][TABLES_MAP_URI]['display'];
			}
			return false;
		}
	});
	return ret;
}

function setAssociationTablesNames(table) {
	association_tables_names = [];
	if (back_references != null && back_references[table] != null) {
		$.each(catalog_association_tables_names[SCHEMA], function(i, name) {
			if (back_references[table].contains(name)) {
				association_tables_names.push(name);
			}
		});
	}
	var vocabularies = getAssociationTablesNames(table);
	if (vocabularies != null) {
		$.each(vocabularies, function(i, name) {
			if (!association_tables_names.contains(name)) {
				association_tables_names.push(name);
			}
		})
	}
}

function getAssociationTablesNames(table) {
	var ret = [];
	var referenceTables = [];
	var tableMetadata = null;
	$.each(SCHEMA_METADATA, function(i, metadata) {
		if (metadata['table_name'] == table) {
			tableMetadata = metadata;
			return false;
		}
	});
	if (tableMetadata != null) {
		$.each(tableMetadata['foreign_keys'], function(i, key) {
			if (key['referenced_columns'] != null) {
				$.each(key['referenced_columns'], function(j, refCol) {
					referenceTables.push(refCol['table_name']);
				});
			}
		});
	}
	$.each(referenceTables, function(i, referenceTable) {
		$.each(SCHEMA_METADATA, function(i, metadata) {
			if (metadata['table_name'] == referenceTable) {
				if (metadata['annotations'] != null && metadata['annotations'][TABLES_LIST_URI] != null && metadata['annotations'][TABLES_LIST_URI].contains('association')) {
					ret.push(metadata['table_name']);
				}
			}
		});
	});
	if (ret.length == 0) {
		ret = null;
	}
	return ret;
}

function setBookmark(options) {
	var ret = {};
	$.each(options.box, function(table,columns) {
		var colsDescr = options['colsDescr'][table];
		$.each(columns, function(key, value) {
			if (searchBoxPresentation.contains(colsDescr[key]['type'])) {
				if (value['value'] != '') {
					if (ret[table] == null) {
						ret[table] = {};
					}
					if (ret[table][key] == null) {
						ret[table][key] = {};
					}
					ret[table][key]['value'] = value['value'];
				}
			} else if (colsDescr[key]['type'] == 'enum') {
				if (value['values'] != null) {
					$.each(value['values'], function(checkbox_key, checkbox_value) {
						if (checkbox_value) {
							if (ret[table] == null) {
								ret[table] = {};
							}
							if (ret[table][key] == null) {
								ret[table][key] = {};
								ret[table][key]['values'] = {}
							}
							ret[table][key]['values'][checkbox_key] = true;
						}
					});
				}
			} else if (sliderPresentation.contains(colsDescr[key]['type']) || datepickerPresentation.contains(colsDescr[key]['type'])) {
				if (!hasAnnotation(table, key, 'hidden') && !hasAnnotation(table, key, 'download')) {
					if (value['left'] || value['right']) {
						if (ret[table] == null) {
							ret[table] = {};
						}
						if (ret[table][key] == null) {
							ret[table][key] = {};
						}
						ret[table][key]['min'] = value['min'];
						ret[table][key]['floor'] = value['floor'];
						ret[table][key]['max'] = value['max'];
						ret[table][key]['ceil'] = value['ceil'];
						if (value['left']) {
							ret[table][key]['left'] = value['left'];
						}
						if (value['right']) {
							ret[table][key]['right'] = value['right'];
						}
					}
				}
			}
		});
	});
	var filter = encodeFilter(ret);
	var prefix = window.location.href;
	var index = prefix.indexOf('#');
	if (index != -1) {
		prefix = prefix.substring(0, index);
	}
	var parameters = [];
	if (filter != null) {
		parameters.push('facets='+filter);
	}
	parameters.push('layout='+options.view);
	parameters.push('page='+options.pagingOptions.currentPage);
	options.bookmark = prefix + '#' + CATALOG + '/' + encodeSafeURIComponent(SCHEMA) + ':' +options.table + '?' + parameters.join('&');
	if (!loadPage && !suppressBookmark && options.filter == null) {
		assignBookmark = true;
		window.location.assign(options.bookmark);
		setTimeout(function() {assignBookmark = false;}, 1);
	}
	loadPage = false;
}

function getSearchQuery(url) {
	var ret = {};
	var index = url.indexOf('#');
	if (index != -1) {
		var path = [];
		var catalog = null;
		var entity = null;
		var filter = null;
		var query = url.substring(index+1);
		var fragments = query.split('?');
		path = fragments[0];
		if (fragments.length == 2) {
			filter = fragments[1];
		}
		path = path.split('/');
		catalog = path[0];
		if (path.length == 2) {
			entity = path[1];
		}
		if (catalog.length > 0) {
			ret['catalog'] = catalog;
		}
		if (entity != null) {
			var parts = entity.split(':');
			if (parts.length == 2 && parts[0].length > 0 && parts[1].length > 0) {
				ret['entity'] = entity;
			}
		}
		if (filter != null) {
			var parameters = filter.split('&');
			$.each(parameters, function(i, parameter) {
				var item = parameter.split('=');
				ret[item[0]] = item[1];
			});
		}
	}
	return ret;
}

function setFilterValue(facet, separator, result) {
	var name = facet[0].split(':');
	var table = decodeURIComponent(name[0]);
	var column = decodeURIComponent(name[1]);
	if (result[table] == null) {
		result[table] = {};
	}
	if (result[table][column] == null) {
		result[table][column] = {};
	}
	if (separator == '::ciregexp::') {
		result[table][column]['value'] = decodeURIComponent(facet[1]);
	} else if (separator == '::eq::') {
		if (result[table][column]['values'] == null) {
			result[table][column]['values'] = {};
		}
		var values = facet[1].split(';');
		$.each(values, function(i, value) {
			result[table][column]['values'][decodeURIComponent(value)] = true;
		});
	} else if (separator == '::geq::') {
		result[table][column]['min'] = facet[1];
		result[table][column]['left'] = true;
	} else if (separator == '::leq::') {
		result[table][column]['max'] = facet[1];
		result[table][column]['right'] = true;
	}
}

function decodeFilter(filter) {
	var ret = {};
	var factors = filter.substring(1,filter.length-1).split('/');
	$.each(factors, function(i, factor) {
		if (factor.split('::ciregexp::').length == 2) {
			setFilterValue(factor.split('::ciregexp::'), '::ciregexp::', ret);
		} else if (factor.split('::eq::').length == 2) {
			setFilterValue(factor.split('::eq::'), '::eq::', ret);
		} else if (factor.split('::geq::').length == 2) {
			setFilterValue(factor.split('::geq::'), '::geq::', ret);
		} else if (factor.split('::leq::').length == 2) {
			setFilterValue(factor.split('::leq::'), '::leq::', ret);
		}
	});
	return ret;
}

function encodeFilter(filter) {
	var ret = null;
	var factors = [];
	$.each(filter, function(table, columns) {
		$.each(columns, function(column, values) {
			var col_name = fixedEncodeURIComponent(table) + ':' + fixedEncodeURIComponent(column);
			var found = false;
			$.each(values, function(key, value) {
				if (key == 'value') {
					factors.push(col_name + '::ciregexp::' + fixedEncodeURIComponent(value));
					found = true;
				} else if (key == 'values') {
					var terms = [];
					$.each(value, function(term, val) {
						terms.push(fixedEncodeURIComponent(term));
					});
					factors.push(col_name + '::eq::' + terms.join(';'));
					found = true;
				}
			});
			if (!found) {
				factors.push(col_name + '::geq::' + values['min']);
				factors.push(col_name + '::leq::' + values['max']);
			}
		});
	});
	if (factors.length > 0) {
		ret = '(' + factors.join('/') + ')';
	}
	return ret;
}

function fixedEncodeURIComponent (str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
		return '%' + c.charCodeAt(0).toString(16).toUpperCase();
	});
}

function encodeRegularExpression (str) {
	// encode first '[' and/or ']'
	var str1 = str.replace(/[\[\]]/g, function(c) {
		return '[' + c + ']';
		});
	var str2 = str1.replace(/[\^$.()*?{}+]/g, function(c) {
		return '[' + c + ']';
	});
	return str2;
}

function initLogin() {
	login(encodeSafeURIComponent(window.location));
}

function hasTableFacetsHidden(table_name) {
	var ret = false;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name'] && table['annotations'] != null) {
			if (table['annotations'][TABLES_FACET_URI] != null && table['annotations'][TABLES_FACET_URI] == 'hidden' ||
					table['annotations'][TABLES_LIST_URI] != null && table['annotations'][TABLES_LIST_URI].contains('exclude')) {
				ret = true;
				return false;
			}
		}
	});
	return ret;
}

function hasColumnFacetHidden(table_name, column_name) {
	var ret = false;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name']) {
			var column_definitions = table['column_definitions'];
			$.each(column_definitions, function(i, col) {
				if (col['name'] == column_name) {
					if (col['annotations'] != null && col['annotations'][COLUMNS_FACET_URI] != null && col['annotations'][COLUMNS_FACET_URI] == 'hidden' ||
							facetPolicy == 'on_demand' && hasAnnotation(table_name, column_name, 'hidden')) {
						ret = true;
					}
					return false;
				}
			});
			return false;
		}
	});
	return ret;
}

function initFacetGroups(options, facet, successCallback) {
	var table = facet['table'];
	var col = facet['name'];
	var param = {};
	param['options'] = options;
	param['col'] = col;
	param['table'] = table;
	param['facet'] = facet;
	param['successCallback'] = successCallback;
	var col_type = null;
	var metadata = null;
	var queryPredicate = null;
	if (table == options['table']) {
		metadata = options['metadata'];
		queryPredicate = getQueryPredicate(options) + '/$A';
	} else {
		metadata = association_tables[table]['metadata'];
		queryPredicate = getQueryPredicate(options, table);
	}
	if (metadata != null) {
		var column_definitions = metadata['column_definitions'];
		$.each(column_definitions, function(i, colDef) {
			if (colDef['type']['typename'] != 'json' && colDef['name'] == col) {
				col_type = colDef['type']['typename'];
				param['col_type'] = col_type;
			}
		});
		var url = null;
		if (!searchBoxPresentation.contains(col_type) && !checkBoxPresentation.contains(col_type) && !sliderPresentation.contains(col_type) && !datepickerPresentation.contains(col_type)) {
			searchBoxPresentation.push(col_type);
		}
		if (searchBoxPresentation.contains(col_type) || checkBoxPresentation.contains(col_type)) {
			url = ERMREST_DATA_HOME + '/aggregate/' + queryPredicate + '/cnt_d:=cnt_d(' + encodeSafeURIComponent(col) + ')';
		} else if (datepickerPresentation.contains(col_type) || sliderPresentation.contains(col_type)) {
			url = ERMREST_DATA_HOME + '/aggregate/' + queryPredicate + '/min:=min(' + encodeSafeURIComponent(col) + '),max:=max(' + encodeSafeURIComponent(col) + ')';
		} else {
			console.log('Type not found: '+col_type);
		}
		if (url != null) {
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successInitFacetGroups, errorErmrest, param);
		}
	}
}

function successInitFacetGroups(data, textStatus, jqXHR, param) {
	var col = param['col'];
	var facet = param['facet'];
	var options = param['options'];
	var table = param['table'];
	var col_type = param['col_type'];
	var queryPredicate = null;
	if (table == options['table']) {
		queryPredicate = getQueryPredicate(options) + '/$A';
	} else {
		queryPredicate = getQueryPredicate(options, table);
	}
	var ready = false;
	if (searchBoxPresentation.contains(col_type) || checkBoxPresentation.contains(col_type)) {
		if (data[0]['cnt_d'] <= MULTI_SELECT_LIMIT && !textColumns.contains(col)) {
			param['col_type'] = 'enum';
			var url = ERMREST_DATA_HOME + '/attributegroup/' + getQueryPredicate(options, table) + '/' +
				getSortGroup(table, col, 'rank') + '@sort(' + encodeSafeURIComponent(getSortColumn(table, col, 'rank')) + ')?limit=none';
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successInitFacetGroups, errorErmrest, param);
		} else {
			ready = true;
		}
	} else if (col_type == 'enum') {
		ready = true;
		var values = [];
		$.each(data, function(i, row) {
			if (row[col] != null) {
				values.push(row[col]);
			}
		});
		options['colsGroup'][table][col] = {};
		options['colsDescr'][table][col]['type'] = col_type;
		options['colsDescr'][table][col]['values'] = values;
		options['box'][table][col]['values'] = {};
	} else if (datepickerPresentation.contains(col_type)) {
		ready = true;
		options['colsDescr'][table][col]['min'] = options['box'][table][col]['min'] = options['box'][table][col]['floor'] = getDateString(data[0]['min'], 'min');
		options['colsDescr'][table][col]['max'] = options['box'][table][col]['max'] = options['box'][table][col]['ceil'] = getDateString(data[0]['max'], 'max');
		options['box'][table][col]['values'] = {};
	} else if (sliderPresentation.contains(col_type)) {
		ready = true;
		options['colsDescr'][table][col]['min'] = options['box'][table][col]['min'] = options['box'][table][col]['floor'] = data[0]['min'];
		options['colsDescr'][table][col]['max'] = options['box'][table][col]['max'] = options['box'][table][col]['ceil'] = data[0]['max'];
		options['box'][table][col]['values'] = {};
	}

	if (ready) {
		if (initializedFacets[table] == null) {
			initializedFacets[table] = [];
		}
		initializedFacets[table].push(col)
		updateFacetCount(options, facet, param['successCallback']);
	}
}

function updateFacetCount(options, facet, successCallback) {
	if (facetPolicy == 'on_demand') {
		var table = facet['table'];
		var col = facet['name'];
		if (!hasAnnotation(table, col, 'top') && (initializedFacets[table] == null || !initializedFacets[table].contains(col))) {
			initFacetGroups(options, facet, successCallback);
		} else {
			if (options['chooseColumns'][table][col]) {
				// the facet was checked
				var predicate = getPredicate(options, col, table, null, []);
				var url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options) + '/';
				if (predicate != null && predicate.length > 0) {
					url += predicate.join('/') + '/' ;
				}
				var aliasDef = '';
				if (association_tables_names.contains(table)) {
					aliasDef = '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table) + '/';
				}
				var tableRef = (association_tables_names.contains(table)
					? aliasDef + '$A/$' + association_tables[table]['alias']
					: '$A');
				url += tableRef +  '/' + 'cnt:=cnt(' + encodeSafeURIComponent(col) + ')';
				var param = {};
				param['successCallback'] = successCallback;
				param['facet'] = facet;
				param['options'] = options;
				param['table'] = table;
				param['col'] = col;
				ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateFacetCount, errorErmrest, param);
			}
		}
	}
}

function successUpdateFacetCount(data, textStatus, jqXHR, param) {
	var successCallback = param['successCallback'];
	var options = param['options'];
	var table = param['table'];
	var facet = param['facet'];
	var box = param['options']['box'][table];
	var col = param['col'];
	box[col]['count'] = col + ' (' + data[0]['cnt'] + ')';
	box[col]['facetcount'] = data[0]['cnt'];
	if (options['box'][table][col]['floor'] != null) {
		updateFacetSlider(options, facet, successCallback);
	} else if (options['colsDescr'][table][col]['type'] == 'enum') {
		updateFacetGroups(options, facet, successCallback);
	} else {
		successCallback();
	}
}

function updateFacetGroups(options, facet, successCallback) {
	var table = facet['table'];
	var col = facet['name'];
	var predicate = getPredicate(options, col, table, null, []);
	var aliasDef = '';
	if (association_tables_names.contains(table)) {
		aliasDef = '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table) + '/';
	}
	var tableRef = (association_tables_names.contains(table)
		? aliasDef + '$A/$' + association_tables[table]['alias']
		: '$A');
	var param = {};
	var col_name = encodeSafeURIComponent(col);
	param['options'] = options;
	param['col'] = col;
	param['table'] = table;
	param['facet'] = facet;
	param['successCallback'] = successCallback;
	var url = ERMREST_DATA_HOME + '/attributegroup/' + getQueryPredicate(options) + '/';
	if (predicate != null && predicate.length > 0) {
		url += predicate.join('/') + '/';
	}
	url += tableRef +  '/' + col_name + ';cnt:=cnt(' + col_name + ')';
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateFacetGroups, errorErmrest, param);

}

function successUpdateFacetGroups(data, textStatus, jqXHR, param) {
	var successCallback = param['successCallback'];
	var options = param['options'];
	var table = param['table'];
	var facet = param['facet'];
	var box = param['options']['box'][table];
	var col = param['col'];
	var values = [];
	var colsGroup = param['options']['colsGroup'][table];
	$.each(data, function(i, value) {
		var key = value[col];
		if (key != null) {
			colsGroup[col][key] = value['cnt'];
			values.push(key);
		}
	});
	var hideValues = [];
	var allValues = options['colsDescr'][table][col]['values'];
	$.each(allValues, function(i, value) {
		if (!values.contains(value)) {
			hideValues.push(value);
		}
	});
	$.each(hideValues, function(i, key) {
		colsGroup[col][key] = 0;
	});
	successCallback();
}

function updateFacetSlider(options, facet, successCallback) {
	var table = facet['table'];
	var col = facet['name'];
	var values = options['box'][table][col]['values'];
	var predicate = getPredicate(options, values['left'] || values['right'] ? null : col, table, null, []);
	var aliasDef = '';
	if (association_tables_names.contains(table)) {
		aliasDef = '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(table) + '/';
	}
	var tableRef = (association_tables_names.contains(table)
		? aliasDef + '$A/$' + association_tables[table]['alias']
		: '$A');
	var param = {};
	param['options'] = options;
	param['col'] = col;
	param['table'] = table;
	param['successCallback'] = successCallback;
	var url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options) + '/';
	if (predicate != null && predicate.length > 0) {
		url += predicate.join('/') + '/';
	}
	url += tableRef +  '/' + 'min:=min(' + encodeSafeURIComponent(col) + '),max:=max(' + encodeSafeURIComponent(col) + ')';
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateFacetSlider, errorErmrest, param);
}

function successUpdateFacetSlider(data, textStatus, jqXHR, param) {
	var successCallback = param['successCallback'];
	var options = param['options'];
	var table = param['table'];
	var col = param['col'];
	var box = param['options']['box'][table];
	if (data[0]['min'] != null) {
		if (!box[col]['left']) {
			box[col]['min'] = data[0]['min'];
		}
		if (!box[col]['right']) {
			box[col]['max'] = data[0]['max'];
		}
		if (box[col]['right'] && box[col]['max'] == box[col]['ceil']) {
			delete box[col]['right'];
		}
		if (box[col]['left'] && box[col]['min'] == box[col]['floor']) {
			delete box[col]['left'];
		}
	}
	successCallback();
}

function getFacetCount(options, facet) {
	var table = facet['table'];
	var col = facet['name'];
	var ret = 0;
	try {
		ret = (facetPolicy == 'on_demand' && options['chooseColumns'][table][col] != null && !options['chooseColumns'][table][col]) ? '' : options.box[table][col]['facetcount'];
	}
	catch (err) {
	}
	return ret;
}

function isColumnFacetOnDemand(options, table, col) {
	var ret = false;

	if (facetPolicy == 'on_demand') {
		if (options != null && options['chooseColumns'] != null && options['chooseColumns'][table] != null && options['chooseColumns'][table][col] != null) {
			ret = !options['chooseColumns'][table][col];
		} else {
			ret = false;
		}
	}

	return ret;
}

function isSelectedColumnFacetOnDemand(options, table, col) {
	var ret = false;

	if (facetPolicy == 'on_demand') {
		if (options != null && options['chooseColumns'] != null && options['chooseColumns'][table] != null && options['chooseColumns'][table][col] != null) {
			ret = options['chooseColumns'][table][col];
		} else {
			ret = hasAnnotation(table, col, 'top');
			if (ret) {
				options['chooseColumns'][table][col] = true;
			}
		}
	}
	return ret;
}

function getFacetOrder(facet) {
	var ret = null;
	var table_name = facet['table'];
	var column_name = facet['name'];
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name']) {
			var column_definitions = table['column_definitions'];
			$.each(column_definitions, function(i, col) {
				if (col['name'] == column_name) {
					if (col['annotations'] != null && col['annotations'][COLUMNS_FACET_ORDER_URI] != null) {
						ret = parseInt(col['annotations'][COLUMNS_FACET_ORDER_URI], 10);
					}
					return false;
				}
			});
			return false;
		}
	});
	return ret;
}

function getUrlText(table_name, column_name, url) {
	var ret = url;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name']) {
			var column_definitions = table['column_definitions'];
			$.each(column_definitions, function(i, col) {
				if (col['name'] == column_name) {
					if (col['annotations'] != null && col['annotations'][COLUMNS_MAP_URI] != null && col['annotations'][COLUMNS_MAP_URI]['url_text'] != null) {
						ret = col['annotations'][COLUMNS_MAP_URI]['url_text'];
					}
					return false;
				}
			});
			return false;
		}
	});
	return ret;
}

function getThumbnailColumn(table_name) {
	var ret = null;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table["table_name"] == table_name) {
			$.each(table['column_definitions'], function(i, col_def) {
				if (col_def['annotations'][COLUMNS_LIST_URI] != null && col_def['annotations'][COLUMNS_LIST_URI].contains('thumbnail')) {
					ret = col_def['name'];
					return false;
				}
			});
		}
	});
	return ret;
}

function getPredicateAttributes(options) {
	var ret = {};
	$.each(options.box, function(table,columns) {
		var colsDescr = options['colsDescr'][table];
		$.each(columns, function(key, value) {
			if (searchBoxPresentation.contains(colsDescr[key]['type'])) {
				if (value['value'] != '') {
					if (ret[table] == null) {
						ret[table] = [];
					}
					ret[table].push(key);
				}
			} else if (colsDescr[key]['type'] == 'enum') {
				if (value['values'] != null) {
					$.each(value['values'], function(checkbox_key, checkbox_value) {
						if (checkbox_value) {
							if (ret[table] == null) {
								ret[table] = [];
							}
							ret[table].push(key);
							return false;
						}
					});
				}
			} else if (sliderPresentation.contains(colsDescr[key]['type']) || datepickerPresentation.contains(colsDescr[key]['type'])) {
				if (!hasAnnotation(table, key, 'hidden') && !hasAnnotation(table, key, 'download')) {
					if (value['left'] || value['right']) {
						if (ret[table] == null) {
							ret[table] = [];
						}
						ret[table].push(key);
					}
				}
			}
		});
	});

	return ret;
}

function getSortPredicate(data, sortColumn, sortOrder, page, pageSize) {
	var sortPredicate = [];
	if (data[(page-1)*pageSize][sortColumn] == null) {
		var offsetPredicate = [];
		offsetPredicate.push(encodeSafeURIComponent(sortColumn) + '::null::');
		$.each(PRIMARY_KEY, function(i, primaryCol) {
			offsetPredicate.push(encodeSafeURIComponent(primaryCol) + '::geq::' + encodeSafeURIComponent(data[(page-1)*pageSize][primaryCol]));
		});
		sortPredicate.push(offsetPredicate.join('&'));
	} else {
		var offsetPredicate = [];
		offsetPredicate.push(encodeSafeURIComponent(sortColumn) + (sortOrder == 'asc' ? '::geq::' : '::leq::') + encodeSafeURIComponent(data[(page-1)*pageSize][sortColumn]));
		$.each(PRIMARY_KEY, function(i, primaryCol) {
			offsetPredicate.push(encodeSafeURIComponent(primaryCol) + '::geq::' + encodeSafeURIComponent(data[(page-1)*pageSize][primaryCol]));
		});
        sortPredicate.push(offsetPredicate.join('&'));
		sortPredicate.push(encodeSafeURIComponent(sortColumn) + (sortOrder == 'asc' ? '::gt::' : '::lt::') + encodeSafeURIComponent(data[(page-1)*pageSize][sortColumn]));
		sortPredicate.push(encodeSafeURIComponent(sortColumn) + '::null::');
	}
	return sortPredicate;
}

function getExportSortPredicate(data, sortColumn, sortOrder) {
	var sortPredicate = [];
	if (data[0][sortColumn] == null) {
		sortPredicate.push(encodeSafeURIComponent(sortColumn) + '::null::');
	} else {
		sortPredicate.push(encodeSafeURIComponent(sortColumn) + (sortOrder == 'asc' ? '::geq::' : '::leq::') + encodeSafeURIComponent(data[0][sortColumn]));
		sortPredicate.push(encodeSafeURIComponent(sortColumn) + '::null::');
	}
	return sortPredicate;
}

function facetIsInBookmark(table_name, column_name, filter) {
	var ret = false;
	if (filter != null) {
		$.each(filter, function(table, columns) {
			if (table == table_name) {
				$.each(columns, function(column, values) {
					if (column == column_name) {
						ret = true;
						return false;
					}
				});
				return false;
			}
		});
	}
	return ret;
}

function chaiseApp() {
	//window.location = window.location.origin;
	var url = '/chaise/search';
	if (chaiseConfig['dataBrowser'] !== undefined) {
		url = chaiseConfig['dataBrowser'];
	}
	window.location = url;
}

function getSortColumn(table_name, column_name, annotation) {
	var ret = column_name;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name']) {
			var column_definitions = table['column_definitions'];
			$.each(column_definitions, function(i, col) {
				if (col['name'] == column_name) {
					if (col['annotations'] != null && col['annotations'][COLUMNS_MAP_URI] != null && col['annotations'][COLUMNS_MAP_URI][annotation] != null) {
						ret = col['annotations'][COLUMNS_MAP_URI][annotation];
					}
					return false;
				}
			});
			return false;
		}
	});
	return ret;
}

function getSortGroup(table_name, column_name, annotation) {
	var ret = [];
	ret.push(encodeSafeURIComponent(column_name));
	var rankColumn = getSortColumn(table_name, column_name, annotation);
	if (rankColumn != column_name) {
		ret.push(encodeSafeURIComponent(rankColumn));
	}
	return ret.join(',');
}

function getDateString(value, position) {
	var ret = (value != null ? value.slice(0,10) : null);
	if (ret != null && ret != value && position == 'max') {
		// add a day such you don't loose the timestamps values for that day
		ret = new Date(ret);
		ret.setUTCDate(ret.getUTCDate() + 1);
		ret = ret.getUTCFullYear() + '-' + ('0' + (ret.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + ret.getUTCDate()).slice(-2);
	}
	return ret;
}

function getSchemaAnnotation(schema_name, annotation_uri) {
	var ret = null;

	$.each(CATALOG_SCHEMAS, function(schema, value) {
		if (schema == schema_name) {
			var annotations = value['annotations'];
			if (annotations != null && annotations[annotation_uri] != null) {
				ret = annotations[annotation_uri];
				return false;
			}
		}
	});

	return ret;
}

function getTableAnnotationValue(table_name, annotation) {
	var ret = null;
	$.each(SCHEMA_METADATA, function(i, table) {
		if (table_name == table['table_name'] && table['annotations'] != null &&
			table['annotations'][annotation] != null) {
			ret = table['annotations'][annotation];
			return false;
		}
	});
	return ret;
}

function isRecordFilter(url) {
	var ret = false;
	var index = url.indexOf('#');
	if (index != -1) {
		var query = url.substring(index+1);
		var parts = query.split('/');
		if (parts.length >= 3 && query.indexOf('?') == -1) {
			ret = true;
		}
	}
	return ret;
}

function convertFilter(url) {
	var index = url.indexOf('#');
	var prefix = url.substring(0, index+1);
	var parts = url.substring(index+1).split('/');
	if (parts.length != 3) {
		throw new Error('Invalid URL');
	}
	var catalog = parts[0];
	var entity = parts[1];
	var schema = entity.split(':')[0];
	var table = entity.split(':')[1];
	var newUrl = prefix + catalog + '/' + entity + '?facets=(';
	var predicate = [];
	for (var i=2; i<parts.length; i++) {
		var orParts = parts[i].split(';');
		var columns = [];
		var values = [];
		for (var j=0; j<orParts.length; j++) {
			var term = orParts[j].split('=');
			if (term.length != 2) {
				throw  new Error('Invalid value: ' + orParts[j]);
			}
			var column = term[0];
			if (column.split(':').length != 1) {
				throw  new Error('Invalid value: ' + column);
			}
			if (columns.length == 0) {
				columns.push(column);
			}
			if (column != columns[0]) {
				throw  new Error('Invalid value: ' + orParts[j]);
			}
			values.push(term[1]);
		}
		predicate.push(table + ':' + column + '::eq::' + values.join(';'));
	}
	newUrl += predicate.join('/') + ')&layout=table&page=1';
	return newUrl;
}

