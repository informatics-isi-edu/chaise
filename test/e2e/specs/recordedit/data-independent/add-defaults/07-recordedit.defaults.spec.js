var chaisePage = require('../../../../utils/chaise.page.js');
var recordEditHelpers = require('../../helpers.js');

describe('Record Add with defaults', function() {

    var testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    describe("for when the user creates an entity with default values, ", function() {
        var EC = protractor.ExpectedConditions, textInput, intInput;

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + ":" + testParams.table_name);
        });

        it("should prefill simple input fields with the default value.", function() {
            // good way to know recordedit has loaded
            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                textInput = chaisePage.recordEditPage.getInputById(0, "text");
                intInput = chaisePage.recordEditPage.getInputById(0, "int");

                expect(textInput.getAttribute("value")).toBe(testParams.text_value);
                expect(intInput.getAttribute("value")).toBe(testParams.int_value);
            });
        });

        // TODO write tests for default values for foreign keys when implemented

        describe("Submit the form", function() {
            beforeAll(function() {
                chaisePage.recordEditPage.submitForm();
            });

            it("and redirect to a record page with the default values.", function() {
                // After submitting 1 record in RecordEdit, the expected record
                // page url will have a id of 1 because it'll always be the first
                // row of this table in the new catalog created by the defaults tests.
                var redirectUrl = browser.params.url.replace('/recordedit/', '/record/');
                redirectUrl += ":" + testParams.table_name + '/id=1';

                chaisePage.waitForUrl(redirectUrl).then(function() {
                    expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);

                    recordEditHelpers.testRecordAppValuesAfterSubmission(testParams);
                });
            });
        });
    });
});
