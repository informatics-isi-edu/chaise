exports.getConfig = function(options) {
  var config = {
    sauceUser: process.env.SAUCE_USERNAME,
    sauceKey: process.env.SAUCE_ACCESS_KEY,
    framework: 'jasmine2',
    capabilities: {
      //browserName: 'internet explorer',
      //browserName: 'firefox',
      browserName: 'chrome',
      version: '60.0', //to specify the browser version
      //using firefox causes problems - not showing the right result and -
      //Apache log shows firefox is not requesting the server.
      'chromeOptions' : {
         args: ['--lang=en',
                '--window-size=1920,1920']
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
      defaultTimeoutInterval: 300000,
      print: function() {}
    },
    params: {
        // defaultTimeout: Used in tests where Protractor needs to wait for an element or where
        // the browser needs to do nothing for a while. Should not be >= 90000 since
        // Sauce Labs wil end the a session if it hasn't received a command from
        // test script in 90 seconds.
        defaultTimeout: 15000
    }
  };

  Object.assign(config, options);

  if (!options.configFileName && !options.testConfiguration) throw new Error("No configfile provided in protractor.conf.js");

  var testConfiguration = options.testConfiguration;
  if (options.configFileName) {
    var configFileName = options.configFileName;
    testConfiguration =  require('../data_setup/config/' + configFileName);
  }

  var dataSetup = require('./protractor.parameterize.js');

  // Look through schemaConfigurations, if any are strings (filenames), grab the json file and insert into the schemaConfigs array
  var schemaConfigs = testConfiguration.setup.schemaConfigurations;
  for (var i = 0; i < schemaConfigs.length; i++) {
      var schemaConfig = schemaConfigs[i];
      if (typeof schemaConfig === 'string') {
          schemaConfigs[i] = require(process.env.PWD + "/test/e2e/data_setup/config/" + schemaConfig);
      }
  }

  var dateSetupOptions = {
    testConfiguration: testConfiguration
  };
  if (options.page) dateSetupOptions.page = options.page;


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

  config.capabilities.shardTestFiles = (process.env.SHARDING == 'false' || process.env.SHARDING == false) ? false : true;
  config.capabilities.maxInstances = process.env.MAXINSTANCES || 4;

  if (options.parallel == false) {
    config.capabilities.shardTestFiles = false;
  }

  dataSetup.parameterize(config, dateSetupOptions);

  return config;
};
