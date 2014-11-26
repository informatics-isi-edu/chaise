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

// "m" is the number of columns per row
// "maxRows" is the maxim number of rows to be displayed
function getDisplayColumns(row, m, maxRows) {
	var ret = [];
	var tr = [];
	var rowCount = 0;
	$.each(display_columns['top_columns'], function(i, col) {
		if (row[col] == null || row[col] === '' || display_columns['title'] == col || 
				display_columns['thumbnail'] == col || display_columns['zoomify'] == col || display_columns['3dview'] == col) {
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
			value !== '' &&
			col != display_columns['title'] && 
			col != display_columns['subtitle'] &&
			col != display_columns['thumbnail'] &&
			col != display_columns['3dview'] &&
			col != display_columns['zoomify'] &&
			!display_columns['file'].contains(col) &&
			(/*display_columns['text_columns'].contains(col) ||*/ ('' + value).length > 20));
}

// "m" is the number of columns per row
function getDetailRows(row, m) {
	var ret = [];
	var tr = [];
	$.each(row, function(key, value) {
		if (key == '$$hashKey' || value == null || value === '') {
			return true;
		}
		if (key == display_columns['thumbnail'] || key == display_columns['3dview']  || key == display_columns['zoomify'] || 
				key == display_columns['title'] || key == display_columns['subtitle'] || 
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

function getDetailColumns(row) {
	var ret = [];
	$.each(row, function(key, value) {
		if (key == '$$hashKey' || value == null || value === '') {
			return true;
		}
		ret.push(key);
	});
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
		if (value != null && value !== '' && display_columns['file'].contains(col)) {
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

function getEntryThumbnail(row) {
	return row[display_columns['thumbnail']];
}

function getEntryZoomify(row) {
	return row[display_columns['zoomify']];
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

