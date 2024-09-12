import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  manualTestConfig: true,
  testName: 'manual/recordset',
  configFileName: 'dev-recordset.json',
  testMatch: [
    'recordset.spec.ts'
  ]
});
