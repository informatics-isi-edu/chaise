import getConfig from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/related-table',
  testMatch: 'related-table.spec.ts',
  configFileName: 'record/related-table/dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/all-features/chaise-config.js',
});
