import { test, expect } from '@playwright/test';

// locators
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';

// utils
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams = {
  schema_name: 'product-create-btn',
  table_name: 'accommodation',
  key: 'id=2002'
};

test(`View existing record for table ${testParams.table_name}`, async ({ page, baseURL }, testInfo) => {

  await test.step('should load record page', async () => {
    await page.goto(generateChaiseURL(APP_NAMES.RECORD, testParams.schema_name, testParams.table_name, testInfo, baseURL) + `/${testParams.key}`);
    await RecordLocators.waitForRecordPageReady(page);
  });

  await test.step('should load chaise-config.js and have editRecord=true', async () => {
    expect.soft(await page.evaluate(() => {
      // cast to 'any' typed variable so we can avoid typescript errors
      const windowRef: any = window;
      return windowRef.chaiseConfig.editRecord;
    })).toBeTruthy();
  });

  await test.step('Clicking the create record button should redirect to recordedit app', async () => {
    await RecordLocators.getCreateRecordButton(page).click();
    await expect.soft(page).toHaveURL(/recordedit/);
    await RecordeditLocators.waitForRecordeditPageReady(page);
  });
});
