/* eslint-disable max-len */
import { expect, test, Page } from '@playwright/test';

// locators
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getEntityRow } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { clickNewTabLink, manuallyTriggerFocus } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import { setInputValue } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams = {
  schema_name: 'product-recordset-add',
  table_name: 'accommodation',
  num_rows: 6,
  title: 'Best Western Plus Amedia Art Salzburg',
  rating: '3.50',
  summary: 'The BEST WESTERN PLUS Amedia Art Salzburg is located near the traditional old part of town, near the highway, near the train station and close to the exhibition center of Salzburg.\nBEST WESTERN PLUS Amedia Art Salzburg offers harmony of modern technique and convenient atmosphere to our national and international business guest and tourists.'
};

test('Recordset add record', async ({ page, baseURL }, testInfo) => {
  const PAGE_URL = generateChaiseURL(APP_NAMES.RECORDSET, testParams.schema_name, testParams.table_name, testInfo, baseURL);

  let firstRow, testCell: any, dimensions;
  await test.step('should load recordset page', async () => {
    await page.goto(PAGE_URL);
    await RecordsetLocators.waitForRecordsetPageReady(page);

    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(6);
  });

  await test.step('show an inline comment instead of tooltip', async () => {
    await expect.soft(RecordsetLocators.getPageTitleInlineComment(page)).toHaveText('Recordset inline comment');
  });

  await test.step('the facet panel should be displayed by default if maxFacetDepth is missing from chaise-config', async () => {
    await expect.soft(RecordsetLocators.getSidePanel(page)).toBeVisible();
    await expect.soft(RecordsetLocators.getAllFacets(page)).toHaveCount(7);
  });

  await test.step('verify the text is truncated and "... more" is showing', async () => {
    firstRow = RecordsetLocators.getRows(page).nth(0);
    testCell = RecordsetLocators.getRowCells(firstRow).nth(4);
    await expect.soft(testCell).toHaveText(/... more/);
  });

  // default config: maxRecordsetRowHeight = 160
  // 160 for max height, 10 for padding
  const cellHeight = 170;
  await test.step('the cell with text has the expected height when truncated', async () => {
    dimensions = await testCell.boundingBox();
    expect.soft(dimensions).toBeDefined();

    if (dimensions) {
      // the calculations might be one pixel off
      expect.soft(Math.abs(dimensions.height - cellHeight)).toBeLessThanOrEqual(1);
    }
  });

  await test.step('click "... more" and verify "... less" shows up', async () => {
    await RecordsetLocators.getReadMore(testCell).click();
    await expect.soft(testCell).toHaveText(/... less/);
  });

  await test.step('the cell with text is expanded with a new height', async () => {
    dimensions = await testCell.boundingBox();
    expect.soft(dimensions).toBeDefined();

    if (dimensions) {
      expect.soft(dimensions.height).toBeGreaterThan(cellHeight);
    };
  });

  await test.step('click on "... less" and verify the content is truncated again', async() => {
    await RecordsetLocators.getReadMore(testCell).click();
    await expect.soft(testCell).toHaveText(/... more/);
  });

  await test.step('verify view details link, search for a term, then verify view details link has changed', async () => {
    const baseViewUrl = `${PAGE_URL.replace('recordset', 'record')}/RID=`;

    let keyValues = [{ column: 'id', value: '2003' }];
    let rowRID = getEntityRow(testInfo, testParams.schema_name, testParams.table_name, keyValues).RID;
    // get first row view details button
    expect.soft(await RecordsetLocators.getRowViewButton(page, 0).getAttribute('href')).toContain(`${baseViewUrl}${rowRID}`);

    // search for a row that is not the first one after sorting
    await RecordsetLocators.getMainSearchInput(page).fill('hilton');
    await RecordsetLocators.getSearchSubmitButton(page).click();

    await RecordsetLocators.waitForRecordsetPageReady(page);
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(1);

    keyValues = [{ column: 'id', value: '4004' }];
    rowRID = getEntityRow(testInfo, testParams.schema_name, testParams.table_name, keyValues).RID;
    // get first row view details button
    expect.soft(await RecordsetLocators.getRowViewButton(page, 0).getAttribute('href')).toContain(`${baseViewUrl}${rowRID}`);

    // clear search
    await RecordsetLocators.getSearchClearButton(page).click();
  });

  let newPage: Page;
  await test.step('click on the add button should open a new tab to recordedit', async () => {
    newPage = await clickNewTabLink(RecordsetLocators.getAddRecordsLink(page));

    await RecordeditLocators.waitForRecordeditPageReady(newPage);


    const recordeditUrl = PAGE_URL.replace('recordset', 'recordedit');
    expect.soft(newPage.url()).toContain(recordeditUrl);

    // set the required fields
    await setInputValue(newPage, 1, 'title', 'Title', RecordeditInputType.TEXT, testParams.title);
    await setInputValue(newPage, 1, 'category', 'Category', RecordeditInputType.FK_POPUP, {modal_num_rows: 5, modal_option_index: 0});
    await setInputValue(newPage, 1, 'rating', 'Rating', RecordeditInputType.TEXT, testParams.rating);
    await setInputValue(newPage, 1, 'summary', 'Summary', RecordeditInputType.LONGTEXT, testParams.summary);
    await RecordeditLocators.getTimestampInputsForAColumn(newPage, 'opened_on', 1).nowBtn.click();

    await RecordeditLocators.submitForm(newPage);
    // wait until redirected to record page
    await RecordLocators.waitForRecordPageReady(newPage);
  });

  await test.step('go back to recordset should refresh the table with the new record', async () => {
    if (!newPage) return;

    await newPage.close();
    await manuallyTriggerFocus(page);

    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.num_rows+1);
  });
});
