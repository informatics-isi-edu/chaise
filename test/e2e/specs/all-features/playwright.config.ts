import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

/**
 * specs in this group that modify the catalog (annotations, ACLs) declare the TEST_LOCKS.CATALOG_MODEL lock,
 * so playwright never runs them at the same time. everything else runs in parallel.
 */
export default getConfig({
  testName: 'all-features',
  configFileName: 'parallel-configs/all-features.dev.json',
  mainSpecName: 'all-features'
});
