import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features',
  configFileName: 'parallel-configs/all-features.dev.json',
  mainSpecName: 'all-features',
  runSequentially: true
});
