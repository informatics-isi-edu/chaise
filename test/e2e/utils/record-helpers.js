var chaisePage = require('../utils/chaise.page.js');
var mustache = require('../../../../ermrestjs/vendor/mustache.min.js');
var EC = protractor.ExpectedConditions;

exports.testPresentation = function (tableParams) {
    var pageReadyCondition = function () {
	    chaisePage.waitForElementInverse(element(by.id("spinner")));

	    // make sure the last related entity is visible
	    chaisePage.waitForElement(element(by.id('rt-accommodation_image')));
	};

    beforeAll(function () {
        pageReadyCondition();
    });

	it("should have '" + tableParams.title +  "' as title", function() {
        var title = chaisePage.recordPage.getEntityTitleElement();
		chaisePage.waitForElement(title);
        expect(title.getText()).toEqual(tableParams.title);
	});

	it("should have '" + tableParams.subTitle.toUpperCase() +"' as subTitle", function() {
        var subtitle = chaisePage.recordPage.getEntitySubTitleElement();
		chaisePage.waitForElement(subtitle);
        expect(subtitle.getText()).toEqual(tableParams.subTitle.toUpperCase());
	});

    it ("should have the correct table tooltip.", function () {
        expect(chaisePage.recordPage.getEntitySubTitleTooltip()).toBe(tableParams.tableComment);
    });

	it("should show " + tableParams.columns.filter(function(c) {return c.value != null;}).length + " columns only", function() {
        var columns = tableParams.columns.filter(function(c) {return c.value != null;});
		chaisePage.recordPage.getColumns().then(function(els) {
			// Check no of columns are same as needed
			expect(els.length).toBe(columns.length);
		});
	});

    it("should show the action buttons properly", function() {
        var editButton = chaisePage.recordPage.getEditRecordButton(),
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

    it("should validate the values of each column", function () {
        var columns = tableParams.columns.filter(function (c) { return c.value != null; });
        expect(element.all(by.className('entity-value')).count()).toEqual(columns.length, "length missmatch.");
        var index = -1, columnUrl, aTag;
        columns.forEach(function (column) {
			var errMessage = "value missmatch for column " + column.title;

            var columnEls;
            if (column.match=='html') {
                expect(chaisePage.recordPage.getEntityRelatedTableScope(column.title).getAttribute('innerHTML')).toBe(column.value, errMessage);
            } else if (column.title == 'User Rating'){
                expect(chaisePage.recordPage.getEntityRelatedTableScope('&lt;strong&gt;User&nbsp;Rating&lt;/strong&gt;',true).getAttribute('innerHTML')).toBe(column.value, errMessage);
            } else {
                columnEls = chaisePage.recordPage.getEntityRelatedTable(column.title);

                if (column.presentation && column.presentation.type == "url") {
                    chaisePage.recordPage.getLinkChild(columnEls).then(function (aTag) {
                        columnUrl = mustache.render(column.presentation.template, {
                            "catalog_id": process.env.catalogId,
                            "chaise_url": process.env.CHAISE_BASE_URL,
                        });

                        expect(aTag.getAttribute('href')).toEqual(columnUrl, errMessage + " for url");
                        expect(aTag.getText()).toEqual(column.value, errMessage + " for caption");
                    });
                } else if (column.type === "inline"){
                    expect(chaisePage.recordPage.getMarkdownContainer(columnEls).getAttribute('innerHTML')).toBe(column.value, errMessage);
                } else {
					expect(columnEls.getAttribute('innerText')).toBe(column.value, errMessage);
				}
        	}
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
		var key = tableParams.key;
		var expectedURL = browser.params.url + "/record/#" + browser.params.catalogId + "/product-record:" + tableParams.table_name + '/' + key.name + key.operator + key.value;
		var actualURL = element(by.id('permalink'));
		expect(actualURL.isDisplayed()).toBe(true);
		actualURL.getAttribute('href').then(function(url) {
			expect(url).toBe(expectedURL);
		});
	});

    it("should show related table names and their tables", function() {
        var displayName, tableCount, title,
            relatedTables = tableParams.related_tables;

        browser.wait(EC.not(EC.visibilityOf(chaisePage.recordPage.getLoadingElement())), browser.params.defaultTimeout);
        browser.wait(function() {
            return chaisePage.recordPage.getRelatedTablesWithPanelandHeading().count().then(function(ct) {
                return (ct=relatedTables.length);
            });
        }, browser.params.defaultTimeout);
        chaisePage.recordPage.getRelatedTablesWithPanelandHeading().count().then(function(count) {
            expect(count).toBe(relatedTables.length,'Mismatch in Related table count!');
            tableCount = count;

            // check the headings have the right name and in the right order
            return chaisePage.recordPage.getRelatedTableTitles();
        }).then(function(headings) {
            // tables should be in order based on annotation for visible foreign_keys
            // Headings have a '-' when page loads, and a count after them
            expect(headings).toEqual(tableParams.tables_order,"Order is not maintained for related tables!");

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
                            expect(headings[i]).toBe(title + " (showing first " + rowCount + " results)");
                        } else if (rowCount == 0) {
                            // All other tables should not have the + at the end its heading
                            expect(headings[i]).toBe(title + " (no results found)");
                        } else {
                            expect(headings[i]).toBe(title + " (showing all " + rowCount + " results)");
                        }
                    });
                })(i, displayName, title);
            }
        });
    });

    it("visible column related table should appear with action item in the entity area",function(){
        chaisePage.waitForElement(element(by.id('entity-booking'))).then(function(){
            return element(by.id('entity-4-markdown'));
        }).then(function(mdRecord){
            expect(mdRecord.isDisplayed()).toBeTruthy();
            return element(by.id('actionbar-4'));
        }).then( function(actionBar){
            expect(actionBar.getAttribute('innerText')).toBe('Edit  | Add  | View More\n','Action bar text did not match.');
            return browser.executeScript("return $('a.toggle-display-link').click()");
        }).then(function(editLink){
            return element(by.id('entity-4-recTab'));
        }).then(function (RecordTab) {
            expect(RecordTab.isDisplayed()).toBeTruthy();
            return element(by.id('entity-4-recTab')).element(by.tagName('tbody')).all(by.tagName('tr')).count();
        }).then(function (recordRowsCount){
            expect(recordRowsCount).toBe(2,'Record row count in booking table is incorrect.');
        }).catch(function(err){
            console.log(err);
            expect('Encountered an error').toBe('Please check the log', 'Inside catch block');
        })
    });

    it("click event on image_id in inline display should open new tab with file details",function(){
        var allHandle;
        chaisePage.waitForElement(element(by.id('entity-booking'))).then(function(){
          // This selector captures link of first record under image_id column of booking inline entry in
          // accommodation table of product-record schema with id 2002;
            return browser.executeScript("return $('#divRecordSet  td:nth-child(5) a')");
        }).then(function(imageLinks){
            browser.executeScript("return window.open(arguments[0], '_blank')", imageLinks[0]);
            return browser.getAllWindowHandles();
        }).then(function (handles){
            allHandle = handles;
            browser.switchTo().window(allHandle[1]);
            chaisePage.waitForElement(chaisePage.recordPage.getEntityTitleElement());
            return chaisePage.recordPage.getEntityTitle();
        }).then(function (pageTitle) {
            expect(pageTitle).toBe("3,005", "Page title did not match. Invalid image id");
            return chaisePage.recordPage.getEntitySubTitle();
        }).then(function (pageSubTitle){
            expect(pageSubTitle).toBe("file", "Page subtitle did not match. Invalid image id");
            browser.close();
            browser.switchTo().window(allHandle[0]);
        }).catch(function(err){
            console.log(err);
            expect('Encountered an error').toBe('Please check the log', 'Inside catch block');
            browser.close();
            browser.switchTo().window(allHandle[0]);
        })
    });

    it("visible column related table with inline inbound fk should display 'None' in markdown display mode if no data was found.",function(done){
        var EC = protractor.ExpectedConditions,
            markdownEntity = element(by.id('entity-4-markdown')), //TODO this should be a function, it's also is assuming the order
            bookingName = "booking";

		var confirmButton = chaisePage.recordPage.getConfirmDeleteButton();
		var getRowDeleteBtn = function (index) {
			return chaisePage.recordPage.getRelatedTableRowDelete(bookingName, index, true);
		}

		chaisePage.waitForElement(element(by.id("rt-" + bookingName)));

		// delete the first row
        chaisePage.clickButton(getRowDeleteBtn(0)).then(function(){
			browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);
			return confirmButton.click();
        }).then(function () {
			chaisePage.waitForElementInverse(element(by.id("spinner")));

			// delete the other row
            return chaisePage.clickButton(getRowDeleteBtn(0));
        }).then(function () {
			browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);
			return chaisePage.clickButton(confirmButton);
		}).then(function () {
			chaisePage.waitForElementInverse(element(by.id("spinner")));

			// make sure there are zero rows
            browser.wait(function() {
                return chaisePage.recordPage.getRelatedTableRows(bookingName).count().then(function(ct) {
                    return (ct==0);
                });
            }, browser.params.defaultTimeout);

			// switch the display mode
			return chaisePage.clickButton(chaisePage.recordPage.getToggleDisplayLink(bookingName, true));
        }).then(function(){
            browser.wait(EC.visibilityOf(markdownEntity), browser.params.defaultTimeout);
            expect(markdownEntity.getText()).toBe('None',"Incorrect text for empty markdown!");
			done();
        }).catch(function(err){
            console.log(err);
            done.fail();
        });
    });

    it("empty inline inbound fks should disappear when 'Hide All Related Records' was clicked.",function(done){
        var showAllRTButton = chaisePage.recordPage.getShowAllRelatedEntitiesButton();

		chaisePage.clickButton(showAllRTButton).then(function () {
			expect(chaisePage.recordPage.getEntityRelatedTable("booking").isPresent()).toBeFalsy();
			return chaisePage.clickButton(showAllRTButton);
		}).then(function () {
			done();
		}).catch(function(err){
            console.log(err);
            done.fail();
        });
    });

    // Related tables are contextualized with `compact/brief`, but if that is not specified it will inherit from `compact`
    it("should honor the page_size annotation for the table, file, in the compact context based on inheritance.", function() {
        var relatedTableName = tableParams.related_table_name_with_page_size_annotation;

        chaisePage.recordPage.getRelatedTableRows(relatedTableName).count().then(function(count) {
            expect(count).toBe(tableParams.page_size);
        });
    });

    it("clicking the related table heading should change the heading and hide the table.", function(done) {
        var relatedTable = tableParams.related_tables[0];
        var displayName = relatedTable.title;
        var tableHeading = chaisePage.recordPage.getRelatedTableHeading(displayName),
            tableElement = chaisePage.recordPage.getRelatedTable(displayName);

		// TODO this test is using too many css classes which should be functions in chaise.page.js
        tableHeading.element(by.css('.glyphicon')).getAttribute('class').then(function(cssClass) {
            // related table should be open by default
            expect(cssClass).toContain('glyphicon-chevron-down');

            return tableHeading.getAttribute("class");
        }).then(function(attribute) {
            expect(attribute).toMatch("panel-open");
            chaisePage.waitForElement(element(by.css(".accordion-toggle")));
            return chaisePage.clickButton(tableHeading.element(by.css(".accordion-toggle")));
        }).then(function() {
            return tableHeading.getAttribute("heading");
        }).then(function(heading) {
            // related table should be closed now and a '+' should be shown instead of a '-'
            expect(tableHeading.element(by.css('.glyphicon')).getAttribute('class')).toContain('glyphicon-chevron-right');
            return tableHeading.getAttribute("class");
        }).then(function(attribute) {
            expect(attribute).not.toMatch("panel-open");
			done();
        }).catch(function (err) {
			console.log(err);
			done.fail();
		})
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
            return chaisePage.recordPage.getNoResultsRow(tableDisplayname);
        }).then(function(emptyTab) {
            expect(emptyTab.getText()).toBe(noResultsMessage);
            return showAllRTButton.click();
        }).then(function() {
            expect(chaisePage.recordPage.getRelatedTable(tableDisplayname).isPresent()).toBeFalsy();
        }).catch(function(error) {
            console.log(error);
        });
    });

	describe("regarding inline related entities, ", function () {
		beforeAll(function () {
			// make sure page is in its initial state
			browser.driver.navigate().refresh();
		});

		for (var i = 0; i < tableParams.inline_columns.length; i++) {
			var p = tableParams.inline_columns[i];
			describe ("for " + p.title + ", ", function (){
				exports.testRelatedTable(p, pageReadyCondition);
			});

		}
	});

};

/**
 * required attributes:
 * name
 * schemaName
 * displayname
 * count
 * canEdit
 * canCreate
 * canDelete
 * optional attributes:
 * isAssociation
 * isMarkdown
 * isInline
 * isTableMode
 * viewMore:
 *  - name
 *  - displayname
 *  - filter
 * rowValues
 * rowViewPaths
 * markdownValue
 * page_size (default 25)
 *
 *
 * testAdd
 * testEdit
 * testDelete
 */
exports.testRelatedTable = function (params, pageReadyCondition) {
	var currentEl, markdownToggleLink, toggled = false;
	beforeAll(function() {
		pageReadyCondition();

		if (params.isInline) {
			currentEl = chaisePage.recordPage.getEntityRelatedTable(params.displayname);
		} else {
			currentEl = chaisePage.recordPage.getRelatedTableHeading(params.displayname);
		}

		markdownToggleLink = chaisePage.recordPage.getToggleDisplayLink(params.displayname, params.isInline);
	});

	var testHeading = function (count, page_size) {
		page_size = page_size || 25;

		var heading = chaisePage.recordPage.getRelatedTableHeadingTitle(params.displayname);
		var title = params.displayname;
		if (count === 0) {
			title += " (no results found)";
	    } else if (count < page_size) {
			title += " (showing all " + count + " results)";
		} else {
			title += " (showing first " + page_size + " results)"
		}
		expect(heading.getText()).toBe(title, "heading missmatch.");
	};

	if (!params.isInline) {
		it ("title should be correct.", function () {
			testHeading(params.count, params.page_size);
		});
	}

	describe("regarding table level actions, ", function () {

		// View More
		describe("`View More` button, ", function () {
			var viewMoreBtn;
			beforeAll(function () {
				viewMoreBtn = chaisePage.recordPage.getMoreResultsLink(params.displayname, params.isInline);
				browser.wait(EC.elementToBeClickable(viewMoreBtn), browser.params.defaultTimeout);
			});

			it ('should be displayed.', function () {
				expect(viewMoreBtn.isDisplayed()).toBeTruthy("view more is not visible.");
			});

			if (params.viewMore){
				it ("should always go to recordset app with correct set of filters.", function (done) {
					chaisePage.clickButton(viewMoreBtn).then(function () {
						return browser.driver.getCurrentUrl();
					}).then(function(url) {
                        expect(url.indexOf('recordset')).toBeGreaterThan(-1, "didn't go to recordset app");
                        return chaisePage.waitForElement(element(by.id("divRecordSet")));
                    }).then(function() {
                        expect(chaisePage.recordsetPage.getPageTitleElement().getText()).toBe(params.viewMore.displayname, "title missmatch.");
                        expect(chaisePage.recordsetPage.getFacetFilters().isPresent()).toBe(true, "filter was not present");
                        expect(chaisePage.recordsetPage.getFacetFilters().first().getText()).toEqual(params.viewMore.filter, "filter missmatch.");
						browser.navigate().back();
						pageReadyCondition();
						done();

					}).catch(function (err) {
                        browser.navigate().back();
						pageReadyCondition();
						done.fail(err);
					})
				});
			}
		});

		// Display Mode
		describe("view mode and rows, ", function () {

			if (params.isMarkdown || params.isInline) {
				it ("markdown container must be visible.", function () {
					expect(currentEl.element(by.css('.markdown-container')).isDisplayed()).toBeTruthy("didn't have markdown");
				});

				if (params.markdownValue) {
					it ("correct markdown values should be visible.", function () {
						expect(currentEl.element(by.css('.markdown-container')).getAttribute('innerHTML')).toEqual(params.markdownValue)
					});
				}

				if (params.canEdit) {
					it ("`Edit` button should be visible to switch to tabular mode.", function () {
						// revert is `Display`
						expect(markdownToggleLink.isDisplayed()).toBeTruthy();
						expect(markdownToggleLink.getText()).toBe("Edit");
					});
				} else {
					it ("`Table Display` button should be visible to switch to tabular mode.", function () {
						// revert is `Revert Display`
						expect(markdownToggleLink.isDisplayed()).toBeTruthy();
						expect(markdownToggleLink.getText()).toBe("Table Display");
					});
				}

				it ("clicking on the toggle should change the view to tabular.", function (done) {
					chaisePage.clickButton(markdownToggleLink).then(function() {
						if (params.canEdit) {
							expect(markdownToggleLink.getText()).toBe("Display", "after toggle button missmatch.");
						} else {
							expect(markdownToggleLink.getText()).toBe("Revert Display", "after toggle button missmatch.");
						}

						//TODO make sure table is visible
						toggled = true;
						done();
					}).catch(function(error) {
						console.log(error);
						done.fail();
					});
				});

			} else {
				it ("option for different display modes should not be presented to user.", function () {
					expect(markdownToggleLink.isPresent()).toBe(false);
				});
			}

			if (params.rowValues) {
				// since we toggled to row, the data should be available.
				it ("rows of data should be correct and respect the given page_size.", function (done) {
					chaisePage.recordPage.getRelatedTableRows(params.displayname, params.isInline).then(function (rows) {
						expect(params.rowValues.length).toBe(params.rowValues.length, "rows length missmatch.");
						if (rows.length === 0) {
							done();
						}
						rows.forEach(function (row, index) {
							row.all(by.tagName("td")).then(function (cells) {
								expect(cells.length).toBe(params.rowValues[index].length + 1, "number of column are not as expected.");
								params.rowValues[index].forEach(function (expectedRow, columnIndex) {
									if (typeof expectedRow === "object" && expectedRow.url) {
										expect(cells[columnIndex+1].element(by.tagName("a")).getAttribute("href")).toContain(expectedRow.url, "link missmatch for row=" + index + ", columnIndex=" + columnIndex);
										expect(cells[columnIndex+1].element(by.tagName("a")).getText()).toBe(expectedRow.caption, "caption missmatch for row=" + index  + ", columnIndex=" + columnIndex);
									} else {
										expect(cells[columnIndex+1].getText()).toBe(expectedRow, "missmatch for row=" + index  + ", columnIndex=" + columnIndex);
									}
								});
								done();
							}).catch(function (err) {
								throw err;
							});
						});
					}).catch(function(error) {
						console.log(error);
						done.fail();
					});
				});
			}
		});

		if (typeof params.canCreate === "boolean") {
			it ("`Add` button should be " + (params.canCreate ? "visible." : "invisible."), function () {
				var addBtn = chaisePage.recordPage.getAddRecordLink(params.displayname, params.isInline);
				expect(addBtn.isPresent()).toBe(params.canCreate);
			});
		 }
	});

	// in our test cases we are changing the view to tabular
	describe("regarding row level actions, ", function () {

		if (params.rowViewPaths) {
			it ("'View Details' button should have the correct link.", function () {
				var expected = '/record/#' + browser.params.catalogId + "/" + params.schemaName + ":" + (params.isAssociation ? params.relatedName : params.name) + "/";
				params.rowViewPaths.forEach(function (row, index) {
					var btn = chaisePage.recordPage.getRelatedTableRowLink(params.displayname, index, params.isInline);
					expect(btn.getAttribute('href')).toContain(expected + params.rowViewPaths[index], "link missmatch for index=" + index);
				});
			});
		}

		if (typeof params.canEdit === "boolean") {
			if (!params.canEdit) {
				it ("edit button should not be visible.", function () {
					expect(currentEl.all(by.css(".edit-action-button")).isPresent()).not.toBeTruthy();
				});
			} else if (params.rowViewPaths || params.rowEditPaths) {
				it ("clicking on 'edit` button should open a tab to recordedit page.", function (done) {
					var btn = chaisePage.recordPage.getRelatedTableRowEdit(params.displayname, 0, params.isInline);

					expect(btn.isDisplayed()).toBeTruthy("edit button is missing.");
					chaisePage.clickButton(btn).then(function () {
						return browser.getAllWindowHandles();
					}).then(function(handles) {
						allWindows = handles;
						return browser.switchTo().window(allWindows[1]);
					}).then(function() {
						var result = '/recordedit/#' + browser.params.catalogId + "/" + params.schemaName + ":" + params.name;

						// in case of association edit and view are different
						result += "/" + (params.rowEditPaths ? params.rowEditPaths[0] : params.rowViewPaths[0]);

						expect(browser.driver.getCurrentUrl()).toContain(result, "expected link missmatch.");
						browser.close();
						return browser.switchTo().window(allWindows[0]);
					}).then(function (){
						done();
					}).catch(function (err) {
						console.log(err);
						done.fail();
					});
				});
			}
		}

		if (typeof params.canDelete === "boolean") {
			describe("`Delete` or `Unlink` button, ", function () {
				var deleteBtn;
				beforeAll(function () {
					deleteBtn = chaisePage.recordPage.getRelatedTableRowDelete(params.displayname, 0, params.isInline);
				})
				if (params.canDelete) {
					it ('should be visible.', function () {
						expect(deleteBtn.isDisplayed()).toBeTruthy("delete button is missing.");
					});

					if (params.isAssociation) {
						it ("button tooltip should be `Unlink`.", function () {
							expect(deleteBtn.getAttribute("uib-tooltip")).toBe("Unlink");
						});
					} else {
						it ("button tooltip be `Delete`.", function () {
							expect(deleteBtn.getAttribute("uib-tooltip")).toBe("Delete");
						});
					}

					it ("it should update the table and title after confirmation.", function (done) {
						var currentCount;
						chaisePage.recordPage.getRelatedTableRows(params.displayname, params.isInline).count().then(function (count) {
							currentCount = count;
							return chaisePage.clickButton(deleteBtn);
						}).then(function () {
							var confirmButton = chaisePage.recordPage.getConfirmDeleteButton();
		                    browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);

							return confirmButton.click();
						}).then(function () {
							chaisePage.waitForElementInverse(element(by.id("spinner")));
							return chaisePage.recordPage.getRelatedTableRows(params.displayname, params.isInline).count();
						}).then(function (count) {
							expect(count).toBe(currentCount-1, "count didn't change.");
							testHeading(count, params.page_size);
							done();
						}).catch(function (err) {
							console.log(err);
							done.fail();
						})
					});

				} else {
					it ("should not be visible.", function () {
						expect(deleteBtn.isDisplayed()).toBe(false, "delete button was visible.");
					});
				}
			});
		}
	});

	// if it was markdown, we are changing the view, change it back.
	afterAll(function (done) {
		if (toggled) {
			chaisePage.clickButton(markdownToggleLink).then(function() {
				done();
			}).catch(function(error) {
				console.log(error);
				done.fail();
			});
		} else {
			done();
		}
	});
};

/**
 * required attributes:
 *  - tableName
 *  - schemaName
 *  - relatedDisplayname
 *  - tableDisplayname
 *  - columnDisplayname
 *  - columnValue
 */
exports.testAddRelatedTable = function (params, inputCallback) {
	describe("Add feature, ", function () {
		it ("clicking on `Add` button should open recordedit.", function (done) {
			var addBtn = chaisePage.recordPage.getAddRecordLink(params.relatedDisplayname);
			var recordeditUrl = browser.params.url + '/recordedit/#' + browser.params.catalogId + "/" +
								params.schemaName + ":" + params.tableName;

			expect(addBtn.isDisplayed()).toBeTruthy("add button is not displayed");
			chaisePage.clickButton(addBtn).then(function () {
				// This Add link opens in a new tab so we have to track the windows in the browser...
				return browser.getAllWindowHandles();
			}).then(function(handles) {
				allWindows = handles;
				// ... and switch to the new tab here...
				return browser.switchTo().window(allWindows[1]);
			}).then(function() {
				return chaisePage.waitForElement(element(by.id('submit-record-button')));
			}).then(function() {

				browser.wait(function () {
					return browser.driver.getCurrentUrl().then(function(url) {
						return url.startsWith(recordeditUrl);
					});
				}, browser.params.defaultTimeout);

				// ... and then get the url from this new tab...
				return browser.driver.getCurrentUrl();
			}).then(function(url) {
				expect(url.indexOf('?prefill=')).toBeGreaterThan(-1, "didn't have prefill");

				var title = chaisePage.recordEditPage.getFormTitle().getText();
				expect(title).toBe("Create Record", "recordedit title missmatch.")

				done();
			}).catch(function (err) {
				console.log(err);
				done.fail();
			});
		});

		it ("the opened form should have the prefill value for foreignkey.", function () {
			var fkInput = chaisePage.recordEditPage.getForeignKeyInputDisplay(params.columnDisplayname, 0);
			expect(fkInput.getText()).toBe(params.columnValue, "value missmatch");
			expect(fkInput.getAttribute('disabled')).toBe('true', "column was enabled.");
		});

		it ("submitting the form and coming back to recordset page should update the related table.", function (done) {
			inputCallback().then(function () {
				return chaisePage.recordEditPage.submitForm();
			}).then(function() {
				// wait until redirected to record page
				browser.wait(EC.presenceOf(element(by.id('page-title'))), browser.params.defaultTimeout);
				browser.close();
				browser.switchTo().window(allWindows[0]);

				//TODO should check for the updated value.
				done();
			}).catch(function(error) {
				console.log(error);
				done.fail();
			});
		});
	});
};

/**
 * - relatedDisplayname
 * - tableDisplayname
 * - totalCount
 * - existingCount
 * - disabledRows
 * - selectIndex
 */
exports.testAddAssociationTable = function (params, pageReadyCondition) {
	describe("Add feature, ", function () {
		it ("clicking on `Add` button should open up a modal.", function (done) {
			var addBtn = chaisePage.recordPage.getAddRecordLink(params.relatedDisplayname);
			chaisePage.clickButton(addBtn).then(function () {
				chaisePage.waitForElement(chaisePage.recordEditPage.getModalTitle());
				return chaisePage.recordEditPage.getModalTitle().getText();
			}).then(function (title) {
				expect(title).toBe("Choose " + params.tableDisplayname, "title missmatch.");

				browser.wait(function () {
					return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
						return (ct == params.totalCount);
					});
				});

				return chaisePage.recordsetPage.getModalRows().count();
			}).then(function(ct){
				expect(ct).toBe(params.totalCount, "association count missmatch.");
				done();
			}).catch(function(error) {
				console.log(error);
				done.fail();
			});
		});

		it ("current values must be disabled.", function (done) {
			chaisePage.recordPage.getModalDisabledRows().then(function (disabledRows) {
				expect(disabledRows.length).toBe(params.disabledRows.length, "disabled length missmatch.");


				// go through the list and check their first column (which is the id)
				disabledRows.forEach(function (r, index) {
					r.findElement(by.css("td:not(.actions-layout)")).then(function (el) {
						expect(el.getText()).toMatch(params.disabledRows[index], "missmatch disabled row index=" + index);
					});
				});

				done();
			}).catch(function(error) {
				console.log(error);
				done.fail();
			});
		});

		it ("user should be able to select new values and submit.", function (done) {
			var inp = chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(params.selectIndex);
			chaisePage.clickButton(inp).then(function (){
				return chaisePage.clickButton(chaisePage.recordsetPage.getModalSubmit());
			}).then(function () {
				browser.wait(EC.presenceOf(element(by.id('page-title'))), browser.params.defaultTimeout);
				//TODO this is refreshing the page which it shouldn't
				//TODO we should check the value and not just count
				browser.driver.navigate().refresh();
				pageReadyCondition();

				browser.wait(function() {
					return chaisePage.recordPage.getRelatedTableRows(params.relatedDisplayname).count().then(function(ct) {
						return ct == params.existingCount + 1;
					});
				}, browser.params.defaultTimeout);

				return chaisePage.recordPage.getRelatedTableRows(params.relatedDisplayname).count();
			}).then(function (count){
				expect(count).toBe(params.existingCount + 1);
				done();
			}).catch(function(error) {
				console.log(error);
				done.fail();
			});
		});

	});
};
