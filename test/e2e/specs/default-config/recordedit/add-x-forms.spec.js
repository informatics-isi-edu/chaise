var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    table_name: "multi-add-table",
    records: 3,
    max_input_rows: 200,
    initial_int_val: "1",
    initial_text_val: "a",
    input_1_text_val: "asdfg",
    input_2_text_val: "qwerty",
    input_3_int_val: "17"
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
            })
        });
    });
});
