# End to End Testing Documentation

For now, we only have E2E tests in Chaise. E2E tests are automation tests that simulate a user interacting with the app and assert or expect the app would act correctly accordingly. This document will explain how you can configure and run the e2e test cases. Please use [this link](e2e-test-writing.md) to find more information about how to write new test cases.


## Tools used
- **Protractor**: E2E framework tailored for AngularJS apps
- **Jasmine**: the way in which the automation tests are written
- **NPM**: to install necessary NodeJS packages
- **SauceLabs**: platform for executing E2E tests and record (in video) the testing results by CI
- **Github workflow**: to do continuous integration (CI) by automatically testing every time code is pushed to Github repo
- **Makefile**: to invoke NPM to install packages necessary for running tests and invoke Protractor (which will run the tests).
- **ErmrestDataUtils**: tool created in house for catalog/schema creation and seeding data ([Found here](https://github.com/informatics-isi-edu/ErmrestDataUtils)). This is installed with the rest of NodeJS packages.

## Setup

To run E2E tests on your machine, make sure that you've installed the following on your machine:

- **Node.js**
- **JAVA**
- **JDK**

Before running the test cases you also need to set `ERMREST_URL`, `CHAISE_BASE_URL`, `AUTH_COOKIE`, `RESTRICTED_AUTH_COOKIE`, and `REMOTE_CHAISE_DIR_PATH` environment variables.

```sh
export CHAISE_BASE_URL=YOUR_CHAISE_BASE_URL
export ERMREST_URL=YOUR_ERMREST_URL
export AUTH_COOKIE=YOUR_WEBAUTHN_COOKIE
export RESTRICTED_AUTH_COOKIE=YOUR_SECOND_USER_ERMREST_COOKIE
export REMOTE_CHAISE_DIR_PATH=USERNAME@HOST:public_html/chaise
```

These variables are used in our test framework to communicate with `ERMrest`. The following is how these variables most probably should look like:

```sh
export CHAISE_BASE_URL=https://dev.derivacloud.org/~<your-user-directory>chaise # No trailing `/`
export ERMREST_URL=https://dev.derivacloud.org/ermrest # No trailing `/`
export AUTH_COOKIE="webauthn=PutYourCookieHere;" # You have to put `webauthn=` at the beginging and `;` at the end.
export RESTRICTED_AUTH_COOKIE="webauthn=PutAnotherCookieHere;" # You have to put `webauthn=` at the beginging and `;` at the end.
export REMOTE_CHAISE_DIR_PATH=some_user_name@dev.derivacloud.org:public_html/chaise # No trailing `/`
export SHARDING=false
```

You can get your cookie by querying the database, or using the following simple steps:

1. Open up any chaise page in the deployment that you want to run test cases on.
2. Login. The account that you are using must have delete and create access. We use this cookie to create and delete catalogs.
3. Open the Developer tools in your browser.
4. Go to the console section and write `$.cookie("webauthn")`.


## How To Run Tests
### Prerequistes
1. After setting up the environment variables, make sure that the `https://dev.derivacloud.org/~<your-user-directory>` directory has the public access(if not, give the folder the following permissions `chmod 755 <your-user-directory>`).

2. Make sure all the dependencies are installed by running the following command:

    ```sh
    make deps-test
    ```

    This will install all the npm dependencies that are needed and will also make sure the Selenium's WebDriver that protractor uses is updated.

    - If you just want to update the WebDriver you can do `make update-webdriver`.
    - If the version of Chrome that is installed on your machine is different from the ChromeDriver that Selenium uses, it will throw an error. So make sure both versions are always updated and compatible.


3. Build Chaise without installing the dependencies again:
    ```sh
    make dist-wo-deps
    ```
    As the name suggests this will not install dependencies. That's why you need to install all the dependencies in step 2.

4. Upload your code on the `https://dev.derivacloud.org/~<your-user-directory>` by the running the following command in your local chaise repository (This will upload your local code to the remote server):

    ```sh
    make deploy
    ```
    If you want to also deploy the existing config files in your local machine, you can use the `make deploy-w-config` command instead.


### Test cases
- To execute all test cases in sequential order, set the following:
  ```sh
  export SHARDING=false
  ```

  and then run the following command:

  ```sh
  $ make test
  ```

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

> While protractor can run in multiple browsers, we're only using Chrome for our e2e tests. To test Firefox, we would have to:
> - Change the `make update-webdriver` command to also install gecko drivers.
> - Change the configuration to properly set the browser settings in Firefox the same as Chrome (window size, etc.)
> - Make sure test specs are working properly on Firefox as well.


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
$ export REMOTE_CHAISE_DIR_PATH=some_user_name@dev.derivacloud.org:public_html/chaise
```

**CI**: For CI there is no need to set `REMOTE_CHAISE_DIR_PATH` as it copies the actual file to the **chaise-config.js** in its local directory where it is running the test-suite.

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

## Running tests in CI

### CI Testing workflow
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

When the code is pushed to ISI repo, the "Chaise end-to-end tests" Github workflow will run appropriate make commands, which will trigger the testing chain specified above.

### Environment Variables

**./.github/workflows/main.yml**: [.e2e.yml](https://github.com/informatics-isi-edu/chaise/blob/master/.github/workflows/e2e.yml)
specifies environment variables in Github workflow so that tests can be run successfully. Usually the env variables are set using terminal locally, to set them up in CI environment one has to configure e2e.yml file.

- Since CI e2e test require connecting to saucelabs, `SAUCE_USERNAME`, `SAUCE_ACCESS_KEY`,
  and `SAUCE_TUNNEL_IDENTIFIER` are defined . `SAUCE_TUNNEL_IDENTIFIER` is used
  internally in the `e2e.yml` to create a saucelab tunnel with that identifier. And then
  during the setup the same identifier is used to ensure connecting to the correct tunnel.
- `SHARDING: true` ensures running test cases in parallel.

While running tests on **CI** you don't need to set the `REMOTE_CHAISE_DIR_PATH` in **main.yml** file.

## Debugging

You can use [the Node.js built-in inspector](https://nodejs.org/en/docs/inspector) to debug the test cases. To do so,

1. Find the configuration that you want to debug. Since we're going to use Node.js, we have to directly target the configuration and cannot use the existing `make` targets. To make this easier, you can find the config locations in `Makefile`. In this example, we want to only debug faceting tests which is,
    ```
    test/e2e/specs/delete-prohibited/recordset/ind-facet.conf.js
    ```

2. Run protractor using `--inspect-break` to ensure debugging client waits for you to open it:
    ```
    node --inspect-break ./node_modules/.bin/protractor test/e2e/specs/delete-prohibited/recordset/ind-facet.conf.js
    ```
    - By default this will use the `9229` port. You can change this by doing `--inspect-break=0.0.0.0:1234`.

3. The previous command will create a debugger that listens to a specific port, and then waits for you to open an [inspector client](https://nodejs.org/en/docs/guides/debugging-getting-started/#inspector-clients). For the purpose of this document, we're going to use Chrome DevTools. So open Chrome and navigate to the following location:
    ```
    chrome://inspect
    ```

4. In the Chrome's inspect page, under the "Remote Target", you should see your target. Click on "inspect" for that target.

5. Chrome will open a new window that is focused on "Sources" tab. If this is the first time that you're debugging, you need to add Chaise folder to Chrome's workspace. To do so just click on "Add folder to workspace" and choose Chaise folder.

6. Now you can go ahead and find the file that you want to debug in Chaise folder and add your break points to the test folder.

7. Resume the execution after you've added your breakpoints and wait for protractor to reach that part of code.

## Writing test

Please use [this link](e2e-test-writing.md) to find more information about how to write new test cases.
