var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    configFileName: 'recordedit/add.dev.json',
    specs: [
        "add.spec.js"
    ],
    setBaseUrl: function(browser, data) {
      browser.params.url = process.env.CHAISE_BASE_URL;
      return browser.params.url;
  },
  chaiseConfigFilePath: 'test/e2e/specs/all-features-confirmation/chaise-config.js'
});

exports.config = config;
