import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/input-iframe',
  configFileName: 'recordedit/input-iframe.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/all-features/chaise-config.js',
  testMatch: [
    'input-iframe.spec.ts'
  ]
});
