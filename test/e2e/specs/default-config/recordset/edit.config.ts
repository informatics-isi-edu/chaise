import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'default-config/recordset/edit',
  configFileName: 'recordset/edit.dev.json',
  mainSpecName: 'default-config',
  testMatch: [
    'edit.spec.ts'
  ]
});
