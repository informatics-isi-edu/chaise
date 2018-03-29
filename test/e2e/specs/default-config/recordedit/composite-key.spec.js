var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var testParams = {
    table_name: "accommodation",
    column_names: ["first_name", "last_name", "sIfIZTdKhErJ9HC3xhuSbA"],
    column_values: {
        first_name: "John",
        last_name: "Doe",
        "sIfIZTdKhErJ9HC3xhuSbA": "John Doe" // person foreignkey column
    }
};

describe('Add a record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        var record;

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/product-person:" + testParams.table_name);
        });

        describe("Presentation and validation for an entity with a composite key,", function() {

            var rows;

            it("the composite key should be filled in.", function(done) {
                var EC = protractor.ExpectedConditions;
                var modalTitle = chaisePage.recordEditPage.getModalTitle();

                // make sure recordedit is loaded
                chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {

                    return chaisePage.recordEditPage.getModalPopupBtnsUsingScript();
                }).then(function(popupBtns) {

                    return chaisePage.clickButton(popupBtns[3]);
                }).then(function() {
                    // wait for the modal to open
                    browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                    return modalTitle.getText();
                }).then(function(text) {
                    // make sure modal opened
                    expect(text.indexOf("Choose")).toBeGreaterThan(-1);

                    rows = chaisePage.recordsetPage.getRows();
                    // count is needed for clicking a random row
                    return rows.count();
                }).then(function(ct) {
                    expect(ct).toBe(3);
                    browser.pause();

                    return rows.get(0).all(by.css(".select-action-button"));
                }).then(function(selectButtons) {
                    return selectButtons[0].click();
                }).then(function() {
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getFormTitle()), browser.params.defaultTimeout);

                    var foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputDisplay("Person", 0);
                    expect(foreignKeyInput.getText()).toBe(testParams.column_values["sIfIZTdKhErJ9HC3xhuSbA"], "Foreign Key input display value is incorrect");
                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });
        });

        describe("Submit record", function() {
            beforeAll(function() {
                // Submit the form
                chaisePage.recordEditPage.submitForm();
            });

            var hasErrors = false;

            it("should have no errors, and should be redirected", function() {
                chaisePage.recordEditPage.getAlertError().then(function(err) {
                    if (err) {
                        expect("Page has errors").toBe("No errors");
                        hasErrors = true;
                    } else {
                        expect(true).toBe(true);
                    }
                });
            });

            it("should be redirected to record page with correct values.", function() {
                if (!hasErrors) {

                    // After submitting 1 record in RecordEdit, the expected record
                    // page url will have a id of 1 because it'll always be the first
                    // row of this table in the new catalog created by this set of composite key tests.
                    var redirectUrl = browser.params.url + "/record/#" + browser.params.catalogId + "/product-person:" + testParams.table_name + '/id=1';

                    chaisePage.waitForUrl(redirectUrl, browser.params.defaultTimeout).then(function() {
                        expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
                        recordEditHelpers.testRecordAppValuesAfterSubmission(testParams.column_names, testParams.column_values);
                    }, function() {
                        console.log("          Timed out while waiting for the url to be the new one");
                        expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
                    });
                }
            });
        });

    });
});
