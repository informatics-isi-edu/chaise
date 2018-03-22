var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    configFileName: 'record/related-table/dev.json',
    chaiseConfigFilePath: 'test/e2e/specs/all-features/chaise-config.js',
    specs: [
        "related-table.spec.js",
    ],
    setBaseUrl: function(browser, data) {
      browser.params.url = process.env.CHAISE_BASE_URL;
      return browser.params.url;
    }
});

exports.config = config;
