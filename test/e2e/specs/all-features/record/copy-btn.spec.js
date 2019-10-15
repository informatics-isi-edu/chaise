var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../../../utils/record-helpers.js');
var recordSetHelpers = require('../../../utils/recordset-helpers.js');
var testParams = {
    table_name: "editable-id-table",
    table_displayname: "Editable Id Table",
    table_inner_html_display: "<strong>Editable Id Table</strong>",
    entity_title: "1",
    entity_inner_html_title: "<strong>1</strong>",
    html_table_name: "html-name-table",
    html_table_display: "<strong>Html Name</strong>",
    keys: [{"name": "id", "value": 1, "operator": "="}],
    html_keys: [{"name": "id", "value": 1, "operator": "="}]
};

var relatedTableTestParams = {
    table_name: "accommodation",
    key: {
        name: "id",
        value: "2002",
        operator: "="
    },
};

describe('View existing record,', function() {

    describe("For table " + relatedTableTestParams.table_name + ",", function() {

        // this test is for verifying the related tables option, maxRelatedTablesOpen
        beforeAll(function() {
            var keys = [];
            browser.ignoreSynchronization = true;
            keys.push(relatedTableTestParams.key.name + relatedTableTestParams.key.operator + relatedTableTestParams.key.value);
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/product-max-RT:" + relatedTableTestParams.table_name + "/" + keys.join("&");
            browser.get(url);
            chaisePage.waitForElement(chaisePage.recordPage.getEntityTitleElement(), browser.params.defaultTimeout);

        });

        it("should load chaise-config.js and have maxRelatedTablesOpen=9", function() {
            browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                expect(chaiseConfig.maxRelatedTablesOpen).toBe(9);
            });
        });

        it('should collapse related tables after it exceeds the maxRelatedTablesOpen value',function(){
            expect(element.all(by.css('.panel-open')).count()).toEqual(0);
        });

        it ("should have only 'CSV' option in export menu because of `disableDefaultExport` chaise-config.", function () {
            var options = chaisePage.recordsetPage.getExportOptions();
            expect(options.count()).toBe(1, "count missmatch");
        });

    });

    // tests for subtitle link, resolverImplicitCatalog, and no citation in share modal
    describe("For table " + testParams.html_table_name + ",", function() {

        beforeAll(function() {
            var keys = [];
            browser.ignoreSynchronization=true;
            var RID = chaisePage.getEntityRow("editable-id", testParams.html_table_name, [{column: "id", value: "1"}]).RID
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/editable-id:" + testParams.html_table_name + "/RID=" + RID;
            browser.get(url);
            // TODO use recordPageReady
            chaisePage.waitForElement(element(by.id('tblRecord')));
            chaisePage.waitForElementInverse(element(by.id('rt-loading')));
        });

        it("should display the entity subtitle name with html in it.", function() {
            expect(chaisePage.recordPage.getEntitySubTitleElement().getText()).toBe(testParams.html_table_display);
        });

        it("should load chaise-config.js and have resolverImplicitCatalog=false,", function() {
            browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                expect(chaiseConfig.resolverImplicitCatalog).toBeFalsy();
            });
        });

        it("should hide the column headers and collapse the table of contents based on table-display annotation.", function () {
            chaisePage.recordPage.getColumns().then(function (cols) {
                expect(cols[0].isDisplayed()).toBeFalsy("Column names are showing.");
                expect(chaisePage.recordPage.getSidePanel().getAttribute("class")).toContain('close-panel', 'Side Panel is visible.');
            });
        });

        // test that no citation appears in share modal when no citation is defined on table
        it("should show the share dialog when clicking the share button with only permalink present.", function(done) {
            chaisePage.recordPage.getShareButton().click().then(function () {
                var shareDialog = chaisePage.recordPage.getShareModal();
                // wait for dialog to open
                chaisePage.waitForElement(shareDialog);
                shareDialog.allowAnimations(false);

                // verify modal dialog contents
                expect(chaisePage.recordEditPage.getModalTitle().getText()).toBe("Share", "Share citation modal title is incorrect");
                expect(chaisePage.recordPage.getModalListElements().count()).toBe(1, "Number of list elements in share citation modal is incorrect");

                return browser.getCurrentUrl();
            }).then(function (url) {
                // verify permalink
                expect(chaisePage.recordPage.getShareLinkHeader().getText()).toBe("Share Link", "Share Link (permalink) header is incorrect");
                expect(chaisePage.recordPage.getPermalinkText().getText()).toContain(url, "permalink url is incorrect");

                // close dialog
                return chaisePage.recordsetPage.getModalCloseBtn().click();
            }).then(function () {
                done();
            }).catch(function(err){
                console.log(err);
                done.fail();
            });
        });

        it("open a new tab, update the current record, close the tab, and then verify the share dialog alert warning appears", function (done) {
            var allWindows;

            browser.driver.getCurrentUrl().then(function(url) {
                url = url.replace('/record/', '/recordedit/');

                // open the same record in edit mode in another window
                return browser.executeScript('window.open(arguments[0]);', url);
            }).then(function () {
                return browser.getAllWindowHandles();
            }).then(function (handles) {
                allWindows = handles;
                return browser.switchTo().window(allWindows[1]);
            }).then(function () {
                return chaisePage.recordeditPageReady();
            }).then(function () {
                // edit the entity
                var textInput = chaisePage.recordEditPage.getInputById(0, "text");
                textInput.sendKeys(" edited");

                return chaisePage.recordEditPage.submitForm();
            }).then(function () {
                return chaisePage.recordPageReady();
            }).then(function () {
                return browser.switchTo().window(allWindows[0]);
            }).then(function () {
                return chaisePage.recordPage.getShareButton().click()
            }).then(function () {
                var shareDialog = chaisePage.recordPage.getShareModal();
                // wait for dialog to open
                chaisePage.waitForElement(shareDialog);
                shareDialog.allowAnimations(false);

                return chaisePage.recordEditPage.getAlertWarning()
            }).then(function (alert) {
                expect(alert.isDisplayed()).toBeTruthy("Alert warning the user that they may be seeing stale data is not present");

                // close dialog
                return chaisePage.recordsetPage.getModalCloseBtn().click();
            }).then(function () {
                done();
            }).catch(function(err){
                console.log(err);
                done.fail();
            });
        });
    });

    // below are the tests for the copy button
    describe("For table " + testParams.table_name + ",", function() {

        var table, record;

        beforeAll(function() {
            var keys = [];
            testParams.keys.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            browser.ignoreSynchronization=true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/editable-id:" + testParams.table_name + "/" + keys.join("&");
            browser.get(url);
            // TODO use recordPageReady
            chaisePage.waitForElement(element(by.id('tblRecord')));
            chaisePage.waitForElementInverse(element(by.id('rt-loading')));
        });

        it("should load chaise-config.js and have editRecord=true", function() {
            browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                expect(chaiseConfig.editRecord).toBe(true);
            });
        });

        describe("for the copy record button,", function() {
            var EC = protractor.ExpectedConditions,
                copyButton = chaisePage.recordPage.getCopyRecordButton();

            it("should display the entity title and subtitle based on their markdown patterns.", function() {
                // page-title and page-subtitle are attached to chaise-title,
                // subtitle structure is: chaise-title -> a -> span (therefore finding span works)
                // title structure is: chaise-title -> span -> span (therefore we need to be more specific)
                var subtitleElement = chaisePage.recordPage.getEntitySubTitleElement().element(by.css("span")),
                    titleElement = chaisePage.recordPage.getEntityTitleElement().element(by.css("span span"));

                subtitleElement.getAttribute("innerHTML").then(function(html) {
                    expect(html).toBe(testParams.table_inner_html_display);
                    expect(subtitleElement.getText()).toBe(testParams.table_displayname);

                    return titleElement.getAttribute("innerHTML");
                }).then(function(html) {
                    expect(html).toBe(testParams.entity_inner_html_title);
                    expect(titleElement.getText()).toBe(testParams.entity_title);
                });
            });

            it("should show when the page loads.", function() {
                browser.wait(EC.elementToBeClickable(copyButton), browser.params.defaultTimeout);

                copyButton.isDisplayed().then(function (bool) {
                    expect(bool).toBeTruthy();
                });
            });

            it("should not show Loading... text when there are no related tables.", function() {
                element(by.id('rt-loading')).isDisplayed().then(function (displayed) {
                    expect(displayed).toBeFalsy();
                });
            });

            it("should redirect to recordedit when clicked.", function(done) {
                var titleElement = chaisePage.recordEditPage.getEntityTitleElement();

                copyButton.click().then(function() {
                    return chaisePage.waitForElement(element(by.id('submit-record-button')));
                }).then(function() {
                    return browser.driver.getCurrentUrl();
                }).then(function(url) {
                    expect(url.indexOf('recordedit')).toBeGreaterThan(-1);

                    return titleElement.getText();
                }).then(function(txt) {
                    expect(txt).toBe("Create new " + testParams.table_displayname, "Recordedit title is incorrect.");

                    return titleElement.element(by.css('span[ng-bind-html]')).getAttribute("innerHTML");
                }).then(function(html) {
                    expect(html).toBe(testParams.table_inner_html_display);

                    return chaisePage.recordEditPage.getForms().count();
                }).then(function(ct) {
                    // only 1 row is copied at this time
                    expect(ct).toBe(1);
                    done();
                }).catch(function(error) {
                    done.fail(error);
                });
            });

            it("should have 'Automatically Generated' in an input that is generated rather than copying the value from the copied record.", function() {
                chaisePage.recordEditPage.getInputById(0, "generated").getAttribute("placeholder").then(function (text) {
                    expect(text).toBe("Automatically generated");
                });
            });

            it("should alert the user if trying to submit data without changing the id.", function() {
                chaisePage.recordEditPage.submitForm();
                browser.wait(function() {
                    return chaisePage.recordEditPage.getAlertError();
                }, browser.params.defaultTimeout).then(function(error) {
                    return error.getText();
                }).then(function(text) {
                    expect(text.indexOf("The entry cannot be created/updated. Please use a different id for this record.")).toBeGreaterThan(-1, "Text for conflict error is not correct");
                }).catch(function(error) {
                    console.log(error);
                    expect('There was an error.').toBe('Please check the error message.');
                });
            });

            it("should redirect to record after changing the id and resubmitting.", function() {
                var idInput = chaisePage.recordEditPage.getInputById(0, "id");
                idInput.clear();
                idInput.sendKeys("777");
                chaisePage.recordEditPage.submitForm();
                browser.driver.getCurrentUrl().then(function(url) {
                    expect(url.indexOf("record")).toBeGreaterThan(-1);
                });
            });
        });
    });
});
