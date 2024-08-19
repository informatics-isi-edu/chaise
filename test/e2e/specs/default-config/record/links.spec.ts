import { test, expect, TestInfo, Page } from '@playwright/test';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import NavbarLocators from '@isrd-isi-edu/chaise/test/e2e/locators/navbar';
import ExportLocators from '@isrd-isi-edu/chaise/test/e2e/locators/export';

import { getCatalogID, getEntityRow } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { clickAndVerifyDownload, clickNewTabLink, getPageURLOrigin } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams = {
  table_name: 'links-table'
};

test.describe.configure({ mode: 'parallel' });

test.describe('links on the record page', () => {
  test('The proper permalink should appear in the share popup if resolverImplicitCatalog is undefined', async ({ page, baseURL }, testInfo) => {
    test.skip(!!process.env.CI, 'in CI the resolver server component is not configured and cannot be tested');

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
    test.skip(!!process.env.CI, 'in CI the resolver server component is not configured and cannot be tested');

    await goToPage(page, baseURL, testInfo, testParams.table_name, true);

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
  test.skip(!!process.env.CI, 'in CI the export server component is not configured and cannot be tested');

  await goToPage(page, baseURL, testInfo, testParams.table_name);

  await test.step('first option must be `This record (CSV)` and user should be able to download the file.', async () => {
    await ExportLocators.getExportDropdown(page).click();
    const option = ExportLocators.getExportOption(page, 'This record (CSV)');
    await expect.soft(option).toHaveText('This record (CSV)');

    await clickAndVerifyDownload(option, 'links-table.csv');
  });

  await test.step('second option must be default `BDBag` and user should be able to download the file.', async () => {
    await ExportLocators.getExportDropdown(page).click();
    const option = ExportLocators.getExportOption(page, 'BDBag');
    await expect.soft(option).toHaveText('BDBag');

    const filename = `links-table_${getEntityRow(testInfo, 'links', 'links-table', [{ column: 'id', value: '1' }]).RID}.zip`;

    await clickAndVerifyDownload(option, filename, async () => {
      const exportModal = ModalLocators.getExportModal(page);
      await expect.soft(exportModal).toBeVisible();
      await expect.soft(exportModal).not.toBeAttached();
    });
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
const goToPage = async (page: Page, baseURL: string | undefined, testInfo: TestInfo, tableName: string, dontWrapAroundStep?: boolean) => {
  const steps = async () => {
    await page.goto(`${baseURL}/record/#${getCatalogID(testInfo.project.name)}/${tableName}/id=1`);
    await RecordLocators.waitForRecordPageReady(page);
  }

  if (dontWrapAroundStep) {
    await steps();
  } else {
    await test.step('should load the page properly', steps);
  }
}
