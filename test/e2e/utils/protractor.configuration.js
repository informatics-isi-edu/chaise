exports.getConfig = function(options) {
  var config = {
    sauceUser: process.env.SAUCE_USERNAME,
    sauceKey: process.env.SAUCE_ACCESS_KEY,
    framework: 'jasmine2',
    // specify which chrome driver to use
    capabilities: {
      commandTimeout: 300,
      // idleTimeout: 90,
      //browserName: 'internet explorer',
      //browserName: 'firefox',
      browserName: 'chrome',
      version: 'latest', //to specify the browser version
      timeZone: 'Los_Angeles', // specify the timezone the browser should execute in
      //using firefox causes problems - not showing the right result and -
      //Apache log shows firefox is not requesting the server.
      chromeOptions: {
          // args is defined as empty so any additional args are "pushed" instead of replacing the object.
          // see conditions below for setting screen resolution and using headless mode
          args: [],
          // Set download path and avoid prompting for download even though
          // this is already the default on Chrome but for completeness
          prefs: {
              download: {
                  'prompt_for_download': false,
                  'default_directory': process.env.PWD + "/test/e2e/"
              }
          }
      },
      'platform': 'macOS 10.15',
      'screenResolution': '1280x960'
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
    },
    onPrepare: function() {
        /* global angular: false, browser: false, jasmine: false */

        // Disable animations so e2e tests run more quickly
        var disableNgAnimate = function() {
            angular.module('disableNgAnimate', []).run(['$animate', function($animate) {
                $animate.enabled(false);
            }]);
        };

        browser.addMockModule('disableNgAnimate', disableNgAnimate);
    }
  };

  if (config.capabilities.chromeOptions) {
    // setting screen size when running the tests locally to be consistent across different laptops and external displays
    // tests are currently optimzed for this screen size
    // this is the same as `screenResolution` above to make sure we test the same in CI environment as locally
    if (!process.env.CI) {
      config.capabilities.chromeOptions.args.push('--window-size=1280,960');
    }

    // using chrome in headless mode
    // environment variables are of type "string" so verify the value is the string "true" instead of boolean true
    if (process.env.HEADLESS == "true") {
      config.capabilities.chromeOptions.args.push('--headless');
      config.capabilities.chromeOptions.args.push('--disable-gpu');
    }
  }

  Object.assign(config, options);

  if (!options.configFileName && !options.testConfiguration) throw new Error("No configfile provided in protractor.conf.js");

  var testConfiguration = options.testConfiguration;
  if (options.configFileName) {
    var configFileName = options.configFileName;
    if(options.manualTestConfig) {
      testConfiguration =  require('../../manual/data_setup/config/' + configFileName);
    } else {
      testConfiguration =  require('../data_setup/config/' + configFileName);
    }
  }

  var dataSetup = require('./protractor.parameterize.js');

  // Look through schemaConfigurations, if any are strings (filenames), grab the json file and insert into the schemaConfigs array
  var schemaConfigs = testConfiguration.setup.schemaConfigurations;
  for (var i = 0; i < schemaConfigs.length; i++) {
      var schemaConfig = schemaConfigs[i];
      if (typeof schemaConfig === 'string') {
        if(options.manualTestConfig) {
          schemaConfigs[i] = require(process.env.PWD + "/test/manual/data_setup/config/" + schemaConfig);
        } else {
          schemaConfigs[i] = require(process.env.PWD + "/test/e2e/data_setup/config/" + schemaConfig);
        }
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
  var cmd = 'sudo cp ' + chaiseFilePath + " " + ("/var/www/html/chaise/chaise-config.js");

  // The tests will take this path when it is not running on CI and remoteChaseDirPath is not null
  if (typeof remoteChaiseDirPath == 'string') {
    cmd = 'scp ' + chaiseFilePath + ' ' + remoteChaiseDirPath  + '/chaise-config.js';
    console.log("Copying using scp");
  } else {
    console.log("Copying using cp");
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
