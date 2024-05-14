import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'delete-prohibited/recordset/ind-facet',
  configFileName: 'recordset/ind-facet.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/delete-prohibited/chaise-config.js',
  testMatch: [ 'ind-facet.spec.ts' ]
});