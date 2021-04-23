var pImport =  require('../../../utils/protractor.import.js');
var chaisePage = require('../../../utils/chaise.page.js');
var recordPage = chaisePage.recordPage;
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

describe('When viewing Record app for a table with dynamic acls, ', function() {
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

    describe("when the row can be edited and deleted, ", function () {
        testRecordEditDelete(testParams.row_ids.editable_deletable, true, true);
    });

    describe("when the row cannot be edited or deleted, ", function () {
        // in this case none of the buttons show up (no edit, no delete, no create)
        beforeAll(function () {
            browser.ignoreSynchronization = true;
            browser.get(getRecordURL(testParams.row_ids.non_edit_non_delete));
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
        testRecordEditDelete(testParams.row_ids.non_edit_deletable, false, true);
    });

    describe("when the row can be edited but not deleted, ", function () {
        testRecordEditDelete(testParams.row_ids.editable_non_delete, true, false);
    });

    describe("when all the columns in a row are not editable, ", function () {
        testRecordEditDelete(testParams.row_ids.all_vis_col_non_edit, false, true);
    });

    describe("when some of the columns in a row are not editable, ", function () {
        testRecordEditDelete(testParams.row_ids.some_vis_col_non_edit, true, true);
    });

    describe("when the related tables have dynamic acls, ", function () {
        beforeAll(function () {
            browser.ignoreSynchronization = true;
            browser.get(getRecordURL(testParams.related.main_id));
            chaisePage.recordPageReady();
        });

        describe("for a related table, ", function () {
            it ("rows should be displayed properly", function () {
                expect(recordPage.getRelatedTableRows(testParams.related.inbound_displayname).count()).toBe(4);
            });

            it ("Edit button should display based on related table acls,", function () {
                testRelatedEdit(testParams.related.inbound_displayname, [true, false, false, true]);
            });

            it ("Delete button should display based on related table acls", function () {
                testRelatedDelete(testParams.related.inbound_displayname, [true, false, true, false]);
            });
        });

        describe("for an association table, ", function () {
            it ("rows should be displayed properly", function () {
                expect(recordPage.getRelatedTableRows(testParams.related.assoc_displayname).count()).toBe(2);
            });

            it ("Edit button should display based on related table acls,", function () {
                testRelatedEdit(testParams.related.assoc_displayname, [true, false]);
            });

            it ("Unlink button should display based on association table acls", function () {
                testRelatedDelete(testParams.related.assoc_displayname, [false, true]);
            });
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
