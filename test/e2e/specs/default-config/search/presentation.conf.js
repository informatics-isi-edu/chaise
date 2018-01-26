var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    configFileName: 'search/dev.json',
    chaiseConfigFilePath: 'test/e2e/specs/default-config/chaise-config.js',
    specs: [
        "presentation.spec.ignored.js"
    ],
    setBaseUrl: function(browser, data) {
        browser.params.url = process.env.CHAISE_BASE_URL;
        return browser.params.url;
    }
});

// If ng-app attribute is in a descendant of <body>, tell Protractor where ng-app is
config.rootElement = '#main-content';

exports.config = config;
