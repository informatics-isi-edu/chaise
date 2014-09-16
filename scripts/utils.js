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
		                ]
};

function htmlItemOld(row, viewAllData) {
	var ret = $('<div>')
	var table = $('<table>');
	ret.append(table);
	$.each(mockup_prototype['top_columns'], function(i, col) {
		if (i%3 == 0) {
			tr = $('<tr>');
			table.append(tr);
		}
		var td = $('<td>');
		td.addClass('facetName');
		tr.append(td);
		td.html(col+':');
		td = $('<td>');
		td.addClass('itemBody');
		tr.append(td);
		td.html(row[col]);
	});
	return ret.html();
}

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
	var ret = $('<div>');
	var h2 = $('<h2>');
	ret.append(h2);
	h2.html(row[mockup_prototype['title']]);
	var h3 = $('<h3>');
	ret.append(h3);
	h3.html(row[mockup_prototype['owner']]);
	var table = $('<table>');
	ret.append(table);
	var tbody = $('<tbody>');
	table.append(tbody);
	var i = 0;
	$.each(row, function(key, value) {
		if (value == null) {
			//return true;
		}
		if (i++%3 == 0) {
			tr = $('<tr>');
			table.append(tr);
		}
		var td = $('<td>');
		tr.append(td);
		var strong = $('<strong>');
		td.append(strong);
		strong.html(key);
		
		td = $('<td>');
		tr.append(td);
		td.html(value);
		
		td = $('<td>');
		tr.append(td);
		//td.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
		td.addClass('spacer');
		td.html('&nbsp;');
	});
	return ret.html();
}

function updatePageTag(direction, currentPage, pageMap, tagPages, maxPages) {
	var ret = currentPage;
	if (direction == 'forward') {
		ret++;
		var firstPageTag = currentPage;
		if (maxPages - tagPages < firstPageTag) {
			firstPageTag = maxPages - tagPages + 1;
		}
		for (var i=0; i<tagPages; i++) {
			pageMap[i+1] = firstPageTag + i;
		}
	} else {
		ret--;
		var firstPageTag = currentPage - tagPages;
		if (firstPageTag < 1) {
			firstPageTag = 1;
		}
		for (var i=0; i<tagPages; i++) {
			pageMap[i+1] = firstPageTag + i;
		}
	}
	return ret;
}

