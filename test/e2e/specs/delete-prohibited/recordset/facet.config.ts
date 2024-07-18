import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'delete-prohibited/recordset/facet',
  configFileName: 'recordset/facet.dev.json',
  mainSpecName: 'delete-prohibited',
  testMatch: [
    'facet-presentation.spec.ts',
    'individual-facet.spec.ts',
    'four-facet-selections.spec.ts',
    'misc-facet.spec.ts'
  ]
});
