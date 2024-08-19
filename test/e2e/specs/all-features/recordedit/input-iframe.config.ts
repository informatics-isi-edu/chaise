import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/recordedit/input-iframe',
  configFileName: 'recordedit/input-iframe.dev.json',
  mainSpecName: 'all-features',
  testMatch: [
    'input-iframe.spec.ts'
  ]
});
