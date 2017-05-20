var recordsetHelpers = require('../helpers.js'), chaisePage = require('../../../utils/chaise.page.js');;

describe('View recordset,', function() {

    var testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params, fileParams = testParams.file_tuple;

    for (var i=0; i< testParams.tuples.length; i++) {

        (function(tupleParams, index) {

            describe("For table " + tupleParams.table_name + ",", function() {

                beforeAll(function () {
                    var keys = [];
                    tupleParams.keys.forEach(function(key) {
                        keys.push(key.name + key.operator + key.value);
                    });
                    browser.ignoreSynchronization=true;
                    browser.get(browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&") + "@sort(" + tupleParams.sortby + ")");

                    chaisePage.waitForElement(element(by.id("divRecordSet")));
                });

                describe("Presentation ,", function() {
                    var recEditUrl =  '';
                    it("should have '" + tupleParams.title +  "' as title", function() {
                        var title = chaisePage.recordsetPage.getPageTitleElement();
                        expect(title.getText()).toEqual(tupleParams.title);
                    });

                    it("should autofocus on search box", function() {
                        var searchBox = chaisePage.recordsetPage.getSearchBox();
                        expect(searchBox.getAttribute('id')).toEqual(browser.driver.switchTo().activeElement().getAttribute('id'));
                    });

                    it("should use annotated page size", function() {
                        var EC = protractor.ExpectedConditions;
                        var e = element(by.id('custom-page-size'));
                        browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);
                        chaisePage.recordsetPage.getCustomPageSize().then(function(text) {
                            expect(text).toBe("15 (Custom)");
                        })
                    });

                    it("should show correct table rows", function() {
                        chaisePage.recordsetPage.getRows().then(function(rows) {
                            expect(rows.length).toBe(4);
                            for (var i = 0; i < rows.length; i++) {
                                (function(index) {
                                    rows[index].all(by.tagName("td")).then(function (cells) {
                                        expect(cells.length).toBe(tupleParams.columns.length + 1);
                                        expect(cells[1].getText()).toBe(tupleParams.data[index].title);
                                        expect(cells[2].element(by.tagName("a")).getAttribute("href")).toBe(tupleParams.data[index].website);
                                        expect(cells[2].element(by.tagName("a")).getText()).toBe("Link to Website");
                                        expect(cells[3].getText()).toBe(tupleParams.data[index].rating);
                                        expect(cells[4].getText()).toBe(tupleParams.data[index].summary);
                                        expect(cells[5].getText()).toBe(tupleParams.data[index].opened_on);
                                        expect(cells[6].getText()).toBe(tupleParams.data[index].luxurious);
                                    });
                                }(i))
                            }
                        });
                    });

                    it("should have " + tupleParams.columns.length + " columns", function() {
                        chaisePage.recordsetPage.getColumnNames().then(function(columns) {
                            expect(columns.length).toBe(tupleParams.columns.length);
                            for (var i = 0; i < columns.length; i++) {
                                expect(columns[i].getText()).toEqual(tupleParams.columns[i].title);
                            }
                        });
                    });

                    it("should show line under columns which have a comment and inspect the comment value too", function() {
                        var columns = tupleParams.columns.filter(function(c) {
                            return (c.value != null && typeof c.comment == 'string');
                        });
                        chaisePage.recordsetPage.getColumnsWithUnderline().then(function(pageColumns) {
                            expect(pageColumns.length).toBe(columns.length);
                            var index = 0;
                            pageColumns.forEach(function(c) {
                                var comment = columns[index++].comment;
                                chaisePage.recordsetPage.getColumnComment(c).then(function(actualComment) {
                                    var exists = actualComment ? true : undefined;
                                    expect(exists).toBeDefined();

                                    // Check comment is same
                                    expect(actualComment).toBe(comment);
                                });
                            });
                        });
                    });

                    it("apply different searches, ", function() {
                        var EC = protractor.ExpectedConditions;
                        var e = element(by.id('custom-page-size'));
                        browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);

                        var searchBox = chaisePage.recordsetPage.getSearchBox(),
                            searchSubmitButton = chaisePage.recordsetPage.getSearchSubmitButton(),
                            clearSearchButton = chaisePage.recordsetPage.getSearchClearButton(),
                            noResultsMessage = "No Results Found";

                        searchBox.sendKeys('Super 8 North Hollywood Motel');
                        searchSubmitButton.click().then(function() {
                            return chaisePage.waitForElementInverse(element(by.id("spinner")));
                        }).then(function() {
                            return chaisePage.recordsetPage.getRows()
                        }).then(function(rows) {
                            expect(rows.length).toBe(1);
                            // clear search
                            return clearSearchButton.click();
                        }).then(function() {
                            return chaisePage.waitForElementInverse(element(by.id("spinner")));
                        }).then(function() {
                            return chaisePage.recordsetPage.getRows();
                        }).then(function(rows) {
                            expect(rows.length).toBe(4);

                            // apply conjunctive search words
                            searchBox.sendKeys('"Super 8" motel "North Hollywood"');

                            return searchSubmitButton.click();
                        }).then(function() {
                            return chaisePage.waitForElementInverse(element(by.id("spinner")));
                        }).then(function() {
                            return chaisePage.recordsetPage.getRows();
                        }).then(function(rows) {
                            expect(rows.length).toBe(1);
                            // clear search
                            return clearSearchButton.click();
                        }).then(function() {
                            return chaisePage.waitForElementInverse(element(by.id("spinner")));
                        }).then(function() {
                            // search has been reset
                            searchBox.sendKeys("asdfghjkl");

                            return searchSubmitButton.click();
                        }).then(function() {
                            return chaisePage.waitForElementInverse(element(by.id("spinner")));
                        }).then(function() {
                            return chaisePage.recordsetPage.getRows();
                        }).then(function(rows) {
                            expect(rows.length).toBe(0);

                            return chaisePage.recordsetPage.getNoResultsRow().getText();
                        }).then(function(text) {
                            expect(text).toBe(noResultsMessage);

                            // clearing the search here resets the page for the next test case
                            clearSearchButton.click();
                        });

                    });

                    it("action columns should show view button that redirects to the record page", function() {
                        chaisePage.waitForElementInverse(element(by.id("spinner"))).then(function() {
                            return chaisePage.recordsetPage.getViewActionButtons();
                        }).then(function(viewButtons) {
                            expect(viewButtons.length).toBe(4);
                            return viewButtons[0].click();
                        }).then(function() {
                            var result = '/record/#' + browser.params.catalogId + "/" + tupleParams.schemaName + ":" + tupleParams.table_name + "/id=" + tupleParams.data[0].id;
                            chaisePage.waitForUrl(result, browser.params.defaultTimeout).finally(function() {
                                expect(browser.driver.getCurrentUrl()).toContain(result);
                                browser.navigate().back();
                            });
                        });
                    });

                    it("action columns should show edit button that redirects to the recordedit page", function() {
                        var allWindows;
                        chaisePage.waitForElementInverse(element(by.id("spinner"))).then(function() {
                            return chaisePage.recordsetPage.getEditActionButtons();
                        }).then(function(editButtons) {
                            expect(editButtons.length).toBe(4);
                            return editButtons[0].click();
                        }).then(function() {
                            return browser.getAllWindowHandles();
                        }).then(function(handles) {
                            allWindows = handles;
                            return browser.switchTo().window(allWindows[1]);
                        }).then(function() {
                            var result = '/recordedit/#' + browser.params.catalogId + "/" + tupleParams.schemaName + ":" + tupleParams.table_name + "/id=" + tupleParams.data[0].id;
                            browser.driver.getCurrentUrl().then(function(url) {
                                // Store this for use in later spec.
                                recEditUrl = url;
                            });
                            expect(browser.driver.getCurrentUrl()).toContain(result);
                            browser.close();
                            browser.switchTo().window(allWindows[0]);
                        });
                    });

                    it('should show a modal if user tries to delete (via action column) a record that has been modified by someone else (412 error)', function() {
                        var EC = protractor.ExpectedConditions, allWindows, config;
                        // Edit a record in a new tab in order to change the ETag
                        recEditUrl = recEditUrl.replace('id=2003', 'id=4004');
                        recEditUrl = recEditUrl.slice(0, recEditUrl.indexOf('?invalidate'));

                        browser.executeScript('window.open(arguments[0]);', recEditUrl).then(function() {
                            return browser.getAllWindowHandles();
                        }).then(function(handles) {
                            allWindows = handles;
                            return browser.switchTo().window(allWindows[1]);
                        }).then(function() {
                            // In order to simulate someone else modifying a record (in order to
                            // trigger a 412), we need to set RecEdit's window.opener to null so
                            // that RecordSet won't think that this RecEdit page was opened by the same user
                            // from the RecordSet page.
                            return browser.executeScript('window.opener = null');
                        }).then(function () {
                            return chaisePage.waitForElement(element(by.id("submit-record-button")));
                        }).then(function() {
                            // - Change a small thing. Submit.
                            var input = chaisePage.recordEditPage.getInputById(0, 'Summary');
                            input.clear();
                            input.sendKeys('as;dkfa;sljk als;dkj f;alsdjf a;');
                            return chaisePage.recordEditPage.getSubmitRecordButton().click();
                        }).then(function() {
                            // Wait for RecordEdit to redirect to Record to make sure the submission went through.
                            return chaisePage.waitForUrl('/record/', browser.params.defaultTimeout);
                        }).then(function() {
                            expect(browser.driver.getCurrentUrl()).toContain('/record/');
                            // - Go back to initial RecordSet page
                            browser.close();
                            return browser.switchTo().window(allWindows[0]);
                        }).then(function() {
                            return chaisePage.recordsetPage.getDeleteActionButtons().get(3).click();
                        }).then(function () {
                            var modalTitle = chaisePage.recordPage.getConfirmDeleteTitle();
                            browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                            // expect modal to open
                            return modalTitle.getText();
                        }).then(function(text) {
                            expect(text).toBe("Confirm Delete");
                            return chaisePage.recordPage.getConfirmDeleteButton().click();
                        }).then(function() {
                            // Expect another modal to appear to tell user that this record cannot be deleted
                            // and user should check the updated UI for latest row data.
                            chaisePage.waitForElement(element(by.id('confirm-btn')));
                            return element(by.id('confirm-btn')).click();
                        }).then(function() {
                            return chaisePage.waitForElementInverse(element(by.id("spinner")));
                        }).then(function() {
                            var rows = chaisePage.recordsetPage.getRows();
                            var changedCell = rows.get(3).all(by.css('td')).get(4);
                            expect(changedCell.getText()).toBe('as;dkfa;sljk als;dkj f;alsdjf a;');
                        }).catch(function(error) {
                            console.dir(error);
                            expect(error).not.toBeDefined();
                        });
                    });

                    it("action columns should show delete button that deletes record", function() {
                        var deleteButton;
                        chaisePage.waitForElementInverse(element(by.id("spinner"))).then(function() {
                            return chaisePage.recordsetPage.getDeleteActionButtons();
                        }).then(function(deleteButtons) {
                            expect(deleteButtons.length).toBe(4);
                            deleteButton = deleteButtons[3];
                            return deleteButton.click();
                        }).then(function() {
                            var EC = protractor.ExpectedConditions;
                            var confirmButton = chaisePage.recordsetPage.getConfirmDeleteButton();
                            browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);

                            return confirmButton.click();
                        }).then(function() {
                            var EC = protractor.ExpectedConditions;
                            browser.wait(EC.stalenessOf(deleteButton), browser.params.defaultTimeout);
                        }).then(function() {
                            return chaisePage.recordsetPage.getRows();
                        }).then(function(rows) {
                            expect(rows.length).toBe(3);
                        });
                    });
                });

            });

        })(testParams.tuples[i], i);


    }

    describe("For table " + fileParams.table_name + ',', function() {
        var EC = protractor.ExpectedConditions;

        beforeAll(function () {
            browser.ignoreSynchronization = true;
            browser.get(browser.params.url + ':' + fileParams.table_name);
        });

        it("should load the table with " + fileParams.custom_page_size + " rows of data based on the page size annotation.", function() {
            // Verify page count and on first page
            var e = element(by.id("custom-page-size"));

            browser.wait(EC.presenceOf(e), browser.params.defaultTimeout).then(function() {
                return chaisePage.recordsetPage.getRows().count();
            }).then(function(ct) {
                expect(ct).toBe(fileParams.custom_page_size);
            });
        });

        it("should have " + fileParams.page_size + " rows after paging to the second page, back to the first, and then changing page size to " + fileParams.page_size + ".", function() {
            var previousBtn = chaisePage.recordsetPage.getPreviousButton();
            // page to the next page then page back to the first page so the @before modifier is applied
            chaisePage.recordsetPage.getNextButton().click().then(function() {
                // wait for it to be on the second page
                browser.wait(EC.elementToBeClickable(previousBtn), browser.params.defaultTimeout);

                return previousBtn.click();
            }).then(function() {
                //wait for it to be on the first page again
                browser.wait(EC.not(EC.elementToBeClickable(previousBtn)), browser.params.defaultTimeout);

                return chaisePage.recordsetPage.getPageLimitDropdown().click();
            }).then(function() {
                // increase the page limit
                return chaisePage.recordsetPage.getPageLimitSelector(fileParams.page_size).click();
            }).then(function() {
                browser.wait(function() {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return (ct == 10);
                    });
                }, browser.params.defaultTimeout);

                // verify more records are now shown
                return chaisePage.recordsetPage.getRows().count();
            }).then(function(ct) {
                expect(ct).toBe(fileParams.page_size);
            });
        });
    });

    describe("For chaise config properties", function () {
        var EC = protractor.ExpectedConditions;

        it('should load custom CSS and document title defined in chaise-config.js', function() {
            var chaiseConfig, tupleParams = testParams.tuples[0], keys = [];
            tupleParams.keys.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            var url = browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&") + "@sort(" + tupleParams.sortby + ")";
            browser.get(url);
            chaisePage.waitForElement(element(by.id('page-title')), browser.params.defaultTimeout).then(function() {
                return browser.executeScript('return chaiseConfig');
            }).then(function(config) {
                chaiseConfig = config;
                return browser.executeScript('return $("link[href=\'' + chaiseConfig.customCSS + '\']")');
            }).then(function(elemArray) {
                expect(elemArray.length).toBeTruthy();
                return browser.getTitle();
            }).then(function(title) {
                expect(title).toEqual(chaiseConfig.headTitle);
            }).catch(function(error) {
                console.log('ERROR:', error);
                // Fail the test
                expect('There was an error in this promise chain.').toBe('See the error msg for more info.');
            });
        });

        describe("For when no catalog or schema:table is specified,", function() {
            var baseUrl;

            beforeAll(function () {
                browser.ignoreSynchronization = true;
            });

            if (!process.env.TRAVIS) {
                it("should use the default catalog and schema:table defined in chaise config if no catalog or schema:table is present in the uri.", function() {
                    browser.get(process.env.CHAISE_BASE_URL + "/recordset");

                    chaisePage.waitForElement(chaisePage.recordsetPage.getPageLimitDropdown(), browser.params.defaultTimeout).then(function() {
                        return chaisePage.recordsetPage.getPageTitleElement().getText();
                    }).then(function (title) {
                        expect(title).toBe("Dataset");
                    });
                });

                it("should use the default schema:table defined in chaise config if no schema:table is present in the uri.", function() {
                    browser.get(process.env.CHAISE_BASE_URL + "/recordset/#1");

                    chaisePage.waitForElement(chaisePage.recordsetPage.getPageLimitDropdown(), browser.params.defaultTimeout).then(function() {
                        return chaisePage.recordsetPage.getPageTitleElement().getText();
                    }).then(function (title) {
                        expect(title).toBe("Dataset");
                    });
                });
            }

            it("should throw a malformed URI error when no default schema:table is set for a catalog.", function() {
                browser.get(process.env.CHAISE_BASE_URL + "/recordset/#" + browser.params.catalogId);

                var modalTitle = chaisePage.recordEditPage.getModalTitle();

                chaisePage.waitForElement(modalTitle, browser.params.defaultTimeout).then(function() {
                    return modalTitle.getText();
                }).then(function (title) {
                    expect(title).toBe("Error: MalformedUriError");
                });
            });
        });
    });

});
