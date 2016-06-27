# End to End Testing Documentation 

For now, we only have E2E tests in Chaise. E2E tests are automation tests that simulate a user interacting with the app and assert or expect the app would act correctly accordingly.

###Tools used
- **Protractor**: E2E framework tailored for AngularJS apps
- **Jasmine**: the way in which the automation tests are written
- **NPM**: to install necessary NodeJS packages
- **SauceLabs**: platform for executing E2E tests and record (in video) the testing results by Travis CI
- **Travis CI**: to test automatically every time code is pushed to Github repo
- **Makefile**: to invoke NPM to install packages necessary for running tests and invoke Protractor (which will run the tests).

###File structure
```js
/chaise
    /node_modules
    ...
    /test
        /e2e
            /login
            /search //(where the e2e tests files are)
                /data-independent //(Ones which are not dependent on data, they introspect the existing schema)
                    00-sidebar.morefilter.spec.js //(the tests specs)
                    01-sidebar.input.spec.js
                    protractor.conf.js //(The configuration file that mentions which tests to run and where to run them)
                                       //(This is the place where you need to specify the test configuration data
                /data-dependent //(These tests require some static data and won't run if we don't provide a test data configuration)
                    02-filters.upon.result.spec
                    protractor.conf.js
            /record
            chaise.page.js //(page object for testing, google "page object pattern" for details)
    Makefile //(to conf Makefile)
    package.json //(conf file for NodeJS project, "test" command is specified here)
    .travis.yml //(conf file for Travis CI)
```

###Testing workflow
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
protractor search/data-independent/protractor.conf.js && search/data-dependent/protractor.conf.js && protractor record/data-dependentprotractor.conf.js
```
Protractor will run "protractor search/data-independent/protractor.conf.js" first, if there is no failure in search/data-independent/protractor.conf.js specs, protractor will proceed to execute "protractor search/data-dependent/protractor.conf.js". If there are failures in search/data-dependent/protractor.conf.js specs, the tests will exit. And it keeps goin on until it has executed all protractor test suites.

Usually Protractor will open a local server (and browsers) to execute the e2e tests. But because we want the tests to be executed on SauceLabs, lines below are added to protractor conf files.
```sh
sauceUser: process.env.SAUCE_USERNAME,
sauceKey: process.env.SAUCE_ACCESS_KEY,

```
These lines will set up credentials necessary to login SauceLabs and when detected, will execute these tests on SauceLabs. SauceLabs will then print the testing result on terminal and record the testing video on that account as well. When tests are finished, there will be a URL printed on terminal directing you to see the recorded results.

When the code is pushed to ISI repo, the existence of .travis.yml will run "npm test" command in Travis CI, which will trigger the testing chain specified above.

###Configuration
**Protractor.conf.js**: [the protractor.conf.js](https://github.com/informatics-isi-edu/chaise/blob/master/test/e2e/search/protractor.conf.js) file specifies which browser to use when executing tests using
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
To specify the base URL (so that browser.get('') will be directed to baseURL), use
```sh
baseUrl: process.env.CHAISE_BASE_URL + '/search'
```
To configure SauceLabs credentials,
```sh
sauceUser: process.env.SAUCE_USERNAME,
sauceKey: process.env.SAUCE_ACCESS_KEY,
```

## Test Configuration Json file

If you observer the `protractor.conf.js` has some lines added at the end. They specify the test data configuration to be used for running the tests.

```javascript
//Change this to your desired filed name and Comment below testConfiguration object declaration
var configFileName = 'search.dev.json';
var testConfiguration =  require('../../data_setup/config/' + configFileName);

// Just in case if you plan on not giving a file for configuration, you can always specify a testConfiguration object 
// Comment above 2 lines

// Empty configuration will run test cases against catalog 1 and default schema
// var testConfiguration = { };

// Configuration with an existing catalog will run cases against it
// var testConfiguration = { dataSetup: { catalog : { id: 3 } } }

var dataSetup = require('../../utils/protractor.parameterize.js');
dataSetup.parameterize(config, { testConfiguration: testConfiguration , page: '/search' });

exports.config = config;
``

The `configFileName` which is "search.dev.json" here, specifies the file where the json for this suite exists. Apart from that everything is self-explanatory in the json.

The structure of the configuration is
```javascript
{
    "dataSetup": {
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
    },
    "cleanup": true, //Do you want to delete the created catalog/schema/tables/entities created in the setup phase
    "tests" : {

    }
}
```

The `dataSetup` object  allows you to specify whether the test-cases should create or use existing catalog, schema, tables and entities before running the testcases.
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

**.travis.yml**: [.travis.yml](https://github.com/informatics-isi-edu/chaise/blob/master/.travis.yml)
specifies environment variables in Travis CI so that tests can be run successfully. Usually the env variables are set using terminal locally, to set them up in Travis CI one has to configure .travis.yml file.

```sh
env:
    global:
        - secure: KKPijZEdaQ7wyubNojHcJi/pgqwemhOzD8lHBV9c521+iybrHJRyR8fJE22OoMrn9UVPlk2pYgljpF1Vjubms10Kga4GT3vxjZ7kbadkgs09vIzo4SUQDi7XBrm3NbWIgYgcLhE8ZqhZo75idtkFMJCQclwLQ7vn5P5xSzNI3CUVxoQJ+uB6ZgVDn0b2ldfmqCBM5B52ocOBF1c4yLTmJwCkSRNdM2aVj4scf+S0h3InGCitHNyuu0WUYNvrIVIFhjCi7VuadCtJ7fy7Z2uFksHIxkT5Lx9WkdZX1M522ckvKhlFrOOB8ejIl//JsPsvy7cPAs7R9w+8LwiE3lmU376fxO9cKCrY7vnW78zHhbs3q6iFO2hhAiPILlcK3H626zbblHms8wsqUHkXlFx19FyTU8pqW86/4LKr6sdVRPyutokMdrFtgjFC1KevseK7GUWzOepOBJazXCc0WvQvUOUIWET5auRztLPEt0P9fh0hNamKWqYUiaW/nl0cUGAL/70PWSQBwIAHAry9mI9xVsBVVl0JhF5ljzqGmzFxRik7ylaYSZh1nTrjwjZDmBEOvycNsDqZBmU6Vc0KXtHaWF/AbCj1Lyng72YCe5jks058DGzv4nKonphNsG0bn3sb1oNHzFoHMncx8FxjZACsmuVzvzXtWTcv9O/iu+rbYxg=
        - secure: hSGHl2cRYx9gmE2lrjRWu3H45ogd8hIiI9QlLZpvXonROZJSw8VqQWpLe/7m+95L8UDhOpnCXKct/V9+qUDsQM2kDpEP+9bNCf3skg7MFLkpr1te+y1mCkO0xu2vhoqrzJKtvXGIenZ/aEY1nQrnIYuF/5MaOzNRliHQ+7rmhigW7M4LSFqDQdj7CvqXsyk3cfNMbIeUI9H8/SrG9mxYfAa61H1zJtPmdDegvjFNcQeeT57lgYyoArOw4lcGm9KHQp2Hn4EtXv1L65DS7eogFit0CnS/1QHEinU2ibpgfb/vnAnRun5OAmjsiPAURLb6AuhevzDHeyMZrTPIGUHiIyuzG8qP264sWq1ukyjolyarwcwJoifJAdGWhVPT41XAlgAy+xgfN4xSKNp+tGPo9+iJqVGgccbpKAYqMQKvWSXO6DVQEqPHtpFuXsqNBBwvzCBAS+VdHFoKOy9bv2AEIpVOZJszIkuaNAQVqG/iD0pXQT9rEsZ4Ghm0N/RQf7qhGA4Ot1u5yOko1zgm15ATzpacy6qEzqQQwG3qilO2hUNK8xehqU52a4KQu79yGOG8zFkyvcUS3H/e4NQVeBFQ8GIrfcjg1vD5PXzdnun3iiLwwSXSk9CMHMW0B2z34qvg0q4++LWP2UMHkrx+yf/MzABoYuiZ6LshCvobftU7zmQ=
        - secure: WPuh2X6utxz2mqmQwYbo4HlGXZ4aYnuBAfAW/MuYSW5E1dMNgi5uTI40TY0AOxTpeau+UkWMJG9umux9om3yVBNheImmZt3X1bPO73i3nWrg0W38a3DLjBnrbI+a8lnHa1s1hwiiIgW1Djj7OWjyJWd/zZ00QSU8Jq78m4WwSqYZNGclBQmVxri+EVUYuyHpuli3S4wu7ZjngsiyEmzXtmmgTiIdgdQxxgcPrE/35EbosHqJtxyvMHY2S4/7tbNU7ja//iAaWLQrq+c1IP2sfqmGZkrypnjR8qMZrt7s0dv9qh2+7KZ/+f/v+E0XO3UtqKvuOEWnCx/JLhlpbdItJfM6z/taLeCkj4N0kwvtLX02LrxEzu86oOyXUnE158KDUTqrb1XmnEj1uuW7X1u0RDubdH0e0m1hI1dieOKNzYoBA58yKJUZnp3KPnVa3PsgWD1lIKlVkvdqo3djv4zdnTp9D3q63WlhnfutilZOAr4hEI1nTQ9SAA/ayP2tgIhIheX2hihGAsi1LqKF7PXxihpbC6lQiqBCN8A1wDS0qi3+BrgY5DvIfKtE1eG81OtOn5Xm3L+UUehahAfBQNjMxhDpHkE6BMt0p1LIy/IUvsEkFWvkvlChIyBqwbOs+VRmZ/orag5xuhRLwyN1V9mAUCPSNdl0lUu0ZRwCmed+JiA=
        - CHAISE_BASE_URL: http://dev.isrd.isi.edu/chaise
```
The three "secure"s above set up the SauceLabs username and password and the ERMRest authCookie, and encrypt them. The last line set up env variable "CHAISE_BASE_URL" without encryption. More details about it, take a look at Travis CI official website.

###Page Object Pattern
To write the tests, usually one has to first find the DOM elements on the page, then perform some actions on the elements, finally expect (assert) the correct result will show up. There are two logics here, DOM finding and expectation. To separate concerns, most DOM finding logic is put into a **Page Object** file "chaise.page.js". So in ".spec.js" files where the tests (expectations) are written, more effort can be focused on the expectation logic.

###Unsolved problems
####Wait for async operations to complete
Protractor framework is supposed to take care of waiting for AngularJS async operations to complete before doing any expectations. But some of the async operations in chaise are written using jQuery (instead of AngularJS services), so Protractor will begin testing expectations before the async are finished. Now **setTimeout** is used to wait for the non-Angular asyncs to complete - waiting for some time and then assume those asyncs are finished within the duration of the time.

Ex. after selecting some attributes in sidebar, sometimes it takes chaise one or two seconds to display results in the content area. And protractor won't wait for it to finish automatically.

Better ways can be used to ascertain that those asyncs are fninished.
####Sync with pages
Normally protractor needs to sync with AngularJS page so that tests can be run. To "sync" is to specify the "ng-app" element in the conf file. 
