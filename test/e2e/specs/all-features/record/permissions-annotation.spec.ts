import { test, TestInfo, Page } from '@playwright/test';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';

import { testButtonState } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

test.describe('Viewing Record app with permission related annotations', () => {
  test('for a read-only table', async ({ page, baseURL }, testInfo) => {
    await openThePage('main_read_table', page, baseURL, testInfo);

    await test.step('should display the share button.', async () => {
      await testButtonState(RecordLocators.getShareButton(page), true, true);
    });

    await test.step('should not display the create button', async () => {
      await testButtonState(RecordLocators.getCreateRecordButton(page), true, false);
    });

    await test.step('should not display the edit button', async () => {
      await testButtonState(RecordLocators.getEditRecordButton(page), true, false);
    });

    await test.step('should not display the copy button', async () => {
      await testButtonState(RecordLocators.getCopyRecordButton(page), true, false);
    });

    await test.step('should not display the delete button', async () => {
      await testButtonState(RecordLocators.getDeleteRecordButton(page), true, false);
    });

    await test.step('should display the related tables toggle as "Show empty sections"', async () => {
      await testButtonState(RecordLocators.getShowAllRelatedEntitiesButton(page), true, true, false, 'Show empty sections');
    });

  });

  test('for a create-only table', async ({ page, baseURL }, testInfo) => {
    await openThePage('main_create_table', page, baseURL, testInfo);

    await test.step('should display the share button.', async () => {
      await testButtonState(RecordLocators.getShareButton(page), true, true, false);
    });

    await test.step('should display the create button', async () => {
      await testButtonState(RecordLocators.getCreateRecordButton(page), true, true, false);
    });

    await test.step('should display the edit button as disabled', async () => {
      await testButtonState(RecordLocators.getEditRecordButton(page), true, true, true);
    });

    await test.step('should display the copy button', async () => {
      await testButtonState(RecordLocators.getCopyRecordButton(page), true, true, false);
    });

    await test.step('should display the delete button as disabled', async () => {
      await testButtonState(RecordLocators.getDeleteRecordButton(page), true, true, true);
    });

    await test.step('for related tables', async () => {
      await test.step('should show the "Explore" link', async () => {
        const link = RecordLocators.getRelatedTableExploreLink(page, 'in_create_table');
        await testButtonState(link, true, true, false, 'Explore');
      });

      await test.step('should show an "Add record" link if the table is an inbound relationship', async () => {
        const link = RecordLocators.getRelatedTableAddButton(page, 'in_create_table');
        await testButtonState(link, true, true, false, 'Add records');
      });

      await test.step('should show an "Link record" link if the table is an associative relationship', async () => {
        // If a related table is an association table, it should show "Unlink"
        const link = RecordLocators.getRelatedTableAddButton(page, 'assoc_create_table');
        await testButtonState(link, true, true, false, 'Link records');
      });

      await test.step('should not show an "Add record" or "Link record" link if the table doesn\'t allow adding a new row', async () => {
        const link = RecordLocators.getRelatedTableAddButton(page, 'in_delete_table');
        await testButtonState(link, true, false);
      });

      await test.step('should show a "Table Display" toggle link if the table has a row_markdown_pattern', async () => {
        const link = RecordLocators.getRelatedTableToggleDisplay(page, 'in_read_table');
        await testButtonState(link, true, true, false, 'Table mode');
      });

      await test.step('should not show a toggle display link if the table does not have a row_markdown_pattern', async () => {
        const link = RecordLocators.getRelatedTableToggleDisplay(page, 'in_create_table');
        await testButtonState(link, true, false);
      });
    });

  });

  test('for a table that allows edit and create (but no delete)', async ({ page, baseURL }, testInfo) => {
    await openThePage('main_update_table', page, baseURL, testInfo);

    await test.step('should display the share button.', async () => {
      await testButtonState(RecordLocators.getShareButton(page), true, true, false);
    });

    await test.step('should display the create button', async () => {
      await testButtonState(RecordLocators.getCreateRecordButton(page), true, true, false);
    });

    await test.step('should display the edit button', async () => {
      await testButtonState(RecordLocators.getEditRecordButton(page), true, true, false);
    });

    await test.step('should display the copy button', async () => {
      await testButtonState(RecordLocators.getCopyRecordButton(page), true, true, false);
    });

    await test.step('should display the delete button as disabled', async () => {
      await testButtonState(RecordLocators.getDeleteRecordButton(page), true, true, true);
    });

    await test.step('should show an "Edit mode" toggle link if a related table has a row_markdown_pattern', async () => {
      // The link is only "Edit" if user can edit; otherwise it should say "Table Display"
      const link = RecordLocators.getRelatedTableToggleDisplay(page, 'in_update_table');
      await testButtonState(link, true, true, false, 'Edit mode');
    });
  });

  test('for a delete-only table', async ({ page, baseURL }, testInfo) => {
    await openThePage('main_delete_table', page, baseURL, testInfo);

    await test.step('should display the share button.', async () => {
      await testButtonState(RecordLocators.getShareButton(page), true, true, false);
    });

    await test.step('should display the create button as disabled', async () => {
      await testButtonState(RecordLocators.getCreateRecordButton(page), true, true, true);
    });

    await test.step('should display the edit button as disabled', async () => {
      await testButtonState(RecordLocators.getEditRecordButton(page), true, true, true);
    });

    await test.step('should display the copy button as disabled', async () => {
      await testButtonState(RecordLocators.getCopyRecordButton(page), true, true, true);
    });

    await test.step('should display the delete button', async () => {
      await testButtonState(RecordLocators.getDeleteRecordButton(page), true, true, false);
    });

    await test.step('should display the related tables toggle as "Show empty sections"', async () => {
      await testButtonState(RecordLocators.getShowAllRelatedEntitiesButton(page), true, true, false, 'Show empty sections');
    });

  });
});

/********************** helper functions ************************/

const openThePage = async (tableName: string, page: Page, baseURL: string | undefined, testInfo: TestInfo) => {
  await test.step('should load the page properly', async () => {
    await page.goto(generateChaiseURL(APP_NAMES.RECORD, 'multi-permissions', tableName, testInfo, baseURL) + '/id=1');
    await RecordLocators.waitForRecordPageReady(page);
  });
}



