import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'default-config/recordedit/composite-key',
  configFileName: 'recordedit/composite-key.dev.json',
  mainSpecName: 'default-config',
  testMatch: [ 'composite-key.spec.ts' ]
});
