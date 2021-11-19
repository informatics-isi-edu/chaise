var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var testParams = {
    table_name: "accommodation",
    column_names: ["luxurious", "first_name", "last_name", "index", "0YGNuO_bvxoczJ6ms2k0tQ"],
    column_values: {
        luxurious: "Luxurious",
        first_name: "John",
        last_name: "Doe",
        index: "0",
        "0YGNuO_bvxoczJ6ms2k0tQ": "John Doe" // person foreignkey column
    },
    booleanOptions: ["Luxurious", "Not Luxurious"]
};

describe('Edit a record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        var record;

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/product-person:" + testParams.table_name);
        });

        describe("Presentation and validation for an entity with a composite key and formatted boolean,", function() {

            var rows;

            it("the composite key should be filled in.", function(done) {
                var EC = protractor.ExpectedConditions;
                var modalTitle = chaisePage.recordEditPage.getModalTitle();

                // make sure recordedit is loaded
                chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {

                    return chaisePage.clickButton(chaisePage.recordEditPage.getForeignKeyInputButton("Person", 0));
                }).then(function() {
                    // wait for the modal to open
                    browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                    return modalTitle.getText();
                }).then(function(text) {
                    // make sure modal opened
                    expect(text.indexOf("Select")).toBeGreaterThan(-1);
                    browser.wait(function() {
                        return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                            return (ct == 3);
                        });
                    }, browser.params.defaultTimeout);

                    rows = chaisePage.recordsetPage.getRows();
                    // count is needed for clicking a random row
                    return rows.count();
                }).then(function(ct) {
                    expect(ct).toBe(3);

                    return rows.get(0).all(by.css(".select-action-button"));
                }).then(function(selectButtons) {
                    return selectButtons[0].click();
                }).then(function() {
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getEntityTitleElement()), browser.params.defaultTimeout);

                    var foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputDisplay("Person", 0);
                    expect(foreignKeyInput.getText()).toBe(testParams.column_values["0YGNuO_bvxoczJ6ms2k0tQ"], "Foreign Key input display value is incorrect");
                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });

            it("should show 'Luxurious' and 'Not Luxurious' as the options in the boolean dropdown menu", function (done) {
                var trueOption = testParams.booleanOptions[0],
                    dropdown;

                chaisePage.recordEditPage.getDropdowns().then(function(el) {
                    dropdown = el[0];

                    return chaisePage.recordEditPage.getRelativeDropdownOptionsATag(dropdown);
                }).then(function (options) {
                    options.forEach(function (opt, idx) {
                        expect(opt.getAttribute("innerHTML")).toBe(testParams.booleanOptions[idx], "Boolean option text with idx: " + idx + " is incorrect");
                    });

                    return chaisePage.recordEditPage.selectDropdownValue(dropdown, trueOption);
                }).then(function(option) {
                    expect(chaisePage.recordEditPage.getDropdownText(dropdown).getText()).toBe(trueOption, "The truthy option was not selected");

                    done();
                }).catch(function (error) {
                    console.dir(error);
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
                    var redirectUrl = browser.params.url + "/record/#" + browser.params.catalogId + "/product-person:" + testParams.table_name + "/RID=";

                    browser.wait(function () {
                        return browser.driver.getCurrentUrl().then(function(url) {
                            return url.startsWith(redirectUrl);
                        });
                    });

                    expect(browser.driver.getCurrentUrl()).toContain(redirectUrl);
                    recordEditHelpers.testRecordAppValuesAfterSubmission(testParams.column_names, testParams.column_values, testParams.column_names.length+5); // +5 for system columns
                }
            });
        });

    });
});
