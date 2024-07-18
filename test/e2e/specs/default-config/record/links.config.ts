import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'default-config/record/links',
  configFileName: 'record/links.dev.json',
  mainSpecName: 'default-config',
  testMatch: [
    'links.spec.ts'
  ]
});
