var AJAX_TIMEOUT = 300000;
var goauth_cookie = 'globusonline-goauth';
var token = null;
var SCHEMA = null;
var ERMREST_FACEBASE_SCHEMA = '/ermrest/catalog/1/schema/';
var ERMREST_FACEBASE_DATA = '/ermrest/catalog/1';
var ERMREST_SCHEMA_HOME = null;
var ERMREST_DATA_HOME = null;
var URL_ESCAPE = new String("~!()'");

var PRIMARY_KEY = [];
var uniquenessColumns = [];
var textColumns = [];
var display_columns = {};
var back_references = {};

var psqlNumeric = [ 'bigint', 'double precision', 'integer', 'numeric', 'real',
		'smallint' ];

var psqlText = [ 'date', 'time without time zone', 'time with time zone', 'timestamp without time zone', 'timestamp with time zone',
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
	ERMREST_SCHEMA_HOME = HOME + ERMREST_FACEBASE_SCHEMA + SCHEMA + '/table/';
	ERMREST_DATA_HOME = HOME + ERMREST_FACEBASE_DATA;

	//alert(JSON.stringify(DATASET_COLUMNS, null, 4));
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
	var url = ERMREST_SCHEMA_HOME + encodeSafeURIComponent(table);
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successCallback, null, null);
}

function getTableColumns(options) {
	setTreeReferences(options['tree'], options['table']);
	var metadata = options['metadata'];
	var sortInfo = options['sortInfo'];
	uniquenessColumns = [];
	textColumns = [];
	unsortableColumns = [];
	display_columns = {'text_columns': [], 'file': []};
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
			if (col['annotations'] != null && col['annotations']['comment'] != null) {
				//var comments = $.parseJSON(col['comment']);
				var comments = col['annotations']['comment'];
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
				if (comments.contains('thumbnail')) {
					display_columns['thumbnail'] = col['name'];
				}
				if (comments.contains('zoomify')) {
					display_columns['zoomify'] = col['name'];
				}
				if (comments.contains('html')) {
					display_columns['text_columns'].push(col['name']);
				}
				if (comments.contains('file')) {
					display_columns['file'].push(col['name']);
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
			col_def['minWidth'] = col_def['width'] = (l > 50 ? l : 50);
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
			ret.push(col['name']);
			sortInfo['fields'].push(col['name']);
			sortInfo['directions'].push('desc');
		});
	}
	return {'facets': ret,
		'sortInfo': sortInfo,
		'colsDefs': columns_definitions};
}

function getPredicate(options, excludeColumn) {
	var colsDescr = options['colsDescr'];
	var filterAllText = options['filterAllText'];
	var predicate = [];
	$.each(options['box'], function(key, value) {
		if (key == excludeColumn) {
			return true;
		}
		if (psqlText.contains(colsDescr[key]['type'])) {
			value = value['value'].split(' ');
			$.each(value, function(i, val) {
				if (val.length > 0) {
					predicate.push(encodeSafeURIComponent(key) + '::regexp::' + encodeSafeURIComponent(val));
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
				predicate.push(checkValues);
			}
		} else if (colsDescr[key]['type'] == 'select') {
			var selectedValues = [];
			$.each(value['value'], function(i, selectedValue) {
				selectedValues.push(encodeSafeURIComponent(key) + '=' + encodeSafeURIComponent(selectedValue));
			});
			selectedValues = selectedValues.join(';');
			if (selectedValues.length > 0) {
				predicate.push(selectedValues);
			}
		} else if (psqlNumeric.contains(colsDescr[key]['type'])) {
			if (value['left']) {
				predicate.push(encodeSafeURIComponent(key) + '::geq::' + encodeSafeURIComponent(value['min']));
			}
			if (value['right']) {
				predicate.push(encodeSafeURIComponent(key) + '::leq::' + encodeSafeURIComponent(value['max']));
			}
		}
	});
	if (filterAllText && filterAllText != '') {
		predicate.push(encodeSafeURIComponent('*') + '::ts::' + encodeSafeURIComponent(getSearchExpression(filterAllText, '&')));
	}
	return predicate;
}

function getErmrestData(options, successCallback, successUpdateModels) {
	updateCount(options, successUpdateModels);
	var url = ERMREST_DATA_HOME + '/aggregate/' + encodeSafeURIComponent(options['table']);
	var predicate = getPredicate(options, null);
	if (predicate.length > 0) {
		url += '/' + predicate.join('/');
	}
	updateGroups(options, successUpdateModels);
	updateSliders(options, successUpdateModels);
	url += '/cnt:=cnt(' +  encodeSafeURIComponent(options['colsDefs'][0]['field']) + ')';
	var param = {};
	param['options'] = options;
	param['successCallback'] = successCallback;
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successTotalCount, null, param);
}

function successTotalCount(data, textStatus, jqXHR, param) {
	getPage(param['options'], data[0]['cnt'], param['successCallback'])
}

function initModels(options, successCallback) {
	var box = options['box'];
	var colsDescr = options['colsDescr'];
	var colsGroup = options['colsGroup'];
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
		options['chooseColumns'][col] = topN.contains(col);
		options['facetClass'][col] = '';
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
	if (!sentRequests) {
		successCallback();
	} else {
		updateGroups(options, successCallback);
		updateSliders(options, successCallback);
	}
}

function updateCount(options, successCallback) {
	var box = options['box'];
	var urlPrefix = ERMREST_DATA_HOME + '/aggregate/' + encodeSafeURIComponent(options['table']) + '/';
	$.each(box, function(col, value) {
		box[col]['ready'] = false;
	});
	var alertObject = {'display': true};
	$.each(box, function(col, value) {
		var predicate = getPredicate(options, col);
		var url = urlPrefix;
		if (predicate != null && predicate.length > 0) {
			url += predicate.join('/') + '/' ;
		}
		url += 'cnt:=cnt(' + encodeSafeURIComponent(col) + ')';
		var param = {};
		param['options'] = options;
		param['col'] = col;
		param['alert'] = alertObject;
		param['successCallback'] = successCallback;
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateCount, errorErmrest, param);
	});
}

function successUpdateCount(data, textStatus, jqXHR, param) {
	var box = param['options']['box'];
	var col = param['col'];
	box[col]['ready'] = true;
	box[col]['count'] = col + ' (' + data[0]['cnt'] + ')';
	box[col]['facetcount'] = data[0]['cnt'];
	var ready = true;
	$.each(box, function(col, value) {
		if (!value['ready']) {
			ready = false;
			return false;
		}
	});
	if (ready) {
		$.each(box, function(key, value) {
			delete value['ready'];
		});
		param['successCallback']();
	}
}

function updateGroups(options, successCallback) {
	var alertObject = {'display': true};
	$.each(options['colsGroup'], function(col, values) {
		var predicate = getPredicate(options, col);
		var param = {};
		param['alert'] = alertObject;
		var col_name = encodeSafeURIComponent(col);
		param['successCallback'] = successCallback;
		param['options'] = options;
		param['col'] = col;
		var url = ERMREST_DATA_HOME + '/attributegroup/' + encodeSafeURIComponent(options['table']) + '/';
		if (predicate != null && predicate.length > 0) {
			url += predicate.join('/') + '/';
		}
		url += col_name + ';cnt:=cnt(' + col_name + ')';
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateGroups, errorErmrest, param);
	});
}

function successUpdateGroups(data, textStatus, jqXHR, param) {
	var values = [];
	var hideValues = [];
	var colsGroup = param['options']['colsGroup'];
	var col = param['col'];
	var box = param['options']['box'];
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
	$.each(colsGroup, function(key, value) {
		if (!value['ready']) {
			ready = false;
			return false;
		}
	});
	if (ready) {
		$.each(colsGroup, function(key, value) {
			delete value['ready'];
		});
		param['successCallback']();
	}

}

function updateSliders(options, successCallback) {
	var alertObject = {'display': true};
	$.each(options['box'], function(col, values) {
		if (values['floor'] != null) {
			var predicate = getPredicate(options, values['left'] || values['right'] ? null : col);
			var param = {};
			param['alert'] = alertObject;
			param['successCallback'] = successCallback;
			param['options'] = options;
			param['col'] = col;
			var url = ERMREST_DATA_HOME + '/aggregate/' + encodeSafeURIComponent(options['table']) + '/';
			if (predicate != null && predicate.length > 0) {
				url += predicate.join('/') + '/';
			}
			url += 'min:=min(' + encodeSafeURIComponent(col) + '),max:=max(' + encodeSafeURIComponent(col) + ')';
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateSliders, errorErmrest, param);
		}
	});
}

function successUpdateSliders(data, textStatus, jqXHR, param) {
	var col = param['col'];
	var box = param['options']['box'];
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
	$.each(box, function(key, value) {
		if (value['floor'] != null && !value['ready']) {
			ready = false;
			return false;
		}
	});
	if (ready) {
		$.each(box, function(key, value) {
			if (value['floor'] != null) {
				delete value['ready'];
			}
		});
		param['successCallback']();
	}

}

function expandSlider(narrow, colsDescr) {
	$.each(colsDescr, function(col, value) {
		if (psqlNumeric.contains(value['type'])) {
			//narrow[col] = true;
		}
	});
}

function getColumnDescriptions(options, successCallback) {
	var ret = {};
	var metadata = options['metadata'];
	if (metadata != null) {
		var column_definitions = metadata['column_definitions'];
		$.each(column_definitions, function(i, col) {
			var col_name = col['name'];
			var col_type = col['type'];
			var obj = {};
			obj['type'] = col_type;
			obj['ready'] = false;
			ret[col_name] = obj;
		});
		var alertObject = {'display': true};
		$.each(ret, function(col, obj) {
			if (psqlText.contains(obj['type'])) {
				var url = ERMREST_DATA_HOME + '/aggregate/' + encodeSafeURIComponent(metadata['table_name']) + '/cnt_d:=cnt_d(' + encodeSafeURIComponent(col) + ')';
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
				var url = ERMREST_DATA_HOME + '/aggregate/' + encodeSafeURIComponent(metadata['table_name']) + '/min:=min(' + encodeSafeURIComponent(col) + '),max:=max(' + encodeSafeURIComponent(col) + ')';
				ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, errorErmrest, param);
			}
		});
	} else {
		successCallback({}, null, null);
	}
}

function successGetColumnDescriptions(data, textStatus, jqXHR, param) {
	var col = param['col'];
	var entity = param['entity'];
	var table = param['options']['table'];
	var options = param['options'];
	var successCallback = param['successCallback'];
	if (psqlText.contains(entity[col]['type'])) {
		if (data[0]['cnt_d'] <= 50 && !textColumns.contains(col)) {
			var url = ERMREST_DATA_HOME + '/attributegroup/' + encodeSafeURIComponent(table) + '/' + encodeSafeURIComponent(col) + '@sort(' + encodeSafeURIComponent(col) + ')?limit=none';
			var param = {};
			param['successCallback'] = successCallback;
			entity[col]['type'] = 'enum';
			param['entity'] = entity;
			param['col'] = col;
			param['options'] = options;
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, null, param);
		} else if (data[0]['cnt_d'] == 50) {
			var url = ERMREST_DATA_HOME + '/attributegroup/' + encodeSafeURIComponent(table) + '/' + encodeSafeURIComponent(col) + '@sort(' + encodeSafeURIComponent(col) + ')?limit=none';
			var param = {};
			param['successCallback'] = successCallback;
			entity[col]['type'] = 'select';
			param['entity'] = entity;
			param['col'] = col;
			param['options'] = options;
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, null, param);
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
		param['successCallback'](entity, null, null);
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
		var url = ERMREST_DATA_HOME + '/attribute/' + encodeSafeURIComponent(options['table']);
		var predicate = getPredicate(options, null);
		if (predicate.length > 0) {
			url += '/' + predicate.join('/');
		}
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
			predicate.push(sortPredicate.join(';'));
			sortPredicate = [];
			$.each(PRIMARY_KEY, function(i, primaryCol) {
				sortPredicate.push(encodeSafeURIComponent(primaryCol) + '::geq::' + encodeSafeURIComponent(data[(page-1)*pageSize][primaryCol]));
			});
			if (data[(page-1)*pageSize][col] != null) {
				sortPredicate.push(encodeSafeURIComponent(col) + '::null::');
				sortPredicate.push(encodeSafeURIComponent(col) + (direction=='asc' ? '::gt::' : '::lt::') + encodeSafeURIComponent(data[(page-1)*pageSize][col]));
			}
			predicate.push(sortPredicate.join(';'));
		} else {
			$.each(PRIMARY_KEY, function(i, col) {
				predicate.push(encodeSafeURIComponent(col) + '::geq::' + encodeSafeURIComponent(data[(page-1)*pageSize][col]));
			});
		}
		var url = ERMREST_DATA_HOME + '/entity/' + encodeSafeURIComponent(param['options']['table']);
		if (predicate.length > 0) {
			url += '/' + predicate.join('/');
		}
		if (sortOption != null) {
			url += getSortQuery(sortOption, false);
		}
		url += '?limit=' + pageSize;
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetPage, null, param);
	}
}

function successGetPage(data, textStatus, jqXHR, param) {
	param['successCallback'](data, param['totalItems'], param['options']['pagingOptions']['currentPage'], param['options']['pagingOptions']['pageSize']);
}

function getColumnDisplay(col, colsGroup) {
	var suffix = '';
	if (colsGroup[col] != null) {
		var count = 0;
		$.each(colsGroup[col], function(key, value) {
			if (key != 'ready' && value > 0) {
				count++;
			}
		});
		suffix += ' (' + count + ')';
	}
	return col + suffix;
}


function getValueDisplay(col, value, colsGroup) {
	var ret = value + ' (' + colsGroup[col][value] + ')';
	return ret;
}

function getTables(tables, successCallback) {
	var url = ERMREST_SCHEMA_HOME;
	var param = {};
	param['successCallback'] = successCallback;
	param['tables'] = tables;
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetTables, null, param);
}

function successGetTables(data, textStatus, jqXHR, param) {
	var tables = param['tables'];
	$.each(data, function(i, table) {
		if (table['annotations'] == null || table['annotations']['comment'] == null || 
				!table['annotations']['comment'].contains('exclude')) {
			tables.push(table['table_name']);
		}
	});
	setTablesBackReferences(tables, data);
	initApplicationHeader(tables);
	param['successCallback']();
}

function getTableColumnsUniques(options, successCallback) {
	var columns_definitions = [];
	var metadata = options['metadata'];
	if (metadata != null) {
		var column_definitions = metadata['column_definitions'];
		var url = ERMREST_DATA_HOME + '/aggregate/' + encodeSafeURIComponent(metadata['table_name']) + '/';
		var cnt = [];
		$.each(column_definitions, function(i, col) {
			cnt.push('cnt_'+encodeSafeURIComponent(col['name'])+':=cnt('+encodeSafeURIComponent(col['name'])+')');
		});
		var predicate = cnt.join(',');
		url += predicate;
		param = {};
		param['options'] = options;
		param['successCallback'] = successCallback;
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetTableColumnsUniques, null, param);
	}
}

function successGetTableColumnsUniques(data, textStatus, jqXHR, param) {
	var metadata = param['options']['metadata'];
	var column_definitions = metadata['column_definitions'];
	var cols = {};
	$.each(column_definitions, function(i,col) {
		cols[col['name']] = {};
		cols[col['name']]['cnt'] = data[0]['cnt_'+col['name']];
		cols[col['name']]['distinct'] = -1;
	});
	var urlPrefix = ERMREST_DATA_HOME + '/attributegroup/' + encodeSafeURIComponent(metadata['table_name']) + '/';
	var alertObject = {'display': true};
	$.each(column_definitions, function(i,col) {
		var params = {};
		params['alert'] = alertObject;
		params['options'] = param['options'];
		params['successCallback'] = param['successCallback'];
		params['cols'] = cols;
		params['col'] = col['name'];
		var url = urlPrefix + encodeSafeURIComponent(col['name']) + ';cnt:=cnt(' + encodeSafeURIComponent(col['name']) + ')';
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetTableColumnsDistinct, errorErmrest, params);
	});
}

function successGetTableColumnsDistinct(data, textStatus, jqXHR, param) {
	var col = param['col'];
	var cols = param['cols'];
	var score = param['options']['score'];
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
	$.each(cols, function(key, value) {
		if (value['distinct'] == -1) {
			ready = false;
			return false;
		}
	});
	if (ready) {
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

function setFacetClass(options, facet, facetClass) {
	var cssClass = '';
	var colsDescr = options['colsDescr'];
	var value = options['box'][facet];
	if (psqlText.contains(colsDescr[facet]['type'])) {
		if (value) {
			cssClass = 'selectedFacet';
		}
	} else if (colsDescr[facet]['type'] == 'enum') {
		var checkValues = [];
		$.each(value['values'], function(checkbox_key, checkbox_value) {
			if (checkbox_value) {
				cssClass = 'selectedFacet';
				return false;
			}
		});
	} else if (colsDescr[facet]['type'] == 'select') {
		if (value['value'].length > 0) {
			cssClass = 'selectedFacet';
		}
	} else if (psqlNumeric.contains(colsDescr[facet]['type'])) {
		if (value['left'] || value['right']) {
			cssClass = 'selectedFacet';
		}
	}
	facetClass[facet] = cssClass;
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

function hasCheckedValues(box, facet) {
	var ret = false;
	if (box[facet]['values'] != null) {
		$.each(box[facet]['values'], function(i, value) {
			if (value) {
				ret = true;
				return false;
			}
		});
	}
	return ret;
}

function setTablesBackReferences(tables, data) {
	back_references = {};
	$.each(data, function(i, table) {
		$.each(table['foreign_keys'], function(j, fk) {
			$.each(fk['referenced_columns'], function(k, ref_column) {
				if (tables.contains(ref_column['table_name'])) {
					if (back_references[ref_column['table_name']] == null) {
						back_references[ref_column['table_name']] = [];
					}
					back_references[ref_column['table_name']].push(table['table_name']);
				}
			});
		});
	});
}

function setTreeReferences(tree, table) {
	tree.length = 0
	var nodes = [];
	tree.push({'name': table,
		'nodes': nodes});
	if (back_references[table] != null) {
		$.each(back_references[table], function(i, key) {
			addTreeReference(key, nodes);
		});
	}
}

function addTreeReference(table, nodes) {
	var subNodes = [];
	var node = {'name': table,
			'nodes': subNodes};
	nodes.push(node);
	if (back_references[table] != null) {
		$.each(back_references[table], function(i, key) {
			addTreeReference(key, subNodes);
		});
	}
}

