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
	options['facebaseData'].empty();
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

function htmlItemTitle(row) {
	return row[display_columns['title']];
}

var trace = false;

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

		td = $('<td>');
		//td.addClass('spacer');
		tr.append(td);
		td.html('&nbsp;');
		if (k==9) {
			return false;
		}
		
	});
	var delta = (3 - k%3) % 3;
	if (trace) {
		alert(delta);
		alert(tr.html());
		trace = false;
	}
	for (var i=0; i < delta; i++) {
		var td = $('<td>');
		td.addClass('key');
		tr.append(td);
		td.html('&nbsp;');
		
		td = $('<td>');
		td.addClass('value');
		tr.append(td);
		td.html('&nbsp;');

		td = $('<td>');
		//td.addClass('spacer');
		tr.append(td);
		td.html('&nbsp;');
	}
	return table.html();
}

function isLongText(col, value) {
	return (col != '$$hashKey' && 
			value != null &&
			col != display_columns['title'] && 
			col != display_columns['subtitle'] &&
			(display_columns['text_columns'].contains(col) || ('' + value).length > 20));
}

function htmlEntryRow(row) {
	var table = $('<table>');
	var tbody = $('<tbody>');
	table.append(tbody);
	var i = 0;
	$.each(row, function(key, value) {
		if (key == '$$hashKey' || value == null) {
			return true;
		}
		if (key == display_columns['title'] || key == display_columns['subtitle'] || 
				display_columns['text_columns'].contains(key) || value.length > 20) {
			return true;
		}
		if (i++%3 == 0) {
			tr = $('<tr>');
			table.append(tr);
		}
		var td = $('<td>');
		td.addClass('key');
		if (i == 1) {
			//td.addClass('sortby');
		}
		tr.append(td);
		td.html(key);
		
		td = $('<td>');
		td.addClass('value');
		tr.append(td);
		td.html(value);
		
		td = $('<td>');
		tr.append(td);
		//td.addClass('spacer');
		td.html('&nbsp;');
	});
	return table.html();
}

function htmlTextEntryRow(row) {
	var div = $('<div>');
	$.each(row, function(col, value) {
		if (!isLongText(col, value)) {
			return true;
		}
		var h4 = $('<h4>');
		div.append(h4);
		h4.html(col);
		var p = $('<p>');
		div.append(p);
		p.html(row[col]);
	});
	return div.html();
}

function htmlEntryTitle(row) {
	return row[display_columns['title']];
}

function htmlEntrySubtitle(row) {
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

