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
      },
      'os': 'MacOS El Capitan 10.11',
      'platform': 'OS X 10.11',
      'screenResolution': '1920x1440'
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
  var chaiseFilePath  = "chaise-config-sample.js";
  if (typeof options.chaiseConfigFilePath === 'string') {
    try {
      var fs = require('fs');
      fs.accessSync(process.env.PWD + "/" + options.chaiseConfigFilePath);
      chaiseFilePath = options.chaiseConfigFilePath;
    } catch (e) { 
      console.log("Config file " + options.chaiseConfigFilePath  + " doesn't exists");
    }
  } 

  var execSync = require('child_process').execSync;
  var remoteChaiseDirPath = process.env.REMOTE_CHAISE_DIR_PATH;
  var cmd = 'sudo cp ' + ("/var/www/html/chaise/" + chaiseFilePath) + " " + ("/var/www/html/chaise/chaise-config.js");

  // The tests will take this path when it is not running on Travis and remoteChaseDirPath is not null
  if (typeof remoteChaiseDirPath == 'string') {
    cmd = 'scp ' + chaiseFilePath + ' ' + remoteChaiseDirPath  + '/chaise-config.js';
    console.log("Copying using scp");
  } else {
    console.log("Copying using cp on Travis");
  }


  var code = execSync(cmd);
  console.log(code);
  if (code == 0) console.log("Copied file " + chaiseFilePath + " successfully to chaise-config.js \n");
  else {
    console.log("Unable to copy file " + chaiseFilePath + " to chaise-config.js \n");
    process.exit(1);
  }

  dataSetup.parameterize(config, dateSetupOptions);

  return config;
};
