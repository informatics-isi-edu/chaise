var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    configFileName: 'record/dev.json',
    specs: [
        "presentation.spec.js"
        //"create-btn.spec.js",
        //"delete-btn.spec.js",
        //"edit-btn.spec.js"
    ],
    setBaseUrl: function(browser, data) {
      browser.params.url = process.env.CHAISE_BASE_URL;
      return browser.params.url;
  },
  chaiseConfigFilePath: 'test/e2e/specs/all-features-confirmation/chaise-config.js'
});

exports.config = config;
