exports.getConfig = function(options) {
  var config = {
    sauceUser: process.env.SAUCE_USERNAME,
    sauceKey: process.env.SAUCE_ACCESS_KEY,
    framework: 'jasmine2',
    capabilities: {
      //browserName: 'internet explorer',
      //browserName: 'firefox',
      //version: '40.0', //to specify the browser version
      browserName: 'chrome',
      //using firefox causes problems - not showing the right result and -
      //Apache log shows firefox is not requesting the server.
      'chromeOptions' : {
         args: ['--lang=en',
                '--window-size=2480,1920']
      }
    },
    specs: [
      '*.spec.js'
    ],
    jasmineNodeOpts: {
      showColors: true,
      defaultTimeoutInterval: 120000,
      print: function() {}
    }
  };

  if (!options.configFileName && !options.testConfiguration) throw new Error("No configfile provided in protractor.conf.js");
  if (!options.page) throw new Error("No page provided in protractor.conf.js");

  var testConfiguration = options.testConfiguration;
  if (options.configFileName) {
    var configFileName = options.configFileName;
    testConfiguration =  require('../data_setup/config/' + configFileName);
  }

  var dataSetup = require('./protractor.parameterize.js');

  var dateSetupOptions = {
    testConfiguration: testConfiguration, 
    page: options.page
  };


  if (typeof options.setBaseUrl == 'function') {
    dateSetupOptions.setBaseUrl = function(browser, data) {
      options.setBaseUrl(browser, data);
    } 
  }

  dataSetup.parameterize(config, dateSetupOptions);

  return config;
};
