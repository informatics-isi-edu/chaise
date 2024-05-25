import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features/recordedit/domain-filter',
  configFileName: 'recordedit/domain-filter.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/default-config/chaise-config.js',
  testMatch: [ 'domain-filter.spec.ts' ]
});
