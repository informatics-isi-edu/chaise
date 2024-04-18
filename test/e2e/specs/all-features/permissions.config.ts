import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/permissions',
  configFileName: 'multi-permissions/dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/all-features/chaise-config.js',
  testMatch: [
    'acls/*.spec.ts'
  ]
});
