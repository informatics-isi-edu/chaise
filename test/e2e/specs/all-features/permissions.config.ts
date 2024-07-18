import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/permissions',
  configFileName: 'multi-permissions/dev.json',
  mainSpecName: 'all-features',
  testMatch: [
    'acls/main.spec.ts',
    '*/permissions-annotation.spec.ts'
  ]
});
