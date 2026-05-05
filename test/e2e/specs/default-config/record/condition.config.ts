import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'default-config/record/condition',
  configFileName: 'record/condition/dev.json',
  mainSpecName: 'default-config',
  testMatch: [
    'condition.spec.ts'
  ]
});
