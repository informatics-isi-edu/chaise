import { expect, Locator, Page, test } from '@playwright/test'
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

export type RecordsetRowValue = ({
  url: string,
  caption: string
} | string)[]


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
 * Opens the facet and checks the title of filter options
 * @param  {int}   facetIdx         facet index
 * @param  {Array}   filterOptions   array of filter titles
 */
export async function openFacetAndTestFilterOptions(facet: Locator, facetIdx: number, filterOptions: string[]) {
  // open facet
  await RecordsetLocators.getFacetHeaderButtonById(facet, facetIdx).click();
  // wait for facet to open
  await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();

  // wait for facet checkboxes to load
  await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveCount(filterOptions.length);

  // wait for list to be fully visible
  await expect.soft(RecordsetLocators.getList(facet)).toBeVisible();

  const facetOptions = RecordsetLocators.getFacetOptions(facet);
  const numFacets = await facetOptions.count();

  for (let i = 0; i < numFacets; i++) {
    await expect.soft(facetOptions.nth(i)).toHaveText(filterOptions[i]);
  }
}

/**
 * It will select the given filter, and then clear all the filters.
 * Assumptions:
 * - Only the current facet column can have filters.
 * - Current facet column is already open.
 * @param  {int}   facetIdx     facet index
 * @param  {int}   filterIdx    filter index
 * @param  {string}   filterName   filter title in the main content
 * @param  {int}   numRowsAfter number of rows after applying the filter
 * @param  {Function} done
 */
// eslint-disable-next-line max-len
export async function testSelectFacetOption(container: Page | Locator, facetIdx: number, filterIdx: number, filterName: string, numRowsAfter: number) {
  const facet = RecordsetLocators.getFacetById(container, facetIdx);
  const facetOption = RecordsetLocators.getFacetOption(facet, filterIdx);
  const clearAll = RecordsetLocators.getClearAllFilters(container);

  await facetOption.click()
  await expect.soft(RecordsetLocators.getRows(container)).toHaveCount(numRowsAfter);

  // wait for facet filters to load
  const facetFilters = RecordsetLocators.getFacetFilters(container);
  await expect.soft(facetFilters).toHaveCount(1);
  await expect.soft(facetFilters.nth(0)).toHaveText(filterName);

  await clearAll.click();
  await expect.soft(clearAll).not.toBeVisible();
  await expect.soft(facetOption).not.toBeChecked();
};


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

  await test.step('close default open facets', async () => {
    for await (const [i, facetIndex] of openedFacets.entries()) {
      const facet = RecordsetLocators.getFacetById(page, facetIndex);
      await RecordsetLocators.getFacetHeaderButtonById(facet, facetIndex).click();
      await expect.soft(closedFacets).toHaveCount(totalNumFacets - openedFacets.length + i + 1);
    }
  });

  await test.step('clear all filters', async () => {
    await clearAll.click();
    await expect.soft(clearAll).not.toBeVisible();
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(pageSizeAfterClear);
  });
}
