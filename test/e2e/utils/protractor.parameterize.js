exports.parameterize = function(config, configParams) {

  if ((typeof configParams != 'object') || (!configParams.page)) {
    throw new Error("Invalid testConfiguration path provided for protractor parameterization in protractor config");
  }

  var testConfiguration = configParams.testConfiguration || {};

  testConfiguration.authCookie = process.env.AUTH_COOKIE;
  var pImport = require('../utils/protractor.import.js');

  var catalogId = null, Q = require('q'); 

  // This method will be called before starting to execute the test suite
  config.onPrepare = function() {
    browser.params.configuration = testConfiguration, defer = Q.defer();

    if (testConfiguration.dataSetup) {

      testConfiguration.dataSetup.url = process.env.CHAISE_BASE_URL.replace('chaise', 'ermrest/');
      testConfiguration.dataSetup.authCookie = testConfiguration.authCookie;

      pImport.setup(testConfiguration).then(function(data) {

        catalogId = data.catalogId;

        // Set catalogId in browser params for future reference to delete it if required
        browser.params.catalogId = catalogId = data.catalogId;

        // Set schema returned in browser params for refering it in test cases
        browser.params.schema = schema = data.schema;
        browser.params.defaultSchema = data.defaultSchema;
        browser.params.defaultTable = data.defaultTable;

        // Set the base url to the page that we are running the tests for
        browser.baseUrl = process.env.CHAISE_BASE_URL + configParams.page;

        // Visit the default page and set the authorization cookie if required
        browser.get("");
        browser.sleep(3000);
        if (testConfiguration.authCookie)  browser.driver.executeScript('document.cookie="' + testConfiguration.authCookie + 'path=/;secure;"');
        
        // set the url for testcases to stat using the catalogId and schema that was mentioned in the configuration
        browser.params.url = browser.baseUrl + "/#" + catalogId + "/schema/" + data.schema.name;

        defer.resolve();
      }, function(err) {
        catalogId = err.catalogId;
        throw "Unable to import data";
      });
    } else {
      console.log("Fetching schemas");
      return pImport.fetchSchemas(testConfiguration).then(function(data) {
        // Set schema returned in browser params for refering it in test cases
        browser.params.schema = data.defaultSchema;
        browser.params.defaultSchema = data.defaultSchema;
        browser.params.defaultTable = data.defaultTable;
      }, function(err) {
        catalogId = err.catalogId;
        throw err;
      });
    }

    return defer.promise;
  };

  // This method will be called after executing the test suite
  config.afterLaunch = function(exitCode) {
    // If cleanup is true and dataSetup was also true in the configuration then
    // call cleanup to remove the created schema/catalog/tables if catalogId is not null
    if (testConfiguration.cleanup && testConfiguration.dataSetup && catalogId != null) return pImport.tear(testConfiguration, catalogId);
  };

  // If an uncaught exception is caught then simply call cleanup 
  // to remove the created schema/catalog/tables if catalogId is not null
  process.on('uncaughtException', function (err) {
    var cb = function() {
      console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
      console.error(err.stack);
      process.exit(1)
    };

    if (testConfiguration.cleanup && testConfiguration.dataSetup && catalogId != null)  pImport.tear(testConfiguration, catalogId).then(cb, cb);
    else cb();
    
  });

};