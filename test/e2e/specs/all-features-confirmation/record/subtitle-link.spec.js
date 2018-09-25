var chaisePage = require('../../../utils/chaise.page.js');
var EC = protractor.ExpectedConditions;
var testParams = {
    table_name: "accommodation",
    key: {
        name: "id",
        value: "2002",
        operator: "="
    }
};

describe('View existing record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        var table, record;

        beforeAll(function () {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
            browser.ignoreSynchronization=true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/product-record:" + testParams.table_name + "/" + keys.join("&");
            browser.get(url);
            table = browser.params.defaultSchema.content.tables[testParams.table_name];
            chaisePage.waitForElement(element(by.id('tblRecord')));
        });

        describe("Click the subtitle ,", function() {
            it("should redirect to recordset app", function() {

                var subtitleLink = chaisePage.recordPage.getEntitySubTitleLink();

                browser.wait(EC.elementToBeClickable(subtitleLink), browser.params.defaultTimeout);

                subtitleLink.click().then(function() {
                    return browser.driver.getCurrentUrl();
                }).then(function(url) {
                    expect(url.indexOf('recordset')).toBeGreaterThan(-1);
                });
            });
        });
    });
});
