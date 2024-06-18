import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'delete-prohibited/recordset/histogram-facet',
  configFileName: 'recordset/histogram-facet.dev.json',
  mainSpecName: 'delete-prohibited',
  testMatch: [
    'histogram-facet.spec.ts'
  ]
});
