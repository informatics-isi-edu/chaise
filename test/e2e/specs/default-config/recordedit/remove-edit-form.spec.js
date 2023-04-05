var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var testParams = {
    table_name: "multi-edit-table",
    filter: {
        key: "int",
        operator: "=",
        value: "23"
    },
    original_rows: 11,
    rows_after: 9,
    remove_row_modal:{
        title: "Confirm Form Removal",
        body: "Are you sure you want to remove this record from the edit form?\nNote: Removing a record from this form, will not delete the record from the database.",
        button_text: "Remove"
    }
};

describe('Edit a record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        var record;

        beforeAll(function () {
            var filters = [];
            filters.push(testParams.filter.key + testParams.filter.operator + testParams.filter.value);
            chaisePage.navigate(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-edit:" + testParams.table_name + "/" + filters.join("&"));
            chaisePage.recordeditPageReady();
        });

        it("remove 2 forms and edit some of the data", function(done) {
            // verify number of rows is what we expect
            chaisePage.recordEditPage.getRecordeditForms().count().then(function(ct) {
                expect(ct).toBe(testParams.original_rows, "incorrect number of rows to edit");

                return chaisePage.recordEditPage.getAllDeleteRowButtons();
            }).then(function(buttons) {
                expect(buttons.length).toBe(testParams.original_rows, "incorrect number of remove buttons");

                // remove the 4th row
                return chaisePage.recordEditPage.getDeleteRowButton(3);
            }).then(function (button) {
                return chaisePage.clickButton(button);
            }).then(function () {
                return chaisePage.recordEditPage.getRecordeditForms().count();
            }).then(function (ct) {
                expect(ct).toBe(testParams.original_rows - 1, "number of rows is incorrect after removing 1");

                // remove the 6th row (7th row in the original set)
                return chaisePage.recordEditPage.getDeleteRowButton(5);
            }).then(function (button) {
                return chaisePage.clickButton(button);
            }).then(function () {
                // verify number of forms is expected
                return chaisePage.recordEditPage.getRecordeditForms().count();
            }).then(function(ct) {
                expect(ct).toBe(testParams.rows_after, "incorrect number of rows to edit after removing 2");

                //change a value in 1 form
                var textInput = chaisePage.recordEditPage.getInputForAColumn('text', 1);
                chaisePage.recordEditPage.clearInput(textInput);
                textInput.sendKeys("changed text");

                done();
            }).catch(function (error) {
                console.dir(error);
                done.fail();
            });
        });

        describe("Submit record", function() {
            beforeAll(function() {
                // Submit the form
                chaisePage.recordEditPage.submitForm();
            });


            it("should change the view to the resultset table.", function() {
                browser.driver.getCurrentUrl().then(function(url) {
                    expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true, "page changed away from recordedit resultset view");
                });
            });

            it("should have the correct table rows.", function() {
                browser.wait(function() {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return (ct == testParams.rows_after);
                    });
                }, browser.params.defaultTimeout);

                expect(chaisePage.recordsetPage.getRows().count()).toBe(testParams.rows_after, "incorrect number of rows in resultset view");
            });
        });

    });
});
