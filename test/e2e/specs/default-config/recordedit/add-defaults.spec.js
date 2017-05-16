var chaisePage = require('../../../../utils/chaise.page.js');
var recordEditHelpers = require('../../helpers.js');

describe('Record Add with defaults', function() {

    var testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    describe("for when the user creates an entity with default values, ", function() {
        var EC = protractor.ExpectedConditions,
            textDisplayname = "<strong>text</strong>",
            textInput, intInput, booleanTrueInput, booleanFalseInput;

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + ":" + testParams.table_name);
        });

        // adding this test here to avoid making a whole new spec
        it("should render columns based on their markdown pattern.", function() {
            // way to know recordedit has loaded
            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                return chaisePage.recordEditPage.getColumnCaptionsWithHtml();
            }).then(function(pageColumns) {
                expect(pageColumns[0].getText()).toBe("text");
                
                return pageColumns[0].getAttribute("innerHTML");
            }).then(function(html) {
                expect(html).toBe(textDisplayname);
            });
        });

        it("should prefill simple input fields with the default value.", function() {
            textInput = chaisePage.recordEditPage.getInputById(0, textDisplayname);
            intInput = chaisePage.recordEditPage.getInputById(0, "int");
            booleanTrueInput = chaisePage.recordEditPage.getInputById(0, "boolean_true");
            booleanFalseInput = chaisePage.recordEditPage.getInputById(0, "boolean_false");

            expect(textInput.getAttribute("value")).toBe(testParams.text_value);
            expect(intInput.getAttribute("value")).toBe(testParams.int_value);

            expect(chaisePage.recordEditPage.getDropdownText(booleanTrueInput)).toBe(testParams.boolean_true_value);
            expect(chaisePage.recordEditPage.getDropdownText(booleanFalseInput)).toBe(testParams.boolean_false_value);
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
