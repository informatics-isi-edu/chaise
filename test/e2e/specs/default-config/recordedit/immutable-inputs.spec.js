var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var momentTz = require('moment-timezone');
var testParams = {
    // for verifying data is present
    column_names: [
        "text", "text_disabled", "markdown", "markdown_disabled", "iKS50idGfVCGnnS6lUoZ8Q", "WnsyE4pJ1O0IW8zsj6MDHg", "int", "int_disabled",
        "float", "float_disabled", "boolean_true", "boolean_false", "boolean_disabled", "date", "date_disabled", "timestamp", "timestamp_disabled",
        "timestamptz", "timestamptz_disabled", "json", "json_disabled", "json_disabled_no_default", "color_rgb_hex", "color_rgb_hex_disabled"
    ],
    table_name: "defaults-table",
    default_column_values: {
    // data values
        text_value: "default",
        text_disabled_value: "Disabled input",
        markdown_value: "**bold**",
        markdown_disabled_value: "*italics*",
        foreign_key_value: "Default for foreign_key column", // rowname of the fk
        foreign_key_dropdown_value: "Default for foreign_key_dropdown column", // rowname of the fk
        foreign_key_disabled_value: "Default for foreign_key_disabled column", // rowname of the disabled fk
        int_value: "25",
        int_disabled_value: "20",
        float_value: "1.6478",
        float_disabled_value: "93.2182",
        boolean_true_value: "true",
        boolean_false_value: "false",
        boolean_disabled_value: "false",
        date_value: "2010-06-08",
        date_disabled_value: "2014-05-12",
        timestamp_value: "2016-05-14T17:30:00",
        timestamp_date_value: "2016-05-14",
        timestamp_time_value: "17:30:00",
        timestamp_disabled_value: "2012-06-22T18:36:00",
        timestamp_disabled_date_value: "2012-06-22",
        timestamp_disabled_time_value: "18:36:00",
        timestamp_disabled_no_default_value: "",
        timestamp_disabled_no_default_date_value: "",
        timestamp_disabled_no_default_time_value: "",
        timestamptz_value: "2014-05-07T14:40:00-07:00",
        timestamptz_date_value: "2014-05-07",
        timestamptz_time_value: "14:40:00",
        timestamptz_disabled_value: "2010-06-13T17:22:00-07:00",
        timestamptz_disabled_date_value: "2010-06-13",
        timestamptz_disabled_time_value: "17:22:00",
        timestamptz_disabled_no_default_value: "",
        timestamptz_disabled_no_default_date_value: "",
        timestamptz_disabled_no_default_time_value: "",
        json_value:JSON.stringify({"name":"testing_json"}),
        json_disabled_value:JSON.stringify(98.786),
        json_disabled_no_default_value: "Automatically generated",
        asset_value: "28110_191_z.jpg",
        asset_disabled_value: "28110_191_z.jpg",
        asset_disabled_no_default_value: "Automatically generated",
        color_rgb_hex_value: "#123456",
        color_rgb_hex_disabled_value: "#654321",
        rid_disabled_value: "Automatically generated",
        rcb_disabled_value: "Automatically generated",
        rmb_disabled_value: "Automatically generated",
        rct_disabled_date_value: "Automatically generated",
        rct_disabled_time_value: "Automatically generated",
        rmt_disabled_date_value: "Automatically generated",
        rmt_disabled_time_value: "Automatically generated",
    },
    record_column_values: {
    // data values
        text: "default",
        text_disabled: "Disabled input",
        markdown: "bold",
        markdown_disabled: "italics",
        // Value of "name" column on foreign (defaults_fk_text) related entity
        "iKS50idGfVCGnnS6lUoZ8Q": "Default for foreign_key column",
        // Value of "name" column on foreign (defaults_fk_text_dropdown) related entity
        "2PO3pruPa9O5g7nNztzMjQ": "Default for foreign_key_dropdown column",
        // Value of "name" column on foreign (defaults_fk_text_disabled) related entity
        "WnsyE4pJ1O0IW8zsj6MDHg": "Default for foreign_key_disabled column",
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
        json_disabled_no_default: JSON.stringify(null),
        color_rgb_hex: "#123456",
        color_rgb_hex_disabled: "#654321"
    },
    edit_key: { name: "id", value: "2", operator: "="},
    re_column_names: [
        { name: "text_disabled" },
        { name: "markdown_disabled", type: "textarea" },
        { name: "foreign_key_disabled", type: "foreign_key" },
        { name: "int_disabled" },
        { name: "float_disabled" },
        { name: "boolean_disabled", type: "dropdown" },
        { name: "date_disabled" },
        { name: "timestamp_disabled", type: "timestamp" },
        { name: "timestamptz_disabled", type: "timestamp" },
        { name: "json_disabled", type: "textarea" },
        { name: "asset_disabled", type: "asset" },
        { name: "color_rgb_hex_disabled", type: "color" }
    ],
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
        timestamp_disabled_date: "2012-06-22",
        timestamp_disabled_time: "18:36:00",
        timestamptz_disabled: "2010-06-13T17:22:00-07:00",
        timestamptz_disabled_date: "2010-06-13",
        timestamptz_disabled_time: "17:22:00",
        json_disabled: JSON.stringify(98.786),
        // Value of "filename" column for the current record
        // asset_disabled: "Four Points Sherathon 3"
        asset_disabled: "28110_191_z.jpg",
        color_rgb_hex_disabled: "#654321"
    }
};

describe('Record Add with defaults', function() {

    describe("for when the user creates an entity with default values, ", function() {
        var EC = protractor.ExpectedConditions,
            values = testParams.default_column_values,
            textInput, textDisabledInput,
            markdownInput, markdownDisabledInput,
            foreignKeyInput, foreignKeyDropdownInput, foreignKeyDisabledInput,
            intInput, intDisabledInput,
            floatInput, floatDisabledInput,
            booleanTrueInput, booleanFalseInput, booleanDisabledInput,
            dateInput, dateDisabledInput,
            timestampInputs, timestampDisabledInput, timestampDisabledNoDefaultInput,
            timestamptzInputs, timestamptzDisabledInput, timestamptzDisabledNoDefaultInput,
            jsonInput, jsonDisabledInput, jsonDisabledNoDefaultInput,
            colorRGBHexInput, colorRGBHexDisabledInput;

        beforeAll(function () {
            chaisePage.navigate(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/defaults:" + testParams.table_name);
            chaisePage.waitForElement(element(by.id("submit-record-button")));
        });

        it("should prefill simple input fields that are not disabled with their default value.", function() {
            textInput = chaisePage.recordEditPage.getInputForAColumn('text', 1);
            markdownInput = chaisePage.recordEditPage.getTextAreaForAColumn('markdown', 1);
            intInput = chaisePage.recordEditPage.getInputForAColumn('int', 1);
            floatInput = chaisePage.recordEditPage.getInputForAColumn('float', 1);
            booleanTrueInput = chaisePage.recordEditPage.getDropdownElementByName('boolean_true', 1);
            booleanFalseInput = chaisePage.recordEditPage.getDropdownElementByName('boolean_false', 1);
            dateInput = chaisePage.recordEditPage.getInputForAColumn('date', 1);
            jsonInput = chaisePage.recordEditPage.getTextAreaForAColumn('json', 1);
            colorRGBHexInput = chaisePage.recordEditPage.getColorInputForAColumn('color_rgb_hex', 1);

            expect(textInput.getAttribute("value")).toBe(values.text_value, "Text input default is incorrect");
            expect(markdownInput.getAttribute("value")).toBe(values.markdown_value, "Markdown input default is incorrect");
            expect(intInput.getAttribute("value")).toBe(values.int_value, "Int input default is incorrect");
            expect(floatInput.getAttribute("value")).toBe(values.float_value, "Float input default is incorrect");
            expect(chaisePage.recordEditPage.getDropdownText(booleanTrueInput).getText()).toBe(values.boolean_true_value, "Boolean input is not set to true");
            expect(chaisePage.recordEditPage.getDropdownText(booleanFalseInput).getText()).toBe(values.boolean_false_value, "Boolean input is not set to false");
            expect(dateInput.getAttribute("value")).toBe(values.date_value, "Date input default is incorrect");
            expect(jsonInput.getAttribute("value")).toBe(values.json_value, "JSON input default is incorrect");
            expect(colorRGBHexInput.getAttribute("value")).toBe(values.color_rgb_hex_value, "Text input default is incorrect");
        });

        it("should prefill simple input fields that are disabled with their default value.", function() {
            textDisabledInput = chaisePage.recordEditPage.getInputForAColumn('text_disabled', 1);
            markdownDisabledInput = chaisePage.recordEditPage.getTextAreaForAColumn('markdown_disabled', 1);
            intDisabledInput = chaisePage.recordEditPage.getInputForAColumn('int_disabled', 1);
            floatDisabledInput = chaisePage.recordEditPage.getInputForAColumn('float_disabled', 1);
            booleanDisabledInput = chaisePage.recordEditPage.getDropdownElementByName('boolean_disabled', 1);
            dateDisabledInput = chaisePage.recordEditPage.getInputForAColumn('date_disabled', 1);
            jsonInputDisabled= chaisePage.recordEditPage.getTextAreaForAColumn('json_disabled', 1);
            colorRGBHexDisabledInput = chaisePage.recordEditPage.getColorInputForAColumn('color_rgb_hex_disabled', 1);

            expect(textDisabledInput.getAttribute("value")).toBe(values.text_disabled_value, "Text disabled input default is incorrect");
            expect(markdownDisabledInput.getAttribute("value")).toBe(values.markdown_disabled_value, "Markdown disabled input default is incorrect");
            expect(intDisabledInput.getAttribute("value")).toBe(values.int_disabled_value, "Int disabled input default is incorrect");
            expect(floatDisabledInput.getAttribute("value")).toBe(values.float_disabled_value, "Float disabled input default is incorrect");
            expect(chaisePage.recordEditPage.getDropdownText(booleanDisabledInput).getText()).toBe(values.boolean_disabled_value, "Boolean disabled input default is incorrect");
            expect(dateDisabledInput.getAttribute("value")).toBe(values.date_disabled_value, "Date disabled input default is incorrect");
            expect(jsonInputDisabled.getAttribute("value")).toBe(values.json_disabled_value, "JSON disabled input default is incorrect");
            expect(colorRGBHexDisabledInput.getAttribute("value")).toBe(values.color_rgb_hex_disabled_value, "Text input default is incorrect");

        });

        //JOSN columns
        it("should initialize json columns properly if they are disabled without a default.", function() {
            jsonDisabledNoDefaultInput = chaisePage.recordEditPage.getTextAreaForAColumn('json_disabled_no_default', 1);

            expect(jsonDisabledNoDefaultInput.getAttribute("value")).toBe("", "The disabled json value is incorrect");
            expect(jsonDisabledNoDefaultInput.getAttribute("placeholder")).toBe(values.json_disabled_no_default_value, "The disabled json placeholder is incorrect");
        });

        // Timestamp columns
        it("should intialize timestamp columns properly with a default value.", function() {
            timestampInput = chaisePage.recordEditPage.getInputForAColumn('timestamp', 1);
            timestampInputs = chaisePage.recordEditPage.getTimestampInputsForAColumn('timestamp', 1);

            expect(timestampInput.getAttribute('value')).toBe(values.timestamp_value, "Timestamp default is incorrect");
            expect(timestampInputs.date.getAttribute('value')).toBe(values.timestamp_date_value, "Timestamp date default is incorrect");
            expect(timestampInputs.time.getAttribute('value')).toBe(values.timestamp_time_value, "Timestamp time default is incorrect");

            timestampDisabledInput = chaisePage.recordEditPage.getInputForAColumn('timestamp_disabled', 1);
            timestampDisabledInputObj = chaisePage.recordEditPage.getTimestampInputsForAColumn('timestamp_disabled', 1);

            expect(timestampDisabledInput.getAttribute('value')).toBe(values.timestamp_disabled_value, "Timestamp disabled value is incorrect");
            expect(timestampDisabledInputObj.date.getAttribute('value')).toBe(values.timestamp_disabled_date_value, "Timestamp disabled date value is incorrect");
            expect(timestampDisabledInputObj.time.getAttribute('value')).toBe(values.timestamp_disabled_time_value, "Timestamp disabled time value is incorrect");
        });

        it("should initialize timestamp columns properly if they are disabled without a default.", function() {
            timestampDisabledNoDefaultInput = chaisePage.recordEditPage.getInputForAColumn('timestamp_disabled_no_default', 1);
            timestampDisabledNoDefaultInputObj = chaisePage.recordEditPage.getTimestampInputsForAColumn('timestamp_disabled_no_default', 1);

            // should both be empty string ("")
            expect(timestampDisabledNoDefaultInput.getAttribute("value")).toBe(values.timestamp_disabled_no_default_value, "The disabled timestamp value is incorrect");
            expect(timestampDisabledNoDefaultInputObj.date.getAttribute("value")).toBe(values.timestamp_disabled_no_default_date_value, "The disabled timestamp date value is incorrect");
            expect(timestampDisabledNoDefaultInputObj.time.getAttribute("value")).toBe(values.timestamp_disabled_no_default_time_value, "The disabled timestamp time value is incorrect");
        });

        // Timestamptz columns
        it("should intialize timestamptz columns properly with a default value.", function() {
            timestamptzInput = chaisePage.recordEditPage.getInputForAColumn('timestamptz', 1);
            timestamptzInputs = chaisePage.recordEditPage.getTimestampInputsForAColumn('timestamptz', 1);

            expect(timestamptzInput.getAttribute('value')).toBe(values.timestamptz_value, "Timestamptz default is incorrect");
            expect(timestamptzInputs.date.getAttribute('value')).toBe(values.timestamptz_date_value, "Timestamptz date default is incorrect");
            expect(timestamptzInputs.time.getAttribute('value')).toBe(values.timestamptz_time_value, "Timestamptz time default is incorrect");

            timestamptzDisabledInput = chaisePage.recordEditPage.getInputForAColumn('timestamptz_disabled', 1);
            timestamptzDisabledInputObj = chaisePage.recordEditPage.getTimestampInputsForAColumn('timestamptz_disabled', 1);

            expect(timestamptzDisabledInput.getAttribute('value')).toBe(values.timestamptz_disabled_value, "Hidden timestamptz disabled value is incorrect");
            expect(timestamptzDisabledInputObj.date.getAttribute('value')).toBe(values.timestamptz_disabled_date_value, "Timestamptz disabled date value is incorrect");
            expect(timestamptzDisabledInputObj.time.getAttribute('value')).toBe(values.timestamptz_disabled_time_value, "Timestamptz disabled time value is incorrect");
        });

        it("should initialize timestamptz columns properly if they are disabled without a default.", function() {
            timestamptzDisabledNoDefaultInput = chaisePage.recordEditPage.getInputForAColumn('timestamptz_disabled_no_default', 1);
            timestamptzDisabledNoDefaultInputObj = chaisePage.recordEditPage.getTimestampInputsForAColumn('timestamptz_disabled_no_default', 1);

            expect(timestamptzDisabledNoDefaultInput.getAttribute('value')).toBe(values.timestamptz_disabled_no_default_value, "Hidden timestamptz disabled value is incorrect");
            expect(timestamptzDisabledNoDefaultInputObj.date.getAttribute("value")).toBe(values.timestamptz_disabled_no_default_date_value, "The disabled timestamptz date value is incorrect");
            expect(timestamptzDisabledNoDefaultInputObj.time.getAttribute("value")).toBe(values.timestamptz_disabled_no_default_time_value, "The disabled timestamptz time value is incorrect");
        });

        // Foreign key columns
        it("should initialize foreign key inputs with their default value.", function() {
            // the clone will be disabled while data is loading.
            browser.wait(EC.elementToBeClickable(chaisePage.recordEditPage.getMultiFormInputSubmitButton()));

            foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputDisplay("foreign_key", 1);
            foreignKeyDropdownInput = chaisePage.recordEditPage.getForeignKeyInputDisplay("foreign_key_dropdown", 1);
            foreignKeyDisabledInput = chaisePage.recordEditPage.getForeignKeyInputDisplay("foreign_key_disabled", 1);

            expect(foreignKeyInput.getText()).toBe(values.foreign_key_value, "Foreign key input default is incorrect");
            expect(foreignKeyDropdownInput.getText()).toBe(values.foreign_key_dropdown_value, "Foreign key dropdown input default is incorrect");
            expect(foreignKeyDisabledInput.getText()).toBe(values.foreign_key_disabled_value, "Foreign key disabled default is incorrect");
        });

        // Asset columns
        it("should initialize asset column inputs with their default value.", function() {
            // the clone btn will be disabled while data is loading.
            browser.wait(EC.elementToBeClickable(chaisePage.recordEditPage.getMultiFormInputSubmitButton()));

            const assetTextInput = chaisePage.recordEditPage.getTextFileInputForAColumn("asset", 1)
            expect(assetTextInput.getText()).toBe(values.asset_value, "Asset input default is incorrect");

            const assetDisabledTextInput = chaisePage.recordEditPage.getTextFileInputForAColumn("asset_disabled", 1);
            expect(assetDisabledTextInput.getText()).toBe(values.asset_disabled_value, "Asset disabled default is incorrect");
        });

        it("should initialize asset columns properly if they are disabled without a default.", function() {
            const assetTextInput = chaisePage.recordEditPage.getTextFileInputForAColumn("asset_disabled_no_default", 1);
            expect(assetTextInput.getText()).toBe(values.asset_disabled_no_default_value, "The disabled asset placeholder is incorrect");
        });

        // System columns
        it("should initialize system column inputs with 'Automatically Generated'.", function() {
            var ridDisabledInput = chaisePage.recordEditPage.getInputForAColumn("RID", 1),
                rcbDisabledInput = chaisePage.recordEditPage.getInputForAColumn("RCB", 1),
                rmbDisabledInput = chaisePage.recordEditPage.getInputForAColumn("RMB", 1),
                rctDisabledInput = chaisePage.recordEditPage.getTimestampInputsForAColumn("RCT", 1),
                rmtDisabledInput = chaisePage.recordEditPage.getTimestampInputsForAColumn("RMT", 1);

            expect(ridDisabledInput.getAttribute("placeholder")).toBe(values.rid_disabled_value, "RID disabled input default is incorrect");
            expect(rcbDisabledInput.getAttribute("placeholder")).toBe(values.rcb_disabled_value, "RCB disabled input default is incorrect");
            expect(rmbDisabledInput.getAttribute("placeholder")).toBe(values.rmb_disabled_value, "RMB disabled input default is incorrect");

            expect(rctDisabledInput.date.getAttribute("placeholder")).toBe(values.rct_disabled_date_value, "RCT disabled date input default is incorrect");
            expect(rctDisabledInput.time.getAttribute("placeholder")).toBe(values.rct_disabled_time_value, "RCT disabled time input default is incorrect");

            expect(rmtDisabledInput.date.getAttribute("placeholder")).toBe(values.rmt_disabled_date_value, "RMT disabled date input default is incorrect");
            expect(rmtDisabledInput.time.getAttribute("placeholder")).toBe(values.rmt_disabled_time_value, "RMT disabled time input default is incorrect");
        });

        // TODO write tests for default values for composite foreign keys when implemented

        describe("Submit the form", function() {
            beforeAll(function() {
                chaisePage.recordEditPage.submitForm();
            });

            it("and redirect to a record page with the default values.", function() {
                var redirectUrl = browser.params.url + "/record/#" + browser.params.catalogId + "/defaults:" + testParams.table_name + "/RID=";

                browser.wait(function () {
                    return browser.driver.getCurrentUrl().then(function(url) {
                        return url.startsWith(redirectUrl);
                    });
                });

                expect(browser.driver.getCurrentUrl()).toContain(redirectUrl);

                recordEditHelpers.testRecordAppValuesAfterSubmission(testParams.column_names, testParams.record_column_values, testParams.column_names.length);
            });
        });
    });
});

describe("Record Edit with immutable columns", function() {

    describe("should verify the presentation of data", function () {

        beforeAll(function () {
            var keys = [];
            keys.push(testParams.edit_key.name + testParams.edit_key.operator + testParams.edit_key.value);
            chaisePage.navigate(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/defaults:" + testParams.table_name + "/"  + keys.join("&"));

            chaisePage.recordeditPageReady();
            browser.wait(function() {
                return chaisePage.recordEditPage.getAllColumnNames().count().then(function(ct) {
                    return (ct == testParams.re_column_names.length+1); // first row is not included
                });
            }, browser.params.defaultTimeout);
        });

        for (var i=0; i < testParams.re_column_names.length; i++) {
            (function(index) {
                const columnObj = testParams.re_column_names[index];
                const columnName = columnObj.name;
                // normal inputs with values in input under value attribute
                it("should initialize text input column: " + columnName + " with the proper value", function () {
                    let input;
                    switch (columnObj.type) {
                        case 'asset':
                            input = chaisePage.recordEditPage.getTextFileInputForAColumn(columnName, 1);
                            expect(input.getText()).toBe(testParams.re_column_values[columnName], "Recordedit value for: " + columnName + " is incorrect");

                            // that's why the asset column must be added to the begining of visible columns list
                            const tooltip = chaisePage.getTooltipDiv();
                            chaisePage.waitForElementInverse(tooltip).then(function () {
                                chaisePage.testTooltipReturnPromise(input, testParams.re_column_values[columnName], 'recordedit');
                            });
                            break;
                        case 'color':
                            input = chaisePage.recordEditPage.getColorInputForAColumn(columnName, 1);
                            expect(input.getAttribute('value')).toBe(testParams.re_column_values[columnName], "Recordedit value for: " + columnName + " is incorrect");
                            break;
                        case 'dropdown':
                            input = chaisePage.recordEditPage.getDropdownElementByName(columnName, 1);
                            expect(chaisePage.recordEditPage.getDropdownText(input).getText()).toBe(testParams.re_column_values[columnName], "Recordedit value for: " + columnName + " is incorrect");
                            break;
                        case 'foreign_key':
                            input = chaisePage.recordEditPage.getForeignKeyInputDisplay(columnName, 1);
                            expect(input.getText()).toBe(testParams.re_column_values[columnName], "Recordedit value for: " + columnName + " is incorrect");
                            break;
                        case 'textarea':
                            input = chaisePage.recordEditPage.getTextAreaForAColumn(columnName, 1);
                            expect(input.getAttribute('value')).toBe(testParams.re_column_values[columnName], "Recordedit value for: " + columnName + " is incorrect");
                            break;
                        case 'timestamp':
                            input = chaisePage.recordEditPage.getInputForAColumn(columnName, 1);
                            expect(input.getAttribute('value')).toBe(testParams.re_column_values[columnName], "Recordedit value for: " + columnName + " is incorrect");

                            const inputObj = chaisePage.recordEditPage.getTimestampInputsForAColumn(columnName, 1);
                            expect(inputObj.date.getAttribute('value')).toBe(testParams.re_column_values[columnName + '_date'], "Recordedit value for: " + columnName + " date is incorrect");
                            expect(inputObj.time.getAttribute('value')).toBe(testParams.re_column_values[columnName + '_time'], "Recordedit value for: " + columnName + " time is incorrect");
                            break;
                        default:
                            // colummObj.type = input but not set
                            input = chaisePage.recordEditPage.getInputForAColumn(columnName, 1);
                            expect(input.getAttribute('value')).toBe(testParams.re_column_values[columnName], "Recordedit value for: " + columnName + " is incorrect");
                            break;
                    }
                });
            })(i);
        };
    });
});
