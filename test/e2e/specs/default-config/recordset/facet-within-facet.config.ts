import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'default-config/recordset/facet-within-facet',
  configFileName: 'recordset/facet-within-facet.dev.json',
  mainSpecName: 'default-config',
  testMatch: [ 'facet-within-facet.spec.ts' ]
});
