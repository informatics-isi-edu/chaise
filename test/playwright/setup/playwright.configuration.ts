import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';
import { TestOptions } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.model';
import os from 'os';


export const STORAGE_STATE = resolve(__dirname, '../.auth/user.json');

const getConfig = (options: TestOptions) => {

  // the only way to pass object to setup/teardown is through env variables
  process.env.PLAYWRIGHT_TEST_OPTIONS = JSON.stringify(options);

  if (process.env.CI) {
    const hostname = os.hostname();
    process.env.ERMREST_URL = `http://${hostname}/ermrest`;
    process.env.CHAISE_BASE_URL = `http://${hostname}/chaise`;
  } else if (!process.env.ERMREST_URL || !process.env.CHAISE_BASE_URL) {
    throw new Error('ERMREST_URL and CHAISE_BASE_URL env variables are required.');
  }

  const config = defineConfig({

    testMatch: options.testMatch,

    // Look for test files in the "tests" directory, relative to this configuration file.
    // testDir: '',

    // Run all tests in parallel.
    fullyParallel: false,

    // Fail the build on CI if you accidentally left test.only in the source code.
    forbidOnly: !!process.env.CI,

    // Retry on CI only.
    retries: process.env.CI ? 2 : 0,

    // Opt out of parallel tests on CI.
    workers: process.env.CI ? 1 : undefined,

    // Reporter to use
    reporter: process.env.CI ? [
      ['html', { open: 'never', outputFolder: resolve(__dirname, `./../../../playwright-report/${options.testName}`) }],
      ['github']
    ] : [
      ['html', { open: 'never', outputFolder: resolve(__dirname, `./../../../playwright-report/${options.testName}`) }],
      ['list', { printSteps: true }]
    ],

    // outputDir: resolve(__dirname, './../../../playwright-output'),

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
        name: 'pretest',
        testDir: __dirname,
        testMatch: 'playwright.pretest.ts'
      },
      {
        name: 'chromium',
        dependencies: ['pretest'],
        use: {
          ...devices['Desktop Chrome'],
          storageState: STORAGE_STATE
        },
      },
    ],
  });


  return config;
}

export default getConfig;
