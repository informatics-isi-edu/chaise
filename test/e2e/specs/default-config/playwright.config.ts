import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'delete-prohibited',
  configFileName: 'parallel-configs/default-config.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/default-config/chaise-config.js',
});
