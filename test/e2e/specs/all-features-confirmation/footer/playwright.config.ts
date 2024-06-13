import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features-confirmation/footer',
  configFileName: 'footer/dev.json',
  mainSpecName: 'all-features-confirmation',
});
