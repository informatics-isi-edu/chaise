var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    configFileName: 'record-copy-btn.dev.json',
    specs: [
        "copy-btn.spec.js"
    ],
    setBaseUrl: function(browser, data) {
      browser.params.url = process.env.CHAISE_BASE_URL;
      return browser.params.url;
  },
  chaiseConfigFilePath: 'test/e2e/specs/record/copy-btn/chaise-config.js'
});

exports.config = config;
