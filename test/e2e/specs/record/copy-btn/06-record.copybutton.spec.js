var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../helpers.js');

describe('View existing record,', function() {

    var params, testConfiguration = browser.params.configuration.tests, tupleParams = testConfiguration.params.tuples[0];

    describe("For table " + tupleParams.table_name + ",", function() {

        var table, record;

        beforeAll(function(done) {
            var keys = [];
            tupleParams.keys.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            browser.ignoreSynchronization=true;
            var url = browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&");
            browser.get(url);
            chaisePage.waitForUrl(url).then(function() {
                done();
            });
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
                    return chaisePage.waitForUrl('recordedit');
                }).then(function() {
                    return browser.driver.getCurrentUrl();
                }).then(function(url) {
                    expect(url.indexOf('recordedit')).toBeGreaterThan(-1);
                }).then(function() {
                    return chaisePage.recordEditPage.getEntityTitle();
                }).then(function(txt) {
                    expect(txt.indexOf('Create')).toBeGreaterThan(-1);
                }).catch(function(error) {
                    console.log(error);
                    expect('There was an error.').toBe('Please check the error message.');
                });
            });

            it("should alert the user if trying to submit data without changing the id.", function() {
                chaisePage.recordEditPage.submitForm();
                browser.wait(function() {
                    return chaisePage.recordEditPage.getAlertError();
                }, browser.params.defaultTimeout).then(function(error) {
                    return error.getText();
                }).then(function(text) {
                    expect(text.indexOf("409 Conflict")).toBeGreaterThan(-1);
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
