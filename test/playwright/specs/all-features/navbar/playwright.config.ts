import getConfig from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.configuration';

export default getConfig({
  testName: 'navbar',
  configFileName: 'navbar/dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/all-features/chaise-config.js',
});
