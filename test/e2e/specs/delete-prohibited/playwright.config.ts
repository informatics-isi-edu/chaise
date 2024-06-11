import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'delete-prohibited',
  configFileName: 'parallel-configs/delete-prohibited.dev.json',
  mainSpecName: 'delete-prohibited',
});
