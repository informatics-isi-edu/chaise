
import { test, expect } from '@playwright/test';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';

import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { testRecordMainSectionPartialValues } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';

test('composite key and custom boolean display support', async ({ page, baseURL }, testInfo) => {
  await test.step('should load the page.', async () => {
    const url = `${baseURL}/recordedit/#${getCatalogID(testInfo.project.name)}/product-person:accommodation`;
    await page.goto(url);
    await RecordeditLocators.waitForRecordeditPageReady(page);
  });

  await test.step('should be able to set value for fk popup input', async () => {
    const fkModal = ModalLocators.getForeignKeyPopup(page);
    await RecordeditLocators.getForeignKeyInputButton(page, 'Person', 1).click();

    await expect.soft(fkModal).toBeVisible();
    await expect.soft(ModalLocators.getModalTitle(fkModal)).toContainText('Select');
    await expect.soft(RecordsetLocators.getRows(fkModal)).toHaveCount(3);

    // choose the first one
    await RecordsetLocators.getRowSelectButton(fkModal, 0).click();

    await expect.soft(fkModal).not.toBeAttached();
    await expect.soft(RecordeditLocators.getForeignKeyInputDisplay(page, 'Person', 1)).toHaveText('John Doe');
  });

  await test.step('should show the custom \'Luxurious\' and \'Not Luxurious\' as the options in the boolean dropdown menu', async () => {
    const dropdownEl = RecordeditLocators.getDropdownElementByName(page, 'luxurious', 1);

    await dropdownEl.click();
    const optionsContainer = RecordeditLocators.getOpenDropdownOptionsContainer(page);
    await expect.soft(optionsContainer).toBeVisible();

    const options = RecordeditLocators.getDropdownOptions(dropdownEl.page());
    await expect.soft(options).toHaveCount(2);
    await expect.soft(options).toHaveText(['Luxurious', 'Not Luxurious']);
    await options.getByText('Luxurious', { exact: true }).click();
    await expect.soft(RecordeditLocators.getDropdownText(dropdownEl)).toHaveText('Luxurious');
  });


  await test.step('should submit the record without any issues.', async () => {
    await RecordeditLocators.getSubmitRecordButton(page).click();
    await expect.soft(AlertLocators.getErrorAlert(page)).not.toBeAttached();
    await expect.soft(ModalLocators.getUploadProgressModal(page)).not.toBeAttached();
    await expect.soft(RecordeditLocators.getSubmitSpinner(page)).not.toBeAttached();
    await page.waitForURL('**/record/**');
    await testRecordMainSectionPartialValues(page, 10, {
      luxurious: 'Luxurious',
      first_name: 'John',
      last_name: 'Doe',
      index: '0',
      '0YGNuO_bvxoczJ6ms2k0tQ': 'John Doe' // person foreignkey column
    });
  });
})
