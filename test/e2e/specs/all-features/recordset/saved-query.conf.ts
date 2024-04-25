import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/recordset/saved-query',
  configFileName: 'recordset/saved-query.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/all-features/chaise-config.js',
  testMatch: [ 'saved-query.spec.ts' ]
});