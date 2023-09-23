# End to End Testing Documentation

For now, we only have E2E tests in Chaise. E2E tests are automation tests that simulate a user interacting with the app and assert or expect the app would act correctly accordingly. This document will explain how you can configure and run the e2e test cases. Please use [this link](e2e-test-writing.md) to find more information about how to write new test cases.


## Tools used
- [**Playwright**](https://playwright.dev/): The E2e test framework that we're using.
- **NPM**: to install necessary NodeJS packages
- **Github workflow**: to do continuous integration (CI) by automatically testing every time code is pushed to Github repo
- **Makefile**: to invoke NPM to install packages necessary for running tests and invoke Protractor (which will run the tests).

## Setup

To run E2E tests on your machine, make sure that you've installed `Node.js`. For development environments we recommends installing [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) which will allow you to easily install and switch between different versions.

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
export CHAISE_BASE_URL=https://dev.isrd.isi.edu/~<your-user-directory>chaise # No trailing `/`
export ERMREST_URL=https://dev.isrd.isi.edu/ermrest # No trailing `/`
export AUTH_COOKIE="webauthn=PutYourCookieHere;" # You have to put `webauthn=` at the beginging and `;` at the end.
export RESTRICTED_AUTH_COOKIE="webauthn=PutAnotherCookieHere;" # You have to put `webauthn=` at the beginging and `;` at the end.
export REMOTE_CHAISE_DIR_PATH=chirag@dev.isrd.isi.edu:public_html/chaise # No trailing `/`
export SHARDING=false
```

You can get your cookie by querying the database, or using the following simple steps:

1. Open up any chaise page in the deployment that you want to run test cases on.
2. Login. The account that you are using must have delete and create access. We use this cookie to create and delete catalogs.
3. Open the Developer tools in your browser.
4. Go to the console section and write `$.cookie("webauthn")`.


## How To Run Tests
### Prerequistes
1. After setting up the environment variables, make sure that the `https://dev.isrd.isi.edu/~<your-user-directory>` directory has the public access(if not, give the folder the following permissions `chmod 755 <your-user-directory>`).

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

4. Upload your code on the `https://dev.isrd.isi.edu/~<your-user-directory>` by the running the following command in your local chaise repository (This will upload your local code to the remote server):

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
    $ npx playwright test --config test/e2e/specs/search/data-independent/protractor.conf.js
    ```

## File structure

TODO

## Configuration

TODO

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
}
```

- The `setup` object  allows you to specify whether the test-cases should create or use existing catalog, schema, tables and entities before running the testcases.
- The `cleanup` property if true will delete all the data that was created in the dataSetup phase.


## Running tests in CI

TODO

## Debugging

TODO

```
page.pause();

npx playwright test --config CONFIG_LOC --project=NAME_OF_PROEJECT --debug
```

## Writing test

Please use [this link](e2e-test-writing.md) to find more information about how to write new test cases.
