import { expect, Page, test } from '@playwright/test';

import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';

import { clickNewTabLink, generateChaiseURL, manuallyTriggerFocus } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { testRecordsetTableRowValues } from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';

const testParams = {
  schemaName: 'related-table-actions',
  tableName: 'main',

}

// TODO we should eventually move related table action tests from related-table.spec.ts to here/
// Any new tests related to these actions should be added here.

test.describe('related table actions', () => {
  test.describe.configure({ mode: 'parallel' });

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    await page.goto(generateChaiseURL(APP_NAMES.RECORD, testParams.schemaName, testParams.tableName, testInfo, baseURL) + '/id=1');
    await RecordLocators.waitForRecordPageReady(page);
  });

  test('Open Bulk edit in a different tab and then bulk delete', async ({ page }) => {
    let recoreditPage: Page;

    await test.step('click on bulk edit and wait for recordedit', async () => {
      const bulkEditBtn = RecordLocators.getRelatedTableBulkEditLink(page, 'inbound1', false);
      recoreditPage = await clickNewTabLink(bulkEditBtn, true);
      await RecordeditLocators.waitForRecordeditPageReady(recoreditPage);
    });

    await test.step('click bulk delete and confirm.', async () => {
      const confirmModal = ModalLocators.getConfirmDeleteModal(recoreditPage);
      const modalOKBtn = ModalLocators.getOkButton(confirmModal);
      const deleteBtn = RecordeditLocators.getBulkDeleteButton(recoreditPage);

      await expect.soft(deleteBtn).toBeVisible();
      await deleteBtn.click();
      await expect.soft(confirmModal).toBeVisible();

      await expect.soft(ModalLocators.getModalText(confirmModal)).toHaveText('Are you sure you want to delete all 2 of the displayed records?');
      await expect.soft(modalOKBtn).toHaveText('Delete');
      await modalOKBtn.click();
      await expect.soft(confirmModal).not.toBeAttached();

      const summaryModal = ModalLocators.getErrorModal(recoreditPage);
      await expect.soft(summaryModal).toBeVisible();
      await expect.soft(ModalLocators.getModalTitle(summaryModal)).toHaveText('Batch Delete Summary');
    });

    await test.step('focusing on record page should update the content', async () => {
      await recoreditPage.close();
      await manuallyTriggerFocus(page);

      const currentEl = RecordLocators.getRelatedTableContainer(page, 'inbound1', false);
      await testRecordsetTableRowValues(currentEl, [], true);
    });
  });

});
