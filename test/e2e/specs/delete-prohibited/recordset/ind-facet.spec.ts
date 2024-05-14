import { test, expect } from '@playwright/test';

// locators
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { testTooltip } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams = {
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
  minInputClass: 'range-min',
  minInputClearClass: 'min-clear',
  maxInputClass: 'range-max',
  maxInputClearClass: 'max-clear',
  tsMinDateInputClass: 'ts-date-range-min',
  tsMinDateInputClearClass: 'min-date-clear',
  tsMinTimeInputClass: 'ts-time-range-min',
  tsMinTimeInputClearClass: 'min-time-clear',
  tsMaxDateInputClass: 'ts-date-range-max',
  tsMaxDateInputClearClass: 'max-date-clear',
  tsMaxTimeInputClass: 'ts-time-range-max',
  tsMaxTimeInputClearClass: 'max-time-clear',
  facets: [
    {
      name: 'id',
      type: 'choice',
      totalNumOptions: 10,
      option: 2,
      filter: 'id\n3',
      numRows: 1,
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      comment: 'ID comment'
    },
    {
      name: 'int_col',
      type: 'numeric',
      notNullNumRows: 20,
      listElems: 1,
      invalid: 1.1,
      error: 'Please enter a valid integer value.',
      range: {
        min: 5,
        max: 10,
        filter: 'int_col\n5 to 10',
        numRows: 6
      },
      justMin: {
        min: 6,
        filter: 'int_col\n≥ 6',
        numRows: 17
      },
      justMax: {
        max: 12,
        filter: 'int_col\n≤ 12',
        numRows: 15
      },
      comment: 'int comment'
    },
    {
      name: 'float_col',
      type: 'numeric',
      listElems: 0,
      invalid: '1.1.',
      error: 'Please enter a valid decimal value.',
      range: {
        min: 6.5,
        max: 12.2,
        filter: 'float_col\n6.5000 to 12.2000',
        numRows: 12
      },
      justMin: {
        min: 8.9,
        filter: 'float_col\n≥ 8.9000',
        numRows: 14
      },
      justMax: {
        max: 7.45,
        filter: 'float_col\n≤ 7.4500',
        numRows: 4
      }
    },
    {
      name: 'date_col',
      type: 'date',
      listElems: 0,
      invalid: '2013-',
      error: 'Please enter a valid date value in YYYY-MM-DD format.',
      range: {
        min: '2002-06-14',
        max: '2007-12-12',
        filter: 'date_col\n2002-06-14 to 2007-12-12',
        numRows: 5
      },
      justMin: {
        min: '2009-12-14',
        filter: 'date_col\n≥ 2009-12-14',
        numRows: 3
      },
      justMax: {
        max: '2007-04-18',
        filter: 'date_col\n≤ 2007-04-18',
        numRows: 14
      }
    },
    {
      name: 'timestamp_col',
      type: 'timestamp',
      listElems: 0,
      notNullNumRows: 20,
      // invalid removed since mask protects against bad input values, clear date input to test validator
      // invalid: {...}
      error: 'Please enter a valid date value in YYYY-MM-DD format.',
      range: {
        minDate: '2004-05-20',
        minTime: '10:08:00',
        maxDate: '2007-12-06',
        maxTime: '17:26:12',
        filter: 'timestamp_col\n2004-05-20 10:08:00 to 2007-12-06 17:26:12',
        numRows: 3
      },
      justMin: {
        date: '2004-05-20',
        time: '10:08:00',
        filter: 'timestamp_col\n≥ 2004-05-20 10:08:00',
        numRows: 8
      },
      justMax: {
        date: '2007-12-06',
        time: '17:26:12',
        filter: 'timestamp_col\n≤ 2007-12-06 17:26:12',
        numRows: 15
      },
      comment: 'timestamp column'
    },
    {
      name: 'text_col',
      type: 'choice',
      totalNumOptions: 12,
      option: 1,
      filter: 'text_col\nNo value',
      numRows: 5,
      options: ['All records with value', 'No value', 'one', 'Empty', 'two', 'seven', 'eight', 'elevens', 'four', 'six', 'ten', 'three']
    },
    {
      name: 'longtext_col',
      type: 'choice',
      totalNumOptions: 10,
      option: 1,
      filter: 'longtext_col\ntwo',
      numRows: 5,
      options: [
        'Empty', 'two', 'one', 'eight', 'eleven', 'five', 'four',
        // eslint-disable-next-line max-len
        'lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod.',
        'nine', 'seven'
      ],
      comment: 'A lengthy comment for the facet of the longtext_col. This should be displyed properly in the facet.'
    },
    {
      name: 'markdown_col',
      type: 'choice',
      totalNumOptions: 10,
      option: 3,
      filter: 'markdown_col\neight',
      numRows: 1,
      options: ['Empty', 'one', 'two', 'eight', 'eleven', 'five', 'four', 'nine', 'seven', 'six']
    },
    {
      name: 'boolean_col',
      type: 'choice',
      totalNumOptions: 3,
      option: 2,
      filter: 'boolean_col\nYes',
      numRows: 10,
      options: ['All records with value', 'No', 'Yes'],
      isBoolean: true
    },
    {
      name: 'jsonb_col',
      type: 'choice',
      totalNumOptions: 11,
      option: 4,
      filter: 'jsonb_col\n{ \'key\': \'four\' }',
      numRows: 1,
      options: [
        'All records with value', '{ \'key\': \'one\' }', '{ \'key\': \'two\' }',
        '{ \'key\': \'three\' }', '{ \'key\': \'four\' }', '{ \'key\': \'five\' }',
        '{ \'key\': \'six\' }', '{ \'key\': \'seven\' }', '{ \'key\': \'eight\' }',
        '{ \'key\': \'nine\' }', '{ \'key\': \'ten\' }'
      ]
    },
    {
      name: 'F1',
      type: 'choice',
      totalNumOptions: 11,
      option: 2,
      filter: 'F1\ntwo',
      numRows: 10,
      options: ['No value', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
      isEntityMode: true,
      searchPlaceholder: 'term column'
    },
    {
      name: 'to_name',
      type: 'choice',
      totalNumOptions: 10,
      option: 0,
      filter: 'to_name\none',
      numRows: 10,
      options: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
      comment: 'open facet',
      isEntityMode: true
    },
    {
      name: 'f3 (term)',
      type: 'choice',
      totalNumOptions: 3,
      option: 1,
      filter: 'f3 (term)\none',
      numRows: 6,
      options: ['All records with value', 'one', 'two']
    },
    {
      name: 'from_name',
      type: 'choice',
      totalNumOptions: 11,
      option: 5,
      filter: 'from_name\n5',
      numRows: 1,
      options: ['All records with value', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    },
    {
      name: 'F1 with Term',
      type: 'choice',
      totalNumOptions: 10,
      option: 1,
      filter: 'F1 with Term\ntwo',
      numRows: 10,
      options: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
      comment: 'F1 with Term comment',
      isEntityMode: true,
      searchPlaceholder: 'term column'
    },
    {
      name: 'Check Presence Text',
      type: 'check_presence',
      notNullNumRows: 9,
      notNullFilter: 'Check Presence Text\nAll records with value',
      nullNumRows: 21,
      nullFilter: 'Check Presence Text\nNo value'
    },
    {
      name: 'F3 Entity',
      type: 'choice',
      totalNumOptions: 4,
      option: 1,
      filter: 'F3 Entity\nNo value',
      numRows: 23,
      options: ['All records with value', 'No value', 'one', 'two'],
      isEntityMode: true
    },
    {
      name: 'F5',
      type: 'choice',
      totalNumOptions: 4,
      option: 2,
      filter: 'F5\none',
      numRows: 1,
      options: ['All records with value', 'No value', 'one', 'two'],
      isEntityMode: true
    },
    {
      name: 'F5 with filter',
      type: 'choice',
      totalNumOptions: 2,
      option: 1,
      filter: 'F5 with filter\ntwo',
      numRows: 1,
      comment: 'has filters',
      options: ['All records with value', 'two'],
      isEntityMode: true
    },
    {
      name: 'Outbound1 (using F1)',
      type: 'choice',
      totalNumOptions: 10,
      option: 2,
      filter: 'Outbound1 (using F1)\nfour (o1)',
      numRows: 1,
      options: [
        'one (o1)', 'three (o1)', 'four (o1)', 'six (o1)', 'seven (o1)',
        'eight (o1)', 'nine (o1)', 'ten (o1)', 'eleven (o1)', 'twelve (o1)'
      ],
      isEntityMode: true,
      comment: 'is using another facet sourcekey in source'
    },
    {
      name: 'col_w_column_order_false',
      type: 'choice',
      totalNumOptions: 8,
      option: 1,
      filter: 'col_w_column_order_false\n01',
      numRows: 9,
      options: ['All records with value', '01', '02', '03', '04', '05', '06', '07']
    }
  ],
  multipleFacets: [
    { facetIdx: 10, option: 2, numOptions: 11, numRows: 10 },
    { facetIdx: 11, option: 0, numOptions: 2, numRows: 5 },
    { facetIdx: 12, option: 1, numOptions: 2, numRows: 5 },
    { facetIdx: 13, option: 2, numOptions: 6, numRows: 1 }
  ]
};

test('Viewing Recordset with Faceting, For table main ', async ({ page, baseURL }, testInfo) => {
  await test.step('should load recordset page', async () => {
    const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}${testParams.sort}`;

    await page.goto(`${baseURL}${PAGE_URL}`);
    await RecordsetLocators.waitForRecordsetPageReady(page);
  });

  await test.step('default presentation based on facets annotation', async () => {
    await test.step('verify the text is truncated properly on load, then not truncated after clicking "more"', async () => {
      // default config: maxRecordsetRowHeight = 100
      // 100 for max height, 10 for padding, 1 for border
      const cellHeight = 110;
      let testCellDimensions;

      const firstRow = RecordsetLocators.getRows(page).nth(0)
      const testCell = RecordsetLocators.getRowCells(firstRow).nth(2);

      await expect.soft(testCell).toContainText('... more');
      testCellDimensions = await testCell.boundingBox();
      expect.soft(Math.trunc(testCellDimensions?.height || 0)).toBe(cellHeight);

      await testCell.locator('.readmore').click()

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
    await test.step('"id" facet should have 1 row checked', async () => {
      // use 0 index
      const facet = RecordsetLocators.getFacetById(page, 0);
      await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(1);
    });

    await test.step('"int_col" facet should not show the histogram', async () => {
      // use 1 index
      const facet = RecordsetLocators.getFacetById(page, 1);
      await expect.soft(RecordsetLocators.getFacetHistogram(facet)).not.toBeVisible();
    });

    await test.step('should have 2 filters selected', async () => {
      await expect.soft(RecordsetLocators.getFacetFilters(page)).toHaveCount(testParams.defaults.numFilters);
    });

    await test.step('should have 1 row visible', async () => {
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.defaults.numRows);
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
      // await expect.soft(page.locator('.recordest-main-spinner')).not.toBeAttached();
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
      await RecordsetLocators.getFacetOption(facet, 0).click();

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
      const testFacettooltip = async (idx: number) => {

        // if we reached the end of the list, then finish the test case
        if (idx === testParams.facets.length) return;

        const facetParams = testParams.facets[idx];

        // if the facet doesn't have any comment, go to the next
        if (!facetParams.comment) {
          await testFacettooltip(idx + 1);
          return;
        }

        await testTooltip(RecordsetLocators.getFacetHeaderById(page, idx), facetParams.comment, APP_NAMES.RECORDSET, true)
        await testFacettooltip(idx + 1);
      }

      // go one by one over facets and test their tooltip
      await testFacettooltip(0);
    });

    await test.step('close default open facets', async () => {
      let facet = RecordsetLocators.getFacetById(page, 11);
      await RecordsetLocators.getFacetHeaderButtonById(facet, 11).click();
      await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets - 2);

      facet = RecordsetLocators.getFacetById(page, 1);
      await RecordsetLocators.getFacetHeaderButtonById(facet, 1).click();
      await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets - 1);

      facet = RecordsetLocators.getFacetById(page, 0);
      await RecordsetLocators.getFacetHeaderButtonById(facet, 0).click();
    });
  });

  // await test.step('selecting individual filters for each facet type', async () => {

  // })

});
