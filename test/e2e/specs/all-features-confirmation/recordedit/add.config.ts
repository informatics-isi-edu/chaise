import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features-confirmation/recordedit/add',
  configFileName: 'recordedit/add.dev.json',
  mainSpecName: 'all-features-confirmation',
  testMatch: [
    'add.spec.ts',
    'add-sequential.spec.ts'
  ]
});
