var chaisePage = require('../../utils/chaise.page.js');
var mustache = require('../../../../../ermrestjs/vendor/mustache.min.js');

exports.testPresentation = function (tableParams) {
	it("should have '" + tableParams.title +  "' as title", function() {
        var title = chaisePage.recordPage.getEntityTitleElement();
        expect(title.getText()).toEqual(tableParams.title);
	});

	it("should have '" + tableParams.subTitle.toUpperCase() +"' as subTitle", function() {
        var subtitle = chaisePage.recordPage.getEntitySubTitleElement();
        expect(subtitle.getText()).toEqual(tableParams.subTitle.toUpperCase());
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
                var col = columns[index++];
                expect(c.getText()).toEqual(col.title);
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
                    expect(actualComment).toBe(comment);
				});
			});
		});
	});

    it("should render columns based on their markdown pattern.", function() {
        var columnDisplayTag = "tag:misd.isi.edu,2015:display";
        var columns = tableParams.columns.filter(function(c) {
            return (c.annotations && c.annotations[columnDisplayTag]);
        });
        chaisePage.recordPage.getColumnCaptionsWithHtml().then(function(pageColumns) {
            expect(pageColumns.length).toBe(columns.length);
            var index = 0;
            pageColumns.forEach(function(c) {
                var value = columns[index++].annotations[columnDisplayTag].markdown_name;
                c.getAttribute("innerHTML").then(function(html) {
                    expect(html).toBe(value);
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
                    expect(el.getAttribute('innerHTML')).toBe(column.value);
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
        var displayName, tableCount, title,
            relatedTables = tableParams.related_tables;

        browser.wait(function() {
            return chaisePage.recordPage.getRelatedTables().count().then(function(ct) {
                return (ct=relatedTables.length);
            });
        }, browser.params.defaultTimeout);

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
                displayName = relatedTables[i].displayname;
                title = relatedTables[i].title;

                // verify all columns are present
                (function(i, displayName, title) {
                    chaisePage.recordPage.getRelatedTableColumnNamesByTable(displayName).getAttribute('innerHTML').then(function(columnNames) {
                        for (var j = 0; j < columnNames.length; j++) {
                            expect(columnNames[j]).toBe(relatedTables[i].columns[j]);
                        }

                        // verify all rows are present
                        return chaisePage.recordPage.getRelatedTableRows(displayName).count();
                    }).then(function(rowCount) {
                        expect(rowCount).toBe(relatedTables[i].data.length);

                        // Because this spec is reused in multiple recordedit tests, this if-else branching just ensures the correct expectation is used depending on which table is encountered
                        if (displayName == tableParams.related_table_name_with_page_size_annotation) {
                        // The annotation_image table has more rows than the page_size, so its heading will have a + after the row count
                            expect(headings[i]).toBe(title + " (" + rowCount + "+)");
                        } else {
                        // All other tables should not have the + at the end its heading
                            expect(headings[i]).toBe(title + " (" + rowCount + ")");
                        }
                    });
                })(i, displayName, title);
            }
        });
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
        var showAllRTButton = chaisePage.recordPage.getShowAllRelatedEntitiesButton(),
            tableDisplayname = "<strong>media</strong>",
            noResultsMessage = "No Results Found";
        showAllRTButton.click().then(function() {
            expect(chaisePage.recordPage.getRelatedTable(tableDisplayname).isPresent()).toBeFalsy();
            return showAllRTButton.click();
        }).then(function() {
            // empty related table should show
            expect(chaisePage.recordPage.getRelatedTable(tableDisplayname).isPresent()).toBeTruthy();
            //check the no results text appears properly
            return chaisePage.recordPage.getNoResultsRow().getText();
        }).then(function(text) {
            expect(text).toBe(noResultsMessage);
            return showAllRTButton.click();
        }).then(function() {
            expect(chaisePage.recordPage.getRelatedTable(tableDisplayname).isPresent()).toBeFalsy();
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
            expect(url.indexOf('/recordset/')).toBeGreaterThan(-1);
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
            return cells[3].getAttribute('innerHTML');
        }).then(function(cell) {
            // check that an element was created inside the td with an href attribute
            expect(cell.indexOf("href")).toBeGreaterThan(-1);
        });
    });

    it('should have a link to toggle between markdown and tabular views for markdown tables', function() {
        var EC = protractor.ExpectedConditions, tableDisplay,
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
            tableDisplay = element(by.id('rt-' + markdownRelatedTable));
            var viewActions = tableDisplay.all(by.css(".view-action-button"));
            return viewActions;
        }).then(function(btns) {
            browser.wait(EC.elementToBeClickable(btns[0]), browser.params.defaultTimeout);

            expect(tableDisplay.isDisplayed()).toBeTruthy();
            return markdownToggleLink.click();
        }).then(function() {
            // After clicking the toggle link once more, expect the related table to revert to its markdown display
            expect(initialMarkdownDisplay.isDisplayed()).toBeTruthy();
        }).catch(function(error) {
            console.log(error);
        });
    });

    describe("for a related entity without an association table", function() {
        it('should have an "Add" link for a related table that redirects to that related table in recordedit with a prefill query parameter.', function() {
            var EC = protractor.ExpectedConditions, newTabUrl,
                relatedTableName = tableParams.related_regular_table,
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
                // ... wait for the page to load ...
                newTabUrl = process.env.CHAISE_BASE_URL + '/recordedit/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + tableParams.table_name;
                return chaisePage.waitForElement(element(by.id('submit-record-button')));
            }).then(function() {

                browser.wait(function () {
                    return browser.driver.getCurrentUrl().then(function(url) {
                        return url.startsWith(newTabUrl);
                    });
                });
                // ... and then get the url from this new tab...
                return browser.driver.getCurrentUrl();
            }).then(function(url) {
                expect(url.indexOf(newTabUrl)).toBeGreaterThan(-1);
                expect(url.indexOf('?prefill=')).toBeGreaterThan(-1);
                expect(url.indexOf(relatedTableName)).toBeGreaterThan(-1);

                return chaisePage.recordEditPage.getFormTitle().getText();
            }).then(function(text) {
                var title = "Create " + relatedTableName + " Record";
                expect(text).toBe(title);

                return chaisePage.recordEditPage.getForeignKeyInputs();
            }).then(function(inputs) {
                expect(inputs.length).toBe(1);
                expect(inputs[0].getText()).toBe("Super 8 North Hollywood Motel");

                return chaisePage.recordEditPage.getInputById(0, "price");
            }).then(function(input) {
                input.sendKeys(testParams.price);
                var nowBtn = element.all(by.css('button[name="booking_date"]')).get(1);
                return nowBtn.click();
            }).then(function() {
                return chaisePage.recordEditPage.submitForm();
            }).then(function() {
                // wait until redirected to record page
                return browser.wait(EC.presenceOf(element(by.id('entity-title'))), browser.params.defaultTimeout);
            }).catch(function(error) {
                console.log(error);
                expect('There was an error in this promise chain').toBe('Please see error message.');
            });
        });

        it("should have a new record, View More link for a related table that redirects to recordset.", function() {
            browser.close();
            browser.switchTo().window(allWindows[0]);

            var EC = protractor.ExpectedConditions,
                relatedTableName = tableParams.related_regular_table,
                relatedTableLink = chaisePage.recordPage.getMoreResultsLink(relatedTableName);

            browser.wait(EC.visibilityOf(relatedTableLink), browser.params.defaultTimeout).then(function() {
                // waits until the count is what we expect, so we know the refresh occured
                browser.wait(function() {
                    return chaisePage.recordPage.getRelatedTableRows(relatedTableName).count().then(function(ct) {
                        return (ct == tableParams.booking_count + 1);
                    });
                }, browser.params.defaultTimeout);

                return chaisePage.recordPage.getRelatedTableRows(relatedTableName).count();
            }).then(function(count) {
                expect(count).toBe(tableParams.booking_count + 1);
                expect(relatedTableLink.isDisplayed()).toBeTruthy();
                return relatedTableLink.click();
            }).then(function() {
                return browser.driver.getCurrentUrl();
            }).then(function(url) {
                expect(url.indexOf('recordset')).toBeGreaterThan(-1);
                // check entity title is for related table
                return chaisePage.waitForElement(element(by.id("divRecordSet")));
            }).then(function() {
                expect(chaisePage.recordsetPage.getPageTitleElement().getText()).toBe(relatedTableName);
                browser.navigate().back();
            });
        });
    });

    describe("for a related entity without an association table", function() {
        it("should have a \"Link\" link for a related table that redirects to that related table's association table in recordedit with a prefill query parameter.", function() {
            var EC = protractor.ExpectedConditions, newTabUrl, rows, foreignKeyInputs,
                modalTitle = chaisePage.recordEditPage.getModalTitle(),
                relatedTableName = tableParams.related_associate_table,
                addRelatedRecordLink = chaisePage.recordPage.getAddRecordLink(relatedTableName);

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
                // ... wait for the page to load ...
                newTabUrl = process.env.CHAISE_BASE_URL + '/recordedit/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + tableParams.table_name;
                return chaisePage.waitForElement(element(by.id('submit-record-button')));
            }).then(function() {

                browser.wait(function () {
                    return browser.driver.getCurrentUrl().then(function(url) {
                        return url.startsWith(newTabUrl);
                    });
                });
                // ... and then get the url from this new tab...
                return browser.driver.getCurrentUrl();
            }).then(function(url) {
                expect(url.indexOf(newTabUrl)).toBeGreaterThan(-1);
                expect(url.indexOf('?prefill=')).toBeGreaterThan(-1);
                expect(url.indexOf(relatedTableName)).toBeGreaterThan(-1);

                return chaisePage.recordEditPage.getFormTitle().getText();
            }).then(function(text) {
                var title = "Create " + relatedTableName + " Record";
                expect(text).toBe(title);

                return chaisePage.recordEditPage.getForeignKeyInputs();
            }).then(function(inputs) {
                foreignKeyInputs = inputs;

                expect(inputs.length).toBe(2);
                expect(inputs[0].getText()).toBe("Super 8 North Hollywood Motel");

                return chaisePage.recordEditPage.getModalPopupBtnsUsingScript();
            }).then(function(popupBtns) {
                // the prefilled input is technically a foreign key input as well with a hidden popup btn
                expect(popupBtns.length).toBe(2);

                return chaisePage.clickButton(popupBtns[1]);
            }).then(function() {
                //wait for modal to open
                browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                return modalTitle.getText();
            }).then(function(text) {
                // make sure it opened
                expect(text.indexOf("Choose")).toBeGreaterThan(-1);

                browser.wait(function () {
                    return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                        return (ct > 0);
                    });
                });

                rows = chaisePage.recordsetPage.getRows();
                return rows.count();
            }).then(function(ct) {
                expect(ct).toBeGreaterThan(0);

                // use index 11 so it adds file with id 3012
                return rows.get(11).all(by.css(".select-action-button"));
            }).then(function(selectButtons) {
                return selectButtons[0].click();
            }).then(function() {
                browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getFormTitle()), browser.params.defaultTimeout);

                expect(foreignKeyInputs[1].getText()).toBe("30,007");
                var foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputValue("image_id", 0);
                expect(foreignKeyInput.getAttribute("value")).toBeDefined();

                return chaisePage.recordEditPage.submitForm();
            }).then(function() {
                // wait until redirected to record page
                return browser.wait(EC.presenceOf(element(by.id('entity-title'))), browser.params.defaultTimeout);
            }).catch(function(error) {
                console.log(error);
                expect('There was an error in this promise chain').toBe('Please see error message.');
            });
        });

        it("should not have a new record because of page size annotation.", function() {
            browser.close();
            browser.switchTo().window(allWindows[0]);

            var EC = protractor.ExpectedConditions,
                relatedTableName = tableParams.related_associate_table,
                relatedTableLink = chaisePage.recordPage.getMoreResultsLink(relatedTableName);

            browser.wait(EC.visibilityOf(relatedTableLink), browser.params.defaultTimeout);

            chaisePage.recordPage.getRelatedTableRows(relatedTableName).count().then(function(count) {
                expect(count).toBe(tableParams.page_size);
            });
        });

        it("should have a View More link for a related table that redirects to recordset.", function() {
            var relatedTableNameOnRecord = tableParams.related_associate_table,
                relatedTableNameOnRecordset = tableParams.related_linked_table
                relatedTableLink = chaisePage.recordPage.getMoreResultsLink(relatedTableNameOnRecord);

            expect(relatedTableLink.isDisplayed()).toBeTruthy();

            relatedTableLink.click().then(function() {
                return browser.driver.getCurrentUrl();
            }).then(function(url) {
                expect(url.indexOf('recordset')).toBeGreaterThan(-1);
                // check entity title is for related table, not asociation table
                return chaisePage.waitForElement(element(by.id("divRecordSet")));
            }).then(function() {
                expect(chaisePage.recordsetPage.getPageTitleElement().getText()).toBe(relatedTableNameOnRecordset);
            });
        });
    });
};


exports.relatedTableActions = function (testParams, tableParams) {

    var allWindows;

    it("action columns should show view button that redirects to the record page", function() {

        var relatedTableName = tableParams.related_associate_table; // association table
        var linkedToTableName = tableParams.related_linked_table; // linked to table
        var linkedToTableFilter = tableParams.related_linked_table_key_filter;

        chaisePage.recordPage.getRelatedTableRows(relatedTableName).then(function(rows) {
            return rows[0].all(by.tagName("td"));
        }).then(function(cell){
            return cell[0].all(by.css(".view-action-button"));
        }).then(function(actionButtons) {
            return actionButtons[0].click();
        }).then(function() {
            var result = '/record/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + linkedToTableName + "/" + linkedToTableFilter;
            chaisePage.waitForUrl(result, browser.params.defaultTimeout).finally(function() {
                expect(browser.driver.getCurrentUrl()).toContain(result);
                browser.navigate().back();
            });
        });
    });

    it("action columns should show edit button that redirects to the recordedit page", function() {

        var relatedTableName = tableParams.related_regular_table;
        var relatedTableKey = tableParams.related_regular_table_key_filter;

        var EC = protractor.ExpectedConditions;
        var e = element(by.id('rt-' + relatedTableName));
        browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);

        chaisePage.recordPage.getRelatedTableRows(relatedTableName).then(function(rows) {
            return rows[0].all(by.tagName("td"));
        }).then(function(cell) {
            return cell[0].all(by.css(".edit-action-button"));
        }).then(function(editButtons) {
            browser.sleep(1000);
            return editButtons[0].click();
        }).then(function() {
            return browser.getAllWindowHandles();
        }).then(function(handles) {
            allWindows = handles;
            return browser.switchTo().window(allWindows[1]);
        }).then(function() {
            var result = '/recordedit/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + relatedTableName + "/" + relatedTableKey;
            expect(browser.driver.getCurrentUrl()).toContain(result);
            browser.close();

            return browser.switchTo().window(allWindows[0]);
        });
    });

    it("action columns should show delete button that deletes record", function() {
        var deleteButton;
        var relatedTableName = tableParams.related_regular_table;
        var count, rowCells, oldValue;

        var EC = protractor.ExpectedConditions;
        var e = element(by.id('rt-' + relatedTableName));
        browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);

        var table = chaisePage.recordPage.getRelatedTable(relatedTableName);

        chaisePage.recordPage.getRelatedTableRows(relatedTableName).then(function(rows) {
            count = rows.length;
            return rows[count - 1].all(by.tagName("td"));
        }).then(function(cells) {
            rowCells = cells;
            return cells[1].getAttribute('innerHTML');
        }).then(function(cell) {
            oldValue = cell;
            return table.all(by.css(".delete-action-button"));
        }).then(function(deleteButtons) {
            count = deleteButtons.length;
            deleteButton = deleteButtons[count-1];
            return deleteButton.click();
        }).then(function() {
            var EC = protractor.ExpectedConditions;
            var confirmButton = chaisePage.recordPage.getConfirmDeleteButton();
            browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);

            return confirmButton.click();
        }).then(function() {
            browser.wait(EC.stalenessOf(rowCells[1]), browser.params.defaultTimeout);
        });
    });

    it("action columns should show unlink button that unlinks", function() {
        var deleteButton;
        var relatedTableName = tableParams.related_associate_table;
        var count, rowCells, oldValue;

        var table = chaisePage.recordPage.getRelatedTable(relatedTableName);

        chaisePage.recordPage.getRelatedTableRows(relatedTableName).then(function(rows) {
            count = rows.length;
            return rows[count - 1].all(by.tagName("td"));
        }).then(function(cells) {
            rowCells = cells;
            return cells[1].getAttribute('innerHTML');
        }).then(function(cell) {
            oldValue = cell;
            return table.all(by.css(".delete-action-button"))
        }).then(function(deleteButtons) {
            var count = deleteButtons.length;
            deleteButton = deleteButtons[count-1];
            return deleteButton.click();
        }).then(function() {
            var EC = protractor.ExpectedConditions;
            var confirmButton = chaisePage.recordPage.getConfirmDeleteButton();
            browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);

            return confirmButton.click();
        }).then(function() {
            browser.wait(function() {return rowCells[1].getAttribute('innerHTML') !== oldValue}, browser.params.defaultTimeout);
        })
    });

};
