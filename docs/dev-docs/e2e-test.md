<!-- omit from toc -->
# End to End Testing Documentation

E2E tests are automation tests that simulate a user interacting with the app and assert or expect the app would act correctly accordingly. This document will explain how you can configure and run the e2e test cases. Please use [this link](e2e-test-writing.md) to find more information about how to write new test cases.

<!-- omit from toc -->
## Table of contents

- [Tools used](#tools-used)
- [Setup](#setup)
- [How To Run Tests](#how-to-run-tests)
  - [Prerequistes](#prerequistes)
  - [Test cases](#test-cases)
- [File structure](#file-structure)
  - [Config files](#config-files)
- [Debugging](#debugging)
  - [Github Actions debugging](#github-actions-debugging)
- [Writing test](#writing-test)
- [Screenshot testing](#screenshot-testing)

## Tools used
- [**Playwright**](https://playwright.dev/): The E2e test framework that we're using.
- **NPM**: to install necessary NodeJS packages
- **Github workflow**: to do continuous integration (CI) by automatically testing every time code is pushed to Github repo
- **Makefile**: to invoke NPM to install packages necessary for running tests and invoke Playwright (which will run the tests).

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

These variables are used in our test framework to communicate with ERMrest. The following is how these variables most probably should look like:

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

    This will install all the npm dependencies that are needed and will also make sure the Playwright browsers are installed.

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
  make test
  ```

- To execute all the test cases in parallel, set the following:

  ```sh
  export SHARDING=true
  ```

  and then run the following command:

  ```sh
  make testparallel
  ```

- To run a specific test config

    ```sh
    npx playwright test --config test/e2e/specs/all-features/playwright.config.ts

    npx playwright test --config test/e2e/specs/all-features/record/related-table.config.ts
    ```

- To limit the spec to just one browser

    ```sh
    npx playwright test --project=chrome --config test/e2e/specs/all-features/playwright.config.ts
    ```

- Run tests in headed browsers

    ```sh
    npx playwright test --headed --config test/e2e/specs/all-features/playwright.config.ts
    ```

## File structure

```
e2e/
├─ data_setup/
│  ├─ config/                         # test configuration files
│  │  ├─ <name>/
│  │  │  ├─ <name>.dev.json           # lists the schema config files (*.config.json)
│  │  │  ├─ <name>.config.json        # the configuration for data utils that
│  ├─ data/
│  │  ├─ <name>/
│  │  │  ├─ <table_name>.json         # data for a table
│  ├─ schema/
├─ setup/                             # The playwright specific setup files
├─ specs/
│  ├─ <group_name>/
│  │  ├─ <name>.config.ts             # The config file that should be targeted for running tests
│  │  ├─ <name>.spec.ts               # the test spec file
├─ locators/
│  ├─ <name>.ts                       # common locators that will be used by test specs
├─ utils/
│  ├─ <name>.ts                       # common utility functions that can be used everywhere
```

### Config files

- The expected format for the `<name>.dev.json` file:
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



## Debugging

To debug Playwright tests,

1. Add `await page.pause();` wherever you want the execution to stop.

2. Use the `--debug` CLI argument. You can also use `-x` (stop after first failure) and `project=chrome` to limit the run:

  ```
  npx playwright test --config CONFIG_LOC --project=NAME_OF_PROEJECT --debug
  npx playwright test --config CONFIG_LOC --project=NAME_OF_PROEJECT --debug -x
  ```

More info: https://playwright.dev/docs/test-cli

### Github Actions debugging

There's a chance a test case will fail in github actions only and not locally. This makes it very difficult to reproduce/test without a browser to show what is happening. In github actions, if you download the playwright report, there will be images with the HTML report of the pages when they did fail.

This isn't "perfect" since it captures the state of the browser when the test "ends" not when the test fails. We often have tests written with `test.step` and `expect.soft` which will run tests in sequence and usually not cause later tests to fail just because an earlier one did. More info about screencaps with `test.step` and `expect.soft` in [this github issue](https://github.com/microsoft/playwright/issues/14854).

If there is a suspicion that a test is failing only in github actions, to get an accurate screencap, comment out the rest of the `test.step`s that are after the failing step so that the state during the "failing" test.step will be properly captured.

## Writing test

Please use [this link](e2e-test-writing.md) to find more information about how to write new test cases.


## Screenshot testing

As originally mentioned in [this issue](https://github.com/informatics-isi-edu/chaise/issues/2368) we might want to explore doing screenshot testing. The following is how this could be done in Playwright:

```ts
import { test, expect } from '@playwright/test';

// locators
import RecordLocators from '@isrd-isi-edu/chaise/test/playwright/locators/record';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/playwright/locators/recordset';

test.describe('visual testing atlas', () => {
  test('Collection recordset page', async ({ page }) => {
    await page.goto('https://dev.derivacloud.org/chaise/recordset/#2/Common:Collection@sort(RMT::desc::,RID)');

    await RecordsetLocators.waitForRecordsetPageReady(page);
    await RecordsetLocators.waitForAggregates(page);

    // on  load we're focusing on the first opened one and therefore will have a different border
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot({ fullPage: true });
  })

  test('Collection record page', async ({ page }) => {
    await page.goto('https://dev.derivacloud.org/chaise/record/#2/Common:Collection/RID=17-E76T');

    await RecordLocators.waitForRecordPageReady(page);

    await expect(page).toHaveScreenshot({ fullPage: true });

    await page.evaluate(() => {
      return document.querySelector('.related-section-container.chaise-accordions')!.scrollIntoView();
    });

    await expect(page).toHaveScreenshot({ fullPage: true });
  })

});
```

- `fullPage` config allows us to screenshot the whole page. But because of how we're defining the scrollable section, it still won't be able to capture the page fully. That's why I'm scrolling to the related section and taking a different screenshot in the record page example.
- While I'm using atlas-d2k in my example, this should be part of the test framework in our final solution. We must discuss whether we want to initiate this manually or have it as part of our automated testing. Regardless, it should use test data and not an existing production.
- In our discussion, we discussed using this method as part of the review process for the UI features. So, for example, we could run a similar script on the master to get the initial screenshots and then rerun it on the feature branch to compare.
