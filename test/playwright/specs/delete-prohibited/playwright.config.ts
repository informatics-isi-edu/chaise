import getConfig from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.configuration';

export default getConfig({
  testName: 'delete-prohibited',
  configFileName: 'parallel-configs/delete-prohibited.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/delete-prohibited/chaise-config.js',
});