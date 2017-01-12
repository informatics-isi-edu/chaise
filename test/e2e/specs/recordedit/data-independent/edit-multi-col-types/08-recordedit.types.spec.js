// The goal of this spec is to test whether RecordEdit app correctly converts data for different column types for submission to ERMrest.

var chaisePage = require('../../../../utils/chaise.page.js');
var recordEditPage = chaisePage.recordEditPage;
var authCookie = process.env.AUTH_COOKIE;
var ermRestUrl = process.env.ERMREST_URL;
var ermRest = require('../../../../../../../ermrestjs/build/ermrest.js');
ermRest.setUserCookie(authCookie);

// When editing a record, the app should reliably submit the right data to ERMrest
describe('When editing a record', function() {
    var testParams = browser.params.configuration.tests.params;

    beforeAll(function() {
        browser.ignoreSynchronization = true;
    });

    describe('if the user made no edits, the app', function() {
        var url;
        beforeAll(function(done) {
            url = ermRestUrl + '/catalog/' + browser.params.catalogId + '/entity/' + browser.params.schema.name + ':' + testParams.tableName + '/' + testParams.key.columnName + testParams.key.operator + testParams.key.value;
            browser.get(browser.params.url + ":" + testParams.tableName + '/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
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
                var row = testParams.row;
                expect(Object.keys(tuple).length).toEqual(row.length);
                row.forEach(function(column) {
                    // Added the column name in expect clauses so that if an expectation fails, we can quickly see which column type failed in error output.
                    expect(column.name + ': ' + tuple[column.name]).toBe(column.name + ': ' + column.value);
                });
            }).catch(function(error) {
                console.log(error);
                expect('Something went wrong in this promise chain.').toBe('Please see error message.');
            });
        });
    });

    // If the user does make an edit, make sure the app correctly converted the submission data for ERMrest.
    // We test this conversion on a per-column-type basis, with 2 test cases for each type:
    // 1. Converting from null to non-null
    // 2. Converting from non-null to null
    // Except boolean type gets 3 cases (null to true, true to false, false to null).
    describe('if the user did make edits, the app', function() {
        var url, newRowData;
        beforeAll(function(done) {
            url = ermRestUrl + '/catalog/' + browser.params.catalogId + '/entity/' + browser.params.schema.name + ':' + testParams.tableName + '/' + testParams.key.columnName + testParams.key.operator + testParams.key.value;
            // These will be the new values we expect the row to have in ERMrest after editing this row in the app
            newRowData = {
                "id": 1, // Leave this one alone
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
                "timestamp_null_col": "2016-01-18T13:00:00-08:00",
                "timestamp_col": null,
                "date_null_col": "2016-08-15",
                "date_col": null,
                "fk_null_col": 1,
                "fk_col": null
            };
            browser.get(browser.params.url + ":" + testParams.tableName + '/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                done();
            });
        });

        // Test each column type to check that the app converts the submission data correctly for each type
        it('should submit the right data to the DB', function() {
            // Edit each column with the new row data
            testParams.row.forEach(function(column, index, array) {
                (function(column) {
                    switch (column.displayType) {
                        case 'serial4':
                            break;
                        case 'popup-select':
                            // Clear the foreign key field for fk_col
                            if (column.name === 'fk_col') {
                                var clearBtns = element.all(by.css('.foreignkey-remove'));
                                chaisePage.clickButton(clearBtns.get(1));
                            }

                            // Select a non-null value for fk_null_col
                            if (column.name === 'fk_null_col') {
                                element.all(by.css('.modal-popup-btn')).first().click().then(function() {
                                    return chaisePage.waitForElement(element.all(by.id('divRecordSet')).first());
                                }).then(function() {
                                    chaisePage.recordsetPage.getRows().first().click();
                                }).catch(function(error) {
                                    console.log(error);
                                    expect('Something went wrong in this promise chain.').toBe('Please see error message.');
                                });
                            }
                            break;
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
                                    return timeInput.sendKeys('010000');
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
                // Compare tuple data with expected data
                var tuple = page.tuples[0].data;
                expect(Object.keys(tuple).length).toBe(Object.keys(newRowData).length);
                for (var colName in newRowData) {
                    // Added the column name in expect clauses so that if an expectation fails, we can quickly see which column type failed in error output.
                    expect(colName + ': ' + tuple[colName]).toBe(colName + ': ' + newRowData[colName]);
                }
            }).catch(function(error) {
                console.log(error);
                expect('Something went wrong in this promise chain.').toBe('Please see error message.');
            });
        });
    });
});
