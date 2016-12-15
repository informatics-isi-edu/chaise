var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../helpers.js');

describe('View existing record,', function() {

    var params, testConfiguration = browser.params.configuration.tests, tupleParams = testConfiguration.params.tuples[0];

    describe("For table " + tupleParams.table_name + ",", function() {

        var table, record;

        beforeAll(function () {
            var keys = [];
            tupleParams.keys.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&"));
            browser.sleep(browser.params.defaultTimeout);
        });

        it("should load chaise-config.js and have editRecord=true", function() {
            browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                expect(chaiseConfig.editRecord).toBe(true);
            });
        });

        describe("for the copy record button,", function() {
            var EC = protractor.ExpectedConditions,
                copyButton = chaisePage.recordPage.getCopyRecordButton();

            it("should show when the page loads.", function() {
                browser.wait(EC.elementToBeClickable(copyButton), browser.params.defaultTimeout);
                copyButton.isDisplayed().then(function (bool) {
                    expect(bool).toBeTruthy();
                });
            });

            it("should redirect to recordedit when clicked.", function() {
                copyButton.click().then(function() {
                    browser.sleep(100);
                    return browser.driver.getCurrentUrl();
                }).then(function(url) {
                    expect(url.indexOf("recordedit")).toBeGreaterThan(-1);

                    return chaisePage.recordEditPage.getEntityTitle();
                }).then(function(txt) {
                    expect(txt.indexOf("Create")).toBeGreaterThan(-1);
                });
            });

            it("should alert the user if trying to submit data without changing the id.", function() {
                chaisePage.recordEditPage.submitForm();

                browser.sleep(100);
                chaisePage.recordEditPage.getAlertError().then(function(err) {
                    return err.getText();
                }).then(function(text){
                    expect(text.indexOf("409 Conflict")).toBeGreaterThan(-1);
                });
            });

            it("should redirect to record after changing the id and resubmitting.", function() {
                var idInput = chaisePage.recordEditPage.getInputById(0, "id");

                chaisePage.recordEditPage.clearInput(idInput);
                browser.sleep(10);
                idInput.sendKeys("777");

                chaisePage.recordEditPage.submitForm();

                browser.driver.getCurrentUrl().then(function(url) {
                    expect(url.indexOf("record")).toBeGreaterThan(-1);
                });
            });
        });

    });

});
