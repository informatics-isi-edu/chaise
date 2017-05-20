var chaisePage = require('../../../utils/chaise.page.js');

describe('View existing record,', function() {

    var testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    for (var i=0; i< testParams.tuples.length; i++) {

        (function(tupleParams, index) {

            describe("For table " + tupleParams.table_name + ",", function() {

                var table, record;

                beforeAll(function() {
                    var keys = [];
                    tupleParams.deleteKeys.forEach(function(key) {
                        keys.push(key.name + key.operator + key.value);
                    });
                    browser.ignoreSynchronization=true;
                    var url = browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&");
                    browser.get(url);
                    table = browser.params.defaultSchema.content.tables[tupleParams.table_name];
                    chaisePage.waitForElement(element(by.id('tblRecord')));
                });

                it("should load chaise-config.js and have confirmDelete=true", function() {
                    browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                        expect(chaiseConfig.confirmDelete).toBe(true);
                    });
                });

                describe("Clicking the delete record button ,", function() {
                    var allWindows, EC = protractor.ExpectedConditions;

                    it("should display a modal when attempting to delete a record that has been modified by someone else beforehand", function() {
                        // Set up a mismatching ETag scenario before attempting delete to ensure that
                        // that the delete operation doesn't throw a 412 error when ETags are mismatching
                        // but the referenced tuples haven't changed from the tuples in the DB.
                        var modalTitle = chaisePage.recordPage.getConfirmDeleteTitle(),
                            config, changedValue;

                        // Edit the current record in a new tab in order to change the ETag
                        // - Grab current url, change record to recordedit, open this new url in a new tab
                        browser.driver.getCurrentUrl().then(function(url) {
                            url = url.replace('/record/', '/recordedit/');
                            return browser.executeScript('window.open(arguments[0]);', url);
                        }).then(function() {
                            return browser.getAllWindowHandles();
                        }).then(function(handles) {
                            allWindows = handles;
                            return browser.switchTo().window(allWindows[1]);
                        }).then(function() {
                            // In order to simulate someone else modifying a record (in order to
                            // trigger a 412), we should set RecEdit's window.opener to null so
                            // that RecordSet won't think that this RecEdit page was opened by the same user
                            // from the original page.
                            return browser.executeScript('window.opener = null');
                        }).then(function() {
                            return chaisePage.waitForElement(element(by.id("submit-record-button")));
                        }).then(function() {
                        // - Change a small thing. Submit.
                            var input = chaisePage.recordEditPage.getInputById(0, 'Summary');
                            input.clear();
                            input.sendKeys('as;dkfa;sljk als;dkj f;alsdjf a;');
                            return chaisePage.recordEditPage.getSubmitRecordButton().click();
                        }).then(function(handles) {
                        // - Go back to initial Record page
                            browser.close();
                            browser.switchTo().window(allWindows[0]);
                        }).then(function() {
                            return chaisePage.recordPage.getDeleteRecordButton().click()
                        }).then(function () {
                            browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                            // expect modal to open
                            return modalTitle.getText();
                        }).then(function (text) {
                            expect(text).toBe("Confirm Delete");
                            return chaisePage.recordPage.getConfirmDeleteButton().click();
                        }).then(function () {
                            // Expect another modal to appear to tell user that this record cannot be deleted without page refresh.
                            var refreshBtn = element(by.id('refresh-btn'));
                            chaisePage.waitForElement(refreshBtn);
                            return refreshBtn.click();
                        }).then(function() {
                            return chaisePage.waitForElement(element(by.id('tblRecord')));
                        }).then(function() {
                            changedValue = chaisePage.recordPage.getColumnValue('summary');
                            expect(changedValue.getText()).toBe('as;dkfa;sljk als;dkj f;alsdjf a;');
                        }).catch(function(error) {
                            console.dir(error);
                            expect('Something went wrong with this promise chain.').toBe('Please see error message.');
                        });
                    });

                    it("should redirect to data browser if ETags match (like normal).", function () {
                        var modalTitle = chaisePage.recordPage.getConfirmDeleteTitle(),
                            config;

                        chaisePage.waitForElement(element(by.id('tblRecord'))).then(function() {
                            return browser.executeScript('return chaiseConfig;');
                        }).then(function(chaiseConfig) {
                            config = chaiseConfig
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
                        }).catch(function(error) {
                            console.log(error);
                            expect('Something went wrong with this promise chain.').toBe('Please see error message.');
                        });
                    });
                });
            });
        })(testParams.tuples[i], i);
    }
});
