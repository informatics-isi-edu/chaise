var MULTI_SELECT_LIMIT = 1000;
var AJAX_TIMEOUT = 300000;
var goauth_cookie = 'globusonline-goauth';
var token = null;
var SCHEMA = null;
var CATALOG = null;
var authnProvider = null;
var ERMREST_CATALOG_PATH = '/ermrest/catalog/';
var ERMREST_SCHEMA_HOME = null;
var ERMREST_DATA_HOME = null;
var URL_ESCAPE = new String("~!()'");

var PRIMARY_KEY = [];
var uniquenessColumns = [];
var textColumns = [];
var display_columns = {};
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
var COLUMNS_MAP_URI = 'description';
var TABLES_MAP_URI = 'description';

var thumbnailFileTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/tiff'];
var viewer3dFileTypes = ['image/x.nifti'];

var psqlNumeric = [ 'bigint', 'double precision', 'integer', 'numeric', 'real', 'int8', 'int4',
		'smallint' ];

var psqlText = [ 'date', 'timestamptz', 'time without time zone', 'time with time zone', 'timestamp without time zone', 'timestamp with time zone',
                 'character', 'character varying', 'text' ];

var visibleColumns = {
		'dataset1': [
		             'id',
		             'owner',
		             'title',
		             'organism',
		             // 'gender',
		             'genotype',
		             'age_stages',
		             'chromosome'
		             ],
         'mouse': [
                   'id',
                   'owner',
                   'title',
                   'genotype',
                   'age_stages',
                   'chromosome'
                   ],
	      'human': [
	                 'id',
	                 'owner',
	                 'title',
	                 //'gender',
	                 'genotype',
	                 'age_stages',
	                 'chromosome'
	                 ],
   	      'zebrafish': [
                 'id',
                 'owner',
                 'title',
                 'genotype',
                 'age_stages'
                 ]
};

var unsortableColumns = [];

function isSortable(table, column) {
	return !unsortableColumns.contains(column);
}

function initApplicationHeader(tables) {
	// overwritten by the application
}

function loadApplicationHeaderAndFooter() {
	$( "#ermrestHeader" ).load( "views/ermheader.html" );
	$( "#ermrestFooter" ).load( "views/ermfooter.html" );
}

function initApplication() {
	loadApplicationHeaderAndFooter();
	initLocation();
	ERMREST_DATA_HOME = HOME + ERMREST_CATALOG_PATH + CATALOG;
	getSchemas();
	getSession();
	//alert(JSON.stringify(DATASET_COLUMNS, null, 4));
}

function setSchema() {
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
	case 401:
		// redirect to login in case of an Unauthorized error
		document.body.style.cursor = 'default';
		if (authnProvider == 'goauth') {
			getGoauth(window.location);
		} else {
			var login_url = '#/login';
			if (CATALOG != null) {
				url += '?catalog=' + CATALOG;
			}
			if (SCHEMA != null) {
				if (url == '#/login') {
					url += '?';
				} else {
					url += '&';
				}
				url += 'schema=' + SCHEMA;
			}
			window.location = url;
		}
		break;
	default:
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
		alert(msg);
	}
}

var ERMREST = {
		POST: function(url, contentType, async, processData, obj, successCallback, errorCallback, param) {
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
	var res = {'User-agent': 'ERMREST/1.0'};
	token = $.cookie(goauth_cookie);
	if (token != null) {
		res['Authorization'] = 'Globus-Goauthtoken ' + token;
	}
	return res;
}

function submitLogin(username, password) {
	var url = HOME + '/ermrest/authn/session';
	var obj = {
			'username': username,
			'password': password
	};
	ERMREST.POST(url, 'application/x-www-form-urlencoded; charset=UTF-8', true, true, obj, successSubmitLogin, null, null);
}

function successSubmitLogin(data, textStatus, jqXHR) {
	window.location = '#/retrieve?catalog=' + CATALOG + '&schema=' + SCHEMA;
}

function submitGlobusLogin(username, password) {
	token = $.cookie(goauth_cookie);
	if (token == null) {
		var url = '/service/nexus/goauth/token?grant_type=client_credentials';
		var result = {};
		$.ajax({
			async: false,
			type: 'GET',
			dataType: 'json',
			url: url,
			headers: { Authorization: make_basic_auth(username, password) },
			error: function(jqXHR, textStatus, errorThrown) {
				handleError(jqXHR, textStatus, errorThrown, url);
				result = null;
			},
			success: function(json) {
				result = json;
			}
		});

		if (result != null) {
			token = result['access_token'];
			//alert(token);
			$.cookie(goauth_cookie, token, { expires: 7 });
		} else {
			return null;
		}
		USER = username;
		return token;
	} else {
		USER = username;
		return token;
	}
}

function make_basic_auth(user, password) {
	var tok = user + ':' + password;
	var hash = btoa(tok);
	return 'Basic ' + hash;
}

function submitLogout() {
	if (token != null) {
		$.removeCookie(goauth_cookie);
		token = null;
	}
	HOME = null;
	USER = null;
	return true;
}

function encodeSafeURIComponent(value) {
	var ret = encodeURIComponent(value);
	$.each(URL_ESCAPE, function(i, c) {
		ret = ret.replace(new RegExp('\\' + c, 'g'), escape(c));
	});
	return ret;
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
	textColumns = [];
	unsortableColumns = [];
	display_columns = {
			'text_columns': [], 
			'file': [],
			'thumbnail': [],
			'zoomify': [],
			'3dview': [],
			'hidden': [],
			'url': []
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
		var htmlCellTemplate = '<div class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text ng-bind-html="row.getProperty(col.field)"></span></div>';
		var cellTemplate = '<div class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text>{{row.getProperty(col.field)}}</span></div>';
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
			var col_def = {};
			col_def['field'] = col['name'];
			col_def['cellTemplate'] = cellTemplate;
			col_def['groupable'] = false;
			/*
			var b = $('<b>');
			b.html(col['name']);
			$('body').append(b);
			var l = b.width() + 10;
			col_def['minWidth'] = col_def['width'] = (l > MULTI_SELECT_LIMIT ? l : MULTI_SELECT_LIMIT);
			 */
			var visibleTableColumns = visibleColumns[metadata['table_name']];
			if (visibleTableColumns != null && !visibleTableColumns.contains(col['name'])){
				col_def['visible'] = false;
			}
			if (unsortableColumns.contains(col['name'])){
				col_def['sortable'] = false;
			}
			columns_definitions.push(col_def);
			//b.remove();
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
		});
	}
	if (PRIMARY_KEY.length == 0) {
		$.each(ret, function(i, col) {
			PRIMARY_KEY.push(encodeSafeURIComponent(col));
		});
	}
	
	var table = options['table'];
	options['box'][table] = {};
	options['colsGroup'][table] = {};
	options['facetClass'][table] = {};
	options['chooseColumns'][table] = {};
	options['searchFilterValue'][table] = {};
	options['narrow'][table] = {};

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
			if (psqlText.contains(colsDescr[key]['type'])) {
				value = value['value'].split(' ');
				$.each(value, function(i, val) {
					if (val.length > 0) {
						tablePredicate.push(encodeSafeURIComponent(key) + '::ciregexp::' + encodeSafeURIComponent(val));
					}
				});
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
			} else if (psqlNumeric.contains(colsDescr[key]['type'])) {
				if (value['left']) {
					tablePredicate.push(encodeSafeURIComponent(key) + '::geq::' + encodeSafeURIComponent(value['min']));
				}
				if (value['right']) {
					tablePredicate.push(encodeSafeURIComponent(key) + '::leq::' + encodeSafeURIComponent(value['max']));
				}
			}
		});
		if (tablePredicate.length > 0) {
			if (table != options['table'] && association_tables[table] != null) {
				predicate.push('$A');
				predicate.push(association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(table));
				if (aliases != null) {
					aliases.push(association_tables[table]['alias']);
				}
			}
			predicate = predicate.concat(tablePredicate);
		}
	});

	if (filterAllText && filterAllText != '') {
		predicate.push(encodeSafeURIComponent('*') + '::ciregexp::' + encodeSafeURIComponent(filterAllText));
	}
	return predicate;
}

function getErmrestData(options, successCallback, successUpdateModels) {
	updateCount(options, successUpdateModels);
	var url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options);
	var predicate = getPredicate(options, null, null, null, null);
	if (predicate.length > 0) {
		url += '/' + predicate.join('/');
	}
	updateGroups(options, successUpdateModels);
	updateSliders(options, successUpdateModels);
	url += '/$A/cnt:=cnt(*)';
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
	var table = options['table'];
	var box = options['box'][table];
	var colsDescr = options['colsDescr'][options['table']];
	var colsGroup = options['colsGroup'][options['table']];
	var topN = [];
	$.each(options['score'], function(i,col) {
		if (i < 10) {
			topN.push(col['name']);
		} else {
			return false;
		}
	});
	var sentRequests = false;
	$.each(colsDescr, function(col, value) {
		options['chooseColumns'][table][col] = topN.contains(col);
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
		} else if (psqlText.contains(value['type'])) {
			box[col]['value'] = '';
		} else if (psqlNumeric.contains(value['type'])) {
			box[col]['min'] = box[col]['floor'] = value['min'];
			box[col]['max'] = box[col]['ceil'] = value['max'];
			sentRequests = true;
		}
	});
	var topCount = 0;
	$.each(association_tables_names, function(i, table) {
		var box = options['box'][table];
		var colsDescr = options['colsDescr'][table];
		var colsGroup = options['colsGroup'][table];
		$.each(colsDescr, function(col, value) {
			var hasTop = hasAnnotation(table, col, 'top');
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
			} else if (psqlText.contains(value['type'])) {
				box[col]['value'] = '';
			} else if (psqlNumeric.contains(value['type'])) {
				box[col]['min'] = box[col]['floor'] = value['min'];
				box[col]['max'] = box[col]['ceil'] = value['max'];
				sentRequests = true;
			}
		});
	});
	var index = 10 - topCount;
	var table = options['table'];
	$.each(topN, function(i, col) {
		if (i >= index) {
			options['chooseColumns'][table][topN[i]] = false;
			options['searchFilterValue'][table][topN[i]] = '';
		}
	})
	
	if (!sentRequests) {
		successCallback();
	} else {
		updateGroups(options, successCallback);
		updateSliders(options, successCallback);
	}
}

function updateCount(options, successCallback) {
	var tables = [options['table']].concat(association_tables_names);
	var alertObject = {'display': true};
	$.each(tables, function(i, table) {
		var box = options['box'][table];
		var urlPrefix = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options) + '/';
		$.each(box, function(col, value) {
			box[col]['ready'] = false;
		});
		$.each(box, function(col, value) {
                        var aliases = [];
			var predicate = getPredicate(options, col, table, null, aliases);
			var url = urlPrefix;
			if (predicate != null && predicate.length > 0) {
				url += predicate.join('/') + '/' ;
			}
                        var aliasDef = '';
                        if (association_tables_names.contains(table)) {
                            if (!aliases.contains(association_tables[table]['alias'])) {
                                aliasDef = '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(table) + '/';
                            }
                        }
                        var tableRef = (association_tables_names.contains(table) 
                                        ? aliasDef + '$A/$' + association_tables[table]['alias']
                                        : '$A');
			url += tableRef +  '/' + 'cnt:=cnt(' + encodeSafeURIComponent(col) + ')';
			var param = {};
			param['options'] = options;
			param['table'] = table;
			param['col'] = col;
			param['alert'] = alertObject;
			param['successCallback'] = successCallback;
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateCount, errorErmrest, param);
		});
	});
}

function successUpdateCount(data, textStatus, jqXHR, param) {
	var options = param['options'];
	var table = param['table'];
	if (table == null) {
		table = param['options']['table'];
	}
	var box = param['options']['box'][table];
	var col = param['col'];
	box[col]['ready'] = true;
	box[col]['count'] = col + ' (' + data[0]['cnt'] + ')';
	box[col]['facetcount'] = data[0]['cnt'];
	var ready = true;
	var tables = [options['table']].concat(association_tables_names);
	$.each(tables, function(i, table) {
		var box = param['options']['box'][table];
		$.each(box, function(col, value) {
			if (!value['ready']) {
				ready = false;
				return false;
			}
		});
		if (!ready) {
			return false;
		}
	});
	if (ready) {
		$.each(tables, function(i, table) {
			var box = param['options']['box'][table];
			$.each(box, function(key, value) {
				delete value['ready'];
			});
		});
		param['successCallback']();
	}
}

function updateGroups(options, successCallback) {
	var tables = [options['table']].concat(association_tables_names);
	var alertObject = {'display': true};
	$.each(tables, function(i, table) {
		$.each(options['colsGroup'][table], function(col, values) {
                        var aliases = [];
			var predicate = getPredicate(options, col, table, null, aliases);
                        var aliasDef = '';
                        if (association_tables_names.contains(table)) {
                            if (!aliases.contains(association_tables[table]['alias'])) {
                                aliasDef = '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(table) + '/';
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
		});
	});
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
			values.push(key);
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
		var colsGroup = param['options']['colsGroup'][table];
		$.each(colsGroup, function(key, value) {
			if (!value['ready']) {
				ready = false;
				return false;
			}
		});
		if (!ready) {
			return false;
		}
	});
	if (ready) {
		$.each(tables, function(i, table) {
			var colsGroup = param['options']['colsGroup'][table];
			$.each(colsGroup, function(key, value) {
				delete value['ready'];
			});
		});
		param['successCallback']();
	}
}

function updateSliders(options, successCallback) {
	var tables = [options['table']].concat(association_tables_names);
	var alertObject = {'display': true};
	$.each(tables, function(i, table) {
		$.each(options['box'][table], function(col, values) {
			if (values['floor'] != null) {
                                var aliases = [];
				var predicate = getPredicate(options, values['left'] || values['right'] ? null : col, table, null, aliases);
                                var aliasDef = '';
                                if (association_tables_names.contains(table)) {
                                    if (!aliases.contains(association_tables[table]['alias'])) {
                                        aliasDef = '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(table) + '/';
                                    }
                                }
                                var tableRef = (association_tables_names.contains(table) 
                                                ? aliasDef + '$A/$' + association_tables[table]['alias']
                                                : '$A');
				var param = {};
				param['alert'] = alertObject;
				param['successCallback'] = successCallback;
				param['options'] = options;
				param['col'] = col;
				param['table'] = table;
				var url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options) + '/';
				if (predicate != null && predicate.length > 0) {
					url += predicate.join('/') + '/';
				}
				url += tableRef +  '/' + 'min:=min(' + encodeSafeURIComponent(col) + '),max:=max(' + encodeSafeURIComponent(col) + ')';
				ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateSliders, errorErmrest, param);
			}
		});
	});
}

function successUpdateSliders(data, textStatus, jqXHR, param) {
	var options = param['options'];
	var table = param['table'];
	var col = param['col'];
	var box = param['options']['box'][table];
	box[col]['ready'] = true;
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
	var ready = true;
	var tables = [options['table']].concat(association_tables_names);
	$.each(tables, function(i, table) {
		var box = param['options']['box'][table];
		$.each(box, function(key, value) {
			if (value['floor'] != null && !value['ready']) {
				ready = false;
				return false;
			}
		});
		if (!ready) {
			return false;
		}
	});
	if (ready) {
		$.each(tables, function(i, table) {
			var box = param['options']['box'][table];
			$.each(box, function(key, value) {
				if (value['floor'] != null) {
					delete value['ready'];
				}
			});
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
			if (col['type']['typename'] != 'json') {
				var col_name = col['name'];
				var col_type = col['type']['typename'];
				var obj = {};
				obj['type'] = col_type;
				obj['ready'] = false;
				ret[col_name] = obj;
			}
		});
		var alertObject = {'display': true};
		$.each(ret, function(col, obj) {
			if (psqlText.contains(obj['type'])) {
				var url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options) + '/$A/cnt_d:=cnt_d(' + encodeSafeURIComponent(col) + ')';
				var param = {};
				param['options'] = options;
				param['alert'] = alertObject;
				param['successCallback'] = successCallback;
				param['entity'] = ret;
				param['col'] = col;
				ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, errorErmrest, param);
			} else if (psqlNumeric.contains(obj['type'])) {
				var param = {};
				param['options'] = options;
				param['alert'] = alertObject;
				var col_name = encodeSafeURIComponent(col);
				param['successCallback'] = successCallback;
				param['entity'] = ret;
				param['col'] = col;
				var url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options) + '/$A/min:=min(' + encodeSafeURIComponent(col) + '),max:=max(' + encodeSafeURIComponent(col) + ')';
				ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, errorErmrest, param);
			} else {
				alert('Type not found: '+obj['type'])
			}
		});
	} else {
		successCallback({}, null, null);
	}
}

function successGetColumnDescriptions(data, textStatus, jqXHR, param) {
	var col = param['col'];
	var entity = param['entity'];
	var options = param['options'];
	var alertObject = param['alert'];
	var successCallback = param['successCallback'];
	if (psqlText.contains(entity[col]['type'])) {
		if (data[0]['cnt_d'] <= MULTI_SELECT_LIMIT && !textColumns.contains(col)) {
			var url = ERMREST_DATA_HOME + '/attributegroup/' + getQueryPredicate(param['options']) + '/$A/' + encodeSafeURIComponent(col) + '@sort(' + encodeSafeURIComponent(col) + ')?limit=none';
			var param = {};
			param['successCallback'] = successCallback;
			entity[col]['type'] = 'enum';
			param['entity'] = entity;
			param['col'] = col;
			param['options'] = options;
			param['alert'] = alertObject;
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, errorErmrest, param);
		} else if (data[0]['cnt_d'] == MULTI_SELECT_LIMIT) {
			var url = ERMREST_DATA_HOME + '/attributegroup/' + getQueryPredicate(param['options']) + '/$A/' + encodeSafeURIComponent(col) + '@sort(' + encodeSafeURIComponent(col) + ')?limit=none';
			var param = {};
			param['successCallback'] = successCallback;
			entity[col]['type'] = 'select';
			param['entity'] = entity;
			param['col'] = col;
			param['options'] = options;
			param['alert'] = alertObject;
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, errorErmrest, param);
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
	} else if (psqlNumeric.contains(entity[col]['type'])) {
		entity[col]['ready'] = true;
		entity[col]['min'] = data[0]['min'];
		entity[col]['max'] = data[0]['max'];
	}
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

function getPage(options, totalItems, successCallback) {
	var page = options['pagingOptions']['currentPage'];
	var pageSize = options['pagingOptions']['pageSize'];
	var sortOption = options['sortOption'];
	if (!$.isNumeric(page) || Math.floor(page) != page || page <= 0) {
		successCallback([], totalItems, page, pageSize);
	} else {
		var url = ERMREST_DATA_HOME + '/attribute/' + getQueryPredicate(options);
		var predicate = getPredicate(options, null, null, null, null);
		if (predicate.length > 0) {
			url += '/' + predicate.join('/');
		}
		url += '/$A'
		if (sortOption != null) {
			url += '/' + getSortQuery(sortOption, true);
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

function successGetPagePredicate(data, textStatus, jqXHR, param) {
	var page = param['options']['pagingOptions']['currentPage'];
	var pageSize = param['options']['pagingOptions']['pageSize'];
	var sortOption = param['options']['sortOption'];
	if (data.length < (page-1)*pageSize + 1) {
		param['successCallback']([], param['totalItems']);
	} else {
		var predicate = param['predicate'];
		if (sortOption != null) {
			var col = sortOption['fields'][0];
			var direction = sortOption['directions'][0];
			var sortPredicate = [];
			sortPredicate.push(encodeSafeURIComponent(col) + '::null::');
			if (data[(page-1)*pageSize][col] != null) {
				sortPredicate.push(encodeSafeURIComponent(col) + (direction=='asc' ? '::geq::' : '::leq::') + encodeSafeURIComponent(data[(page-1)*pageSize][col]));
			}
			predicate.push('$A/' + sortPredicate.join(';'));
			sortPredicate = [];
			$.each(PRIMARY_KEY, function(i, primaryCol) {
				sortPredicate.push(encodeSafeURIComponent(primaryCol) + '::geq::' + encodeSafeURIComponent(data[(page-1)*pageSize][primaryCol]));
			});
			if (data[(page-1)*pageSize][col] != null) {
				sortPredicate.push(encodeSafeURIComponent(col) + '::null::');
				sortPredicate.push(encodeSafeURIComponent(col) + (direction=='asc' ? '::gt::' : '::lt::') + encodeSafeURIComponent(data[(page-1)*pageSize][col]));
			}
			predicate.push('$A/' + sortPredicate.join(';'));
		} else {
			var primaryKeyPredicate = [];
			var firstKey = null;
			$.each(PRIMARY_KEY, function(i, col) {
				if (i==0) {
					firstKey = encodeSafeURIComponent(col) + '::gt::' + encodeSafeURIComponent(data[(page-1)*pageSize][col]);
				}
				primaryKeyPredicate.push(encodeSafeURIComponent(col) + (i==0 ? '=' : '::geq::') + encodeSafeURIComponent(data[(page-1)*pageSize][col]));
			});
			primaryKeyPredicate = [primaryKeyPredicate.join('&')];
			primaryKeyPredicate.push(firstKey);
			predicate.push('$A/' + primaryKeyPredicate.join(';'));
		}
		var url = ERMREST_DATA_HOME + '/entity/' + getQueryPredicate(param['options']);
		if (predicate.length > 0) {
			url += '/' + predicate.join('/');
		}
		url += '/$A';
		if (sortOption != null) {
			url += getSortQuery(sortOption, false);
		} else {
			url += '@sort(' + PRIMARY_KEY.join(',') + ')';
		}
		url += '?limit=' + pageSize;
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetPage, null, param);
	}
}

function successGetPage(data, textStatus, jqXHR, param) {
	param['successCallback'](data, param['totalItems'], param['options']['pagingOptions']['currentPage'], param['options']['pagingOptions']['pageSize']);
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
		if (metadata != null) {
			var column_definitions = metadata['column_definitions'];
			var url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options) + '/$A/';
			url += (table == options['table'] ? '' : '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(table) + '/$A/$' + association_tables[table]['alias'] + '/');
			var cnt = [];
			$.each(column_definitions, function(i, col) {
				cnt.push('cnt_'+encodeSafeURIComponent(col['name'])+':=cnt('+encodeSafeURIComponent(col['name'])+')');
			});
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
		}
	});
}

function successGetTableColumnsUniques(data, textStatus, jqXHR, param) {
	var table_name = param['table'];
	param['ready'][table_name] = true;
	var options = param['options'];
	var metadata = (table_name == options['table'] ? options['metadata'] : association_tables[table_name]['metadata']);
	var column_definitions = metadata['column_definitions'];
	var cols = {};
	$.each(column_definitions, function(i,col) {
		if (col['type']['typename'] != 'json') {
			cols[col['name']] = {};
			cols[col['name']]['cnt'] = data[0]['cnt_'+col['name']];
			cols[col['name']]['distinct'] = -1;
		}
	});
	param['cols_table'][table_name]	= cols;
	var ready = true;
	var tables = [options['table']].concat(association_tables_names);
	$.each(tables, function(i, table) {
		if (!param['ready'][table]) {
			ready = false;
			return false;
		}
	});
	
	if (ready) {
		var urlPrefix = ERMREST_DATA_HOME + '/attributegroup/' + getQueryPredicate(param['options']) + '/$A/';
		var alertObject = {'display': true};
		var tables = [options['table']].concat(association_tables_names);
		$.each(tables, function(i, table) {
			var metadata = (table == options['table'] ? options['metadata'] : association_tables[table]['metadata']);
			var column_definitions = metadata['column_definitions'];
			var tableURL = (table == options['table'] ? '' : '$A/' + association_tables[table]['alias'] + ':=' + encodeSafeURIComponent(table) + '/$A/$' + association_tables[table]['alias'] + '/');
			$.each(column_definitions, function(i,col) {
				if (col['type']['typename'] != 'json') {
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
			});
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
		var cols = param['cols'][table];
		$.each(cols, function(key, value) {
			if (value['distinct'] == -1) {
				ready = false;
				return false;
			}
		});
		if (!ready) {
			return false;
		}
	});
	if (ready) {
		var cols = param['cols'][options['table']]
		var score = param['options']['score'];
		$.each(cols, function(key, value) {
			value['name'] = key;
			score.push(value);
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
	var val1 = uniquenessColumns.contains(item1['name']) ? 0 : item1['distinct'] / item1['cnt'];
	var val2 = uniquenessColumns.contains(item2['name']) ? 0 : item2['distinct'] / item2['cnt'];
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

function setFacetClass(options, facet, facetClass) {
	var cssClass = '';
	var colsDescr = options['colsDescr'][facet['table']];
	var value = options['box'][facet['table']][facet['name']];
	if (psqlText.contains(colsDescr[facet['name']]['type'])) {
		if (value) {
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
	} else if (psqlNumeric.contains(colsDescr[facet['name']]['type'])) {
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
	var url = '/ermrest/authn/session';
	ERMREST.DELETE(url, successDeleteSession, null, param);
}

function successDeleteSession(data, textStatus, jqXHR, param) {
	getSession(param);
}

function getSession(param) {
	var url = '/ermrest/authn/session';
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetSession, errorGetSession, param);
}

function successGetSession(data, textStatus, jqXHR, param) {
	//alert(JSON.stringify(data, null, 4));
	if (data['client'] != null) {
		$('#login_user').html(data['client']);
		$('#login_link').hide();
		$('#logout_link').show();
	} else {
		$('#login_user').html('');
		$('#login_link').show();
		$('#logout_link').hide();
		if (param != null) {
			window.location.href = param;
		}
	}
}

function errorGetSession(jqXHR, textStatus, errorThrown, url) {
	if (jqXHR.status == 401 || jqXHR.status == 404) {
		// Unauthorized or Not Found
		$('#login_user').html('');
		$('#login_link').show();
		$('#logout_link').hide();
	} else {
		handleError(jqXHR, textStatus, errorThrown, url);
	}
}

function getGoauth(referrer) {
	//var url = '/service/goauth/ermrest/authn/preauth';
	var url = '/ermrest/authn/preauth?referrer='+referrer;
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetGoauth, null, null);
}

function successGetGoauth(data, textStatus, jqXHR) {
	var url = data['redirect_url'];
	window.open(url, '_self');
	//globusWindow = window.open(url, '_self');
	//checkGlobusWindow();
}

function checkGlobusWindow() {
	if (globusWindow.closed) {
		var url = '#/retrieve';
		if (CATALOG != null) {
			url += '?catalog=' + CATALOG;
		}
		if (SCHEMA != null) {
			if (url == '#/login') {
				url += '?';
			} else {
				url += '&';
			}
			url += 'schema=' + SCHEMA;
		}
		globusWindow = null;
		window.location = url;
	} else {
		setTimeout(checkGlobusWindow, 1);
	}
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
			var exclude = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null && 
			(table['annotations'][TABLES_LIST_URI].contains('exclude') || table['annotations'][TABLES_LIST_URI].contains('association'));
			if (!exclude) {
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
			addTreeReference(key, subNodes, level+1, node, rootNode, schema);
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
			var keyUrl = url + '/' + key;
			getDenormalizedValues(key, keyUrl, result);
			result[key] = ERMREST.fetch(keyUrl, 'application/x-www-form-urlencoded; charset=UTF-8', false, true, [], null, null, null);
			$.each(result[key], function(i, row) {
				$.each(row, function(name, value) {
					if (value == null || value === '' || hasAnnotation(key, name, 'hidden')) {
						delete result[key][i][name];
					}
				});
			});
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
			ret[ret.length-1] = 'A:=' + encodeSafeURIComponent(ret[ret.length-1]);
			ret = ret.join('/');
		}
	} else {
		ret = 'A:=' + encodeSafeURIComponent(SCHEMA) + ':' + encodeSafeURIComponent(options['table']);
	}
	
	if (table != null) {
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
	var predicates = entityPredicates.slice();
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

function selectCollection() {
	var clicked = false;
	$.each($('label', $('#treeDiv')), function(i, label) {
		//if ($('span', $(label)).html().replace(/^\s*/, "").replace(/\s*$/, "") == getTableDisplayName(DEFAULT_TABLE)) {
		if ($(label).html().replace(/^\s*/, "").replace(/\s*$/, "") == getTableDisplayName(DEFAULT_TABLE)) {
			$(label).click();
			clicked = true;
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
	if (association_tables_names.length > 0) {
		//getAssociationColumnsDescriptions(options, successCallback, columns);
		var facets = columns['facets'];
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
		successCallback(columns);
	} else {
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
	$.each(association_tables, function(table_name, value) {
		var metadata = association_tables[table_name]['metadata'];
		if (metadata != null) {
			var column_definitions = metadata['column_definitions'];
			ret[table_name] = {};
			$.each(column_definitions, function(i, col) {
				if (col['type']['typename'] != 'json' && getAssociationColumn(table_name, col['name']) != null) {
					var col_name = col['name'];
					var col_type = col['type']['typename'];
					var obj = {};
					obj['type'] = col_type;
					obj['ready'] = false;
					ret[table_name][col_name] = obj;
				}
			});
		}
	});
	$.each(ret, function(table, value) {
		$.each(value, function(col, obj) {
			if (psqlText.contains(obj['type'])) {
				var url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options, table) + '/cnt_d:=cnt_d(' + encodeSafeURIComponent(col) + ')';
				var param = {};
				param['options'] = options;
				param['alert'] = alertObject;
				param['successCallback'] = successCallback;
				param['entity'] = ret;
				param['col'] = col;
				param['table'] = table;
				ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetAssociationColumnsDescriptions, errorErmrest, param);
			} else if (psqlNumeric.contains(obj['type'])) {
				var param = {};
				param['options'] = options;
				param['alert'] = alertObject;
				param['successCallback'] = successCallback;
				param['entity'] = ret;
				param['col'] = col;
				param['table'] = table;
				var url = ERMREST_DATA_HOME + '/aggregate/' + getQueryPredicate(options, table) + '/min:=min(' + encodeSafeURIComponent(col) + '),max:=max(' + encodeSafeURIComponent(col) + ')';
				ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetAssociationColumnsDescriptions, errorErmrest, param);
			} else {
				alert('Type for association column was not found: '+obj['type'])
			}
		});
	});
}

function successGetAssociationColumnsDescriptions(data, textStatus, jqXHR, param) {
	var col = param['col'];
	var table = param['table'];
	var entities = param['entity'];
	var entity = entities[table];
	var options = param['options'];
	var alertObject = param['alert'];
	var successCallback = param['successCallback'];
	if (psqlText.contains(entity[col]['type'])) {
		if (data[0]['cnt_d'] <= MULTI_SELECT_LIMIT && !isTextColumn(table, col)) {
			var url = ERMREST_DATA_HOME + '/attributegroup/' + getQueryPredicate(param['options'], table) + '/' + encodeSafeURIComponent(col) + '@sort(' + encodeSafeURIComponent(col) + ')?limit=none';
			var param = {};
			param['successCallback'] = successCallback;
			entity[col]['type'] = 'enum';
			param['entity'] = entities;
			param['col'] = col;
			param['options'] = options;
			param['alert'] = alertObject;
			param['table'] = table;
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetAssociationColumnsDescriptions, errorErmrest, param);
		} else if (data[0]['cnt_d'] == MULTI_SELECT_LIMIT) {
			var url = ERMREST_DATA_HOME + '/attributegroup/' + getQueryPredicate(param['options'], table) + '/' + encodeSafeURIComponent(col) + '@sort(' + encodeSafeURIComponent(col) + ')?limit=none';
			var param = {};
			param['successCallback'] = successCallback;
			entity[col]['type'] = 'select';
			param['entity'] = entities;
			param['col'] = col;
			param['options'] = options;
			param['alert'] = alertObject;
			param['table'] = table;
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetAssociationColumnsDescriptions, errorErmrest, param);
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
	} else if (psqlNumeric.contains(entity[col]['type'])) {
		entity[col]['ready'] = true;
		entity[col]['min'] = data[0]['min'];
		entity[col]['max'] = data[0]['max'];
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
		ret = data.length == 0 ? null : data[0][thumbnail];
	}
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
			if (data.length == 1) {
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
			if (data.length == 1) {
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
			if (data.length == 1) {
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
			if (data.length == 1) {
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
    $.each(schema, function(i, table) {
        if (table_name == table['table_name']) {
            if (table['annotations'][TABLES_MAP_URI] != null && table['annotations'][TABLES_MAP_URI]['display'] != null) {
                ret = table['annotations'][TABLES_MAP_URI]['display'];
            }
            return false;
        }
    });
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
	CATALOG_SCHEMAS = ERMREST.fetch(url, 'application/x-www-form-urlencoded; charset=UTF-8', false, true, [], null, null, null)['schemas'];
	var excludeSchemas = [];
	$.each(CATALOG_SCHEMAS, function(schema, value) {
		var tables = value['tables'];
		var exclude = true;
		$.each(tables, function(table, tableDef) {
			if (tableDef['annotations'] == null || tableDef['annotations'][TABLES_LIST_URI] == null ||
					!tableDef['annotations'][TABLES_LIST_URI].contains('exclude')) {
				exclude = false;
				return false;
			}
		});
		if (exclude) {
			excludeSchemas.push(schema);
		}
	});
	$.each(excludeSchemas, function(i, schema) {
		delete CATALOG_SCHEMAS[schema];
	});
	setSchema();
	setCatalogTables();
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
}

