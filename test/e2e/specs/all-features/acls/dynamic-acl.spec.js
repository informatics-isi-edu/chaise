/**
 * All the tests in here are changing the acls of `dynamic_acl_main_table` table,
 * and since the specs will run in parallel on CI, we cannot break them into
 * different files.
 */

var pImport =  require('../../../utils/protractor.import.js');
var chaisePage = require('../../../utils/chaise.page.js');
const { browser } = require('protractor');
var recordPage = chaisePage.recordPage;
var recordEditPage = chaisePage.recordEditPage;
var recordsetPage = chaisePage.recordsetPage;
var EC = protractor.ExpectedConditions;

/**
 * dynamic_acl_main_table rows:
 *  1: editable, deletable
 *  2: non-edit, non-delete
 *  3: non-edit, deletable
 *  4: editable, non-delete
 *  5: all visible columns are non-editable
 *  6: name cannot be editted
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
var testParams = {
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

var aclConfig = {
    "catalog": {
        "id": browser.params.catalogId,
        "schemas": {
            "multi-permissions": {
                "tables": {
                    "dynamic_acl_main_table": {
                        "acl_bindings": {
                            // row 1, 3, 5, 6 can be deleted
                            "deletable_rows": {
                                "types": ["delete"],
                                "projection": [
                                    {
                                        "or": [
                                            {"filter": "id", "operand": 1},
                                            {"filter": "id", "operand": 3},
                                            {"filter": "id", "operand": 5},
                                            {"filter": "id", "operand": 6}
                                        ]
                                    },
                                    "id"
                                ],
                                "projection_type": "nonnull"
                            },
                            // row 1, 4, 5, 6 can be updated
                            "updatable_rows": {
                                "types": ["update"],
                                "projection": [
                                    {
                                        "or": [
                                            {"filter": "id", "operand": 1},
                                            {"filter": "id", "operand": 4},
                                            {"filter": "id", "operand": 5},
                                            {"filter": "id", "operand": 6},
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
var getRecordURL = function (id) {
    return browser.params.url + "/record/#" + browser.params.catalogId +
           "/multi-permissions:dynamic_acl_main_table/id=" + id;
};

var testRecordEditDelete = function (id, editable, deletable) {
    beforeAll(function () {
        browser.ignoreSynchronization = true;
        browser.get(getRecordURL(id));
        chaisePage.recordPageReady();
    });

    it("should display the Edit link" + (editable ? "" : " as a disabled"), function () {
        var button = recordPage.getEditRecordButton();
        expect(button.isPresent()).toEqual(true, "edit button missing");
        if (editable) {
            expect(button.getAttribute("disabled")).toBeFalsy("edit button disabled");
        } else {
            expect(button.getAttribute("disabled")).toBeTruthy("edit button enabled");
        }
    });

    it("should display the Delete link" + (deletable ? "" : " as disabled"), function () {
        var button = recordPage.getDeleteRecordButton();
        expect(button.isPresent()).toEqual(true, "delete button missing");
        if (deletable) {
            expect(button.getAttribute("disabled")).toBeFalsy("delete button disabled");
        } else {
            expect(button.getAttribute("disabled")).toBeTruthy("delete button enabled");
        }
    });
};

var testRelatedEdit = function (displayname, expectedVals) {
    expectedVals.forEach(function (exp, index) {
        var btn = chaisePage.recordPage.getRelatedTableRowEdit(displayname, index);

        expect(btn.isPresent()).toEqual(exp, "edit button missmatch for index=" + index);
    });
};

var testRelatedDelete = function (displayname, expectedVals) {
    expectedVals.forEach(function (exp, index) {
        var btn = chaisePage.recordPage.getRelatedTableRowDelete(displayname, index);

        expect(btn.isPresent()).toEqual(exp, "edit button missmatch for index=" + index);
    });
};

/******************** recordedit helpers ************************/
var getRecordEditURL = function (filter) {
   return browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-permissions:dynamic_acl_main_table/" + filter + "/@sort(id)";
};

/******************** recordset helpers ************************/

var testRecordSetEditDelete = function (uriFilter, rowCount, displayBulkEdit, expectedEditable, expectedDeletable) {
    beforeAll(function () {
        browser.ignoreSynchronization = true;
        browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/multi-permissions:dynamic_acl_main_table/" + uriFilter + "@sort(id)");
        chaisePage.recordsetPageReady();
        browser.wait(function () {
            return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                return (ct==rowCount)
            });
        });
    });

    it ("should " + (displayBulkEdit ? "" : " not") +  " display the bulk edit link.", function () {
        var link = recordsetPage.getEditRecordLink();
        expect(link.isPresent()).toBe(displayBulkEdit, "bulk edit missmatch");
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
            })
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
            beforeAll(function () {
                browser.ignoreSynchronization = true;
                browser.get(getRecordURL(testParams.dynamic_acl.row_ids.non_edit_non_delete));
                chaisePage.recordPageReady();
            });

            it ("should not display the Edit button.", function () {
                var button = recordPage.getEditRecordButton();
                expect(button.isPresent()).toBeFalsy();
            });

            it ("should not display the Delete button.", function () {
                var button = recordPage.getDeleteRecordButton();
                expect(button.isPresent()).toBeFalsy();
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
            beforeAll(function () {
                browser.ignoreSynchronization = true;
                browser.get(getRecordURL(testParams.dynamic_acl.related.main_id));
                chaisePage.recordPageReady();
            });

            describe("for a related table, ", function () {
                it ("rows should be displayed properly", function () {
                    expect(recordPage.getRelatedTableRows(testParams.dynamic_acl.related.inbound_displayname).count()).toBe(4);
                });

                it ("Edit button should display based on related table acls,", function () {
                    testRelatedEdit(testParams.dynamic_acl.related.inbound_displayname, [true, false, false, true]);
                });

                it ("Delete button should display based on related table acls", function () {
                    testRelatedDelete(testParams.dynamic_acl.related.inbound_displayname, [true, false, true, false]);
                });
            });

            describe("for an association table, ", function () {
                it ("rows should be displayed properly", function () {
                    expect(recordPage.getRelatedTableRows(testParams.dynamic_acl.related.assoc_displayname).count()).toBe(2);
                });

                it ("Edit button should display based on related table acls,", function () {
                    testRelatedEdit(testParams.dynamic_acl.related.assoc_displayname, [true, false]);
                });

                it ("Unlink button should display based on association table acls", function () {
                    testRelatedDelete(testParams.dynamic_acl.related.assoc_displayname, [false, true]);
                });
            });
        });
    });

    /******************** recordedit tests ************************/
    describe("when viewing Recordedit app for a table with dynamic acls", function () {
        describe("when the whole row cannot be edited", function () {
            beforeAll(function () {
                browser.ignoreSynchronization = true;
                browser.get(getRecordEditURL("id=1;id=2;id=5"));
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
                browser.get(getRecordEditURL("id=1;id=6"));
                // just in case the other test failed and didn't submit
                browser.switchTo().alert().then(function (alert) {
                    alert.accept();
                }).catch(function () {}).finally(function () {
                    chaisePage.recordeditPageReady();
                    browser.wait(function() {
                        return recordEditPage.getAllColumnNames().count().then(function(ct) {
                            return (ct == 3);
                        });
                    }, browser.params.defaultTimeout);
                });
            });

            it ("The field should be disabled.", function (done) {
                recordEditPage.getInputForAColumn("name", 1).then(function (input) {
                    expect(input.getAttribute("disabled")).toBeTruthy("disabled missmatch");
                    expect(input.getAttribute("value")).toEqual("six","value missmatch");
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
        })

        // navigate away from the recordedit page so it doesn't interfere with other tests
        afterAll(function (done) {
            browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/multi-permissions:dynamic_acl_main_table");
            browser.switchTo().alert().then(function (alert) {
                alert.accept();
            }).catch(function () {}).finally(function () {
                done();
            });
        });
    });

    /******************** recordset tests ************************/
    describe('When viewing Recordset app for a table with dynamic acls, ', function() {
        describe("when some of the displayed rows are not editable/deletable, ", function () {
            // NOTE recordset doesn't ask for tcrs and therefore cannot accurately guess the acl for id=5
            testRecordSetEditDelete("", 6, true, [true, false, false, true, true, true], [true, false, true, false, true, true]);
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
