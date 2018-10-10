var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var testParams = {
    table_name: "multi-add-table",
    records: 3,
    max_input_rows: 200,
    initial_int_val: "1",
    initial_text_val: "a",
    input_1_text_val: "asdfg",
    input_2_text_val: "qwerty",
    input_3_int_val: "17",
    date_col_name: "date",
    timestamp_col_name: "timestamp",
    fk_col_name: "fk_to_f1",
    uri_col_name: "uri",
    files: [{
        name: "file500kb.png",
        size: "512000",
        displaySize: "500KB",
        path: "file500kb.png"
    }],
    values: {
        date: {
            initial: "2018-10-09",
            modified: "2017-06-05"
        },
        timestamp: {
            initial: {
                date: "2018-10-10",
                time: "10:48:02"
            },
            modified: {
                date: "2017-06-05",
                time: "01:22:39"
            }
        },
        fk: {
            initial: "three",
            modified: "two"
        }
    }
};

describe('Record Add', function() {

    describe("for when the user adds multiple forms using the multi form input control, ", function() {
        var EC = protractor.ExpectedConditions,
            multiFormOpenButton = chaisePage.recordEditPage.getMultiFormInputOpenButton(),
            multiFormInput = chaisePage.recordEditPage.getMultiFormInput(),
            multiFormSubmitButton = chaisePage.recordEditPage.getMultiFormInputSubmitButton(),
            intVal = testParams.initial_int_val,
            textVal = testParams.initial_text_val,
            intDisplayName = "int",
            textDisplayName = "text";

        var dateInput1 = chaisePage.recordEditPage.getDateInputsForAColumn(testParams.date_col_name, 0),
            dateInput2 = chaisePage.recordEditPage.getDateInputsForAColumn(testParams.date_col_name, 1),
            dateInput3 = chaisePage.recordEditPage.getDateInputsForAColumn(testParams.date_col_name, 2);

        var tsInput1 = chaisePage.recordEditPage.getTimestampInputsForAColumn(testParams.timestamp_col_name, 0),
            tsInput2 = chaisePage.recordEditPage.getTimestampInputsForAColumn(testParams.timestamp_col_name, 1),
            tsInput3 = chaisePage.recordEditPage.getTimestampInputsForAColumn(testParams.timestamp_col_name, 2);

        var fkInput1 = chaisePage.recordEditPage.getForeignKeyInputDisplay(testParams.fk_col_name, 0),
            fkInput2 = chaisePage.recordEditPage.getForeignKeyInputDisplay(testParams.fk_col_name, 1),
            fkInput3 = chaisePage.recordEditPage.getForeignKeyInputDisplay(testParams.fk_col_name, 2);

        var uploadInput1 = chaisePage.recordEditPage.getUploadInput(testParams.uri_col_name, 0),
            uploadInput2 = chaisePage.recordEditPage.getUploadInput(testParams.uri_col_name, 1),
            uploadInput3 = chaisePage.recordEditPage.getUploadInput(testParams.uri_col_name, 2);

        var index;

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-add:" + testParams.table_name);
        });

        it("should click the button and show an input box.", function() {
            browser.wait(EC.elementToBeClickable(multiFormOpenButton), browser.params.defaultTimeout);

            chaisePage.recordEditPage.getMultiFormInputOpenButtonScript().then(function(openBtn) {
                return chaisePage.clickButton(openBtn);
            }).then(function() {
                return multiFormInput.isDisplayed();
            }).then(function(bool) {
                expect(bool).toBeTruthy();
            });
        });

        it("should click the button a second time to hide the input.", function() {
            chaisePage.recordEditPage.getMultiFormInputOpenButtonScript().then(function(openBtn) {
                return chaisePage.clickButton(openBtn);
            }).then(function() {
                return multiFormInput.isDisplayed();
            }).then(function(bool) {
                expect(bool).toBeFalsy();
            });
        });

        it("should alert the user when they try to add more forms than the limit of " + testParams.max_input_rows + " allows.", function() {
            var numberGreaterThanMax = 300,
                errorMessage = "Cannot add " + numberGreaterThanMax + " records. Please input a value between 1 and 200, inclusive.";

            chaisePage.recordEditPage.getMultiFormInputOpenButtonScript().then(function(openBtn) {
                return chaisePage.clickButton(openBtn)
            }).then(function() {
                chaisePage.recordEditPage.clearInput(multiFormInput);
                browser.sleep(10);
                multiFormInput.sendKeys(numberGreaterThanMax);

                return chaisePage.recordEditPage.getMultiFormInputSubmitButtonScript();
            }).then(function(submitBtn) {
                return chaisePage.clickButton(submitBtn);
            }).then(function() {
                return chaisePage.recordEditPage.getAlertError();
            }).then(function(err) {
                return err.getText();
            }).then(function(text) {
                expect(text.indexOf(errorMessage)).toBeGreaterThan(-1);
            });
        });

        it("should fill in the first form add " + (testParams.records-1) + " more forms.", function() {
            index = 0;
            intInput = chaisePage.recordEditPage.getInputById(index, intDisplayName);
            textInput = chaisePage.recordEditPage.getInputById(index, textDisplayName);

            intInput.sendKeys(intVal);
            textInput.sendKeys(textVal);

            chaisePage.recordEditPage.clearInput(multiFormInput);
            browser.sleep(10);
            multiFormInput.sendKeys(testParams.records-1);

            chaisePage.recordEditPage.getMultiFormInputSubmitButtonScript().then(function(submitBtn) {
                return chaisePage.clickButton(submitBtn);
            }).then(function() {
                return chaisePage.recordEditPage.getViewModelRows();
            }).then(function(rows) {
                expect(rows.length).toBe(testParams.records);
            });
        });

        describe("set the value for all forms at once for:", function () {

            if (!process.env.TRAVIS && testParams.files.length > 0) {
                beforeAll(function(done) {
                    // create files that will be uploaded
                    recordEditHelpers.createFiles(testParams.files);
                    done();
                });
            }

            it(testParams.date_col_name, function (done) {
                var colName = testParams.date_col_name;
                var value = testParams.values.date.initial;

                chaisePage.recordEditPage.getColumnOptionsDropdown(colName).click().then(function () {
                    return chaisePage.recordEditPage.getSelectAll(colName).click();
                }).then(function () {
                    chaisePage.recordEditPage.getSelectAllDate(colName).sendKeys(value);

                    return chaisePage.recordEditPage.getSelectAllApply().click();
                }).then(function () {
                    // verify the values
                    expect(dateInput1.date.getAttribute("value")).toBe(value);
                    expect(dateInput2.date.getAttribute("value")).toBe(value);
                    expect(dateInput3.date.getAttribute("value")).toBe(value);

                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it(testParams.timestamp_col_name, function (done) {
                var colName = testParams.timestamp_col_name;
                var dateValue = testParams.values.timestamp.initial.date,
                    timeValue = testParams.values.timestamp.initial.time;

                chaisePage.recordEditPage.getColumnOptionsDropdown(colName).click().then(function () {
                    return chaisePage.recordEditPage.getSelectAll(colName).click();
                }).then(function () {
                    chaisePage.recordEditPage.getSelectAllDate(colName).sendKeys(dateValue);
                    chaisePage.recordEditPage.getSelectAllTime(colName).sendKeys(timeValue);

                    return chaisePage.recordEditPage.getSelectAllApply().click();
                }).then(function () {
                    // verify the values
                    expect(tsInput1.date.getAttribute("value")).toBe(dateValue);
                    expect(tsInput2.date.getAttribute("value")).toBe(dateValue);
                    expect(tsInput3.date.getAttribute("value")).toBe(dateValue);

                    expect(tsInput1.time.getAttribute("value")).toBe(timeValue);
                    expect(tsInput2.time.getAttribute("value")).toBe(timeValue);
                    expect(tsInput3.time.getAttribute("value")).toBe(timeValue);

                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it(testParams.fk_col_name, function (done) {
                var colName = testParams.fk_col_name;
                var value = testParams.values.fk.initial;

                chaisePage.recordEditPage.getColumnOptionsDropdown(colName).click().then(function () {
                    return chaisePage.recordEditPage.getSelectAll(colName).click();
                }).then(function () {
                    // open fk modal
                    return chaisePage.recordEditPage.getSelectAllPopupBtn().click();
                }).then(function () {
                    // wait for modal rows to load
                    browser.wait(function() {
                        return chaisePage.recordsetPage.getModalRows().count().then(function(ct) {
                            return (ct == 5);
                        });
                    }, browser.params.defaultTimeout);

                    // select value (the third row)
                    return chaisePage.recordsetPage.getRows().get(2).all(by.css(".select-action-button")).click();
                }).then(function () {
                    return chaisePage.recordEditPage.getSelectAllApply().click();
                }).then(function () {
                    // verify the values
                    expect(fkInput1.getText()).toBe(value);
                    expect(fkInput2.getText()).toBe(value);
                    expect(fkInput3.getText()).toBe(value);

                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it(testParams.uri_col_name, function (done) {
                var colName = testParams.uri_col_name,
                    file = testParams.files[0];

                chaisePage.recordEditPage.getColumnOptionsDropdown(colName).click().then(function () {
                    return chaisePage.recordEditPage.getSelectAll(colName).click();
                }).then(function () {
                    // select (set) file
                    var fileInput = chaisePage.recordEditPage.getSelectAllFileInput(colName),
                        txtInput = chaisePage.recordEditPage.getSelectAllFileInput("txt"+colName);

                    recordEditHelpers.selectFile(file, fileInput, txtInput);

                    return chaisePage.recordEditPage.getSelectAllApply().click();
                }).then(function () {
                    // verify the values
                    expect(uploadInput1.getAttribute('value')).toBe(file.name);
                    expect(uploadInput2.getAttribute('value')).toBe(file.name);
                    expect(uploadInput3.getAttribute('value')).toBe(file.name);

                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
            });
        });

        describe("change values in the forms without affecting the other forms, ", function() {
            //added 2 more forms, should be 3 total
            var textInput1 = chaisePage.recordEditPage.getInputById(0, textDisplayName),
                textInput2 = chaisePage.recordEditPage.getInputById(1, textDisplayName),
                textInput3 = chaisePage.recordEditPage.getInputById(2, textDisplayName);

            var intInput1 = chaisePage.recordEditPage.getInputById(0, intDisplayName),
                intInput2 = chaisePage.recordEditPage.getInputById(1, intDisplayName),
                intInput3 = chaisePage.recordEditPage.getInputById(2, intDisplayName);

            //change value in form 1, test others unchanged
            it("should change text input in form 1.", function() {
                chaisePage.recordEditPage.clearInput(textInput1);
                textInput1.sendKeys(testParams.input_1_text_val);

                expect(textInput1.getAttribute("value")).toBe(testParams.input_1_text_val);
                expect(textInput2.getAttribute("value")).toBe(textVal);
                expect(textInput3.getAttribute("value")).toBe(textVal);
            });

            //change value in form n, test others unchanged
            it("should change int input in form 3.", function() {
                chaisePage.recordEditPage.clearInput(intInput3);
                intInput3.sendKeys(testParams.input_3_int_val);

                expect(intInput1.getAttribute("value")).toBe(intVal);
                expect(intInput2.getAttribute("value")).toBe(intVal);
                expect(intInput3.getAttribute("value")).toBe(testParams.input_3_int_val);
            });

            //change value in n/2, test other sunchanged
            it("should change text input in form 2.", function() {
                chaisePage.recordEditPage.clearInput(textInput2);
                textInput2.sendKeys(testParams.input_2_text_val);

                expect(textInput1.getAttribute("value")).toBe(testParams.input_1_text_val);
                expect(textInput2.getAttribute("value")).toBe(testParams.input_2_text_val);
                expect(textInput3.getAttribute("value")).toBe(textVal);
            });

            it("should clear the date input in form 1 and change the value in form 3.", function () {
                chaisePage.recordEditPage.clearInput(dateInput3.date);
                dateInput3.date.sendKeys(testParams.values.date.modified);

                dateInput1.clearBtn.click().then(function () {
                    expect(dateInput1.date.getAttribute("value")).toBe("");
                    expect(dateInput2.date.getAttribute("value")).toBe(testParams.values.date.initial);
                    expect(dateInput3.date.getAttribute("value")).toBe(testParams.values.date.modified);
                });
            });

            it("should clear the timestamp input in form 2 and change the value in form 3.", function () {
                chaisePage.recordEditPage.clearInput(tsInput3.date);
                tsInput3.date.sendKeys(testParams.values.timestamp.modified.date);

                chaisePage.recordEditPage.clearInput(tsInput3.time);
                tsInput3.time.sendKeys(testParams.values.timestamp.modified.time);

                tsInput2.clearBtn.click().then(function () {
                    expect(tsInput1.date.getAttribute("value")).toBe(testParams.values.timestamp.initial.date);
                    expect(tsInput2.date.getAttribute("value")).toBe("");
                    expect(tsInput3.date.getAttribute("value")).toBe(testParams.values.timestamp.modified.date);

                    expect(tsInput1.time.getAttribute("value")).toBe(testParams.values.timestamp.initial.time);
                    expect(tsInput2.time.getAttribute("value")).toBe("");
                    expect(tsInput3.time.getAttribute("value")).toBe(testParams.values.timestamp.modified.time);
                });
            });

            it("should change fk value in form 1.", function () {
                chaisePage.recordEditPage.getForeignKeyInputButton(testParams.fk_col_name, 0).click().then(function () {
                    // wait for modal rows to load
                    browser.wait(function() {
                        return chaisePage.recordsetPage.getModalRows().count().then(function(ct) {
                            return (ct == 5);
                        });
                    }, browser.params.defaultTimeout);

                    // select value (the third row)
                    return chaisePage.recordsetPage.getRows().get(1).all(by.css(".select-action-button")).click();
                }).then(function () {
                    expect(fkInput1.getText()).toBe(testParams.values.fk.modified);
                    expect(fkInput2.getText()).toBe(testParams.values.fk.initial);
                    expect(fkInput3.getText()).toBe(testParams.values.fk.initial);
                });
            });

            it("should clear the uri value in form 3.", function () {
                var file = testParams.files[0];
                chaisePage.recordEditPage.getForeignKeyInputRemoveBtns().then(function(removeBtns) {
                    return chaisePage.clickButton(removeBtns[5]);
                }).then(function () {
                    expect(uploadInput1.getAttribute('value')).toBe(file.name);
                    expect(uploadInput2.getAttribute('value')).toBe(file.name);
                    expect(uploadInput3.getAttribute('value')).toBe("");
                });
            });
        });

        //test submission
        describe("Submit " + testParams.records + " records", function() {
            beforeAll(function() {
                // Submit the form
                chaisePage.recordEditPage.submitForm();
            });

            it("should change the view to the resultset table and verify the count.", function() {
                // Make sure the table shows up with the expected # of rows
                browser.wait(function() {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return (ct == testParams.records);
                    });
                }, browser.params.defaultTimeout);

                browser.driver.getCurrentUrl().then(function(url) {
                    expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true);

                    return chaisePage.recordsetPage.getRows().count();
                }).then(function(ct) {
                    expect(ct).toBe(testParams.records);
                });
            });

            if (!process.env.TRAVIS && testParams.files.length > 0) {
                afterAll(function(done) {
                    recordEditHelpers.deleteFiles(testParams.files);
                    done();
                });
            }
        });

        describe("for when the user adds the maximum amount of forms, ", function() {
            var EC = protractor.ExpectedConditions,
                multiFormOpenButton = chaisePage.recordEditPage.getMultiFormInputOpenButton(),
                multiFormInput = chaisePage.recordEditPage.getMultiFormInput(),
                multiFormSubmitButton = chaisePage.recordEditPage.getMultiFormInputSubmitButton();

            beforeAll(function () {
                browser.ignoreSynchronization=true;
                browser.refresh();
            });

            it("should show a resultset table with " + (testParams.max_input_rows+1) + " entities.", function() {
                browser.wait(EC.elementToBeClickable(multiFormOpenButton), browser.params.defaultTimeout);

                var intInput = chaisePage.recordEditPage.getInputById(0, "int");
                intInput.sendKeys("1");

                chaisePage.recordEditPage.getMultiFormInputOpenButtonScript().then(function(openBtn) {
                    return chaisePage.clickButton(openBtn);
                }).then(function() {
                    chaisePage.recordEditPage.clearInput(multiFormInput);
                    browser.sleep(10);
                    multiFormInput.sendKeys(testParams.max_input_rows);

                    return chaisePage.recordEditPage.getMultiFormInputSubmitButtonScript();
                }).then(function(submitBtn) {
                    return chaisePage.clickButton(submitBtn);
                }).then(function() {
                    // wait for dom to finish rendering the forms
                    browser.wait(function() {
                        return chaisePage.recordEditPage.getForms().count().then(function(ct) {
                            return (ct == testParams.max_input_rows+1);
                        });
                    }, browser.params.defaultTimeout);

                    chaisePage.recordEditPage.submitForm();

                    return browser.driver.getCurrentUrl();
                }).then(function(url) {
                    expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true);

                    // so DOM can render table
                    browser.wait(function() {
                        return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                            return (ct == testParams.max_input_rows+1);
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.recordsetPage.getRows().count();
                }).then(function(ct) {
                    expect(ct).toBe(testParams.max_input_rows+1);
                });
            });
        });
    });
});
