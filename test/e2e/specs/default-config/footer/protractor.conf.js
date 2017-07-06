//footer
var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    configFileName: 'sample.json',
    specs: [
        "footer.spec.js"
    ],
    page: 'search',

    setBaseUrl: function(browser, data) {
      browser.params.url = process.env.CHAISE_BASE_URL;
      return browser.params.url;
    },
	// Specify chaiseConfigPath
    chaiseConfigFilePath: 'test/e2e/specs/footer/chaise-config.js'
});
config.rootElement = '#main-content';
exports.config = config;
