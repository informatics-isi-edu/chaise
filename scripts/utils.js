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

var mockup_prototype = {
		'title': 'title',
		'owner': 'owner',
		'top_columns': [
		                'pubmed_id',
		                'age_stages',
		                'illumina_sequencer',
		                'owner',
		                'microarray_platform',
		                'somite_count',
		                'gene',
		                'affymetrix_genechip',
		                'chromosome'
		                ],
		'text_columns': [
		                'desc_html',
		                'summary_html'
		                ]
};

function htmlItemTitle(row) {
	return row[mockup_prototype['title']];
}

function htmlItem(row) {
	var table = $('<table>');
	$.each(mockup_prototype['top_columns'], function(i, col) {
		if (i%3 == 0) {
			tr = $('<tr>');
			table.append(tr);
		}
		var td = $('<td>');
		td.addClass('key');
		if (i==0) {
			td.addClass('sortby');
		}
		tr.append(td);
		td.html(col);
		
		td = $('<td>');
		td.addClass('value');
		tr.append(td);
		td.html(row[col]);

		td = $('<td>');
		td.addClass('spacer');
		tr.append(td);
		td.html('&nbsp;');
		
	});
	return table.html();
}

function htmlEntryRow(row) {
	var table = $('<table>');
	var tbody = $('<tbody>');
	table.append(tbody);
	var i = 0;
	$.each(row, function(key, value) {
		if (key == mockup_prototype['title'] || key == mockup_prototype['owner'] || mockup_prototype['text_columns'].contains(key)) {
			return true;
		}
		if (value == null) {
			//return true;
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
		td.addClass('spacer');
		td.html('&nbsp;');
	});
	return table.html();
}

function htmlTextEntryRow(row) {
	var div = $('<div>');
	$.each(mockup_prototype['text_columns'], function(i, col) {
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
	return row[mockup_prototype['title']];
}

function htmlEntryOwner(row) {
	return row[mockup_prototype['owner']];
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
				//alert('j='+j+', page='+page);
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
				//alert('j='+j+', page='+page);
				$(li).addClass('active');
				return false;
			}
		}
	});
	
}

