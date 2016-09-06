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

	it("should show " + tableParams.columns.filter(function(c) {return c.value != null;}).length + " columns only", function() {
        var columns = tableParams.columns.filter(function(c) {return c.value != null;});
		chaisePage.record2Page.getColumns().then(function(els) {
			// Check no of columns are same as needed
			expect(els.length).toBe(columns.length);
		});
	});

    it("should show the action buttons properly", function() {
        chaisePage.record2Page.getEditRecordButton().isDisplayed().then(function (bool) {
            expect(bool).toBeTruthy();
        });

        chaisePage.record2Page.getCreateRecordButton().isDisplayed().then(function (bool) {
            expect(bool).toBeTruthy();
        });


        chaisePage.record2Page.getPermalinkButton().isDisplayed().then(function (bool) {
            expect(bool).toBeTruthy();
        });
    });

	it("should render columns which are specified to be visible and in order", function() {
		var columns = tableParams.columns.filter(function(c) {return c.value != null;});
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
		var columns = tableParams.columns.filter(function(c) {
            return (c.value != null && typeof c.comment == 'string');
        });
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
		var columns = tableParams.columns.filter(function(c) {return c.value != null;});
		chaisePage.record2Page.getColumnValueElements().then(function(columnEls) {
            expect(columnEls.length).toBe(columns.length);
			var index = 0;
			columnEls.forEach(function(el) {
				var column = columns[index++];
				expect(el.getInnerHtml()).toBe(column.value);
			});
		});
	});

    it('should not show any columns with null value', function() {
        var columns = tableParams.columns;
        columns.forEach(function(column) {
            var elem = element(by.id('row-' + column.title.toLowerCase()));
            if (column.value === null) {
                expect(elem.isPresent()).toBe(false);
            }
        });
    });

	it('should display a permalink of the record', function() {
		var key = tableParams.keys[0];
		var expectedURL = browser.params.url + ':' + tableParams.table_name + '/' + key.name + key.operator + key.value;
		var actualURL = element(by.id('permalink'));
		expect(actualURL.isDisplayed()).toBe(true);
		actualURL.getAttribute('href').then(function(url) {
			expect(url).toBe(expectedURL);
		});
	});

    it("should show related table names and their tables", function() {
        var displayName,
            relatedTables = tableParams.related_tables;

        chaisePage.record2Page.getRelatedTables().count().then(function(tableCount) {
            expect(tableCount).toBe(relatedTables.length);

            // check the headings have the right name and in the right order
            chaisePage.record2Page.getRelatedTableHeadings().getAttribute("heading").then(function(headings) {
                // tables should be in order based on annotation for visible foreign_keys
                // Headings have a '-' when page loads, and a count after them
                expect(headings).toEqual(tableParams.tables_order);

                // rely on the UI data for looping, not expectation data
                for (var i = 0; i < tableCount; i++) {
                    displayName = relatedTables[i].title;

                    // verify all columns are present
                    (function(i, displayName) {
                        chaisePage.record2Page.getRelatedTableColumnNamesByTable(displayName).getInnerHtml().then(function(columnNames) {
                            for (var j = 0; j < columnNames.length; j++) {
                                expect(columnNames[j]).toBe(relatedTables[i].columns[j]);
                            }
                        });

                        // verify all rows are present
                        chaisePage.record2Page.getRelatedTableRows(displayName).count().then(function(rowCount) {
                            expect(rowCount).toBe(relatedTables[i].data.length);
                            expect(headings[i]).toBe("- " + displayName + " (" + rowCount + ")");
                        });
                    })(i, displayName);
                }
            });
        });
    });

    it("clicking the related table heading should change the heading and hide the table.", function() {
        var relatedTable = tableParams.related_tables[0];
        var displayName = relatedTable.title;
        var tableHeading = chaisePage.record2Page.getRelatedTableHeading(displayName),
            tableElement = chaisePage.record2Page.getRelatedTable(displayName);

        tableHeading.getAttribute("heading").then(function(heading) {
            // related table should be open by default
            expect(heading.indexOf('-')).toBeGreaterThan(-1);

            return tableHeading.getAttribute("class");
        }).then(function(attribute) {
            expect(attribute).toMatch("panel-open");

            return tableHeading.element(by.css(".accordion-toggle")).click();
        }).then(function() {
            return tableHeading.getAttribute("heading");
        }).then(function(heading) {
            // related table should be closed now and a '+' should be shown instead of a '-'
            expect(heading.indexOf('+')).toBeGreaterThan(-1);

            return tableHeading.getAttribute("class");
        }).then(function(attribute) {
            expect(attribute).not.toMatch("panel-open");
        });
    });
};

exports.testEditButton = function () {
    it("should redirect to recordedit app", function() {
        var EC = protractor.ExpectedConditions,
            editButton = chaisePage.record2Page.getEditRecordButton();

        browser.wait(EC.elementToBeClickable(editButton), 5000);

        editButton.click().then(function() {
            browser.driver.getCurrentUrl().then(function(url) {
                expect(url.indexOf('recordedit')).toBeGreaterThan(-1);
            });
        });
    });
};

exports.testCreateButton = function () {
    it("should redirect to recordedit app", function() {
        var EC = protractor.ExpectedConditions,
            createButton = chaisePage.record2Page.getCreateRecordButton();

        browser.wait(EC.elementToBeClickable(createButton), 5000);

        createButton.click().then(function() {
            browser.driver.getCurrentUrl().then(function(url) {
                expect(url.indexOf('recordedit')).toBeGreaterThan(-1);
            });
        });
    });
};
