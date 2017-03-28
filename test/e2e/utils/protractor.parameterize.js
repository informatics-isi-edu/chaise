
exports.parameterize = function(config, configParams) {

  if ((typeof configParams != 'object') || (!configParams.page)) {
    throw new Error("Invalid testConfiguration path provided for protractor parameterization in protractor config");
  }

  var testConfiguration = configParams.testConfiguration || {};

  testConfiguration.authCookie = process.env.AUTH_COOKIE;
  var pImport = require('../utils/protractor.import.js');

  var catalogId = null, Q = require('q');

  var launchPromise;

  if (process.env.TRAVIS) {
    console.log("In TRAVIS");
    config.sauceUser = process.env.SAUCE_USERNAME
    config.sauceKey = process.env.SAUCE_ACCESS_KEY
    config.capabilities['tunnel-identifier'] =  process.env.TRAVIS_JOB_NUMBER;
    config.capabilities['build'] = process.env.TRAVIS_BUILD_NUMBER;
    config.capabilities['name'] = "chaise #" + process.env.TRAVIS_BUILD_NUMBER;
  }

  var onErmrestLogin = function(defer) {
    
    testConfiguration.setup.url = process.env.ERMREST_URL;
    testConfiguration.setup.authCookie = testConfiguration.authCookie;

    pImport.setup(testConfiguration).then(function(data) {

      process.env.CATALOGID = data.catalogId;

      defer.resolve();
      
    }, function(err) {
      process.env.CATALOGID = catalogId = err.catalogId;
      console.log(err);
      defer.reject(new Error("Unable to import data"));
    });

  };

  config.beforeLaunch = function() {
    var  defer = Q.defer();

    if (process.env.TRAVIS) {
      var exec = require('child_process').exec;
      exec("hostname", function (error, stdout, stderr) {
          
          process.env.ERMREST_URL = "http://" + stdout.trim() + "/ermrest";
          process.env.CHAISE_BASE_URL = "http://" + stdout.trim() + "/chaise";
          
          require('request')({
              url:  process.env.ERMREST_URL.replace('ermrest', 'authn') + '/session',
              method: 'POST',
              body: 'username=test1&password=dummypassword'
          }, function(error, response, body) {
              if (!error && response.statusCode == 200) {
                var cookies = require('set-cookie-parser').parse(response);
                cookies.forEach(function(c) {
                  if (c.name == "webauthn") testConfiguration.authCookie = c.name + "=" + c.value + ";";
                });
                if (testConfiguration.authCookie) {
                  process.env.AUTH_COOKIE = testConfiguration.authCookie;
                  onErmrestLogin(defer);
                } else defer.reject(error);
              } else {
                console.dir(error);
                defer.reject(error);
              }
          });
        });
    } else {
      onErmrestLogin(defer);
    }

    console.log("In beforeLaunch");

    return defer.promise;
  };

  // This method will be called before starting to execute the test suite
  config.onPrepare = function() {

    var SpecReporter = require('jasmine-spec-reporter');
    // add jasmine spec reporter
    jasmine.getEnv().addReporter(new SpecReporter({displayStacktrace: 'all'}));

    browser.params.configuration = testConfiguration, defer = Q.defer();
    
    // Set catalogId in browser params for future reference to delete it if required
    browser.params.catalogId = catalogId = process.env.CATALOGID;
    
    if (process.env.AUTH_COOKIE) {
      testConfiguration.authCookie = process.env.AUTH_COOKIE;
    }

    pImport.fetchSchemas(testConfiguration, catalogId).then(function(data) {

        // Set schema returned in browser params for refering it in test cases
        browser.params.schema = data.defaultSchema;
        browser.params.catalog = data.catalog;
        browser.params.defaultSchema = data.defaultSchema;
        browser.params.defaultTable = data.defaultTable;
        browser.params.catalogId = data.catalogId;

        // Set the base url to the page that we are running the tests for
        browser.baseUrl = process.env.CHAISE_BASE_URL + configParams.page;

        // set the url for testcases to stat using the catalogId and schema that was mentioned in the configuration
        if (typeof configParams.setBaseUrl == 'function') configParams.setBaseUrl(browser, data);
        else browser.params.url = browser.baseUrl + "/#" + data.catalogId + "/schema/" + data.defaultSchema.name;

        // Visit the default page and set the authorization cookie if required
        if (testConfiguration.authCookie) {
          console.log("setting up cookie");
          require('./chaise.page.js').performLogin(testConfiguration.authCookie, defer);
        } else {
          defer.resolve();
        }
    }, function(err) {
        defer.reject({ catalogId: catalogId });
    });

    
    return defer.promise;
  };

  // This method will be called after executing the test suite
  config.afterLaunch = function(exitCode) {
    catalogId = process.env.CATALOGID;
    console.log("catalogId:" + catalogId);
    // If cleanup is true and setup was also true in the configuration then
    // call cleanup to remove the created schema/catalog/tables if catalogId is not null
    if (testConfiguration.cleanup && testConfiguration.setup && catalogId != null) return pImport.tear(testConfiguration, catalogId);
  };

  // If an uncaught exception is caught then simply call cleanup
  // to remove the created schema/catalog/tables if catalogId is not null
  process.on('uncaughtException', function (err) {
    catalogId = process.env.CATALOGID;
    console.log("in error : catalogId " + catalogId);
    console.dir(err);
    var cb = function() {
      console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
      console.error(err.stack);
      process.exit(1)
    };
    if (!process.catalogDeleted && testConfiguration.cleanup && testConfiguration.setup && catalogId != null)  pImport.tear(testConfiguration, catalogId).then(cb, cb);
    else cb();

  });

  process.on('SIGINT', function(code) {
    catalogId = process.env.CATALOGID;
    if (!process.catalogDeleted) {
        process.catalogDeleted = true;
        console.log('About to exit because of SIGINT (ctrl + c)');
        pImport.tear(testConfiguration, catalogId).done(function() {
          process.exit(1);
        });
    } else {
      process.exit(1);
    }
  });

};
