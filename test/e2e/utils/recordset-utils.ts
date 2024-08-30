import { expect, Locator, Page, test } from '@playwright/test'

// locators
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordsetLocators, {
  DefaultRangeInputLocators,
  TimestampRangeInputLocators
} from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import { Either } from '@isrd-isi-edu/chaise/src/utils/type-utils';

type RecordsetColStringValue = {
  value: string,
  /**
   * this will allow us to specify which element we should get the value from.
   * @param value the cell that the value is displayed in
   */
  valueLocator?: (value: Locator) => Locator
}

type RecordsetColURLValue = {
  url: string,
  caption: string,
  /**
   * this will allow us to specify which element we should get the value from.
   * @param value the cell that the value is displayed in
   */
  valueLocator?: (value: Locator) => Locator
};

export type RecordsetColValue = Either<RecordsetColStringValue, RecordsetColURLValue> | string;
export type RecordsetRowValue = RecordsetColValue[]

export type TotalCountParts = {
  displayingText: string,
  dropdownButtonText: string,
  totalText: string
}

/**
 *
 * @param container Page or recordset container (if recordset is showing in a modal or we are testing a related section)
 * @param expectedRowValues array of `RecordsetRowValue` types for testing each cell
 * @param isSoft if this test should run in sequence with other tests and not force the tests to end if it fails
 */
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

      let cell = cells.nth(innerIndex);
      await expectFn(cell).toBeVisible();

      if (typeof expectedCell === 'object' && expectedCell.valueLocator) {
        cell = expectedCell.valueLocator(cell);
      }

      if (typeof expectedCell === 'string' || expectedCell.value) {
        await expectFn(cell).toHaveText(typeof expectedCell === 'string' ? expectedCell : expectedCell.value);
      } else if (expectedCell.url && expectedCell.caption) {
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

  await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
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
  await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveText(filterOptions);
}

/**
 * Selects a facet option and verifies the row count and number of recordset filters
 * @param optionIdx facet option index to click
 * @param numRows number of recordset rows after clicking facet option
 * @param numFilters number of recordset filters after clicking facet option
 */
export async function testSelectFacetOption(page: Page | Locator, facet: Locator, optionIdx: number, numRows: number, numFilters: number) {
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
export async function testClearAllFilters(page: Page, pageSize: number, facet?: Locator, optionIdx?: number) {
  const clearAll = RecordsetLocators.getClearAllFilters(page);
  await clearAll.click();
  await expect.soft(clearAll).not.toBeVisible();
  await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(pageSize);

  if (facet && optionIdx) await expect.soft(RecordsetLocators.getFacetOption(facet, optionIdx)).not.toBeChecked();
}

/**
 * clicks show more button and makes sure modal has finished loading
 * @param numRows number of recordset rows in modal on load
 * @param numCheckedRows number of checked rows in modal on load
 */
export async function testShowMoreClick(facet: Locator, modal: Locator, numRows: number, numCheckedRows: number) {
  await RecordsetLocators.getShowMore(facet).click();
  await RecordsetLocators.waitForRecordsetPageReady(modal);

  await expect.soft(RecordsetLocators.getRows(modal)).toHaveCount(numRows);
  await expect.soft(RecordsetLocators.getCheckedCheckboxInputs(modal)).toHaveCount(numCheckedRows);
}

/**
 * close the modal and make sure it's not attached anymore
 */
export async function testModalClose(modal: Locator) {
  await ModalLocators.getCloseBtn(modal).click();
  await expect.soft(modal).not.toBeAttached();
}

/**
 * sort a column and make sure the values are as expected for the first column in the modal
 * @param rawColumnName raw name of column we are sorting by
 * @param expectedColumnValues all of the values for the first column in the table after sorted
 */
export async function testColumnSort(modal: Locator, rawColumnName: string, expectedColumnValues: string[]) {
  const sortBtn = RecordsetLocators.getColumnSortButton(modal, rawColumnName);
  await expect.soft(sortBtn).toBeVisible();

  await sortBtn.click();
  await RecordsetLocators.waitForRecordsetPageReady(modal);

  const columnValues = RecordsetLocators.getFirstColumn(modal);
  await expect.soft(columnValues).toHaveCount(expectedColumnValues.length);
  await expect.soft(columnValues).toHaveText(expectedColumnValues);
}

/**
 * test the displayed state of recordset table after first sorting then paging (without changing the sort criteria)
 *
 * @param button the ascending/descending button to verify is displayed
 * @param rawColumnName raw column name for the column we are sorting by
 * @param numRows number of rows displayed on this recordset page
 * @param totalNumRecords total number of rows
 * @param viewedPage string used in total count test (NOTE: assumes the data fits on 2 pages only)
 * @param sortModifier string used in total count test depending on sort order
 * @param rsContainer optional parameter to define if we are testing a recordset table with other recordset tables on the page
 */
export async function testRecordsetDisplayWSortAfterPaging(
  page: Page,
  button: Locator,
  rawColumnName: string,
  numRows: number,
  totalNumRecords: number,
  viewedPage: 'first' | 'last',
  sortModifier?: '::desc::' | '::asc::' | '',
  rsContainer?: Locator,
) {
  const container: Page | Locator = rsContainer || page;
  if (!sortModifier) sortModifier = '';

  await RecordsetLocators.waitForRecordsetPageReady(container);
  await expect.soft(RecordsetLocators.getRows(container)).toHaveCount(numRows);
  await testTotalCount(container, `Displaying ${viewedPage}${numRows}of ${totalNumRecords} records`);

  // Check the presence of asc/desc sort button
  await expect.soft(button).toBeVisible();

  // Check if the url has @sort by column name
  expect.soft(page.url()).toContain(`@sort(${rawColumnName}${sortModifier},RID)`);
}

/**
 * submit the modal selections and make the recordset
 * @param numRows number of recordset rows after submitting modal selection
 * @param numCheckedFacetOptions number of checked facet options for `facet` after submitting modal selection
 */
export async function testSubmitModalSelection(page: Page, facet: Locator, modal: Locator, numRows: number, numCheckedFacetOptions: number) {
  await ModalLocators.getSubmitButton(modal).click();
  await expect.soft(modal).not.toBeAttached();

  await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(numRows);
  await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(numCheckedFacetOptions);
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

  await testClearAllFilters(page, pageSize, facet, filterIdx);
};

/**
 * verify the initial values of default range inputs
 * @param rangeInputs rangeInputs object for int, float, and date facets
 * @param facetParams the test params object for this facet
 */
export async function testDefaultRangePickerInitialValues(rangeInputs: DefaultRangeInputLocators, facetParams: any) {
  await expect.soft(rangeInputs.minInput).toHaveValue(facetParams.initialMin);
  await expect.soft(rangeInputs.maxInput).toHaveValue(facetParams.initialMax);
}

/**
 * verify the initial values of timestamp range inputs
 * @param rangeInputs rangeInputs object for timestamp facets
 * @param facetParams the test params object for this facet
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
 * @param submit the range inputs submit button
 * @param filter the value of the recordset facet filter
 * @param numRows the number of recordset rows
 * @param pageSize the recordset page size for comparing with after clear
 */
export async function testRangeInputSubmitThenClear(page: Page, facet: Locator, submit: Locator, filter: string, numRows: number, pageSize: number) {
  await testRangeInputSubmit(page, submit, filter, numRows);

  const optionsCount = await RecordsetLocators.getFacetOptions(facet).count();
  // get last item in range inputs list to test it's unchecked
  await testClearAllFilters(page, pageSize, facet, optionsCount - 1);
}

/**
 * used to test the input value that is set by chaise on load or after zoom/unzoom
 * @param isFloat if the facet being tested is a float facet
 * @param input the input to check the value of
 * @param expectedVal the expected value of the input
 */
const testInputValue = async (isFloat: boolean, input: Locator, expectedVal: string) => {
  if (isFloat) {
    // Depending on the server/OS, the float value can be calculated slightly differently. So we're truncating
    // the number for consistency across test environments.
    const truncatedVal = parseInt(expectedVal) + '';
    await expect.soft(input).toHaveValue(new RegExp(truncatedVal));
  } else {
    await expect.soft(input).toHaveValue(expectedVal);
  }
};

/**
 * test the value in min and max inputs after page load or zoom/unzoom
 * @param rangeInputs rangeInputs object for int, float, and date facets
 * @param isFloat if the facet being tested is a float facet
 * @param min min input expected value
 * @param max max input expected value
 */
export async function testRangePickerInputsAfterZoom(rangeInputs: DefaultRangeInputLocators, isFloat: boolean, min: string, max: string) {
  await testInputValue(isFloat, rangeInputs.minInput, min);
  await testInputValue(isFloat, rangeInputs.maxInput, max);
}

/**
 * test the value in min and max inputs for timestamp facets after page load or zoom/unzoom
 * @param rangeInputs rangeInputs object for timestamp facets
 * @param min object with date and time expected values for min inputs
 * @param max object with date and time expected values for max inputs
 */
export async function testTimestampRangePickerInputsAfterZoom(
  rangeInputs: TimestampRangeInputLocators,
  min: { date: string, time: string },
  max: { date: string, time: string }
) {
  await testInputValue(false, rangeInputs.minDateInput, min.date);
  await testInputValue(false, rangeInputs.maxDateInput, max.date);

  await testInputValue(false, rangeInputs.minTimeInput, min.time);
  await testInputValue(false, rangeInputs.maxTimeInput, max.time);
}

/**
 * tests filling in the search box, submitting the search, then the number of rows displayed in the recordset table
 *
 * @param searchPhrase string to type into the search box
 * @param count number of rows shown (and total)
 */
export async function testMainSearch(page: Page, searchPhrase: string, count: number) {
  const searchBox = RecordsetLocators.getMainSearchInput(page),
    searchSubmitButton = RecordsetLocators.getSearchSubmitButton(page),
    clearSearchButton = RecordsetLocators.getSearchClearButton(page);

  // `Displaying all${count}of ${count} matching results`;
  const totalCountTextObjAfterSearch = {
    displayingText: 'Displaying all',
    dropdownButtonText: `${count}`,
    totalText: `of ${count} matching results`
  }

  if (count === 0) {
    // `Displaying ${count} matching results`
    totalCountTextObjAfterSearch.displayingText = 'Displaying ';
    totalCountTextObjAfterSearch.totalText = `${count} matching results`;
  }

  await searchBox.fill(searchPhrase);
  await searchSubmitButton.click();
  await RecordsetLocators.waitForRecordsetPageReady(page);

  await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(count);
  await testTotalCount(page, totalCountTextObjAfterSearch, count !== 0);
  if (count === 0) await expect.soft(RecordsetLocators.getNoResultsRow(page)).toHaveText('No Results Found');

  // clearing the search resets the page for the next test case
  await clearSearchButton.click();
  await RecordsetLocators.waitForRecordsetPageReady(page);

  // NOTE: factor out "totalCount" if this function is reused
  await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(4);
  const totalCountTextObj = {
    displayingText: 'Displaying all',
    dropdownButtonText: '4',
    totalText: 'of 4 matching results'
  }
  await testTotalCount(page, totalCountTextObj, true);
}

/**
 * tests the total count displayed text. If the page limit dropdown was opened,
 *   the dropdown options text becomes part of getTotalCount().text
 *   e.g. `Displaying all${count} 10 25 50 100 200of ${count} matching results`
 *
 * @param totalCountText the text we are testing for
 * @param someRows if wasDropdownOpened is true, this variable should be defined when testing there are no rows
 */
export async function testTotalCount(
  container: Page | Locator,
  totalCountText: string | TotalCountParts,
  someRows?: boolean)
{
  if (typeof totalCountText === 'string') {
    await expect.soft(RecordsetLocators.getTotalCount(container)).toHaveText(totalCountText);
  } else {
    /**
     * there are 3 elements with text in them that make up the full total count string:
     *   '.displaying-text', '.dropdown.page-size-dropdown', and '.total-count-text'
     *
     * Fetch each value and test them separately
     */
    await expect.soft(RecordsetLocators.getDisplayText(container)).toHaveText(totalCountText.displayingText);
    if (someRows) await expect.soft(RecordsetLocators.getPageLimitDropdown(container)).toHaveText(totalCountText.dropdownButtonText);
    await expect.soft(RecordsetLocators.getTotalText(container)).toHaveText(totalCountText.totalText);
  }
}

/****** Reusable Test Steps ******/

/**
 * this is done in multiple places for facet specs. it will reset the state of the facets.
 * @param page the page object
 * @param url the url of the page
 * @param totalNumFacets how many facets there are
 * @param openedFacets facets that are opened and should be closed
 * @param pageSizeAfterClear the page size after clear is clicked
 */
export async function resetFacetState(page: Page, totalNumFacets: number, openedFacets: number[], pageSizeAfterClear: number) {
  const closedFacets = RecordsetLocators.getClosedFacets(page);
  const clearAll = RecordsetLocators.getClearAllFilters(page);

  await test.step('clear all filters', async () => {
    // wait for the default facets to open first
    await expect.soft(closedFacets).toHaveCount(totalNumFacets - openedFacets.length);

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

/**
 * same as resetFacetState but opens the recordset page first.
 * @param page the page object
 * @param url the url of the page
 * @param totalNumFacets how many facets there are
 * @param openedFacets facets that are opened and should be closed
 * @param pageSizeAfterClear the page size after clear is clicked
 */
export async function openRecordsetAndResetFacetState(
  page: Page, url: string, totalNumFacets: number, openedFacets: number[], pageSizeAfterClear: number
) {
  await test.step('should load recordset page', async () => {
    await page.goto(url);
    await RecordsetLocators.waitForRecordsetPageReady(page);
  });

  await resetFacetState(page, totalNumFacets, openedFacets, pageSizeAfterClear);
}

/**
 * test facet options and and first column values in show more modal
 * @param facetIdx index of the facet we are testing
 * @param filterOptions all of the values of facet options in facet
 * @param modalOptions all of the values for the first column in the modal table
 */
export async function testFacetOptionsAndModalRows(page: Page, facetIdx: number, filterOptions: string[], modalOptions: string[]) {
  const facet = RecordsetLocators.getFacetById(page, facetIdx);

  await test.step('the facet options should be correct', async () => {
    // wait for facet to open
    await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();
    // wait for list to be fully visible
    await expect.soft(RecordsetLocators.getList(facet)).toBeVisible();
    // wait for facet checkboxes to load
    await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveText(filterOptions)
  });

  await test.step('opening the facet modal should show the correct rows.', async () => {
    // click on show more
    await RecordsetLocators.getShowMore(facet).click();

    const modal = ModalLocators.getRecordsetSearchPopup(page);
    await RecordsetLocators.waitForRecordsetPageReady(modal);

    // this will wait for the list to be the same as expected, otherwise will timeout
    await expect.soft(RecordsetLocators.getFirstColumn(modal)).toHaveText(modalOptions);

    await ModalLocators.getCloseBtn(modal).click();
    await expect.soft(modal).not.toBeAttached();
  });
}

type TestIndividualFacetParamsGeneral = {
  /**
   * the index of facet in the reference.facetColumns list
   */
  index: number,
  /**
   * the name of the facet
   */
  name: string,
  /**
   * number of rows on the page after selecting the not-null option
   */
  notNullNumRows?: number,
  /**
   * number of rows on the page after selecting the null option
   */
  nullNumRows?: number,
};

type TestIndividualFacetParamsCheckPresence = TestIndividualFacetParamsGeneral & {
  type: 'check_presence',
  /**
   * the filter that will be displayed once the not-null option is selected
   */
  notNullFilter: string,
  /**
   * the filter that will be displayed once the null option is selected
   */
  nullFilter: string
}

type TestIndividualFacetParamsChoice = TestIndividualFacetParamsGeneral & {
  type: 'choice',
  isBoolean?: boolean,
  isEntityMode?: boolean,
  searchPlaceholder?: string,
  /**
   * initially displayed option
   */
  options: string[],
  /**
   * the option that should be selected
   */
  option: number,
  /**
   * the filter that will be displayed once the option is selected
   */
  filter: string,
  /**
   * number of rows on the page after selecting the option
   */
  numRows: number,
}

type TestIndividualFacetParamsRange = TestIndividualFacetParamsGeneral & {
  type: 'numeric' | 'date' | 'timestamp',

  /**
   * number of already existing options.
   */
  listElems: number,
  /**
   * initial value in the min input
   */
  initialMin: string | { date: string, time: string },
  /**
   * initial value in the max input
   */
  initialMax: string | { date: string, time: string },
  /**
   * an invalid value to test the error handling.
   */
  invalid?: string,
  /**
   * The error that will be displayed if the input is invalid
   */
  error: string,

  range: {
    min: string | { date: string, time: string },
    max: string | { date: string, time: string },
    /**
     * the filter that will be displayed after submitting this range
     */
    filter: string,
    /**
     * number of rows that will be displayed after submitting this range.
     */
    numRows: number
  },

  justMin: {
    min: string | { date: string, time: string },
    filter: string,
    numRows: number
  },

  justMax: {
    max: string | { date: string, time: string },
    filter: string,
    numRows: number
  },

}

export type TestIndividualFacetParams = Either<
  TestIndividualFacetParamsChoice,
  Either<TestIndividualFacetParamsCheckPresence, TestIndividualFacetParamsRange>
>;

/**
 * This function can be used for testing an individual facet. This opens the facet, test its features, and then will close it.
 */
export async function testIndividualFacet(page: Page, pageSize: number, totalNumFacets: number, facetParams: TestIndividualFacetParams) {
  switch (facetParams.type) {
    case 'choice':
      await test.step('for choice facet,', async () => {
        const facet = RecordsetLocators.getFacetById(page, facetParams.index);
        await test.step('open the facet and check the available options.', async () => {
          await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(totalNumFacets);
          // open facet
          await openFacetAndTestFilterOptions(page, facet, facetParams.index, facetParams.options, 1);

          await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(0);

          if (!facetParams.isBoolean) {
            // make sure search placeholder is correct
            let placeholder = 'Search';
            if (facetParams.searchPlaceholder) {
              placeholder += ' ' + facetParams.searchPlaceholder;
            } else if (facetParams.isEntityMode) {
              placeholder += ' all columns';
            }

            await expect.soft(RecordsetLocators.getFacetSearchPlaceholderById(facet)).toHaveText(placeholder);
          }
        });

        await test.step('select a value to filter on and update the search criteria', async () => {
          await testSelectFacetOptionThenClear(
            page,
            facetParams.index,
            facetParams.option,
            facetParams.filter,
            facetParams.numRows,
            pageSize
          );

          // close the facet
          await RecordsetLocators.getFacetHeaderButtonById(facet, facetParams.index).click();
        });
      });
      break;
    case 'numeric':
    case 'date':
      await test.step('for range facet', async () => {
        const facet = RecordsetLocators.getFacetById(page, facetParams.index);
        const rangeInputs = RecordsetLocators.getFacetRangeInputs(facet);
        await test.step('should open the facet, test validators, filter on a range, and update the search criteria.', async () => {
          await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(totalNumFacets);
          // +2 is for null and not-null.
          await openFacet(page, facet, facetParams.index, (facetParams.listElems ? facetParams.listElems : 0) + 2, 1);

          // wait for facet to open
          await expect.soft(rangeInputs.submit).toBeVisible();
          await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(0);

          // wait for intial values to be set
          await testDefaultRangePickerInitialValues(rangeInputs, facetParams);

          // first clear the min and max
          await clearRangeInput(rangeInputs.minInput);
          await clearRangeInput(rangeInputs.maxInput);

          // now send an invalid value for min
          if (facetParams.invalid) await fillRangeInput(rangeInputs.minInput, facetParams.invalid);

          const validationError = RecordsetLocators.getRangeInputValidationError(facet);
          await expect.soft(validationError).toBeVisible();
          if (facetParams.error) await expect.soft(validationError).toHaveText(facetParams.error);

          // remove the invalid value so we can continue with the tests
          await clearRangeInput(rangeInputs.minInput);

          // test min and max being set
          // define test params values
          if (typeof facetParams.range.min === 'string' && typeof facetParams.range.max === 'string') {
            await fillRangeInput(rangeInputs.minInput, facetParams.range.min);
            await fillRangeInput(rangeInputs.maxInput, facetParams.range.max);

            // let validation message disappear
            await expect.soft(validationError).not.toBeVisible();
            await testRangeInputSubmitThenClear(
              page,
              facet,
              rangeInputs.submit,
              facetParams.range.filter,
              facetParams.range.numRows,
              pageSize
            );
            await testDefaultRangePickerInitialValues(rangeInputs, facetParams);

            // clear inputs
            await clearRangeInput(rangeInputs.minInput);
            await clearRangeInput(rangeInputs.maxInput);
          }
        });

        if (typeof facetParams.notNullNumRows === 'number') {
          await test.step('should be able to filter not-null values.', async () => {
            await testSelectFacetOption(page, facet, 0, facetParams.notNullNumRows!, 1);

            // make sure submit is disabled
            await expect.soft(rangeInputs.submit).toHaveAttribute('disabled');

            await testClearAllFilters(page, pageSize, facet, 0);
            await testDefaultRangePickerInitialValues(rangeInputs, facetParams);

            // clear inputs
            await clearRangeInput(rangeInputs.minInput);
            await clearRangeInput(rangeInputs.maxInput);
          });
        }

        if (typeof facetParams.nullNumRows === 'number') {
          await test.step('should be able to filter null values.', async () => {
            await testSelectFacetOption(page, facet, 1, facetParams.nullNumRows!, 1);

            await testClearAllFilters(page, pageSize, facet, 1);
            await testDefaultRangePickerInitialValues(rangeInputs, facetParams);

            // clear inputs
            await clearRangeInput(rangeInputs.minInput);
            await clearRangeInput(rangeInputs.maxInput);
          });
        }

        await test.step('should filter on just a min value and update the search criteria.', async () => {
          if (!facetParams.justMin || typeof facetParams.justMin.min !== 'string') return;

          // test just min being set
          await fillRangeInput(rangeInputs.minInput, facetParams.justMin.min);

          // let validation message disappear
          await expect.soft(RecordsetLocators.getRangeInputValidationError(facet)).not.toBeVisible();
          await testRangeInputSubmitThenClear(
            page,
            facet,
            rangeInputs.submit,
            facetParams.justMin.filter,
            facetParams.justMin.numRows,
            pageSize
          );

          await testDefaultRangePickerInitialValues(rangeInputs, facetParams);

          await clearRangeInput(rangeInputs.minInput);
          await clearRangeInput(rangeInputs.maxInput);
        });

        await test.step('should filter on just a max value and update the search criteria.', async () => {
          if (!facetParams.justMax || typeof facetParams.justMax.max !== 'string') return;

          // test just max being set
          await fillRangeInput(rangeInputs.maxInput, facetParams.justMax.max);

          // let validation message disappear
          await expect.soft(RecordsetLocators.getRangeInputValidationError(facet)).not.toBeVisible();
          await testRangeInputSubmitThenClear(
            page,
            facet,
            rangeInputs.submit,
            facetParams.justMax.filter,
            facetParams.justMax.numRows,
            pageSize
          );

          await testDefaultRangePickerInitialValues(rangeInputs, facetParams);

          // close the facet
          await RecordsetLocators.getFacetHeaderButtonById(facet, facetParams.index).click();
        });
      });

      break;
    case 'timestamp':
      await test.step('for timetamp range facet', async () => {
        const facet = RecordsetLocators.getFacetById(page, facetParams.index);
        const rangeInputs = RecordsetLocators.getFacetRangeTimestampInputs(facet);
        await test.step('should open the facet, test validators, filter on a range, and update the search criteria.', async () => {
          await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(totalNumFacets);
          await openFacet(page, facet, facetParams.index, facetParams.listElems + 2, 1);

          // wait for facet to open
          await expect.soft(rangeInputs.submit).toBeVisible();
          await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(0);

          // wait for intial values to be set
          await testTimestampRangePickerInitialValues(rangeInputs, facetParams);

          // test validator by clearing the date input
          await clearRangeInput(rangeInputs.minDateInput);

          const validationError = RecordsetLocators.getRangeInputValidationError(facet);
          await expect.soft(validationError).toBeVisible();
          await expect.soft(validationError).toHaveText(facetParams.error);

          // clear the inputs first so we can then change their values
          await clearRangeInput(rangeInputs.maxDateInput);
          await clearRangeInput(rangeInputs.minTimeInput);
          await clearRangeInput(rangeInputs.maxTimeInput);

          // test min and max being set
          if (typeof facetParams.range.min === 'object' && typeof facetParams.range.max === 'object') {
            // define test params values
            await fillRangeInput(rangeInputs.minDateInput, facetParams.range.min.date);
            await fillRangeInput(rangeInputs.maxDateInput, facetParams.range.max.date);

            await fillRangeInput(rangeInputs.minTimeInput, facetParams.range.min.time);
            await fillRangeInput(rangeInputs.maxTimeInput, facetParams.range.max.time);

            // let validation message disappear
            await expect.soft(RecordsetLocators.getRangeInputValidationError(facet)).not.toBeVisible();
            await testRangeInputSubmitThenClear(
              page,
              facet,
              rangeInputs.submit,
              facetParams.range.filter,
              facetParams.range.numRows,
              pageSize
            );

            await testTimestampRangePickerInitialValues(rangeInputs, facetParams);
          }

          // clear the inputs
          await clearRangeInput(rangeInputs.minDateInput);
          await clearRangeInput(rangeInputs.maxDateInput);
          await clearRangeInput(rangeInputs.minTimeInput);
          await clearRangeInput(rangeInputs.maxTimeInput);
        });

        if (typeof facetParams.notNullNumRows === 'number') {
          await test.step('should be able to filter not-null values.', async () => {
            await testSelectFacetOption(page, facet, 0, facetParams.notNullNumRows!, 1);

            // make sure submit is disabled
            await expect.soft(rangeInputs.submit).toHaveAttribute('disabled');

            await testClearAllFilters(page, pageSize, facet, 0);
            await testTimestampRangePickerInitialValues(rangeInputs, facetParams);

            // clear the inputs
            await clearRangeInput(rangeInputs.minDateInput);
            await clearRangeInput(rangeInputs.maxDateInput);
            await clearRangeInput(rangeInputs.minTimeInput);
            await clearRangeInput(rangeInputs.maxTimeInput);
          });
        }

        if (typeof facetParams.nullNumRows === 'number') {
          await test.step('should be able to filter not-null values.', async () => {
            await testSelectFacetOption(page, facet, 1, facetParams.nullNumRows!, 1);

            await testClearAllFilters(page, pageSize, facet, 1);
            await testTimestampRangePickerInitialValues(rangeInputs, facetParams);

            // clear the inputs
            await clearRangeInput(rangeInputs.minDateInput);
            await clearRangeInput(rangeInputs.maxDateInput);
            await clearRangeInput(rangeInputs.minTimeInput);
            await clearRangeInput(rangeInputs.maxTimeInput);
          });
        }

        await test.step('should filter on just a min value and update the search criteria.', async () => {
          if (!facetParams.justMin || typeof facetParams.justMin.min !== 'object') return;

          // test just min being set
          await fillRangeInput(rangeInputs.minDateInput, facetParams.justMin.min.date);
          await fillRangeInput(rangeInputs.minTimeInput, facetParams.justMin.min.time);

          // let validation message disappear
          await expect.soft(RecordsetLocators.getRangeInputValidationError(facet)).not.toBeVisible();
          await testRangeInputSubmitThenClear(
            page,
            facet,
            rangeInputs.submit,
            facetParams.justMin.filter,
            facetParams.justMin.numRows,
            pageSize
          );

          await testTimestampRangePickerInitialValues(rangeInputs, facetParams);

          // clear the inputs
          await clearRangeInput(rangeInputs.minDateInput);
          await clearRangeInput(rangeInputs.maxDateInput);
          await clearRangeInput(rangeInputs.minTimeInput);
          await clearRangeInput(rangeInputs.maxTimeInput);
        });

        await test.step('should filter on just a max value and update the search criteria.', async () => {
          if (!facetParams.justMax || typeof facetParams.justMax.max !== 'object') return;

          // test just max being set
          await fillRangeInput(rangeInputs.maxDateInput, facetParams.justMax.max.date);
          await fillRangeInput(rangeInputs.maxTimeInput, facetParams.justMax.max.time);

          // let validation message disappear
          await expect.soft(RecordsetLocators.getRangeInputValidationError(facet)).not.toBeVisible();
          await testRangeInputSubmitThenClear(
            page,
            facet,
            rangeInputs.submit,
            facetParams.justMax.filter,
            facetParams.justMax.numRows,
            pageSize
          );

          await testTimestampRangePickerInitialValues(rangeInputs, facetParams);

          // close the facet
          await RecordsetLocators.getFacetHeaderButtonById(facet, facetParams.index).click();
        });
      });

      break;
    case 'check_presence':
      await test.step('for check_presence facet', async () => {
        const facet = RecordsetLocators.getFacetById(page, facetParams.index);
        await test.step('should open the facet and the two options should be available.', async () => {
          await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(totalNumFacets);

          await openFacetAndTestFilterOptions(page, facet, facetParams.index, ['All records with value', 'No value'], 1);

          await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(0);
        });

        await test.step('selecting the not-null option, should only show the applicable rows.', async () => {
          if (facetParams.notNullNumRows === undefined) return;

          await testSelectFacetOptionThenClear(
            page,
            facetParams.index,
            0,
            facetParams.notNullFilter,
            facetParams.notNullNumRows,
            pageSize
          );
        });

        await test.step('selecting the null option, should only show the applicable rows.', async () => {
          if (facetParams.nullNumRows === undefined) return;

          await testSelectFacetOptionThenClear(
            page,
            facetParams.index,
            1,
            facetParams.nullFilter,
            facetParams.nullNumRows,
            pageSize
          );

          await RecordsetLocators.getFacetHeaderButtonById(facet, facetParams.index).click();
        });
      });

      break;
    default:
      break;
  }
}
