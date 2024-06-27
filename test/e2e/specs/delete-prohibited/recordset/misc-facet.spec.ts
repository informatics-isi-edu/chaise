import { Locator, test, expect } from '@playwright/test';
import chance from 'chance';

// locators
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { testRecordMainSectionValues } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';
import { openFacet, openFacetAndTestFilterOptions, testFacetOptions } from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';

const testParams = {
  schema_name: 'faceting',
  table_name: 'main',
  filter_secondary_key: {
    facetIdx: 14,
    option: 0,
    selectedModalOption: 0,
    newModalOption: 2,
    totalNumOptions: 10,
    numRows: 10,
    numRowsAfterModal: 11,
    removingOptionsNumRowsAfterModal: 25
  },
  facet_order: [
    {
      title: 'facet with order and column_order false for scalar',
      facetIdx: 20,
      modalOptions: ['01', '02', '03', '04', '05', '06', '07'],
      sortable: false,
      modalOptionsSortedByScalar: [], // for type errors
      hideNumOccurrences: false,
      modalOptionsSortedByNumOfOccurences: ['07', '06', '05', '04', '03', '02', '01'],
      columnName: 'col_w_column_order_false'
    },
    {
      title: 'facet without order and hide_num_occurrences true',
      facetIdx: 21,
      modalOptions: ['01', '13', '12', '11', '10', '09', '08', '07', '06', '05', '04', '03', '02'],
      sortable: true,
      modalOptionsSortedByScalar: ['13', '12', '11', '10', '09', '08', '07', '06', '05', '04', '03', '02', '01'],
      hideNumOccurrences: true,
      modalOptionsSortedByNumOfOccurences: [],
      columnName: 'col_w_column_order'
    }
  ],
  not_null: {
    facetIdx: 5,
    result_num_w_not_null: 25,
    modal_available_options: 10,
    disabled_rows_w_not_null: 11,
    options_w_not_null: [
      'All records with value', 'No value', 'one', 'Empty', 'two', 'seven', 'eight', 'elevens', 'four', 'six', 'ten', 'three'
    ]
  },
  null_filter: {
    panel: {
      facetIdx: 5,
      totalNumOptions: 12,
      option: 1,
      numRows: 5
    },
    right_join: {
      firstFacet: {
        name: 'F3 Entity',
        idx: 16,
        totalNumOptions: 4,
        option: 1,
        numRows: 23
      },
      secondFacet: {
        name: 'F5',
        idx: 17,
        options: ['All records with value', 'one']
      }
    }
  },
  hide_row_count: {
    hidden: {
      facetIdx: 11,
      displayingText: 'Displaying all13records',
      numModalOptions: 13

    },
    shown: {
      facetIdx: 10,
      displayingText: 'Displaying all12of 12 records',
      numModalOptions: 12
    }
  },
  customFilter: {
    ermrestFilter: 'id=1;id=2;int_col::geq::20',
    ermrestFilterDisplayed: 'id=1; id=2; int_col::geq::20',
    numRows: 7,
    numRowsWFacet: 1,
    numRowsWOFilter: 1,
    facet: 0,
    totalNumOptions: 7,
    options: ['1', '2', '6', '7', '8', '9', '10'],
    optionsWOFilter: ['2', '1', '3', '4', '5', '6', '7', '8', '9', '10'],
    option: 1
  },
  customFacet: {
    cfacet: { 'displayname': 'Custom Facet Query', 'ermrest_path': 'id=1;id=2;id=3;id=14;id=15;id=16;id=17;id=18' },
    cfacetBlob: 'N4IgJglgzgDgNgQwJ4DsEFsCmIBcIDCArlAC4D26ABAGIIDGmJlAioZgE5IgA0IH67TKQD6MBCQAWuEBDABeAIwBuWXIBMK+QGZNigCy6FAVkMA2QwHZDADhABfIA',
    facet: 10,
    totalNumOptions: 3,
    option: 1,
    numRows: 8,
    numRowsWFacet: 3,
    numRowsWOCustomFacet: 10,
    options: ['No value', 'one', 'two'],
    optionsWOCustomFacet: ['No value', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
  },
  maximumLength: {
    facetIdx: 22,
    numRows: 25,
    filteredNumRows: 24,
    secondFacetIdx: 6,
    secondFacetOption: 7,
    secondFacetNumOptions: 10,
    option: 1
  },
  recordColumns: [
    'text_col', 'longtext_col', 'markdown_col', 'int_col', 'float_col', 'date_col', 'timestamp_col',
    'boolean_col', 'jsonb_col', 'fk_to_f1', 'to_name'
  ],
  recordValues: [
    'one',
    // eslint-disable-next-line max-len
    'lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod.',
    'one', '11', '11.1100', '2001-01-01', '2001-01-01 00:01:01',
    'true', JSON.stringify({ 'key': 'one' }, undefined, 2), 'one', // faceting_main_fk1
    'one' // faceting_main_fk2
  ],
  shared_path_prefix: {
    facetObject: {
      'and': [
        { 'sourcekey': 'outbound_to_f1', 'choices': [1, 2, 3, 4, 5, 6] },
        { 'sourcekey': 'outbound_to_f1_to_outbound1', 'choices': [3, 4] }
      ]
    },
    facetBlob: [
      'N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCOgC4BG60A+mSjQGYCMIANCFgBYoCWuSOPGZsATGwDMbACxsArGwBsAXQC+bZOmz4iJclTS16TZnQb7qUVh258BQqdLVqgA'
    ].join(''),
    numRows: 2,
    firstFacet: {
      index: 10,
      options: ['No value', 'one', 'two', 'three', 'four', 'five', 'six'],
      modalOptions: ['three', 'four']
    },
    secondFacet: {
      index: 19,
      options: ['three (o1)', 'four (o1)', 'one (o1)', 'six (o1)'],
      modalOptions: ['1', '3', '4', '6']
    }
  },
  unsupported_filters_error: {
    facetObject: {
      'and': [
        // will be ignored because of invalid sourcekey name
        {
          'sourcekey': 'some_invalid_key',
          'markdown_name': 'Facet 1',
          'choices': ['1', '2']
        },
        // will be ignored because it's ending in f4 table not f5:
        {
          'sourcekey': 'path_to_f4_scalar_w_id',
          'markdown_name': 'from_name',
          'source_domain': {
            'schema': 'faceting',
            'table': 'f5'
          },
          'choices': ['3', '4']
        },
        // partially will be ignored
        {
          'sourcekey': 'outbound_to_f1',
          'markdown_name': 'F1',
          'source_domain': {
            'schema': 'faceting',
            'table': 'f1',
            'column': 'term'
          },
          'choices': ['one', 'missing data', 'two', 'three', 'four', 'more missing data']
        }
      ]
    },
    facetBlob: [
      'N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCKgLY4D6AlhAG5gA21UlBxANCGWBnlCgDuEShDAUSAMTC4ALg',
      'AIAjCC5YAFimq4kceCGVcATCAC6AXw7J02fERIAHMLLWVZKSgDMALJSRYmvJSCNDBcPHwCwqLiOCQeGChk0',
      'RJcqJi4lAI8tHDI6jg8cTI4srQA5iogsmAARoyxsCAeAKwgFiDqmtq6IADMlV6mFlbptsSN6LI16NCu7h4G',
      '3Lz8QiJiEo2Si2k2mYlgObB5agVgRXLlldV1DU2LWCiMaGQQJLI4GGRtqhpaODoIEAoCCxMLUJBIcryKBOM',
      '5cWSCFBXNQYHCgprWSpkFCo+RkcGQiBlaGwobmIA'
    ].join(''),
    errorTitle: 'Unsupported Filters',
    errorMessage: [
      'Some (or all) externally supplied filter criteria cannot be implemented with the current catalog content. ',
      'This may be due to lack of permissions or changes made to the content since the criteria were initially saved. ',
      'Discarded facets: Facet 1, from_name ',
      'Facets with some discarded choices: F1',
      'Click OK to continue with the subset of filter criteria which are supported at this time.',
      'Show Error Details'
    ].join(''),
    errorDetails: [
      'Discarded facets:\n\n- Facet 1 (2 choices):\n  - 1\n  - 2\n- from_name (2 choices):\n  - 3\n  - 4\n\n\n',
      'Partially discarded facets:\n\n- F1 (2/6 choices):\n  - missing data\n  - more missing data'
    ].join(''),
    facetBlobAfterOK: [
      'N4IghgdgJiBcDaoDOB7ArgJwMYFM6JHQBcAjdafEAMzFyIEsIBzEAGhAFsxGB9KgawCMIALoBfdvRgj2WABYp6uJPgAsrQawDMrAEzjxQA'
    ].join(''),
    numRows: 22
  },
  hide_selected_items: {
    // not used and only added here so we know what the blob represents
    facetObject: {
      'and': [
        { 'source': 'id', 'choices': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
        { 'source': 'text_col', 'choices': ['one', 'two'] }
      ]
    },
    // eslint-disable-next-line max-len
    facetBlob: 'N4IghgdgJiBcDaoDOB7ArgJwMYFM4gEsYAaELACxQNyTngEZiAmYgZmIBZiBWYgNmIB2YgA5iATmL0ADFMb0mAXQC+xZOmx5YIAC44AHjoD6WFABsQpClRp0QKCHlI6A7ihAqVQA',
    numRows: 10,
    firstFacet: {
      index: 0,
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      optionsAfterFirstChange: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
      optionsAfterFinalChange: ['4', '5', '6', '7', '8', '9', '10', '11', '12', '1'],
    },
    secondFacet: {
      index: 5,
      selectedOption: 2,
      options: ['All records with value', 'No value', 'one', 'two', 'four', 'three']
    }
  },
  hideFilterPanelClass: 'chaise-sidebar-close',
  showFilterPanelClass: 'chaise-sidebar-open',
  foreignKeyPopupFacetFilter: 'termeight',
  associationRTName: 'main_f3_assoc',
  associationPopupFacetFilter: 'termfive',
  associationPopupSelectedRowsFilter: 'five'
};

test.describe('Other facet features', () => {
  test.describe.configure({ mode: 'parallel' });

  test('selecting entity facet that is not on the shortest key.', async ({ page, baseURL }, testInfo) => {
    const facet = RecordsetLocators.getFacetById(page, testParams.filter_secondary_key.facetIdx);
    const modal = ModalLocators.getRecordsetSearchPopup(page);

    await test.step('should load recordset page and clear all filters', async () => {
      const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

      await page.goto(`${baseURL}${PAGE_URL}`);
      await RecordsetLocators.waitForRecordsetPageReady(page);

      const clearAll = RecordsetLocators.getClearAllFilters(page);
      await clearAll.click();
      await expect.soft(clearAll).not.toBeVisible();

      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(25);
    });

    await test.step('Side panel should hide/show by clicking pull button', async () => {
      const recPan = RecordsetLocators.getSidePanel(page),
        showPanelBtn = RecordsetLocators.getShowFilterPanelBtn(page),
        hidePanelBtn = RecordsetLocators.getHideFilterPanelBtn(page);

      await expect.soft(hidePanelBtn).toBeVisible();
      // regular expression to test "contains"
      await expect.soft(recPan).toHaveAttribute('class', /open-panel/);

      await hidePanelBtn.click();
      await expect.soft(showPanelBtn).toBeVisible();
      // regular expression to test "contains"
      await expect.soft(recPan).toHaveAttribute('class', /close-panel/);

      await showPanelBtn.click();
    });

    await test.step('should open the facet, select a value to filter on.', async () => {
      await RecordsetLocators.getFacetHeaderButtonById(facet, testParams.filter_secondary_key.facetIdx).click();

      // wait for facet to open
      await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();
      // wait for facet checkboxes to load
      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveCount(testParams.filter_secondary_key.totalNumOptions);
      // wait for list to be fully visible
      await expect.soft(RecordsetLocators.getList(facet)).toBeVisible();

      await RecordsetLocators.getFacetOption(facet, testParams.filter_secondary_key.option).click();

      // wait for request to return
      await expect.soft(RecordsetLocators.getClearAllFilters(page)).toBeVisible();
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.filter_secondary_key.numRows);
    });

    await test.step('the selected value should be selected on the modal.', async () => {
      await RecordsetLocators.getShowMore(facet).click();
      await expect.soft(RecordsetLocators.getRows(modal)).toHaveCount(12);

      await expect.soft(RecordsetLocators.getCheckedCheckboxInputs(modal)).toHaveCount(1);
      await expect.soft(RecordsetLocators.getCheckboxInputs(modal).nth(testParams.filter_secondary_key.selectedModalOption)).toBeChecked();
    });

    await test.step('selecting new values on the modal and submitting them, should change the filters on submit.', async () => {
      await RecordsetLocators.getCheckboxInputs(modal).nth(testParams.filter_secondary_key.newModalOption).check();

      const submit = ModalLocators.getSubmitButton(modal);
      await expect.soft(submit).toHaveText('Submit');
      await submit.click();

      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.filter_secondary_key.numRowsAfterModal);
      await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(2);
    });

    await test.step('removing values in the modal should allow for submitting to remove the set of selected options for that facet.', async () => {
      await RecordsetLocators.getShowMore(facet).click();
      await expect.soft(RecordsetLocators.getCheckedCheckboxInputs(modal)).toHaveCount(2);

      // clear selections in modal to remove selections in facet
      await RecordsetLocators.getClearSelectedRows(modal).click();
      await expect.soft(RecordsetLocators.getCheckedCheckboxInputs(modal)).toHaveCount(0);

      await ModalLocators.getSubmitButton(modal).click();
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.filter_secondary_key.removingOptionsNumRowsAfterModal);
      await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(0);
    });
  });

  test('facet modal rows and columns', async ({ page, baseURL }, testInfo) => {
    await test.step('should load recordset page and clear all filters', async () => {
      const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

      await page.goto(`${baseURL}${PAGE_URL}`);
      await RecordsetLocators.waitForRecordsetPageReady(page);

      const clearAll = RecordsetLocators.getClearAllFilters(page);
      await clearAll.click();
      await expect.soft(clearAll).not.toBeVisible();

      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(25);
    });

    for (const params of testParams.facet_order) {
      const facet = RecordsetLocators.getFacetById(page, params.facetIdx);
      const modal = ModalLocators.getRecordsetSearchPopup(page);

      await test.step('the rows in the modal should honor the given order.', async () => {
        await RecordsetLocators.getFacetHeaderButtonById(facet, params.facetIdx).click();

        // wait for facet to open
        await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();

        // click on show more
        await RecordsetLocators.getShowMore(facet).click();
        const columnValues = RecordsetLocators.getFirstColumn(modal);
        await expect.soft(columnValues).toHaveCount(params.modalOptions.length);

        await expect.soft(columnValues).toHaveText(params.modalOptions);
      });

      if (!params.sortable) {
        await test.step('the facet column sort option should not be available.', async () => {
          await expect(RecordsetLocators.getColumnSortButton(modal, '0')).not.toBeAttached();
        });
      } else {
        await test.step('users should be able to change the sort to be based on the scalar column.', async () => {
          const sortBtn = RecordsetLocators.getColumnSortButton(modal, '0');
          await expect.soft(sortBtn).toBeVisible();

          await sortBtn.click();
          await RecordsetLocators.waitForRecordsetPageReady(modal);

          const columnValues = RecordsetLocators.getFirstColumn(modal);
          await expect.soft(columnValues).toHaveText(params.modalOptionsSortedByScalar);
        });
      }

      await test.step(`number of Occurrences column should be ${params.hideNumOccurrences ? 'hidden' : 'available'}.`, async () => {
        const columns = RecordsetLocators.getColumnNames(modal);

        await expect.soft(columns).toHaveCount(params.hideNumOccurrences ? 1 : 2);
        await expect.soft(columns.nth(0)).toHaveText(params.columnName);
        if (!params.hideNumOccurrences) {
          await expect.soft(columns.nth(1)).toHaveText('Number of Occurrences');
        }

      });

      if (!params.hideNumOccurrences) {
        await test.step('numer of Occurrences column should be available and users should be able to sort based on that.', async () => {
          const sortBtn = RecordsetLocators.getColumnSortButton(modal, 'count');
          await expect.soft(sortBtn).toBeVisible();

          await sortBtn.click();
          await RecordsetLocators.waitForRecordsetPageReady(modal);

          const columnValues = RecordsetLocators.getFirstColumn(modal);
          await expect.soft(columnValues).toHaveCount(params.modalOptionsSortedByNumOfOccurences.length);
          await expect.soft(columnValues).toHaveText(params.modalOptionsSortedByNumOfOccurences);
        });
      }

      await test.step('should close the facet modal', async () => {
        await ModalLocators.getCloseBtn(modal).click();
      });
    }
  });

  test('Records With Value (not-null) filter', async ({ page, baseURL }, testInfo) => {
    const facet = RecordsetLocators.getFacetById(page, testParams.not_null.facetIdx);

    await test.step('should load recordset page and clear all filters', async () => {
      const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

      await page.goto(`${baseURL}${PAGE_URL}`);
      await RecordsetLocators.waitForRecordsetPageReady(page);

      const clearAll = RecordsetLocators.getClearAllFilters(page);
      await clearAll.click();
      await expect.soft(clearAll).not.toBeVisible();

      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(25);
    });

    await test.step('`All Records with value` option must be available in facet panel.', async () => {
      await RecordsetLocators.getFacetHeaderButtonById(facet, testParams.not_null.facetIdx).click();
      await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();

      // make sure facet is loaded
      const facetOptions = RecordsetLocators.getFacetOptions(facet);
      await expect.soft(facetOptions).toHaveCount(12);
      await expect.soft(facetOptions).toHaveText(testParams.not_null.options_w_not_null);
    });

    await test.step('After clicking on `All records with value`, the rest of options must be disabled', async () => {
      await RecordsetLocators.getFacetOption(facet, 0).check();

      await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(1)

      // same check as previous test to make sure displayed options don't change
      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveText(testParams.not_null.options_w_not_null);

      await expect.soft(RecordsetLocators.getDisabledFacetOptions(facet)).toHaveCount(testParams.not_null.disabled_rows_w_not_null);
      await expect(RecordsetLocators.getRows(page)).toHaveCount(testParams.not_null.result_num_w_not_null);
    });

    await test.step('Deselecting `All records with value` should enable all the values on the list.', async () => {
      await RecordsetLocators.getFacetOption(facet, 0).uncheck();

      // same check as previous 2 tests to make sure displayed options don't change again
      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveText(testParams.not_null.options_w_not_null);

      await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(0);
      await expect.soft(RecordsetLocators.getDisabledFacetOptions(facet)).toHaveCount(0);
    });

    await test.step('should be able to select other filters on the facet.', async () => {
      await RecordsetLocators.getFacetOption(facet, 1).click();

      // same check as previous 3 tests to make sure displayed options don't change again
      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveText(testParams.not_null.options_w_not_null);

      await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(1);
      await expect.soft(RecordsetLocators.getDisabledFacetOptions(facet)).toHaveCount(0);
    });

    await test.step('Selecting `All records with value` in the list, should remove all the checked filters on facet.', async () => {
      await RecordsetLocators.getFacetOption(facet, 0).check();

      // same check as previous 4 tests to make sure displayed options don't change again
      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveText(testParams.not_null.options_w_not_null);

      await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(1);
      await expect.soft(RecordsetLocators.getDisabledFacetOptions(facet)).toHaveCount(testParams.not_null.disabled_rows_w_not_null);
    });
  });

  test('No value (null) filter', async ({ page, baseURL }, testInfo) => {
    await test.step('should load recordset page and clear all filters', async () => {
      const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

      await page.goto(`${baseURL}${PAGE_URL}`);
      await RecordsetLocators.waitForRecordsetPageReady(page);

      const clearAll = RecordsetLocators.getClearAllFilters(page);
      await clearAll.click();
      await expect.soft(clearAll).not.toBeVisible();

      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(25);
    });

    await test.step('null should be provided as an option and user should be able to select it.', async () => {
      const params = testParams.null_filter.panel;
      const facet = RecordsetLocators.getFacetById(page, params.facetIdx);

      await RecordsetLocators.getFacetHeaderButtonById(facet, params.facetIdx).click();
      await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();
      // wait for facet checkboxes to load
      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveCount(params.totalNumOptions);

      await RecordsetLocators.getFacetOption(facet, params.option).click();
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.numRows);


      // clear the selected facet
      const clearAll = RecordsetLocators.getClearAllFilters(page);
      await clearAll.click();
      await expect.soft(clearAll).not.toBeVisible();

      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(25);
    });

    await test.step('regarding facets that require right join', async () => {
      const params = testParams.null_filter.right_join;

      await test.step('null should be provided as an option and user should be able to select it.', async () => {
        const facet = RecordsetLocators.getFacetById(page, params.firstFacet.idx);
        await RecordsetLocators.getFacetHeaderButtonById(facet, params.firstFacet.idx).click();

        await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();
        // wait for facet checkboxes to load
        await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveCount(params.firstFacet.totalNumOptions);

        await RecordsetLocators.getFacetOption(facet, params.firstFacet.option).check();
        await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.firstFacet.numRows);
      });

      await test.step('after selecting one, other such facets should not provide null option.', async () => {
        const facet = RecordsetLocators.getFacetById(page, params.secondFacet.idx);
        await openFacetAndTestFilterOptions(
          page,
          facet,
          params.secondFacet.idx,
          params.secondFacet.options,
          6 // 6 open facets
        );
      });
    });
  });

  /***********************************************************  local test cases ***********************************************************/
  if (process.env.CI) return;
  // NOTE the following test cases will only run locally.

  test('regarding the logic to show only certain number of selected items', async ({ page, baseURL }, testInfo) => {
    const params = testParams.hide_selected_items;
    const facet1 = RecordsetLocators.getFacetById(page, params.firstFacet.index);
    const facet2 = RecordsetLocators.getFacetById(page, params.secondFacet.index);

    await test.step('should load recordset page', async () => {
      const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

      await page.goto(`${baseURL}${PAGE_URL}/*::facets::${params.facetBlob}`);
      await RecordsetLocators.waitForRecordsetPageReady(page);
    });

    await test.step('facet panel should only show limited number of selected facet options.', async () => {
      // wait for facet to open
      await expect.soft(RecordsetLocators.getFacetCollapse(facet1)).toBeVisible();
      // wait for list to be fully visible
      await expect.soft(RecordsetLocators.getList(facet1)).toBeVisible();
      // wait for facet checkboxes to load
      await expect.soft(RecordsetLocators.getFacetOptions(facet1)).toHaveText(params.firstFacet.options);

      // make sure all are selected
      await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet1)).toHaveCount(params.firstFacet.options.length)

      // make sure the text is visible
      await expect.soft(RecordsetLocators.getFacetMoreFiltersText(facet1)).toHaveText('2 selected items not displayed.');
    });

    await test.step('interacting with other facet should rearrange the options and update the message.', async () => {
      // deselect the first option in the first facet
      await expect.soft(RecordsetLocators.getFacetSpinner(facet1)).not.toBeVisible();
      await RecordsetLocators.getFacetOption(facet1, 0).uncheck();
      // wait for list to be fully visible
      await expect.soft(RecordsetLocators.getList(facet2)).toBeVisible();

      // in the second facet, deselect third option (first two are not-null and null)
      await expect.soft(RecordsetLocators.getFacetSpinner(facet2)).not.toBeVisible();
      await RecordsetLocators.getFacetOption(facet2, params.secondFacet.selectedOption).uncheck();
      // wait for facet checkboxes to load for the first facet
      await expect.soft(RecordsetLocators.getFacetOptions(facet1)).toHaveText(params.firstFacet.optionsAfterFirstChange);

      // make sure all are selected
      await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet1)).toHaveCount(params.firstFacet.optionsAfterFirstChange.length);
      // make sure the text is updated
      await expect.soft(RecordsetLocators.getFacetMoreFiltersText(facet1)).toHaveText('1 selected items not displayed.');
    });

    await test.step('going below the limit should remove the message.', async () => {
      // deselect first and second options in the first facet so we go below the limit
      await expect.soft(RecordsetLocators.getFacetSpinner(facet1)).not.toBeVisible();
      await RecordsetLocators.getFacetOption(facet1, 0).uncheck();

      await expect.soft(RecordsetLocators.getFacetSpinner(facet1)).not.toBeVisible();
      await RecordsetLocators.getFacetOption(facet1, 1).uncheck();

      // in the second facet, deselect third option (first two are not-null and null)
      await expect.soft(RecordsetLocators.getFacetSpinner(facet2)).not.toBeVisible();
      await RecordsetLocators.getFacetOption(facet2, params.secondFacet.selectedOption).uncheck();

      // wait for facet checkboxes to load
      await expect.soft(RecordsetLocators.getFacetOptions(facet1)).toHaveText(params.firstFacet.optionsAfterFinalChange);

      // make sure the text has disapeared
      await expect.soft(RecordsetLocators.getFacetMoreFiltersText(facet1)).not.toBeVisible();
    });
  });

  test('regarding facets with shared path', async ({ page, baseURL }, testInfo) => {
    const params = testParams.shared_path_prefix;

    await test.step('should load recordset page', async () => {
      const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

      await page.goto(`${baseURL}${PAGE_URL}/*::facets::${params.facetBlob}`);
      await RecordsetLocators.waitForRecordsetPageReady(page);

      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.numRows);
    });

    await test.step('for the facet with subset path', async () => {
      await testFacetOptions(
        page,
        params.firstFacet.index,
        params.firstFacet.options,
        params.firstFacet.modalOptions
      );
    });

    await test.step('for the facet with superset path', async () => {
      await testFacetOptions(
        page,
        params.secondFacet.index,
        params.secondFacet.options,
        params.secondFacet.modalOptions
      );
    });
  });

  test('regarding UnsupportedFilters handling', async ({ page, baseURL }, testInfo) => {
    const params = testParams.unsupported_filters_error;
    const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;
    const modal = ModalLocators.getErrorModal(page);

    await test.step('should load recordset page', async () => {
      await page.goto(`${baseURL}${PAGE_URL}/*::facets::${params.facetBlob}`);
      await expect.soft(modal).toBeVisible();
    });

    await test.step('Proper error should be displayed', async () => {
      await expect.soft(ModalLocators.getModalTitle(modal)).toHaveText('Unsupported Filters');
    });

    await test.step('Error modal message must summarize the issue', async () => {
      await expect.soft(ModalLocators.getModalText(modal)).toHaveText(params.errorMessage);
    });

    await test.step('Error modal should Show Error Details', async () => {
      const showDetails = ModalLocators.getToggleErrorDetailsButton(modal);
      const errorDetails = ModalLocators.getErrorDetails(modal);

      await showDetails.click()
      await expect.soft(errorDetails).toBeVisible();

      await expect.soft(showDetails).toHaveText('Hide Error Details');
      await expect.soft(errorDetails).toHaveText(params.errorDetails);
    });

    await test.step('On click of OK button the page should dismiss the error and show proper results', async () => {
      // close show details message so OK button is in the viewport again (modal doesn't have a scrollbar when it's expanded below viewport)
      await ModalLocators.getToggleErrorDetailsButton(modal).click();
      await ModalLocators.getOkButton(modal).click();

      // make sure it's showing proper number of values
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.numRows);

      // @sort(RID) gets appended by the app
      const newURL = `${baseURL}${PAGE_URL}/*::facets::${params.facetBlobAfterOK}@sort(RID)`;
      await expect.soft(page).toHaveURL(newURL);
    });
  });

  test('regarding hide_row_count support in entity facet popups', async ({ page, baseURL }, testInfo) => {
    await test.step('should load recordset page and clear all filters', async () => {
      const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

      await page.goto(`${baseURL}${PAGE_URL}`);
      await RecordsetLocators.waitForRecordsetPageReady(page);

      const clearAll = RecordsetLocators.getClearAllFilters(page);
      await clearAll.click();
      await expect.soft(clearAll).not.toBeVisible();

      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(25);
    });

    await test.step('should hide the total count when hide_row_count=true', async () => {
      const params = testParams.hide_row_count.hidden;
      const facet = RecordsetLocators.getFacetById(page, params.facetIdx);
      const modal = ModalLocators.getRecordsetSearchPopup(page);

      // facet is already open so we don't have to click to open
      await RecordsetLocators.getShowMore(facet).click();
      await RecordsetLocators.waitForRecordsetPageReady(modal);

      await expect.soft(RecordsetLocators.getFirstColumn(modal)).toHaveCount(params.numModalOptions);
      await expect.soft(RecordsetLocators.getTotalCount(modal)).toHaveText(params.displayingText);

      await ModalLocators.getCloseBtn(modal).click();
    });

    await test.step('otherwise should show the total count', async () => {
      const params = testParams.hide_row_count.shown;
      const facet = RecordsetLocators.getFacetById(page, params.facetIdx);
      const modal = ModalLocators.getRecordsetSearchPopup(page);

      // open the facet first and then open the modal
      await RecordsetLocators.getFacetHeaderButtonById(facet, params.facetIdx).click();
      await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();

      await RecordsetLocators.getShowMore(facet).click();
      await RecordsetLocators.waitForRecordsetPageReady(modal);

      await expect.soft(RecordsetLocators.getFirstColumn(modal)).toHaveCount(params.numModalOptions);
      await expect.soft(RecordsetLocators.getTotalCount(modal)).toHaveText(params.displayingText);

      await ModalLocators.getCloseBtn(modal).click();
    });
  });

  test('navigating to recordset with filters that faceting doesn\'t support', async ({ page, baseURL }, testInfo) => {
    const params = testParams.customFilter;
    const facet = RecordsetLocators.getFacetById(page, params.facet);

    await test.step('should load recordset page', async () => {
      const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

      await page.goto(`${baseURL}${PAGE_URL}/${params.ermrestFilter}`);
      await RecordsetLocators.waitForRecordsetPageReady(page);
    });

    await test.step('should show the applied filter and clear all button.', async () => {
      const facetFilters = RecordsetLocators.getFacetFilters(page);
      await expect.soft(facetFilters).toHaveCount(1);

      await expect.soft(facetFilters.nth(0)).toHaveText(`Custom Filter${params.ermrestFilterDisplayed}`)

      await expect.soft(RecordsetLocators.getClearAllFilters(page)).toBeVisible();
    });

    await test.step('main and faceting data should be based on the filter, and be able to apply new filters.', async () => {
      // main
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.numRows);

      await RecordsetLocators.getFacetHeaderButtonById(facet, params.facet).click();
      await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();

      // wait for facet checkboxes to load
      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveCount(params.totalNumOptions);
      // wait for list to be fully visible
      await expect.soft(RecordsetLocators.getList(facet)).toBeVisible();

      /**
       * NOTE: this was getFacetOptionsText in protractor because for some reason the .getText started returning empty
       *   value for the rows that are hidden because of the height logic
       * 
       * This doesn't seem to be an issue anymore but leaving this comment in case this fails randomly later
       */
      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveText(params.options);

      // select a new facet
      await RecordsetLocators.getFacetOption(facet, params.option).check();

      // wait for table rows to load
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.numRowsWFacet);

      // make sure filter is there
      await expect.soft(RecordsetLocators.getFacetFilters(page)).toHaveCount(2);
    });

    await test.step('clicking on `x` for Custom Filter should only clear the filter.', async () => {
      const customFiltersBtn = RecordsetLocators.getClearCustomFilters(page);
      await expect.soft(customFiltersBtn).toBeVisible();
      await customFiltersBtn.click();

      await RecordsetLocators.waitForRecordsetPageReady(page);
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.numRowsWOFilter);

      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveCount(params.optionsWOFilter.length);

      /**
       * NOTE: this was getFacetOptionsText in protractor because for some reason the .getText started returning empty
       *   value for the rows that are hidden because of the height logic
       * 
       * This doesn't seem to be an issue anymore but leaving this comment in case this fails randomly later
       */
      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveText(params.optionsWOFilter);
    });
  });

  test('regarding URL limitation check', async ({ page, baseURL }, testInfo) => {
    const params = testParams.maximumLength;
    const alert = AlertLocators.getWarningAlert(page);
    const facet1 = RecordsetLocators.getFacetById(page, params.facetIdx);

    const checkAlert = async (alert: Locator) => {
      await expect.soft(alert).toBeVisible();
      await expect.soft(alert).toHaveText('WarningMaximum URL length reached. Cannot perform the requested action.');
    };

    await test.step('should load recordset page, clear all filters, and close the open facets', async () => {
      const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

      await page.goto(`${baseURL}${PAGE_URL}`);
      await RecordsetLocators.waitForRecordsetPageReady(page);

      const clearAll = RecordsetLocators.getClearAllFilters(page);
      await clearAll.click();
      await expect.soft(clearAll).not.toBeVisible();

      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(25);

      const facet1 = RecordsetLocators.getFacetById(page, 0);
      await RecordsetLocators.getFacetHeaderButtonById(facet1, 0).click();

      const facet2 = RecordsetLocators.getFacetById(page, 2);
      await RecordsetLocators.getFacetHeaderButtonById(facet2, 2).click();
    });

    await test.step('searching a lenghty string should show the `Maximum URL length reached` warning.', async () => {
      const mainSearch = RecordsetLocators.getMainSearchInput(page);
      
      const chanceObj = new chance();
      await mainSearch.fill(chanceObj.string({length: 4000}));
      await RecordsetLocators.waitForRecordsetPageReady(page);
      
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.numRows);
      await checkAlert(alert);
    });

    await test.step('in facet modal', async () => {
      const modal = ModalLocators.getRecordsetSearchPopup(page);
      const modalAlert = AlertLocators.getWarningAlert(modal);
      const modalSubmit = ModalLocators.getSubmitButton(modal);

      await test.step('open the facet then open the show more modal', async () => {
        await RecordsetLocators.getFacetHeaderButtonById(facet1, params.facetIdx).click();
        await expect.soft(RecordsetLocators.getFacetCollapse(facet1)).toBeVisible();

        await RecordsetLocators.getShowMore(facet1).click();
        await RecordsetLocators.waitForRecordsetPageReady(modal);
      });

      await test.step('after opening the modal, the existing url limit alert should be removed.', async () => {
        await expect.soft(modalAlert).not.toBeAttached();
      });
      
      await test.step('alert should be displayed upon reaching the URL limit and submit button should be disabled.', async () => {
        await expect.soft(RecordsetLocators.getRows(modal)).toHaveCount(25);

        await RecordsetLocators.getSelectAllBtn(modal).click();
        await checkAlert(modalAlert);

        await expect.soft(modalSubmit).toHaveAttribute('disabled');
      });

      await test.step('changing filters and going below the URL limit should hide the alert and enable the submit button.', async () => {
        await RecordsetLocators.getCheckboxInputs(modal).nth(0).uncheck();

        await expect.soft(modalAlert).not.toBeAttached();
        await expect.soft(modalSubmit).not.toHaveAttribute('disabled');
        
        await modalSubmit.click();
        await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.filteredNumRows);
      });
    });

    await test.step('in main container', async () => {
      const secondFacetIdx = params.secondFacetIdx;
      const facet2 = RecordsetLocators.getFacetById(page, params.secondFacetIdx);

      await test.step('alert should be displayed upon reaching the URL limit and the request should not be completed.', async () => {
        await openFacet(page, facet2, secondFacetIdx, params.secondFacetNumOptions, 5);

        const facetOption = RecordsetLocators.getFacetOption(facet2, params.secondFacetOption);
        // trying to "click" this option will result in the alert being shown and the checkbox NOT being checked
        //   using .click() since .check() verifies the state of the checkbox has changed and we don't allow the state to change
        await facetOption.click();
        await checkAlert(alert);
        await expect.soft(facetOption).not.toBeChecked();
      });

      await test.step('changing filters and going below the URL limit should hide the alert.', async () => {
        await RecordsetLocators.getFacetOption(facet1, params.option).uncheck();
        await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.maximumLength.filteredNumRows - 1);
          
        await expect.soft(alert).not.toBeAttached();
      });
    });
  });

  test.describe('navigating to record and recordedit app with facets', () => {
    test('from recordset app with multiple records', async ({ page, baseURL }, testInfo) => {
      await test.step('should load recordset page and clear all filters', async () => {
        const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

        await page.goto(`${baseURL}${PAGE_URL}`);
        await RecordsetLocators.waitForRecordsetPageReady(page);
  
        const clearAll = RecordsetLocators.getClearAllFilters(page);
        await clearAll.click();
        await expect.soft(clearAll).not.toBeVisible();
  
        await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(25);
      });

      await test.step('clicking bulk edit should show the same number of forms in RE as rows in RS.', async () => {
        await RecordsetLocators.getBulkEditLink(page).click();
        await RecordeditLocators.waitForRecordeditPageReady(page);
        
        await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(25);
      });
    });

    test('in recordedit app, foreign key popup should have facets available', async ({ page, baseURL }, testInfo) => {
      const modal = ModalLocators.getRecordsetSearchPopup(page);

      await test.step('should load recordset page, wait for `facets` to be added to the url, and change to recordedit app', async () => {
        const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

        await page.goto(`${baseURL}${PAGE_URL}`);
        await RecordsetLocators.waitForRecordsetPageReady(page);
        await expect.soft(RecordsetLocators.getClearAllFilters(page)).toBeVisible();

        await expect.soft(page).toHaveURL(/facets/);

        const url = page.url();
        await page.goto(url.replace('recordset', 'recordedit'));
        await RecordeditLocators.waitForRecordeditPageReady(page);
      });

      await test.step('should click the foreign key popup button and have the facet collapse button visible in search popup', async () => {
        await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(1);

        // open the first fk popup
        await RecordeditLocators.getModalPopupButtons(page).nth(0).click();

        await expect.soft(ModalLocators.getModalTitle(modal)).toBeVisible();
        await expect.soft(RecordsetLocators.getRows(modal)).toHaveCount(13);

        // make sure side bar is hidden
        await expect.soft(RecordsetLocators.getSidePanel(modal)).not.toBeVisible();
        // make sure 'show' filter panel button is shown
        await expect.soft(RecordsetLocators.getShowFilterPanelBtn(modal)).toBeVisible();
      });

      // NOTE: identical to a test below
      await test.step('clicking the side panel button should open the facet panel', async () => {
        await RecordsetLocators.getShowFilterPanelBtn(modal).click();

        // make sure side bar is shown
        await expect.soft(RecordsetLocators.getSidePanel(modal)).toBeVisible();
        // make sure 'hide' filter panel button is shown 
        await expect.soft(RecordsetLocators.getHideFilterPanelBtn(modal)).toBeVisible();
      });

      await test.step('select a facet option and select a row for the input', async () => {
        const facet = RecordsetLocators.getFacetById(modal, 0);
        await RecordsetLocators.getFacetOption(facet, 0).click();

        await expect.soft(RecordsetLocators.getRows(modal)).toHaveCount(1);
        await expect.soft(RecordsetLocators.getFacetFilters(modal).nth(0)).toHaveText(testParams.foreignKeyPopupFacetFilter);

        const selectButtons = RecordsetLocators.getRows(modal).locator('.select-action-button');
        await expect.soft(selectButtons).toHaveCount(1);

        await selectButtons.nth(0).click();
        await expect.soft(RecordeditLocators.getPageTitle(page)).toBeVisible();
        
        await expect.soft(RecordeditLocators.getForeignKeyInputDisplay(page,'fk_to_f1', 1)).toHaveText('eight');
      });
    });

    test('in record app, association add popup should have facets available', async ({ page, baseURL }, testInfo) => {
      const modal = ModalLocators.getRecordsetSearchPopup(page);

      await test.step('should load recordset page, wait for `facets` to be added to the url, and change to record app', async () => {
        const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

        await page.goto(`${baseURL}${PAGE_URL}`);
        await RecordsetLocators.waitForRecordsetPageReady(page);
        await expect.soft(RecordsetLocators.getClearAllFilters(page)).toBeVisible();

        await expect.soft(page).toHaveURL(/facets/);

        const url = page.url();
        await page.goto(url.replace('recordset', 'record'));
        await RecordLocators.waitForRecordPageReady(page);
      });

      await test.step('navigating to record with a facet url', async () => {
        await testRecordMainSectionValues(page, testParams.recordColumns, testParams.recordValues);
      });

      await test.step('should click the add button for an association table and have the facet collapse button visible', async () => {
        await RecordLocators.getRelatedTableAddButton(page, testParams.associationRTName, false).click();
        
        await expect.soft(ModalLocators.getModalTitle(modal)).toBeVisible();
        await expect.soft(RecordsetLocators.getRows(modal)).toHaveCount(5);

        // make sure side bar is hidden
        await expect.soft(RecordsetLocators.getSidePanel(modal)).not.toBeVisible();    
        // make sure 'show' filter panel button is shown
        await expect.soft(RecordsetLocators.getShowFilterPanelBtn(modal)).toBeVisible();
      });

      // NOTE: identical to a test above
      await test.step('clicking the side panel button should open the facet panel', async () => {
        await RecordsetLocators.getShowFilterPanelBtn(modal).click();

        // make sure side bar is shown
        await expect.soft(RecordsetLocators.getSidePanel(modal)).toBeVisible();
        // make sure 'hide' filter panel button is shown 
        await expect.soft(RecordsetLocators.getHideFilterPanelBtn(modal)).toBeVisible();
      });

      await test.step('select a facet option and select a row to associate', async () => {
        const facet = RecordsetLocators.getFacetById(modal, 0);
        await RecordsetLocators.getFacetOption(facet, 0).click();

        await expect.soft(RecordsetLocators.getRows(modal)).toHaveCount(1);
        await expect.soft(RecordsetLocators.getFacetFilters(modal).nth(0)).toHaveText(testParams.associationPopupFacetFilter);

        await RecordsetLocators.getCheckboxInputs(modal).check();
        
        // verify selected row filter
        await expect.soft(RecordsetLocators.getSelectedRowsFilters(modal).nth(0)).toHaveText(testParams.associationPopupSelectedRowsFilter);
        // NOTE: we don't test add here because we aren't trying to test mutating data, but rather that the popup behaves appropriately with faceting
      });
    });
  });

  test('navigating to recordset with custom facet', async ({ page, baseURL }, testInfo) => {
    const params = testParams.customFacet;

    await test.step('should load recordset page', async () => {
      const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}`;

      await page.goto(`${baseURL}${PAGE_URL}/*::facets::${params.cfacetBlob}`);
      await page.pause();
      await RecordsetLocators.waitForRecordsetPageReady(page);
    });

    await test.step('should show the applied filter and clear all button.', async () => {
      const facetFilters = RecordsetLocators.getFacetFilters(page);
      await expect.soft(facetFilters).toHaveCount(1);
      
      await expect.soft(facetFilters.nth(0)).toHaveText(`Custom Filter${params.cfacet.displayname}`);
      await expect.soft(RecordsetLocators.getClearAllFilters(page)).toBeVisible();
    });

    // await test.step('main and faceting data should be based on the filter, and be able to apply new filters.', async () => {
    //   browser.wait(function () {
    //       return chaisePage.recordsetPage.getRows().count().then(function(ct) {
    //           return ct == customFacetParams.numRows;
    //       });
    //   }, browser.params.defaultTimeout);
    //   // main
    //   expect(chaisePage.recordsetPage.getRows().count()).toEqual(customFacetParams.numRows, "total row count missmatch.");

    //   chaisePage.clickButton(chaisePage.recordsetPage.getFacetHeaderButtonById(idx)).then(function () {
    //       browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);

    //       // wait for facet checkboxes to load
    //       browser.wait(function () {
    //           return chaisePage.recordsetPage.getFacetOptions(idx).count().then(function(ct) {
    //               return ct == customFacetParams.totalNumOptions;
    //           });
    //       }, browser.params.defaultTimeout);

    //       // wait for list to be fully visible
    //       browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getList(idx)), browser.params.defaultTimeout);

    //       /**
    //        * NOTE: this used to be getFacetOptions, but for some reason the .getText started returning empty
    //        * value for the rows that are hidden because of the height logic
    //        * so I changed it to directly get the text from javascript.
    //        */
    //       return chaisePage.recordsetPage.getFacetOptionsText(idx);
    //   }).then(function (opts) {
    //       opts.forEach(function (option, i) {
    //           expect(option).toEqual(customFacetParams.options[i], `options missmatch, index=${i}`);
    //       });

    //       // select a new facet
    //       return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(idx, customFacetParams.option));
    //   }).then(function () {
    //       // wait for table rows to load
    //       browser.wait(function () {
    //           return chaisePage.recordsetPage.getRows().count().then(function(ct) {
    //               return ct == customFacetParams.numRowsWFacet;
    //           });
    //       }, browser.params.defaultTimeout);

    //       // make sure data has been updated
    //       expect(chaisePage.recordsetPage.getRows().count()).toBe(customFacetParams.numRowsWFacet, "");

    //       // make sure filter is there
    //       expect(chaisePage.recordsetPage.getFacetFilters().count()).toBe(2, "facet filter missing.");


    //       done();
    //   }).catch(chaisePage.catchTestError(done));
    // });
  });
});