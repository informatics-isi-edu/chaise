var chaisePage = require('../../utils/chaise.page.js');

exports.testPresentation = function (tableParams) {
	it("should have '" + tableParams.title +  "' as title", function() {
		chaisePage.record2Page.getEntityTitle().then(function(txt) {
			expect(txt).toBe(tableParams.title);
		});
	});

	it("should have '" + tableParams.subTitle +"' as subTitle", function() {
		chaisePage.record2Page.getEntitySubTitle().then(function(txt) {
			expect(txt).toBe(tableParams.subTitle);
		});
	});

	it("should show " + tableParams.columns.length + " columns only", function() {
		chaisePage.record2Page.getColumns().then(function(columns) {
			// Check no of columns are same as needed
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

					// Check title is same
					expect(txt).toBe(col.title);
				});
			});
		});
	});

	it("should show line under columns which have a comment and inspect the comment value too", function() {
		var columns = tableParams.columns.filter(function(c) { return (typeof c.comment == 'string'); });
		chaisePage.record2Page.getColumnsWithUnderline().then(function(pageColumns) {
			expect(pageColumns.length).toBe(columns.length);
			var index = 0;
			pageColumns.forEach(function(c) {
				var comment = columns[index++].comment;
				chaisePage.record2Page.getColumnComment(c).then(function(actualComment) {
					var exists = actualComment ? true : undefined;
					expect(exists).toBeDefined();

					// Check comment is same
					expect(actualComment.getInnerHtml()).toBe(comment);
				});
			});
		});
	});

	it("should validate the values of each column", function() {
		var columns = tableParams.columns;
		chaisePage.record2Page.getColumnValueElements().then(function(columnEls) {
			expect(columnEls.length).toBe(columns.length);
			var index = 0;
			columnEls.forEach(function(el) {
				var column = columns[index++];
				if (column.value != 'undefined') {
					expect(el.getInnerHtml()).toBe(column.value);
				}
			});
		});
	});

    it("should show related table names and their tables", function() {
        var relatedTables = tableParams.relatedTables;
        chaisePage.record2Page.getRelatedTables().count().then(function(count) {
            expect(count).toBe(relatedTables.length);

            // rely on the UI data for looping, not expectation data
            for (var i = 0; i < count; i++) {
                // need a closure to preserve i through each iteration
                (function(i) {
                    chaisePage.record2Page.getRelatedTableHeadings().getAttribute("heading").then(function(headings) {
                        expect(headings[i].includes(relatedTables[i].title)).toBe(true);

                        // verify all columns are present
                        chaisePage.record2Page.getRelatedTableColumnNamesByTable(i).getInnerHtml().then(function(columnNames) {
                            for (var j = 0; j < columnNames.length; j++) {
                                expect(columnNames[j]).toBe(relatedTables[i].columns[j]);
                            }
                        });

                        // verify all rows are present
                        chaisePage.record2Page.getRelatedTableRows(i).count().then(function(count) {
                            expect(count).toBe(relatedTables[i].data.length);
                        });
                    });
                })(i);
            }
        });
    });

};
