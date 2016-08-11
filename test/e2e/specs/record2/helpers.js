var chaisePage = require('../../utils/chaise.page.js');

exports.testPresentation = function (tableParams) {
	it("should have '" + tableParams.title +  "' as title", function() {
		chaisePage.record2Page.getEntityTitle().then(function(txt) {
			expect(txt).toBe(tableParams.title);
		});
	});

	it("should show " + tableParams.columns.length + " columns only", function() {
		chaisePage.record2Page.getColumns().then(function(columns) {
			expect(columns.length).toBe(tableParams.columns.length);
		});
	});



	it("should render columns which are specified to be visible and in order", function() {
		var columns = tableParams.columns;
		chaisePage.record2Page.getAllColumnCaptions().then(function(pageColumns) {
			expect(pageColumns.length).toBe(columns.length);
			var index = 0;
			pageColumns.forEach(function(c) {
				c.getInnerHtml().then(function(txt) {
					txt = txt.trim();
					var col = columns[index++];
					expect(col).toBeDefined();
					expect(txt).toBe(col.title);
				});
			});
		});
	});

	it("should show line under columns which have a comment", function() {
		var columns = tableParams.columns.filter(function(c) { return (typeof c.comment == 'string'); });
		chaisePage.recordEditPage.getColumnsWithUnderline().then(function(pageColumns) {
			expect(pageColumns.length).toBe(columns.length);
			var index = 0;
			pageColumns.forEach(function(c) {
				var comment = columns[index++].comment;
				chaisePage.recordEditPage.getColumnComment(c).then(function(actualComment) {
					var exists = actualComment ? true : undefined;
					expect(exists).toBeDefined();
					expect(actualComment.getInnerHtml()).toBe(comment);
				});
			});
		});
	});


};