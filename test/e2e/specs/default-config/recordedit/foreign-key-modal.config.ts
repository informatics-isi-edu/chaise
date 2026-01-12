import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'default-config/recordedit/foreign-key-modal',
  configFileName: 'recordedit/foreign-key-modal.dev.json',
  mainSpecName: 'default-config',
  testMatch: [
    'foreign-key-modal.spec.ts'
  ]
});
