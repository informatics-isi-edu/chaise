import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'default-config/recordedit/immutable-inputs',
  configFileName: 'recordedit/immutable-inputs.dev.json',
  mainSpecName: 'default-config',
  testMatch: [ 'immutable-inputs.spec.ts' ]
});
