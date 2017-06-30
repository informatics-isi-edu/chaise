var chaisePage = require('../../../utils/chaise.page.js');;
var testParams = {
    accommodation_tuple: {
        schemaName: "product-recordset",
        table_name: "accommodation",
        displayName: "Accommodations",
        title: "Accommodations",
        key: { name: "id", value: "2001", operator: "::gt::"},
        sortby: "no_of_rooms",
        columns: [
            { title: "Name of Accommodation", value: "Sherathon Hotel", type: "text"},
            { title: "Website", value: "<p class=\"ng-scope\"><a href=\"http://www.starwoodhotels.com/sheraton/index.html\">Link to Website</a></p>", type: "text", comment: "A valid url of the accommodation"},
            { title: "User Rating", value: "4.3000", type: "float4"},
            { title: "Summary", value: "Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.", type: "longtext"},
            { title: "Operational Since", value: "2008-12-09 00:00:00", type: "timestamptz" },
            { title: "Is Luxurious", value: "true", type: "boolean" },
            { title: "json_col", value:JSON.stringify({"name":"testing JSON"},undefined,2), type: "json" }
        ],
        data: [
            {
                id: 2003,
                title: "NH Munich Resort",
                website: "http://www.nh-hotels.com/hotels/munich",
                rating: "3.2000",
                summary: "NH Hotels has six resorts in the city of Munich. Very close to Munich Main Train Station -- the train being one of the most interesting choices of transport for travelling around Germany -- is the four-star NH München Deutscher Kaiser Hotel. In addition to the excellent quality of accommodation that it offers, the hotel is located close to Marienplatz, the monumental central square in the city, the Frauenkirche church, Stachus (Karlsplatz) and the Viktualienmarkt. Other places of interest to explore in Munich are the English garden, the spectacular Nymphenburg Palace and the German Museum, a museum of science and technology very much in keeping with the industrial spirit of the city. Do not forget to visit Munich at the end of September and beginning of October, the time for its most famous international festival: Oktoberfest! Beer, sausages, baked knuckles and other gastronomic specialities await you in a festive atmosphere on the grasslands of Theresienwiese. Not to be missed! And with NH Hotels you can choose the hotels in Munich which best suit your travel plans, with free WiFi and the possibility to bring your pets with you.\n... more",
                opened_on: "1976-06-15 00:00:00",
                luxurious: "true",
                json_col: JSON.stringify({"name":"testing_json"},undefined,2)
            },
            {
                id: 2002,
                title: "Sherathon Hotel",
                website: "http://www.starwoodhotels.com/sheraton/index.html",
                rating: "4.3000",
                summary: "Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.",
                opened_on: "2008-12-09 00:00:00",
                luxurious: "true",
                json_col: JSON.stringify(null,undefined,2)
            },
            {
                id: 2004,
                title: "Super 8 North Hollywood Motel",
                website: "https://www.kayak.com/hotels/Super-8-North-Hollywood-c31809-h40498/2016-06-09/2016-06-10/2guests",
                summary: "Fair Hotel. Close to Universal Studios. Located near shopping areas with easy access to parking. Professional staff and clean rooms. Poorly-maintained rooms.",
                rating: "2.8000",
                opened_on: "2013-06-11 00:00:00",
                luxurious: "false",
                json_col: JSON.stringify({"name": "Testing","age": 25},undefined,2)
            },
            {
                id: 4004,
                title: "Hilton Hotel",
                website: "",
                summary: "Great Hotel. We've got the best prices out of anyone. Stay here to make America great again. Located near shopping areas with easy access to parking. Professional staff and clean rooms. Poorly-maintained rooms.",
                rating: "4.2000",
                opened_on: "2013-06-11 00:00:00",
                luxurious: "true",
                json_col: "9876.3543"
            }
        ]
    },
    file_tuple: {
        table_name: "file",
        custom_page_size: 5,
        page_size: 10
    }
};

describe('View recordset,', function() {

    var accommodationParams = testParams.accommodation_tuple,
        fileParams = testParams.file_tuple;

    describe("For table " + accommodationParams.table_name + ",", function() {

        beforeAll(function () {
            var keys = [];
            keys.push(accommodationParams.key.name + accommodationParams.key.operator + accommodationParams.key.value);
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-recordset:" + accommodationParams.table_name + "/" + keys.join("&") + "@sort(" + accommodationParams.sortby + ")");

            chaisePage.waitForElement(element(by.id("divRecordSet")));
        });

        describe("Presentation ,", function() {
            var recEditUrl =  '';
            it("should have '" + accommodationParams.title +  "' as title", function() {
                var title = chaisePage.recordsetPage.getPageTitleElement();
                expect(title.getText()).toEqual(accommodationParams.title);
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
                                expect(cells.length).toBe(accommodationParams.columns.length + 1);
                                expect(cells[1].getText()).toBe(accommodationParams.data[index].title);
                                expect(cells[2].element(by.tagName("a")).getAttribute("href")).toBe(accommodationParams.data[index].website);
                                expect(cells[2].element(by.tagName("a")).getText()).toBe("Link to Website");
                                expect(cells[3].getText()).toBe(accommodationParams.data[index].rating);
                                expect(cells[4].getText()).toBe(accommodationParams.data[index].summary);
                                expect(cells[5].getText()).toBe(accommodationParams.data[index].opened_on);
                                expect(cells[6].getText()).toBe(accommodationParams.data[index].luxurious);
                                expect(cells[7].getText()).toBe(accommodationParams.data[index].json_col);
                            });
                        }(i))
                    }
                });
            });

            it("should have " + accommodationParams.columns.length + " columns", function() {
                chaisePage.recordsetPage.getColumnNames().then(function(columns) {
                    expect(columns.length).toBe(accommodationParams.columns.length);
                    for (var i = 0; i < columns.length; i++) {
                        expect(columns[i].getText()).toEqual(accommodationParams.columns[i].title);
                    }
                });
            });

            it("should show line under columns which have a comment and inspect the comment value too", function() {
                var columns = accommodationParams.columns.filter(function(c) {
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

            it("JSON Column value should be searchable", function(){
                var searchBox = chaisePage.recordsetPage.getSearchBox(),
                searchSubmitButton = chaisePage.recordsetPage.getSearchSubmitButton(),
                clearSearchButton = chaisePage.recordsetPage.getSearchClearButton(),
                noResultsMessage = "No Results Found";
                
                searchBox.sendKeys('testing_json');
                searchSubmitButton.click().then(function() {
                    return chaisePage.waitForElementInverse(element(by.id("spinner")));
                }).then(function() {
                    return chaisePage.recordsetPage.getRows()
                }).then(function(rows) {
                    expect(rows.length).toBe(1);
                    // clear search
                    return clearSearchButton.click();
                }).then(function(){
                    searchBox.sendKeys('testing_jsonb');
                    return searchSubmitButton.click();
                }).then(function(){
                    return chaisePage.recordsetPage.getRows();
                }).then(function(rows) {
                    expect(rows.length).toBe(0);
                    // clear search
                    return clearSearchButton.click();
                });
                
            });
            
            it("action columns should show view button that redirects to the record page", function() {
                chaisePage.waitForElementInverse(element(by.id("spinner"))).then(function() {
                    return chaisePage.recordsetPage.getViewActionButtons();
                }).then(function(viewButtons) {
                    expect(viewButtons.length).toBe(4);
                    return viewButtons[0].click();
                }).then(function() {
                    var result = '/record/#' + browser.params.catalogId + "/" + accommodationParams.schemaName + ":" + accommodationParams.table_name + "/id=" + accommodationParams.data[0].id;
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
                    var result = '/recordedit/#' + browser.params.catalogId + "/" + accommodationParams.schemaName + ":" + accommodationParams.table_name + "/id=" + accommodationParams.data[0].id;
                    browser.driver.getCurrentUrl().then(function(url) {
                        // Store this for use in later spec.
                        recEditUrl = url;
                    });
                    expect(browser.driver.getCurrentUrl()).toContain(result);
                    browser.close();
                    browser.switchTo().window(allWindows[0]);
                });
            });

            xit('should show a modal if user tries to delete (via action column) a record that has been modified by someone else (412 error)', function() {
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
            }).pend("412 support has been dropped from ermestjs.");

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

    describe("For table " + fileParams.table_name + ',', function() {
        var EC = protractor.ExpectedConditions;

        beforeAll(function () {
            browser.ignoreSynchronization = true;
            browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-recordset:" + fileParams.table_name);
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

    describe("For window ID and page ID", function() {
        var windowId, pageId;

        beforeEach(function () {
            var keys = [];
            keys.push(accommodationParams.key.name + accommodationParams.key.operator + accommodationParams.key.value);
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-recordset:" + accommodationParams.table_name + "/" + keys.join("&") + "@sort(" + accommodationParams.sortby + ")");

            chaisePage.waitForElement(element(by.id("divRecordSet"))).then(function () {
                return chaisePage.getWindowName();
            }).then(function (name) {
                windowId = name;
                return chaisePage.getPageId();
            }).then(function (id) {
                pageId = id;
            });
        });

        it("clicking view action should change current window with the same window ID and a new page ID.", function () {
            chaisePage.recordsetPage.getViewActionButtons().then(function(viewButtons) {
                return viewButtons[0].click();
            }).then(function() {
                var result = '/record/#' + browser.params.catalogId + "/" + accommodationParams.schemaName + ":" + accommodationParams.table_name + "/id=" + accommodationParams.data[0].id;
                return chaisePage.waitForUrl(result, browser.params.defaultTimeout);
            }).finally(function() {
                expect(chaisePage.getWindowName()).toBe(windowId);
                // pageId should change when the window changes page
                expect(chaisePage.getPageId()).not.toBe(pageId);
                browser.navigate().back();
                return chaisePage.waitForElementInverse(element(by.id("spinner")));
            }).then(function() {
                expect(chaisePage.getWindowName()).toBe(windowId);
                // pageId should change when navigating back
                expect(chaisePage.getPageId()).not.toBe(pageId);
            });
        });

        it("clicking edit action should open a new window with a new window ID and a new page ID.", function () {
            var allWindows;

            chaisePage.recordsetPage.getEditActionButtons().then(function(editButtons) {
                return editButtons[0].click();
            }).then(function() {
                return browser.getAllWindowHandles();
            }).then(function(handles) {
                allWindows = handles;
                return browser.switchTo().window(allWindows[1]);
            }).then(function() {
                var result = '/recordedit/#' + browser.params.catalogId + "/" + accommodationParams.schemaName + ":" + accommodationParams.table_name + "/id=" + accommodationParams.data[0].id;
                return chaisePage.waitForUrl(result, browser.params.defaultTimeout);
            }).finally(function() {
                expect(chaisePage.getWindowName()).not.toBe(windowId);
                // pageId should change when a new window is opened
                expect(chaisePage.getPageId()).not.toBe(pageId);
                browser.close();
                return browser.switchTo().window(allWindows[0]);
            }).then(function () {
                expect(chaisePage.getWindowName()).toBe(windowId);
                // pageId should not have changed when a new window was opened
                expect(chaisePage.getPageId()).toBe(pageId);
            });
        });
    });

    describe("For chaise config properties", function () {
        var EC = protractor.ExpectedConditions;

        it('should load chaise-config.js with confirmDelete=true && defaults catalog and table set', function() {
            var chaiseConfig, keys = [];
            keys.push(accommodationParams.key.name + accommodationParams.key.operator + accommodationParams.key.value);
            var url = browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-recordset:" + accommodationParams.table_name + "/" + keys.join("&") + "@sort(" + accommodationParams.sortby + ")";
            browser.get(url);
            chaisePage.waitForElement(element(by.id('page-title')), browser.params.defaultTimeout).then(function() {
                return browser.executeScript('return chaiseConfig');
            }).then(function(config) {
                chaiseConfig = config;
                expect(chaiseConfig.confirmDelete).toBeTruthy();
                expect(chaiseConfig.defaultCatalog).toBe(1);
                expect(chaiseConfig.defaultTables['1'].schema).toBe("isa");
                expect(chaiseConfig.defaultTables['1'].table).toBe("dataset");
            }).catch(function(error) {
                console.log('ERROR:', error);
                // Fail the test
                expect('There was an error in this promise chain.').toBe('See the error msg for more info.');
            });
        });

        if (!process.env.TRAVIS) {
            describe("For when no catalog or schema:table is specified,", function() {
                var baseUrl;

                beforeAll(function () {
                    browser.ignoreSynchronization = true;
                });


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
        }
    });
});
