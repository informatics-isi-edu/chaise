var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var testParams = {
    // for verifying data is present
    column_names: ["text", "text_disabled", "markdown", "markdown_disabled", "defaults_fk_text", "defaults_fk_text_disabled", "int", "int_disabled", "float", "float_disabled", "boolean_true", "boolean_false", "boolean_disabled", "date", "date_disabled", "timestamptz", "timestamptz_disabled", "json", "json_disabled", "json_disabled_no_default"],
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
        timestamptz_disabled_no_default_value: "Automatically generated",
        json_value:JSON.stringify({"name":"testing_json"}),
        json_disabled_value:JSON.stringify(98.786),
        json_disabled_no_default_value: "Automatically generated"
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
        timestamptz_disabled: "2010-06-13 17:22:00",
        json: JSON.stringify({"name":"testing_json"},undefined,2),
        json_disabled: JSON.stringify(98.786),
        json_disabled_no_default: JSON.stringify(null)
    },
    edit_key: { name: "id", value: "2", operator: "="},
    re_column_names: ["text_disabled", "markdown_disabled", "foreign_key_disabled", "int_disabled", "float_disabled", "boolean_disabled", "date_disabled", "timestamp_disabled", "timestamptz_disabled", "json_disabled", "asset_disabled"],
    re_column_values: {
        text_disabled: "Disabled input",
        markdown_disabled: "*italics*",
        // Value of "name" column on foreign related entity
        foreign_key_disabled: "Default for foreign_key_disabled column",
        int_disabled: "20",
        float_disabled: "93.2182",
        boolean_disabled: "false",
        date_disabled: "2014-05-12",
        timestamp_disabled: "2012-06-22T18:36:00",
        timestamptz_disabled: "2010-06-13T17:22:00-07:00",
        json_disabled: JSON.stringify(98.786),
        asset_disabled: "http://images.trvl-media.com/hotels/1000000/30000/28200/28110/28110_191_z.jpg"
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
            timestamptzInputs, timestamptzDisabledInput, timestamptzDisabledNoDefaultInput,
            jsonInput, jsonDisabledInput, jsonDisabledNoDefaultInput

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
            jsonInput = chaisePage.recordEditPage.getInputById(0, "json");

            expect(textInput.getAttribute("value")).toBe(values.text_value, "Text input default is incorrect");
            expect(markdownInput.getAttribute("value")).toBe(values.markdown_value, "Markdown input default is incorrect");
            expect(intInput.getAttribute("value")).toBe(values.int_value, "Int input default is incorrect");
            expect(floatInput.getAttribute("value")).toBe(values.float_value, "Float input default is incorrect");
            expect(chaisePage.recordEditPage.getDropdownText(booleanTrueInput)).toBe(values.boolean_true_value, "Boolean input is not set to true");
            expect(chaisePage.recordEditPage.getDropdownText(booleanFalseInput)).toBe(values.boolean_false_value, "Boolean input is not set to false");
            expect(dateInput.getAttribute("value")).toBe(values.date_value, "Date input default is incorrect");
            expect(jsonInput.getAttribute("value")).toBe(values.json_value, "JSON input default is incorrect");
        });

        it("should prefill simple input fields that are disabled with their default value.", function() {
            textDisabledInput = chaisePage.recordEditPage.getInputById(0, "text_disabled");
            markdownDisabledInput = chaisePage.recordEditPage.getInputById(0, "markdown_disabled");
            intDisabledInput = chaisePage.recordEditPage.getInputById(0, "int_disabled");
            floatDisabledInput = chaisePage.recordEditPage.getInputById(0, "float_disabled");
            booleanDisabledInput = chaisePage.recordEditPage.getInputById(0, "boolean_disabled");
            dateDisabledInput = chaisePage.recordEditPage.getInputById(0, "date_disabled");
            jsonInputDisabled= chaisePage.recordEditPage.getInputById(0, "json_disabled");

            expect(textDisabledInput.getAttribute("value")).toBe(values.text_disabled_value, "Text disabled input default is incorrect");
            expect(markdownDisabledInput.getAttribute("value")).toBe(values.markdown_disabled_value, "Markdown disabled input default is incorrect");
            expect(intDisabledInput.getAttribute("value")).toBe(values.int_disabled_value, "Int disabled input default is incorrect");
            expect(floatDisabledInput.getAttribute("value")).toBe(values.float_disabled_value, "Float disabled input default is incorrect");
            expect(chaisePage.recordEditPage.getDropdownText(booleanDisabledInput)).toBe(values.boolean_disabled_value, "Boolean disabled input default is incorrect");
            expect(dateDisabledInput.getAttribute("value")).toBe(values.date_disabled_value, "Date disabled input default is incorrect");
            expect(jsonInputDisabled.getAttribute("value")).toBe(values.json_disabled_value, "JSON disabled input default is incorrect");

        });
        
        //JOSN columns
        it("should initialize json columns properly if they are disabled without a default.", function() {
            jsonDisabledNoDefaultInput = chaisePage.recordEditPage.getInputById(0, "json_disabled_no_default");

            expect(jsonDisabledNoDefaultInput.getAttribute("value")).toBe("", "The disabled json value is incorrect");
            expect(jsonDisabledNoDefaultInput.getAttribute("placeholder")).toBe(values.json_disabled_no_default_value, "The disabled json placeholder is incorrect");
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

describe("Record Edit with immutable columns", function() {

    describe("should verify the presentation of data", function () {

        beforeAll(function () {
            var keys = [];
            keys.push(testParams.edit_key.name + testParams.edit_key.operator + testParams.edit_key.value);
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/defaults:" + testParams.table_name + "/"  + keys.join("&"));

            chaisePage.waitForElement(element(by.id("submit-record-button")));
        });

        for (var i=0; i < testParams.re_column_names.length; i++) {
            (function(columnName) {
                switch (columnName) {
                    case "foreign_key_disabled":
                        // foreign key input has value under input with id ending in "display"
                        it("should initialize foreign key select input column: " + columnName + " with the proper value", function () {
                            var input = chaisePage.recordEditPage.getForeignKeyInputDisplay(columnName, 0);
                            expect(input.getText()).toBe(testParams.re_column_values[columnName], "Recordedit value for: " + columnName + " is incorrect");
                        });
                        break;
                    case "asset_disabled":
                        // upload input has a different css structure than other inputs because of directive
                        it("should initialize file upload select input column: " + columnName + " with the proper value", function () {
                            var input = chaisePage.recordEditPage.getUploadInput(columnName, 0);
                            expect(input.getAttribute('value')).toBe(testParams.re_column_values[columnName], "Recordedit value for: " + columnName + " is incorrect");
                        });
                        break;
                    case "boolean_disabled":
                        // boolean input has a dropdown list with text in it
                        it("should initialize select input column: " + columnName + " with the proper value", function () {
                            var input = chaisePage.recordEditPage.getInputById(0, columnName);
                            expect(chaisePage.recordEditPage.getDropdownText(input)).toBe(testParams.re_column_values[columnName], "Recordedit value for: " + columnName + " is incorrect");
                        });
                        break;
                    default:
                        // normal inputs with values in input under value attribute
                        it("should initialize text input column: " + columnName + " with the proper value", function () {
                            var input = chaisePage.recordEditPage.getInputById(0, columnName);
                            expect(input.getAttribute('value')).toBe(testParams.re_column_values[columnName], "Recordedit value for: " + columnName + " is incorrect");
                        });
                        break;
                }
            })(testParams.re_column_names[i]);
        };
    });
});
