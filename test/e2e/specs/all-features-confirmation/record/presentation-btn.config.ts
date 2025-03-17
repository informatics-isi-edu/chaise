import getConfig from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.configuration';

export default getConfig({
  testName: 'all-features-confirmation/record/presentation-btn',
  configFileName: 'record/dev.json',
  mainSpecName: 'all-features-confirmation',
  testMatch: [
    'presentation.spec.ts',
    'create-btn.spec.ts',
    'delete-btn.spec.ts',
    'edit-btn.spec.ts',
    'related-table-actions.spec.ts',
  ]
});
