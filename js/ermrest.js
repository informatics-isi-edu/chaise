Array.prototype.contains = function (elem) {
	for (i in this) {
		if (this[i] == elem) return true;
	}
	return false;
};

var AJAX_TIMEOUT = 300000;
var goauth_cookie = 'globusonline-goauth';
var token = null;
var ERMREST_FACEBASE_SCHEMA = '/ermrest/catalog/1/schema/facebase/table/';
var ERMREST_FACEBASE_DATA = '/ermrest/catalog/1';
var ERMREST_SCHEMA_HOME = null;
var ERMREST_DATA_HOME = null;
var URL_ESCAPE = new String("~!()'");

var PRIMARY_KEY = [];
//var DATASET_NAME = 'dataset1';
var visibleColumns = [
	'id',
	'owner',
	'title',
	'organism',
	'gender',
	'genotype',
	'age_stages',
	'chromosome'
];

function initFacebase() {
	initLocation();
	//alert(HOME);
	ERMREST_SCHEMA_HOME = HOME + ERMREST_FACEBASE_SCHEMA;
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
		POST: function(url, contentType, async, processData, obj, successCallback, param) {
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
					handleError(jqXHR, textStatus, errorThrown, url);
				}
			});
			return res;
		},
		GET: function(url, contentType, successCallback, param) {
			return ERMREST.fetch(url, contentType, true, true, [], successCallback, param);
		},
		fetch: function(url, contentType, async, processData, obj, successCallback, param) {
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
					handleError(jqXHR, textStatus, errorThrown, url);
				}
			});
			return res;
		},
		DELETE: function(url) {
			return ERMREST.remove(url, true, successCallback, param);
		},
		remove: function(url, async, successCallback, param) {
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
					handleError(jqXHR, textStatus, errorThrown, url);
				}
			});
			return res;
		},
		PUT: function(url, contentType, async, processData, obj, successCallback, param) {
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
					handleError(jqXHR, textStatus, errorThrown, url);
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
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successCallback, null);
}

function getTableColumns(table, sortInfo) {
	PRIMARY_KEY = [];
	if (table['keys'] != null) {
		var unique_columns = [];
		$.each(table['keys'], function(i, key) {
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
	var data = table;
	var ret = [];
	if (data != null) {
		var column_definitions = data['column_definitions'];
		$.each(column_definitions, function(i, col) {
			var col_def = {};
			col_def['field'] = col['name'];
/*
			var b = $('<b>');
			b.html(col['name']);
			$('body').append(b);
			var l = b.width() + 10;
			col_def['minWidth'] = col_def['width'] = (l > 50 ? l : 50);
*/
			if (!visibleColumns.contains(col['name'])) {
				col_def['visible'] = false;
			}
			columns_definitions.push(col_def);
			//b.remove();
			ret.push(col['name']);
			sortInfo['fields'].push(col['name']);
			sortInfo['directions'].push('');
		});
	}
	return {'facets': ret,
		'sortInfo': sortInfo,
		'colsDefs': columns_definitions};
}

function getPredicate(values, colsDescr) {
	var predicate = [];
	$.each(values, function(key, value) {
		if (colsDescr[key]['type'] == 'text') {
			value = value['value'].split(' ');
			$.each(value, function(i, val) {
				if (val.length > 0) {
					predicate.push(encodeSafeURIComponent(key) + '::ts::' + encodeSafeURIComponent(val));
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
				//alert(selectedValue);
				selectedValues.push(encodeSafeURIComponent(key) + '=' + encodeSafeURIComponent(selectedValue));
			});
			selectedValues = selectedValues.join(';');
			if (selectedValues.length > 0) {
				predicate.push(selectedValues);
			}
		} else if (colsDescr[key]['type'] == 'bigint') {
			if (value['min'] != value['floor'] || value['max'] != value['ceil']) {
				predicate.push(encodeSafeURIComponent(key) + '::geq::' + encodeSafeURIComponent(value['min']));
				predicate.push(encodeSafeURIComponent(key) + '::leq::' + encodeSafeURIComponent(value['max']));
			}
		}
	});
	return predicate;
}

function getFacebaseData(table, facet, values, colsDefs, colsDescr, colsGroup, page, pageSize, sortOption, successCallback, successUpdateModels) {
	updateCount(values, colsDescr, table, successUpdateModels);
	var url = ERMREST_DATA_HOME + '/aggregate/' + encodeSafeURIComponent(table);
	var predicate = getPredicate(values, colsDescr);
	if (predicate.length > 0) {
		url += '/' + predicate.join('/');
		updateGroups(colsGroup, table, facet, predicate, successUpdateModels);
	} else {
		updateGroups(colsGroup, table, facet, null, successUpdateModels);
	}
	url += '/cnt:=cnt(' +  encodeSafeURIComponent(colsDefs[0]['field']) + ')';
	//url += '/cnt:=cnt(*)';
	var param = {};
	param['table'] = table;
	param['values'] = values;
	param['colsDescr'] = colsDescr;
	param['page'] = page;
	param['pageSize'] = pageSize;
	param['sortOption'] = sortOption;
	param['successCallback'] = successCallback;
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successTotalCount, param);
}

function successTotalCount(data, textStatus, jqXHR, param) {
	getPage(param['table'], param['values'], param['colsDescr'], param['pageSize'], param['page'], data[0]['cnt'], param['sortOption'], param['successCallback'])
}

function initModels(box, narrow, colsDescr, colsGroup, table, successCallback) {
	var sentRequests = false;
	$.each(colsDescr, function(col, value) {
		box[col] = {};
		box[col]['count'] = col;
		if (value['type'] == 'enum') {
			colsGroup[col] = {};
			colsGroup[col]['ready'] = false;
			box[col]['values'] = {};
			sentRequests = true;
			//narrow[col] = true;
		} else if (value['type'] == 'select') {
			//box[col]['value'] = value['values'][0];
			box[col]['value'] = [];
			//narrow[col] = true;
		} else if (value['type'] == 'text') {
			box[col]['value'] = '';
			//narrow[col] = true;
		} else if (value['type'] == 'bigint') {
			box[col]['min'] = box[col]['floor'] = value['min'];
			box[col]['max'] = box[col]['ceil'] = value['max'];
			//narrow[col] = true;
		}
	});
	if (!sentRequests) {
		successCallback();
	} else {
		updateGroups(colsGroup, table['table_name'], null, null, successCallback);
	}
}

function updateCount(box, colsDescr, table, successCallback) {
	var predicate = getPredicate(box, colsDescr);
//alert(predicate);
	var urlPrefix = ERMREST_DATA_HOME + '/aggregate/' + encodeSafeURIComponent(table) + '/';
	if (predicate != null && predicate.length > 0) {
		urlPrefix += predicate.join('/') + '/' ;
	}
	urlPrefix += 'cnt:=cnt(';
//alert(urlPrefix);
	$.each(box, function(col, value) {
		box[col]['ready'] = false;
	});
	$.each(box, function(col, value) {
		var url = urlPrefix + encodeSafeURIComponent(col) + ')';
		var param = {};
		param['box'] = box;
		param['col'] = col;
		param['successCallback'] = successCallback;
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateCount, param);
	});
}

function successUpdateCount(data, textStatus, jqXHR, param) {
	var box = param['box'];
	var col = param['col'];
	box[col]['ready'] = true;
	box[col]['count'] = col + ' (' + data[0]['cnt'] + ')';
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

function updateGroups(colsGroup, table, facet, predicate, successCallback) {
	$.each(colsGroup, function(col, values) {
		if (col == facet) {
			colsGroup[col]['ready'] = true;
		} else {
			var param = {};
			var col_name = encodeSafeURIComponent(col);
			param['successCallback'] = successCallback;
			param['colsGroup'] = colsGroup;
			param['col'] = col;
			param['facet'] = facet;
			param['table'] = table;
			var url = ERMREST_DATA_HOME + '/attributegroup/' + encodeSafeURIComponent(table);
			if (predicate != null) {
				url += '/' + predicate.join('/');
			}
			url += '/' + col_name + ';cnt:=cnt(' + col_name + ')';
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successUpdateGroups, param);
		}
	});
}

function successUpdateGroups(data, textStatus, jqXHR, param) {
	var values = [];
	var hideValues = [];
	var colsGroup = param['colsGroup'];
	var col = param['col'];
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

function expandSlider(narrow, colsDescr) {
	$.each(colsDescr, function(col, value) {
		if (value['type'] == 'bigint') {
			//narrow[col] = true;
		}
	});
}

function getColumnDescriptions(table, data, successCallback) {
	var ret = {};
	if (table != null) {
		var column_definitions = table['column_definitions'];
		$.each(column_definitions, function(i, col) {
			var col_name = col['name'];
			var col_type = col['type'];
			var obj = {};
			obj['type'] = col_type;
			obj['ready'] = false;
			ret[col_name] = obj;
		});
		$.each(ret, function(col, obj) {
			if (obj['type'] == 'text') {
				var url = ERMREST_DATA_HOME + '/aggregate/' + encodeSafeURIComponent(table['table_name']) + '/cnt_d:=cnt_d(' + encodeSafeURIComponent(col) + ')';
				var param = {};
				param['successCallback'] = successCallback;
				param['entity'] = ret;
				param['col'] = col;
				param['table'] = table;
				ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, param);
			} else if (obj['type'] == 'bigint') {
				var param = {};
				var col_name = encodeSafeURIComponent(col);
				param['successCallback'] = successCallback;
				param['entity'] = ret;
				param['col'] = col;
				param['table'] = table;
				var url = ERMREST_DATA_HOME + '/aggregate/' + encodeSafeURIComponent(table['table_name']) + '/min:=min(' + encodeSafeURIComponent(col) + '),max:=max(' + encodeSafeURIComponent(col) + ')';
				ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, param);
			}
		});
	} else {
		successCallback({}, null, null);
	}
}

function successGetColumnDescriptions(data, textStatus, jqXHR, param) {
	var col = param['col'];
	var entity = param['entity'];
	var table = param['table'];
	var successCallback = param['successCallback'];
	if (entity[col]['type'] == 'text') {
		if (data[0]['cnt_d'] <= 10) {
			var url = ERMREST_DATA_HOME + '/attributegroup/' + encodeSafeURIComponent(table['table_name']) + '/' + encodeSafeURIComponent(col) + '@sort(' + encodeSafeURIComponent(col) + ')?limit=none';
			var param = {};
			param['successCallback'] = successCallback;
			entity[col]['type'] = 'enum';
			param['entity'] = entity;
			param['col'] = col;
			param['table'] = table;
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, param);
		} else if (data[0]['cnt_d'] <= 25) {
			var url = ERMREST_DATA_HOME + '/attributegroup/' + encodeSafeURIComponent(table['table_name']) + '/' + encodeSafeURIComponent(col) + '@sort(' + encodeSafeURIComponent(col) + ')?limit=none';
			var param = {};
			param['successCallback'] = successCallback;
			entity[col]['type'] = 'select';
			param['entity'] = entity;
			param['col'] = col;
			param['table'] = table;
			ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetColumnDescriptions, param);
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
	} else if (entity[col]['type'] == 'bigint') {
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

function getPage(table, values, colsDescr, pageSize, page, totalItems, sortOption, successCallback) {
	if (!$.isNumeric(page) || Math.floor(page) != page || page <= 0) {
		successCallback([], totalItems, page, pageSize);
	} else {
		var url = ERMREST_DATA_HOME + '/attribute/' + encodeSafeURIComponent(table);
		var predicate = getPredicate(values, colsDescr);
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
		param['table'] = table;
		param['predicate'] = predicate;
		param['sortOption'] = sortOption;
		param['pageSize'] = pageSize;
		param['page'] = page;
		param['totalItems'] = totalItems;
		param['successCallback'] = successCallback;
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetPagePredicate, param);
	}
}

function successGetPagePredicate(data, textStatus, jqXHR, param) {
	var page = param['page'];
	var pageSize = param['pageSize'];
	var sortOption = param['sortOption'];
	if (data.length < (page-1)*pageSize + 1) {
		param['successCallback']([], param['totalItems']);
	} else {
		var predicate = param['predicate'];
		$.each(PRIMARY_KEY, function(i, col) {
			predicate.push(encodeSafeURIComponent(col) + '::geq::' + encodeSafeURIComponent(data[(page-1)*pageSize][col]));
		});
		if (sortOption != null) {
			var col = sortOption['fields'][0];
			var direction = sortOption['directions'][0];
			predicate.push(encodeSafeURIComponent(col) + (direction=='asc' ? '::geq::' : '::leq::') + encodeSafeURIComponent(data[(page-1)*pageSize][col]));
		}
		var url = ERMREST_DATA_HOME + '/entity/' + encodeSafeURIComponent(param['table']);
		if (predicate.length > 0) {
			url += '/' + predicate.join('/');
		}
		if (sortOption != null) {
			url += getSortQuery(sortOption, false);
		}
		url += '?limit=' + pageSize;
		ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetPage, param);
	}
}

function successGetPage(data, textStatus, jqXHR, param) {
	param['successCallback'](data, param['totalItems'], param['page'], param['pageSize']);
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
	ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successGetTables, param);
}

function successGetTables(data, textStatus, jqXHR, param) {
	var tables = param['tables'];
	$.each(data, function(i, table) {
		tables.push(table['table_name']);
	});
//alert('hi');
//alert(tables);
	param['successCallback']();
}



