var config = {
  sauceUser: process.env.SAUCE_USERNAME,
  sauceKey: process.env.SAUCE_ACCESS_KEY,
  framework: 'jasmine2',
  capabilities: {
    browserName: 'chrome',
    'chromeOptions' : {
       args: ['--lang=en',
              '--window-size=1280,1024']
    }
  },
  specs: [
    '*.spec.js'
  ],
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 120000
  },
  // If ng-app attribute is in a descendant of <body>, tell Protractor where ng-app is
  rootElement: '#main-content',
  // CHAISE_BASE_URL should be https://dev.misd.isi.edu/chaise for now.
  baseUrl: process.env.CHAISE_BASE_URL + '/search'
};


//Change this to your desired filed name and Comment below testConfiguration object declaration
//var configFileName = 'detailed.dev.json';
//var testConfiguration =  require('../../data_setup/config/' + configFileName);

// Just in case if you plan on not giving a file for configuration, you can always specify a testConfiguration object
// Comment above 2 lines
// Empty configuration will run test cases against catalog 1 and default schema
var testConfiguration = { };

var dataSetup = require('../../../utils/protractor.parameterize.js');
dataSetup.parameterize(config, { testConfiguration: testConfiguration , page: '/search' });

exports.config = config;
