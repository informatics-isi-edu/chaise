var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
  
  // Change this to your desired filed name and Comment below testConfiguration object declaration
    configFileName: 'search.dev.json',
  
  /* Just in case if you plan on not giving a file for configuration, you can always specify a testConfiguration object 
   * Comment above 2 lines
   * Empty configuration will run test cases against catalog 1 and default schema
    testConfiguration: { 
      ....
    },
  */

    page: '/search'
});

// If ng-app attribute is in a descendant of <body>, tell Protractor where ng-app is
config.rootElement = '#main-content',
// CHAISE_BASE_URL should be https://dev.misd.isi.edu/chaise for now.
config.baseUrl = process.env.CHAISE_BASE_URL + '/search'

exports.config = config;