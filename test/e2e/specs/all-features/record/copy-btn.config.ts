import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/record/copy-btn',
  configFileName: 'record/copy-btn.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/all-features/chaise-config.js',
  testMatch: [
    'copy-btn.spec.ts'
  ]
});
