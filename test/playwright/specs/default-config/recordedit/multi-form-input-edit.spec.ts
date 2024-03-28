import { test, expect, Page, TestInfo } from '@playwright/test';
import ModalLocators from '@isrd-isi-edu/chaise/test/playwright/locators/modal';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/playwright/locators/recordset';
import RecordLocators from '@isrd-isi-edu/chaise/test/playwright/locators/record';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/playwright/locators/recordedit';
import { getCatalogID, getEntityRow } from '@isrd-isi-edu/chaise/test/playwright/utils/catalog-utils';
import { testRecordsetTableRowValues } from '@isrd-isi-edu/chaise/test/playwright/utils/recordset-utils';

const MULI_FORM_INPUT_FORM_NUMBER = -1;

test.describe('Regarding multi form input button', () => {
  const getURL = (testInfo: TestInfo, schema_table: string) => {
    return `/recordedit/#${getCatalogID(testInfo.project.name)}/${schema_table}`;
  }

  test('in single edit the toggle button should not be available', async ({ page, baseURL }, testInfo) => {
    await page.goto(`${baseURL}${getURL(testInfo, 'multi-form-input:main')}/id=9001`);
    await RecordeditLocators.waitForRecordeditPageReady(page);

    await expect.soft(RecordeditLocators.getMultiFormToggleButton(page, 'markdown_col')).toBeVisible();
  });

  test('in multi edit', async ({ page }, testInfo) => {
    await test.step('the toggle button should be offered on all non-disabled columns.', async () => {
      //TODO
    });

    await test.step('user should be able to use this control to change some values for columns.', async () => {
      //TODO
    });
  });

  test('domain-filter support', async ({page}, testInfo) => {
    //TODO
  });

});

