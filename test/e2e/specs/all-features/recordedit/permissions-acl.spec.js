var pImport =  require('../../../utils/protractor.import.js');
var chaisePage = require('../../../utils/chaise.page.js');
var recordEditPage = chaisePage.recordEditPage;
var EC = protractor.ExpectedConditions;

/**
 * dynamic_acl_main_table rows:
 *  1: editable
 *  2: non-edit
 *  3: all visible columns are non-editable
 *  4: name cannot be editted
 */
 var aclConfig = {
     "catalog": {
         "id": browser.params.catalogId,
         "schemas": {
             "multi-permissions": {
                 "tables": {
                     "dynamic_acl_main_table": {
                         "acl_bindings": {
                             // row 1, 3, 4 can be updated
                             "updatable_rows": {
                                 "types": ["update"],
                                 "projection": [
                                     {
                                         "or": [
                                             {"filter": "id", "operand": 1},
                                             {"filter": "id", "operand": 3},
                                             {"filter": "id", "operand": 4}
                                         ]
                                     },
                                     "id"
                                 ],
                                 "projection_type": "nonnull"
                             }
                         },
                         "columns": {
                             // id is generated
                             "name": {
                                 "acl_bindings": {
                                     "updatable_rows": false,
                                     "updatable_cols": {
                                         "types": ["update"],
                                         "projection": [
                                             {"filter": "id", "operand": 3, "negate": true},
                                             {"filter": "id", "operand": 4, "negate": true},
                                             "id"
                                         ],
                                         "projection_type": "nonnull"
                                     }
                                 }
                             },
                             "fk_col": {
                                 "acl_bindings": {
                                     "updatable_rows": false,
                                     "updatable_cols": {
                                         "types": ["update"],
                                         "projection": [
                                             {"filter": "id", "operand": 3, "negate": true},
                                             "id"
                                         ],
                                         "projection_type": "nonnull"
                                     }
                                 }
                             }
                         }
                     }
                 }
             }
         }
     }
 };

 // just to ensure the acl is back to the original
 var erasedAclConfig = {
     "catalog": {
         "id": browser.params.catalogId,
         "schemas": {
             "multi-permissions": {
                 "tables": {
                     "dynamic_acl_main_table": {
                         "acl_bindings": {},
                         "columns": {
                             "name": { "acl_bindings": {} },
                             "fk_col": { "acl_bindings": {} }
                         }
                     }
                 }
             }
         }
     }
 }

 var getRecordEditURL = function (filter) {
    return browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-permissions:dynamic_acl_main_table/" + filter + "/@sort(id)";
 }


if (!process.env.CI) {
    describe("When viewing RecordEdit app as anonymous user", function () {
        var modalBody;

        it("user should be shown login modal", function(done) {
            modalBody = element(by.css('.modal-body'));

            browser.ignoreSynchronization = true;
            browser.get(getRecordEditURL("id=1")).then(function () {
                // manually remove the cookie
                return browser.manage().deleteCookie('webauthn');
            }).then(function () {
                // refresh the page
                return browser.navigate().refresh();
            }).then(function () {
                return chaisePage.waitForElement(modalBody);
            }).then(function() {
                expect(modalBody.isDisplayed()).toBe(true, "modal body is not displayed");
                expect(element(by.css('.modal-title')).isPresent()).toBe(true, "modal title is not present");
                expect(element(by.css('.modal-title')).getText()).toBe('You need to be logged in to continue.', "modal title text is incorrect");
                done();
            }).catch(function (err) {
                done.fail(err);
            })
        });
    });
}

describe("when viewing Recordedit app for a table with dynamic acls", function () {
    beforeAll(function (done) {
        // add ACLs
        pImport.importACLs(aclConfig).then(function () {
            // make sure the restricted user is logged in
            return chaisePage.performLogin(process.env.RESTRICTED_AUTH_COOKIE);
        }).then(function() {
            done();
        }).catch(function(err) {
            console.log("error while trying to login as restricted user");
            done.fail(err);
        });
    });

    describe("when the whole row cannot be edited", function () {
        beforeAll(function () {
            browser.ignoreSynchronization = true;
            browser.get(getRecordEditURL("id=1;id=2;id=3"));
            chaisePage.recordeditPageReady();
            browser.wait(function() {
                return recordEditPage.getAllColumnNames().count().then(function(ct) {
                    return (ct == 3);
                });
            }, browser.params.defaultTimeout);
        });

        it("the `ban` icon should be displayed on the header.", function () {
            expect(recordEditPage.getDisabledRowIcon(0).isPresent()).toBe(false, "first row missmatch");
            expect(recordEditPage.getDisabledRowIcon(1).isPresent()).toBe(true, "second row missmatch");
            expect(recordEditPage.getDisabledRowIcon(2).isPresent()).toBe(true, "third row missmatch");
        });

        it ("all the columns in the row should be disabled.", function () {
            // 1 all except id enabled, 2 table-level disabled, 3 all vis columns disabled
            expect(recordEditPage.getInputById(0, "id").getAttribute('disabled')).toBeTruthy("row=0 id missmatch");
            expect(recordEditPage.getInputById(0, "name").getAttribute('disabled')).toBeFalsy("row=0 name missmatch");
            expect(recordEditPage.getInputById(0, "fk_col").getAttribute('disabled')).toBeFalsy("row=0 fk_col missmatch");

            expect(recordEditPage.getInputById(1, "id").getAttribute('disabled')).toBeTruthy("row=1 id missmatch");
            expect(recordEditPage.getInputById(1, "name").getAttribute('disabled')).toBeTruthy("row=1 name missmatch");
            expect(recordEditPage.getInputById(1, "fk_col").getAttribute('disabled')).toBeTruthy("row=1 fk_col missmatch");

            expect(recordEditPage.getInputById(2, "id").getAttribute('disabled')).toBeTruthy("row=2 id missmatch");
            expect(recordEditPage.getInputById(2, "name").getAttribute('disabled')).toBeTruthy("row=2 name missmatch");
            expect(recordEditPage.getInputById(2, "fk_col").getAttribute('disabled')).toBeTruthy("row=2 fk_col missmatch");

        });

        it ("submitting the form should not submit the value and show the rows a `disabled`", function (done) {
            var nameInpt = recordEditPage.getInputById(0, "name");
            nameInpt.sendKeys("new one");
            recordEditPage.submitForm().then(function () {

                // Make sure the table shows up with the expected # of rows
                browser.wait(function() {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return (ct == 3);
                    });
                }, browser.params.defaultTimeout);

                expect(recordEditPage.getResultsetTitleElement().getText()).toBe("1/3 dynamic_acl_main_table records updated successfully", "Resultset title is incorrect.");

                expect(recordEditPage.getDisabledResultSetHeader().getText()).toBe("2 disabled records (due to lack of permission)", "disabled header is incorrect.");

                done();
            }).catch(function (err) {
                done.fail(err);
            })
        });
    });

    describe("when some of the columns in the row cannot be edited", function () {
        beforeAll(function () {
            browser.ignoreSynchronization = true;
            browser.get(getRecordEditURL("id=1;id=4"));
            var alert = browser.switchTo().alert();
            if (alert) {
                alert.accept();
            }
            chaisePage.recordeditPageReady();
            browser.wait(function() {
                return recordEditPage.getAllColumnNames().count().then(function(ct) {
                    return (ct == 3);
                });
            }, browser.params.defaultTimeout);
        });

        it ("The field should be disabled.", function (done) {
            recordEditPage.getInputForAColumn("name", 1).then(function (input) {
                expect(input.getAttribute("disabled")).toBeTruthy("disabled missmatch");
                expect(input.getAttribute("value")).toEqual("four","value missmatch");
                done();
            }).catch(function (err) {
                done.fail(err);
            })
        });

        it ("Trying to edit a column in another row should display a warning", function (done) {
            // we want to click on the first cell, so get it
            var overlay = recordEditPage.getColumnPermissionOverlay(0, "name");
            expect(overlay.isPresent()).toBeTruthy("overlay not present");
            overlay.click().then(function () {
                var warn = recordEditPage.getColumnPermissionError(0, "name");

                chaisePage.waitForElement(warn);

                var message = "This field cannot be modified. To modify it, remove all records that have this field disabled (e.g. Record Number 2)";
                expect(warn.getText()).toEqual(message, "permission error text missmatch");
                // remove the record from form
                return recordEditPage.getDeleteRowButton(1);
            }).then(function (button) {
                return chaisePage.clickButton(button);
            }).then(function () {
                return recordEditPage.getForms().count();
            }).then(function (ct) {
                expect(ct).toBe(1, "number of rows is incorrect after removing 1");

                var nameInpt = recordEditPage.getInputById(0, "name");
                nameInpt.sendKeys("1");
                return recordEditPage.submitForm();
            }).then(function () {
                return recordEditPage.getAlertError();
            }).then(function (err) {
                if (err) {
                    done.fail("page has errors");
                } else {
                    done();
                }
            }).catch(function (err) {
                done.fail(err);
            })
        });
    });

    afterAll(function (done) {
        // clean up the ACLs
        pImport.importACLs(erasedAclConfig).then(function () {
            // login as the original user
            return chaisePage.performLogin(process.env.AUTH_COOKIE);
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        });
    });
});
