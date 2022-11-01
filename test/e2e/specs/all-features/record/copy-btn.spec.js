const { browser } = require('protractor');
var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../../../utils/record-helpers.js');
var recordSetHelpers = require('../../../utils/recordset-helpers.js');
var testParams = {
    table_name: "editable-id-table",
    tocHeaders: ['Summary', 'accommodation_image (4)', 'booking (2)', 'more-files (1)',
        'more-media (1)', 'new_media (2)', 'new_media_2 (2)', 'new_media_3 (2)',
        'new_media_4 (2)', 'new_media_5 (2)', 'new_media_6 (2)',
        'new_media_7 (2)', 'new_media_8 (2)', 'new_media_9 (2)'],
    table_displayname: "Editable Id Table",
    table_inner_html_display: "<strong>Editable Id Table</strong>",
    entity_title: "1",
    entity_inner_html_title: "<strong>1</strong>",
    html_table_name: "html-name-table",
    html_table_display: "<strong>Html Name</strong>",
    keys: [{"name": "id", "value": 1, "operator": "="}],
    html_keys: [{"name": "id", "value": 1, "operator": "="}],
    html_table_name_record_url: browser.params.url + "/record/#" + browser.params.catalogId + "/editable-id:html-name-table/RID=" + chaisePage.getEntityRow("editable-id", "html-name-table", [{column: "id", value: "1"}]).RID
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

        beforeAll(function() {
            var keys = [];
            keys.push(relatedTableTestParams.key.name + relatedTableTestParams.key.operator + relatedTableTestParams.key.value);
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/product-max-RT:" + relatedTableTestParams.table_name + "/" + keys.join("&");
            chaisePage.navigate(url);
            chaisePage.recordPageReady();
        });

        it("should load chaise-config.js and have correct, disableDefaultExport=true, showWriterEmptyRelatedOnLoad=false,", function() {
            browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                expect(chaiseConfig.disableDefaultExport).toBeTruthy();
                expect(chaiseConfig.showWriterEmptyRelatedOnLoad).toBeFalsy();
            });
        });

        it ("should have only 'This record (CSV)' option in export menu because of `disableDefaultExport` chaise-config.", function (done) {
          chaisePage.recordsetPage.getExportDropdown().click().then(function () {
            const options = chaisePage.recordsetPage.getExportOptions();
            expect(options.count()).toBe(1, "count missmatch");
            done();
          }).catch(chaisePage.catchTestError(done));
        });

        it('should hide empty related tables on load',function(){
            chaisePage.recordPage.getSidePanelTableTitles().then(function (headings) {
                headings.forEach(function (heading, idx) {
                    expect(heading.getText()).toEqual(testParams.tocHeaders[idx], "related table heading with index: " + idx + " in toc is incorrect");
                })
            })
        });

    });

    // tests for subtitle link, resolverImplicitCatalog, and no citation in share modal, and disabled export button
    describe("For table " + testParams.html_table_name + ",", function() {

        var currentBrowserUrl;
        beforeAll(function() {
            var keys = [];
            chaisePage.navigate(testParams.html_table_name_record_url);
            chaisePage.recordPageReady();
        });

        it("should display the entity subtitle name with html in it.", function() {
            var subTitleEl = chaisePage.recordPage.getEntitySubTitleElement();
            chaisePage.waitForElement(subTitleEl);
            expect(subTitleEl.getText()).toBe(testParams.html_table_display);
        });

        it("should load chaise-config.js and have resolverImplicitCatalog=false,", function() {
            browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                expect(chaiseConfig.resolverImplicitCatalog).toBeFalsy();
            });
        });

        // we're not using default tempaltes and csv option is disabled
        it ("export button should be disabled", function () {
            expect(chaisePage.recordsetPage.getExportDropdown().getAttribute("disabled")).toBeTruthy();
        });

        it("should hide the column headers and collapse the table of contents based on table-display annotation.", function () {
            chaisePage.recordPage.getColumns().then(function (cols) {
                expect(cols[0].isDisplayed()).toBeFalsy("Column names are showing.");
                expect(chaisePage.recordPage.getSidePanel().getAttribute("class")).toContain('close-panel', 'Side Panel is visible.');
            });
        });

        // test that no citation appears in share modal when no citation is defined on table
        // and also version link is not displayed when the table doesn't support history
        recordHelpers.testSharePopup({
            permalink: testParams.html_table_name_record_url,
            hasVersionedLink: true,
            citation: null,
            bibtextFile: null,
            title: "Share"
        });

        xit("open a new tab, update the current record, close the tab, and then verify the share dialog alert warning appears", function (done) {
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

                return chaisePage.recordEditPage.getReactAlertWarning();
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

    // below are the tests for the copy button, and no csv option
    describe("For table " + testParams.table_name + ",", function() {

        var table, record;

        beforeAll(function() {
            var keys = [];
            testParams.keys.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/editable-id:" + testParams.table_name + "/" + keys.join("&");
            chaisePage.navigate(url);
            chaisePage.recordPageReady();
        });

        it("should load chaise-config.js and have editRecord=true", function() {
            browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                expect(chaiseConfig.editRecord).toBe(true);
            });
        });

        it ("should not have the default csv export option and only the defined template should be available", function (done) {
            const exportDropdown = chaisePage.recordsetPage.getExportDropdown()
            exportDropdown.click().then(function () {
                const options = chaisePage.recordsetPage.getExportOptions();
                expect(options.count()).toBe(1, "count missmatch");

                const csvOption = chaisePage.recordsetPage.getExportOption("Defined template");
                expect(csvOption.getText()).toBe("Defined template");
                return exportDropdown.click();
            }).then(function () {
                done();
            }).catch(function(err) {
                done.fail(err);
            })
        });

        describe("for the copy record button,", function() {
            var EC = protractor.ExpectedConditions,
                copyButton = chaisePage.recordPage.getCopyRecordButton();

            it("should display the entity title and subtitle based on their markdown patterns.", function() {
                var subTitleEl = chaisePage.recordPage.getEntitySubTitleElement();
                chaisePage.waitForElement(subTitleEl);

                // subtitle is using title comp which is using display-value inside,
                // so it will produce an extra span
                var subtitleElement = subTitleEl.element(by.css("span")),
                    titleElement = chaisePage.recordPage.getEntityTitleElement();

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
                const loader = chaisePage.recordPage.getRelatedSectionSpinner();
                expect(loader.isPresent()).toBeFalsy();
            });

            it("should redirect to recordedit when clicked.", function(done) {
                var titleElement = chaisePage.recordEditPage.getEntityTitleElement();
                chaisePage.clickButton(copyButton).then(function() {
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

            it ("should have the correct head title using the heuristics for recordedit app", function (done) {
                browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                    // Create new <table-name> | chaiseConfig.headTitle
                    // should only use the inner text and should not have the <strong> tag
                    expect(browser.getTitle()).toBe("Create new " + testParams.table_displayname + " | " + chaiseConfig.headTitle);

                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });

            it("should have 'Automatically Generated' in an input that is generated rather than copying the value from the copied record.", function() {
                chaisePage.recordEditPage.getInputById(0, "generated").getAttribute("placeholder").then(function (text) {
                    expect(text).toBe("Automatically generated");
                });
            });

            // because of a bug in column permission error,
            // chaise was showing the column permission overlay and users couldn't
            // edit the values. This test case is to make sure that logic is correct
            it ("should not show any permission errors", function () {
              var colPermissionErrors = chaisePage.recordEditPage.getAllColumnPermissionOverlays();
              expect(colPermissionErrors.isPresent()).toBeFalsy();
            })

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
