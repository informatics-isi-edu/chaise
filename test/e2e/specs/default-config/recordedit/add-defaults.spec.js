var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var testParams = {
    // for verifying data is present
    column_names: ["text", "text_disabled", "markdown", "markdown_disabled", "defaults_fk_text", "defaults_fk_text_disabled", "int", "int_disabled", "float", "float_disabled", "boolean_true", "boolean_false", "boolean_disabled", "date", "date_disabled", "timestamptz", "timestamptz_disabled"],
    table_name: "defaults-table",
    default_column_values: {
    // data values
        text_value: "default",
        text_disabled_value: "Disabled input",
        markdown_value: "**bold**",
        markdown_disabled_value: "*italics*",
        foreign_key_value: "2",
        foreign_key_disabled_value: "5",
        int_value: "25",
        int_disabled_value: "20",
        float_value: "1.6478",
        float_disabled_value: "93.2182",
        boolean_true_value: "true",
        boolean_false_value: "false",
        boolean_disabled_value: "false",
        date_value: "2010-06-08",
        date_disabled_value: "2014-05-12",
        timestamp_date_value: "2016-05-14",
        timestamp_time_value: "05:30:00",
        timestamp_meridiem_value: "PM",
        timestamp_disabled_value: "2012-06-22 18:36:00",
        timestamp_disabled_no_default_value: "Automatically generated",
        timestamptz_date_value: "2014-05-07",
        timestamptz_time_value: "02:40:00",
        timestamptz_meridiem_value: "PM",
        timestamptz_disabled_value: "2010-06-13 17:22:00-07:00",
        timestamptz_disabled_no_default_value: "Automatically generated"
    },
    record_column_values: {
    // data values
        text: "default",
        text_disabled: "Disabled input",
        markdown: "bold",
        markdown_disabled: "italics",
        // Value of "name" column on foreign related entity
        defaults_fk_text: "Default for foreign_key column",
        // Value of "name" column on foreign related entity
        defaults_fk_text_disabled: "Default for foreign_key_disabled column",
        int: "25",
        int_disabled: "20",
        float: "1.6478",
        float_disabled: "93.2182",
        boolean_true: "true",
        boolean_false: "false",
        boolean_disabled: "false",
        date: "2010-06-08",
        date_disabled: "2014-05-12",
        timestamp: "2016-05-14 17:30:00",
        timestamp_disabled: "2012-06-22 18:36:00",
        timestamptz: "2014-05-07 14:40:00",
        timestamptz_disabled: "2010-06-13 17:22:00"
    }
};

describe('Record Add with defaults', function() {

    describe("for when the user creates an entity with default values, ", function() {
        var EC = protractor.ExpectedConditions,
            values = testParams.default_column_values,
            textInput, textDisabledInput,
            markdownInput, markdownDisabledInput,
            foreignKeyInput, foreignKeyDisabledInput,
            intInput, intDisabledInput,
            floatInput, floatDisabledInput,
            booleanTrueInput, booleanFalseInput, booleanDisabledInput,
            dateInput, dateDisabledInput,
            timestampInputs, timestampDisabledInput, timestampDisabledNoDefaultInput,
            timestamptzInputs, timestamptzDisabledInput, timestamptzDisabledNoDefaultInput;

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/defaults:" + testParams.table_name);
            chaisePage.waitForElement(element(by.id("submit-record-button")));
        });

        it("should prefill simple input fields that are not disabled with their default value.", function() {
            textInput = chaisePage.recordEditPage.getInputById(0, "text");
            markdownInput = chaisePage.recordEditPage.getInputById(0, "markdown");
            intInput = chaisePage.recordEditPage.getInputById(0, "int");
            floatInput = chaisePage.recordEditPage.getInputById(0, "float");
            booleanTrueInput = chaisePage.recordEditPage.getInputById(0, "boolean_true");
            booleanFalseInput = chaisePage.recordEditPage.getInputById(0, "boolean_false");
            dateInput = chaisePage.recordEditPage.getInputById(0, "date");

            expect(textInput.getAttribute("value")).toBe(values.text_value, "Text input default is incorrect");
            expect(markdownInput.getAttribute("value")).toBe(values.markdown_value, "Markdown input default is incorrect");
            expect(intInput.getAttribute("value")).toBe(values.int_value, "Int input default is incorrect");
            expect(floatInput.getAttribute("value")).toBe(values.float_value, "Float input default is incorrect");
            expect(chaisePage.recordEditPage.getDropdownText(booleanTrueInput)).toBe(values.boolean_true_value, "Boolean input is not set to true");
            expect(chaisePage.recordEditPage.getDropdownText(booleanFalseInput)).toBe(values.boolean_false_value, "Boolean input is not set to false");
            expect(dateInput.getAttribute("value")).toBe(values.date_value, "Date input default is incorrect");
        });

        it("should prefill simple input fields that are disabled with their default value.", function() {
            textDisabledInput = chaisePage.recordEditPage.getInputById(0, "text_disabled");
            markdownDisabledInput = chaisePage.recordEditPage.getInputById(0, "markdown_disabled");
            intDisabledInput = chaisePage.recordEditPage.getInputById(0, "int_disabled");
            floatDisabledInput = chaisePage.recordEditPage.getInputById(0, "float_disabled");
            booleanDisabledInput = chaisePage.recordEditPage.getInputById(0, "boolean_disabled");
            dateDisabledInput = chaisePage.recordEditPage.getInputById(0, "date_disabled");

            expect(textDisabledInput.getAttribute("value")).toBe(values.text_disabled_value, "Text disabled input default is incorrect");
            expect(markdownDisabledInput.getAttribute("value")).toBe(values.markdown_disabled_value, "Markdown disabled input default is incorrect");
            expect(intDisabledInput.getAttribute("value")).toBe(values.int_disabled_value, "Int disabled input default is incorrect");
            expect(floatDisabledInput.getAttribute("value")).toBe(values.float_disabled_value, "Float disabled input default is incorrect");
            expect(chaisePage.recordEditPage.getDropdownText(booleanDisabledInput)).toBe(values.boolean_disabled_value, "Boolean disabled input default is incorrect");
            expect(dateDisabledInput.getAttribute("value")).toBe(values.date_disabled_value, "Date disabled input default is incorrect");
        });

        // Timestamp columns
        it("should intialize timestamp columns properly with a default value.", function() {
            timestampInputs = chaisePage.recordEditPage.getTimestampInputsForAColumn("timestamp", 0);
            timestampDisabledInput = chaisePage.recordEditPage.getInputById(0, "timestamp_disabled");

            expect(timestampInputs.date.getAttribute('value')).toBe(values.timestamp_date_value, "Timestamp date default is incorrect");
            expect(timestampInputs.time.getAttribute('value')).toBe(values.timestamp_time_value, "Timestamp time default is incorrect");
            expect(timestampInputs.meridiem.getText()).toBe(values.timestamp_meridiem_value, "Timestamp meridiem default is incorrect");
            expect(timestampDisabledInput.getAttribute('value')).toBe(values.timestamp_disabled_value, "Timestamp disabled value is incorrect");
        });

        it("should initialize timestamp columns properly if they are disabled without a default.", function() {
            timestampDisabledNoDefaultInput = chaisePage.recordEditPage.getInputById(0, "timestamp_disabled_no_default");

            expect(timestampDisabledNoDefaultInput.getAttribute("value")).toBe("", "The disabled timestamp value is incorrect");
            expect(timestampDisabledNoDefaultInput.getAttribute("placeholder")).toBe(values.timestamp_disabled_no_default_value, "The disabled timestamp placeholder is incorrect");
        });

        // Timestamptz columns
        it("should intialize timestamptz columns properly with a default value.", function() {
            timestamptzInputs = chaisePage.recordEditPage.getTimestampInputsForAColumn("timestamptz", 0);
            timestamptzDisabledInput = chaisePage.recordEditPage.getInputById(0, "timestamptz_disabled");

            expect(timestamptzInputs.date.getAttribute('value')).toBe(values.timestamptz_date_value, "Timestamptz date default is incorrect");
            expect(timestamptzInputs.time.getAttribute('value')).toBe(values.timestamptz_time_value, "Timestamptz time default is incorrect");
            expect(timestamptzInputs.meridiem.getText()).toBe(values.timestamptz_meridiem_value, "Timestamptz meridiem default is incorrect");
            expect(timestamptzDisabledInput.getAttribute('value')).toBe(values.timestamptz_disabled_value, "Timestamptz disabled value is incorrect");
        });

        it("should initialize timestamptz columns properly if they are disabled without a default.", function() {
            timestamptzDisabledNoDefaultInput = chaisePage.recordEditPage.getInputById(0, "timestamptz_disabled_no_default");

            expect(timestamptzDisabledNoDefaultInput.getAttribute("value")).toBe("", "The disabled timestamptz value is incorrect");
            expect(timestamptzDisabledNoDefaultInput.getAttribute("placeholder")).toBe(values.timestamptz_disabled_no_default_value, "The disabled timestamptz placeholder is incorrect");
        });

        // Foreign key columns
        it("should initialize foreign key inputs with their default value.", function() {
            foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputDisplay("foreign_key", 0);
            foreignKeyDisabledInput = chaisePage.recordEditPage.getForeignKeyInputDisplay("foreign_key_disabled", 0);

            expect(foreignKeyInput.getText()).toBe(values.foreign_key_value, "Foreign key input default is incorrect");
            expect(foreignKeyDisabledInput.getText()).toBe(values.foreign_key_disabled_value, "Foreign key disabled default is incorrect");
        });

        // TODO write tests for default values for composite foreign keys when implemented

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

                    recordEditHelpers.testRecordAppValuesAfterSubmission(testParams.column_names, testParams.record_column_values);
                });
            });
        });
    });
});
