var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var testParams = {
    table_name: "multi-edit-table"
};

describe('Edit a record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        var record;

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/multi-edit:" + testParams.table_name);
        });


        var rows;

        it("remove 2 forms and edit some of the data", function(done) {
            // var EC = protractor.ExpectedConditions;
            // var modalTitle = chaisePage.recordEditPage.getModalTitle();
            //
            // // make sure recordedit is loaded
            // chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
            //
            //     return chaisePage.recordEditPage.getModalPopupBtnsUsingScript();
            // }).then(function(popupBtns) {
            //
            //     return chaisePage.clickButton(popupBtns[3]);
            // }).then(function() {
            //     // wait for the modal to open
            //     browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
            //
            //     return modalTitle.getText();
            // }).then(function(text) {
            //     // make sure modal opened
            //     expect(text.indexOf("Choose")).toBeGreaterThan(-1);
            //
            //     rows = chaisePage.recordsetPage.getRows();
            //     // count is needed for clicking a random row
            //     return rows.count();
            // }).then(function(ct) {
            //     expect(ct).toBe(3);
            //
            //     return rows.get(0).all(by.css(".select-action-button"));
            // }).then(function(selectButtons) {
            //     return selectButtons[0].click();
            // }).then(function() {
            //     browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getFormTitle()), browser.params.defaultTimeout);
            //
            //     var foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputDisplay("Person", 0);
            //     expect(foreignKeyInput.getText()).toBe(testParams.column_values["sIfIZTdKhErJ9HC3xhuSbA"], "Foreign Key input display value is incorrect");
            //     done();
            // }).catch(function (err) {
            //     console.log(err);
            //     done.fail();
            // });
        });

        describe("Submit record", function() {
            beforeAll(function() {
                // Submit the form
                chaisePage.recordEditPage.submitForm();

                browser.wait(function() {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return (ct == tableParams.keys.length);
                    });
                }, browser.params.defaultTimeout);
            });


            it("should change the view to the resultset table.", function() {
                browser.driver.getCurrentUrl().then(function(url) {
                    expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true);
                });
            });

            it("should have the correct table rows.", function() {
                // if (!hasErrors) {
                //     var redirectUrl = browser.params.url + "/record/#" + browser.params.catalogId + "/product-person:" + testParams.table_name + "/RID=";
                //
                //     browser.wait(function () {
                //         return browser.driver.getCurrentUrl().then(function(url) {
                //             return url.startsWith(redirectUrl);
                //         });
                //     });
                //
                //     expect(browser.driver.getCurrentUrl()).toContain(redirectUrl);
                //     recordEditHelpers.testRecordAppValuesAfterSubmission(testParams.column_names, testParams.column_values);
                // }
            });
        });

    });
});
