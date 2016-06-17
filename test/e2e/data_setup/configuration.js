exports.parameterize = function(config, configParam, page) {
  var testConfiguration = require('./config/' + ( process.env.TestConfig || 'dev.isrd.json'))[configParam];
  var dataSetupCode = require("./import.js");
  var catalogId = null, schema = null, Q = require('q'); 

  var cleanup = function() {
    var cleanupDone = false;

    dataSetupCode.tear({
      url: process.env.CHAISE_BASE_URL.replace('chaise', 'ermrest/'),
      catalogId: catalogId,
      dataSetup: testConfiguration.dataSetup
    }).done(function() {
      cleanupDone = true;
    });

    return browser.wait(function() {
      return cleanupDone;
    }, 5000);
  };

  var fetchSchemas = function(cb) {
    catalogId = catalogId || 1;
    var done = false;
    
    dataSetupCode.introspect({
      url: process.env.CHAISE_BASE_URL.replace('chaise', 'ermrest/'),
      catalogId: catalogId || 1,
      authCookie: testConfiguration.authCookie
    }).then(function(schema) {
      browser.params.defaultSchema = schema;
      browser.params.defaultTable = schema.defaultTable;
      done = true;
    }, function(err) {
      throw new Error("Unable to fetch schemas");
    });

    return browser.wait(function() {
      return done;
    }, 3000).then(function() {
      if (typeof  cb == 'function') cb();
      else browser.params.url = browser.baseUrl + "/#" + catalogId + "/";
    }, function(err) {
      throw err;
    });
  };

  config.onPrepare = function() {
    browser.params.configuration = testConfiguration;
    
    if (testConfiguration.dataSetup) {
      var setupDone = false, successful = false;
      testConfiguration.dataSetup.url = process.env.CHAISE_BASE_URL.replace('chaise', 'ermrest/');
      
      dataSetupCode.setup(testConfiguration.dataSetup).then(function(data) {
        setupDone = true;
        catalogId = data.catalogId;
        browser.params.schema = schema = data.schema;
        successful = true
      }, function(err) {
        catalogId = err.catalogId || null; 
        setupDone = true;
      });

      browser.wait(function() {
        return setupDone;
      }, 120000).then(function() {
        
        if (successful) {
          fetchSchemas(function() {
            browser.baseUrl = process.env.CHAISE_BASE_URL + page;
            browser.get("");
            browser.sleep(3000);
            browser.driver.executeScript('document.cookie="' + testConfiguration.dataSetup.authCookie + 'path=/;secure;"');
            browser.params.url = browser.baseUrl + "/#" + catalogId + "/schema/" + schema.name;
          });
        } else {
          throw new Error("\n===========================\nCouldn't import data\n=========================");
        }
      }, function() {
          throw new Error("\n===========================\nNo catalog created in specified time\n=========================");
      });
    } else {
      return fetchSchemas();
    }
  };

  config.afterLaunch = function(exitCode) {
    if (testConfiguration.cleanup && testConfiguration.dataSetup && catalogId != null) return cleanup();
  };

  process.on('uncaughtException', function (err) {
    var cb = function() {
      console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
      console.error(err.stack);
      process.exit(1)
    };

    if (testConfiguration.cleanup && testConfiguration.dataSetup && catalogId != null) {
      cleanup().then(function() {
        cb();
      }, function() {
        cb();
      });
    } else {
      cb();
    }
   
  });
};