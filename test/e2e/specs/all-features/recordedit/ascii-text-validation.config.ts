import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/recordedit/ascii-text-validation',
  configFileName: 'recordedit/ascii-text-validation.dev.json',
  mainSpecName: 'all-features',
  testMatch: [
    'ascii-text-validation.spec.ts'
  ]
});
