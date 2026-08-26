import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'model-app',
  configFileName: 'model-app/dev.json',
  mainSpecName: 'model-app',
});
