import { test, expect, TestInfo, Page } from '@playwright/test';

import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';

import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

test.describe('Viewing Recordedit app with permission related annotations', () => {

  test('for a create-only table, the app should not load the form and displays error modal instead', async ({ page, baseURL }, testInfo) => {
    await openThePage('main_create_table', page, baseURL, testInfo);
    await testUnauthorizedAccess(page);
  });

  test('for a read-only table, the app should not load the form and displays error modal instead', async ({ page, baseURL }, testInfo) => {
    await openThePage('main_read_table', page, baseURL, testInfo);
    await testUnauthorizedAccess(page);
  });

  test('for a delete-only table, the app should not load the form and displays error modal instead', async ({ page, baseURL }, testInfo) => {
    await openThePage('main_delete_table', page, baseURL, testInfo);
    await testUnauthorizedAccess(page);
  });

  test('for a table that allows create and edit and not delete', async ({ page, baseURL }, testInfo) => {
    await test.step('should load the page without any errors', async () => {
      await openThePage('main_update_table', page, baseURL, testInfo);
      await RecordeditLocators.waitForRecordeditPageReady(page);
    });

    await test.step('should disable the bulk delete button', async () => {
      const btn = RecordeditLocators.getBulkDeleteButton(page);
      await expect.soft(btn).toBeVisible();
      await expect.soft(btn).toBeDisabled();
    });

    await test.step('foreignkey popups', async () => {
      await test.step('should not show the create button for a read-only fk table', async () => {
        await openFKPopupAndTestCreateButton(page, 'col_out_read', false);
      });

      await test.step('should show the create button for a fk table that allows create', async () => {
        await openFKPopupAndTestCreateButton(page, 'col_out_create', true);
      });

      await test.step('should not show the create button for a fk table that allows update and create', async () => {
        await openFKPopupAndTestCreateButton(page, 'col_out_update', true);
      });

      await test.step('should not show the create button for a fk table that only allows delete', async () => {
        await openFKPopupAndTestCreateButton(page, 'col_out_delete', false);
      });
    });
  });

});


/********************** helper functions ************************/

const openThePage = async (tableName: string, page: Page, baseURL: string | undefined, testInfo: TestInfo) => {
  await page.goto(generateChaiseURL(APP_NAMES.RECORDEDIT, 'multi-permissions', tableName, testInfo, baseURL) + '/id=1');
}

const testUnauthorizedAccess = async (page: Page) => {
  const modal = ModalLocators.getErrorModal(page);
  await expect.soft(modal).toBeVisible();
  await expect.soft(ModalLocators.getModalTitle(modal)).toHaveText('Unauthorized Access');
  await expect.soft(ModalLocators.getModalText(modal)).toContainText('You are not authorized to perform this action.');
}

const openFKPopupAndTestCreateButton = async (page: Page, displayname: string, isDisplayed: boolean) => {
  // open the popup
  await RecordeditLocators.getForeignKeyInputButton(page, displayname, 1).click();
  const rsModal = ModalLocators.getRecordsetSearchPopup(page);
  await expect.soft(rsModal).toBeVisible();
  const btn = RecordsetLocators.getAddRecordsLink(rsModal);
  if (isDisplayed) {
    await expect.soft(btn).toBeVisible();
  } else {
    await expect.soft(btn).not.toBeAttached();
  }
  await ModalLocators.getCloseBtn(rsModal).click();
  await expect.soft(rsModal).not.toBeAttached();
}
