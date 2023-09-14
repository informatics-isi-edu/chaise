import getConfig from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features',
  configFileName: 'parallel-configs/all-features.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/all-features/chaise-config.js',
});
