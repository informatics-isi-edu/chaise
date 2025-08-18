import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'delete-prohibited/record/file-preview',
  configFileName: 'record/file-preview.dev.json',
  mainSpecName: 'delete-prohibited',
  testMatch: [
    'file-preview.spec.ts'
  ]
});
