var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    table_name: "accommodation",
    key: {
        name: "id",
        value: "2001",
        operator: "="
    }
};

describe('Viewer app', function() {

    it('should load without any errors.', function() {
        var chaiseConfig, keys = [];
        browser.ignoreSynchronization = true;
        keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
        browser.get(browser.params.url + "/viewer/#" + browser.params.catalogId + "/product-viewer:" + testParams.table_name + "/" + keys.join("&"));
        chaisePage.waitForElement(element(by.id("viewer-container")));
        expect(element(by.css(".modal-error")).isPresent()).toBe(false);
    });
});
