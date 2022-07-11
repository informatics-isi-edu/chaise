var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
  // Change this to your desired filed name and Comment below testConfiguration object declaration
    configFileName: 'navbar/catalog-chaise-config.dev.json',

  /* Just in case if you plan on not giving a file for configuration, you can always specify a testConfiguration object
   * Comment above 2 lines
   * Empty configuration will run test cases against catalog 1 and default schema
   */
  specs: [
    "catalog-chaise-config.spec.js"
  ],
    // testConfiguration: {},
    setBaseUrl: function(browser, data) {
      browser.params.url = process.env.CHAISE_BASE_URL;
      return browser.params.url;
    },
	// Specify chaiseConfigPath
    chaiseConfigFilePath: 'test/e2e/specs/delete-prohibited/chaise-config.js'
});

exports.config = config;
