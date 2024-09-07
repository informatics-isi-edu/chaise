import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'default-config/recordset/add',
  configFileName: 'recordset/add.dev.json',
  mainSpecName: 'default-config',
  testMatch: [
    'add.spec.ts'
  ]
});
