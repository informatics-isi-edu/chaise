import { test, expect } from '@playwright/test';

// locators
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { testDeleteConfirm } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';

const testParams = {
  schema_name: 'product-delete-btn',
  table_name1: 'delete_table',
  key1: 'id=1',
  table_name2: 'accommodation',
  key2: 'id=4004'
};

test.describe('Delete functionality in record page with confirm dialog', () => {
  test('when the deleted row is from a table without any inline fks with on delete cascade', async ({ page, baseURL }, testInfo) => {
    const PAGE_URL = `/record/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name1}`;

    await test.step('should load record page', async () => {
      await page.goto(`${baseURL}${PAGE_URL}/${testParams.key1}`);
      await RecordLocators.waitForRecordPageReady(page);
    });

    // eslint-disable-next-line max-len
    await test.step('for a related entity row, clicking on delete button should open a confirm with proper message, and confirming should properly delete.', async () => {
      const message = 'Are you sure you want to delete inbound_to_delete_table:one?';
      await testDeleteConfirm(page, RecordsetLocators.getDeleteActionButtons(page).nth(0), message);
    });

    // eslint-disable-next-line max-len
    await test.step('for the main record, clicking on delete button should open a confirm with proper message, and confirming should properly delete.', async () => {
      const message = 'Are you sure you want to delete delete_table: one?';
      await testDeleteConfirm(page, RecordLocators.getDeleteRecordButton(page), message);

      await expect.soft(page).toHaveURL(`${baseURL}${PAGE_URL.replace('record', 'recordset')}@sort(RID)`);
      await RecordsetLocators.waitForRecordsetPageReady(page);
    });
  });

  test('when the deleted row is from a table with inline fks with on delete cascade', async ({ page, baseURL }, testInfo) => {
    const PAGE_URL = `/record/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name2}`;

    await test.step('should load record page', async () => {
      await page.goto(`${baseURL}${PAGE_URL}/${testParams.key2}`);
      await RecordLocators.waitForRecordPageReady(page);
    });

    // eslint-disable-next-line max-len
    await test.step('for a related entity row, clicking on delete button should open a confirm with proper message, and confirming should properly delete.', async () => {
      const message = 'Are you sure you want to delete inbound_related_to_accommodation_for_delete:Four thousand four?';
      const relatedTableSection = RecordLocators.getRelatedTableContainer(page, 'inbound_related_to_accommodation_for_delete')

      const deleteButtons = RecordsetLocators.getDeleteActionButtons(RecordsetLocators.getRecordSetTable(relatedTableSection));
      await testDeleteConfirm(page, deleteButtons.nth(0), message);
    });

    // eslint-disable-next-line max-len
    await test.step('for the main racord, clicking on delete button should open a confirm with proper message, and confirming should properly delete.', async () => {
      const message = [
        'Are you sure you want to delete Accommodations: Hilton Hotel?',
        'This may also delete related records in the following 3 tables/sections: media, booking, and invisible_inbound_related_to_accommodation†',
        'Check the related records that are going to be deleted from the relevant sections in the side panel.',
        'Some of the affected tables (denoted by †) might not be visible in the side panel.'
      ].join('');
      await testDeleteConfirm(page, RecordLocators.getDeleteRecordButton(page), message);

      await expect.soft(page).toHaveURL(`${baseURL}${PAGE_URL.replace('record', 'recordset')}@sort(RID)`);
      await RecordsetLocators.waitForRecordsetPageReady(page);
    });
  });
});
