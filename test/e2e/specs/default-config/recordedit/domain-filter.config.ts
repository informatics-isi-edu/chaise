import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'default-config/recordedit/domain-filter',
  configFileName: 'recordedit/domain-filter.dev.json',
  mainSpecName: 'default-config',
  testMatch: [ 'domain-filter.spec.ts' ]
});
