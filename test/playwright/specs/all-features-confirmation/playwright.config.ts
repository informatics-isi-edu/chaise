import getConfig from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features-confirmation',
  configFileName: 'parallel-configs/all-features-confirmation.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/all-features-confirmation/chaise-config.js',
});
