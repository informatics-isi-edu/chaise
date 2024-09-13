import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/record/related-table',
  testMatch: 'related-table.spec.ts',
  configFileName: 'record/related-table/dev.json',
  mainSpecName: 'all-features',
});
