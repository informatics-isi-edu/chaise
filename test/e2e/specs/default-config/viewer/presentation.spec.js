var chaisePage = require('../../utils/chaise.page.js');

describe('Viewer app', function() {

    var testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    it('should load custom CSS and document title defined in chaise-config.js', function() {
        var chaiseConfig, tupleParams = testParams.tuples[0], keys = [];
        browser.ignoreSynchronization = true;
        tupleParams.keys.forEach(function(key) {
            keys.push(key.name + key.operator + key.value);
        });
        browser.get(browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&"));
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
