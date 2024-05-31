import { expect, Locator, Page, test } from '@playwright/test'
import RecordsetLocators, {
  DefaultRangeInputLocators,
  TimestampRangeInputLocators
} from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

export type RecordsetColValue = { url: string, caption: string } | string;
export type RecordsetRowValue = RecordsetColValue[]


export async function testRecordsetTableRowValues(container: Page | Locator, expectedRowValues: RecordsetRowValue[], isSoft?: boolean) {
  const expectFn = isSoft ? expect.soft : expect;

  const rows = RecordsetLocators.getRows(container);
  await expectFn(rows).toHaveCount(expectedRowValues.length);

  let index = 0;
  for (const expectedRow of expectedRowValues) {
    const cells = rows.nth(index).locator('td:not(.action-btns)');

    await expectFn(cells).toHaveCount(expectedRow.length);

    for (let innerIndex = 0; innerIndex < expectedRow.length; innerIndex++) {
      const expectedCell = expectedRow[innerIndex];

      const cell = cells.nth(innerIndex);
      await expectFn(cell).toBeVisible();

      if (typeof expectedCell === 'string') {
        await expectFn(cell).toHaveText(expectedCell);
      } else {
        const link = cell.locator('a');
        expectFn(await link.getAttribute('href')).toContain(expectedCell.url);
        await expectFn(link).toHaveText(expectedCell.caption);
      }
    }

    index++;
  }
}

/**
 * Open the facet and wait for content to be visible
 * @param facetIdx facet index
 * @param numOptions the total number of options visble on load for this facet
 */
export async function openFacet(page: Page, facet: Locator, facetIdx: number, numOptions: number, numOpenFacets: number) {
  await RecordsetLocators.getFacetHeaderButtonById(facet, facetIdx).click();

  await expect.soft(RecordsetLocators.getOpenFacets(page)).toHaveCount(numOpenFacets);

  await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();
  await expect.soft(RecordsetLocators.getList(facet)).toBeVisible();
  await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveCount(numOptions);
}

/**
 * Opens the facet and checks the title of filter options
 * @param facetIdx facet index
 * @param filterOptions array of filter option labels
 */
export async function openFacetAndTestFilterOptions(page: Page, facet: Locator, facetIdx: number, filterOptions: string[], numOpenFacets: number) {
  await openFacet(page, facet, facetIdx, filterOptions.length, numOpenFacets);

  const facetOptions = RecordsetLocators.getFacetOptions(facet);
  const numFacets = await facetOptions.count();

  for (let i = 0; i < numFacets; i++) {
    await expect.soft(facetOptions.nth(i)).toHaveText(filterOptions[i]);
  }
}

/**
 * Selects a facet option and verifies the row count and number of recordset filters
 * @param optionIdx facet option index to click
 * @param numRows number of recordset rows after clicking facet option
 * @param numFilters number of recordset filters after clicking facet option 
 */
export async function testSelectFacetOption(page: Page, facet: Locator, optionIdx: number, numRows: number, numFilters: number) {
  // open facets show a spinner in the header when the rows are being fetched and is hidden when code execution is finished
  await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
  await RecordsetLocators.getFacetOption(facet, optionIdx).check();

  // wait for request to return
  await expect.soft(RecordsetLocators.getClearAllFilters(page)).toBeVisible();
  await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(numRows);
  await expect.soft(RecordsetLocators.getFacetFilters(page)).toHaveCount(numFilters);
}

/**
 * clears all filters and tests that the UI updates 
 * @param optionIdx facet option index to check is unchecked
 * @param pageSize the recordset page size for comparing with after clear
 */
export async function testClearAllFilters(page: Page, facet: Locator, optionIdx: number, pageSize: number) {
  const clearAll = RecordsetLocators.getClearAllFilters(page);
  await clearAll.click();
  await expect.soft(clearAll).not.toBeVisible();
  await expect.soft(RecordsetLocators.getFacetOption(facet, optionIdx)).not.toBeChecked();
  await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(pageSize);
}

/**
 * It will select the given filter, and then clear all the filters.
 * Assumptions:
 * - Only the current facet column can have filters.
 * - Current facet column is already open.
 * @param facetIdx facet index
 * @param filterIdx filter index
 * @param filterName filter title in the main content
 * @param numRowsAfter number of rows after applying the filter
 * @param pageSize the recordset page size for comparing with after clear
 */
// eslint-disable-next-line max-len
export async function testSelectFacetOptionThenClear(page: Page, facetIdx: number, filterIdx: number, filterName: string, numRowsAfter: number, pageSize: number) {
  const facet = RecordsetLocators.getFacetById(page, facetIdx);
  await testSelectFacetOption(page, facet, filterIdx, numRowsAfter, 1);

  await expect.soft(RecordsetLocators.getFacetFilters(page).nth(0)).toHaveText(filterName);

  await testClearAllFilters(page, facet, filterIdx, pageSize);
};

/**
 * verify the initial values of default range inputs
 * @param rangeInputs rangeInputs object wiht minInput and maxInput
 * @param facetParams 
 */
export async function testDefaultRangePickerInitialValues(rangeInputs: DefaultRangeInputLocators, facetParams: any) {
  await expect.soft(rangeInputs.minInput).toHaveValue(facetParams.initialMin);
  await expect.soft(rangeInputs.maxInput).toHaveValue(facetParams.initialMax);
}

/**
 * verify the initial values of timestamp range inputs
 * @param rangeInputs rangeInputs object wiht minInput and maxInput
 * @param facetParams 
 */
export async function testTimestampRangePickerInitialValues(rangeInputs: TimestampRangeInputLocators, facetParams: any) {
  await expect.soft(rangeInputs.minDateInput).toHaveValue(facetParams.initialMin.date);
  await expect.soft(rangeInputs.maxDateInput).toHaveValue(facetParams.initialMax.date);

  await expect.soft(rangeInputs.minTimeInput).toHaveValue(facetParams.initialMin.time);
  await expect.soft(rangeInputs.maxTimeInput).toHaveValue(facetParams.initialMax.time);
}

/**
 * fill the input and test the value is present
 * @param value 
 */
export async function fillRangeInput(input: Locator, value: string) {
  await input.fill(value);
  await expect.soft(input).toHaveValue(value);
}

/**
 * clear the input and make sure the value is gone
 */
export async function clearRangeInput(input: Locator) {
  await input.clear();
  await expect.soft(input).toHaveValue('');
}

/**
 * test submitting the range inputs values and the page updates properly
 * @param submit the range inuts submit button
 * @param filter the value of the recordset facet filter
 * @param numRows the number of recordset rows
 */
export async function testRangeInputSubmit(page: Page, submit: Locator, filter: string, numRows: number) {
  const clearAll = RecordsetLocators.getClearAllFilters(page);
  await submit.click();

  // wait for request to return
  await expect.soft(clearAll).toBeVisible();

  // wait for facet filters to load
  const facetFilters = RecordsetLocators.getFacetFilters(page);
  await expect.soft(facetFilters).toHaveCount(1);
  await expect.soft(facetFilters.nth(0)).toHaveText(filter);

  await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(numRows);
}

/**
 * test submitting the range inputs values, the page updates properly, and then clear that submission
 * @param submit the range inuts submit button
 * @param filter the value of the recordset facet filter
 * @param numRows the number of recordset rows
 * @param pageSize the recordset page size for comparing with after clear
 */
export async function testRangeInputSubmitThenClear(page: Page, facet: Locator, submit: Locator, filter: string, numRows: number, pageSize: number) {
  await testRangeInputSubmit(page, submit, filter, numRows);

  const optionsCount = await RecordsetLocators.getFacetOptions(facet).count();
  // get last item in range inputs list to test it's unchecked
  await testClearAllFilters(page, facet, optionsCount - 1, pageSize);
}

/**
 * this is done in multiple places for facet specs. it will reset the state of the page.
 * @param page the page object
 * @param url the url of the page
 * @param totalNumFacets how many facets there are
 * @param openedFacets facets that are opened and should be closed
 * @param pageSizeAfterClear the page size after clear is clicked
 */
export async function openRecordsetAndResetFacetState(
  page: Page, url: string, totalNumFacets: number, openedFacets: number[], pageSizeAfterClear: number
) {
  const clearAll = RecordsetLocators.getClearAllFilters(page);
  const closedFacets = RecordsetLocators.getClosedFacets(page);

  await test.step('should load recordset page', async () => {
    await page.goto(url);
    await RecordsetLocators.waitForRecordsetPageReady(page);

    // without this the test might fail
    // wait for the default facets to open first
    await expect.soft(closedFacets).toHaveCount(totalNumFacets - openedFacets.length);
  });

  await test.step('clear all filters', async () => {
    await clearAll.click();
    await expect.soft(clearAll).not.toBeVisible();
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(pageSizeAfterClear);
  });

  await test.step('close default open facets', async () => {
    for await (const [i, facetIndex] of openedFacets.entries()) {
      const facet = RecordsetLocators.getFacetById(page, facetIndex);
      await RecordsetLocators.getFacetHeaderButtonById(facet, facetIndex).click();
      await expect.soft(closedFacets).toHaveCount(totalNumFacets - openedFacets.length + i + 1);
    }
  });
}