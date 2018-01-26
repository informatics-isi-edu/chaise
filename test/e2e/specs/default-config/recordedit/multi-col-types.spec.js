// The goal of this spec is to test whether RecordEdit app correctly converts data for different column types for submission to ERMrest.
var testConfiguration = browser.params.configuration;
var authCookie = testConfiguration.authCookie || process.env.AUTH_COOKIE;
var ermRestUrl = testConfiguration.setup.url || process.env.ERMREST_URL;
var ermRest = require('../../../../../../ermrestjs/build/ermrest.js');
var moment = require('moment');

var chaisePage = require('../../../utils/chaise.page.js');
var recordEditPage = chaisePage.recordEditPage;
var testParams = {
    table_1: {
        tableName: "table_1",
        key: {columnName: "id", value: 1, operator: "="},
        row: [
            {name: "id", value: 1, displayType: "disabled"},
            {name: "int2_null_col", value: null, displayType: "int2"},
            {name: "int2_col", value: 32767, displayType: "int2"},
            {name: "int4_null_col", value: null, displayType: "int4"},
            {name: "int4_col", value: -2147483648, displayType: "int4"},
            {name: "int8_null_col", value: null, displayType: "int8"},
            {name: "int8_col", value: 9007199254740991, displayType: "int8"},
            {name: "float4_null_col", value: null, displayType: "float4"},
            {name: "float4_col", value: 4.6123, displayType: "float4"},
            {name: "float8_null_col", value: null, displayType: "float8"},
            {name: "float8_col", value: 234523523.023045, displayType: "float8"},
            {name: "text_null_col", value: null, displayType: "text"},
            {name: "text_col", value: "sample", displayType: "text"},
            {name: "longtext_null_col", value: null, displayType: "longtext"},
            {name: "longtext_col", value: "asjdf;laksjdf;laj ;lkajsd;f lkajsdf;lakjs f;lakjs df;lasjd f;ladsjf;alskdjfa ;lskdjf a;lsdkjf a;lskdfjal;sdkfj as;ldfkj as;dlf kjasl;fkaj;lfkjasl;fjas;ldfkjals;dfkjas;dlkfja;sldkfjasl;dkfjas;dlfkjasl;dfkja; lsdjfk a;lskdjf a;lsdfj as;ldfja;sldkfja;lskjdfa;lskdjfa;lsdkfja;sldkfjas;ldfkjas;dlfkjas;lfkja;sldkjf a;lsjf ;laskj fa;slk jfa;sld fjas;l js;lfkajs;lfkasjf;alsja;lk ;l kja", displayType: "longtext"},
            {name: "markdown_null_col", value: null, displayType: "markdown"},
            {name: "markdown_col", value: "<strong>Sample</strong>", displayType: "markdown"},
            {name: "bool_null_col", value: null, displayType: "boolean"},
            {name: "bool_true_col", value: true, displayType: "boolean"},
            {name: "bool_false_col", value: false, displayType: "boolean"},
            {name: "timestamp_null_col", value: null, displayType: "timestamp"},
            {name: "timestamp_col", value: "2016-01-18T13:00:00", displayType: "timestamp"},
            {name: "timestamptz_null_col", value: null, displayType: "timestamptz"},
            {name: "timestamptz_col", value: "2016-01-18T00:00:00-08:00", displayType: "timestamptz"},
            {name: "date_null_col", value: null, displayType: "date"},
            {name: "date_col", value: "2016-08-15", displayType: "date"},
            {name: "fk_null_col", value: null, displayType: "popup-select"},
            {name: "fk_col", value: "1", displayType: "popup-select"},
            {name: "json_col", value: "89.586" , displayType: "json"},
            {name: "json_null_col", value: null, displayType: "json"}
        ]
    },
    table_w_generated_columns : {
        tableName: "table_w_generated_columns",
        key: {columnName: "id", value: 1, operator: "="},
        row: [
            {"name": "int2_col_gen", value: 32767, displayType: "disabled"},
            {"name": "int4_col_gen", value: -2147483648, displayType: "disabled"},
            {"name": "int8_col_gen", value: 9007199254740991, displayType: "disabled"},
            {"name": "float4_col_gen", value: 4.6123, displayType: "disabled"},
            {"name": "float8_col_gen", value: 234523523.023045, displayType: "disabled"},
            {"name": "text_col_gen", value: "sample", displayType: "disabled"},
            {"name": "longtext_col_gen", value: "asjdf;laksjdf;laj ;lkajsd;f lkajsdf;lakjs f;lakjs df;lasjd f;ladsjf;alskdjfa ;lskdjf a;lsdkjf a;lskdfjal;sdkfj as;ldfkj as;dlf kjasl;fkaj;lfkjasl;fjas;ldfkjals;dfkjas;dlkfja;sldkfjasl;dkfjas;dlfkjasl;dfkja; lsdjfk a;lskdjf a;lsdfj as;ldfja;sldkfja;lskjdfa;lskdjfa;lsdkfja;sldkfjas;ldfkjas;dlfkjas;lfkja;sldkjf a;lsjf ;laskj fa;slk jfa;sld fjas;l js;lfkajs;lfkasjf;alsja;lk ;l kja", displayType: "disabled"},
            {"name": "markdown_col_gen", value: "<strong>Sample</strong>", displayType: "disabled"},
            {"name": "bool_true_col_gen", value: true, displayType: "disabled"},
            {"name": "bool_false_col_gen", value: false, displayType: "disabled"},
            {"name": "timestamp_col_gen", value: "2016-01-18T13:00:00", displayType: "disabled"},
            {"name": "timestamptz_col_gen", value: "2016-01-18T00:00:00-08:00", displayType: "disabled"},
            {"name": "date_col_gen", value: "2016-08-15", displayType: "disabled"},
            {"name": "fk_col_gen", value: "1", displayType: "disabled"},
            {"name": "asset_col_gen", value: "http://test.com/hatract/test", displayType: "disabled"}
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

    beforeEach(function() {
        ermRest.setUserCookie(authCookie);
    });

    // Tests that check the values for regular, non-disabled input fields are in 01-recordedit.edit.spec.js
    it('should display the correct values in disabled input fields', function(done) {
        testParams.table_w_generated_columns.row.forEach(function checkInput(col) {
            (function(col) {
                if (col.name == 'bool_true_col_gen' || col.name == 'bool_false_col_gen') {
                    var dropdown = recordEditPage.getInputById(0, col.name);
                    recordEditPage.getDropdownText(dropdown).then(function(text) {
                        expect(text).toBe(col.value.toString(), "col " + col.name + " value missmatch.");
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                } else if (col.name == 'fk_col_gen') {
                    recordEditPage.getForeignKeyInputs().first().getAttribute('innerText').then(function(text) {
                        expect(text).toBe('Abraham Lincoln', "col " + col.name + " value missmatch.");
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                } else if (col.name == "asset_col_gen") {
                    recordEditPage.getInputForAColumn(col.name, 0).then(function (fileInput) {
                        expect(fileInput.isEnabled()).toBe(false, "col " + col.name + " file input was not disabled.");
                        return recordEditPage.getInputForAColumn("txt" + col.name, 0);
                    }).then(function (txtInput) {
                        expect(txtInput.isEnabled()).toBe(false, "col " + col.name + " text input was not disabled.");
                        expect(txtInput.getAttribute('value')).toBe(col.value, "col " + col.name + " value missmatch.");
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                } else {
                    var input = recordEditPage.getInputById(0, col.name);
                    expect(input.isEnabled()).toBe(false, "col " + col.name + " was not disabled.");
                    input.getAttribute('value').then(function(value) {
                        if (col.name == 'timestamp_col_gen' || col.name == 'timestamptz_col_gen') {
                            var actualValue = moment(value, "YYYY-MM-DDTHH:mm:ssZ").format("YYYY-MM-DDTHH:mm:ssZ");
                            var expectedValue = moment(col.value.toString(), "YYYY-MM-DDTHH:mm:ssZ").format("YYYY-MM-DDTHH:mm:ssZ");
                            expect(actualValue).toBe(expectedValue, "col " + col.name + " value missmatch.");
                        } else {
                            expect(value).toBe(col.value.toString(), "col " + col.name + " value missmatch.");
                        }
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                }
            })(col);
        });
    });

    describe('if the user made no edits', function() {
        var url;
        beforeAll(function(done) {
            url = ermRestUrl + '/catalog/' + browser.params.catalogId + '/entity/multi-column-types:' + testParams.table_1.tableName + '/' + testParams.table_1.key.columnName + testParams.table_1.key.operator + testParams.table_1.key.value;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-column-types:" + testParams.table_1.tableName + '/' + testParams.table_1.key.columnName + testParams.table_1.key.operator + testParams.table_1.key.value);
            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                done();
            });
        });

        it('should submit the right data to the DB', function() {
            recordEditPage.submitForm().then(function() {
                return recordEditPage.getAlertError();
            }).then(function(alert) {
                // Expect there to be no error alerts
                expect(alert).toBeFalsy();
                return ermRest.resolve(url, {cid: 'chaise-e2e-test'});
            // Fetch a reference to this row from ERMrest
            }).then(function(ref) {
                return ref.contextualize.entryEdit.read(1);
            }).then(function(page) {
                // Compare tuple data with expected data
                var tuple = page.tuples[0].data;
                var row = testParams.table_1.row;
                expect(Object.keys(tuple).length).toEqual(row.length);
                row.forEach(function(column) {
                    var expectedValue = column.value;
                    // Convert both the ERMrest value and expected value to the same time zone to test.
                    // If you just convert the expected value to the local time zone, you could get a mistmatch because ERMrest
                    // will return a value in the time zone that the db was deployed in (on Travis, that seems to be UTC) but our
                    // Travis yml sets the time zone to Los Angeles.
                    if (column.name === 'timestamptz_col') {
                        var tupleValue = moment(tuple[column.name], "YYYY-MM-DDTHH:mm:ssZ").format("YYYY-MM-DDTHH:mm:ssZ");
                        expectedValue = moment("2016-01-18T00:00:00-08:00", "YYYY-MM-DDTHH:mm:ssZ").format("YYYY-MM-DDTHH:mm:ssZ");
                        // Added the column name in expect clauses so that if an expectation fails, we can quickly see which column type failed in error output.
                        expect(column.name + ': ' + tupleValue).toBe(column.name + ': ' + expectedValue);
                    } else {
                        // Added the column name in expect clauses so that if an expectation fails, we can quickly see which column type failed in error output.
                        expect(column.name + ': ' + tuple[column.name]).toBe(column.name + ': ' + expectedValue);
                    }
                });
            }).catch(function(error) {
                console.log(error);
                expect('Something went wrong in this promise chain.').toBe('Please see error message.');
            });
        });
    });

    // If the user does make an edit, make sure the app correctly converted the submission data for ERMrest.
    // We test this conversion on a per-column-type basis, with 2 test cases for each type:
    // 1. Converting from null to non-null (e.g. "int2_null_col" will be changed from null to 32767)
    // 2. Converting from non-null to null (e.g. "int2_col" will be changed from 32767 to null)
    // Except boolean type gets 3 cases (null to true, true to false, false to null).
    describe('if the user did make edits', function() {
        var url, newRowData;
        beforeAll(function(done) {
            url = ermRestUrl + '/catalog/' + browser.params.catalogId + '/entity/multi-column-types:' + testParams.table_1.tableName + '/' + testParams.table_1.key.columnName + testParams.table_1.key.operator + testParams.table_1.key.value;
            // These will be the new values we expect the row to have in ERMrest after editing this row in the app
            // The generated columns are excluded here because they retain their initial values even after submission.
            newRowData = {
                "id": 1,
                "int2_null_col": 32767,
                "int2_col": null,
                "int4_null_col": -2147483648,
                "int4_col": null,
                "int8_null_col": 9007199254740991,
                "int8_col": null,
                "float4_null_col": 4.6123,
                "float4_col": null,
                "float8_null_col": 234523523.023045,
                "float8_col": null,
                "text_null_col": "sample",
                "text_col": null,
                "longtext_null_col": "asjdf;laksjdf;laj ;lkajsd;f lkajsdf;lakjs f;lakjs df;lasjd f;ladsjf;alskdjfa ;lskdjf a;lsdkjf a;lskdfjal;sdkfj as;ldfkj as;dlf kjasl;fkaj;lfkjasl;fjas;ldfkjals;dfkjas;dlkfja;sldkfjasl;dkfjas;dlfkjasl;dfkja; lsdjfk a;lskdjf a;lsdfj as;ldfja;sldkfja;lskjdfa;lskdjfa;lsdkfja;sldkfjas;ldfkjas;dlfkjas;lfkja;sldkjf a;lsjf ;laskj fa;slk jfa;sld fjas;l js;lfkajs;lfkasjf;alsja;lk ;l kja",
                "longtext_col": null,
                "markdown_null_col": "<strong>Sample</strong>",
                "markdown_col": null,
                "bool_null_col": true,
                "bool_true_col": false,
                "bool_false_col": null,
                "timestamp_null_col": "2016-01-18T13:00:00",
                "timestamp_col": null,
                // The expected value for timestamptz columns depends on the testing platform's time zone, since
                // ERMrest produces timestamptz values in the time zone that's it deployed in.
                "timestamptz_null_col": moment("2016-01-18T13:00:00-08:00", "YYYY-MM-DDTHH:mm:ssZ").format("YYYY-MM-DDTHH:mm:ssZ"),
                "timestamptz_col": null,
                "date_null_col": "2016-08-15",
                "date_col": null,
                "fk_null_col": 1,
                "fk_col": null,
                "json_null_col": null,
                "json_col": 89.586
            };
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-column-types:" + testParams.table_1.tableName + '/' + testParams.table_1.key.columnName + testParams.table_1.key.operator + testParams.table_1.key.value);
            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                done();
            });
        });

        // Test each column type to check that the app converts the submission data correctly for each type
        it('should submit the right data to the DB', function(done) {
            // Edit each column with the new row data
            testParams.table_1.row.forEach(function(column, index, array) {
                (function(column) {
                    switch (column.displayType) {
                        case 'disabled':
                            break;
                        case 'popup-select':
                            // Clear the foreign key field for fk_col b/c fk_col needs to be null
                            if (column.name === 'fk_col') {
                                var clearBtns = element.all(by.css('.foreignkey-remove'));
                                chaisePage.clickButton(clearBtns.get(1));
                            }
                            // Select a non-null value for fk_null_col b/c fk_null_col needs to be non-null
                            if (column.name === 'fk_null_col') {
                                element.all(by.css('.modal-popup-btn')).first().click().then(function() {
                                    return chaisePage.waitForElement(element.all(by.id('divRecordSet')).first());
                                }).then(function() {
                                    // Get the first row in the modal popup table, find the row's select-action-buttons, and click the 1st one.
                                    chaisePage.recordsetPage.getRows().first().all(by.css('.select-action-button')).first().click();
                                }).catch(function(error) {
                                    console.log(error);
                                    expect('Something went wrong in this promise chain.').toBe('Please see error message.');
                                });
                            }
                            break;
                        case 'timestamp':
                        case 'timestamptz':
                            var inputs = recordEditPage.getTimestampInputsForAColumn(column.name, 0);
                            var dateInput = inputs.date, timeInput = inputs.time, meridiemBtn = inputs.meridiem;
                            var newValue = newRowData[column.name];

                            dateInput.clear().then(function() {
                                if (newValue !== null) {
                                    return dateInput.sendKeys('20160118');
                                }
                            }).catch(function(error) {
                                console.log(error);
                                expect('Something went wrong in this promise chain.').toBe('Please see error message.');
                            });

                            timeInput.clear().then(function() {
                                if (newValue !== null) {
                                    return timeInput.sendKeys('01:00:00');
                                };
                            }).catch(function(error) {
                                console.log(error);
                                expect('Something went wrong in this promise chain.').toBe('Please see error message.');
                            });

                            if (newValue !== null) {
                                meridiemBtn.click();
                            }
                            break;
                        case 'date':
                            var input = recordEditPage.getDateInputForAColumn(column.name, 0);
                            input.clear().then(function() {
                                if (newRowData[column.name]) {
                                    input.sendKeys('20160815');
                                }
                            }).catch(function(error) {
                                console.log(error);
                                expect('Something went wrong in this promise chain.').toBe('Please see error message.');
                            });
                            break;
                        case 'boolean':
                            var dropdown = recordEditPage.getInputById(0, column.name);
                            var newValue = newRowData[column.name];
                            if (newValue === null) {
                                newValue = '';
                            }
                            recordEditPage.selectDropdownValue(dropdown, newValue);
                            break;
                        default:
                            var input = recordEditPage.getInputById(0, column.name);
                            input.clear().then(function() {
                                if (newRowData[column.name] !== null) {
                                    input.sendKeys(newRowData[column.name]);
                                }
                            }).catch(function(error) {
                                console.log(error);
                                expect('Something went wrong in this promise chain.').toBe('Please see error message.');
                            });
                    }
                })(column);
            });


            // Submit the form
            recordEditPage.submitForm().then(function() {

                return recordEditPage.getAlertError();
            }).then(function(alert) {
                // Expect there to be no error alerts
                expect(alert).toBeFalsy();
                return chaisePage.waitForElement(element(by.id('tblRecord')));
            }).then(function() {
                // Fetch a reference to this row from ERMrest
                return ermRest.resolve(url, {cid: 'chaise-e2e-test'});
            }).then(function(ref) {
                return ref.contextualize.entryEdit.read(1);
            }).then(function(page) {
                // Compare tuple data with expected new data
                var tuple = page.tuples[0].data;
                expect(Object.keys(tuple).length).toBe(Object.keys(newRowData).length);
                for (var colName in newRowData) {
                    if (colName === 'timestamptz_null_col') {
                        var tupleValue = moment(tuple[colName], "YYYY-MM-DDTHH:mm:ssZ").format("YYYY-MM-DDTHH:mm:ssZ");
                        // Added the column name in expect clauses so that if an expectation fails, we can quickly see which column type failed in error output.
                        expect(colName + ': ' + tupleValue).toBe(colName + ': ' + newRowData[colName]);
                    } else {
                        // Added the column name in expect clauses so that if an expectation fails, we can quickly see which column type failed in error output.
                        expect(colName + ': ' + tuple[colName]).toBe(colName + ': ' + newRowData[colName]);
                    }
                }
                done();
            }).catch(function(error) {
                console.log(error);
                expect('Something went wrong in this promise chain.').toBe('Please see error message.');
                done.fail();
            });
        });
    });
});
