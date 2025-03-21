import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features',
  configFileName: 'parallel-configs/all-features.dev.json',
  mainSpecName: 'all-features',
  /**
   * a lot of test cases in this spec are modifying the catalog anotation.
   * so we have to make sure we're running tests here sequentially otherwise the catalog annotation might not be
   * in the expected state.
   */
  runSequentially: true
});
