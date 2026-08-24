import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'erd',
  configFileName: 'erd/dev.json',
  mainSpecName: 'erd',
});
