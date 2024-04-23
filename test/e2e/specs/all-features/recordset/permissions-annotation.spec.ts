import { expect, test, TestInfo, Page } from '@playwright/test';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { testButtonState } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

test.describe('Viewing Recordset app with permission related annotations', () => {

  test('for a read-only table', async ({ page, baseURL }, testInfo) => {
    await openThePage('main_read_table', page, baseURL, testInfo);

    await test.step('should not display the create button', async () => {
      await testButtonState(RecordsetLocators.getAddRecordsLink(page), true, false);
    });

    await test.step('should not display the edit button', async () => {
      await testButtonState(RecordsetLocators.getBulkEditLink(page), true, false);
    });

    await test.step('action columns', async () => {
      await test.step('should display "View" as the column header', async () => {
        await expect.soft(RecordsetLocators.getActionsHeader(page)).toHaveText('View');
      });

      await test.step('should display the view button', async () => {
        await testButtonState(RecordsetLocators.getRowViewButton(page, 0), true, true);
      });

      await test.step('should not display the edit button', async () => {
        await testButtonState(RecordsetLocators.getRowEditButton(page, 0), true, false);
      });

      await test.step('should not display the delete button', async () => {
        await testButtonState(RecordsetLocators.getRowDeleteButton(page, 0), true, false);
      });
    });
  });

  test('for a create-only table', async ({ page, baseURL }, testInfo) => {
    await openThePage('main_create_table', page, baseURL, testInfo);

    await test.step('should display the create button', async () => {
      await testButtonState(RecordsetLocators.getAddRecordsLink(page), true, true);
    });

    await test.step('should not display the edit button', async () => {
      await testButtonState(RecordsetLocators.getBulkEditLink(page), true, false);
    });

    await test.step('action columns', async () => {
      await test.step('should display "View" as the column header', async () => {
        await expect.soft(RecordsetLocators.getActionsHeader(page)).toHaveText('View');
      });

      await test.step('should display the view button', async () => {
        await testButtonState(RecordsetLocators.getRowViewButton(page, 0), true, true);
      });

      await test.step('should not display the edit button', async () => {
        await testButtonState(RecordsetLocators.getRowEditButton(page, 0), true, false);
      });

      await test.step('should not display the delete button', async () => {
        await testButtonState(RecordsetLocators.getRowDeleteButton(page, 0), true, false);
      });
    });
  });

  test('for a table that allows edit and create (but no delete)', async ({ page, baseURL }, testInfo) => {
    await openThePage('main_update_table', page, baseURL, testInfo);

    await test.step('should display the create button', async () => {
      await testButtonState(RecordsetLocators.getAddRecordsLink(page), true, true);
    });

    await test.step('should display the edit button', async () => {
      await testButtonState(RecordsetLocators.getBulkEditLink(page), true, true);
    });

    await test.step('action columns', async () => {
      await test.step('should display "Actions" as the column header', async () => {
        await expect.soft(RecordsetLocators.getActionsHeader(page)).toHaveText('Actions');
      });

      await test.step('should display the view button', async () => {
        await testButtonState(RecordsetLocators.getRowViewButton(page, 0), true, true);
      });

      await test.step('should display the edit button', async () => {
        await testButtonState(RecordsetLocators.getRowEditButton(page, 0), true, true);
      });

      await test.step('should not display the delete button', async () => {
        await testButtonState(RecordsetLocators.getRowDeleteButton(page, 0), true, false);
      });
    });
  });

  test('for a delete-only table', async ({ page, baseURL }, testInfo) => {
    await openThePage('main_delete_table', page, baseURL, testInfo);

    await test.step('should not display the create button', async () => {
      await testButtonState(RecordsetLocators.getAddRecordsLink(page), true, false);
    });

    await test.step('should not display the edit button', async () => {
      await testButtonState(RecordsetLocators.getBulkEditLink(page), true, false);
    });

    await test.step('action columns', async () => {
      await test.step('should display "Actions" as the column header', async () => {
        await expect.soft(RecordsetLocators.getActionsHeader(page)).toHaveText('Actions');
      });

      await test.step('should display the view button', async () => {
        await testButtonState(RecordsetLocators.getRowViewButton(page, 0), true, true);
      });

      await test.step('should not display the edit button', async () => {
        await testButtonState(RecordsetLocators.getRowEditButton(page, 0), true, false);
      });

      await test.step('should display the delete button', async () => {
        await testButtonState(RecordsetLocators.getRowDeleteButton(page, 0), true, true);
      });
    });
  });
});


/********************** helper functions ************************/

const openThePage = async (tableName: string, page: Page, baseURL: string | undefined, testInfo: TestInfo) => {
  await test.step('should load the page properly', async () => {
    await page.goto(`${baseURL}/recordset/#${getCatalogID(testInfo.project.name)}/multi-permissions:${tableName}/id=1`);
    await RecordsetLocators.waitForRecordsetPageReady(page);
  });
}
