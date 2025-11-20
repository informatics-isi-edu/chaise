import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'delete-prohibited/recordset/facet-group',
  configFileName: 'recordset/facet-group.dev.json',
  mainSpecName: 'delete-prohibited',
  testMatch: [
    'facet-group-*.spec.ts',
  ]
});
