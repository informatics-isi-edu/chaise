var pConfig = require('./../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    // This config is meant to be run as part of the parallel tests configuration
    configFileName: 'parallel-configs/default-config.dev.json',
    specs: [
        "*/*.spec.js"
    ],
    setBaseUrl: function(browser, data) {
        browser.params.url = process.env.CHAISE_BASE_URL;
        return browser.params.url;
    },
    chaiseConfigFilePath: 'test/e2e/specs/default-config/chaise-config.js'
});

exports.config = config;
