exports.parameterize = function(config, configParam, page) {
  var testConfiguration = require('./config/' + ( process.env.TestConfig || 'dev.isrd.json'))[configParam];
  var catalogId = null, data = null; 
  var dataSetupCode = require("./import.js");

  config.onPrepare = function() {
    if (testConfiguration.dataSetup) {
      var codeDone = false, successful = false;
      testConfiguration.dataSetup.url = process.env.CHAISE_BASE_URL.replace('chaise', 'ermrest/');
      
      dataSetupCode.setup(testConfiguration.dataSetup).then(function(data) {
        codeDone = true;
        catalogId = data.catalogId;
        data = data;
        successful = true
      }, function(err) {
        catalogId = err.catalogId || null; 
        codeDone = true;
      });

      browser.wait(function() {
        return codeDone;
      }, 120000).then(function(data) {
        
        if (successful) {
          browser.params.schema = data.schema;
          browser.baseUrl = process.env.CHAISE_BASE_URL + page;
          browser.get("");
          browser.wait(function() {
            return false;
          }, 3000).then(null, function() {
            browser.driver.executeScript('document.cookie="' + testConfiguration.dataSetup.authCookie + 'path=/;secure;"');
            browser.params.url = browser.baseUrl + "/#" + catalogId + "/legacy";
          });
        } else {
          if (catalogId != null) {
            codeDone = false;
            dataSetupCode.tear({
              url: process.env.CHAISE_BASE_URL.replace('chaise', 'ermrest/'),
              authCookie: testConfiguration.dataSetup.authCookie,
              catalogId: catalogId
            }).done(function() {
              codeDone = true;
            });

            return browser.wait(function() {
              return codeDone;
            }, 2000).then(function() {
              throw new Error("\n===========================\nCouldn't import data\n=========================");
            });
          } else {
            throw new Error("\n===========================\nCouldn't import data\n=========================");
          }
        }
      }, function() {
        if (catalogId != null) {
          codeDone = false;
          dataSetupCode.tear({
            url: process.env.CHAISE_BASE_URL.replace('chaise', 'ermrest/'),
            authCookie: authCookie,
            catalogId: catalogId
          }).done(function() {
            codeDone = true;
          });

          return browser.wait(function() {
            return codeDone;
          }, 2000).then(function() {
            throw new Error("\n===========================\nNo catalog created in specified time\n=========================");
          });
        } else {
          throw new Error("\n===========================\nNo catalog created in specified time\n=========================");
        }
      });
    }
  };


  config.onCleanUp = function() {
    if (testConfiguration.dataSetup && catalogId != null) {

      var codeDone = false;
      dataSetupCode.tear({
        url: process.env.CHAISE_BASE_URL.replace('chaise', 'ermrest/'),
        catalogId: catalogId,
        dataSetup: testConfiguration.dataSetup
      }).then(function() {
        codeDone = true;
      }, function() {
        codeDone = true;
      });

      return browser.wait(function() {
        return codeDone;
      }, 5000);

    }
  }
};