import { test, expect } from '@playwright/test';

// locators
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import {
  clearRangeInput, fillRangeInput, openFacet, openFacetAndTestFilterOptions,
  openRecordsetAndResetFacetState, testClearAllFilters, testDefaultRangePickerInitialValues,
  testRangeInputSubmitThenClear, testSelectFacetOption,
  testSelectFacetOptionThenClear, testTimestampRangePickerInitialValues
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
      invalid: '2013-MM-DD',
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
              // open facet
              await openFacetAndTestFilterOptions(page, facet, index, facetParams.options, 1)
              
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
                index, 
                facetParams.option, 
                facetParams.filter, 
                facetParams.numRows, 
                testParams.defaults.pageSize
              );

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
              await openFacet(page, facet, index, facetParams.listElems + 1, 1);
              
              // wait for facet to open              
              await expect.soft(rangeInputs.submit).toBeVisible();

              // wait for intial values to be set
              await testDefaultRangePickerInitialValues(rangeInputs, facetParams);

              // first clear the min and max
              await clearRangeInput(rangeInputs.minInput);
              await clearRangeInput(rangeInputs.maxInput);

              // now send an invalid value for min
              await fillRangeInput(rangeInputs.minInput, facetParams.invalid);

              const validationError = RecordsetLocators.getRangeInputValidationError(facet);
              await expect.soft(validationError).toBeVisible();
              await expect.soft(validationError).toHaveText(facetParams.error);

              // remove the invalid value so we can continue with the tests
              await clearRangeInput(rangeInputs.minInput);

              // test min and max being set
              // define test params values
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
                testParams.defaults.pageSize
              );
              await testDefaultRangePickerInitialValues(rangeInputs, facetParams);

              // clear inputs
              await clearRangeInput(rangeInputs.minInput);
              await clearRangeInput(rangeInputs.maxInput);
            });

            if (facetParams.notNullNumRows) {
              await test.step('should be able to filter not-null values.', async () => {
                await testSelectFacetOption(page, facet, 0, facetParams.notNullNumRows, 1);
                
                // make sure submit is disabled
                await expect.soft(rangeInputs.submit).toHaveAttribute('disabled');

                await testClearAllFilters(page, facet, 0, testParams.defaults.pageSize);
                await testDefaultRangePickerInitialValues(rangeInputs, facetParams);

                // clear inputs
                await clearRangeInput(rangeInputs.minInput);
                await clearRangeInput(rangeInputs.maxInput);
              });
            }

            await test.step('should filter on just a min value and update the search criteria.', async () => {
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
                testParams.defaults.pageSize
              );
              
              await testDefaultRangePickerInitialValues(rangeInputs, facetParams);

              await clearRangeInput(rangeInputs.minInput);
              await clearRangeInput(rangeInputs.maxInput);
            });

            await test.step('should filter on just a max value and update the search criteria.', async () => {
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
                testParams.defaults.pageSize
              );
              
              await testDefaultRangePickerInitialValues(rangeInputs, facetParams);

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
              await openFacet(page, facet, index, facetParams.listElems + 1, 1);
              
              // wait for facet to open
              await expect.soft(rangeInputs.submit).toBeVisible();

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
              // define test params values
              await fillRangeInput(rangeInputs.minDateInput, facetParams.range.minDate);
              await fillRangeInput(rangeInputs.maxDateInput, facetParams.range.maxDate);

              await fillRangeInput(rangeInputs.minTimeInput, facetParams.range.minTime);
              await fillRangeInput(rangeInputs.maxTimeInput, facetParams.range.maxTime);

              // let validation message disappear
              await expect.soft(RecordsetLocators.getRangeInputValidationError(facet)).not.toBeVisible();
              await testRangeInputSubmitThenClear(
                page,
                facet,
                rangeInputs.submit,
                facetParams.range.filter,
                facetParams.range.numRows,
                testParams.defaults.pageSize
              );

              await testTimestampRangePickerInitialValues(rangeInputs, facetParams);

              // clear the inputs
              await clearRangeInput(rangeInputs.minDateInput);
              await clearRangeInput(rangeInputs.maxDateInput);
              await clearRangeInput(rangeInputs.minTimeInput);
              await clearRangeInput(rangeInputs.maxTimeInput);
            });

            if (facetParams.notNullNumRows) {
              await test.step('should be able to filter not-null values.', async () => {
                await testSelectFacetOption(page, facet, 0, facetParams.notNullNumRows, 1);

                // make sure submit is disabled
                await expect.soft(rangeInputs.submit).toHaveAttribute('disabled');

                await testClearAllFilters(page, facet, 0, testParams.defaults.pageSize);
                await testTimestampRangePickerInitialValues(rangeInputs, facetParams);

                // clear the inputs
                await clearRangeInput(rangeInputs.minDateInput);
                await clearRangeInput(rangeInputs.maxDateInput);
                await clearRangeInput(rangeInputs.minTimeInput);
                await clearRangeInput(rangeInputs.maxTimeInput);
              });
            }

            await test.step('should filter on just a min value and update the search criteria.', async () => {
              // test just min being set
              await fillRangeInput(rangeInputs.minDateInput, facetParams.justMin.date);
              await fillRangeInput(rangeInputs.minTimeInput, facetParams.justMin.time);

              // let validation message disappear
              await expect.soft(RecordsetLocators.getRangeInputValidationError(facet)).not.toBeVisible();
              await testRangeInputSubmitThenClear(
                page,
                facet,
                rangeInputs.submit,
                facetParams.justMin.filter,
                facetParams.justMin.numRows,
                testParams.defaults.pageSize
              );

              await testTimestampRangePickerInitialValues(rangeInputs, facetParams);

              // clear the inputs
              await clearRangeInput(rangeInputs.minDateInput);
              await clearRangeInput(rangeInputs.maxDateInput);
              await clearRangeInput(rangeInputs.minTimeInput);
              await clearRangeInput(rangeInputs.maxTimeInput);
            });

            await test.step('should filter on just a max value and update the search criteria.', async () => {
              // test just max being set
              await fillRangeInput(rangeInputs.maxDateInput, facetParams.justMax.date);
              await fillRangeInput(rangeInputs.maxTimeInput, facetParams.justMax.time);

              // let validation message disappear
              await expect.soft(RecordsetLocators.getRangeInputValidationError(facet)).not.toBeVisible();
              await testRangeInputSubmitThenClear(
                page,
                facet,
                rangeInputs.submit,
                facetParams.justMax.filter,
                facetParams.justMax.numRows,
                testParams.defaults.pageSize
              );

              await testTimestampRangePickerInitialValues(rangeInputs, facetParams);

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

              await openFacetAndTestFilterOptions(page, facet, index, ['All records with value', 'No value'], 1);
            });

            await test.step('selecting the not-null option, should only show the applicable rows.', async () => {
              await testSelectFacetOptionThenClear(
                page, 
                index, 
                0, 
                facetParams.notNullFilter, 
                facetParams.notNullNumRows, 
                testParams.defaults.pageSize
              );
            });

            await test.step('selecting the null option, should only show the applicable rows.', async () => {
              await testSelectFacetOptionThenClear(
                page, 
                index, 
                1, 
                facetParams.nullFilter, 
                facetParams.nullNumRows, 
                testParams.defaults.pageSize
              );

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