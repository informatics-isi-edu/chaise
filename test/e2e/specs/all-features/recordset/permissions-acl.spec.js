var pImport =  require('../../../utils/protractor.import.js');
var chaisePage = require('../../../utils/chaise.page.js');
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
 */
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

describe('When viewing Recordset app for a table with dynamic acls, ', function() {
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

    describe("when some of the displayed rows are not editable/deletable, ", function () {
        testRecordSetEditDelete("", 6, true, [true, false, false, true, false, true], [true, false, true, false, true, true]);
    });

    describe("when none of the displayed rows are editable, ", function () {
        testRecordSetEditDelete("id=2;id=3", 2, false, [false, false], [false, true]);
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
