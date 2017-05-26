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

    it('should load custom CSS and document title defined in chaise-config.js', function() {
        var chaiseConfig, keys = [];
        browser.ignoreSynchronization = true;
        keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
        browser.get(browser.params.url + "/viewer/#" + browser.params.catalogId + "/product-viewer:" + testParams.table_name + "/" + keys.join("&"));
        browser.sleep(browser.params.defaultTimeout);
        browser.executeScript('return chaiseConfig').then(function(config) {
            chaiseConfig = config;
            return browser.executeScript('return $("link[href=\'' + chaiseConfig.customCSS + '\']")');
        }).then(function(elemArray) {
            expect(elemArray.length).toBeTruthy();
            return browser.getTitle();
        }).then(function(title) {
            expect(title).toEqual(chaiseConfig.headTitle);
        });
    });
});
