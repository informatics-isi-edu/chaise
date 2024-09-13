import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/record/copy-btn',
  configFileName: 'record/copy-btn.dev.json',
  mainSpecName: 'all-features',
  testMatch: [
    'copy-btn.spec.ts'
  ]
});
