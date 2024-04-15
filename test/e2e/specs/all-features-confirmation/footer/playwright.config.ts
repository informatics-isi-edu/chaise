import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features-confirmation/footer',
  configFileName: 'footer/dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/all-features-confirmation/chaise-config.js',
});
