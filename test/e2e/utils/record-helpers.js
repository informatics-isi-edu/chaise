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
