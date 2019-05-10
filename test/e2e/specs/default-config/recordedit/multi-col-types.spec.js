// The goal of this spec is to test whether RecordEdit app correctly converts data for different column types for submission to ERMrest by verifying the contents that we expect to show up on record page, show up properly.
var testConfiguration = browser.params.configuration;
var moment = require('moment');

var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var chaisePage = require('../../../utils/chaise.page.js');
var recordEditPage = chaisePage.recordEditPage;
var testParams = {
    table_1: {
        tableName: "table_1",
        key: {columnName: "id", value: 1, operator: "="},
        row: [
            {name: "int2_null_col", displayType: "int2", value: 32767},
            {name: "int2_col", displayType: "int2"},
            {name: "int4_null_col", displayType: "int4", value: -2147483648},
            {name: "int4_col", displayType: "int4"},
            {name: "int8_null_col", displayType: "int8", value: 9007199254740991},
            {name: "int8_col", displayType: "int8"},
            {name: "float4_null_col", displayType: "float4", value: 4.6123},
            {name: "float4_col", displayType: "float4"},
            {name: "float8_null_col", displayType: "float8", value: 234523523.023045},
            {name: "float8_col", displayType: "float8"},
            {name: "text_null_col", displayType: "text", value: "sample"},
            {name: "text_col", displayType: "text"},
            {name: "longtext_null_col", displayType: "longtext", value: "asjdf;laksjdf;laj ;lkajsd;f lkajsdf;lakjs f;lakjs df;lasjd f;ladsjf;alskdjfa ;lskdjf a;lsdkjf a;lskdfjal;sdkfj as;ldfkj as;dlf kjasl;fkaj;lfkjasl;fjas;ldfkjals;dfkjas;dlkfja;sldkfjasl;dkfjas;dlfkjasl;dfkja; lsdjfk a;lskdjf a;lsdfj as;ldfja;sldkfja;lskjdfa;lskdjfa;lsdkfja;sldkfjas;ldfkjas;dlfkjas;lfkja;sldkjf a;lsjf ;laskj fa;slk jfa;sld fjas;l js;lfkajs;lfkasjf;alsja;lk ;l kja"},
            {name: "longtext_col", displayType: "longtext"},
            {name: "markdown_null_col", displayType: "markdown", value: "<strong>Sample</strong>"},
            {name: "markdown_col", displayType: "markdown"},
            {name: "bool_null_col", displayType: "boolean", value: true},
            {name: "bool_true_col", displayType: "boolean", value: false},
            {name: "bool_false_col", displayType: "boolean", value: ""},
            {name: "timestamp_null_col", displayType: "timestamp", value: {date: "2016-01-18", time: "01:00:00"}},
            {name: "timestamp_col", displayType: "timestamp"},
            {name: "timestamptz_null_col", displayType: "timestamptz", value: {date: "2016-01-18", time: "01:00:00"}},
            {name: "timestamptz_col", displayType: "timestamptz"},
            {name: "date_null_col", displayType: "date", value: "2016-08-15"},
            {name: "date_col", displayType: "date"},
            {name: "fk_null_col", displayType: "popup-select"},
            {name: "fk_col", displayType: "popup-select"},
            {name: "json_null_col", displayType: "json", value: "89.586"},
            {name: "json_col", displayType: "json"}
        ],
        columns: ["int2_col", "int4_col", "int8_col", "float4_col", "float8_col", "text_col", "longtext_col", "markdown_col", "bool_true_col", "bool_false_col", "timestamp_col", "timestamptz_col", "date_col", "vDcNH5rGBzGJObTbqmnH7g", "json_null_col", "json_col"],
        null_columns: ["int2_null_col", "int4_null_col", "int8_null_col", "float4_null_col", "float8_null_col", "text_null_col", "longtext_null_col", "markdown_null_col", "bool_null_col", "bool_true_col", "timestamp_null_col", "timestamptz_null_col", "date_null_col", "6lhMahZsQfXf_lAs9BSxNA", "vDcNH5rGBzGJObTbqmnH7g", "json_null_col", "json_col"],
        submitted_values: {
            int2_col: "32,767",
            int4_col: "-2,147,483,648",
            int8_col: "9,007,199,254,740,991",
            float4_col: "4.6123",
            float8_col: "234,523,523.0230",
            text_col: "sample",
            longtext_col: "asjdf;laksjdf;laj ;lkajsd;f lkajsdf;lakjs f;lakjs df;lasjd f;ladsjf;alskdjfa ;lskdjf a;lsdkjf a;lskdfjal;sdkfj as;ldfkj as;dlf kjasl;fkaj;lfkjasl;fjas;ldfkjals;dfkjas;dlkfja;sldkfjasl;dkfjas;dlfkjasl;dfkja; lsdjfk a;lskdjf a;lsdfj as;ldfja;sldkfja;lskjdfa;lskdjfa;lsdkfja;sldkfjas;ldfkjas;dlfkjas;lfkja;sldkjf a;lsjf ;laskj fa;slk jfa;sld fjas;l js;lfkajs;lfkasjf;alsja;lk ;l kja",
            markdown_col: "<strong>Sample</strong>",
            bool_true_col: "true",
            bool_false_col: "false",
            timestamp_col: "2016-01-18T13:00:00",
            timestamptz_col: "2016-01-18 00:00:00",
            date_col: "2016-08-15",
            // Value of foreign (fk_col) related entity
            "vDcNH5rGBzGJObTbqmnH7g": "Abraham Lincoln",
            json_null_col: "null",
            json_col: '"89.586"'
        },
        null_submitted_values: {
            int2_null_col: "32,767",
            int4_null_col: "-2,147,483,648",
            int8_null_col: "9,007,199,254,740,991",
            float4_null_col: "4.6123",
            float8_null_col: "234,523,523.0230",
            text_null_col: "sample",
            longtext_null_col: "asjdf;laksjdf;laj ;lkajsd;f lkajsdf;lakjs f;lakjs df;lasjd f;ladsjf;alskdjfa ;lskdjf a;lsdkjf a;lskdfjal;sdkfj as;ldfkj as;dlf kjasl;fkaj;lfkjasl;fjas;ldfkjals;dfkjas;dlkfja;sldkfjasl;dkfjas;dlfkjasl;dfkja; lsdjfk a;lskdjf a;lsdfj as;ldfja;sldkfja;lskjdfa;lskdjfa;lsdkfja;sldkfjas;ldfkjas;dlfkjas;lfkja;sldkjf a;lsjf ;laskj fa;slk jfa;sld fjas;l js;lfkajs;lfkasjf;alsja;lk ;l kja",
            markdown_null_col: "<strong>Sample</strong>",
            bool_null_col: "true",
            bool_true_col: "false",
            timestamp_null_col: "2016-01-18T13:00:00",
            timestamptz_null_col: "2016-01-18 13:00:00",
            date_null_col: "2016-08-15",
            // Value of foreign (fk_null_col) related entity
            "6lhMahZsQfXf_lAs9BSxNA": "Abraham Lincoln",
            // Value of foreign (fk_col) related entity
            "vDcNH5rGBzGJObTbqmnH7g": "Abraham Lincoln",
            json_null_col: "89.586",
            json_col: "null"
        }
    },
    table_w_generated_columns : {
        tableName: "table_w_generated_columns",
        key: {columnName: "id", value: 1, operator: "="},
        row: [
            {name: "int2_col_gen", value: "32767", displayType: "disabled"},
            {name: "int4_col_gen", value: "-2147483648", displayType: "disabled"},
            {name: "int8_col_gen", value: "9007199254740991", displayType: "disabled"},
            {name: "float4_col_gen", value: "4.6123", displayType: "disabled"},
            {name: "float8_col_gen", value: "234523523.023045", displayType: "disabled"},
            {name: "text_col_gen", value: "sample", displayType: "disabled"},
            {name: "longtext_col_gen", value: "asjdf;laksjdf;laj ;lkajsd;f lkajsdf;lakjs f;lakjs df;lasjd f;ladsjf;alskdjfa ;lskdjf a;lsdkjf a;lskdfjal;sdkfj as;ldfkj as;dlf kjasl;fkaj;lfkjasl;fjas;ldfkjals;dfkjas;dlkfja;sldkfjasl;dkfjas;dlfkjasl;dfkja; lsdjfk a;lskdjf a;lsdfj as;ldfja;sldkfja;lskjdfa;lskdjfa;lsdkfja;sldkfjas;ldfkjas;dlfkjas;lfkja;sldkjf a;lsjf ;laskj fa;slk jfa;sld fjas;l js;lfkajs;lfkasjf;alsja;lk ;l kja", displayType: "disabled"},
            {name: "markdown_col_gen", value: "<strong>Sample</strong>", displayType: "disabled"},
            {name: "bool_true_col_gen", value: "true", displayType: "disabled"},
            {name: "bool_false_col_gen", value: "false", displayType: "disabled"},
            {name: "timestamp_col_gen", value: "2016-01-18T13:00:00", displayType: "disabled"},
            {name: "timestamptz_col_gen", value: "2016-01-18T00:00:00-08:00", displayType: "disabled"},
            {name: "date_col_gen", value: "2016-08-15", displayType: "disabled"},
            {name: "fk_col_gen", value: "Abraham Lincoln", displayType: "disabled"},
            {name: "asset_col_gen", value: "http://test.com/hatract/test", displayType: "disabled"}
        ]
    }
};

// When editing a record, the app should reliably submit the right data to ERMrest
describe('When editing a record', function() {

    beforeAll(function() {
        browser.ignoreSynchronization = true;
        browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-column-types:" + testParams.table_w_generated_columns.tableName + '/' + testParams.table_w_generated_columns.key.columnName + testParams.table_w_generated_columns.key.operator + testParams.table_w_generated_columns.key.value);
        chaisePage.waitForElement(element(by.id("submit-record-button")));
    });

    // Tests that check the values for regular, non-disabled input fields are in 01-recordedit.edit.spec.js
    it('should display the correct values in disabled input fields', function(done) {
        testParams.table_w_generated_columns.row.forEach(function checkInput(col) {
            if (col.name == "asset_col_gen") {
                chaisePage.recordEditPage.getInputForAColumn("txt"+col.name, 0).then(function (input) {
                    expect(input.isEnabled()).toBeFalsy("col " + col.name + " was not disabled.");
                    expect(input.getAttribute('value')).toBe(col.value, "col " + col.name + " value missmatch.");
                });
            } else {
                var input = recordEditPage.getInputById(0, col.name);
                expect(input.isEnabled()).toBeFalsy("col " + col.name + " was not disabled.");
                expect(input.getAttribute('value')).toBe(col.value, "col " + col.name + " value missmatch.");
            }
            done();
        });
    });

    describe('if the user made no edits', function() {
        beforeAll(function() {
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-column-types:" + testParams.table_1.tableName + '/' + testParams.table_1.key.columnName + testParams.table_1.key.operator + testParams.table_1.key.value);
            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                return recordEditPage.submitForm();
            });
        });

        it('should submit the right data to the DB', function() {
            var redirectUrl = browser.params.url + "/record/#" + browser.params.catalogId + "/multi-column-types:" + testParams.table_1.tableName + '/';

            browser.wait(function () {
                return browser.driver.getCurrentUrl().then(function(url) {
                    return url.startsWith(redirectUrl);
                });
            });

            expect(browser.driver.getCurrentUrl()).toContain(redirectUrl);

            recordEditHelpers.testRecordAppValuesAfterSubmission(testParams.table_1.columns, testParams.table_1.submitted_values);
        });
    });

    // If the user does make an edit, make sure the app correctly converted the submission data for ERMrest.
    // We test this conversion on a per-column-type basis, with 2 test cases for each type:
    // 1. Converting from null to non-null (e.g. "int2_null_col" will be changed from null to 32767)
    // 2. Converting from non-null to null (e.g. "int2_col" will be changed from 32767 to null)
    // Except boolean type gets 3 cases (null to true, true to false, false to null).
    describe('if the user did make edits', function() {
        beforeAll(function() {
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-column-types:" + testParams.table_1.tableName + '/' + testParams.table_1.key.columnName + testParams.table_1.key.operator + testParams.table_1.key.value);
            chaisePage.waitForElement(element(by.id("submit-record-button")));
        });

        // Test each column type to check that the app converts the submission data correctly for each type
        it('should submit the right data to the DB', function() {
            // Edit each column with the new row data
            testParams.table_1.row.forEach(function(column) {
                var newValue = column.value;
                var name = column.name;
                switch (column.displayType) {
                    case 'popup-select':
                        // Clear the foreign key field for fk_col b/c fk_col needs to be null
                        if (name === 'fk_col') {
                            var clearBtns = element.all(by.css('.foreignkey-remove'));
                            chaisePage.clickButton(clearBtns.get(1));
                        }
                        // Select a non-null value for fk_null_col b/c fk_null_col needs to be non-null
                        if (name === 'fk_null_col') {
                            element.all(by.css('.modal-popup-btn')).first().click().then(function() {
                                return chaisePage.waitForElement(element.all(by.id('divRecordSet')).first());
                            }).then(function() {
                                // Get the first row in the modal popup table, find the row's select-action-buttons, and click the 1st one.
                                return chaisePage.recordsetPage.getRows().first().all(by.css('.select-action-button')).first().click();
                            }).catch(function(error) {
                                console.log(error);
                                expect('Something went wrong in this promise chain.').toBe('Please see error message.');
                            });
                        }
                        break;
                    case 'timestamp':
                    case 'timestamptz':
                        var inputs = recordEditPage.getTimestampInputsForAColumn(name, 0);
                        var dateInput = inputs.date, timeInput = inputs.time, meridiemBtn = inputs.meridiem;

                        dateInput.clear().then(function() {
                            if (newValue) dateInput.sendKeys(newValue.date);

                            return timeInput.clear();
                        }).then(function() {
                            if (newValue) timeInput.sendKeys(newValue.time);

                            if (newValue) return meridiemBtn.click();
                        }).catch(function(error) {
                            console.log(error);
                            expect('Something went wrong in this promise chain.').toBe('Please see error message.');
                        });
                        break;
                    case 'date':
                        var input = recordEditPage.getDateInputForAColumn(name, 0);
                        input.clear().then(function() {
                            if (newValue) input.sendKeys(newValue);
                        }).catch(function(error) {
                            console.log(error);
                            expect('Something went wrong in this promise chain.').toBe('Please see error message.');
                        });
                        break;
                    case 'boolean':
                        var dropdown = recordEditPage.getInputById(0, name);
                        recordEditPage.selectDropdownValue(dropdown, newValue);
                        break;
                    default:
                        var input = recordEditPage.getInputById(0, name);
                        input.clear().then(function() {
                            if (newValue) input.sendKeys(newValue);
                        }).catch(function(error) {
                            console.log(error);
                            expect('Something went wrong in this promise chain.').toBe('Please see error message.');
                        });
                }   // match to switch statement
            });


            // Submit the form
            recordEditPage.submitForm().then(function() {

                var redirectUrl = browser.params.url + "/record/#" + browser.params.catalogId + "/multi-column-types:" + testParams.table_1.tableName + '/';

                browser.wait(function () {
                    return browser.driver.getCurrentUrl().then(function(url) {
                        return url.startsWith(redirectUrl);
                    });
                });

                expect(browser.driver.getCurrentUrl()).toContain(redirectUrl);

                recordEditHelpers.testRecordAppValuesAfterSubmission(testParams.table_1.null_columns, testParams.table_1.null_submitted_values);
            });
        });
    });
});
