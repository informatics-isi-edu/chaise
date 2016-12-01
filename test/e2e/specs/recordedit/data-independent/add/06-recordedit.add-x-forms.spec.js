var chaisePage = require('../../../../utils/chaise.page.js');
var recordEditHelpers = require('../../helpers.js');

describe('Record Add', function() {

    var testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params.multi_insert;

    describe("for when the users adds multiple forms using the multi form input control, ", function() {
        var EC = protractor.ExpectedConditions,
            multiFormOpenButton = chaisePage.recordEditPage.getMultiFormInputOpenButton(),
            multiFormInput = chaisePage.recordEditPage.getMultiFormInput(),
            multiFormSubmitButton = chaisePage.recordEditPage.getMultiFormInputSubmitButton();

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + ":" + testParams.table_name);
            browser.sleep(3000);
        });

        it("should click the button and show an input box.", function() {
            browser.wait(EC.elementToBeClickable(multiFormOpenButton), 10000);

            multiFormOpenButton.click().then(function() {
                return multiFormInput.isDisplayed();
            }).then(function(bool) {
                expect(bool).toBeTruthy();
            });
        });

        it("should click the button a second time to hide the input.", function() {
            multiFormOpenButton.click().then(function() {
                return multiFormInput.isDisplayed();
            }).then(function(bool) {
                expect(bool).toBeFalsy();
            });
        });

        it("should alert the user when they try to add more forms than the limit of " + testParams.max_input_rows + " allows.", function() {
            var numberGreaterThanMax = 300,
                errorMessage = "Cannot add " + numberGreaterThanMax + " records. Please input a value between 1 and 200.";

            multiFormOpenButton.click().then(function() {
                chaisePage.recordEditPage.clearInput(multiFormInput);
                browser.sleep(10);
                multiFormInput.sendKeys(numberGreaterThanMax);

                return multiFormSubmitButton.click();
            }).then(function() {
                return chaisePage.recordEditPage.getAlertError();
            }).then(function(err) {
                return err.getText();
            }).then(function(text) {
                expect(text.indexOf(errorMessage)).toBeGreaterThan(-1);
            });
        });

        it("should add " + (testParams.records-1) + " forms and fill them in for data submission.", function() {
            chaisePage.recordEditPage.clearInput(multiFormInput);
            browser.sleep(10);
            multiFormInput.sendKeys(testParams.records-1);

            multiFormSubmitButton.click().then(function() {
                return chaisePage.recordEditPage.getRecordModelRows();
            }).then(function(rows) {
                expect(rows.length).toBe(testParams.records);
            });
        });
    });
});
