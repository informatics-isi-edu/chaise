Array.prototype.contains = function (elem) {
	for (i in this) {
		if (this[i] == elem) return true;
	}
	return false;
};

Array.prototype.empty = function () {
	this.splice(0, this.length);
};

function emptyJSON(obj) {
	$.each(obj, function(key, value) {
		delete obj[key];
	});
}

function initLocation() {
	HOME = window.location.protocol + '//' + window.location.host;
}

function clearFacets(options) {
	//alert(JSON.stringify(metadata, null, 4));
	emptyJSON(options['narrow']);
	emptyJSON(options['box']);
	emptyJSON(options['metadata']);
	emptyJSON(options['colsDescr']);
	emptyJSON(options['colsGroup']);
	emptyJSON(options['chooseColumns']);
	emptyJSON(options['facetClass']);
	
	options['facets'].empty();
	options['ermrestData'].empty();
	options['colsDefs'].empty();
	options['score'].empty();
	
	var filterOptions = options['filterOptions'];
	$.each(filterOptions, function(key, value) {
		if (key == 'filterText') {
			filterOptions[key] = '';
		} else if (key == 'useExternalFilter') {
			filterOptions[key] = true;
		} else {
			delete filterOptions[key];
		}
	});
	
	var pagingOptions = options['pagingOptions'];
	$.each(pagingOptions, function(key, value) {
		if (key == 'pageSizes') {
			value.empty();
			value.push(25);
			value.push(50);
			value.push(100);
		} else if (key == 'pageSize') {
			pagingOptions[key] = 25;
		} else if (key == 'currentPage') {
			pagingOptions[key] = 1;
		} else {
			delete pagingOptions[key];
		}
	});
	
	var sortInfo = options['sortInfo'];
	$.each(sortInfo, function(key, value) {
		if (key == 'fields') {
			value.empty();
		} else if (key == 'directions') {
			value.empty();
		} else {
			delete sortInfo[key];
		}
	});
}

function htmlItem(row) {
	var table = $('<table>');
	var k = 0;
	var tr;
	$.each(display_columns['top_columns'], function(i, col) {
		if (row[col] == null || display_columns['title'] == col) {
			return true;
		}
		if (k%3 == 0) {
			tr = $('<tr>');
			table.append(tr);
		}
		var td = $('<td>');
		td.addClass('key truncate');
		if (k++==0) {
			td.addClass('sortby');
		}
		tr.append(td);
		td.html(col);
		
		td = $('<td>');
		td.addClass('value truncate');
		tr.append(td);
		td.text(row[col]);

		/*
		td = $('<td>');
		td.addClass('spacer');
		tr.append(td);
		td.html('&nbsp;');
		*/
		if (k==9) {
			return false;
		}
		
	});
	var delta = (3 - k%3) % 3;
	for (var i=0; i < delta; i++) {
		var td = $('<td>');
		td.addClass('key');
		tr.append(td);
		td.html('&nbsp;');
		
		td = $('<td>');
		td.addClass('value');
		tr.append(td);
		td.html('&nbsp;');

		/*
		td = $('<td>');
		td.addClass('spacer');
		tr.append(td);
		td.html('&nbsp;');
		*/
	}
	return table.html();
}

// "m" is the number of columns per row
// "maxRows" is the maxim number of rows to be displayed
function getDisplayColumns(row, m, maxRows) {
	var ret = [];
	var tr = [];
	var rowCount = 0;
	$.each(display_columns['top_columns'], function(i, col) {
		if (row[col] == null || display_columns['title'] == col) {
			return true;
		}
		tr.push(col);
		if (tr.length == m) {
			ret.push(tr);
			tr = [];
			if (++rowCount == maxRows) {
				return false;
			}
		}
	});
	if (tr.length > 0) {
		for (var i=0; i < m; i++) {
			tr.push('');
		}
		tr.length = m;
		ret.push(tr);
	}
	return ret;
}

function isLongText(col, value) {
	return (col != '$$hashKey' && 
			value != null &&
			col != display_columns['title'] && 
			col != display_columns['subtitle'] &&
			!display_columns['file'].contains(col) &&
			(/*display_columns['text_columns'].contains(col) ||*/ ('' + value).length > 20));
}

// "m" is the number of columns per row
function getDetailRows(row, m) {
	var ret = [];
	var tr = [];
	$.each(row, function(key, value) {
		if (key == '$$hashKey' || value == null) {
			return true;
		}
		if (key == display_columns['title'] || key == display_columns['subtitle'] || 
				/*display_columns['text_columns'].contains(key) ||*/ value.length > 20) {
			return true;
		}
		
		tr.push(key);
		if (tr.length == m) {
			ret.push(tr);
			tr = [];
		}
	});
	if (tr.length > 0) {
		ret.push(tr);
	}
	return ret;
}

function getLongTextColumns(row) {
	var ret = [];
	$.each(row, function(col, value) {
		if (!isLongText(col, value)) {
			return true;
		}
		ret.push(col);
	});
	return ret;
}

function getFileUrlColumns(row) {
	var ret = [];
	$.each(row, function(col, value) {
		if (value != null && display_columns['file'].contains(col)) {
			ret.push(col);
		}
	});
	return ret;
}

function getEntryTitle(row) {
	return row[display_columns['title']];
}

function getEntrySubtitle(row) {
	return row[display_columns['subtitle']];
}

function updatePageTag(direction, currentPage, pageMap, tagPages, maxPages) {
	var ret = currentPage;
	if (direction == 'forward') {
		ret++;
		if (maxPages > tagPages) {
			var firstPageTag = currentPage;
			if (maxPages - tagPages < firstPageTag) {
				firstPageTag = maxPages - tagPages + 1;
			}
			for (var i=0; i<tagPages; i++) {
				pageMap[i+1] = firstPageTag + i;
			}
		}
	} else {
		ret--;
		if (maxPages > tagPages) {
			var firstPageTag = currentPage - tagPages;
			if (firstPageTag < 1) {
				firstPageTag = 1;
			}
			for (var i=0; i<tagPages; i++) {
				pageMap[i+1] = firstPageTag + i;
			}
		}
	}
	return ret;
}

function setActivePage(currentPage, pageMap) {
	$('.pagination li').removeClass('active');
	var j = 0;
	$.each($('.toppagination li'), function(i, li) {
		if ($(li).hasClass('page-selector')) {
			j++;
			if (currentPage == pageMap[j]) {
				$(li).addClass('active');
				return false;
			}
		}
	});
	j = 0;
	$.each($('.bottompagination li'), function(i, li) {
		if ($(li).hasClass('page-selector')) {
			j++;
			if (currentPage == pageMap[j]) {
				$(li).addClass('active');
				return false;
			}
		}
	});
	
}

