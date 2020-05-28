# End to End Testing Documentation

For now, we only have E2E tests in Chaise. E2E tests are automation tests that simulate a user interacting with the app and assert or expect the app would act correctly accordingly. This document will explain how you can configure and run the e2e test cases. Please use [this link](e2e-test-writing.md) to find more information about how to write new test cases.


## Tools used
- **Protractor**: E2E framework tailored for AngularJS apps
- **Jasmine**: the way in which the automation tests are written
- **NPM**: to install necessary NodeJS packages
- **SauceLabs**: platform for executing E2E tests and record (in video) the testing results by Travis CI
- **Travis CI**: to test automatically every time code is pushed to Github repo
- **Makefile**: to invoke NPM to install packages necessary for running tests and invoke Protractor (which will run the tests).
- **ErmrestDataUtils**: tool created in house for catalog/schema creation and seeding data ([Found here](https://github.com/informatics-isi-edu/ErmrestDataUtils))

## Setup

To run E2E tests on your machine, make sure that you've installed the following on your machine:

- **Node.js**
- **JAVA**
- **JDK**

Before running the test cases you also need to set `ERMREST_URL`, `CHAISE_BASE_URL`, `AUTH_COOKIE`, and `REMOTE_CHAISE_DIR_PATH` environment variables.

```sh
export CHAISE_BASE_URL=YOUR_CHAISE_BASE_URL
export ERMREST_URL=YOUR_ERMREST_URL
export AUTH_COOKIE=YOUR_ERMREST_COOKIE
export REMOTE_CHAISE_DIR_PATH=USERNAME@HOST:public_html/chaise
```

These variables are used in `ErmrestDataUtils` to communicate with `ERMrest`. A copy of `ErmrestDataUtils` should be pulled from master and placed alongside chaise in your workspace. The following is how these variables most probably should look like:

```sh
export CHAISE_BASE_URL=https://dev.isrd.isi.edu/~<your-user-directory>chaise # No trailing `/`
export ERMREST_URL=https://dev.isrd.isi.edu/ermrest # No trailing `/`
export AUTH_COOKIE="webauthn=PutYourCookieHere;" # You have to put `webauthn=` at the beginging and `;` at the end.
export REMOTE_CHAISE_DIR_PATH=chirag@dev.isrd.isi.edu:public_html/chaise # No trailing `/`
export SHARDING=false
```

You can get your cookie by querying the database, or using the following simple steps:

1. Open up [https://dev.isrd.isi.edu/chaise/search/](https://dev.isrd.isi.edu/chaise/search/) website.
2. Login. The account that you are using must have delete and create access. We use this cookie to create and delete catalogs.
3. Open the Developer tools in your browser.
4. Go to the console section and write `$.cookie("webauthn")`.


## How To Run Tests
### Prerequistes
- After setting up the environment variables, make sure that the `https://dev.isrd.isi.edu/~<your-user-directory>` directory has the public access(if not, give the folder the following permissions `chmod 755 <your-user-directory>`).

- Upload your code on the `https://dev.isrd.isi.edu/~<your-user-directory>` by the running the following command in your local chaise repository. (This will upload your local code to the remote server)
```sh
$ make install
```

- Make sure all the npm dependencies are installed by running `npm install`.

```sh
$ npm install
```

### Test cases
- To execute all test cases in sequential order, set the following:
```sh
export SHARDING=false
```

and then run the following command:

```sh
$ make test
```

This will automatically update the *selenium* web-driver that protractor is using.

- To execute all the test cases in parallel, set the following:

```sh
export SHARDING=true
```

and then run the following command:

```sh
$ make testparallel
```

- To run a specific test spec

    ```sh
    $ node_modules/.bin/protractor test/e2e/specs/search/data-independent/protractor.conf.js
    ```
> Calling protractor directly won't install npm modules and will not update the selenium web-driver. So you have to do those steps manually.

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

### Test Configuration JSON file

The `configFileName` which is **"search.dev.json"** here, specifies the file where the JSON for this suite exists. Apart from that everything is self-explanatory in the JSON.

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


## Writing test

Please use [this link](e2e-test-writing.md) to find more information about how to write new test cases.
