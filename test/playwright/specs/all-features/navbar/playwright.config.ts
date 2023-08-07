import getConfig from '@isrd-isi-edu/e2e-test/utils/playwright.configuration';

export default getConfig({
  testName: 'navbar',
  configFileName: 'navbar/dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/all-features/chaise-config.js',
});
