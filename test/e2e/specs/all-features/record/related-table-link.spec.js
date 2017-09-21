var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    schemaName: "product-unordered-related-tables-links",
    table_name: "accommodation",
    key: {
        name: "id",
        value: "2004",
        operator: "="
    },
    tables_order: [
        "accommodation_image (showing first 2 results)",
        "association_table (showing all 1 results)",
        "booking (showing all 6 results)",
        "media (showing all 1 results)"
    ],
    related_table_name_with_page_size_annotation: "accommodation_image",
    related_table_name_with_link_in_table: "accommodation_image",
    related_table_name_with_row_markdown_pattern: "media",
    related_linked_table: "file",
    related_linked_subtitle: "for Accommodations = Super 8 North Hollywood Motel",
    related_associate_table: "accommodation_image",
    related_regular_table: "booking",
    related_regular_subtitle: "for Accommodations = Super 8 North Hollywood Motel",
    association_table_name: "association_table",
    association_table_name_markdown: "association_table_markdown",
    leaf_table: "related_table",
    leaf_table_filter: "2",
    leaf_table_name: "related_table",
    leaf_table_subtitle: "for base table association related = Super 8 North Hollywood Motel",
    associationTable_key_filter:"2004",
    booking_count: 6,
    association_count: 1,
    page_size: 2,
    price: "247.00"
};

describe('View existing record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        beforeAll(function() {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
            browser.ignoreSynchronization=true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name + "/" + keys.join("&");
            browser.get(url);
            chaisePage.waitForElement(element(by.id('rt-accommodation_image')));
        });

        describe("Show the related entity tables,", function() {
            // Default order tests
            it("should have the tables in default order.", function() {
                return chaisePage.waitForElementInverse(element(by.id("spinner")));
                chaisePage.recordPage.getRelatedTableTitles().then(function(headings) {
                    // tables should be in order based on the default order because no visible foreign keys annotation is defined
                    // Headings have a '-' when page loads, and a count after them
                    expect(headings).toEqual(testParams.tables_order);
                });
            });

            // Page size is set to 2 for the file table so that only 2 entries should be present with a link
            it("should honor the page_size annotation for the table, file, in the compact/brief context.", function() {
                var relatedTableName = testParams.related_table_name_with_page_size_annotation;

                chaisePage.recordPage.getRelatedTableRows(relatedTableName).count().then(function(count) {
                    expect(count).toBe(testParams.page_size);
                });
            });

            // related table links tests
            var allWindows;

            it("should create a functional link for table rows with links in them.", function() {
                var relatedTableName = testParams.related_table_name_with_link_in_table;

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
                    markdownRelatedTable = testParams.related_table_name_with_row_markdown_pattern, // "media"
                    markdownToggleLink = chaisePage.recordPage.getToggleDisplayLink(markdownRelatedTable);

                browser.wait(EC.elementToBeClickable(markdownToggleLink), browser.params.defaultTimeout);

                // expect the markdown table to display this link
                expect(markdownToggleLink.isDisplayed()).toBeTruthy();

                // Expect initial display to be markdown by searching for a .markdown-container
                var initialMarkdownDisplay = element(by.id('rt-heading-' + markdownRelatedTable)).element(by.css('.markdown-container'));
                expect(initialMarkdownDisplay.isDisplayed()).toBeTruthy();

                chaisePage.clickButton(markdownToggleLink).then(function() {
                    // After clicking toggle link, the table should now be displayed as a regular table (which would have an id of "rt-media")
                    tableDisplay = element(by.id('rt-' + markdownRelatedTable));
                    var viewActions = tableDisplay.all(by.css(".view-action-button"));
                    return viewActions;
                }).then(function(btns) {
                    browser.wait(EC.elementToBeClickable(btns[0]), browser.params.defaultTimeout);

                    expect(tableDisplay.isDisplayed()).toBeTruthy();
                    return chaisePage.clickButton(markdownToggleLink);
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
                        relatedTableName = testParams.related_regular_table,
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
                        newTabUrl = browser.params.url + '/recordedit/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name;
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
                        var nowBtn = element.all(by.css('button[name="booking_date-now"]')).get(0);
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
                    return chaisePage.waitForElementInverse(element(by.id("spinner")));
                    var EC = protractor.ExpectedConditions,
                        relatedTableName = testParams.related_regular_table,
                        relatedTableSubtitle = testParams.related_regular_subtitle,
                        relatedUnfilteredLink = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + relatedTableName,
                        relatedTableHeading = chaisePage.recordPage.getRelatedTableHeadingTitle(relatedTableName);

                    var relatedTableLink = chaisePage.recordPage.getMoreResultsLink(relatedTableName);
                    browser.wait(EC.visibilityOf(relatedTableLink), browser.params.defaultTimeout).then(function() {
                        // waits until the count is what we expect, so we know the refresh occured
                        browser.wait(function() {
                            return chaisePage.recordPage.getRelatedTableRows(relatedTableName).count().then(function(ct) {
                                return (ct == testParams.booking_count + 1);
                            });
                        }, browser.params.defaultTimeout);

                        return chaisePage.recordPage.getRelatedTableRows(relatedTableName).count();
                    }).then(function(count) {
                        expect(count).toBe(testParams.booking_count + 1);
                        expect(relatedTableHeading.getText()).toBe("booking (showing all 7 results)", "Booking related table heading did not update");
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
                        expect(chaisePage.recordsetPage.getPageSubtitleElement().getText()).toBe(relatedTableSubtitle);
                        expect(chaisePage.recordsetPage.getShowUnfilterdButton().getAttribute('href')).toEqual(relatedUnfilteredLink);
                        browser.navigate().back();
                    });
                });
            });

            describe("for a related entity without an association table", function() {
                it("should have a \"Add\" link for a related table that opens up a pop-up for adding new entries.", function() {
                    var EC = protractor.ExpectedConditions, rows,
                        modalTitle = chaisePage.recordEditPage.getModalTitle(),
                        relatedTableName = testParams.related_associate_table,
                        addRelatedRecordLink = chaisePage.recordPage.getAddRecordLink(relatedTableName);

                    browser.wait(EC.elementToBeClickable(addRelatedRecordLink), browser.params.defaultTimeout);

                    expect(addRelatedRecordLink.isDisplayed()).toBeTruthy();
                    expect(addRelatedRecordLink.getText()).toBe("Add");

                    addRelatedRecordLink.click().then(function() {
                        chaisePage.waitForElement(chaisePage.recordEditPage.getModalTitle());
                        return chaisePage.recordEditPage.getModalTitle().getText();
                    }).then(function(text) {
                        var title = "Choose file";
                        expect(text).toBe(title);
                        browser.wait(function () {
                            return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                return (ct > 0);
                            });
                        });
                        rows = chaisePage.recordsetPage.getRows();
                        return rows.count();
                    }).then(function(ct) {
                        expect(ct).toBeGreaterThan(0);
                        return browser.executeScript("return $('[type=checkbox]').get(2);");
                    }).then(function(selectButtons) {
                        selectButtons.click();
                        return browser.executeScript("return $('.multi-select-submit-btn').click();");
                    }).then(function() {
                        browser.sleep(2000);
                        return browser.executeScript("return $('.alert-success')[0].innerText;");
                    }).then(function(successMsg){
                        expect(successMsg).toBe("×Success Your data has been submitted. Showing you the result set...");
                    }).catch(function(error) {
                        console.log(error);
                        expect('There was an error in this promise chain').toBe('Please see error message.');
                    });
                });

                it("should not have a new record because of page size annotation.", function() {
                    // browser.close();
                    // browser.switchTo().window(allWindows[0]);

                    var EC = protractor.ExpectedConditions,
                        relatedTableName = testParams.related_associate_table,
                        relatedTableLink = chaisePage.recordPage.getMoreResultsLink(relatedTableName);

                    browser.wait(EC.visibilityOf(relatedTableLink), browser.params.defaultTimeout);

                    chaisePage.recordPage.getRelatedTableRows(relatedTableName).count().then(function(count) {
                        expect(count).toBe(testParams.page_size);
                    });
                });

                it("should have a View More link for a related table that redirects to recordset.", function() {
                    var relatedTableNameOnRecord = testParams.related_associate_table,
                        relatedTableNameOnRecordset = testParams.related_linked_table,
                        relatedTableSubtitleOnRecordset = testParams.related_linked_subtitle,
                        relatedTableLink = chaisePage.recordPage.getMoreResultsLink(relatedTableNameOnRecord),
                        relatedUnfilteredLink = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + relatedTableNameOnRecordset;

                    expect(relatedTableLink.isDisplayed()).toBeTruthy();

                    relatedTableLink.click().then(function() {
                        return browser.driver.getCurrentUrl();
                    }).then(function(url) {
                        expect(url.indexOf('recordset')).toBeGreaterThan(-1);
                        // check entity title is for related table, not asociation table
                        return chaisePage.waitForElement(element(by.id("divRecordSet")));
                    }).then(function() {
                        expect(chaisePage.recordsetPage.getPageTitleElement().getText()).toBe(relatedTableNameOnRecordset);
                        expect(chaisePage.recordsetPage.getPageSubtitleElement().getText()).toBe(relatedTableSubtitleOnRecordset);
                        expect(chaisePage.recordsetPage.getShowUnfilterdButton().getAttribute('href')).toEqual(relatedUnfilteredLink);
                    });
                });
            });

        });

        describe("For a related entity with an association table", function() {
            beforeAll(function() {
                var keys = [];
                keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
                browser.ignoreSynchronization=true;
                var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name + "/" + keys.join("&");
                browser.get(url);
                chaisePage.waitForElement(element(by.id('rt-heading-association_table')));
            });

            it("on click of Add button should let you add a new relationship", function(){
                var associationTableName = testParams.association_table_name;
                var addRelatedRecordLink = chaisePage.recordPage.getAddRecordLink(associationTableName);
                var EC = protractor.ExpectedConditions, newTabUrl, foreignKeyInputs;
                browser.wait(EC.elementToBeClickable(addRelatedRecordLink), browser.params.defaultTimeout);

                expect(addRelatedRecordLink.isDisplayed()).toBeTruthy();
                expect(addRelatedRecordLink.getText()).toBe("Add");
                addRelatedRecordLink.click().then(function(){
                    browser.wait(function () {
                           return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                               return (ct > 0);
                           });
                       });
                    rows = chaisePage.recordsetPage.getRows();
                }).then(function(ct){
                    return browser.executeScript("return $('[type=checkbox]').get(1);");
                }).then(function (selectButtons){
                    selectButtons.click();
                    return browser.executeScript("return $('.multi-select-submit-btn').click();");
                }).then(function () {
                    return browser.wait(EC.presenceOf(element(by.id('entity-title'))), browser.params.defaultTimeout);
                }).then(function (){
                    browser.driver.navigate().refresh();
                    chaisePage.waitForElement(element(by.id('rt-heading-association_table')));
                    browser.wait(function() {
                        return chaisePage.recordPage.getRelatedTableRows(associationTableName).count().then(function(ct) {
                            return ct == testParams.association_count + 1;
                        });
                    }, browser.params.defaultTimeout);
                     return chaisePage.recordPage.getRelatedTableRows(associationTableName).count();
                }).then(function (count){
                    expect(count).toBe(testParams.association_count + 1)
                }).catch(function(error) {
                    console.log(error);
                    expect('There was an error in this promise chain').toBe('Please see error message.');
                });
            });

            it("on click of Edit button should let you edit an existing relationship", function(){
                var associationTableName = testParams.association_table_name;
                var associationTableKey = testParams.associationTable_key_filter;

                var EC = protractor.ExpectedConditions;
                var e = element(by.id('rt-' + associationTableName));
                browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);

                chaisePage.recordPage.getRelatedTableRows(associationTableName).then(function(rows) {
                    return rows[0].all(by.tagName("td"));
                }).then(function(cell) {
                    return cell[0].all(by.css(".edit-action-button"));
                }).then(function(editButtons) {
                    return chaisePage.clickButton(editButtons[0]);
                }).then(function() {
                    return browser.getAllWindowHandles();
                }).then(function(handles) {
                    allWindows = handles;
                    return browser.switchTo().window(allWindows[1]);
                }).then(function() {
                    var result = '/recordedit/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + associationTableName + "/id_base=" + associationTableKey;
                    expect(browser.driver.getCurrentUrl()).toContain(result);
                    return chaisePage.waitForElement(element(by.id('submit-record-button')));
                }).then(function(){
                    return chaisePage.recordEditPage.getForeignKeyInputs();
                }).then(function(inputs) {
                    foreignKeyInputs = inputs;
                    return chaisePage.recordEditPage.getModalPopupBtnsUsingScript();
                }).then(function(popupBtns){
                    return chaisePage.clickButton(popupBtns[0]);
                }).then (function () {
                    browser.wait(function () {
                          return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                              return (ct > 0);
                          });
                      });
                   rows = chaisePage.recordsetPage.getRows();
               }).then(function(ct){
                   return rows.get(3).all(by.css(".select-action-button"));
               }).then(function(selectButtons){
                   return selectButtons[0].click();
               }).then(function() {
                   return chaisePage.recordEditPage.submitForm();
               }).then(function(){

                   return browser.wait(EC.presenceOf(element(by.id('entity-title'))), browser.params.defaultTimeout);
               }).then(function() {
                   browser.close();
                   return browser.switchTo().window(allWindows[0]);
               }).then(function (){
                   browser.driver.navigate().refresh();
                   chaisePage.waitForElement(element(by.id('rt-heading-association_table')));
                   return chaisePage.recordPage.getRelatedTableRows(associationTableName);
               }).then(function(rows){
                   return rows[1].all(by.tagName("td"));
               }).then(function (cells){
                   return cells[1].all(by.css("a"));;
               }).then(function(cell){
                  return cell[0].getAttribute('innerHTML');
              }).then(function(id){
                  expect(id).toBe('4');
              }).catch(function(error) {
                  console.log(error);
                  expect('There was an error in this promise chain').toBe('Please see error message.');
              });
            });

            it("on click of View button should redirect to record page of related entity", function(){
                var relatedTableName = testParams.association_table_name; // association table
                var linkedToTableName = testParams.leaf_table; // linked to table
                var linkedToTableFilter = testParams.leaf_table_filter;

                chaisePage.recordPage.getRelatedTableRows(relatedTableName).then(function(rows) {
                    return rows[0].all(by.tagName("td"));
                }).then(function(cell){
                    return cell[0].all(by.css(".view-action-button"));
                }).then(function(actionButtons) {
                    return actionButtons[0].click();
                }).then(function() {
                    var result = '/record/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + linkedToTableName + "/id=" + linkedToTableFilter;
                    chaisePage.waitForUrl(result, browser.params.defaultTimeout).finally(function() {
                        expect(browser.driver.getCurrentUrl()).toContain(result);
                        browser.navigate().back();
                    });
                });
            });

            it("on click of View more button should redirect to recordset page of association table", function(){
                chaisePage.waitForElement(element(by.id('rt-heading-association_table')));
                var relatedTableNameOnRecord = testParams.association_table_name,
                    relatedTableNameOnRecordset = testParams.leaf_table_name,
                    relatedTableSubtitleOnRecordset = testParams.leaf_table_subtitle,
                    relatedTableLink = chaisePage.recordPage.getMoreResultsLink(relatedTableNameOnRecord),
                    relatedUnfilteredLink = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + relatedTableNameOnRecordset;

                expect(relatedTableLink.isDisplayed()).toBeTruthy();

                relatedTableLink.click().then(function() {
                    return browser.driver.getCurrentUrl();
                }).then(function(url) {
                    expect(url.indexOf('recordset')).toBeGreaterThan(-1);
                    // check entity title is for related table, not asociation table
                    return chaisePage.waitForElement(element(by.id("divRecordSet")));
                }).then(function() {
                    expect(chaisePage.recordsetPage.getPageTitleElement().getText()).toBe(testParams.leaf_table_name);
                    expect(chaisePage.recordsetPage.getPageSubtitleElement().getText()).toBe(testParams.leaf_table_subtitle);
                    expect(chaisePage.recordsetPage.getShowUnfilterdButton().getAttribute('href')).toEqual(relatedUnfilteredLink);
                });

            });
        });

        describe("For a related entity wuth an association table and markdown display", function () {
            beforeAll(function() {
                var keys = [];
                keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
                browser.ignoreSynchronization=true;
                var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name + "/" + keys.join("&");
                browser.get(url);
                chaisePage.waitForElement(element(by.id('rt-heading-association_table_markdown')));
            });

            it("on adding new relationship should update the table display", function (){
                var associationTableName = testParams.association_table_name_markdown;
                var addRelatedRecordLink = chaisePage.recordPage.getAddRecordLink(associationTableName);
                var EC = protractor.ExpectedConditions, newTabUrl, foreignKeyInputs;
                browser.wait(EC.elementToBeClickable(addRelatedRecordLink), browser.params.defaultTimeout);

                expect(addRelatedRecordLink.isDisplayed()).toBeTruthy("The Add button is not displayed");
                expect(addRelatedRecordLink.getText()).toBe("Add", "The Add button is not displayed as Add");

                addRelatedRecordLink.click().then(function(){
                }).then(function(){
                    browser.wait(function () {
                           return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                               return (ct > 0);
                           });
                       });
                    rows = chaisePage.recordsetPage.getRows();
                }).then(function(ct){
                    return browser.executeScript("return $('input').get(2);");
                }).then(function (selectButtons){
                    selectButtons.click();
                    return browser.executeScript("return $('.multi-select-submit-btn').click();");
                }).then(function () {
                    return browser.wait(EC.presenceOf(element(by.id('entity-title'))), browser.params.defaultTimeout);
                }).then(function (){
                     // browser.switchTo() does not work some times and the test case fails
                     return chaisePage.recordPage.getRelatedTableRows(associationTableName).count();
                }).then(function (count){
                    expect(count).toBe(testParams.association_count + 1);
                }).catch(function(error) {
                    console.log(error);
                    expect('There was an error in this promise chain').toBe('Please see error message.');
                });
            });
        })
    });
});
