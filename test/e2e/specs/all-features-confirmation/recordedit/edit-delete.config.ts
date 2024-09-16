import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features-confirmation/recordedit/edit-delete',
  configFileName: 'recordedit/edit.dev.json',
  mainSpecName: 'all-features-confirmation',
  testMatch: [
    'edit.spec.ts',
    'delete.spec.ts'
  ]
});
