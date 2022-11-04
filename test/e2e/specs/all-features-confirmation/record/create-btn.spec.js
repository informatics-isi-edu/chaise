var chaisePage = require('../../../utils/chaise.page.js');
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

        beforeAll(function() {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
            browser.ignoreSynchronization=true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/product-create-btn:" + testParams.table_name + "/" + keys.join("&");
            browser.get(url);
            table = browser.params.defaultSchema.content.tables[testParams.table_name];
            chaisePage.waitForElement(element(by.id('tblRecord')));
        });

        it('should load chaise-config.js and have editRecord=true', function() {
            browser.executeScript('return chaiseConfig;').then(function(chaiseConfig) {
                expect(chaiseConfig.editRecord).toBe(true);
            });
        });

        describe("Click the create record button ,", function() {
            it("should redirect to recordedit app", function() {
                var EC = protractor.ExpectedConditions,
                    createButton = chaisePage.recordPage.getCreateRecordButton();

                browser.wait(EC.elementToBeClickable(createButton), browser.params.defaultTimeout);

                createButton.click().then(function() {
                    return browser.driver.getCurrentUrl();
                }).then(function(url) {
                    expect(url.indexOf('recordedit')).toBeGreaterThan(-1);
                });
            });
        });
    });
});
