import { test, expect } from '@playwright/test';

// locators
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import {
  openFacetAndTestFilterOptions, openRecordsetAndResetFacetState, testSelectFacetOption
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';

const testParams: any = {
  schema_name: 'faceting',
  table_name: 'main',
  sort: '@sort(id)',
  totalNumFacets: 23,
  defaults: {
    numRows: 1,
    pageSize: 25
  },
  facets: [
    {
      name: 'id',
      type: 'choice',
      totalNumOptions: 10,
      option: 2,
      filter: 'id3',
      numRows: 1,
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      comment: 'ID comment'
    },
    {
      name: 'int_col',
      type: 'numeric',
      notNullNumRows: 20,
      listElems: 1,
      invalid: '1.1',
      initialMin: '3',
      initialMax: '22',
      error: 'Please enter a valid integer value.',
      range: {
        min: '5',
        max: '10',
        filter: 'int_col5 to 10',
        numRows: 6
      },
      justMin: {
        min: '6',
        filter: 'int_col≥ 6',
        numRows: 17
      },
      justMax: {
        max: '12',
        filter: 'int_col≤ 12',
        numRows: 15
      },
      comment: 'int comment'
    },
    {
      name: 'float_col',
      type: 'numeric',
      listElems: 0,
      invalid: '1.1.',
      initialMin: '3.2999',
      initialMax: '22.2201',
      error: 'Please enter a valid decimal value.',
      range: {
        min: '6.5',
        max: '12.2',
        filter: 'float_col6.5000 to 12.2000',
        numRows: 12
      },
      justMin: {
        min: '8.9',
        filter: 'float_col≥ 8.9000',
        numRows: 14
      },
      justMax: {
        max: '7.45',
        filter: 'float_col≤ 7.4500',
        numRows: 4
      }
    },
    {
      name: 'date_col',
      type: 'date',
      listElems: 0,
      invalid: '2013-',
      initialMin: '2001-01-01',
      initialMax: '2012-12-12',
      error: 'Please enter a valid date value in YYYY-MM-DD format.',
      range: {
        min: '2002-06-14',
        max: '2007-12-12',
        filter: 'date_col2002-06-14 to 2007-12-12',
        numRows: 5
      },
      justMin: {
        min: '2009-12-14',
        filter: 'date_col≥ 2009-12-14',
        numRows: 3
      },
      justMax: {
        max: '2007-04-18',
        filter: 'date_col≤ 2007-04-18',
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
      initialMin: {
        date: '2001-01-01',
        time: '00:01:01'
      },
      initialMax: {
        date: '2012-12-12',
        time: '11:12:13'
      },
      error: 'Please enter a valid date value in YYYY-MM-DD format.',
      range: {
        minDate: '2004-05-20',
        minTime: '10:08:00',
        maxDate: '2007-12-06',
        maxTime: '17:26:12',
        filter: 'timestamp_col2004-05-20 10:08:00 to 2007-12-06 17:26:12',
        numRows: 3
      },
      justMin: {
        date: '2004-05-20',
        time: '10:08:00',
        filter: 'timestamp_col≥ 2004-05-20 10:08:00',
        numRows: 8
      },
      justMax: {
        date: '2007-12-06',
        time: '17:26:12',
        filter: 'timestamp_col≤ 2007-12-06 17:26:12',
        numRows: 15
      },
      comment: 'timestamp column'
    },
    {
      name: 'text_col',
      type: 'choice',
      totalNumOptions: 12,
      option: 1,
      filter: 'text_colNo value',
      numRows: 5,
      options: ['All records with value', 'No value', 'one', 'Empty', 'two', 'seven', 'eight', 'elevens', 'four', 'six', 'ten', 'three']
    },
    {
      name: 'longtext_col',
      type: 'choice',
      totalNumOptions: 10,
      option: 1,
      filter: 'longtext_coltwo',
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
      filter: 'markdown_coleight',
      numRows: 1,
      options: ['Empty', 'one', 'two', 'eight', 'eleven', 'five', 'four', 'nine', 'seven', 'six']
    },
    {
      name: 'boolean_col',
      type: 'choice',
      totalNumOptions: 3,
      option: 2,
      filter: 'boolean_colYes',
      numRows: 10,
      options: ['All records with value', 'No', 'Yes'],
      isBoolean: true
    },
    {
      name: 'jsonb_col',
      type: 'choice',
      totalNumOptions: 11,
      option: 4,
      filter: 'jsonb_col{\n"key": "four"\n}',
      numRows: 1,
      options: [
        'All records with value', '{\n"key": "one"\n}', '{\n"key": "two"\n}',
        '{\n"key": "three"\n}', '{\n"key": "four"\n}', '{\n"key": "five"\n}',
        '{\n"key": "six"\n}', '{\n"key": "seven"\n}', '{\n"key": "eight"\n}',
        '{\n"key": "nine"\n}', '{\n"key": "ten"\n}'
      ]
    },
    {
      name: 'F1',
      type: 'choice',
      totalNumOptions: 11,
      option: 2,
      filter: 'F1two',
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
      filter: 'to_nameone',
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
      filter: 'f3 (term)one',
      numRows: 6,
      options: ['All records with value', 'one', 'two']
    },
    {
      name: 'from_name',
      type: 'choice',
      totalNumOptions: 11,
      option: 5,
      filter: 'from_name5',
      numRows: 1,
      options: ['All records with value', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    },
    {
      name: 'F1 with Term',
      type: 'choice',
      totalNumOptions: 10,
      option: 1,
      filter: 'F1 with Termtwo',
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
      notNullFilter: 'Check Presence TextAll records with value',
      nullNumRows: 21,
      nullFilter: 'Check Presence TextNo value'
    },
    {
      name: 'F3 Entity',
      type: 'choice',
      totalNumOptions: 4,
      option: 1,
      filter: 'F3 EntityNo value',
      numRows: 23,
      options: ['All records with value', 'No value', 'one', 'two'],
      isEntityMode: true
    },
    {
      name: 'F5',
      type: 'choice',
      totalNumOptions: 4,
      option: 2,
      filter: 'F5one',
      numRows: 1,
      options: ['All records with value', 'No value', 'one', 'two'],
      isEntityMode: true
    },
    {
      name: 'F5 with filter',
      type: 'choice',
      totalNumOptions: 2,
      option: 1,
      filter: 'F5 with filtertwo',
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
      filter: 'Outbound1 (using F1)four (o1)',
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
      filter: 'col_w_column_order_false01',
      numRows: 9,
      options: ['All records with value', '01', '02', '03', '04', '05', '06', '07']
    }
  ]
}

test.describe('Testing individual facet types', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const [index, facetParams] of testParams.facets.entries()) {
    test(`Testing facet: ${facetParams.name},`, async ({ page, baseURL }, testInfo) => {
      const clearAll = RecordsetLocators.getClearAllFilters(page);

      await openRecordsetAndResetFacetState(page,
        `${baseURL}/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}${testParams.sort}`,
        testParams.totalNumFacets,
        [0, 1, 11],
        testParams.defaults.pageSize
      );

      switch (facetParams.type) {
        case 'choice':
          await test.step('for choice facet,', async () => {
            const facet = RecordsetLocators.getFacetById(page, index);
            await test.step('open the facet and check the available options.', async () => {
              await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets);
              // // open facet
              await openFacetAndTestFilterOptions(facet, index, facetParams.options)
              
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
              await testSelectFacetOption(page, index, facetParams.option, facetParams.filter, facetParams.numRows);

              await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.defaults.pageSize);

              // close the facet
              await RecordsetLocators.getFacetHeaderButtonById(facet, index).click();
            });
          });
          break;
        case 'numeric':
        case 'date':
          await test.step('for range facet', async () => {
            const facet = RecordsetLocators.getFacetById(page, index);
            const rangeInputs = RecordsetLocators.getFacetRangeInputs(facet);
            await test.step('should open the facet, test validators, filter on a range, and update the search criteria.', async () => {
              await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets);
              await RecordsetLocators.getFacetHeaderButtonById(facet, index).click();

              // wait for facet to open
              await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();
              await expect.soft(rangeInputs.submit).toBeVisible();

              await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveCount(facetParams.listElems + 1);

              // wait for intial values to be set
              await expect.soft(rangeInputs.minInput).toHaveValue(facetParams.initialMin);
              await expect.soft(rangeInputs.maxInput).toHaveValue(facetParams.initialMax);

              // first clear the min and max
              await rangeInputs.minInput.fill('');
              await rangeInputs.maxInput.fill('');
              await expect.soft(rangeInputs.minInput).toHaveValue('');
              await expect.soft(rangeInputs.maxInput).toHaveValue('');

              // now send an invalid value for min
              await rangeInputs.minInput.fill(facetParams.invalid);

              const validationError = RecordsetLocators.getRangeInputValidationError(facet);
              await expect.soft(validationError).toBeVisible();
              await expect.soft(validationError).toHaveText(facetParams.error);

              // remove the invalid value so we can continue with the tests
              await rangeInputs.minInput.fill('');
              await expect.soft(rangeInputs.minInput).toHaveValue('');

              await page.waitForTimeout(10);

              // test min and max being set
              // define test params values
              await rangeInputs.minInput.fill(facetParams.range.min);
              await rangeInputs.maxInput.fill(facetParams.range.max);

              // let validation message disappear
              await expect.soft(validationError).not.toBeVisible();

              await expect.soft(rangeInputs.minInput).toHaveValue(facetParams.range.min);
              await expect.soft(rangeInputs.maxInput).toHaveValue(facetParams.range.max);
              await rangeInputs.submit.click();

              // wait for request to return
              await expect.soft(clearAll).toBeVisible();

              // wait for facet filters to load
              const facetFilters = RecordsetLocators.getFacetFilters(page);
              await expect.soft(facetFilters).toHaveCount(1);
              await expect.soft(facetFilters.nth(0)).toHaveText(facetParams.range.filter);

              await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(facetParams.range.numRows);

              await clearAll.click();
              await expect.soft(clearAll).not.toBeVisible();
              await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.defaults.pageSize);
              await expect.soft(rangeInputs.minInput).toHaveValue(facetParams.initialMin);
              await expect.soft(rangeInputs.maxInput).toHaveValue(facetParams.initialMax);

              // clear inputs
              await rangeInputs.minInput.fill('');
              await rangeInputs.maxInput.fill('');
              await expect.soft(rangeInputs.minInput).toHaveValue('');
              await expect.soft(rangeInputs.maxInput).toHaveValue('');
            });

            if (facetParams.notNullNumRows) {
              await test.step('should be able to filter not-null values.', async () => {
                const notNullOption = RecordsetLocators.getFacetOption(facet, 0);
                await notNullOption.check();

                // wait for table rows to load
                await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(facetParams.notNullNumRows)
                await expect.soft(rangeInputs.submit).toHaveAttribute('disabled');

                await clearAll.click();
                await expect.soft(clearAll).not.toBeVisible();
                await expect.soft(rangeInputs.minInput).toHaveValue(facetParams.initialMin);
                await expect.soft(rangeInputs.maxInput).toHaveValue(facetParams.initialMax);

                // make sure all checkboxes are cleared
                await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(0);

                // clear inputs
                await rangeInputs.minInput.fill('');
                await rangeInputs.maxInput.fill('');
                await expect.soft(rangeInputs.minInput).toHaveValue('');
                await expect.soft(rangeInputs.maxInput).toHaveValue('');
              });
            }

            await test.step('should filter on just a min value and update the search criteria.', async () => {
              // test just min being set
              await rangeInputs.minInput.fill(facetParams.justMin.min);
              await expect.soft(rangeInputs.minInput).toHaveValue(facetParams.justMin.min);

              // let validation message disappear
              await expect.soft(RecordsetLocators.getRangeInputValidationError(facet)).not.toBeVisible();
              await rangeInputs.submit.click();

              // wait for request to return
              await expect.soft(clearAll).toBeVisible();
              // wait for facet filters to load
              const facetFilters = RecordsetLocators.getFacetFilters(page);
              await expect.soft(facetFilters).toHaveCount(1);
              await expect.soft(facetFilters.nth(0)).toHaveText(facetParams.justMin.filter);

              await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(facetParams.justMin.numRows);

              await clearAll.click();
              await expect.soft(clearAll).not.toBeVisible();
              await expect.soft(rangeInputs.minInput).toHaveValue(facetParams.initialMin);
              await expect.soft(rangeInputs.maxInput).toHaveValue(facetParams.initialMax);

              await rangeInputs.minInput.fill('');
              await rangeInputs.maxInput.fill('');
              await expect.soft(rangeInputs.minInput).toHaveValue('');
              await expect.soft(rangeInputs.maxInput).toHaveValue('');
            });

            await test.step('should filter on just a max value and update the search criteria.', async () => {
              // test just max being set
              await rangeInputs.maxInput.fill(facetParams.justMax.max);
              await expect.soft(rangeInputs.maxInput).toHaveValue(facetParams.justMax.max);

              // let validation message disappear
              await expect.soft(RecordsetLocators.getRangeInputValidationError(facet)).not.toBeVisible();
              await rangeInputs.submit.click();

              // wait for request to return
              await expect.soft(clearAll).toBeVisible();

              // wait for facet filters to load
              const facetFilters = RecordsetLocators.getFacetFilters(page);
              await expect.soft(facetFilters).toHaveCount(1);
              await expect.soft(facetFilters.nth(0)).toHaveText(facetParams.justMax.filter);

              await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(facetParams.justMax.numRows);

              await clearAll.click();
              await expect.soft(clearAll).not.toBeVisible();
              await expect.soft(rangeInputs.minInput).toHaveValue(facetParams.initialMin);
              await expect.soft(rangeInputs.maxInput).toHaveValue(facetParams.initialMax);

              // close the facet
              await RecordsetLocators.getFacetHeaderButtonById(facet, index).click();
            });
          });

          break;
        case 'timestamp':
          await test.step('for timetamp range facet', async () => {
            const facet = RecordsetLocators.getFacetById(page, index);
            const rangeInputs = RecordsetLocators.getFacetRangeTimestampInputs(facet);
            await test.step('should open the facet, test validators, filter on a range, and update the search criteria.', async () => {
              await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets);
              await RecordsetLocators.getFacetHeaderButtonById(facet, index).click();

              // wait for facet to open
              await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();
              await expect.soft(rangeInputs.submit).toBeVisible();

              await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveCount(facetParams.listElems + 1)

              // wait for intial values to be set
              await expect.soft(rangeInputs.minDateInput).toHaveValue(facetParams.initialMin.date);
              await expect.soft(rangeInputs.maxDateInput).toHaveValue(facetParams.initialMax.date);
              await expect.soft(rangeInputs.minTimeInput).toHaveValue(facetParams.initialMin.time);
              await expect.soft(rangeInputs.maxTimeInput).toHaveValue(facetParams.initialMax.time);

              // test validator by clearing the date input
              await rangeInputs.minDateInput.fill('');
              await expect.soft(rangeInputs.minDateInput).toHaveValue('');

              const validationError = RecordsetLocators.getRangeInputValidationError(facet);
              await expect.soft(validationError).toBeVisible();
              await expect.soft(validationError).toHaveText(facetParams.error);

              // clear the inputs first so we can then change their values
              await rangeInputs.maxDateInput.fill('');
              await rangeInputs.minTimeInput.fill('');
              await rangeInputs.maxTimeInput.fill('');

              await expect.soft(rangeInputs.maxDateInput).toHaveValue('');
              await expect.soft(rangeInputs.minTimeInput).toHaveValue('');
              await expect.soft(rangeInputs.maxTimeInput).toHaveValue('');

              // test min and max being set
              // define test params values
              await rangeInputs.minDateInput.fill(facetParams.range.minDate);
              await rangeInputs.minTimeInput.fill(facetParams.range.minTime);
              await rangeInputs.maxDateInput.fill(facetParams.range.maxDate);
              await rangeInputs.maxTimeInput.fill(facetParams.range.maxTime);

              // let validation message disappear
              await expect.soft(RecordsetLocators.getRangeInputValidationError(facet)).not.toBeVisible();
              await rangeInputs.submit.click();
              // wait for request to return
              await expect.soft(clearAll).toBeVisible();

              // wait for facet filters to load
              const facetFilters = RecordsetLocators.getFacetFilters(page);
              await expect.soft(facetFilters).toHaveCount(1);
              await expect.soft(facetFilters.nth(0)).toHaveText(facetParams.range.filter);

              await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(facetParams.range.numRows);

              await clearAll.click();
              await expect.soft(clearAll).not.toBeVisible();
              await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.defaults.pageSize);

              // make sure all checkboxes are cleared
              await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(0);

              // clear the inputs
              await rangeInputs.minDateInput.fill('');
              await rangeInputs.maxDateInput.fill('');
              await rangeInputs.minTimeInput.fill('');
              await rangeInputs.maxTimeInput.fill('');
            });

            if (facetParams.notNullNumRows) {
              await test.step('should be able to filter not-null values.', async () => {
                const notNulloption = RecordsetLocators.getFacetOption(facet, 0);
                await notNulloption.check();

                // wait for table rows to load
                await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(facetParams.notNullNumRows)
                await expect.soft(rangeInputs.submit).toHaveAttribute('disabled');

                await clearAll.click();
                await expect.soft(clearAll).not.toBeVisible();
                await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.defaults.pageSize);

                // clear the inputs
                await rangeInputs.minDateInput.fill('');
                await rangeInputs.maxDateInput.fill('');
                await rangeInputs.minTimeInput.fill('');
                await rangeInputs.maxTimeInput.fill('');
              });
            }

            await test.step('should filter on just a min value and update the search criteria.', async () => {
              // test just min being set
              await rangeInputs.minDateInput.fill(facetParams.justMin.date);
              await rangeInputs.minTimeInput.fill(facetParams.justMin.time);

              await expect.soft(rangeInputs.minDateInput).toHaveValue(facetParams.justMin.date);
              await expect.soft(rangeInputs.minTimeInput).toHaveValue(facetParams.justMin.time);

              // let validation message disappear
              await expect.soft(RecordsetLocators.getRangeInputValidationError(facet)).not.toBeVisible();
              await rangeInputs.submit.click();

              // wait for request to return
              await expect.soft(clearAll).toBeVisible();
              // wait for facet filters to load
              const facetFilters = RecordsetLocators.getFacetFilters(page);
              await expect.soft(facetFilters).toHaveCount(1);
              await expect.soft(facetFilters.nth(0)).toHaveText(facetParams.justMin.filter);

              await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(facetParams.justMin.numRows);

              await clearAll.click();
              await expect.soft(clearAll).not.toBeVisible();
              await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.defaults.pageSize);

              // make sure all checkboxes are cleared
              await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(0);

              // clear the inputs
              await rangeInputs.minDateInput.fill('');
              await rangeInputs.maxDateInput.fill('');
              await rangeInputs.minTimeInput.fill('');
              await rangeInputs.maxTimeInput.fill('');
            });

            await test.step('should filter on just a max value and update the search criteria.', async () => {
              // test just max being set
              await rangeInputs.maxDateInput.fill(facetParams.justMax.date);
              await rangeInputs.maxTimeInput.fill(facetParams.justMax.time);

              await expect.soft(rangeInputs.maxDateInput).toHaveValue(facetParams.justMax.date);
              await expect.soft(rangeInputs.maxTimeInput).toHaveValue(facetParams.justMax.time);

              // let validation message disappear
              await expect.soft(RecordsetLocators.getRangeInputValidationError(facet)).not.toBeVisible();
              await rangeInputs.submit.click();

              // wait for request to return
              await expect.soft(clearAll).toBeVisible();
              // wait for facet filters to load
              const facetFilters = RecordsetLocators.getFacetFilters(page);
              await expect.soft(facetFilters).toHaveCount(1);
              await expect.soft(facetFilters.nth(0)).toHaveText(facetParams.justMax.filter);

              await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(facetParams.justMax.numRows);

              await clearAll.click();
              await expect.soft(clearAll).not.toBeVisible();
              await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.defaults.pageSize);

              // make sure all checkboxes are cleared
              await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(0);

              // close the facet
              await RecordsetLocators.getFacetHeaderButtonById(facet, index).click();
            });
          });

          break;
        case 'check_presence':
          await test.step('for check_presence facet', async () => {
            const facet = RecordsetLocators.getFacetById(page, index);
            await test.step('should open the facet and the two options should be available.', async () => {
              await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets);

              await openFacetAndTestFilterOptions(facet, index, ['All records with value', 'No value']);
            });

            await test.step('selecting the not-null option, should only show the applicable rows.', async () => {
              await testSelectFacetOption(page, index, 0, facetParams.notNullFilter, facetParams.notNullNumRows);
            });

            await test.step('selecting the null option, should only show the applicable rows.', async () => {
              await testSelectFacetOption(page, index, 1, facetParams.nullFilter, facetParams.nullNumRows);

              await RecordsetLocators.getFacetHeaderButtonById(facet, index).click();
            });
          });

          break;
        default:
          break;
      }
    });
  }
});