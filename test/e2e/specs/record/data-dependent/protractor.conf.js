var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({

  // Change this to your desired filed name and Comment below testConfiguration object declaration
    configFileName: 'record.dev.json',

  /* Just in case if you plan on not giving a file for configuration, you can always specify a testConfiguration object
   * Comment above 2 lines
   * Empty configuration will run test cases against catalog 1 and default schema
    testConfiguration: {
      ....
    },
  */

    parallel: false,

    chaiseConfigFilePath: 'test/e2e/specs/record/data-dependent/chaise-config.js',

    page: 'record',
    setBaseUrl: function(browser, data) {
      browser.params.url = process.env.CHAISE_BASE_URL + "/record/#" + data.catalogId + "/" + data.schema.name;
      return browser.params.url;
    }
});

exports.config = config;
