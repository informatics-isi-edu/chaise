var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    configFileName: 'related-table/dev.json',
    specs: [
        "*.spec.js"
    ],
    setBaseUrl: function(browser, data) {
      browser.params.url = process.env.CHAISE_BASE_URL;
      return browser.params.url;
    }
});

exports.config = config;
