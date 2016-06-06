var catalogId = null, data = null; 
var dataSetupCode = require("../data_setup/import.js");
var authCookie = "ermrest=C6KFIQn2JS37CGovofWnjKfu;";

exports.config = {
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
    defaultTimeoutInterval: 120000
  },
  // If ng-app attribute is in a descendant of <body>, tell Protractor where ng-app is
  rootElement: '#main-content',
  // CHAISE_BASE_URL should be https://dev.misd.isi.edu/chaise for now.
  //baseUrl: process.env.CHAISE_BASE_URL + '/search',

  onPrepare: function() {
    var codeDone = false, successful = false;

    dataSetupCode.setup({
      schemaName: 'legacy',
      url: process.env.CHAISE_BASE_URL.replace('chaise', 'ermrest/'),
      authCookie: authCookie
    }).then(function(data) {
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
        browser.baseUrl = process.env.CHAISE_BASE_URL + '/search';
        browser.get("");
        browser.wait(function() {
          return false;
        }, 3000).then(null, function() {
          browser.driver.executeScript('document.cookie="' + authCookie + 'path=/;secure;"');
          browser.params.url = browser.baseUrl + "/#" + catalogId + "/legacy";
        });
      } else {
        if(catalogId != null) {
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
  },

  onCleanUp: function() {
    return;
    if (catalogId != null) {

      var codeDone = false;
      dataSetupCode.tear({
        url: process.env.CHAISE_BASE_URL.replace('chaise', 'ermrest/'),
        authCookie: authCookie,
        catalogId: catalogId
      }).then(function() {
        codeDone = true;
      }, function() {
        codeDone = true;
      });

      return browser.wait(function() {
        return codeDone;
      }, 3000);

    }
  }
};
