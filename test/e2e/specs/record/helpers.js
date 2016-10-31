var chaisePage = require('../../utils/chaise.page.js');

exports.testPresentation = function (tableParams) {
	it("should have '" + tableParams.title +  "' as title", function() {
		chaisePage.recordPage.getEntityTitle().then(function(txt) {
			expect(txt).toBe(tableParams.title);
		});
	});

	it("should have '" + tableParams.subTitle +"' as subTitle", function() {
		chaisePage.recordPage.getEntitySubTitle().then(function(txt) {
			expect(txt).toBe(tableParams.subTitle);
		});
	});

	it("should show " + tableParams.columns.filter(function(c) {return c.value != null;}).length + " columns only", function() {
        var columns = tableParams.columns.filter(function(c) {return c.value != null;});
		chaisePage.recordPage.getColumns().then(function(els) {
			// Check no of columns are same as needed
			expect(els.length).toBe(columns.length);
		});
	});

    it("should show the action buttons properly", function() {
        var EC = protractor.ExpectedConditions,
            editButton = chaisePage.recordPage.getEditRecordButton(),
            createButton = chaisePage.recordPage.getCreateRecordButton(),
            deleteButton = chaisePage.recordPage.getDeleteRecordButton(),
            showAllRTButton = chaisePage.recordPage.getShowAllRelatedEntitiesButton();

        browser.wait(EC.elementToBeClickable(editButton), 10000);
        browser.wait(EC.elementToBeClickable(createButton), 10000);
        browser.wait(EC.elementToBeClickable(deleteButton), 10000);
        browser.wait(EC.elementToBeClickable(showAllRTButton), 10000);

        editButton.isDisplayed().then(function (bool) {
            expect(bool).toBeTruthy();
        });

        createButton.isDisplayed().then(function (bool) {
            expect(bool).toBeTruthy();
        });

        deleteButton.isDisplayed().then(function (bool) {
            expect(bool).toBeTruthy();
        });

        showAllRTButton.isDisplayed().then(function (bool) {
            expect(bool).toBeTruthy();
        });

        chaisePage.recordPage.getPermalinkButton().isDisplayed().then(function (bool) {
            expect(bool).toBeTruthy();
        });
    });

	it("should render columns which are specified to be visible and in order", function() {
		var columns = tableParams.columns.filter(function(c) {return c.value != null;});
		chaisePage.recordPage.getAllColumnCaptions().then(function(pageColumns) {
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
		chaisePage.recordPage.getColumnsWithUnderline().then(function(pageColumns) {
			expect(pageColumns.length).toBe(columns.length);
			var index = 0;
			pageColumns.forEach(function(c) {
				var comment = columns[index++].comment;
				chaisePage.recordPage.getColumnComment(c).then(function(actualComment) {
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
		chaisePage.recordPage.getColumnValueElements().then(function(columnEls) {
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
        var displayName, tableCount,
            relatedTables = tableParams.related_tables;

        chaisePage.recordPage.getRelatedTables().count().then(function(count) {
            expect(count).toBe(relatedTables.length);
            tableCount = count;

            // check the headings have the right name and in the right order
            return chaisePage.recordPage.getRelatedTableHeadings().getAttribute("heading");
        }).then(function(headings) {
            // tables should be in order based on annotation for visible foreign_keys
            // Headings have a '-' when page loads, and a count after them
            expect(headings).toEqual(tableParams.tables_order);

            // rely on the UI data for looping, not expectation data
            for (var i = 0; i < tableCount; i++) {
                displayName = relatedTables[i].title;

                // verify all columns are present
                (function(i, displayName) {
                    chaisePage.recordPage.getRelatedTableColumnNamesByTable(displayName).getInnerHtml().then(function(columnNames) {
                        for (var j = 0; j < columnNames.length; j++) {
                            expect(columnNames[j]).toBe(relatedTables[i].columns[j]);
                        }
                    });

                    // verify all rows are present
                    chaisePage.recordPage.getRelatedTableRows(displayName).count().then(function(rowCount) {
                        expect(rowCount).toBe(relatedTables[i].data.length);
                        expect(headings[i]).toBe("- " + displayName + " (" + rowCount + ")");
                    });
                })(i, displayName);
            }
        });
    });

    // There is a media table linked to accommodations but this accommodation (Sheraton Hotel) doesn't have any media
    it("should not show a related table with zero values.", function() {
        expect(chaisePage.recordPage.getRelatedTable("media").isPresent()).toBeFalsy();
    });

    // Related tables are contextualized with `compact/brief`, but if that is not specified it will inherit from `compact`
    it("should honor the page_size annotation for the table, file, in the compact context based on inheritance.", function() {
        var relatedTableName = tableParams.related_table_name_with_page_size_annotation;

        chaisePage.recordPage.getRelatedTableRows(relatedTableName).count().then(function(count) {
            expect(count).toBe(tableParams.page_size);
        });
    });

    it("clicking the related table heading should change the heading and hide the table.", function() {
        var relatedTable = tableParams.related_tables[0];
        var displayName = relatedTable.title;
        var tableHeading = chaisePage.recordPage.getRelatedTableHeading(displayName),
            tableElement = chaisePage.recordPage.getRelatedTable(displayName);

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

    // There is a media table linked to accommodations but this accommodation (Sheraton Hotel) doesn't have any media
    it("should show a related table with zero values upon clicking a link to show all related entities", function() {
        chaisePage.recordPage.getShowAllRelatedEntitiesButton().click().then(function() {
            expect(chaisePage.recordPage.getRelatedTable("media").isPresent()).toBeTruthy();
        });
    });
};

exports.testEditButton = function () {
    it("should redirect to recordedit app", function() {
        var EC = protractor.ExpectedConditions,
            editButton = chaisePage.recordPage.getEditRecordButton();

        browser.wait(EC.elementToBeClickable(editButton), 10000);

        editButton.click().then(function() {
            return browser.driver.getCurrentUrl();
        }).then(function(url) {
            expect(url.indexOf('recordedit')).toBeGreaterThan(-1);
        });
    });
};

exports.testCreateButton = function () {
    it("should redirect to recordedit app", function() {
        var EC = protractor.ExpectedConditions,
            createButton = chaisePage.recordPage.getCreateRecordButton();

        browser.wait(EC.elementToBeClickable(createButton), 10000);

        createButton.click().then(function() {
            return browser.driver.getCurrentUrl();
        }).then(function(url) {
            expect(url.indexOf('recordedit')).toBeGreaterThan(-1);
        });
    });
};

exports.testDeleteButton = function () {
    it("should redirect to data browser.", function () {
        var EC = protractor.ExpectedConditions,
            modalTitle = chaisePage.recordPage.getConfirmDeleteTitle(),
            config;

        browser.executeScript('return chaiseConfig;').then(function(chaiseConfig) {
            config = chaiseConfig;

            return chaisePage.recordPage.getDeleteRecordButton().click()
        }).then(function () {
            browser.wait(EC.visibilityOf(modalTitle), 5000);
            // expect modal to open
            return modalTitle.getText();
        }).then(function (text) {
            expect(text).toBe("Confirm Delete");

            return chaisePage.recordPage.getConfirmDeleteButton().click();
        }).then(function () {
            browser.driver.sleep(1000);

            return browser.driver.getCurrentUrl();
        }).then(function(url) {
            var parts = url.split("/");

            expect(parts.length).toBe(4);
            expect(parts[3]).toBe(config.dataBrowser);
        });
    });
}

exports.relatedTablesDefaultOrder = function (tableParams) {
    it("should have the tables in default order.", function() {
        chaisePage.recordPage.getRelatedTableHeadings().getAttribute("heading").then(function(headings) {
            // tables should be in order based on the default order because no visible foreign keys annotation is defined
            // Headings have a '-' when page loads, and a count after them
            expect(headings).toEqual(tableParams.tables_order);
        });
    });

    // Page size is set to 2 for the file table so that only 2 entries should be present with a link
    it("should honor the page_size annotation for the table, file, in the compact/brief context.", function() {
        var relatedTableName = tableParams.related_table_name_with_page_size_annotation;

        chaisePage.recordPage.getRelatedTableRows(relatedTableName).count().then(function(count) {
            expect(count).toBe(tableParams.page_size);
        });
    });
};

exports.relatedTableLinks = function (tableParams) {
    it("should create a functional link for table rows with links in them.", function() {
        var relatedTableName = tableParams.related_table_name_with_link_in_table;

        chaisePage.recordPage.getRelatedTableRows(relatedTableName).then(function(rows) {
            return rows[0].all(by.tagName("td"));
        }).then(function(cells) {
            return cells[2].getInnerHtml();
        }).then(function(cell) {
            // check that an element was created inside the td with an href attribute
            expect(cell.indexOf("href")).toBeGreaterThan(-1);
        });
    });

    it("should have a View All link for a related table that redirects to recordset.", function() {
        var EC = protractor.ExpectedConditions,
            relatedTableName = tableParams.related_table_name_with_more_results,
            relatedTableLink = chaisePage.recordPage.getMoreResultsLink(relatedTableName);

        browser.wait(EC.elementToBeClickable(relatedTableLink), 10000);

        chaisePage.recordPage.getRelatedTableRows(relatedTableName).count().then(function(count) {
            expect(count).toBe(tableParams.booking_count);

            expect(relatedTableLink.isDisplayed()).toBeTruthy();
            return relatedTableLink.click();
        }).then(function() {
            return browser.driver.getCurrentUrl();
        }).then(function(url) {
            expect(url.indexOf('recordset')).toBeGreaterThan(-1);
        });
    });
};
