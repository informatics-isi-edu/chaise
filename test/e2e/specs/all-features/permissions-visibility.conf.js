var pConfig = require('./../../utils/protractor.configuration.js');

var config = pConfig.getConfig({

    // Change this to your desired filed name and Comment below testConfiguration object declaration
    configFileName: 'multi-permissions.dev.json',
    specs: [
        "*/permissions-visibility.spec.js"
    ],
    setBaseUrl: function(browser, data) {
        browser.params.url = process.env.CHAISE_BASE_URL;
        return browser.params.url;
    },
    chaiseConfigFilePath: 'test/e2e/specs/all-features/chaise-config.js'
});

exports.config = config;
