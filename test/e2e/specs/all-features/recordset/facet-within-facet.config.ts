import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/recordset/facet-within-facet',
  configFileName: 'recordset/facet-within-facet.dev.json',
  mainSpecName: 'all-features',
  testMatch: [ 'facet-within-facet.spec.ts' ]
});
