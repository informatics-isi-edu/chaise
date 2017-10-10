var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    table_name: "main",
    openFacetNames: [ 'id', 'int_col', 'to_name' ]
}

describe('Delete existing record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        var table, record;

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/faceting:" + testParams.table_name);
            chaisePage.waitForElementInverse(element(by.id("spinner")));
        });

        it("should have 3 facets open", function () {
            chaisePage.recordsetPage.getOpenFacets().count().then(function (ct) {
                expect(ct).toBe(3, "Number of open facets is incorrect");

                return chaisePage.recordsetPage.getOpenFacetTitles();
            }).then(function (text) {
                expect(text).toEqual(testParams.openFacetNames, "Names of open facets are incorrect");
            });
        });

        it("should have 2 filters selected", function () {
            chaisePage.recordsetPage.getFilters().count().then(function (ct) {  
                expect(ct).toBe(2, "Number of visible filters is incorrect");
            });
        });

        it("should have 1 row visible", function () {
            chaisePage.recordsetPage.getRows().count().then(function (ct) {
                expect(ct).toBe(1, "Number of visible rows is incorrect");
            });
        });

        it("should show 25 rows and 0 filters after clicking 'clear all'", function () {
            chaisePage.recordsetPage.getClearAllFilters().click().then(function () {
                return chaisePage.waitForElementInverse(element(by.id("spinner")));
            }).then(function () {
                return chaisePage.recordsetPage.getRows().count();
            }).then(function (ct) {
                expect(ct).toBe(25, "Number of visible rows is incorrect");

                return chaisePage.recordsetPage.getFilters().count();
            }).then(function (ct) {
                expect(ct).toBe(0, "Number of visible filters is incorrect");
            });
        });
    });
});
