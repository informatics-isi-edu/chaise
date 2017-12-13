var chaisePage = require("../../../utils/chaise.page.js");
var testParams = {
    table_name: "main-entity-table"
};

describe("Domain filter pattern support,", function() {

    var EC = protractor.ExpectedConditions,
        sleepTimer = 200;

    var testModalCount = function (colName, expectedCount, done, choose) {
        var errorCB = function (err) {
            console.log(err);
            done.fail();
        };
        var successCB = function () {
            done();
        };

        var fk,modal, rows;

        fk = chaisePage.recordEditPage.getForeignKeyInputDisplay(colName, 0);
        browser.wait(EC.elementToBeClickable(fk));
        fk.click().then(function () {
            modal = chaisePage.recordEditPage.getModalTitle();
            browser.wait(EC.visibilityOf(modal), browser.params.defaultTimeout);

            return modal.getText();
        }).then(function(text) {
            expect(text.indexOf("Choose")).toBeGreaterThan(-1);

            browser.wait(function () {
                return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                    return (ct > 0);
                });
            });

            rows = chaisePage.recordsetPage.getRows();
            return rows.count();
        }).then(function(ct) {
            expect(ct).toBe(expectedCount, "count missmatch.");

            var promise;
            if (!choose) {
                chaisePage.recordEditPage.getModalCloseBtn().click().then(function () {
                    successCB();
                }).catch(errorCB);
            } else {
                rows.get(0).all(by.css(".select-action-button")).then(function(selectButtons) {
                    // select the row
                    return selectButtons[0].click();
                }).then(function () {
                    successCB();
                }).catch(errorCB);
            }
        }).catch(errorCB);
    };

    describe("For table " + testParams.table_name + ',', function() {

        var rows, modalTitle,
            multiColName = "multi_constrained_col",
            colWFkeys = "col_w_fkeys",
            colWFkeysDefault = "col_w_fkeys_default";

        describe("In create mode, ", function() {

            beforeAll(function() {
                browser.ignoreSynchronization = true;
                browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/fk-filter-pattern:" + testParams.table_name);

                // the copy btn will be disabled while data is loading.
                browser.wait(EC.elementToBeClickable(element(by.id("copy-record-btn"))));
            });

            beforeEach(function () {
                modalTitle = chaisePage.recordEditPage.getModalTitle();
            });

            it("with a domain filter with a static value.", function(done) {
                testModalCount("position_fixed_col", 3, done, true);
            });

            it("should not limit the fk set before setting either values for multi constrained fk.", function(done) {
                testModalCount(multiColName, 7, done);
            });

            describe("with a domain filter with a dynamic value from a text entry box", function() {
                var fkColName = "position_fk_col";

                it("that isn't set should have the full set.", function(done) {
                    testModalCount(fkColName, 7, done);
                });

                it("should limit the set.", function(done) {
                    var textColName = "position_text_col",
                        textInputVal = "relative";

                    var textInput = chaisePage.recordEditPage.getInputById(0, textColName);
                    textInput.sendKeys(textInputVal);

                    testModalCount(fkColName, 1, done, true);
                });
            });

            it("should not limit the fk set before setting the 2nd value for multi constrained fk.", function(done) {
                testModalCount(multiColName, 7, done);
            });

            describe("with a domain filter with a dynamic value from a fk selector ", function() {
                var fkColName = "fk_constrained_col";

                it("that isn't set should have the full set.", function(done) {
                    testModalCount(fkColName, 7, done);

                });

                it("should limit the set.", function(done) {
                    var constraintColName = "fk1";
                    var currFk;
                    currFk = chaisePage.recordEditPage.getForeignKeyInputDisplay(constraintColName, 0);
                    browser.wait(EC.elementToBeClickable(currFk));
                    currFk.click().then(function () {
                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                        return modalTitle.getText();
                    }).then(function(text) {
                        expect(text.indexOf("Choose")).toBeGreaterThan(-1);
                        rows = chaisePage.recordsetPage.getRows();
                        return rows.get(0).all(by.css(".select-action-button"));
                    }).then(function(selectButtons) {

                        return selectButtons[0].click();
                    }).then(function() {
                        currFk = chaisePage.recordEditPage.getForeignKeyInputButton(fkColName, 0);
                        browser.wait(EC.elementToBeClickable(currFk));

                        return currFk.click();
                    }).then(function() {
                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                        return modalTitle.getText();
                    }).then(function(text) {
                        expect(text.indexOf("Choose")).toBeGreaterThan(-1);

                        rows = chaisePage.recordsetPage.getRows();

                        return rows.count();
                    }).then(function(ct) {
                        expect(ct).toBe(3, "count missmatch");

                        return rows.get(0).all(by.css(".select-action-button"));
                    }).then(function(selectButtons) {
                        return selectButtons[0].click();
                    }).then(function () {
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
            });

            it("with a domain filter with a conjunction, should limit the set.", function(done) {
                testModalCount(multiColName, 1, done, true);
            });

            describe("with a domain filter with a dynamic value from other foreignkey tables.", function () {
                // open col_w_fkeys
                it ("should not limit the set before setting the value for other foreignkey in absence of default value.", function (done) {
                    testModalCount(colWFkeys, 7, done);
                });

                // open col_w_fkeys_default, select something.
                it ("should limit the set before setting the value if other foreignkey has default value.", function (done) {
                    testModalCount(colWFkeysDefault, 2, done, true);
                });

                //open col_w_fkeys again
                it ("should limit the set after choosing a foreign key.", function (done) {
                    testModalCount(colWFkeys, 2, done);
                });


                // clear col_w_fkeys_default, open col_w_fkeys
                it ("after clearing the foreignkey, it should not limit the set.", function (done) {
                    chaisePage.recordEditPage.getForeignKeyInputRemoveBtns().then(function(btns) {
                        // NOTE this is not the best way to find the button, it's by index
                        return chaisePage.clickButton(btns[btns.length-2]);
                    }).then(function() {
                        return chaisePage.recordEditPage.getForeignKeyInputButton(colWFkeys, 0).click();
                    }).then(function () {
                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                        return modalTitle.getText();
                    }).then(function(text) {
                        expect(text.indexOf("Choose")).toBeGreaterThan(-1);
                        browser.wait(function () {
                            return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                return (ct > 0);
                            });
                        });
                        return chaisePage.recordsetPage.getRows().count();
                    }).then(function(ct) {
                        expect(ct).toBe(7);
                        return chaisePage.recordEditPage.getModalCloseBtn().click();
                    }).then(function () {
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

            });

        });

        describe("In edit mode, ", function () {
            beforeAll(function() {
                browser.ignoreSynchronization=true;
                browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/fk-filter-pattern:" + testParams.table_name + "/id=1");
                chaisePage.waitForElement(element(by.id("submit-record-button")));
            });

            describe("with a domain filter with a dynamic value from other foreignkey tables.", function () {
                it ("if foreign key has value, the foreignkey that is using its value should be limited.", function (done) {
                    testModalCount(colWFkeysDefault, 1, done);
                });

                it ("otherwise it should not be limited.", function (done) {
                    testModalCount(colWFkeys, 7, done);
                });

            });
        });
    });
});
