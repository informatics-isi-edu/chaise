import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';


const getConfig = (options: any) => {
  process.env.PLAYWRIGHT_TEST_OPTIONS = JSON.stringify(options);

  console.log(`running ${process.env.CI ? 'on CI' : 'locally'}.`);

  const testName = options.testName ? options.testName : 'test';

  const config = defineConfig({

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
      ['line']
    ] : [
      ['html', { open: 'never', outputFolder: resolve(__dirname, `./../../../playwright-report/${options.testName}`) }],
      ['list', { printSteps: true }]
    ],

    // outputDir: resolve(__dirname, './../../../playwright-output'),

    globalSetup: require.resolve('./playwright.setup'),
    globalTeardown: require.resolve('./playwright.teardown'),

    use: {
      // Base URL to use in actions like `await page.goto('/')`.
      baseURL: '',

      // Collect trace when retrying the failed test.
      trace: 'on-first-retry',
    },
    // Configure projects for major browsers.
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
    ],
    // Run your local dev server before starting the tests.
  // webServer: {
    //   command: 'npm run start',
    //   url: 'http://127.0.0.1:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
  });


  return config;
}

export default getConfig;
