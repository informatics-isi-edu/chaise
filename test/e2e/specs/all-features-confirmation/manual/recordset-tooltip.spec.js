var chaisePage = require('../../../utils/chaise.page.js');

describe('View recordset,', function () {
    beforeAll(function () {
        browser.ignoreSynchronization = true;
        browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-recordset:accommodation");

        chaisePage.waitForElement(element(by.id("divRecordSet")));
        chaisePage.recordsetPage.waitForAggregates();
    });

    // test to setup recordset table with long tooltip text and check the placement of tooltips manually
    it("should have correct placement of longer tooltip texts on column headers", function () {
        browser.sleep(500000);
    });
});