var pConfig = require('./../../e2e/utils/protractor.configuration.js');

var config = pConfig.getConfig({
    manualTestConfig: true,
    configFileName: 'dev-recordset.json',
    specs: [
        "recordset.spec.js"
    ],
    setBaseUrl: function(browser, data) {
        browser.params.url = process.env.CHAISE_BASE_URL;
        return browser.params.url;
    }
});

exports.config = config;

