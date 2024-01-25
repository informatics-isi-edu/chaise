import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';
import os from 'os';

import { TestOptions } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.model';
import { STORAGE_STATE, PRESET_PROJECT_NAME } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.parameters';

const getConfig = (options: TestOptions) => {

  // the only way to pass object to setup/teardown is through env variables
  process.env.PLAYWRIGHT_TEST_OPTIONS = JSON.stringify(options);

  if (process.env.CI) {
    // const hostname = os.hostname();
    const hostname = 'localhost'
    process.env.ERMREST_URL = `http://${hostname}/ermrest`;
    process.env.CHAISE_BASE_URL = `http://${hostname}/chaise`;
  } else if (!process.env.ERMREST_URL || !process.env.CHAISE_BASE_URL) {
    throw new Error('ERMREST_URL and CHAISE_BASE_URL env variables are required.');
  }

  const reporterFolder = resolve(__dirname, `./../../../playwright-report/${options.testName}`);

  const extraBrowserParams = {
    storageState: STORAGE_STATE,
    permissions: ['clipboard-read', 'clipboard-write']
  };

  const config = defineConfig({

    testMatch: options.testMatch,

    // Look for test files in the "tests" directory, relative to this configuration file.
    // testDir: '',

    // Run all tests in parallel.
    fullyParallel: false,

    // Fail the build on CI if you accidentally left test.only in the source code.
    forbidOnly: !!process.env.CI,

    // Retry on CI only.
    // TODO do we want retries?
    // retries: process.env.CI ? 2 : 0,
    retries: 0,

    // Opt out of parallel tests on CI.
    workers: process.env.CI ? 4 : undefined,

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
    },
    // Configure projects for major browsers.
    projects: [
      {
        name: PRESET_PROJECT_NAME,
        testDir: __dirname,
        testMatch: 'playwright.pretest.ts'
      },
      {
        name: 'chromium',
        dependencies: ['pretest'],
        use: { ...devices['Desktop Chrome'], ...extraBrowserParams },
      },
      // {
      //   name: 'firefox',
      //   dependencies: ['pretest'],
      //   use: { ...devices['Desktop Firefox'], ...extraBrowserParams },
      // },
      // {
      //   name: 'webkit',
      //   dependencies: ['pretest'],
      //   use: { ...devices['Desktop Safari'], ...extraBrowserParams },
      // },
    ],
  });


  return config;
}

export default getConfig;
