var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    configFileName: 'recordedit/composite-key.dev.json',
    chaiseConfigFilePath: 'test/e2e/specs/default-config/chaise-config.js',
    specs: [
        "composite-key.spec.js"
    ],
    setBaseUrl: function(browser, data) {
      browser.params.url = process.env.CHAISE_BASE_URL;
      return browser.params.url;
    }
});

exports.config = config;
