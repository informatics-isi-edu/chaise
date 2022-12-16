const config = {
  'preset': 'jest-puppeteer',
  'testMatch': ['**/specs/**/?(*.)+(spec|test).ts'],
  // 'globalSetup': '<rootDir>/test/e2e/utils/jest-setup.js',
  // 'globalTeardown': '<rootDir>/test/e2e/utils/jest-teardown.js',
  'projects': [
    {
      'displayName': 'all-features-confirmation',
      'preset': 'jest-puppeteer',
      'testMatch': ['**/specs/all-features-confirmation/**/?(*.)+(spec|test).ts'],
    },
    {
      'displayName': 'sample',
      'preset': 'jest-puppeteer',
      'testMatch': ['**/specs/sample/?(*.)+(spec|test).ts'],
    }
  ]
};

module.exports = config;
