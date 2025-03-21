import { test, expect } from '@playwright/test';

import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';

import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

test('Bulk delete in recordedit', async ({ page, baseURL }, testInfo) => {

  await test.step('navigate to recordedit page', async () => {
    await page.goto(generateChaiseURL(APP_NAMES.RECORDEDIT, 'product-delete', 'accommodation', testInfo, baseURL) + '/id=2000;id=4004');
    await RecordeditLocators.waitForRecordeditPageReady(page);
  });

  await test.step('Bulk delete button should be present and user should be able to click it.', async () => {
    const confirmModal = ModalLocators.getConfirmDeleteModal(page);
    const modalOKBtn = ModalLocators.getOkButton(confirmModal);
    const deleteBtn = RecordeditLocators.getBulkDeleteButton(page);

    await expect.soft(deleteBtn).toBeVisible();
    await deleteBtn.click();
    await expect.soft(confirmModal).toBeVisible();

    await expect.soft(ModalLocators.getModalText(confirmModal)).toHaveText('Are you sure you want to delete all 2 of the displayed records?');
    await expect.soft(modalOKBtn).toHaveText('Delete');
    await modalOKBtn.click();
    await expect.soft(confirmModal).not.toBeAttached();
  });

  await test.step('After the delete is done, user should see the proper message', async () => {
    const summaryModal = ModalLocators.getErrorModal(page);
    await expect.soft(summaryModal).toBeVisible();
    await expect.soft(ModalLocators.getModalTitle(summaryModal)).toHaveText('Batch Delete Summary');

    const expectedBody = [
      'All of the 2 displayed records successfully deleted.',
      'Click OK to go to the Recordset.'
    ].join('');
    await expect.soft(ModalLocators.getModalText(summaryModal)).toHaveText(expectedBody);
  });

  await test.step('clicking on "ok" button should redirect users to recordset page', async () => {
    await ModalLocators.getOkButton(ModalLocators.getErrorModal(page)).click();
    await page.waitForURL('**/recordset/**');
  });

})
