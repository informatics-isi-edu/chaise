import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/recordedit/foreign-key-dropdown',
  configFileName: 'recordedit/foreign-key-dropdown.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/default-config/chaise-config.js',
  testMatch: [ 'foreign-key-dropdown.spec.ts' ]
});
