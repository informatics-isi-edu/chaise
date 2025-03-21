import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'default-config/services',
  configFileName: 'parallel-configs/default-config.dev.json',
  mainSpecName: 'default-config',
  testMatch: [
    'services.spec.ts'
  ]
});
