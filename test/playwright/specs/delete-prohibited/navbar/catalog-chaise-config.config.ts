import getConfig from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.configuration';

export default getConfig({
  testName: 'delete-prohibited/navbar',
  configFileName: 'navbar/catalog-chaise-config.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/delete-prohibited/chaise-config.js',
});
