import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'delete-prohibited/navbar',
  configFileName: 'navbar/catalog-chaise-config.dev.json',
  mainSpecName: 'delete-prohibited',
});
