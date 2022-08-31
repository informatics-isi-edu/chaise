var pImport =  require('../utils/protractor.import.js');
var chaisePage = require('../utils/chaise.page.js');
var mustache = require('../../../../ermrestjs/vendor/mustache.min.js');
var fs = require('fs');
var EC = protractor.ExpectedConditions;

exports.testPresentation = function (tableParams) {
    var notNullColumns = tableParams.columns.filter(function (c) { return !c.hasOwnProperty("value") || c.value != null; });
    var pageReadyCondition = function () {
        chaisePage.waitForElementInverse(element(by.id("spinner")));

        // make sure the last related entity is visible
        chaisePage.waitForElementInverse(element(by.id('rt-loading')));

        chaisePage.waitForAggregates();
    };

    beforeAll(function () {
        pageReadyCondition();
    });

    it("should have '" + tableParams.title +  "' as title", function() {
        var title = chaisePage.recordPage.getEntityTitleElement();
        chaisePage.waitForElement(title);
        expect(title.getText()).toEqual(tableParams.title);
    });

    it("should have '" + tableParams.subTitle +"' as subTitle", function() {
        var subtitle = chaisePage.recordPage.getEntitySubTitleElement();
        chaisePage.waitForElement(subtitle);
        expect(subtitle.getText()).toEqual(tableParams.subTitle);
    });

    it ("should have the correct table tooltip.", function () {
        expect(chaisePage.recordPage.getEntitySubTitleTooltip()).toBe(tableParams.tableComment);
    });

    it ("should have the correct head title using the heuristics for record app", function (done) {
        browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
            // <table-name>: <row-name> | chaiseConfig.headTitle
            // NOTE: subTitle and title are badly named
            expect(browser.getTitle()).toBe(tableParams.subTitle + ": " + tableParams.title + " | " + chaiseConfig.headTitle);

            done();
        }).catch(function (err) {
            console.log(err);
            done.fail();
        });
    });

    it("should show " +notNullColumns.length + " columns only", function() {
        expect(chaisePage.recordPage.getColumns().count()).toBe(notNullColumns.length);
    });

    it("should show the action buttons properly", function() {
        var editButton = chaisePage.recordPage.getEditRecordButton(),
            createButton = chaisePage.recordPage.getCreateRecordButton(),
            deleteButton = chaisePage.recordPage.getDeleteRecordButton(),
            // TODO: change once record app migrated
            exportButton = chaisePage.recordsetPage.getAngularExportDropdown(),
            showAllRTButton = chaisePage.recordPage.getShowAllRelatedEntitiesButton(),
            shareButton = chaisePage.recordPage.getShareButton();

        browser.wait(EC.elementToBeClickable(editButton), browser.params.defaultTimeout);
        browser.wait(EC.elementToBeClickable(createButton), browser.params.defaultTimeout);
        browser.wait(EC.elementToBeClickable(deleteButton), browser.params.defaultTimeout);
        browser.wait(EC.elementToBeClickable(showAllRTButton), browser.params.defaultTimeout);
        browser.wait(EC.elementToBeClickable(exportButton), browser.params.defaultTimeout);
        browser.wait(EC.elementToBeClickable(shareButton), browser.params.defaultTimeout);

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

        exportButton.isDisplayed().then(function (bool) {
            expect(bool).toBeTruthy();
        });

        shareButton.isDisplayed().then(function (bool) {
            expect(bool).toBeTruthy();
        });
    });

    exports.testSharePopup(tableParams.sharePopupParams);

    it("should have '2' options in the dropdown menu.", function (done) {
        // TODO: change once record app migrated
        var exportButton = chaisePage.recordsetPage.getAngularExportDropdown();
        browser.wait(EC.elementToBeClickable(exportButton), browser.params.defaultTimeout);

        chaisePage.clickButton(exportButton).then(function () {
            // TODO: change once record app migrated
            expect(chaisePage.recordsetPage.getAngularExportOptions().count()).toBe(2, "incorrect number of export options");
            // close the dropdown
            return exportButton.click();
        }).then(function () {
            done();
        }).catch(function (err) {
            console.log(err);
            done.fail();
        });
    });

    if (!process.env.CI) {
        it("should have 'This record (CSV)' as a download option and download the file.", function(done) {
            // TODO: change once record app migrated
            chaisePage.recordsetPage.getAngularExportDropdown().click().then(function () {
                var csvOption = chaisePage.recordsetPage.getExportOption("This record (CSV)");
                expect(csvOption.getText()).toBe("This record (CSV)");
                return csvOption.click();
            }).then(function () {
                browser.wait(function() {
                    return fs.existsSync(process.env.PWD + "/test/e2e/" + tableParams.file_names[0]);
                }, browser.params.defaultTimeout).then(function () {
                    done();
                }, function () {
                    expect(false).toBeTruthy("Accommodations.csv was not downloaded");
                    done.fail();
                });
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it("should have 'BDBag' as a download option and download the file.", function(done) {
            // TODO: change once record app migrated
            chaisePage.recordsetPage.getAngularExportDropdown().click().then(function () {
                var bagOption = chaisePage.recordsetPage.getExportOption("BDBag");
                expect(bagOption.getText()).toBe("BDBag");
                return bagOption.click();
            }).then(function () {
                return chaisePage.waitForElement(chaisePage.recordsetPage.getExportModal());
            }).then(function () {
                return chaisePage.waitForElementInverse(chaisePage.recordsetPage.getExportModal());
            }).then(function () {
                browser.wait(function() {
                    return fs.existsSync(process.env.PWD + "/test/e2e/" + tableParams.file_names[1]);
                }, browser.params.defaultTimeout).then(function () {
                    done();
                }, function () {
                    expect(false).toBeTruthy("accommodation.zip was not downloaded");
                    done.fail();
                });
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });
    }

    it("should render columns which are specified to be visible and in order", function() {
        chaisePage.recordPage.getAllColumnCaptions().then(function(pageColumns) {
            expect(pageColumns.length).toBe(notNullColumns.length);
            var index = 0;
            pageColumns.forEach(function(c) {
                var col = notNullColumns[index++];
                expect(c.getText()).toEqual(col.title);
            });
        });
    });

    it("should show line under columns which have a comment and inspect the comment value too", function() {
        var columns = notNullColumns.filter(function(c) {
            return (typeof c.comment == 'string');
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

    it("should show inline comment for inline table with one defined", function () {
        expect(chaisePage.recordPage.getInlineRelatedTableInlineComment(tableParams.inlineTableWithCommentName).getText()).toBe(tableParams.inlineTableComment, "inline comment is not correct");
    });

    it("should render columns based on their markdown pattern.", function(done) {
        var columns = tableParams.columns.filter(function(c) {return c.markdown_title;});
        chaisePage.recordPage.getColumnCaptionsWithHtml().then(function(pageColumns) {
            expect(pageColumns.length).toBe(columns.length, "number of captions with markdown name doesn't match.");
            pageColumns.forEach(function(c, i) {
                var col = columns[i];
                c.getAttribute("innerHTML").then(function(html) {
                    expect(html).toBe(col.markdown_title, "invalid name for column `" +  col.title + "`.");
                    if (i === pageColumns.length - 1) done();
                }).catch(function (err) {
                    done.fail(err);
                })
            });
        }).catch(function (err) {
            done.fail(err);
        })
    });

    it("should validate the values of each column", function () {
        expect(element.all(by.className('entity-value')).count()).toEqual(notNullColumns.length, "length missmatch.");
        var index = -1, columnUrl, aTag;
        notNullColumns.forEach(function (column) {
            if (!column.hasOwnProperty("value")) {
                return;
            }

            var errMessage = "value mismatch for column " + column.title;

            var columnEls;
            if (column.type=='inline') {
                // get the value at row 5 of the table list of values
                columnEls = chaisePage.recordPage.getEntityRelatedTable(column.title);
                expect(chaisePage.recordPage.getMarkdownContainer(columnEls).getAttribute('innerHTML')).toContain(column.value, errMessage);
            } else if (column.match=='html') {
                expect(chaisePage.recordPage.getEntityRelatedTableScope(column.title).getAttribute('innerHTML')).toBe(column.value, errMessage);
            } else if (column.title == 'User Rating'){
                expect(chaisePage.recordPage.getEntityRelatedTableScope('<strong>User Rating</strong>').getAttribute('innerHTML')).toBe(column.value, errMessage);
            } else {
                columnEls = chaisePage.recordPage.getEntityRelatedTable(column.title);
                if (column.presentation) {
                    if (column.presentation.type === "inline") columnEls = chaisePage.recordPage.getMarkdownContainer(columnEls);

                    chaisePage.recordPage.getLinkChild(columnEls).then(function (aTag) {
                        var dataRow = chaisePage.getEntityRow("product-record", column.presentation.table_name, column.presentation.key_value);
                        columnUrl = mustache.render(column.presentation.template, {
                            "catalog_id": process.env.catalogId,
                            "chaise_url": process.env.CHAISE_BASE_URL,
                        });
                        columnUrl += "RID=" + dataRow.RID;

                        expect(aTag.getAttribute('href')).toContain(columnUrl, errMessage + " for url");
                        expect(aTag.getText()).toEqual(column.value, errMessage + " for caption");
                    });
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
                        var index = 0, systemColumns = ["RID", "RCT", "RMT", "RCB", "RMB"];
                        for (var j = 0; j < columnNames.length; j++) {
                            if (systemColumns.indexOf(columnNames[j]) === -1) {
                                expect(columnNames[j]).toBe(relatedTables[i].columns[index]);
                                index++;
                            }
                        }

                        // verify all rows are present
                        return chaisePage.recordPage.getRelatedTableRows(displayName).count();
                    }).then(function(rowCount) {
                        expect(rowCount).toBe(relatedTables[i].data.length);
                        expect(headings[i]).toBe(title);
                    });
                })(i, displayName, title);
            }
        });
    });

    it("visible column related table with inline inbound fk should display 'None' in markdown display mode if no data was found.",function(done){
        var EC = protractor.ExpectedConditions,
            markdownEntity = element(by.id('entity-4-markdown')), //TODO this should be a function, it's also is assuming the order
            bookingName = "booking";

        var confirmButton = chaisePage.recordPage.getConfirmDeleteButton();
        var getRowDeleteBtn = function (index) {
            return chaisePage.recordPage.getRelatedTableRowDelete(bookingName, index, true);
        }

        browser.executeScript("return $('.toggle-display-link')[0].click()").then(function () {
            return chaisePage.waitForElement(element(by.id('entity-booking')))
        }).then(function () {
            return chaisePage.waitForElement(element(by.id("rt-" + bookingName)));
        }).then(function () {
            // delete the first row
            return chaisePage.clickButton(getRowDeleteBtn(0));
        }).then(function () {
            browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);
            return chaisePage.clickButton(confirmButton);
        }).then(function () {
            chaisePage.waitForElementInverse(element(by.id("spinner")));

            // make sure there is 1 row
            browser.wait(function() {
                return chaisePage.recordPage.getRelatedTableRows(bookingName).count().then(function(ct) {
                    return (ct==1);
                });
            }, browser.params.defaultTimeout);

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
            return chaisePage.recordPage.getToggleDisplayLink(bookingName, true).click();
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
        var displayName = tableParams.related_tables[0].title;
        var rtAccordion = chaisePage.recordPage.getRelatedTableAccordion(displayName),
            panelHeading = chaisePage.recordPage.getRelatedTableHeading(displayName),
            panelSectionHeader = chaisePage.recordPage.getRelatedTableSectionHeader(displayName).element(by.tagName('i'));

        // related table should be open by default
        expect(panelSectionHeader.getAttribute('class')).toContain('fa-chevron-down');

        expect(rtAccordion.getAttribute("class")).toMatch("panel-open");

        chaisePage.waitForElement(element(by.css(".accordion-toggle")))

        chaisePage.clickButton(panelHeading.element(by.css(".accordion-toggle"))).then(function() {
            expect(panelSectionHeader.getAttribute('class')).toContain('fa-chevron-right');
            expect(rtAccordion.getAttribute("class")).not.toMatch("panel-open");

            done();
        }).catch(function (err) {
            console.log(err);
            done.fail();
        })
    });

    // There is a media table linked to accommodations but this accommodation (Sheraton Hotel) doesn't have any media
    it("should show and hide a related table with zero values upon clicking a link to toggle visibility of related entities", function(done) {
        var showAllRTButton = chaisePage.recordPage.getShowAllRelatedEntitiesButton(),
            tableDisplayname = "<strong>media</strong>",
            noResultsMessage = "No Results Found";
         chaisePage.clickButton(showAllRTButton).then(function() {
            expect(chaisePage.recordPage.getRelatedTable(tableDisplayname).isDisplayed()).toBeFalsy("first click: didn't hide.");
            return  chaisePage.clickButton(showAllRTButton);
        }).then(function() {
            // empty related table should show
            expect(chaisePage.recordPage.getRelatedTable(tableDisplayname).isDisplayed()).toBeTruthy("second click: didn't show.");
            //check the no results text appears properly
            return chaisePage.recordPage.getNoResultsRow(tableDisplayname);
        }).then(function(emptyTab) {
            expect(emptyTab.getText()).toBe(noResultsMessage, "message missmatch.");
            return  chaisePage.clickButton(showAllRTButton);
        }).then(function() {
            expect(chaisePage.recordPage.getRelatedTable(tableDisplayname).isDisplayed()).toBeFalsy("third click: didn't hide.");
            done();
        }).catch(function(error) {
            done.fail(error);
        });
    });

    it("should show the related table names in the correct order in the Table of Contents (including inline)", function () {
        expect(chaisePage.recordPage.getSidePanelTableTitles()).toEqual(tableParams.tocHeaders, "list of related tables in toc is incorrect");
    });

    describe("regarding inline related entities, ", function () {
        beforeAll(function () {
            // make sure page is in its initial state
            browser.driver.navigate().refresh();
        });
        for (var i = 0; i < tableParams.inline_columns.length; i++) {
            var p = tableParams.inline_columns[i];
            p.baseTable = tableParams.subTitle;

            // (function (params) {
                describe ("for " + p.title + ", ", function () {
                    exports.testRelatedTable(p, pageReadyCondition);
                });
            // })(p);
        }
    });
};


/**
 * opens the share and cite popup and test the content. The acceptable input:
 * {
 *   permalink: "the permalink", // required
 *   hasVersionedLink: boolean, // whether versioned link is present or not
 *   verifyVersionedLink: boolean, // if true, we will test the versioned link too.
 *   citation: string, // (optional) pass null if citation should not be displayed.
 *   bintextFile: string, // (optional) the location of the bibtext file so we can delete it after downloading it
 * }
 */
exports.testSharePopup = function (sharePopupParams) {
    describe("for share & citation dialog,", function () {

        beforeAll(function (done) {
            var shareButton = chaisePage.recordPage.getShareButton(),
                shareModal = chaisePage.recordPage.getShareModal();

            browser.wait(EC.elementToBeClickable(shareButton), browser.params.defaultTimeout).then(function () {
                return shareButton.click();
            }).then(function () {
                // wait for dialog to open
                return chaisePage.waitForElement(shareModal);
            }).then(function () {
                // disable animations in modal so that it doesn't "fade out" (instead it instantly disappears when closed) which we can't track with waitFor conditions
                shareModal.allowAnimations(false);

                done();
            }).catch(function(err){
                console.log(err);
                done.fail();
            });
        });

        it("should show the share dialog when clicking the share button, and should have the expected elements", function (done) {
            // verify modal dialog contents
            var modalTitle = chaisePage.recordEditPage.getModalTitle();
            chaisePage.waitForElement(modalTitle).then(function () {
                return chaisePage.recordPage.waitForCitation();                
            }).then(function () {
                // make sure the loader is not displayed
                expect(modalTitle.getText()).toBe(sharePopupParams.title, "Share citation modal title is incorrect");

                // share link
                var num = 1;
                if (sharePopupParams.citation) {
                    // share link + citation + bibtext
                    num = 3;
                }
                expect(chaisePage.recordPage.getModalListElements().count()).toBe(num, "Number of list elements in share citation modal is incorrect");
                done();
            }).catch(function(err){
                console.log(err);
                done.fail();
            });
        });

        it("should have a share header present.", function (done) {
            expect(chaisePage.recordPage.getShareLinkHeader().getText()).toBe("Share Link", "Share Link (permalink) header is incorrect");
            done();
        });


        var testMessage = "should only have a permalink present (no versioned link).";
        if (sharePopupParams.hasVersionedLink) {
            testMessage = "should have a versioned link and permalink present."
        }
        it(testMessage, function (done) {
            chaisePage.recordPage.getShareLinkSubHeaders().then(function (subheaders) {
                expect(subheaders.length).toBe(sharePopupParams.hasVersionedLink ? 2 : 1, "version link state missmatch");

                if (sharePopupParams.hasVersionedLink) {
                    // just make sure the link is defined
                    expect(subheaders[0].getText()).toContain("Versioned Link", "versioned link header is incorrect");

                    // verify versioned link
                    // NOTE this is conditional because in some cases the version link is not based on resolver and is not easy to test
                    if (sharePopupParams.verifyVersionedLink) {
                        expect(chaisePage.recordPage.getVersionedLinkText().getText()).toContain(sharePopupParams.permalink, "versioned link url does not contain the permalink");
                    }
                }

                // verify permalink
                expect(subheaders[sharePopupParams.hasVersionedLink ? 1 : 0].getText()).toContain("Live Link", "versioned link header is incorrect");
                expect(chaisePage.recordPage.getPermalinkText().getText()).toBe(sharePopupParams.permalink, "permalink url is incorrect");

                done();
            }).catch(function (err) {
                done.fail(err);
            })
        });

        var numCopyIcons = sharePopupParams.hasVersionedLink ? 2 : 1;
        it("should have " + numCopyIcons + " copy to clipboard icons visible.", function (done) {
            expect(element(by.id("share-link")).all(by.css(".glyphicon.glyphicon-copy")).count()).toBe(numCopyIcons, "wrong number of copy to clipboard icons");
            done();
        });

        // NOTE: the copy buttons functionality isn't being tested because it seems really hacky to test this feature
        xit("should have 2 copy to clipboard icons visible and verify they copy the content.", function () {
            var copyIcons, copyInput;

            element(by.id("share-link")).all(by.css(".glyphicon.glyphicon-copy")).then(function (icons) {
                copyIcons = icons;

                expect(icons.length).toBe(2, "wrong number of copy to clipboard icons");

                // click icon to copy text
                return copyIcons[0].click();
            }).then(function () {
                // creating a new input element
                return browser.executeScript(function () {
                    var el = document.createElement('input');
                    el.setAttribute('id', 'copy_input');

                    document.getElementById("share-link").appendChild(el);
                });
            }).then(function () {
                // use the browser to send the keys "ctrl/cmd" + "v" to paste contents
                copyInput = element(by.id("copy_input"));
                copyInput.sendKeys(protractor.Key.chord(protractor.Key.SHIFT, protractor.Key.INSERT));

                return chaisePage.recordPage.getVersionedLinkText().getText();
            }).then(function (versionedLink) {

                // select the input and get it's "value" attribute to verify the pasted contents
                expect(copyInput.getAttribute('value')).toBe(versionedLink, "copied text for versioned link is incorrect");
            });
        }).pend("Test case feels hacky to test a feature of the OS that can't be tested by just verifying the value was copied.");

        if (sharePopupParams.citation) {
            it("should have a citation present,", function (done) {
                // verify citation
                expect(chaisePage.recordPage.getCitationHeader().getText()).toBe("Data Citation", "Citation header is incorrect");
                expect(chaisePage.recordPage.getCitationText().getText()).toBe(sharePopupParams.citation, "citation text is incorrect");

                // verify download citation
                expect(chaisePage.recordPage.getDownloadCitationHeader().getText()).toBe("Download Data Citation:", "Download citation header is incorrect");
                expect(chaisePage.recordPage.getBibtex().getText()).toBe("BibTex", "bibtex text is incorrect");
                done();
            });
        }

        if (!process.env.CI && sharePopupParams.bibtextFile) {
            it("should download the citation in BibTex format.", function (done) {
                chaisePage.recordPage.getBibtex().click().then(function () {
                    return browser.wait(function() {
                        return fs.existsSync(process.env.PWD + "/test/e2e/" + sharePopupParams.bibtextFile);
                    }, browser.params.defaultTimeout)
                }).then(function () {
                    done();
                }, function () {
                    expect(false).toBeTruthy(sharePopupParams.bibtextFile + " was not downloaded");
                    done.fail();
                });
            });
        }

        afterAll(function (done){
            // close dialog
            chaisePage.recordsetPage.getModalCloseBtn().click().then(function () {
                done();
            }).catch(function(err){
                console.log(err);
                done.fail();
            });
        });
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
    var currentEl, markdownToggleLink, toggled = false, noRows = false;
    beforeAll(function(done) {
        pageReadyCondition().then(function () {
            currentEl = params.isInline ? chaisePage.recordPage.getEntityRelatedTable(params.displayname) : chaisePage.recordPage.getRelatedTableAccordion(params.displayname);

            markdownToggleLink = chaisePage.recordPage.getToggleDisplayLink(params.displayname, params.isInline);
            done();
        }).catch(function(err) {
            done.fail(err);
        });
    });

    if (!params.isInline) {
        it("title should be correct.", function (done) {
            var titleEl = chaisePage.recordPage.getRelatedTableSectionHeader(params.displayname);
            chaisePage.waitForElement(titleEl).then(function () {
                expect(titleEl.getText()).toBe(params.displayname, "heading missmatch.");
                done();
            }).catch(function(err) {
                done.fail(err);
            });
        });
    }

    if (params.inlineComment) {
        it("comment should be displayed and correct", function (done) {
            expect(chaisePage.recordPage.getRelatedTableInlineComment(params.displayname).getText()).toBe(params.comment, "inline comment is not correct");
            done();
        });
    }

    describe("regarding table level actions for table " + params.displayname + ", ", function () {

        // Explore
        describe("`Explore` button, ", function () {
            var exploreBtn;
            beforeAll(function (done) {
                exploreBtn = chaisePage.recordPage.getMoreResultsLink(params.displayname, params.isInline);
                browser.wait(EC.elementToBeClickable(exploreBtn), browser.params.defaultTimeout).then(function () {
                    done()
                }).catch(function(err) {
                    done.fail(err);
                });
            });

            it('should be displayed.', function (done) {
                expect(exploreBtn.isDisplayed()).toBeTruthy("view more is not visible.");
                done();
            });

            it('should have the correct tooltip.', function(done){
                chaisePage.recordPage.getColumnCommentHTML(exploreBtn).then(function(comment){
                    expect(comment).toBe("'Explore more " + params.displayname + " records related to this " + params.baseTable + ".'", "Incorrect tooltip on View More button");
                    done();
                }).catch(function(err) {
                    done.fail(err);
                });
            });

            if (params.viewMore){
                it ("should always go to recordset app with correct set of filters.", function (done) {
                    exploreBtn.click().then(function () {
                        return browser.driver.getCurrentUrl();
                    }).then(function(url) {
                        expect(url.indexOf('recordset')).toBeGreaterThan(-1, "didn't go to recordset app");
                        return chaisePage.recordsetPageReady()
                    }).then(function() {
                        expect(chaisePage.recordsetPage.getPageTitleElement().getText()).toBe(params.viewMore.displayname, "title missmatch.");

                        return browser.wait(function () {
                            return chaisePage.recordsetPage.getFacetFilters().count().then(function(ct) {
                                return ct == 1;
                            });
                        }, browser.params.defaultTimeout);
                    }).then(function () {

                        expect(chaisePage.recordsetPage.getFacetFilters().first().getText()).toEqual(params.viewMore.filter, "filter missmatch.");
                        return browser.navigate().back()
                    }).then(function () {
                        return pageReadyCondition();
                    }).then(function () {
                        done();
                    }).catch(function (err) {
                        browser.navigate().back().then(function () {
                            return pageReadyCondition();
                        }).finally(function () {
                            done.fail(err);
                        });
                    })
                });
            }
        });

        // Display Mode
        describe("view mode and rows, ", function () {

            if (params.isMarkdown || (params.isInline && !params.isTableMode)) {
                it ("markdown container must be visible.", function (done) {
                    chaisePage.waitForElement(currentEl.element(by.css('.markdown-container'))).then(function () {
                        expect(currentEl.element(by.css('.markdown-container')).isDisplayed()).toBeTruthy("didn't have markdown");
                        done();
                    })
                    
                });

                if (params.markdownValue) {
                    it ("correct markdown values should be visible.", function (done) {
                        expect(currentEl.element(by.css('.markdown-container')).getAttribute('innerHTML')).toEqual(params.markdownValue);
                        done();
                    });
                }

                if (params.canEdit) {
                    it ("`Edit mode` button should be visible to switch to tabular mode.", function (done) {
                        // revert is `Display`
                        expect(markdownToggleLink.isDisplayed()).toBeTruthy();
                        expect(markdownToggleLink.getText()).toBe("Edit mode");
                        chaisePage.recordPage.getColumnCommentHTML(markdownToggleLink).then(function(comment){
                            expect(comment).toBe("'Display edit controls for " + params.displayname + " related to this " + params.baseTable + ".'", "Incorrect tooltip on Edit button");
                            done();
                        }).catch(function(err) {
                            done.fail(err);
                        });
                    });
                } else {
                    it ("`Table mode` button should be visible to switch to tabular mode.", function (done) {
                        // revert is `Revert Display`
                        expect(markdownToggleLink.isDisplayed()).toBeTruthy();
                        expect(markdownToggleLink.getText()).toBe("Table mode");
                        chaisePage.recordPage.getColumnCommentHTML(markdownToggleLink).then(function(comment){
                            expect(comment).toBe("'Display related " + params.displayname + " in tabular mode.'", "Incorrect tooltip on Table Display button");
                            done();
                        }).catch(function(err) {
                            done.fail(err);
                        });
                    });
                }

                it ("clicking on the toggle should change the view to tabular.", function (done) {
                    markdownToggleLink.click().then(function() {
                        expect(markdownToggleLink.getText()).toBe("Custom mode", "after toggle button missmatch.");
                        return chaisePage.recordPage.getColumnComment(markdownToggleLink);
                    }).then(function(comment){
                        expect(comment).toBe("Switch back to the custom display mode", "Incorrect tooltip on Display button");

                        //TODO make sure table is visible
                        toggled = true;
                        done();
                    }).catch(function(error) {
                        console.log(error);
                        done.fail();
                    });
                });

            } else {
                it ("option for different display modes should not be presented to user.", function (done) {
                    expect(markdownToggleLink.isPresent()).toBe(false);
                    done();
                });
            }

            if (params.rowValues) {
                // since we toggled to row, the data should be available.
                it ("rows of data should be correct and respect the given page_size.", function (done) {
                    // wait for table to be visible before waiting for it's contents to load
                    exploreBtn = chaisePage.recordPage.getMoreResultsLink(params.displayname, params.isInline);
                    browser.wait(EC.elementToBeClickable(exploreBtn), browser.params.defaultTimeout).then(function () {
                        // make sure the right # of rows are showing before verifying the contents
                        return browser.wait(function() {
                            return chaisePage.recordPage.getRelatedTableRows(params.displayname, params.isInline).count().then(function(ct) {
                                return (ct == params.rowValues.length);
                            });
                        }, browser.params.defaultTimeout);
                    }).then(function () {
                        checkRelatedRowValues(params.displayname, params.isInline, params.rowValues, done);
                    }).catch(function(error) {
                        console.log(error);
                        done.fail();
                    });
                });
            }
        });

        if (typeof params.canCreate === "boolean") {
            it ("`Add` button should be " + (params.canCreate ? "visible." : "invisible."), function (done) {
                var addBtn = chaisePage.recordPage.getAddRecordLink(params.displayname, params.isInline);
                expect(addBtn.isPresent()).toBe(params.canCreate);
                if(params.canCreate){
                    chaisePage.recordPage.getColumnCommentHTML(addBtn.element(by.xpath("./.."))).then(function(comment){
                        expect(comment).toBe("'Connect " + params.displayname + " records to this " + params.baseTable + ".'", "Incorrect tooltip on Add button");
                        done();
                    }).catch(function(error) {
                        console.log(error);
                        done.fail();
                    });
                }
                done();
            });
        }
    });

    // in our test cases we are changing the view to tabular
    describe("regarding row level actions, ", function () {

        if (params.rowViewPaths) {
            it ("'View Details' button should have the correct link.", function (done) {
                var tableName = (params.isAssociation ? params.relatedName : params.name);
                params.rowViewPaths.forEach(function (row, index) {
                    var expected = '/record/#' + browser.params.catalogId + "/" + params.schemaName + ":" + tableName + "/";
                    var dataRow = chaisePage.getEntityRow(params.schemaName, tableName, row);
                    expected += "RID=" + dataRow.RID;
                    var btn = chaisePage.recordPage.getRelatedTableRowLink(params.displayname, index, params.isInline);
                    expect(btn.getAttribute('href')).toContain(expected, "link missmatch for index=" + index);
                });
                done();
            });
        }

        if (typeof params.canEdit === "boolean") {
            if (!params.canEdit) {
                it ("edit button should not be visible.", function (done) {
                    expect(currentEl.all(by.css(".edit-action-button")).isPresent()).not.toBeTruthy();
                    done();
                });
            } else if (params.rowViewPaths) {
                // only testing the first link (it's a button not a link, so testing all of them would add a lot of test time)
                it ("clicking on 'edit` button should open a tab to recordedit page.", function (done) {
                    var btn = chaisePage.recordPage.getRelatedTableRowEdit(params.displayname, 0, params.isInline);

                    expect(btn.isDisplayed()).toBeTruthy("edit button is missing.");
                    chaisePage.clickButton(btn).then(function () {
                        return browser.getAllWindowHandles();
                    }).then(function(handles) {
                        allWindows = handles;
                        return browser.switchTo().window(allWindows[1]);
                    }).then(function() {
                        var tableName = (params.isAssociation ? params.relatedName : params.name);
                        var result = '/recordedit/#' + browser.params.catalogId + "/" + params.schemaName + ":" + tableName;

                        result += "/RID=" + chaisePage.getEntityRow(params.schemaName, tableName, params.rowViewPaths[0]).RID;

                        expect(browser.driver.getCurrentUrl()).toContain(result, "expected link missmatch.");
                        return browser.close()
                    }).then(function () {
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
                beforeAll(function (done) {
                    deleteBtn = chaisePage.recordPage.getRelatedTableRowDelete(params.displayname, 0, params.isInline);
                    done();
                })
                if (params.canDelete) {
                    it ('should be visible.', function (done) {
                        expect(deleteBtn.isDisplayed()).toBeTruthy("delete button is missing.");
                        done();
                    });

                    if (params.isAssociation) {
                        it ("button tooltip should be `Unlink`.", function (done) {
                            expect(deleteBtn.getAttribute("uib-tooltip")).toBe('Disconnect ' + params.displayname + ': ' + params.entityMarkdownName + ' from this ' + params.baseTable + '.');
                            done();
                        });
                    } else {
                        it ("button tooltip be `Delete`.", function (done) {
                            expect(deleteBtn.getAttribute("uib-tooltip")).toBe("Delete");
                            done();
                        });
                    }

                    it ("it should update the table and title after confirmation.", function (done) {
                        var currentCount, confirmButton;
                        chaisePage.recordPage.getRelatedTableRows(params.displayname, params.isInline).count().then(function (count) {
                            currentCount = count;
                            return chaisePage.clickButton(deleteBtn);
                        }).then(function () {
                            confirmButton = chaisePage.recordPage.getConfirmDeleteButton();
                            return browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);
                        }).then(function () {
                            return confirmButton.click();
                        }).then(function () {
                            return chaisePage.waitForElementInverse(element(by.id("spinner")));
                        }).then(function () {

                            // make sure the rows are updated
                            return browser.wait(function() {
                                return chaisePage.recordPage.getRelatedTableRows(params.displayname, params.isInline).count().then(function(ct) {
                                    return (ct == currentCount-1);
                                });
                            }, browser.params.defaultTimeout);
                        }).then(function () {
                            return chaisePage.recordPage.getRelatedTableRows(params.displayname, params.isInline).count();
                        }).then(function (count) {
                            expect(count).toBe(currentCount-1, "count didn't change.");

                            noRows = count == 0;
                            done();
                        }).catch(function (err) {
                            console.log(err);
                            done.fail();
                        })
                    });

                } else {
                    it ("should not be visible.", function (done) {
                        expect(deleteBtn.isDisplayed()).toBe(false, "delete button was visible.");
                        done();
                    });
                }
            });
        }
    });

    // if it was markdown, we are changing the view, change it back.
    afterAll(function (done) {
        if (toggled && !noRows) {
            markdownToggleLink.click().then(function() {
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
 *  - prefilledValues: {"col-displayname": "col-value", ..}
 *  - columnValue
 */

exports.testAddRelatedTable = function (params, isInline, inputCallback) {
    describe("Add feature, ", function () {
        it ("clicking on `Add` button should open recordedit.", function (done) {
            var addBtn = chaisePage.recordPage.getAddRecordLink(params.relatedDisplayname);
            var recordeditUrl = browser.params.url + '/recordedit/#' + browser.params.catalogId + "/" + params.schemaName + ":" + params.tableName;

            expect(addBtn.isDisplayed()).toBeTruthy("add button is not displayed");
            addBtn.click().then(function () {
                // This Add link opens in a new tab so we have to track the windows in the browser...
                return browser.getAllWindowHandles();
            }).then(function(handles) {
                allWindows = handles;
                // ... and switch to the new tab here...
                return browser.switchTo().window(allWindows[1]);
            }).then(function() {
                return chaisePage.waitForElement(element(by.id('submit-record-button')));
            }).then(function() {

                return browser.wait(function () {
                    return browser.driver.getCurrentUrl().then(function(url) {
                        return url.startsWith(recordeditUrl);
                    });
                }, browser.params.defaultTimeout);
            }).then(function () {
                // ... and then get the url from this new tab...
                return browser.driver.getCurrentUrl();
            }).then(function(url) {
                expect(url.indexOf('prefill=')).toBeGreaterThan(-1, "didn't have prefill");

                var title = chaisePage.recordEditPage.getEntityTitleElement().getText();
                expect(title).toBe("Create new " + params.tableDisplayname, "recordedit title missmatch.");

                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it ("the opened form should have the prefill value for foreignkey.", function (done) {
            for (var col in params.prefilledValues) {
                var fkInput = chaisePage.recordEditPage.getInputById(0, col);
                expect(fkInput.getAttribute('value')).toBe(params.prefilledValues[col], "value missmatch for " + col);
                expect(fkInput.getAttribute('disabled')).toBe(params.prefilledValues[col] === "" ? null : 'true', "disabled missmatch for " + col);
            }
            done();
        });

        it ("submitting the form and coming back to record page should update the related table.", function (done) {
            inputCallback().then(function () {
                return chaisePage.recordEditPage.submitForm();
            }).then(function() {
                // wait until redirected to record page
                return browser.wait(EC.presenceOf(element(by.className('record-container'))), browser.params.defaultTimeout);
            }).then(function () {
                return browser.close();
            }).then(function () {
                return browser.switchTo().window(allWindows[0]);
            }).then(function () {
                //TODO should remove this, but sometimes it's not working in test cases
                return browser.driver.navigate().refresh();
            }).then(function () {
                // check for the updated value.
                //there's no loading indocator, so we have to wait for count
                return browser.wait(function () {
                    return chaisePage.recordPage.getRelatedTableRows(params.relatedDisplayname, isInline).count().then(function (cnt) {
                        return cnt === params.rowValuesAfter.length;
                    }, function (err) {throw err;});
                });
            }).then(function () {
                checkRelatedRowValues(params.relatedDisplayname, isInline, params.rowValuesAfter, done);
            }).catch(function(error) {
                console.log(error);
                done.fail();
            });
        });
    });
};

/**
 * - relatedDisplayname
 * - modalTitle
 * - totalCount
 * - existingCount
 * - disabledRows
 * - selectIndex
 */
exports.testAddAssociationTable = function (params, isInline, pageReadyCondition) {
    describe("Add feature, ", function () {
        it ("clicking on `Link` button should open up a modal.", function (done) {
            var addBtn = chaisePage.recordPage.getAddRecordLink(params.relatedDisplayname);
            addBtn.click().then(function () {
                return chaisePage.waitForElement(chaisePage.recordEditPage.getModalTitle());
            }).then(function () {
                return chaisePage.recordEditPage.getModalTitle().getText();
            }).then(function (title) {
                expect(title).toBe(params.modalTitle, "title missmatch.");

                return browser.wait(function () {
                    return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                        return (ct == params.totalCount);
                    });
                });
            }).then(function () {
                return chaisePage.recordsetPage.getModalRows().count();
            }).then(function(ct){
                expect(ct).toBe(params.totalCount, "association count missmatch.");

                var totalCountText = chaisePage.recordsetPage.getTotalCount().getText();
                expect(totalCountText).toBe("Displaying\nall " + params.totalCount +"\nof " + params.totalCount + " records", "association count display missmatch.");

                // check the state of the facet panel
                expect(chaisePage.recordPage.getModalSidePanel().isDisplayed()).toBeTruthy("Side panel is not visible on load");

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
                    r.findElement(by.css("td:not(.action-btns)")).then(function (el) {
                        expect(el.getText()).toMatch(params.disabledRows[index], "missmatch disabled row index=" + index);
                    });
                });

                done();
            }).catch(function(error) {
                console.log(error);
                done.fail();
            });
        });

        if (params.search) {
            it ("should be able to search the displayed values.", function (done) {
                var modal = chaisePage.searchPopup.getAddPureBinaryPopup();
                var searchInp = chaisePage.recordsetPage.getMainSearchInput(modal),
                    searchSubmitBtn = chaisePage.recordsetPage.getSearchSubmitButton(modal);
                searchInp.sendKeys(params.search.term).then(function () {
                    return searchSubmitBtn.click();  
                }).then(function () {

                    // tests the count
                    return browser.wait(function () {
                        return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                            return (ct == params.search.afterSearchCount);
                        });
                    });
                }).then(function () {
                    return chaisePage.recordPage.getModalDisabledRows();
                }).then(function (disabledRows) {
                    // make sure disabled are correct after search
                    expect(disabledRows.length).toBe(params.search.afterSearchDisabledRows.length, "disabled length missmatch.");

                    // go through the list and check their first column (which is the id)
                    disabledRows.forEach(function (r, index) {
                        r.findElement(by.css("td:not(.action-btns)")).then(function (el) {
                            expect(el.getText()).toMatch(params.disabledRows[index], "missmatch disabled row index=" + index);
                        });
                    });

                    // clear search
                    return chaisePage.clickButton(chaisePage.recordsetPage.getSearchClearButton());
                }).then(function () {
                    // tests the count
                    return browser.wait(function () {
                        return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                            return (ct == params.totalCount);
                        });
                    });
                }).then(function () {
                    done();
                }).catch(function(error) {
                    console.log(error);
                    done.fail();
                });
            });
        }

        it ("user should be able to select new values and submit.", function (done) {
            var modal = chaisePage.searchPopup.getAddPureBinaryPopup();
            var inp = chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(modal, 1);
            chaisePage.clickButton(inp).then(function (){
                var inp2 = chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(modal, 2);
                return chaisePage.clickButton(inp2);
            }).then(function (){
                var inp3 = chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(modal, 3);
                return chaisePage.clickButton(inp3);
            }).then(function (){
                var inp4 = chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(modal, 4);
                return chaisePage.clickButton(inp4);
            }).then(function (){
                expect(chaisePage.recordsetPage.getModalSubmit().getText()).toBe("Link", "Submit button text for add pure and binary popup is incorrect");

                return chaisePage.clickButton(chaisePage.recordsetPage.getModalSubmit());
            }).then(function () {
                return browser.wait(EC.presenceOf(element(by.id('page-title'))), browser.params.defaultTimeout);
            }).then(function () {
                return browser.wait(function () {
                    return chaisePage.recordPage.getRelatedTableRows(params.relatedDisplayname, isInline).then(function (rows) {
                        return (rows.length == params.existingCount + 4);
                    });
                });
            }).then(function () {
                checkRelatedRowValues(params.relatedDisplayname, isInline, params.rowValuesAfter, done);

                return chaisePage.recordPage.getRelatedTableRows(params.relatedDisplayname).count();
            }).then(function (count){
                expect(count).toBe(params.existingCount + 4);
                done();
            }).catch(function(error) {
                console.log(error);
                done.fail();
            });
        });

    });
};

exports.testBatchUnlinkAssociationTable = function (params, isInline, pageReadyCondition) {
    describe("Batch Unlink feature, ", function () {
        it ("clicking on `Unlink records` button should open up a modal.", function (done) {
            var unlinkBtn = chaisePage.recordPage.getUnlinkRecordsLink(params.relatedDisplayname);
            unlinkBtn.click().then(function () {
                return chaisePage.waitForElement(chaisePage.recordEditPage.getModalTitle());
            }).then(function () {
                return chaisePage.recordEditPage.getModalTitle().getText();
            }).then(function (title) {
                expect(title).toBe(params.modalTitle, "title missmatch.");

                return browser.wait(function () {
                    return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                        return (ct == params.totalCount);
                    });
                });
            }).then(function () {
                return chaisePage.recordsetPage.getModalRows().count();
            }).then(function(ct){
                expect(ct).toBe(params.totalCount, "association count missmatch.");

                var totalCountText = chaisePage.recordsetPage.getTotalCount().getText();
                expect(totalCountText).toBe("Displaying\nall " + params.totalCount +"\nof " + params.totalCount + " records", "association count display missmatch.");

                // check the state of the facet panel
                expect(chaisePage.recordPage.getModalSidePanel().isDisplayed()).toBeTruthy("Side panel is not visible on load");

                done();
            }).catch(function(error) {
                console.log(error);
                done.fail();
            });
        });

        it ("user should be able to select values to unlink and submit.", function (done) {
            var modalTitle, confirmUnlinkBtn, errorTitle, modalOkBtn;
            var modal = chaisePage.searchPopup.getUnlinkPureBinaryPopup();
            // select rows 2 and 4, then remove them
            var inp = chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(modal, 1);
            chaisePage.clickButton(inp).then(function (){
                var inp2 = chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(modal, 3);
                return chaisePage.clickButton(inp2);
            }).then(function (){
                expect(chaisePage.recordsetPage.getModalSubmit().getText()).toBe("Unlink", "Unlink button text for add pure and binary popup is incorrect");

                return chaisePage.clickButton(chaisePage.recordsetPage.getModalSubmit());
            }).then(function () {
                modalTitle = chaisePage.recordPage.getConfirmDeleteTitle();
                return browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
            }).then(function () {
                // expect modal to open
                return modalTitle.getText();
            }).then(function (text) {
                expect(text).toBe("Confirm Unlink");

                expect(chaisePage.recordPage.getModalText().getText()).toBe("Are you sure you want to unlink 2 records?");

                confirmUnlinkBtn = chaisePage.recordPage.getConfirmDeleteButton();
                return browser.wait(EC.elementToBeClickable(confirmUnlinkBtn), browser.params.defaultTimeout);
            }).then(function () {
                expect(confirmUnlinkBtn.getText()).toBe("Unlink");

                return confirmUnlinkBtn.click();
            }).then(function () {
                var unlinkSummaryModal = element(by.css('.modal-error'));
                chaisePage.waitForElement(unlinkSummaryModal);
                unlinkSummaryModal.allowAnimations(false);

                errorTitle = chaisePage.errorModal.getTitle();
                return browser.wait(EC.visibilityOf(errorTitle), browser.params.defaultTimeout);
            }).then(function () {
                return errorTitle.getText();
            }).then(function (text) {
                // check error popup
                expect(text).toBe("Batch Unlink Summary", "The title of batch unlink summary popup is not correct");
                expect(chaisePage.recordPage.getModalText().getText()).toBe(params.postDeleteMessage, "The message in modal pop is not correct");

                modalOkBtn = chaisePage.recordPage.getErrorModalOkButton()
                return browser.wait(EC.elementToBeClickable(modalOkBtn), browser.params.defaultTimeout);
            }).then(function () {
                // click ok
                return chaisePage.clickButton(modalOkBtn);
            }).then(function () {
                // check modal has 3 rows
                return browser.wait(function () {
                    return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                        return (ct == params.countAfterUnlink);
                    });
                });
            }).then(function () {
                return chaisePage.recordsetPage.getModalRows().count();
            }).then(function(ct){
                expect(ct).toBe(params.countAfterUnlink, "association count missmatch after delete.");
                // close modal and check UI after

                return chaisePage.clickButton(chaisePage.recordsetPage.getModalCancel());
            }).then(function () {
                return browser.wait(EC.presenceOf(element(by.id('page-title'))), browser.params.defaultTimeout);
            }).then(function () {
                return browser.wait(function () {
                    return chaisePage.recordPage.getRelatedTableRows(params.relatedDisplayname, isInline).then(function (rows) {
                        return (rows.length == params.countAfterUnlink);
                    });
                });
            }).then(function () {
                checkRelatedRowValues(params.relatedDisplayname, isInline, params.rowValuesAfter, done);

                return chaisePage.recordPage.getRelatedTableRows(params.relatedDisplayname).count();
            }).then(function (count){
                expect(count).toBe(params.countAfterUnlink);

                done();
            }).catch(function(error) {
                console.log(error);
                done.fail();
            });
        });
    });
};

exports.testBatchUnlinkDynamicAclsAssociationTable = function (params, isInline, pageReadyCondition, postLoginCb) {
    var restrictedUserId = process.env.RESTRICTED_AUTH_COOKIE_ID;
    var aclConfig = {
        "catalog": {
            "id": params.catalogId,
            "schemas" : {
                "product-unordered-related-tables-links": {
                    "tables" : {
                        "accommodation": {
                            "acls": {
                                "select": [restrictedUserId]
                            }
                        },
                        "related_table": {
                            "acls": {
                                "select": [restrictedUserId],
                                "delete": [restrictedUserId]
                            }
                        },
                        "association_table": {
                            "acls": {
                                "select": [restrictedUserId]
                            },
                            "acl_bindings": {
                                "can_delete_row": {
                                    "types": ["delete"],
                                    "projection": [
                                        {"filter": "id_related", "operand": 5}, "id_related" // "Space Heater"
                                    ],
                                    "projection_type": "nonnull"
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    var resetAclConfig = {
        "catalog": {
            "id": params.catalogId,
            "schemas" : {
                "product-unordered-related-tables-links": {
                    "tables" : {
                        "accommodation": {
                            "acls": {
                                "select": []
                            }
                        },
                        "related_table": {
                            "acls": {
                                "select": [],
                                "delete": []
                            }
                        },
                        "association_table": {
                            "acls": {
                                "select": []
                            }
                        }
                    }
                }
            }
        }
    }

    describe("batch unlink with dynamic acls,", function () {
        beforeAll(function (done) {
            // set acls
            pImport.importACLs(aclConfig).then(function () {
                // make sure the restricted user is logged in
                return chaisePage.performLogin(process.env.RESTRICTED_AUTH_COOKIE);
            }).then(function() {
                return postLoginCb();
            }).then(function () {
                done();
            }).catch(function(err) {
                console.log("error while trying to login as restricted user");
                done.fail(err);
            });
        });

        it("should fail to unlink rows that can't be unlinked with an error message in the batch remove summary", function (done) {
            var modal, modalTitle, confirmUnlinkBtn, unlinkSummaryModal, errorTitle;
            var unlinkBtn = chaisePage.recordPage.getUnlinkRecordsLink(params.relatedDisplayname);
            browser.wait(EC.elementToBeClickable(unlinkBtn), browser.params.defaultTimeout).then(function () {
                return unlinkBtn.click();
            }).then(function () {
                return chaisePage.waitForElement(chaisePage.recordEditPage.getModalTitle());
            }).then(function () {
                return chaisePage.recordEditPage.getModalTitle().getText();
            }).then(function (title) {
                expect(title).toBe(params.modalTitle, "title missmatch.");

                return browser.wait(function () {
                    return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                        return (ct == params.countAfterUnlink);
                    });
                });
            }).then(function () {
                return chaisePage.recordsetPage.getModalRows().count();
            }).then(function(ct){
                expect(ct).toBe(params.countAfterUnlink, "association count missmatch.");

                var totalCountText = chaisePage.recordsetPage.getTotalCount().getText();
                expect(totalCountText).toBe("Displaying\nall " + params.countAfterUnlink +"\nof " + params.countAfterUnlink + " records", "association count display missmatch.");

                modal = chaisePage.searchPopup.getUnlinkPureBinaryPopup();
                // select "Television" (not deletable)
                var inp = chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(modal, 0);
                return chaisePage.clickButton(inp)
            }).then(function (){
                // select "Space Heater" (deletable)
                var inp2 = chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(modal, 2);
                return chaisePage.clickButton(inp2)
            }).then(function (){
                expect(chaisePage.recordsetPage.getModalSubmit().getText()).toBe("Unlink", "Unlink button text for add pure and binary popup is incorrect");

                return chaisePage.clickButton(chaisePage.recordsetPage.getModalSubmit());
            }).then(function () {
                modalTitle = chaisePage.recordPage.getConfirmDeleteTitle();
                return browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
            }).then(function () {
                // expect modal to open
                return modalTitle.getText();
            }).then(function (text) {
                expect(text).toBe("Confirm Unlink");
                expect(chaisePage.recordPage.getModalText().getText()).toBe("Are you sure you want to unlink 2 records?");

                confirmUnlinkBtn = chaisePage.recordPage.getConfirmDeleteButton();
                return browser.wait(EC.elementToBeClickable(confirmUnlinkBtn), browser.params.defaultTimeout);
            }).then(function () {
                expect(confirmUnlinkBtn.getText()).toBe("Unlink");

                return confirmUnlinkBtn.click();
            }).then(function () {
                unlinkSummaryModal = element(by.css('.modal-error'));
                return chaisePage.waitForElement(unlinkSummaryModal);
            }).then(function () {
                unlinkSummaryModal.allowAnimations(false);

                errorTitle = chaisePage.errorModal.getTitle();
                return browser.wait(EC.visibilityOf(errorTitle), browser.params.defaultTimeout);
            }).then(function () {
                return errorTitle.getText();
            }).then(function (text) {
                // check error popup
                expect(text).toBe("Batch Unlink Summary", "The title of batch unlink summary popup is not correct");
                expect(chaisePage.recordPage.getModalText().getText()).toBe(params.failedPostDeleteMessage, "The message in modal pop is not correct");

                // click ok
                return chaisePage.clickButton(chaisePage.recordPage.getErrorModalOkButton());
            }).then(function () {
                // check modal has 2 rows
                return browser.wait(function () {
                    return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                        return (ct == params.countAfterUnlink);
                    });
                });
            }).then(function () {
                return chaisePage.recordsetPage.getModalRows().count();
            }).then(function(ct){
                expect(ct).toBe(params.countAfterUnlink, "association count missmatch after delete.");

                done();
            }).catch(function(error) {
                console.log(error);
                done.fail();
            });
        });

        it("should have rows still selected after failed delete", function (done) {
            // TODO: change once record app migrated
            expect(chaisePage.recordsetPage.getAngularSelectedRowsFilters().count()).toBe(2);
            done();
        });

        it("should deselect the 2nd row and resubmit delete", function (done) {
            var modalTitle, confirmUnlinkBtn, unlinkSummaryModal, errorTitle;
            var modal = chaisePage.searchPopup.getUnlinkPureBinaryPopup();
            // deselect "Television"
            var inp2 = chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(modal, 0);

            chaisePage.clickButton(inp2).then(function () {
                return browser.wait(function () {
                    return chaisePage.recordsetPage.getAngularSelectedRowsFilters().count().then(function (ct) {
                        return (ct == 1);
                    });
                });
            }).then(function () {
                expect(chaisePage.recordsetPage.getModalSubmit().getText()).toBe("Unlink", "Unlink button text for add pure and binary popup is incorrect");

                return chaisePage.clickButton(chaisePage.recordsetPage.getModalSubmit());
            }).then(function () {
                modalTitle = chaisePage.recordPage.getConfirmDeleteTitle();
                return browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
            }).then(function () {
                // expect modal to open
                return modalTitle.getText();
            }).then(function (text) {
                expect(text).toBe("Confirm Unlink");
                expect(chaisePage.recordPage.getModalText().getText()).toBe("Are you sure you want to unlink 1 record?");

                confirmUnlinkBtn = chaisePage.recordPage.getConfirmDeleteButton();
                return browser.wait(EC.elementToBeClickable(confirmUnlinkBtn), browser.params.defaultTimeout);
            }).then(function () {
                expect(confirmUnlinkBtn.getText()).toBe("Unlink");

                return confirmUnlinkBtn.click();
            }).then(function () {
                unlinkSummaryModal = element(by.css('.modal-error'));
                return chaisePage.waitForElement(unlinkSummaryModal);
            }).then(function () {
                unlinkSummaryModal.allowAnimations(false);

                errorTitle = chaisePage.errorModal.getTitle();
                return browser.wait(EC.visibilityOf(errorTitle), browser.params.defaultTimeout);
            }).then(function () {
                return errorTitle.getText();
            }).then(function (text) {
                // check error popup
                expect(text).toBe("Batch Unlink Summary", "The title of batch unlink summary popup is not correct");
                expect(chaisePage.recordPage.getModalText().getText()).toBe(params.aclPostDeleteMessage, "The message in modal pop is not correct");

                // click ok
                return chaisePage.clickButton(chaisePage.recordPage.getErrorModalOkButton());
            }).then(function () {
                // check modal has 1 row
                return browser.wait(function () {
                    return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                        return (ct == params.countAfterAclUnlink);
                    });
                });
            }).then(function () {
                return chaisePage.recordsetPage.getModalRows().count();
            }).then(function(ct){
                expect(ct).toBe(params.countAfterAclUnlink, "association count missmatch after delete.");

                return chaisePage.clickButton(chaisePage.recordsetPage.getModalCancel());
            }).then(function () {
                return browser.wait(EC.presenceOf(element(by.id('page-title'))), browser.params.defaultTimeout);
            }).then(function () {
                return browser.wait(function () {
                    return chaisePage.recordPage.getRelatedTableRows(params.relatedDisplayname, isInline).then(function (rows) {
                        return (rows.length == params.countAfterAclUnlink);
                    });
                });
            }).then(function () {
                checkRelatedRowValues(params.relatedDisplayname, isInline, params.rowValuesAfterAclRemove, done);

                return chaisePage.recordPage.getRelatedTableRows(params.relatedDisplayname).count();
            }).then(function (count){
                expect(count).toBe(params.countAfterAclUnlink);

                done();
            }).catch(function(error) {
                console.log(error);
                done.fail();
            });
        });

        afterAll(function (done) {
            // remove acls
            pImport.importACLs(resetAclConfig).then(function () {
                // login as the original user
                return chaisePage.performLogin(process.env.AUTH_COOKIE);
            }).then(function() {
                return postLoginCb();
            }).then(function () {
                done();
            }).catch(function(err) {
                console.log("error while trying to login as normal user");
                done.fail(err);
            });
        });
    });
}


function checkRelatedRowValues(displayname, isInline, rowValues, done) {
    chaisePage.recordPage.getRelatedTableRows(displayname, isInline).then(function (rows) {
        expect(rows.length).toBe(rowValues.length, "rows length mismatch.");
        if (rows.length === 0) {
            done();
        }
        rows.forEach(function (row, index) {
            row.all(by.tagName("td")).then(function (cells) {
                expect(cells.length).toBe(rowValues[index].length + 1, "number of columns are not as expected.");
                rowValues[index].forEach(function (expectedRow, columnIndex) {
                    if (typeof expectedRow === "object" && expectedRow.url) {
                        expect(cells[columnIndex+1].element(by.tagName("a")).getAttribute("href")).toContain(expectedRow.url, "link missmatch for row=" + index + ", columnIndex=" + columnIndex);
                        expect(cells[columnIndex+1].element(by.tagName("a")).getText()).toBe(expectedRow.caption, "caption missmatch for row=" + index  + ", columnIndex=" + columnIndex);
                    } else {
                        expect(cells[columnIndex+1].getText()).toBe(expectedRow, "mismatch for row=" + index  + ", columnIndex=" + columnIndex);
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
}
