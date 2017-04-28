var chaisePage = require('../../../../utils/chaise.page.js');
var recordEditHelpers = require('../../helpers.js');

describe('Edit existing record,', function() {

	var testConfiguration = browser.params.configuration.tests,
        testParams = testConfiguration.params.multi_edit,
        intDisplayName = testParams.int_column_name,
        textDisplayName = testParams.text_column_name;

    // database values before changes
    var intInput1DefaultVal = "7",
        textInput1DefaultVal = "test text",
        intInput2DefaultVal = "12",
        textInput2DefaultVal = "description",
        intInput3DefaultVal = "34",
        textInput3DefaultVal = "just text";

    // changes to values for case of 2 forms
    var intInput1FirstVal = "4",
        textInput1FirstVal = "modified val",
        intInput2FirstVal = "66",
        textInput2FirstVal = "decription 2";

    // changes to values for case of 3 forms
    var intInput1SecondVal = "5",
        textInput1SecondVal = "changed it again",
        intInput2SecondVal = "768",
        textInput2SecondVal = "decription 3";
        intInput3FirstVal = "934",
        textInput3FirstVal = "I am number 3";

    describe("when the user edits " + testParams.keys_2.length + " records at a time, ", function() {

        beforeAll(function () {
            var keys = [];
            testParams.keys_2.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            browser.ignoreSynchronization = true;
            browser.get(browser.params.url + ":" + testParams.table_name + "/" + keys.join(";"));
        });

        it("should have the table displayname as part of the entity title.", function() {
            // if submit button is visible, this means the recordedit page has loaded
            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                expect(chaisePage.recordEditPage.getEntityTitleElement().getText()).toBe("Edit multi-add-table Records")
            });
        });

        it("should change their values and show a resultset table with 2 entities.", function() {
            var intInput1 = chaisePage.recordEditPage.getInputById(0, intDisplayName),
                intInput2 = chaisePage.recordEditPage.getInputById(1, intDisplayName),
                textInput1 = chaisePage.recordEditPage.getInputById(0, textDisplayName),
                textInput2 = chaisePage.recordEditPage.getInputById(1, textDisplayName);

            // modify first form
            // check value before that it loaded correctly
            expect(intInput1.getAttribute("value")).toBe(intInput1DefaultVal);
            chaisePage.recordEditPage.clearInput(intInput1);
            browser.sleep(10);
            intInput1.sendKeys(intInput1FirstVal);
            // check value after it was changed
            expect(intInput1.getAttribute("value")).toBe(intInput1FirstVal);

            expect(textInput1.getAttribute("value")).toBe(textInput1DefaultVal);
            chaisePage.recordEditPage.clearInput(textInput1);
            browser.sleep(10);
            textInput1.sendKeys(textInput1FirstVal);
            expect(textInput1.getAttribute("value")).toBe(textInput1FirstVal);

            // modify second form
            expect(intInput2.getAttribute("value")).toBe(intInput2DefaultVal);
            chaisePage.recordEditPage.clearInput(intInput2);
            browser.sleep(10);
            intInput2.sendKeys(intInput2FirstVal);
            expect(intInput2.getAttribute("value")).toBe(intInput2FirstVal);

            expect(textInput2.getAttribute("value")).toBe(textInput2DefaultVal);
            chaisePage.recordEditPage.clearInput(textInput2);
            browser.sleep(10);
            textInput2.sendKeys(textInput2FirstVal);
            expect(textInput2.getAttribute("value")).toBe(textInput2FirstVal);
        });

        describe("Submit " + testParams.keys_2.length + " records", function() {
            beforeAll(function() {
                // submit form
                chaisePage.recordEditPage.submitForm();
            });

            it("should change the view to the resultset table and verify the count.", function() {
                // Make sure the table shows up with the expected # of rows
                browser.wait(function() {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return (ct == testParams.keys_2.length);
                    });
                }, browser.params.defaultTimeout);

                browser.driver.getCurrentUrl().then(function(url) {
                    expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true);

                    return chaisePage.recordsetPage.getRows().count();
                }).then(function(ct) {
                    expect(ct).toBe(testParams.keys_2.length);
                });
            });
        });
    });

    describe("when the user edits " + testParams.keys_3.length + " records at a time, ", function() {

        beforeAll(function () {
            var keys = [];
            testParams.keys_3.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            browser.ignoreSynchronization = true;
            browser.get(browser.params.url + ":" + testParams.table_name + "/" + keys.join(";"));
        });

        it("should change their values and show a resultset table with 3 entities.", function() {
            var intInput1 = chaisePage.recordEditPage.getInputById(0, intDisplayName),
                intInput2 = chaisePage.recordEditPage.getInputById(1, intDisplayName),
                intInput3 = chaisePage.recordEditPage.getInputById(2, intDisplayName),
                textInput1 = chaisePage.recordEditPage.getInputById(0, textDisplayName),
                textInput2 = chaisePage.recordEditPage.getInputById(1, textDisplayName),
                textInput3 = chaisePage.recordEditPage.getInputById(2, textDisplayName);

            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {

                // modify first form
                expect(intInput1.getAttribute("value")).toBe(intInput1FirstVal);
                chaisePage.recordEditPage.clearInput(intInput1);
                browser.sleep(10);
                intInput1.sendKeys(intInput1SecondVal);
                expect(intInput1.getAttribute("value")).toBe(intInput1SecondVal);

                expect(textInput1.getAttribute("value")).toBe(textInput1FirstVal);
                chaisePage.recordEditPage.clearInput(textInput1);
                browser.sleep(10);
                textInput1.sendKeys(textInput1SecondVal);
                expect(textInput1.getAttribute("value")).toBe(textInput1SecondVal);

                // modify second form
                expect(intInput2.getAttribute("value")).toBe(intInput2FirstVal);
                chaisePage.recordEditPage.clearInput(intInput2);
                browser.sleep(10);
                intInput2.sendKeys(intInput2SecondVal);
                expect(intInput2.getAttribute("value")).toBe(intInput2SecondVal);

                expect(textInput2.getAttribute("value")).toBe(textInput2FirstVal);
                chaisePage.recordEditPage.clearInput(textInput2);
                browser.sleep(10);
                textInput2.sendKeys(textInput2SecondVal);
                expect(textInput2.getAttribute("value")).toBe(textInput2SecondVal);

                // modify third form
                expect(intInput3.getAttribute("value")).toBe(intInput3DefaultVal);
                chaisePage.recordEditPage.clearInput(intInput3);
                browser.sleep(10);
                intInput3.sendKeys(intInput3FirstVal);
                expect(intInput3.getAttribute("value")).toBe(intInput3FirstVal);

                expect(textInput3.getAttribute("value")).toBe(textInput3DefaultVal);
                chaisePage.recordEditPage.clearInput(textInput3);
                browser.sleep(10);
                textInput3.sendKeys(textInput3FirstVal);
                expect(textInput3.getAttribute("value")).toBe(textInput3FirstVal);
            });
        });

        describe("Submit " + testParams.keys_3.length + " records", function() {
            beforeAll(function() {
                // submit form
                chaisePage.recordEditPage.submitForm();
            });

            it("should change the view to the resultset table and verify the count.", function() {
                // Make sure the table shows up with the expected # of rows
                browser.wait(function() {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return (ct == testParams.keys_3.length);
                    });
                }, browser.params.defaultTimeout);

                browser.driver.getCurrentUrl().then(function(url) {
                    expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true);

                    return chaisePage.recordsetPage.getRows().count();
                }).then(function(ct) {
                    expect(ct).toBe(testParams.keys_3.length);
                });
            });
        });
    });
});
