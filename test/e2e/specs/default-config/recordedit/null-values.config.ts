import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'default-config/recordedit/null-values',
  configFileName: 'recordedit/null-values.dev.json',
  mainSpecName: 'default-config',
  testMatch: [ 'null-values.spec.ts' ]
});
