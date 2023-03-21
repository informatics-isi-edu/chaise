var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var moment = require('moment');
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
    int_array_col_name: "int_array",
    files: [{
        name: "file500kb.png",
        size: "512000",
        displaySize: "500 kB",
        path: "file500kb.png",
        tooltip:"- file500kb.png\n- 500 kB"
    }],
    values: {
        date: {
            initial: "10-09-2018",
            modified: "06-05-2017"
        },
        timestamp: {
            initial: {
                date: "10-10-2018",
                time: "10:48:02AM"
            },
            modified: {
                date: "06-05-2017",
                time: "01:22:39AM"
            }
        },
        fk: {
            initial: "three",
            modified: "two"
        },
        int_array: {
            initial: "[1, 2]",
            modified: "[3, 4]"
        }
    }
};

describe('Record Add', function() {

    describe("for when the user adds multiple forms using the multi form input control, ", function() {
        var EC = protractor.ExpectedConditions,
            multiFormInput = chaisePage.recordEditPage.getMultiFormInput(),
            multiFormSubmitButton = chaisePage.recordEditPage.getMultiFormInputSubmitButton(),
            intVal = testParams.initial_int_val,
            textVal = testParams.initial_text_val,
            intDisplayName = "int",
            textDisplayName = "text";

        var dateInput1 = chaisePage.recordEditPage.getDateInputsForAColumn(testParams.date_col_name, 1),
            dateInput2 = chaisePage.recordEditPage.getDateInputsForAColumn(testParams.date_col_name, 2),
            dateInput3 = chaisePage.recordEditPage.getDateInputsForAColumn(testParams.date_col_name, 3);

        var tsInput1 = chaisePage.recordEditPage.getTimestampInputsForAColumn(testParams.timestamp_col_name, 1),
            tsInput2 = chaisePage.recordEditPage.getTimestampInputsForAColumn(testParams.timestamp_col_name, 2),
            tsInput3 = chaisePage.recordEditPage.getTimestampInputsForAColumn(testParams.timestamp_col_name, 3);

        var fkInput1 = chaisePage.recordEditPage.getForeignKeyInputDisplay(testParams.fk_col_name, 1),
            fkInput2 = chaisePage.recordEditPage.getForeignKeyInputDisplay(testParams.fk_col_name, 2),
            fkInput3 = chaisePage.recordEditPage.getForeignKeyInputDisplay(testParams.fk_col_name, 3);

        var uploadInput1 = chaisePage.recordEditPage.getTextFileInputForAColumn(testParams.uri_col_name, 1),
            uploadInput2 = chaisePage.recordEditPage.getTextFileInputForAColumn(testParams.uri_col_name, 2),
            uploadInput3 = chaisePage.recordEditPage.getTextFileInputForAColumn(testParams.uri_col_name, 3);

        var intArrInput1 = chaisePage.recordEditPage.getTextAreaForAcolumn(testParams.int_array_col_name, 1),
            intArrInput2 = chaisePage.recordEditPage.getTextAreaForAcolumn(testParams.int_array_col_name, 2),
            intArrInput3 = chaisePage.recordEditPage.getTextAreaForAcolumn(testParams.int_array_col_name, 3);

        var index;

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-add:" + testParams.table_name);
            chaisePage.recordeditPageReady();
        });

        it("should be displayed", function() {
            expect(multiFormInput.isDisplayed()).toBeTruthy();
        });

        it("should alert the user when they try to add more forms than the limit of " + testParams.max_input_rows + " allows.", function() {
            var numberGreaterThanMax = 300,
                errorMessage = "Cannot add " + numberGreaterThanMax + " records. Please input a value between 1 and 200, inclusive.";


            chaisePage.recordEditPage.clearInput(multiFormInput);
            browser.sleep(10);
            multiFormInput.sendKeys(numberGreaterThanMax);

            chaisePage.clickButton(multiFormSubmitButton).then(function() {
                return chaisePage.recordEditPage.getAlertError();
            }).then(function(err) {
                return err.getText();
            }).then(function(text) {
                expect(text.indexOf(errorMessage)).toBeGreaterThan(-1);
            });
        });

        it("should fill in the first form then add " + (testParams.records-1) + " more forms.", function() {
            index = 1;
            intInput = chaisePage.recordEditPage.getInputForAColumn(intDisplayName, index);
            textInput = chaisePage.recordEditPage.getInputForAColumn(textDisplayName, index);

            intInput.sendKeys(intVal);
            textInput.sendKeys(textVal);

            chaisePage.recordEditPage.clearInput(multiFormInput);
            browser.sleep(10);
            multiFormInput.sendKeys(testParams.records-1);

            chaisePage.clickButton(multiFormSubmitButton).then(function() {
                return chaisePage.recordEditPage.getRecordeditForms();
            }).then(function(rows) {
                expect(rows.length).toBe(testParams.records);
            });
        });

        describe("set the value for all forms at once for:", function () {

            if (!process.env.CI && testParams.files.length > 0) {
                beforeAll(function(done) {
                    // create files that will be uploaded
                    recordEditHelpers.createFiles(testParams.files);
                    done();
                });
            }

            it(testParams.date_col_name, function (done) {
                var colName = testParams.date_col_name;
                var value = testParams.values.date.initial;

                var applyBtn = chaisePage.recordEditPage.getSelectAllApply(colName),
                    cancelBtn = chaisePage.recordEditPage.getSelectAllCancel(colName);

                chaisePage.clickButton(chaisePage.recordEditPage.getColumnSelectAllButton(colName)).then(function () {
                    browser.wait(EC.elementToBeClickable(cancelBtn), browser.params.defaultTimeout);

                    chaisePage.recordEditPage.getSelectAllDate(colName).sendKeys(value);

                    return applyBtn.click();
                }).then(function () {
                    return cancelBtn.click();
                }).then(function () {
                    const momentValue = moment(value, 'MM-DD-YYYY').format('YYYY-MM-DD');
                    // verify the values
                    expect(dateInput1.date.getAttribute("value")).toBe(momentValue);
                    expect(dateInput2.date.getAttribute("value")).toBe(momentValue);
                    expect(dateInput3.date.getAttribute("value")).toBe(momentValue);

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

                var applyBtn = chaisePage.recordEditPage.getSelectAllApply(colName),
                    cancelBtn = chaisePage.recordEditPage.getSelectAllCancel(colName);

                chaisePage.clickButton(chaisePage.recordEditPage.getColumnSelectAllButton(colName)).then(function () {
                    browser.wait(EC.elementToBeClickable(cancelBtn), browser.params.defaultTimeout);

                    chaisePage.recordEditPage.getSelectAllTimestampDate(colName).sendKeys(dateValue);
                    chaisePage.recordEditPage.getSelectAllTimestampTime(colName).sendKeys(timeValue);

                    return applyBtn.click();
                }).then(function () {
                    return cancelBtn.click();
                }).then(function () {
                    const dateMomentValue = moment(dateValue, 'MM-DD-YYYY').format('YYYY-MM-DD');
                    // verify the values
                    expect(tsInput1.date.getAttribute("value")).toBe(dateMomentValue);
                    expect(tsInput2.date.getAttribute("value")).toBe(dateMomentValue);
                    expect(tsInput3.date.getAttribute("value")).toBe(dateMomentValue);
                    
                    const timeMomentValue = moment(timeValue, 'hh:mm:ssA').format('hh:mm:ss');
                    expect(tsInput1.time.getAttribute("value")).toBe(timeMomentValue);
                    expect(tsInput2.time.getAttribute("value")).toBe(timeMomentValue);
                    expect(tsInput3.time.getAttribute("value")).toBe(timeMomentValue);

                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it(testParams.fk_col_name, function (done) {
                var colName = testParams.fk_col_name;
                var value = testParams.values.fk.initial;

                var applyBtn = chaisePage.recordEditPage.getSelectAllApply(colName),
                    cancelBtn = chaisePage.recordEditPage.getSelectAllCancel(colName);

                chaisePage.clickButton(chaisePage.recordEditPage.getColumnSelectAllButton(colName)).then(function () {
                    browser.wait(EC.elementToBeClickable(cancelBtn), browser.params.defaultTimeout);

                    // open fk modal
                    return chaisePage.recordEditPage.getSelectAllPopupBtn(colName).click();
                }).then(function () {
                    // wait for modal rows to load
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getRecordSetTable()), browser.params.defaultTimeout);
                    browser.wait(function() {
                        return chaisePage.recordsetPage.getModalRows().count().then(function(ct) {
                            return (ct == 5);
                        });
                    }, browser.params.defaultTimeout);
                    
                    var displayingText = "Displaying all\n5\nof 5 records";
                        displayingTextError = "The total count display in the foreign key popup is incorrect";

                    expect(chaisePage.recordsetPage.getTotalCount().getText()).toBe(displayingText, displayingTextError);

                    // select value (the third row)
                    return chaisePage.recordsetPage.getRows().get(2).all(by.css(".select-action-button")).click();
                }).then(function () {
                    // wait for modal to close
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getEntityTitleElement()), browser.params.defaultTimeout);

                    return applyBtn.click();
                }).then(function () {
                    return cancelBtn.click();
                }).then(function () {
                    // verify the values
                    expect(fkInput1.getText()).toBe(value);
                    expect(fkInput2.getText()).toBe(value);
                    expect(fkInput3.getText()).toBe(value);

                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            it(testParams.int_array_col_name, function (done) {
                var colName = testParams.int_array_col_name;
                var value = testParams.values.int_array.initial;

                var applyBtn = chaisePage.recordEditPage.getSelectAllApply(colName),
                    cancelBtn = chaisePage.recordEditPage.getSelectAllCancel(colName);

                chaisePage.clickButton(chaisePage.recordEditPage.getColumnSelectAllButton(colName)).then(function () {
                    browser.wait(EC.elementToBeClickable(cancelBtn), browser.params.defaultTimeout);

                    chaisePage.recordEditPage.getSelectAllTextArea(colName).sendKeys(value);

                    return applyBtn.click();
                }).then(function () {
                    return cancelBtn.click();
                }).then(function () {
                    // verify the values
                    expect(intArrInput1.getAttribute("value")).toBe(value, "input 1 missmatch.");
                    expect(intArrInput2.getAttribute("value")).toBe(value, "input 2 missmatch.");
                    expect(intArrInput3.getAttribute("value")).toBe(value, "input 3 missmatch.");

                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            if (!process.env.CI && testParams.files.length > 0) {
                it(testParams.uri_col_name, function (done) {
                    var colName = testParams.uri_col_name,
                        file = testParams.files[0];

                    var applyBtn = chaisePage.recordEditPage.getSelectAllApply(colName),
                        cancelBtn = chaisePage.recordEditPage.getSelectAllCancel(colName);

                    chaisePage.clickButton(chaisePage.recordEditPage.getColumnSelectAllButton(colName)).then(function () {
                        browser.wait(EC.elementToBeClickable(cancelBtn), browser.params.defaultTimeout);

                        // select (set) file
                        var fileInput = chaisePage.recordEditPage.getSelectAllFileInput(colName),
                            txtInput = chaisePage.recordEditPage.getSelectAllTextFileInput(colName);

                        recordEditHelpers.selectFile(file, fileInput, txtInput);

                        return applyBtn.click();
                    }).then(function () {
                        return cancelBtn.click();
                    }).then(function () {
                        // verify the values
                        expect(uploadInput1.getText()).toBe(file.name);
                        expect(uploadInput2.getText()).toBe(file.name);
                        expect(uploadInput3.getText()).toBe(file.name);

                        done();
                    }).catch(function (err) {
                        console.dir(err);
                        done.fail();
                    });
                });
            }
        });

        describe("change values in the forms without affecting the other forms, ", function() {
            //added 2 more forms, should be 3 total
            var textInput1 = chaisePage.recordEditPage.getInputForAColumn(textDisplayName, 1),
                textInput2 = chaisePage.recordEditPage.getInputForAColumn(textDisplayName, 2),
                textInput3 = chaisePage.recordEditPage.getInputForAColumn(textDisplayName, 3);

            var intInput1 = chaisePage.recordEditPage.getInputForAColumn(intDisplayName, 1),
                intInput2 = chaisePage.recordEditPage.getInputForAColumn(intDisplayName, 2),
                intInput3 = chaisePage.recordEditPage.getInputForAColumn(intDisplayName, 3);

            var intArrInput1 = chaisePage.recordEditPage.getTextAreaForAcolumn(testParams.int_array_col_name, 1),
                intArrInput2 = chaisePage.recordEditPage.getTextAreaForAcolumn(testParams.int_array_col_name, 2),
                intArrInput3 = chaisePage.recordEditPage.getTextAreaForAcolumn(testParams.int_array_col_name, 3);

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

                // get clear btn for dateinput1
                chaisePage.recordEditPage.getRemoveButton(testParams.date_col_name, 1, 'remove-input-btn').click().then(function () {
                    expect(dateInput1.date.getAttribute("value")).toBe("");
                    const input2DateMomentValue = moment(testParams.values.date.initial, 'MM-DD-YYYY').format('YYYY-MM-DD');
                    expect(dateInput2.date.getAttribute("value")).toBe(input2DateMomentValue);
                    const input3DateMomentValue = moment(testParams.values.date.modified, 'MM-DD-YYYY').format('YYYY-MM-DD');
                    expect(dateInput3.date.getAttribute("value")).toBe(input3DateMomentValue);
                });
            });

            it("should clear the timestamp input in form 2 and change the value in form 3.", function () {
                chaisePage.recordEditPage.clearInput(tsInput3.date);
                tsInput3.date.sendKeys(testParams.values.timestamp.modified.date);

                chaisePage.recordEditPage.clearInput(tsInput3.time);
                tsInput3.time.sendKeys(testParams.values.timestamp.modified.time);

                tsInput2RemoveBtns = chaisePage.recordEditPage.getTimestampRemoveButtons(testParams.timestamp_col_name, 2);

                tsInput2RemoveBtns.date.click().then(() => {
                    return tsInput2RemoveBtns.time.click();
                }).then(() => {
                    const input1DateMomentValue = moment(testParams.values.timestamp.initial.date, 'MM-DD-YYYY').format('YYYY-MM-DD');
                    expect(tsInput1.date.getAttribute("value")).toBe(input1DateMomentValue);
                    expect(tsInput2.date.getAttribute("value")).toBe("");
                    const input3DateMomentValue = moment(testParams.values.timestamp.modified.date, 'MM-DD-YYYY').format('YYYY-MM-DD');
                    expect(tsInput3.date.getAttribute("value")).toBe(input3DateMomentValue);

                    const input1TimeMomentValue = moment(testParams.values.timestamp.initial.time, 'hh:mm:ssA').format('hh:mm:ss');
                    expect(tsInput1.time.getAttribute("value")).toBe(input1TimeMomentValue);
                    expect(tsInput2.time.getAttribute("value")).toBe("");
                    const input3TimeMomentValue = moment(testParams.values.timestamp.modified.time, 'hh:mm:ssA').format('hh:mm:ss');
                    expect(tsInput3.time.getAttribute("value")).toBe(input3TimeMomentValue);
                });
            });

            it("should change fk value in form 1.", function () {
                // chaisePage.recordEditPage.getForeignKeyInputButton(testParams.fk_col_name, 0).click().then(function () {
                chaisePage.recordEditPage.getModalPopupBtns().then((btns) => {
                    return btns[0].click()
                }).then(() => {
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

            it("should change int_array value in form 2.", function () {
                chaisePage.recordEditPage.clearInput(intArrInput2);
                intArrInput2.sendKeys(testParams.values.int_array.modified);

                expect(intArrInput1.getAttribute("value")).toBe(testParams.values.int_array.initial, "input 1 missmatch.");
                expect(intArrInput2.getAttribute("value")).toBe(testParams.values.int_array.modified, "input 2 missmatch.");
                expect(intArrInput3.getAttribute("value")).toBe(testParams.values.int_array.initial, "input 3 missmatch.");
            });

            if (!process.env.CI && testParams.files.length > 0) {
                it("should clear the uri value in form 3.", function () {
                    var file = testParams.files[0];
                    chaisePage.recordEditPage.getRemoveButton(testParams.uri_col_name, 3, 'remove-input-btn').click().then(() => {
                        expect(uploadInput1.getText()).toBe(file.name);
                        expect(uploadInput2.getText()).toBe(file.name);
                        expect(uploadInput3.getText()).toBe("");
                    });
                });
            }
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

            if (!process.env.CI && testParams.files.length > 0) {
                afterAll(function(done) {
                    recordEditHelpers.deleteFiles(testParams.files);
                    done();
                });
            }
        });

        describe("for when the user adds the maximum amount of forms, ", function() {
            var EC = protractor.ExpectedConditions,
                multiFormInput = chaisePage.recordEditPage.getMultiFormInput(),
                multiFormSubmitButton = chaisePage.recordEditPage.getMultiFormInputSubmitButton();

            beforeAll(function () {
                browser.ignoreSynchronization=true;
                browser.refresh();
                chaisePage.recordeditPageReady();
            });

            it("should show a resultset table with " + (testParams.max_input_rows+1) + " entities.", function() {

                var intInput = chaisePage.recordEditPage.getInputForAColumn('int', 1);
                intInput.sendKeys("1").then(function () {
                    return chaisePage.recordEditPage.clearInput(multiFormInput);
                }).then(function () {
                    browser.sleep(10);

                    return multiFormInput.sendKeys(testParams.max_input_rows);
                }).then(function () {
                    return chaisePage.clickButton(multiFormSubmitButton);
                }).then(function() {
                    // wait for dom to finish rendering the forms
                    return browser.wait(function() {
                        return chaisePage.recordEditPage.getRecordeditForms().count().then(function(ct) {
                            return (ct == testParams.max_input_rows+1);
                        });
                    }, browser.params.defaultTimeout);
                }).then(function () {

                    return chaisePage.recordEditPage.submitForm();
                }).then(function () {
                    return browser.driver.getCurrentUrl();
                }).then(function(url) {
                    expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true);

                    // so DOM can render table
                    return browser.wait(function() {
                        return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                            return (ct == testParams.max_input_rows+1);
                        });
                    }, browser.params.defaultTimeout);
                }).then(function () {
                    return chaisePage.recordsetPage.getRows().count();
                }).then(function(ct) {
                    expect(ct).toBe(testParams.max_input_rows+1);
                });
            });
        });
    });
});
