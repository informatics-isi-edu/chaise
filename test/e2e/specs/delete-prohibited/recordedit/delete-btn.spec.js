var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    table_name: "accommodation",
    key: {
        name: "id",
        value: "4004",
        operator: "="
    }
}

describe('Delete existing record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        var table, record;

        beforeAll(function () {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/product-delete:" + testParams.table_name + "/" + keys.join("&"));
            table = browser.params.defaultSchema.content.tables[testParams.table_name];

            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                return chaisePage.recordEditPage.getViewModelRows()
            }).then(function(records) {
                browser.params.record = record = records[0];
                table.column_definitions.forEach(function(c) {
                    if (record[c.name]) {
                        if (c.type.typename !== "date" && c.type.typename !== "timestamptz") {
                            c._value =  record[c.name] + "";
                        }
                    }
                });
            });
        });

        describe("delete existing record ", function () {
            it("should load chaise-config.js and have deleteRecord=false", function () {
                browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                    expect(chaiseConfig.deleteRecord).toBe(false);
                });
            });

            it('should not display a delete record button', function() {
                var deleteBtn = chaisePage.recordPage.getDeleteRecordButton();
                expect(deleteBtn.isPresent()).toBeFalsy();
            });
        });
    });
});
