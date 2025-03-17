import { test, expect, TestInfo, Page } from '@playwright/test';

// locators
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import NavbarLocators from '@isrd-isi-edu/chaise/test/e2e/locators/navbar';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID, getEntityRow } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { clickNewTabLink, getPageURLOrigin, testExportDropdown } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams = {
  table_name: 'links-table'
};

test.describe.configure({ mode: 'parallel' });

test.describe('links on the record page', () => {
  test('The proper permalink should appear in the share popup if resolverImplicitCatalog is undefined', async ({ page, baseURL }, testInfo) => {
    await goToPage(page, baseURL, testInfo, testParams.table_name, true);

    // open the share popup on the first tab
    await RecordLocators.getShareButton(page).click();
    const shareCiteModal = ModalLocators.getShareCiteModal(page);
    await expect.soft(shareCiteModal).toBeVisible();

    const origin = await getPageURLOrigin(page);
    const RIDVal = getEntityRow(testInfo, 'links', testParams.table_name, [{ column: 'id', value: '1' }]).RID;
    const expectedURL = `${origin}/id/${getCatalogID(testInfo.project.name)}/${RIDVal}`;
    await expect.soft(ModalLocators.getLiveLinkElement(shareCiteModal)).toHaveText(expectedURL);

    await ModalLocators.getCloseBtn(shareCiteModal).click();
  });

  test('Clicking the subtitle should redirect to recordset app', async ({ page, baseURL }, testInfo) => {
    await goToPage(page, baseURL, testInfo, testParams.table_name, true);

    await RecordLocators.getEntitySubTitleElement(page).click();
    await page.waitForURL('**/recordset/**');
    await RecordsetLocators.waitForRecordsetPageReady(page);
  });

  test('Searching in go to RID input should navigate the user to the resolved record page matching that RID', async ({ page, baseURL }, testInfo) => {
    // test.skip(!!process.env.CI, 'in CI the resolver server component is not configured and cannot be tested');

    await goToPage(page, baseURL, testInfo, testParams.table_name, true, true);

    const RIDVal = getEntityRow(testInfo, 'links', testParams.table_name, [{ column: 'id', value: '1' }]).RID;
    await NavbarLocators.getGoToRIDInput(page).clear();
    await NavbarLocators.getGoToRIDInput(page).fill(RIDVal);
    const newPage = await clickNewTabLink(NavbarLocators.getGoToRIDButton(page));
    await newPage.waitForURL(`**/record/#${getCatalogID(testInfo.project.name)}/links:${testParams.table_name}/RID=${RIDVal}**`);
    await newPage.close();
  });

});


test.describe('show/hide empty section button state', () => {
  test('for a table with a related association table that user can create', async ({ page, baseURL }, testInfo) => {
    await goToPage(page, baseURL, testInfo, testParams.table_name);

    await test.step('should show the empty related association tables and table of contents on page load', async () => {
      const tocHeaders = RecordLocators.getSidePanelHeadings(page);
      await expect.soft(tocHeaders).toHaveCount(2);
      await expect.soft(tocHeaders).toHaveText(['Summary', 'association_table (0)']);

      const headers = RecordLocators.getDisplayedRelatedTableTitles(page);
      await expect.soft(headers).toHaveCount(1);
      await expect.soft(headers).toHaveText(['association_table']);
    });
  });

  test('for a table with an inline association table that user can create', async ({ page, baseURL }, testInfo) => {
    await goToPage(page, baseURL, testInfo, 'inline_table');

    await test.step('should show the empty inline related association tables and table of contents on page load', async () => {
      const tocHeaders = RecordLocators.getSidePanelHeadings(page);
      await expect.soft(tocHeaders).toHaveCount(2);
      await expect.soft(tocHeaders).toHaveText(['Summary', 'inline_association_table (0)']);

      const headers = RecordLocators.getDisplayedRelatedTableTitles(page);
      await expect.soft(headers).toHaveCount(0);

      const el = RecordLocators.getEntityRelatedTable(page, 'inline_association_table');
      await expect.soft(el).toBeVisible();
    })
  });
});


test('export button', async ({ page, baseURL }, testInfo) => {
  await goToPage(page, baseURL, testInfo, testParams.table_name);

  const ridValue = getEntityRow(testInfo, 'links', 'links-table', [{ column: 'id', value: '1' }]).RID;
  await testExportDropdown(page, ['links-table.csv', `links-table_${ridValue}.zip`], APP_NAMES.RECORD);
});


test('default behavior of editRecord and deleteRecord chaise-config props', async ({page, baseURL}, testInfo) => {
  await goToPage(page, baseURL, testInfo, testParams.table_name);

  await test.step('delete button should be visible', async () => {
    const deleteBtn = RecordLocators.getDeleteRecordButton(page);
    await expect.soft(deleteBtn).toBeVisible();
    // actual delete tests are done in other specs
  });

  // this must be the last step here as it will change the page location
  await test.step('edit button should be visible', async () => {
    const editBtn = RecordLocators.getEditRecordButton(page);
    await expect.soft(editBtn).toBeVisible();
    await editBtn.click();
    await expect.soft(page).toHaveURL(/recordedit/);
    await RecordeditLocators.waitForRecordeditPageReady(page);
    // actual edit tests are done in other specs
  });
});

test('hide_column_header support', async ({ page, baseURL }, testInfo) => {
  await goToPage(page, baseURL, testInfo, testParams.table_name);

  await test.step('should hide the text column based on hide_column_header property of column-display annotation', async () => {
    const columns = RecordLocators.getColumns(page);
    await expect.soft(columns).toHaveCount(3);

    await expect.soft(columns.nth(0)).toBeVisible();

    await expect.soft(columns.nth(1)).toBeHidden();

    await expect.soft(columns.nth(2)).toBeVisible();
  });
});


/********************** helper functions ************************/
const goToPage = async (
  page: Page, baseURL: string | undefined, testInfo: TestInfo, tableName: string,
  dontWrapAroundStep?: boolean, useRecordset?: boolean
) => {
  const steps = async () => {
    let url;
    if (useRecordset) {
      url = generateChaiseURL(APP_NAMES.RECORDSET, '', tableName, testInfo, baseURL);
    } else {
      url = generateChaiseURL(APP_NAMES.RECORD, '', tableName, testInfo, baseURL) + '/id=1';
    }

    await page.goto(url);

    if (useRecordset) {
      await RecordsetLocators.waitForRecordsetPageReady(page);
    } else {
      await RecordLocators.waitForRecordPageReady(page);
    }
  }

  if (dontWrapAroundStep) {
    await steps();
  } else {
    await test.step('should load the page properly', steps);
  }
}
