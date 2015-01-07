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
function getDisplayColumns(row, m, maxRows, table_name) {
	var ret = [];
	var tr = [];
        if (display_columns['summary'] != null) {
            tr.push(display_columns['summary']);
            ret.push(tr);
        } else {
            var rowCount = 0;
            $.each(display_columns['top_columns'], function(i, col) {
                    if (row[col] == null || row[col] === '' || display_columns['title'] == col ||
                                    display_columns['thumbnail'].contains(col) || display_columns['hidden'].contains(col) || 
                                    hasAnnotation(table_name, col, 'bottom')) {
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
        }
	return ret;
}

function isLongText(col, value) {
	return (col != '$$hashKey' && 
			value != null &&
			value !== '' &&
			col != display_columns['title'] && 
			col != display_columns['subtitle'] &&
			!display_columns['thumbnail'].contains(col) &&
                        !display_columns['hidden'].contains(col) &&
			!display_columns['3dview'].contains(col) &&
			!display_columns['zoomify'].contains(col) &&
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
		if (!display_columns['thumbnail'].contains(key) || !display_columns['3dview'].contains(key)  || 
                        !display_columns['zoomify'].contains(key) || display_columns['hidden'].contains(key) ||
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
		if (key == '$$hashKey' || value == null || value === '' || display_columns['hidden'].contains(key)) {
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
	return display_columns['thumbnail'].length > 0 ? row[display_columns['thumbnail'][0]] : null;
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

// "m" is the number of tiles per row
function getTilesLayout(datasetFiles, m) {
        var data = datasetFiles['thumbnailsFiles'];
        var col_name = datasetFiles['uri'];
	var ret = [];
	var tr = [];
	$.each(data, function(i, tile) {
		tr.push(tile[col_name]);
		if (tr.length == m) {
			ret.push(tr);
			tr = [];
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

function getFilesLayout(datasetFiles) {
        var data = datasetFiles['downloadFiles'];
        var uri = datasetFiles['uri'];
        var name = datasetFiles['name'];
        var size = datasetFiles['size'];
	var ret = [];
	$.each(data, function(i, file) {
                var tr = [];
		tr.push('');
		tr.push(file[name]);
		tr.push(file[uri]);
		tr.push(file[size]);
		ret.push(tr);
	});
	return ret;
}

function getViewer3d(datasetFiles) {
        var data = datasetFiles['image3dFiles'];
        var uri = datasetFiles['uri'];
        var preview = datasetFiles['preview'];
        var preview_url = datasetFiles['preview_url'];
        var name = datasetFiles['name'];
        var size = datasetFiles['size'];
        var viewer_url = datasetFiles['viewer_url'];
	var ret = [];
	$.each(data, function(i, file) {
		var tr = [];
		//tr.push(viewer_url + '?url=' + file[uri]);
		tr.push(file[uri]);
		tr.push(file[name]);
		tr.push(file[size]);
		tr.push(preview_url + '?url=' + file[preview]);
		ret.push(tr);
	});
	return ret;
}

