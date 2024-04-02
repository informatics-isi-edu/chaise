import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'default-config/multi-form-input',
  testMatch: [
    'multi-form-input-clone.spec.ts',
    'multi-form-input-create.spec.ts',
    'multi-form-input-edit.spec.ts'
  ],
  configFileName: 'recordedit/multi-form-input.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/default-config/chaise-config.js',
});
