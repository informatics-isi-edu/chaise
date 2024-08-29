import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features-confirmation/recordset/presentation',
  configFileName: 'recordset/dev.json',
  mainSpecName: 'all-features-confirmation',
  testMatch: [
    'presentation.spec.ts'
  ]
});
