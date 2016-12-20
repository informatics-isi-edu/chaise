var chaisePage = require('../../utils/chaise.page.js');
var mustache = require('../../../../../ermrestjs/vendor/mustache.min.js');

exports.testPresentation = function (tableParams) {
	it("should have '" + tableParams.title +  "' as title", function() {
        browser.sleep(100);
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

        browser.wait(EC.elementToBeClickable(editButton), browser.params.defaultTimeout);
        browser.wait(EC.elementToBeClickable(createButton), browser.params.defaultTimeout);
        browser.wait(EC.elementToBeClickable(deleteButton), browser.params.defaultTimeout);
        browser.wait(EC.elementToBeClickable(showAllRTButton), browser.params.defaultTimeout);

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
			var index = 0, columnUrl, aTag;
			columnEls.forEach(function(el) {
				var column = columns[index++];
                if (column.presentation && column.presentation.type == "url") {
                    chaisePage.recordPage.getLinkChild(el).then(function(aTag) {
                        columnUrl = mustache.render(column.presentation.template, {
                            "catalog_id": process.env.catalogId,
                            "chaise_url": process.env.CHAISE_BASE_URL,
                        });

                        expect(aTag.getAttribute('href')).toEqual(columnUrl);
                        expect(aTag.getText()).toEqual(column.value);
                    });
                } else {
                    expect(el.getInnerHtml()).toBe(column.value);
                }
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
            return chaisePage.recordPage.getRelatedTableTitles();
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

                        // Because this spec is reused in multiple recordedit tests, this if-else branching just ensures the correct expectation is used depending on which table is encountered
                        if (displayName == tableParams.related_table_name_with_page_size_annotation) {
                        // The annotation_image table has more rows than the page_size, so its heading will have a + after the row count
                            expect(headings[i]).toBe(displayName + " (" + rowCount + "+)");
                        } else {
                        // All other tables should not have the + at the end its heading
                            expect(headings[i]).toBe(displayName + " (" + rowCount + ")");
                        }
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

        tableHeading.element(by.css('.glyphicon')).getAttribute('class').then(function(cssClass) {
            // related table should be open by default
            expect(cssClass).toContain('glyphicon-chevron-down');

            return tableHeading.getAttribute("class");
        }).then(function(attribute) {
            expect(attribute).toMatch("panel-open");

            return tableHeading.element(by.css(".accordion-toggle")).click();
        }).then(function() {
            return tableHeading.getAttribute("heading");
        }).then(function(heading) {
            // related table should be closed now and a '+' should be shown instead of a '-'
            expect(tableHeading.element(by.css('.glyphicon')).getAttribute('class')).toContain('glyphicon-chevron-right');
            return tableHeading.getAttribute("class");
        }).then(function(attribute) {
            expect(attribute).not.toMatch("panel-open");
        });
    });

    // There is a media table linked to accommodations but this accommodation (Sheraton Hotel) doesn't have any media
    it("should show and hide a related table with zero values upon clicking a link to toggle visibility of related entities", function() {
        var showAllRTButton = chaisePage.recordPage.getShowAllRelatedEntitiesButton();
        showAllRTButton.click().then(function() {
            expect(chaisePage.recordPage.getRelatedTable("media").isPresent()).toBeTruthy();
            return showAllRTButton.click();
        }).then(function() {
            expect(chaisePage.recordPage.getRelatedTable("media").isPresent()).toBeFalsy();
            return showAllRTButton.click();
        }).then(function() {
            expect(chaisePage.recordPage.getRelatedTable("media").isPresent()).toBeTruthy();
        }).catch(function(error) {
            console.log(error);
        });
    });
};

exports.testEditButton = function () {
    it("should redirect to recordedit app", function() {
        var EC = protractor.ExpectedConditions,
            editButton = chaisePage.recordPage.getEditRecordButton();

        browser.wait(EC.elementToBeClickable(editButton), browser.params.defaultTimeout);

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

        browser.wait(EC.elementToBeClickable(createButton), browser.params.defaultTimeout);

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
            browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
            // expect modal to open
            return modalTitle.getText();
        }).then(function (text) {
            expect(text).toBe("Confirm Delete");

            return chaisePage.recordPage.getConfirmDeleteButton().click();
        }).then(function () {
            browser.driver.sleep(1000);

            return browser.driver.getCurrentUrl();
        }).then(function(url) {
            expect(url.indexOf('/search/')).toBeGreaterThan(-1);
        });
    });
}

exports.relatedTablesDefaultOrder = function (tableParams) {
    it("should have the tables in default order.", function() {
        chaisePage.recordPage.getRelatedTableTitles().then(function(headings) {
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

exports.relatedTableLinks = function (testParams, tableParams) {

    var allWindows;

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

    it('should have a link to toggle between markdown and tabular views for markdown tables', function() {
        var EC = protractor.ExpectedConditions,
        markdownRelatedTable = tableParams.related_table_name_with_row_markdown_pattern, // "media"
        markdownToggleLink = chaisePage.recordPage.getToggleDisplayLink(markdownRelatedTable);

        browser.wait(EC.elementToBeClickable(markdownToggleLink), browser.params.defaultTimeout);

        // expect the markdown table to display this link
        expect(markdownToggleLink.isDisplayed()).toBeTruthy();

        // Expect initial display to be markdown by searching for a .markdown-container
        var initialMarkdownDisplay = element(by.id('rt-heading-' + markdownRelatedTable)).element(by.css('.markdown-container'));
        expect(initialMarkdownDisplay.isDisplayed()).toBeTruthy();

        markdownToggleLink.click().then(function() {
            // After clicking toggle link, the table should now be displayed as a regular table (which would have an id of "rt-media")
            var tableDisplay = element(by.id('rt-' + markdownRelatedTable));
            expect(tableDisplay.isDisplayed()).toBeTruthy();
            return markdownToggleLink.click();
        }).then(function() {
            // After clicking the toggle link once more, expect the related table to revert to its markdown display
            expect(initialMarkdownDisplay.isDisplayed()).toBeTruthy();
        }).catch(function(error) {
            console.log(error);
        });
    });

    it('should have an Add link for a related table that redirects to that related table in recordedit with a prefill query parameter.', function(done) {
        var EC = protractor.ExpectedConditions,
            relatedTableName = tableParams.related_table_name_with_more_results,
            addRelatedRecordLink = chaisePage.recordPage.getAddRecordLink(relatedTableName);

        // Should make sure user is logged in
        browser.wait(EC.elementToBeClickable(addRelatedRecordLink), browser.params.defaultTimeout);

        expect(addRelatedRecordLink.isDisplayed()).toBeTruthy();

        addRelatedRecordLink.click().then(function() {
            // This Add link opens in a new tab so we have to track the windows in the browser...
            return browser.getAllWindowHandles();
        }).then(function(handles) {
            allWindows = handles;
            // ... and switch to the new tab here...
            return browser.switchTo().window(allWindows[1]);
        }).then(function() {
            // ... and then get the url from this new tab...
            return browser.driver.getCurrentUrl();
        }).then(function(url) {

            var result = '/recordedit/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + relatedTableName;
            expect(url.indexOf(result)).toBeGreaterThan(-1);
            expect(url.indexOf('?prefill=')).toBeGreaterThan(-1);

            // set the required fields
            browser.sleep(10000);
            return chaisePage.recordsetPage.getInputForAColumn("price")
        }).then(function(input) {
            input.sendKeys(testParams.price);
            var nowBtn = element.all(by.css('button[name="booking_date"]')).get(1);
            return nowBtn.click();
        }).then(function() {
            return chaisePage.recordEditPage.submitForm();
        }).then(function() {
            // wait until redirected to record page
            var EC = protractor.ExpectedConditions,
                title = chaisePage.recordPage.getEntityTitleElement();
            browser.wait(EC.presenceOf(title), 10000);
            done();
        });
    });

    xit("should have a new record, View More link for a related table that redirects to recordset.", function(done) {

        browser.close();
        browser.switchTo().window(allWindows[0]);
        browser.sleep(10000);

        var EC = protractor.ExpectedConditions,
            relatedTableName = tableParams.related_table_name_with_more_results,
            relatedTableLink = chaisePage.recordPage.getMoreResultsLink(relatedTableName);

        browser.wait(EC.elementToBeClickable(relatedTableLink), browser.params.defaultTimeout);

        chaisePage.recordPage.getRelatedTableRows(relatedTableName).count().then(function(count) {
            expect(count).toBe(tableParams.booking_count + 1);

            expect(relatedTableLink.isDisplayed()).toBeTruthy();
            return relatedTableLink.click();
        }).then(function() {
            return browser.driver.getCurrentUrl();
        }).then(function(url) {
            expect(url.indexOf('recordset')).toBeGreaterThan(-1);
            done();
        });
    });
};
