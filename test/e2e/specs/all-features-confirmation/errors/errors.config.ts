import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features-confirmation/errors',
  configFileName: 'errors/dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/all-features-confirmation/chaise-config.js',
  testMatch: [
    'errors.spec.ts'
  ]
});
