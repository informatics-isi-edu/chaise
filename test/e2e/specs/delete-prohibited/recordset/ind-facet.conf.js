var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    configFileName: 'recordset/ind-facet.dev.json',
    chaiseConfigFilePath: 'test/e2e/specs/delete-prohibited/chaise-config.js',
    specs: [
        "misc-facet.spec.js"
    ],
    setBaseUrl: function(browser, data) {
      browser.params.url = process.env.CHAISE_BASE_URL;
      return browser.params.url;
    }
});

exports.config = config;
