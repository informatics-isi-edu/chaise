import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'default-config/record/image-fallback',
  configFileName: 'record/image-fallback.dev.json',
  mainSpecName: 'default-config',
  testMatch: [
    'image-fallback.spec.ts'
  ]
});
