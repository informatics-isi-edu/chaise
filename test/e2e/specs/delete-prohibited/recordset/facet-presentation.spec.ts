import { test, expect } from '@playwright/test';

// locators
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { testTooltip } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams: any = {
  schema_name: 'faceting',
  table_name: 'main',
  sort: '@sort(id)',
  totalNumFacets: 23,
  facetNames: [
    'id', 'int_col', 'float_col', 'date_col', 'timestamp_col', 'text_col',
    'longtext_col', 'markdown_col', 'boolean_col', 'jsonb_col', 'F1',
    'to_name', 'f3 (term)', 'from_name', 'F1 with Term', 'Check Presence Text',
    'F3 Entity', 'F5', 'F5 with filter', 'Outbound1 (using F1)',
    'col_w_column_order_false', 'col_w_column_order', 'col_w_long_values'
  ],
  defaults: {
    openFacetNames: ['id', 'int_col', 'to_name'],
    numFilters: 2,
    numRows: 1,
    pageSize: 25
  },
  searchBox: {
    term: 'one',
    numRows: 6,
    term2: 'eve',
    term2Rows: 4,
    term3: 'evens',
    term3Rows: 1
  },
  facetComments: [
    'ID comment', 'int comment', null, null, 'timestamp column', null,
    'A lengthy comment for the facet of the longtext_col. This should be displyed properly in the facet.',
    null, null, null, null, null, null, null, 'F1 with Term comment', null, null,
    null, 'has filters', 'is using another facet sourcekey in source', null
  ]
};

test('Viewing Recordset with Faceting, default presentation based on facets annotation', async ({ page, baseURL }, testInfo) => {
  await test.step('should load recordset page', async () => {
    const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}${testParams.sort}`;

    await page.goto(`${baseURL}${PAGE_URL}`);
    await RecordsetLocators.waitForRecordsetPageReady(page);
  });

  await test.step('should have 1 row visible', async () => {
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.defaults.numRows);
  });

  await test.step('verify the text is truncated properly on load, then not truncated after clicking "more"', async () => {
    // default config: maxRecordsetRowHeight = 100
    // 100 for max height, 10 for padding, 1 for border
    const cellHeight = 110;
    let testCellDimensions;

    const firstRow = RecordsetLocators.getRows(page).nth(0);
    const testCell = RecordsetLocators.getRowCells(firstRow).nth(2);

    await expect.soft(testCell).toContainText('... more');
    testCellDimensions = await testCell.boundingBox();
    expect.soft(Math.trunc(testCellDimensions?.height || 0)).toBe(cellHeight);

    await testCell.locator('.readmore').click();

    await expect.soft(testCell).toContainText('... less');
    testCellDimensions = await testCell.boundingBox();
    expect.soft(testCellDimensions?.height).toBeGreaterThan(cellHeight);
  });

  await test.step('should have ' + testParams.totalNumFacets + ' facets', async () => {
    await expect.soft(RecordsetLocators.getAllFacets(page)).toHaveCount(testParams.totalNumFacets);

    const titles = RecordsetLocators.getFacetTitles(page);
    const count = await titles.count();
    for (let i = 0; i < count; i++) {
      await expect.soft(titles.nth(i)).toHaveText(testParams.facetNames[i])
    }
  });

  await test.step('should have 3 facets open', async () => {
    await expect.soft(RecordsetLocators.getOpenFacets(page)).toHaveCount(testParams.defaults.openFacetNames.length);

    const titles = RecordsetLocators.getOpenFacetTitles(page);
    const count = await titles.count();
    for (let i = 0; i < count; i++) {
      await expect.soft(titles.nth(i)).toHaveText(testParams.defaults.openFacetNames[i])
    }
  });

  // test defaults and values shown
  await test.step('"id" facet should have 1 facet option checked', async () => {
    // use 0 index
    const facet = RecordsetLocators.getFacetById(page, 0);
    await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
    await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(1);
  });

  await test.step('"int_col" facet should not show the histogram with 1 facet options checked', async () => {
    // use 1 index
    const facet = RecordsetLocators.getFacetById(page, 1);
    await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
    await expect.soft(RecordsetLocators.getFacetHistogram(facet)).not.toBeVisible();
    await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(1);
  });

  await test.step('should have 2 filters selected', async () => {
    await expect.soft(RecordsetLocators.getFacetFilters(page)).toHaveCount(testParams.defaults.numFilters);
  });

  await test.step('should have 1 row selected in show more popup for scalar picker and should be able to search in popup.', async () => {
    const facet = RecordsetLocators.getFacetById(page, 0);

    // open show more, verify only 1 row checked, check another and submit
    await RecordsetLocators.getShowMore(facet).click();

    const facetPopup = ModalLocators.getScalarPopup(page);
    // one row is selected
    await expect.soft(RecordsetLocators.getCheckedCheckboxInputs(facetPopup)).toHaveCount(1);

    // search
    const searchInp = RecordsetLocators.getMainSearchInput(facetPopup),
      searchSubmitBtn = RecordsetLocators.getSearchSubmitButton(facetPopup);

    await searchInp.fill('1|2');
    await searchSubmitBtn.click();

    const modalOptions = RecordsetLocators.getCheckboxInputs(facetPopup);
    // make sure search result is displayed
    await expect.soft(modalOptions).toHaveCount(13);

    // make sure the first row is selected
    await expect(modalOptions.nth(0)).toBeChecked();

    const optionsCount = await modalOptions.count();
    for (let i = 0; i < optionsCount; i++) {
      if (i === 0) continue;
      await expect.soft(modalOptions.nth(i)).not.toBeChecked();
    }

    // click the 2nd option
    await modalOptions.nth(1).check();
    await ModalLocators.getSubmitButton(facetPopup).click();

    await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(2);

    // make sure the number of rows is correct
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(2)

    // search string too
    await RecordsetLocators.getFacetSearchBox(facet).fill('11');
    await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveCount(3);

    await RecordsetLocators.getFacetSearchBoxClear(facet).click();
  });

  await test.step('boolean facet should not have a search box present', async () => {
    // idx 8 is for boolean facet
    const facet = RecordsetLocators.getFacetById(page, 8);
    const facetHeader = RecordsetLocators.getFacetHeaderButtonById(facet, 8);

    await facetHeader.click();
    await expect.soft(RecordsetLocators.getFacetSearchBox(facet)).not.toBeAttached();

    // close the facet
    await facetHeader.click();
  });

  await test.step('main search box should show the search columns.', async () => {
    await expect.soft(RecordsetLocators.getMainSearchPlaceholder(page)).toHaveText('Search text, long column');
  });

  // eslint-disable-next-line max-len
  await test.step('search using the global search box should search automatically, show the search phrase as a filter, and show the set of results', async () => {
    const mainSearch = RecordsetLocators.getMainSearchInput(page);

    await RecordsetLocators.getClearAllFilters(page).click();
    await page.locator('.recordest-main-spinner').waitFor({ state: 'detached' });

    await mainSearch.fill(testParams.searchBox.term);
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.searchBox.numRows);

    await RecordsetLocators.getSearchClearButton(page).click();
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.defaults.pageSize);
    await expect.soft(mainSearch).toHaveText('');

    await mainSearch.fill(testParams.searchBox.term2);
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.searchBox.term2Rows);

    // fill replaces all content, term3 changed to be term2 + oldTerm3 (eve + ns)
    await mainSearch.fill(testParams.searchBox.term3);
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.searchBox.term3Rows);

    await RecordsetLocators.getSearchClearButton(page).click();
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.defaults.pageSize);
  });

  await test.step('should have 1 row selected in show more popup for entity.', async () => {
    const facet = RecordsetLocators.getFacetById(page, 11);
    await expect.soft(RecordsetLocators.getFacetSpinner(facet)).not.toBeVisible();
    await RecordsetLocators.getFacetOption(facet, 0).check();

    // open show more, verify only 1 row checked, check another and submit
    await RecordsetLocators.getShowMore(facet).click();

    const facetPopup = ModalLocators.getRecordsetSearchPopup(page);
    // one row is selected
    await expect.soft(RecordsetLocators.getCheckedCheckboxInputs(facetPopup)).toHaveCount(1);

    const modalOptions = RecordsetLocators.getCheckboxInputs(facetPopup);
    // click the 2nd option
    await modalOptions.nth(1).check();

    await ModalLocators.getSubmitButton(facetPopup).click();
    await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(2);
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(15);

    await RecordsetLocators.getClearAllFilters(page).click();
  });

  await test.step('should show correct tooltip for the facets.', async () => {
    const testFacetTooltip = async (idx: number) => {

      // if we reached the end of the list, then finish the test case
      if (idx === testParams.facetComments.length) return;

      const comment = testParams.facetComments[idx];

      // if the facet doesn't have any comment, go to the next
      if (!comment) {
        await testFacetTooltip(idx + 1);
        return;
      }

      await testTooltip(RecordsetLocators.getFacetHeaderById(page, idx), comment, APP_NAMES.RECORDSET, true)
      await testFacetTooltip(idx + 1);
    }

    // go one by one over facets and test their tooltip
    await testFacetTooltip(0);
  });
});
