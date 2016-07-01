## Protractor End To End Tests and Configuration

Protractor is an end to end test framework for AngularJS applications built on top of [WebDriverJS](https://github.com/SeleniumHQ/selenium/wiki/WebDriverJs). Protractor runs tests against your application running in a real browser, interacting with it as a user would.

### Configuration

For more information on how to setup Chiase Protractor environment and configuration please refer [Protractor Chaise Configuration](/doc/protractor.md)

### Useful Links

Protractor uses [Jasmine](http://jasmine.github.io/) for its test syntax. As in unit testing, a test file is comprised of one or more `it` blocks that describe the requirements of your application. `it` blocks are made of *commands* and *expectations*. Commands tell Protractor to do something with the application such as navigate to a page or click on a button. Expectations tell Protractor to assert something about the application's state, such as the value of a field or the current URL.

Check out the [Angular Docs](https://docs.angularjs.org/guide/e2e-testing) for more on testing your Angular app with Protractor. See the [Protractor docs](https://angular.github.io/protractor/#/tutorial) for more information on Protractor as well.

There is also an [Angular testing cheat sheet](https://spagettikoodi.wordpress.com/2015/01/14/angular-testing-cheat-sheet/) that will help you get around the syntax for assertions.

There're tons of features that Protractor supports but here we are going to discuss one which allows for data creation utilities.

### Data Creation and Cleanup

When you are writing a new functional test you want to focus on specific business logic.

Suppose you are writing an Employee management application. You have an employee grid and you want to check that its filters are working properly. In order to test that you need to setup some initial data and tables. The process of creating data using the UI is a time-consuming task: Clicking the "Add" button, waiting for a form to appear, filling form fields, clicking the save.

In addition, you're left with some random data that your test cases create, which needs to be cleaned up separately.

As a solution, you can just have a setup routine that creates all of this data before your testcases start running and a cleanup that deletes it.

There're several ways to achieve above target, out of which the `onPrepare` and `onCleanUp ` are the most used. For a more detailed understanding of these methods you can refer [Protractor Before and Afters documentation](http://timothymartin.azurewebsites.net/protractor-before-and-afters/).

**Test Configuration File**
```javascript
{
    "setup": {
        "catalog": {
            //"id": 1  //existing id of a catalog
        },
        "schema": {
            "name": "product",
            "createNew": true, // change this to false to avoid creating new schema
            "path": "test/e2e/schema/product.json" // path of the schema json file in data_setup folder
        },
        "tables": {
            "createNew": true, // Mention this to be true to allow creating new tables
        },
        "entities": {
            "createNew": true, // Mention this to be true to allow creating new entities
            "path": "test/e2e/data/product", // This is the path from where the json for the entities will be picked for import
        }
    },
    "cleanup": true, // Delete the created catalog/schema/tables/entities created in the setup phase
    "tests" : {

    }
}
```

Chaise uses `onPrepare` method to create/setup test data needed for a test configuration. If your test configuration consists of a `dataSetup` object then the `onPrepare` method will try to analyze it and create data accordingly. Else it will try to fetch catalog with id 1 for specified environment. This method also sets the default schema in `browser.params.defaultSchema` and default table in `browser.params.defaultTable` according to the schema in configuration if provided or defaults to the one that is returned from ErmRest.

After setup the method set the `authCookie` in the browser if available in environment variable `AUTH_COOKIE` and navigates the browser to the relevant url of the catalog and schema. For instance if we opted to create a new catalog and schema in the configuration, then the onPrepare method will set the baseUrl for the testcase as **/chaise/search/#234/product**.

Once all this stuff is done, the control is transferred to Protractor to run the test specs. Once the tests have finished running and the WebDriver instance has been shut down the `onCleanup` method is called. If the `cleanup` property is set to true in your test configuration then this method deletes all the data that was created in the `onPrepare` method. So if you mentioned to use an existing catalog, but create a new schema, the onCleanup method will just delete the newly created schema. It refers the same test configuration used for setup. 

If you didn't have any data setup then there won't be any cleanup.

### Setup and Teardown in Test Cases.

Just in case if you need to create some data on the fly for a particular scenario in yout test case, and don't want it to be available for all other scenarios of a test spec, you can use the `beforeAll` and `afterAll` methods to do the same.

```javascript

// The test configuration to be used
var testConfiguration = require('../data_setup/config/search.dev.json');
testConfiguration.authCookie = process.env.AUTH_COOKIE;

// The data import and cleanup module
var pImport = require('../utils/protractor.import.js'), catalogId;

// Call this method to setup data
var beforeTestRun = function(EC) {
	
	// Call setup to create data
	pImport.setup(testConfiguration).then(function(data) {

		// Set the url to something
        var url = process.env.CHAISE_BASE_URL + '/search';

        // Set the authentication cookie if needed
        chaisePage.setAuthCookie(url, testConfiguration.authCookie);
    	
    	// If catalog information is available then change the url to pint to that catalog and schema if needed
        if (data.catalogId) {
            catalogId = data.catalogId;
            // set the url for testcases to stat using the catalogId and schema that was mentioned in the configuration
            url = browser.baseUrl + "/#" + data.catalogId + "/schema/" + data.schema.name;
        }

        // Navigate the page to required page if needed
        browser.get(url || browser.params.url);

        var sidebar = element(by.id('sidebar'));
        browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
            done();
        });
    }, function(err) {
        pImport.tear(testConfiguration, catalogId).then(function() {
            throw err
        }, function(err) {
            throw err;
        });
    });
}

// Call this method to cleanup data created in beforeTestRun
var afterTestRun = function() {
    afterAll(function (done) {
        pImport.tear(testConfiguration, catalogId).then(function() {
            done();
        }, function(err) {
            throw err;
        })
    });
};

describe('Sidebar top search input,', function () {
    var EC = protractor.ExpectedConditions;

    beforeTestRun(EC);
    .
    .
    .afterTestRun();
});

```

Please refer following [sample folder](/test/e2e/sample) to understand the intest data creation and cleanup and its configuration. 

