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

  var remoteChaiseDirPath = process.env.REMOTE_CHAISE_DIR_PATH;
  if (typeof remoteChaiseDirPath !== 'string') {
    var fsExtra = require('fs-extra');
    try {
      fsExtra.copySync(process.env.PWD + "/" + chaiseFilePath, process.env.PWD + "/chaise-config.js", { encoding: 'utf8' });
      console.log("Copied file " + chaiseFilePath + " successfully to chaise-config.js \n");
    } catch (err) {
      console.error(err);
      console.log("Unable to copy file " + chaiseFilePath + " to chaise-config.js \n");
      process.exit(1);
    }
  } else {
    var execSync = require('child_process').execSync;
    var code = execSync('scp ' + chaiseFilePath + ' ' + remoteChaiseDirPath  + '/chaise-config.js');
    console.log(code);
    if (code == 0) console.log("Copied file " + chaiseFilePath + " successfully to chaise-config.js \n");
    else {
      console.log("Unable to copy file " + chaiseFilePath + " to chaise-config.js \n");
      process.exit(1);
    }
  }

  dataSetup.parameterize(config, dateSetupOptions);

  return config;
};
