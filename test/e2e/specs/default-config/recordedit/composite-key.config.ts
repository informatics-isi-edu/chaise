import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/recordedit/composite-key',
  configFileName: 'recordedit/composite-key.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/default-config/chaise-config.js',
  testMatch: [ 'composite-key.spec.ts' ]
});
