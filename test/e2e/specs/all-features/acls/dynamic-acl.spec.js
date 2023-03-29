/**
 * All the tests in here are changing the acls of `dynamic_acl_main_table` table,
 * and since the specs will run in parallel on CI, we cannot break them into
 * different files.
 */

const pImport =  require('../../../utils/protractor.import.js');
const chaisePage = require('../../../utils/chaise.page.js');
const recordPage = chaisePage.recordPage;
const recordEditPage = chaisePage.recordEditPage;
const recordsetPage = chaisePage.recordsetPage;
const EC = protractor.ExpectedConditions;

/**
 * dynamic_acl_main_table rows:
 *  1: editable, deletable
 *  2: non-edit, non-delete
 *  3: non-edit, deletable
 *  4: editable, non-delete
 *  5: all visible columns are non-editable
 *  6: name cannot be editted
 *  7: editable, non-delete
 *  8: editable, deletable
 *  9: editable, non-delete
 *
 * dynamic_acl_related_table:
 *  1: editable, deletable
 *  2: non-edit, non-delete
 *  3: non-edit, deletable
 *  4: editable, non-delete
 *
 * dynamic_acl_assoc_table:
 *  (1, 1): non-delete
 *  (1, 2): deletable
 *  dynamic_acl_related_assoc_table:
 *  1: editable, deletable
 *  2: non-edit, non-delete
 */
const testParams = {
    dynamic_acl: {
        row_ids: {
            editable_deletable:    1,
            non_edit_non_delete:   2,
            non_edit_deletable:    3,
            editable_non_delete:   4,
            all_vis_col_non_edit:  5,
            some_vis_col_non_edit: 6,
        },
        related: {
            main_id: 1,
            inbound_displayname: "related_1",
            assoc_displayname: "related_2",
        }
    }
};

const aclConfig = {
    "catalog": {
        "id": browser.params.catalogId,
        "schemas": {
            "multi-permissions": {
                "tables": {
                    "dynamic_acl_main_table": {
                        "acl_bindings": {
                            // row 1, 3, 5, 6, 8 can be deleted
                            "deletable_rows": {
                                "types": ["delete"],
                                "projection": [
                                    {
                                        "or": [
                                            {"filter": "id", "operand": 1},
                                            {"filter": "id", "operand": 3},
                                            {"filter": "id", "operand": 5},
                                            {"filter": "id", "operand": 6},
                                            {"filter": "id", "operand": 8}
                                        ]
                                    },
                                    "id"
                                ],
                                "projection_type": "nonnull"
                            },
                            // row 1, 4, 5, 6, 7, 8, 9 can be updated
                            "updatable_rows": {
                                "types": ["update"],
                                "projection": [
                                    {
                                        "or": [
                                            {"filter": "id", "operand": 1},
                                            {"filter": "id", "operand": 4},
                                            {"filter": "id", "operand": 5},
                                            {"filter": "id", "operand": 6},
                                            {"filter": "id", "operand": 7},
                                            {"filter": "id", "operand": 8},
                                            {"filter": "id", "operand": 9}
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
                                            {"filter": "id", "operand": 5, "negate": true},
                                            {"filter": "id", "operand": 6, "negate": true},
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
                                            {"filter": "id", "operand": 5, "negate": true},
                                            "id"
                                        ],
                                        "projection_type": "nonnull"
                                    }
                                }
                            }
                        }
                    },
                    "dynamic_acl_related_table": {
                        "acl_bindings": {
                            // row 1, 3 can be deleted
                            "deletable_rows": {
                                "types": ["delete"],
                                "projection": [
                                    {
                                        "or": [
                                            {"filter": "id", "operand": 1},
                                            {"filter": "id", "operand": 3}
                                        ]
                                    },
                                    "id"
                                ],
                                "projection_type": "nonnull"
                            },
                            // row 1, 4 can be deleted
                            "updatable_rows": {
                                "types": ["update"],
                                "projection": [
                                    {
                                        "or": [
                                            {"filter": "id", "operand": 1},
                                            {"filter": "id", "operand": 4}
                                        ]
                                    },
                                    "id"
                                ],
                                "projection_type": "nonnull"
                            }
                        }
                    },
                    "dynamic_acl_assoc_table": {
                        "acl_bindings": {
                            // association (1,2) can be deleted
                            "deletable_rows": {
                                "types": ["delete"],
                                "projection": [
                                    {"filter": "id_1", "operand": 1},
                                    {"filter": "id_2", "operand": 2},
                                    "id_1"
                                ],
                                "projection_type": "nonnull"
                            }
                        }
                    },
                    "dynamic_acl_related_assoc_table": {
                        "acl_bindings": {
                            // related 1 can be deleted
                            "deletable_rows": {
                                "types": ["delete"],
                                "projection": [
                                    {"filter": "id", "operand": 1},
                                    "id"
                                ],
                                "projection_type": "nonnull"
                            },
                            // related 1 can be updated
                            "updatable_rows": {
                                "types": ["update"],
                                "projection": [
                                    {"filter": "id", "operand": 1},
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
};

// just to ensure the acl is back to the original
const erasedAclConfig = {
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
                    },
                    "dynamic_acl_related_table": {
                        "acl_bindings": {}
                    },
                    "dynamic_acl_assoc_table": {
                        "acl_bindings": {}
                    },
                    "dynamic_acl_related_assoc_table": {
                        "acl_bindings": {}
                    }
                }
            }
        }
    }
}

/******************** record helpers ************************/
const getRecordURL = function (id) {
    return browser.params.url + "/record/#" + browser.params.catalogId +
           "/multi-permissions:dynamic_acl_main_table/id=" + id;
};

const testRecordEditDelete = function (id, editable, deletable) {
    beforeAll(function (done) {
        chaisePage.navigate(getRecordURL(id)).then(function () {
            return chaisePage.recordPageReady();
        }).then(function () {
            done();
        }).catch(function (err) {
            done.fail(err);
        });
    });

    it("should display the Edit link" + (editable ? "" : " as a disabled"), function (done) {
        const button = recordPage.getEditRecordButton();
        expect(button.isPresent()).toEqual(true, "edit button missing");
        if (editable) {
            expect(button.getAttribute("aria-disabled")).toBe('false', "edit button disabled");
        } else {
            expect(button.getAttribute("aria-disabled")).toBeTruthy('true', "edit button enabled");
        }

        done();
    });

    it("should display the Delete link" + (deletable ? "" : " as disabled"), function (done) {
        const button = recordPage.getDeleteRecordButton();
        expect(button.isPresent()).toEqual(true, "delete button missing");
        if (deletable) {
            expect(button.getAttribute("aria-disabled")).toBe('false', "delete button disabled");
        } else {
            expect(button.getAttribute("aria-disabled")).toBe('true', "delete button enabled");
        }

        done();
    });
};

const testRelatedEdit = function (displayname, expectedVals) {
    expectedVals.forEach(function (exp, index) {
        const btn = chaisePage.recordPage.getRelatedTableRowEdit(displayname, index);

        expect(btn.isPresent()).toEqual(exp, "edit button missmatch for index=" + index);
    });
};

const testRelatedDelete = function (displayname, expectedVals) {
    expectedVals.forEach(function (exp, index) {
        const btn = chaisePage.recordPage.getRelatedTableRowDelete(displayname, index);

        expect(btn.isPresent()).toEqual(exp, "edit button missmatch for index=" + index);
    });
};

/******************** recordedit helpers ************************/
const getRecordEditURL = function (filter) {
   return browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-permissions:dynamic_acl_main_table/" + filter + "/@sort(id)";
};

/******************** recordset helpers ************************/

const testRecordSetEditDelete = function (uriFilter, rowCount, displayBulkEdit, expectedEditable, expectedDeletable) {
    beforeAll(function (done) {
        chaisePage.refresh(browser.params.url + "/recordset/#" + browser.params.catalogId + "/multi-permissions:dynamic_acl_main_table/" + uriFilter + "@sort(id)").then(function () {
            return chaisePage.recordsetPageReady();
        }).then(function () {
            return browser.wait(function () {
                return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                    return (ct==rowCount)
                });
            });
        }).then(function () {
            done();
        }).catch(function (err) {
            done.fail(err);
        });
    });

    it ("should " + (displayBulkEdit ? "" : " not") +  " display the bulk edit link.", function (done) {
        const link = recordsetPage.getEditRecordLink();
        expect(link.isPresent()).toBe(displayBulkEdit, "bulk edit missmatch");
        done();
    });

    describe("the action columns, ", function () {
        it ("should show view, edit, and delete buttons correctly.", function (done) {
            chaisePage.recordsetPage.getRows().then(function (rows) {
                rows.forEach(function (row, index) {
                    expect(row.element(by.css('.view-action-button')).isPresent()).toBe(true, "view missmatch for index=" + index);
                    expect(row.element(by.css('.edit-action-button')).isPresent()).toBe(expectedEditable[index], "edit missmatch for index=" + index);
                    expect(row.element(by.css('.delete-action-button')).isPresent()).toBe(expectedDeletable[index], "delete missmatch for index=" + index);
                });

                done();
            }).catch(function (err) {
                done.fail(err);
            });
        });
    });
}

describe("regarding dynamic ACL support, ", function () {
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

    /******************** record tests ************************/
    describe('When viewing Record app for a table with dynamic acls, ', function() {

        describe("when the row can be edited and deleted, ", function () {
            testRecordEditDelete(testParams.dynamic_acl.row_ids.editable_deletable, true, true);
        });

        describe("when the row cannot be edited or deleted, ", function () {
            // in this case none of the buttons show up (no edit, no delete, no create)
            beforeAll(function (done) {
                chaisePage.navigate(getRecordURL(testParams.dynamic_acl.row_ids.non_edit_non_delete)).then(function () {
                    return chaisePage.recordPageReady();
                }).then(function () {
                    done();
                }).catch(function(err) {
                    done.fail(err);
                });
            });

            it ("should not display the Edit button.", function (done) {
                const button = recordPage.getEditRecordButton();
                expect(button.isPresent()).toBeFalsy();
                done();
            });

            it ("should not display the Delete button.", function (done) {
                const button = recordPage.getDeleteRecordButton();
                expect(button.isPresent()).toBeFalsy();
                done();
            });
        });

        describe("when the row cannot be edited but can be deleted, ", function () {
            testRecordEditDelete(testParams.dynamic_acl.row_ids.non_edit_deletable, false, true);
        });

        describe("when the row can be edited but not deleted, ", function () {
            testRecordEditDelete(testParams.dynamic_acl.row_ids.editable_non_delete, true, false);
        });

        describe("when all the columns in a row are not editable, ", function () {
            testRecordEditDelete(testParams.dynamic_acl.row_ids.all_vis_col_non_edit, false, true);
        }).pend("tcrs support has been removed because of performance issues");

        describe("when some of the columns in a row are not editable, ", function () {
            testRecordEditDelete(testParams.dynamic_acl.row_ids.some_vis_col_non_edit, true, true);
        }).pend("tcrs support has been removed because of performance issues");

        describe("when the related tables have dynamic acls, ", function () {
            beforeAll(function (done) {
                chaisePage.navigate(getRecordURL(testParams.dynamic_acl.related.main_id)).then(function () {
                    return chaisePage.recordPageReady();
                }).then(function () {
                    done();
                }).catch(function(err) {
                    done.fail(err);
                });
            });

            describe("for a related table, ", function () {
                it ("rows should be displayed properly", function (done) {
                    expect(recordPage.getRelatedTableRows(testParams.dynamic_acl.related.inbound_displayname).count()).toBe(4);
                    done();
                });

                it ("Edit button should display based on related table acls,", function (done) {
                    testRelatedEdit(testParams.dynamic_acl.related.inbound_displayname, [true, false, false, true]);
                    done();
                });

                it ("Delete button should display based on related table acls", function (done) {
                    testRelatedDelete(testParams.dynamic_acl.related.inbound_displayname, [true, false, true, false]);
                    done();
                });
            });

            describe("for an association table, ", function () {
                it ("rows should be displayed properly", function (done) {
                    expect(recordPage.getRelatedTableRows(testParams.dynamic_acl.related.assoc_displayname).count()).toBe(2);
                    done();
                });

                it ("Edit button should display based on related table acls,", function (done) {
                    testRelatedEdit(testParams.dynamic_acl.related.assoc_displayname, [true, false]);
                    done();
                });

                it ("Unlink button should display based on association table acls", function (done) {
                    testRelatedDelete(testParams.dynamic_acl.related.assoc_displayname, [false, true]);
                    done();
                });
            });
        });
    });

    /******************** recordedit tests ************************/
    describe("when viewing Recordedit app for a table with dynamic acls", function () {
        describe("when none of the rows can be edited.", () => {
            it ('users should the unauthorized access error.', (done) => {
                chaisePage.navigate(getRecordEditURL('id=2;id=5')).then(() => {
                    chaisePage.waitForElement(element(by.css('.modal-error .modal-dialog')));

                    const modalTitle = chaisePage.errorModal.getTitle();
                    expect(modalTitle.getText()).toBe('Unauthorized Access');

                    const modalText = chaisePage.errorModal.getBody();
                    expect(modalText.getText()).toContain('You are not authorized to perform this action.');

                    done();
                }).catch(chaisePage.catchTestError(done));
            });
        });

        describe("when some of the rows cannot be edited.", function () {
            beforeAll(function (done) {
                // 1 all except id enabled, 2 table-level disabled, 3 all vis columns disabled
                chaisePage.navigate(getRecordEditURL("id=1;id=2;id=5")).then(function () {
                    return chaisePage.recordeditPageReady();
                }).then(function () {
                    return browser.wait(function() {
                        return recordEditPage.getAllColumnNames().count().then(function(ct) {
                            return (ct == 3);
                        });
                    }, browser.params.defaultTimeout);
                }).then(function () {
                    done();
                }).catch(function(err) {
                    done.fail(err);
                });
            });

            it ("a dismissiable warning should be displayed about omited forms", () => {
                const alert = chaisePage.recordEditPage.getAlertWarning();
                expect(alert.isDisplayed()).toBeTruthy();
                expect(alert.getText()).toContain('2/3 entries were removed from editing due to the lack of permission.');
            });

            it ("only the editable records should be displayed.", () => {
                expect(recordEditPage.getRecordeditForms().count()).toBe(1);

                expect(recordEditPage.getInputForAColumn('id', 1).getAttribute('disabled')).toBeTruthy("row=0 id missmatch");
                expect(recordEditPage.getInputForAColumn('name', 1).getAttribute('disabled')).toBeFalsy("row=0 name missmatch");
            });

            it ("submitting the form should properly ignore the disabeld rows", function (done) {
                const nameInpt = recordEditPage.getInputForAColumn('name', 1);
                nameInpt.sendKeys("new one").then(function () {
                    return recordEditPage.submitForm();
                }).then(function () {
                    // wait for url change (which means successful request)
                    browser.wait(function () {
                      return browser.driver.getCurrentUrl().then(function(url) {
                          return url.startsWith(process.env.CHAISE_BASE_URL + "/record/");
                      });
                    }, browser.params.defaultTimeout);
                    done();
                }).catch(chaisePage.catchTestError(done));
            });
        });

        describe("when some of the columns in one of the rows cannot be edited", function () {
            beforeAll(function (done) {
                chaisePage.navigate(getRecordEditURL("id=1;id=6")).then(() => {
                    return chaisePage.recordeditPageReady();
                }).then(function () {
                    return browser.wait(function() {
                        return recordEditPage.getAllColumnNames().count().then(function(ct) {
                            return (ct == 3);
                        });
                    }, browser.params.defaultTimeout);
                }).then(function () {
                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            it ("The field should be disabled.", function () {
                const input = recordEditPage.getInputForAColumn("name", 2);
                expect(input.getAttribute("disabled")).toBeTruthy("disabled missmatch");
                expect(input.getAttribute("value")).toEqual("six","value missmatch");
            });

            it ("Trying to edit a column in another row should display a warning", function (done) {
                let warn;
                // we want to click on the first cell, so get it
                const overlay = recordEditPage.getColumnPermissionOverlay(1, "name");
                expect(overlay.isPresent()).toBeTruthy("overlay not present");
                overlay.click().then(function () {
                    warn = recordEditPage.getColumnPermissionError(1, "name");

                    return chaisePage.waitForElement(warn);
                }).then(function () {
                    const message = "This field cannot be modified. To modify it, remove all records that have this field disabled (e.g. Record Number 2)";
                    expect(warn.getText()).toEqual(message, "permission error text missmatch");
                    // remove the record from form
                    return recordEditPage.getDeleteRowButton(1);
                }).then(function (button) {
                    return chaisePage.clickButton(button);
                }).then(function () {
                    return browser.wait(() => {
                      return recordEditPage.getRecordeditForms().count().then((ct) => ct === 1);
                    });
                }).then(function () {
                    const nameInpt = recordEditPage.getInputForAColumn("name", 1);
                    return nameInpt.sendKeys("1");
                }).then(function () {
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
                });
            });
        });

        describe('when some rows cannot be deleted', function () {
            beforeAll((done) => {
              chaisePage.navigate(getRecordEditURL("id=7;id=8;id=9")).then(() => {
                  return chaisePage.recordeditPageReady();
              }).then(function () {
                  return browser.wait(function() {
                      return recordEditPage.getAllColumnNames().count().then(function(ct) {
                          return (ct == 3);
                      });
                  }, browser.params.defaultTimeout);
              }).then(function () {
                  done();
              }).catch(function (err) {
                  done.fail(err);
              });
            });

            it ('Bulk delete button should be present and user should be able to click it', function (done) {
                const bulkDeleteBtn = chaisePage.recordEditPage.getBulkDeleteButton();
                const confirmModalTitle = chaisePage.recordPage.getConfirmDeleteTitle();
                expect(bulkDeleteBtn.isDisplayed()).toBeTruthy();
                bulkDeleteBtn.click().then(() => {

                  browser.wait(EC.visibilityOf(confirmModalTitle), browser.params.defaultTimeout);

                  const confirmButton = chaisePage.recordPage.getConfirmDeleteButton();
                  browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);

                  expect(chaisePage.recordPage.getConfirmDeleteModalText().getText()).toBe('Are you sure you want to delete all 3 of the displayed records?');

                  return chaisePage.clickButton(confirmButton);
                }).then(() => {
                  done();
                }).catch(chaisePage.catchTestError(done));

            });

            it ('After the delete is done, user should see the proper message', (done) => {
                const batchDeleteSummary = chaisePage.errorModal.getElement();
                const summaryTitle = chaisePage.errorModal.getTitle();

                chaisePage.waitForElement(batchDeleteSummary).then(() => {
                    return chaisePage.waitForElement(summaryTitle);
                }).then(() => {
                    expect(summaryTitle.getText()).toEqual('Batch Delete Summary', 'title missmatch');
                    const expectedBody = [
                      '1 record successfully deleted. 2 records could not be deleted. Check the error details below to see more information.',
                      '\nShow Error Details'
                    ].join('\n');
                    expect(chaisePage.errorModal.getBody().getText()).toBe(expectedBody, 'body missmatch');
                    done();
                  }).catch(chaisePage.catchTestError(done));
            });

            it ('clicking on "close" button should remove the deleted rows', (done) => {
                const summaryCloseBtn = chaisePage.errorModal.getCloseButton();
                browser.wait(EC.elementToBeClickable(summaryCloseBtn), browser.params.defaultTimeout).then(() => {
                    return chaisePage.clickButton(summaryCloseBtn);
                }).then(() => {
                    browser.wait(function() {
                      return chaisePage.recordEditPage.getForms().count().then(function(ct) {
                          // only one row was deletable
                          return (ct == 2);
                      });
                  }, browser.params.defaultTimeout);
                  done();
                }).catch(chaisePage.catchTestError(done));
            });
        });
    });

    /******************** recordset tests ************************/
    describe('When viewing Recordset app for a table with dynamic acls, ', function() {
        describe("when some of the displayed rows are not editable/deletable, ", function () {
            // NOTE recordset doesn't ask for tcrs and therefore cannot accurately guess the acl for id=5
            testRecordSetEditDelete("id=1;id=2;id=3;id=4;id=5;id=6", 6, true, [true, false, false, true, true, true], [true, false, true, false, true, true]);
        });

        describe("when none of the displayed rows are editable, ", function () {
            testRecordSetEditDelete("id=2;id=3", 2, false, [false, false], [false, true]);
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
})
