# End to End Testing Documentation

For now, we only have E2E tests in Chaise. E2E tests are automation tests that simulate a user interacting with the app and assert or expect the app would act correctly accordingly.

## Tools used
- **Protractor**: E2E framework tailored for AngularJS apps
- **Jasmine**: the way in which the automation tests are written
- **NPM**: to install necessary NodeJS packages
- **SauceLabs**: platform for executing E2E tests and record (in video) the testing results by Travis CI
- **Travis CI**: to test automatically every time code is pushed to Github repo
- **Makefile**: to invoke NPM to install packages necessary for running tests and invoke Protractor (which will run the tests).
- **ErmrestDataUtils**: tool created in house for catalog/schema creation and seeding data ([Found here](https://github.com/informatics-isi-edu/ErmrestDataUtils))

## Setup

To run E2E tests on your machine, make sure that you've following stuff installed.

* **Node.js**
* **JAVA**
* **JDK**

This will newly install all **node.js** dependencies and update the *selenium* web-driver.

## How To Run Tests

Before running the test cases you need to set `ERMREST_URL`, `CHAISE_BASE_URL`, `AUTH_COOKIE`, and `REMOTE_CHAISE_DIR_PATH` environment variables.

```sh
export CHAISE_BASE_URL=YOUR_CHAISE_BASE_URL
export ERMREST_URL=YOUR_ERMREST_URL
export AUTH_COOKIE=YOUR_ERMREST_COOKIE
export REMOTE_CHAISE_DIR_PATH=USERNAME@HOST:public_html/chaise
```

These variables are used in `ErmrestDataUtils` to communicate with `ERMrest`. A copy of `ErmrestDataUtils` should be pulled from master and placed alongside chaise in your workspace.

### To execute all test cases in sequential order, set the following:
```sh
export SHARDING=false
```

and then run the following command:

```sh
$ make test
```
- To run a specific test-case

    ```sh
    $ node_modules/.bin/protractor test/e2e/specs/search/data-independent/protractor.conf.js
    ```

### To execute all the test cases in parallel, set the following:

```sh
export SHARDING=true
```

and then run the following command:

```sh
$ make testparallel
```

### How To Get Your AUTH COOKIE

1. Open up [https://dev.isrd.isi.edu/chaise/search/](https://dev.isrd.isi.edu/chaise/search/) website.
2. Login. The account that you are using must have delete and create access. We use this cookie to create and delete catalogs.
3. Open the Developer tools in your browser.
4. Go to the console section and write `$.cookie("webauthn")`.
6. voilà! :satisfied:

### Sample Environment Variables
```sh
export CHAISE_BASE_URL=https://dev.isrd.isi.edu/~<your-user-directory>chaise # No trailing `/`
export ERMREST_URL=https://dev.isrd.isi.edu/ermrest # No trailing `/`
export AUTH_COOKIE="webauthn=PutYourCookieHere;" # You have to put `webauthn=` at the beginging and `;` at the end.
export REMOTE_CHAISE_DIR_PATH=chirag@dev.isrd.isi.edu:public_html/chaise # No trailing `/`
export SHARDING=false
```

## File structure

```
chaise/
`-- test/
    |-- unit
    `-- e2e
	|-- data_setup                       
	|   |-- config                       # test configuration files
        |   |   |-- record
        |   |   |   |-- *.dev.json  # lists the schema config files (*.config.json)
        |   |   |   `-- *.config.json # the configuration for data utils that connects the schema and data together
	|   |	`-- recordedit
	|   |-- data                         # Data
	|   |   `-- SCHEMA_NAME
	|   |       |-- TABLE_NAME.json
	|   |	    `-- TABLE_NAME.json      # Table entities json
	|   `-- schema
        |       |-- record
        |       |   `-- SCHEMA_NAME.json
	|	`-- SCHEMA_NAME.json         # Schema Definition json
	|-- specs
	|   `-- all-features
	|       |-- record           
	|       |   |-- TEST_NAME1.spec.js   
	|       |   `-- TEST_NAME1.conf.js   # protractor configuration for similarly named single test
	|       |-- recordedit         
	|    	|                            # They introspect the existing schema to run the cases*/
	|       `-- protractor.conf.js   # configuration for the parallel tests
	`-- utils
	    |-- chaise.page.js               # To declare Page Objects, google "page object pattern" for details
	    |-- page.utils.js                # Utilities for Page objects
	    `-- protractor.configuration.js  # Scaffolding for all configurations

```

## Configuration
**Protractor.configuration.js**: the protractor.configuration.js file is a scaffolding for all tests and specifies which browser to use when executing tests using
```sh
capabilities: {
    //browserName: 'internet explorer',
    //browserName: 'firefox',
    //version: '40.0', //to specify the browser version
    browserName: 'chrome',
  },
```
It specifies tests to be run on multiple browsers,
```sh
multiCapabilities: [{
    'browserName': 'firefox'
  }, {
    'browserName': 'chrome'
  }],
```
To specify which test specs to run, use
```sh
specs: [
    '*.spec.js'
  ],
```

To configure SauceLabs credentials,
```sh
sauceUser: process.env.SAUCE_USERNAME,
sauceKey: process.env.SAUCE_ACCESS_KEY,
```

### protractor.conf.js

You must refer this scaffolding in your `protractor.conf.js` file and pass the parameters to avoid duplicating it. This is how your file would look like.

```javascript
var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({

  // Change this to your desired filed name and Comment below testConfiguration object declaration
    configFileName: 'search.dev.json',

  /* Just in case if you plan on not giving a file for configuration, you can always specify a testConfiguration object
   * Comment above 2 lines
   * Empty configuration will run test cases against catalog 1 and default schema
    testConfiguration: {
      ....
    },
   */

    // Optional: Default is "chaise-config.js"
    chaiseConfigFilePath: "path/to/your/chaise-config/to/be.used/in/this/test/suite",

    // Full path from the base of base directory
    //chaiseConfigFilePath: "test/e2e/specs/recordedit/data-independent/edit/chaise-config.js"


   /* If you want to set a custom base URL with some query string or other url parameters use
    * setBaseUrl function else directly set the page. You just need to provide wither of them.
    */
    page: '/search',

    /*
    setBaseUrl: function(browser, data) {
      browser.params.url = process.env.CHAISE_BASE_URL + "/search" + "/#" + data.catalogId + "/" + data.schema.name;
      return browser.params.url;
    }
    */
});

exports.config = config;
```
#### ChaiseConfigFilePath

When a tester specifies a chaiseConfigFilePath, it copies the file specified in the `chaiseConfigFilePath` into REMOTE_CHAISE_DIR_PATH/chaise-config.js. This functionality is to make it work locally on developer machine pointing to some other server. In addition, to avoid the newly copied `chaise-config.js` file being used for other suites, it is reverted back to the previous one. Here previous refers to the `chaise-config-sample.js file`.

**NOTE**: To specify which config you want to use for your spec, set `chaiseConfigFilePath` in your **protractor.conf.js** file as follows. You also need to run the [ssh-agent](http://mah.everybody.org/docs/ssh) in background as well as export a new environment variable that specifies your remote **dev.isrd** sshpath.

For example
```sh
# run ssh-agent in background
$ eval ssh-agent

# add your key to ssh-agent
$ ssh-add PATH/TO/KEY

# export REMOTE_CHAISE_DIR_PATH=USERNAME@HOST:public_html/chaise
$ export REMOTE_CHAISE_DIR_PATH=chirag@dev.isrd.isi.edu:public_html/chaise
```

**TRAVIS**: For TRAVIS there is no need to set `REMOTE_CHAISE_DIR_PATH` as it copies the actual file to the **chaise-config.js** in its local directory where it is running the test-suite.

### Test Configuration Json file

The `configFileName` which is **"search.dev.json"** here, specifies the file where the json for this suite exists. Apart from that everything is self-explanatory in the json.

The structure of the configuration is
```javascript
{
   "setup": {
      "schemaConfigurations" : [{
        "catalog": {
            //"id": 1  //existing id of a catalog
        },
        "schema": {
            "name": "product",
            "createNew": true, // change this to false to avoid creating new schema
            "path": "./schema/product.json" // path of the schema json file in data_setup folder
        },
        "tables": {
            "createNew": true, // Mention this to be true to allow creating new tables
        },
        "entities": {
            "createNew": true, // Mention this to be true to allow creating new entities
            "path": "./data/product", // This is the path from where the json for the entities will be picked for import
        },
        "authCookie": ""
    }],
    "schema": "DEFAULT_NAME_OF_SCHEMA" // (Optional: Will set the default schema to the name you provide)
  },
  "cleanup": true, //Do you want to delete the created catalog/schema/tables/entities created in the setup phase
  "tests": {

  }
}
```

The `setup` object  allows you to specify whether the test-cases should create or use existing catalog, schema, tables and entities before running the testcases.
The `cleanup` property if true will delete all the data that was created in the dataSetup phase.
The `tests` object is mandatory for data-dependent testcases, as the test-cases will refer to this configuration for running and asserting them.

```javascript
    "tests" : {
        "Filters on top of the records," : {   // This is the name of describe which will used this data

            // The internal data doesn't has a format, its just an object which can change accorsing to your test needs/
            "data" : "testcase2Input2",
            "someMoreData" : "data"
            .
            .
            .
            .
        }
    }
```

## Page Object Pattern [chaise.page.js](https://github.com/informatics-isi-edu/chaise/blob/master/test/e2e/utils/chaise.page.js)

### Expectations

Expectations should use [Jasmine matchers](https://jasmine.github.io/api/2.6/matchers.html). One thing to note with matchers is that a custom message can be attached to each matcher, `expect(value).toBe(expected_value, failure message)`. This should be done as often as possible to provide a point of contact to look at when debugging errors in test cases.

To write the tests, usually one has to first find the DOM elements on the page, then perform some actions on the elements, finally expect (assert) the correct result will show up. There are two logics here, DOM finding and expectation. To separate concerns, most DOM finding logic is put into a **Page Object** file "chaise.page.js". So in ".spec.js" files where the tests (expectations) are written, more effort can be focused on the expectation logic.

## [Expected Conditions](http://www.protractortest.org/#/api?view=ProtractorExpectedConditions)

When writing tests, there will be times where the spec will attempt to run before the elements are available in the DOM. Having tests fail because an element isn't visible has been a sporadic but common enough issue. Protractor has a library called Expected Conditions that allows for waiting for a certain part of the DOM to be available before continuing to run tests.

## Running tests in TRAVIS

### Travis Testing workflow
in the Chaise folder, invoke command
```sh
npm test
```
The "test" command specified in package.json (NodeJS conf file) will be executed, so command
```sh
make test
```
will be executed. Command specified in Makefile will then be executed, which will invoke Protractor to execute the tests.
```sh
protractor search/data-independent/protractor.conf.js && search/data-dependent/protractor.conf.js && protractor recordedit/data-independentadd/protractor.conf.js  && protractor recordedit/data-independentadd/protractor.conf.js
```
Protractor will run "protractor search/data-independent/protractor.conf.js" first, if there is no failure in search/data-independent/protractor.conf.js specs, protractor will proceed to execute "protractor search/data-dependent/protractor.conf.js". If there are failures in search/data-dependent/protractor.conf.js specs, the tests will exit. And it keeps going on until it has executed all protractor test suites.

Usually Protractor will open a local server (and browsers) to execute the e2e tests. But because we want the tests to be executed on SauceLabs, lines below are added to protractor conf files.
```sh
sauceUser: process.env.SAUCE_USERNAME,
sauceKey: process.env.SAUCE_ACCESS_KEY,

```
These lines will set up credentials necessary to login SauceLabs and when detected, will execute these tests on SauceLabs. SauceLabs will then print the testing result on terminal and record the testing video on that account as well. When tests are finished, there will be a URL printed on terminal directing you to see the recorded results.

When the code is pushed to ISI repo, the existence of **.travis.yml** will run "npm test" command in Travis CI, which will trigger the testing chain specified above.

### Environment Variables

**.travis.yml**: [.travis.yml](https://github.com/informatics-isi-edu/chaise/blob/master/.travis.yml)
specifies environment variables in Travis CI so that tests can be run successfully. Usually the env variables are set using terminal locally, to set them up in Travis CI one has to configure .travis.yml file.

```sh
env:
    global:
        - CHAISE_BASE_URL: http://localhost/chaise
        - ERMREST_URL: http://localhost/ermrest
        - secure: KKPijZEdaQ7wyubNojHcJi/pgqwemhOzD8lHBV9c521+iybrHJRyR8fJE22OoMrn9UVPlk2pYgljpF1Vjubms10Kga4GT3vxjZ7kbadkgs09vIzo4SUQDi7XBrm3NbWIgYgcLhE8ZqhZo75idtkFMJCQclwLQ7vn5P5xSzNI3CUVxoQJ+uB6ZgVDn0b2ldfmqCBM5B52ocOBF1c4yLTmJwCkSRNdM2aVj4scf+S0h3InGCitHNyuu0WUYNvrIVIFhjCi7VuadCtJ7fy7Z2uFksHIxkT5Lx9WkdZX1M522ckvKhlFrOOB8ejIl//JsPsvy7cPAs7R9w+8LwiE3lmU376fxO9cKCrY7vnW78zHhbs3q6iFO2hhAiPILlcK3H626zbblHms8wsqUHkXlFx19FyTU8pqW86/4LKr6sdVRPyutokMdrFtgjFC1KevseK7GUWzOepOBJazXCc0WvQvUOUIWET5auRztLPEt0P9fh0hNamKWqYUiaW/nl0cUGAL/70PWSQBwIAHAry9mI9xVsBVVl0JhF5ljzqGmzFxRik7ylaYSZh1nTrjwjZDmBEOvycNsDqZBmU6Vc0KXtHaWF/AbCj1Lyng72YCe5jks058DGzv4nKonphNsG0bn3sb1oNHzFoHMncx8FxjZACsmuVzvzXtWTcv9O/iu+rbYxg=
        - secure: hSGHl2cRYx9gmE2lrjRWu3H45ogd8hIiI9QlLZpvXonROZJSw8VqQWpLe/7m+95L8UDhOpnCXKct/V9+qUDsQM2kDpEP+9bNCf3skg7MFLkpr1te+y1mCkO0xu2vhoqrzJKtvXGIenZ/aEY1nQrnIYuF/5MaOzNRliHQ+7rmhigW7M4LSFqDQdj7CvqXsyk3cfNMbIeUI9H8/SrG9mxYfAa61H1zJtPmdDegvjFNcQeeT57lgYyoArOw4lcGm9KHQp2Hn4EtXv1L65DS7eogFit0CnS/1QHEinU2ibpgfb/vnAnRun5OAmjsiPAURLb6AuhevzDHeyMZrTPIGUHiIyuzG8qP264sWq1ukyjolyarwcwJoifJAdGWhVPT41XAlgAy+xgfN4xSKNp+tGPo9+iJqVGgccbpKAYqMQKvWSXO6DVQEqPHtpFuXsqNBBwvzCBAS+VdHFoKOy9bv2AEIpVOZJszIkuaNAQVqG/iD0pXQT9rEsZ4Ghm0N/RQf7qhGA4Ot1u5yOko1zgm15ATzpacy6qEzqQQwG3qilO2hUNK8xehqU52a4KQu79yGOG8zFkyvcUS3H/e4NQVeBFQ8GIrfcjg1vD5PXzdnun3iiLwwSXSk9CMHMW0B2z34qvg0q4++LWP2UMHkrx+yf/MzABoYuiZ6LshCvobftU7zmQ=
```
The two "secure"s above set up the SauceLabs username and password and the ERMRest authCookie, and encrypt them. The last 2 lines set up env variable "CHAISE_BASE_URL" and "ERMREST_URL" without encryption. More details about it, take a look at Travis CI official website.

While running tests on **TRAVIS** you don't need to set the `REMOTE_CHAISE_DIR_PATH` in **travis.yml** file.

## Writing tests

As we are using Protractor for testing and angular for frontend, there a set of guidelines that need to be followed so that the test suite works perfectly.

### [Selenium Documentation](http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_Options.html)

### Clicking elements

Whenever you want to click an element, make sure that you don't trigger the click function on the element directly. This is because, if the element is not in the sight of browser, it will err out saying unable to find the element and will never get clicked.

A workaround for this situation is to scroll the page to the element position and then click. `chaise.page.js` has a function to do this. It accepts a WebElement

```js

var chaisePage = require('chaise.page.js');

var elem = element.all(by.css('.add-button')).first();

chaisePage.clickButton(elem);

```

### Synchronization issues

Currently Chaise is not using Angular router, thus we can't use Protractor [Synchronization](https://github.com/angular/protractor/blob/9891d430aff477c5feb80ae01b48356866820132/lib/protractor.js#L158).

Setting it to `true` means that subsequent additions/injections to the the control flow don't also add browser.waitForAngular.

Synchronization makes protractor wait for Angular promises to resolve and causes the url's to be scrambled. Chaise uses the `#` delimiter to determine url parameters to be sent to Ermrest. Thus, enabling synchronization, changes the url, appending an extra / after the `#` symbol.

Thus a correct url like this
`https://dev.isrd.isi.edu/chaise/record/#1/legacy:dataset/id=1580`

changes to

`https://dev.isrd.isi.edu/chaise/record/#/1/legacy:dataset/id=1580`

Thus, the parser is unable to parse it. To avoid this we simply disable synchronization in the start of testcases.

```js
beforeAll(function () {
	browser.ignoreSynchronization=true;
	browser.get(browser.params.url);
});
```

### Waiting for elements to be visible

Disabling synchronization has its own issues. Protractor by default waits for the Angular to be done with displaying data or complete http call. With disabled synchronization we need to add logic to handle situations which need the page/element/data to be visible before running the asserts.

In such cases you might just be tempted to put in a `browser.sleep(2000)` to allow everything to get back on track.

You shouldn't be using `browser.sleep` functions as they are brittle. Sleeps put your tests at the mercy of changes in your test environments (network speed, machine performance etc). They make your tests slower. From a maintainability point of view they are ambiguous to someone else reading your code. Why were the put there? Is the sleep long enough? They are an acceptance that you don't really know what is going on with your code and in my opinion should be banned (or at least you should try your best to resist the quick win they give you!).

A simple workaround is to use [browser.wait](http://www.protractortest.org/#/api?view=webdriver.WebDriver.prototype.wait) in conjunction with other parameters such as a timeout/element/variable/functions.

To wait for elements to be visible/rendered we can simply use following syntax

```js
chaisePage.waitForElement(element(by.id("some-id"), 5000).then(function() {
   console.log("Element found");
}, function(err) {
   console.log("Element not found");
});
```

### Waiting for url's to change

This can be useful when you want to wait for the URL to change in case of form submissions or link clicks.

```js
var url = "http://dev.isrd.isi.edu/chaise/search";
chaisePage.waitForUrl(url, 5000).then(function() {
   console.log("Redirected to url");
}, function(err) {
   console.log("Unable to redirect to url");
});
```

### Detecting Travis Environment

There're scenarios where you might need to determine which environment are your tests running; TRAVIS or locally. To determine that you can simply refer the variable `process.env.TRAVIS`. If it is true then the environment is Travis else it is something else.

```js
if (process.env.TRAVIS) {
   // DO something Travis specific
} else {
  // DO something specific to local environment
}
```

### Setting Webauthn Cookies in Test Cases

You can always change the user authentication cookie in your tests. To do so, first you need to have the **webauthn** cookie.

Now you need to put this code in your test to set the cookie and then redirect the user to specific page on success. The `performLogin(cookie)` function accepts a cookie and returns a promise. On successful completion of login the promise is resolved.

```js
var chaisePage = require('YOU_PATH/chaise.page.js');

describe("Setting Login cookie", function() {
   beforeAll(function(done) {
      chaisePage.performLogin(COOKIE).then(function() {
         // Successfully set the user cookie
         // Add your code to redirect the user to another page on beforeAll
      }, function(err) {
         // Unable to set the cookie
      });
   });
});

});
```

You should try to put the performLogin function inside an `it` statement or `beforeAll`/`beforeEach` statement, so that it is executed in the flow of test.

**NOTE**: Our Travis environment doesn't uses HTTPS for CHAISE. When we setup the cookie we set the secure flag in the path for cookie depending on environment. [Reference](http://resources.infosecinstitute.com/securing-cookies-httponly-secure-flags/#gref)

## Test Parallelization

By default the e2e tests will run in parallel. To avoid this, set the `Sharding` environment variable to `false`.

```export SHARDING=false```

To run a set of specs in parallel you can set some flags in the `protractor.conf.js`.

```js

{
   ..
   "parallel": 3, //No of instances or just set it to true for default (4)
   ..
}

```

Internally the `parallel` property gets resolved to number of instances and enabling/disabling sharding.

```js
if (options.parallel) {
    config.capabilities.shardTestFiles = true;
    config.capabilities.maxInstances = typeof options.parallel == 'number' ? options.parallel : 4;
}
```

You can see the code [here](https://github.com/informatics-isi-edu/chaise/blob/master/test/e2e/utils/protractor.configuration.js)

## Running tests using SAUCE LABS locally

To run tests locally using [Sauce Labs](https://saucelabs.com) you need to have an account with them. Once you signup you will need to extract your `username` and `access key`.

You can access them from the `My account` link in user dropdown. On the `My account` page you will find your username and access key. After which you need to set them in your environment.

```sh
export SAUCE_USERNAME="your_username"
export SAUCE_ACCESS_KEY="your_access_key"
```

Now when you run the tests, they will be executed on Sauce Labs instead of your machine. You can monitor them on their dashboard.
