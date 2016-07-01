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
              '--window-size=1280,1024']
    }
  },
  specs: [
    '*.spec.js'
  ],
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 120000,
    print: function() {}
  },
  // If ng-app attribute is in a descendant of <body>, tell Protractor where ng-app is
  rootElement: '#main-content',
  // CHAISE_BASE_URL should be https://dev.misd.isi.edu/chaise for now.
  baseUrl: process.env.CHAISE_BASE_URL + '/search'
};

//Change this to your desired filed name and Comment below testConfiguration object declaration
var configFileName = 'search.dev.json';
var testConfiguration =  require('../../data_setup/config/' + configFileName);

// Just in case if you plan on not giving a file for configuration, you can always specify a testConfiguration object 
// Comment above 2 lines
// Empty configuration will run test cases against catalog 1 and default schema
//var testConfiguration = { };

var dataSetup = require('../../utils/protractor.parameterize.js');
dataSetup.parameterize(config, { testConfiguration: testConfiguration, page: '/search' });

exports.config = config;
