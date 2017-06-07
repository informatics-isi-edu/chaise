var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var testParams = {
    table_name: "defaults-table",
    column_names: ["text", "int"],
    text_value: "default",
    int_value: "25",
    boolean_true_value: "true",
    boolean_false_value: "false",
    disabled_text_value: "Disabled input",
    disabled_timestamp_value: "Automatically generated"
};

describe('Record Add with defaults', function() {

    describe("for when the user creates an entity with default values, ", function() {
        var EC = protractor.ExpectedConditions,
            textDisplayname = "<strong>text</strong>",
            textInput, textDisabledInput, intInput, booleanTrueInput, booleanFalseInput, timestampDisabledInput;

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/defaults:" + testParams.table_name);
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
            textDisabledInput = chaisePage.recordEditPage.getInputById(0, "text_disabled");

            expect(textInput.getAttribute("value")).toBe(testParams.text_value);
            expect(intInput.getAttribute("value")).toBe(testParams.int_value);
            expect(textDisabledInput.getAttribute("value")).toBe(testParams.disabled_text_value);

            expect(chaisePage.recordEditPage.getDropdownText(booleanTrueInput)).toBe(testParams.boolean_true_value);
            expect(chaisePage.recordEditPage.getDropdownText(booleanFalseInput)).toBe(testParams.boolean_false_value);
        });

        it("should initialize timestamp columns properly if they are disabled without a default.", function() {
            timestampDisabledInput = chaisePage.recordEditPage.getInputById(0, "timestamp_disabled");

            expect(timestampDisabledInput.getAttribute("placeholder")).toBe(testParams.disabled_timestamp_value);
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
                var redirectUrl = browser.params.url + "/record/#" + browser.params.catalogId + "/defaults:" + testParams.table_name + '/id=1';

                chaisePage.waitForUrl(redirectUrl).then(function() {
                    expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);

                    recordEditHelpers.testRecordAppValuesAfterSubmission(testParams.column_names);
                });
            });
        });
    });
});
