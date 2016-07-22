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

//Change this to your desired filed name and Comment below testConfiguration object declaration
var configFileName = 'recordedit.dev.json';
var testConfiguration =  require('../../../data_setup/config/' + configFileName);

// Just in case if you plan on not giving a file for configuration, you can always specify a testConfiguration object 
// Comment above 2 lines
// Empty configuration will run test cases against catalog 1 and default schema
//var testConfiguration = { };

var dataSetup = require('../../../utils/protractor.parameterize.js');
dataSetup.parameterize(config, { 
  testConfiguration: testConfiguration, 
  page: '/recordedit', 
  setBaseUrl: function(browser, data) {
    browser.params.url = process.env.CHAISE_BASE_URL + "/recordedit" + "/#" + data.catalogId + "/" + data.schema.name;
    return browser.params.url;
  } 
});

exports.config = config;