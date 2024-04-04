import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'delete-prohibited/record',
  configFileName: 'record/no-delete.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/delete-prohibited/chaise-config.js',
  testMatch: [
    'no-delete-btn.spec.ts'
  ]
});
