import getConfig from '@isrd-isi-edu/e2e-test/utils/playwright.configuration';

export default getConfig({
  testName: 'all-features',
  configFileName: 'parallel-configs/all-features.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/all-features/chaise-config.js',
});