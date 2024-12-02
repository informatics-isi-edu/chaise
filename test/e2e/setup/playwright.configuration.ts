import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';

import { TestOptions } from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.model';
import { MAIN_USER_STORAGE_STATE, PW_PROJECT_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';

const getConfig = (options: TestOptions) => {

  // the only way to pass object to setup/teardown is through env variables
  process.env.PLAYWRIGHT_TEST_OPTIONS = JSON.stringify(options);

  if (process.env.CI) {
    /**
     * TODO we used to use os.hostname() but I changed it to localhost
     * because the copy to clipboard wasn't working without https. but it seems to work properly with localhost
     */
    // const hostname = os.hostname();
    const hostname = 'localhost'
    process.env.ERMREST_URL = `http://${hostname}/ermrest`;
    process.env.CHAISE_BASE_URL = `http://${hostname}/chaise`;
  } else if (!process.env.ERMREST_URL || !process.env.CHAISE_BASE_URL) {
    throw new Error('ERMREST_URL and CHAISE_BASE_URL env variables are required.');
  }

  const reporterFolder = resolve(__dirname, `./../../../playwright-report/${options.testName}`);

  const extraBrowserParams = {
    storageState: MAIN_USER_STORAGE_STATE
  };

  const config = defineConfig({

    testMatch: options.testMatch ? options.testMatch : /.*\.spec\.ts/,

    // increase the default timeout
    timeout: 60 * 1000,
    expect: {
      timeout: 15 * 1000
    },

    // Look for test files in the "tests" directory, relative to this configuration file.
    // testDir: '',

    // Run all tests in parallel.
    fullyParallel: false,

    // Fail the build on CI if you accidentally left test.only in the source code.
    forbidOnly: !!process.env.CI,

    retries: 0,

    // Opt out of parallel tests on CI.
    // workers: process.env.CI ? 4 : undefined,
    workers: options.runSequentially ? 1 : 4,

    // the outputDir is used for screenshot or other tests that use a file, so we should define it anyways
    outputDir: resolve(__dirname, `./../../../playwright-output/${options.testName}`),

    // Reporter to use
    reporter: process.env.CI ? [
      ['html', { open: 'never', outputFolder: reporterFolder }],
      ['github']
    ] : [
      ['html', { open: 'never', outputFolder: reporterFolder }],
      ['list', { printSteps: true }]
    ],

    globalSetup: require.resolve('./playwright.setup'),
    globalTeardown: require.resolve('./playwright.teardown'),

    use: {
      // Base URL to use in actions like `await page.goto('/')`.
      baseURL: process.env.CHAISE_BASE_URL,

      // Collect trace when retrying the failed test.
      trace: 'on-first-retry',

      // screenshots will be added to the playwright-report folder
      screenshot: 'only-on-failure',

      // set the timezone to Los Angeles
      timezoneId: 'America/Los_Angeles'
    },
    // Configure projects for major browsers.
    projects: [
      {
        name: PW_PROJECT_NAMES.PRETEST,
        testDir: __dirname,
        testMatch: 'playwright.pretest.ts'
      },
      {
        name: PW_PROJECT_NAMES.CHROME,
        dependencies: [PW_PROJECT_NAMES.PRETEST],
        use: {
          ...devices['Desktop Chrome'],
          channel: 'chromium', // https://github.com/microsoft/playwright/issues/33566
          ...extraBrowserParams,
          permissions: ['clipboard-read', 'clipboard-write']
        },
      },
      // {
      //   name: PW_PROJECT_NAMES.FIREFOX,
      //   dependencies: [PW_PROJECT_NAMES.PRETEST],
      //   use: {
      //     ...devices['Desktop Firefox'],
      //     ...extraBrowserParams,
      //     launchOptions: {
      //       firefoxUserPrefs: {
      //         'dom.events.asyncClipboard.readText': true,
      //         'dom.events.testing.asyncClipboard': true,
      //       },
      //     }
      //   },
      // },
      // {
      //   name: PW_PROJECT_NAMES.SAFARI,
      //   dependencies: ['pretest'],
      //   use: { ...devices['Desktop Safari'], ...extraBrowserParams },
      // },
    ],
  });


  return config;
}

export default getConfig;
