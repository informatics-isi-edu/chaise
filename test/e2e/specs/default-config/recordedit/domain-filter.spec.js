var chaisePage = require("../../../utils/chaise.page.js");
var testParams = {
    table_name: "main-entity-table"
};

describe("Domain filter pattern support,", function() {

    var EC = protractor.ExpectedConditions,
        sleepTimer = 200;

    describe("For table " + testParams.table_name + ',', function() {

        var rows, modalTitle,
            multiColName = "multi_constrained_col",
            colWFkeys = "col_w_fkeys",
            colWFkeysDefault = "col_w_fkeys_default";

        beforeAll(function () {
            browser.ignoreSynchronization = true;
        });

        describe("In create mode, ", function() {

            beforeAll(function() {
                browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/fk-filter-pattern:" + testParams.table_name);

                // the copy btn will be disabled while data is loading.
                browser.wait(EC.elementToBeClickable(element(by.id("copy-record-btn"))));
            });

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
                }).catch(function (err) {
                    console.log(err);
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
                }).catch(function (err) {
                    console.log(err);
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
                    }).catch(function (err) {
                        console.log(err);
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
                    }).catch(function (err) {
                        console.log(err);
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
                }).catch(function (err) {
                    console.log(err);
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
                        browser.wait(function () {
                            return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                return (ct > 0);
                            });
                        });
                        rows = chaisePage.recordsetPage.getRows();
                        return rows.count();
                    }).then(function(ct) {
                        // set is size 7, domain filter should have evaluated to null
                        expect(ct).toBe(7);

                        chaisePage.recordEditPage.getModalCloseBtn().click();
                        browser.sleep(sleepTimer);
                    }).catch(function (err) {
                        console.log(err);
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
                    }).catch(function (err) {
                        console.log(err);
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

            describe("with a domain filter with a dynamic value from other foreignkey tables.", function () {
                // open col_w_fkeys
                it ("should not limit the set before setting the value for other foreignkey in absence of default value.", function () {
                    chaisePage.recordEditPage.getForeignKeyInputButton(colWFkeys, 0).click().then(function () {
                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                        return modalTitle.getText();
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
                        expect(ct).toBe(7, "count missmatch.");
                        chaisePage.recordEditPage.getModalCloseBtn().click();
                        browser.sleep(sleepTimer);
                    }).catch(function (err) {
                        console.log(err);
                    });
                });

                // open col_w_fkeys_default, select something.
                it ("should limit the set before setting the value if other foreignkey has default value.", function () {
                    chaisePage.recordEditPage.getForeignKeyInputButton(colWFkeysDefault, 0).click().then(function () {
                        browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                        return modalTitle.getText();
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
                        // this is filtered to be two rows
                        expect(ct).toBe(2, "count missmatch.");

                        return rows.get(0).all(by.css(".select-action-button"));
                    }).then(function(selectButtons) {
                        // select the row
                        selectButtons[0].click();
                    }).catch(function (err) {
                        console.log(err);
                    });
                });

                //open col_w_fkeys again
                it ("should limit the set after choosing a foreign key.", function (done) {
                    chaisePage.recordEditPage.getForeignKeyInputButton(colWFkeys, 0).click().then(function () {
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
                        expect(ct).toBe(2, "count missmatch.");
                        chaisePage.recordEditPage.getModalCloseBtn().click();
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
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
                        chaisePage.recordEditPage.getModalCloseBtn().click();
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
                browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/fk-filter-pattern:" + testParams.table_name + "/id=1");

                browser.wait(EC.elementToBeClickable(element(by.id("submit-record-button"))));
            });

            describe("with a domain filter with a dynamic value from other foreignkey tables.", function () {
                it ("if foreign key has value, the foreignkey that is using its value should be limited.", function (done) {
                    chaisePage.recordEditPage.getForeignKeyInputButton(colWFkeysDefault, 0).click().then(function () {
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
                        expect(ct).toBe(1, "count missmatch.");
                        chaisePage.recordEditPage.getModalCloseBtn().click();
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it ("otherwise it should not be limited.", function (done) {
                    chaisePage.recordEditPage.getForeignKeyInputButton(colWFkeys, 0).click().then(function () {
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
                        expect(ct).toBe(7, "count missmatch.");
                        chaisePage.recordEditPage.getModalCloseBtn().click();
                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });
            });
        });
    });
});
