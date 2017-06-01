var chaisePage = require("../../../utils/chaise.page.js");
var testParams = {
    table_name: "main-entity-table"
};

describe("Add a record,", function() {

    var EC = protractor.ExpectedConditions,
        sleepTimer = 200;

    describe("For table " + testParams.table_name + ',', function() {

        beforeAll(function() {
            browser.ignoreSynchronization = true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/fk-filter-pattern:" + testParams.table_name);
        });

        describe("The domain filter pattern annotation should limit foreign key search sets,", function() {

            var rows, modalTitle,
                multiColName = "multi_constrained_col";

            beforeEach(function () {
                modalTitle = chaisePage.recordEditPage.getModalTitle();
            });

            it("with a domain filter with a static value.", function() {
                var colName = "position_fixed_col";

                chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                    return chaisePage.recordEditPage.getForeignKeyInputButton(colName, 0).click();
                }).then(function () {
                    browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                    return modalTitle.getText();
                }).then(function(text) {
                    expect(text.indexOf("Choose")).toBeGreaterThan(-1);

                    rows = chaisePage.recordsetPage.getRows();

                    return rows.count();
                }).then(function(ct) {
                    // set is size 7, verifies set is limited by existing domain filter pattern
                    expect(ct).toBe(3);

                    return rows.get(1).all(by.css(".select-action-button"));
                }).then(function(selectButtons) {
                    selectButtons[0].click();
                    browser.sleep(sleepTimer);
                });
            });

            it("should not limit the fk set before setting either values for multi constrained fk.", function() {
                chaisePage.recordEditPage.getForeignKeyInputButton(multiColName, 0).click().then(function () {
                    browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                    return modalTitle.getText();
                }).then(function(text) {
                    expect(text.indexOf("Choose")).toBeGreaterThan(-1);

                    rows = chaisePage.recordsetPage.getRows();

                    return rows.count();
                }).then(function(ct) {
                    // set is size 7, domain filter should have evaluated to null
                    expect(ct).toBe(7);

                    chaisePage.recordEditPage.getModalCloseBtn().click();
                    browser.sleep(sleepTimer);
                });
            });

            describe("with a domain filter with a dynamic value from a text entry box", function() {
                var fkColName = "position_fk_col"

                it("that isn't set should have the full set.", function() {
                    chaisePage.recordEditPage.getForeignKeyInputButton(fkColName, 0).click().then(function () {
                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                        return modalTitle.getText();
                    }).then(function(text) {
                        expect(text.indexOf("Choose")).toBeGreaterThan(-1);

                        rows = chaisePage.recordsetPage.getRows();

                        return rows.count();
                    }).then(function(ct) {
                        // set is size 7, domain filter should have evaluated to null
                        expect(ct).toBe(7);

                        chaisePage.recordEditPage.getModalCloseBtn().click();
                        browser.sleep(sleepTimer);
                    });
                });

                it("should limit the set.", function() {
                    var textColName = "position_text_col",
                        textInputVal = "relative";

                    var textInput = chaisePage.recordEditPage.getInputById(0, textColName);
                    textInput.sendKeys(textInputVal);

                    chaisePage.recordEditPage.getForeignKeyInputButton(fkColName, 0).click().then(function () {
                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                        return modalTitle.getText();
                    }).then(function(text) {
                        expect(text.indexOf("Choose")).toBeGreaterThan(-1);

                        rows = chaisePage.recordsetPage.getRows();

                        return rows.count();
                    }).then(function(ct) {
                        // set is size 7, verifies set is limited by existing domain filter pattern and user input
                        expect(ct).toBe(1);

                        return rows.get(0).all(by.css(".select-action-button"));
                    }).then(function(selectButtons) {
                        selectButtons[0].click();
                        browser.sleep(sleepTimer);
                    });
                });
            });

            it("should not limit the fk set before setting the 2nd value for multi constrained fk.", function() {
                chaisePage.recordEditPage.getForeignKeyInputButton(multiColName, 0).click().then(function () {
                    browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                    return modalTitle.getText();
                }).then(function(text) {
                    expect(text.indexOf("Choose")).toBeGreaterThan(-1);

                    rows = chaisePage.recordsetPage.getRows();

                    return rows.count();
                }).then(function(ct) {
                    // set is size 7, domain filter should have evaluated to null
                    expect(ct).toBe(7);

                    chaisePage.recordEditPage.getModalCloseBtn().click();
                    browser.sleep(sleepTimer);
                });
            });

            describe("with a domain filter with a dynamic value from a fk selector ", function() {
                var fkColName = "fk_constrained_col";

                it("that isn't set should have the full set.", function() {
                    chaisePage.recordEditPage.getForeignKeyInputButton(fkColName, 0).click().then(function () {
                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                        return modalTitle.getText();
                    }).then(function(text) {
                        expect(text.indexOf("Choose")).toBeGreaterThan(-1);

                        rows = chaisePage.recordsetPage.getRows();

                        return rows.count();
                    }).then(function(ct) {
                        // set is size 7, domain filter should have evaluated to null
                        expect(ct).toBe(7);

                        chaisePage.recordEditPage.getModalCloseBtn().click();
                        browser.sleep(sleepTimer);
                    });
                });

                it("should limit the set.", function() {
                    var constraintColName = "fk1";

                    chaisePage.recordEditPage.getForeignKeyInputButton(constraintColName, 0).click().then(function () {
                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                        return modalTitle.getText();
                    }).then(function(text) {
                        expect(text.indexOf("Choose")).toBeGreaterThan(-1);

                        rows = chaisePage.recordsetPage.getRows();

                        return rows.get(0).all(by.css(".select-action-button"));
                    }).then(function(selectButtons) {
                        return selectButtons[0].click();
                    }).then(function() {
                        // this browser.wait triggers before the formTitle is actually visible (to the eyes). It appears to
                        // trigger regardless because the title is visible on the document even with the modal open. Need a
                        // wait clause based around a modal closing
                        // browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getFormTitle()), browser.params.defaultTimeout);
                        browser.sleep(sleepTimer);

                        return chaisePage.recordEditPage.getForeignKeyInputButton(fkColName, 0).click();
                    }).then(function() {
                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                        return modalTitle.getText();
                    }).then(function(text) {
                        expect(text.indexOf("Choose")).toBeGreaterThan(-1);

                        rows = chaisePage.recordsetPage.getRows();

                        return rows.count();
                    }).then(function(ct) {
                        expect(ct).toBe(3);

                        return rows.get(0).all(by.css(".select-action-button"));
                    }).then(function(selectButtons) {
                        selectButtons[0].click();
                        browser.sleep(sleepTimer);
                    });
                });
            });

            it("with a domain filter with a conjunction, should limit the set.", function() {
                chaisePage.recordEditPage.getForeignKeyInputButton(multiColName, 0).click().then(function () {
                    browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                    return modalTitle.getText();
                }).then(function(text) {
                    expect(text.indexOf("Choose")).toBeGreaterThan(-1);

                    rows = chaisePage.recordsetPage.getRows();

                    return rows.count();
                }).then(function(ct) {
                    expect(ct).toBe(1);

                    return rows.get(0).all(by.css(".select-action-button"));
                }).then(function(selectButtons) {
                    selectButtons[0].click();
                    browser.sleep(sleepTimer);
                });
            });
        });
    });
});
