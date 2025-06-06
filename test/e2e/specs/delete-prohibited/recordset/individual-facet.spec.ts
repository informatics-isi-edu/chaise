import { test } from '@playwright/test';

// utils
import {
  openRecordsetAndResetFacetState, testIndividualFacet, TestIndividualFacetParams,
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams: {
  schema_name: string,
  table_name: string,
  sort: string,
  totalNumFacets: number,
  defaults: {
    numRows: number,
    pageSize: number,
  },
  facets: TestIndividualFacetParams[]
} = {
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
      index: 0,
      name: 'id',
      type: 'choice',
      option: 2,
      filter: 'id3',
      numRows: 1,
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    },
    {
      index: 1,
      name: 'int_col',
      type: 'numeric',
      notNullNumRows: 20,
      nullNumRows: 10,
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
      }
    },
    {
      index: 2,
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
      index: 3,
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
      index: 4,
      name: 'timestamp_col',
      type: 'timestamp',
      listElems: 0,
      notNullNumRows: 20,
      nullNumRows: 10,
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
        min: { date: '2004-05-20', time: '10:08:00' },
        max: { date: '2007-12-06', time: '17:26:12' },
        filter: 'timestamp_col2004-05-20 10:08:00 to 2007-12-06 17:26:12',
        numRows: 3
      },
      justMin: {
        min: { date: '2004-05-20', time: '10:08:00' },
        filter: 'timestamp_col≥ 2004-05-20 10:08:00',
        numRows: 8
      },
      justMax: {
        max: { date: '2007-12-06', time: '17:26:12' },
        filter: 'timestamp_col≤ 2007-12-06 17:26:12',
        numRows: 15
      }
    },
    {
      index: 5,
      name: 'text_col',
      type: 'choice',
      option: 1,
      filter: 'text_colNo value',
      numRows: 5,
      options: ['All records with value', 'No value', 'one', 'Empty', 'two', 'seven', 'eight', 'elevens', 'four', 'six', 'ten', 'three']
    },
    {
      index: 6,
      name: 'longtext_col',
      type: 'choice',
      option: 1,
      filter: 'longtext_coltwo',
      numRows: 5,
      options: [
        'Empty', 'two', 'one', 'eight', 'eleven', 'five', 'four',
        // eslint-disable-next-line max-len
        'lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod.',
        'nine', 'seven'
      ]
    },
    {
      index: 7,
      name: 'markdown_col',
      type: 'choice',
      option: 3,
      filter: 'markdown_coleight',
      numRows: 1,
      options: ['Empty', 'one', 'two', 'eight', 'eleven', 'five', 'four', 'nine', 'seven', 'six']
    },
    {
      index: 8,
      name: 'boolean_col',
      type: 'choice',
      option: 2,
      filter: 'boolean_colYes',
      numRows: 10,
      options: ['All records with value', 'No', 'Yes'],
      isBoolean: true
    },
    {
      index: 9,
      name: 'jsonb_col',
      type: 'choice',
      option: 5,
      filter: 'jsonb_col{\n"key": "four"\n}',
      numRows: 1,
      options: [
        'All records with value', 'No value',
        '{\n"key": "one"\n}', '{\n"key": "two"\n}',
        '{\n"key": "three"\n}', '{\n"key": "four"\n}', '{\n"key": "five"\n}',
        '{\n"key": "six"\n}', '{\n"key": "seven"\n}', '8', '"nine"', '{\n"key": "ten"\n}'
      ]
    },
    {
      index: 10,
      name: 'F1',
      type: 'choice',
      option: 2,
      filter: 'F1two',
      numRows: 10,
      options: ['No value', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
      isEntityMode: true,
      searchPlaceholder: 'term column'
    },
    {
      index: 11,
      name: 'to_name',
      type: 'choice',
      option: 0,
      filter: 'to_nameone',
      numRows: 10,
      options: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
      isEntityMode: true
    },
    {
      index: 12,
      name: 'f3 (term)',
      type: 'choice',
      option: 1,
      filter: 'f3 (term)one',
      numRows: 6,
      options: ['All records with value', 'one', 'two']
    },
    {
      index: 13,
      name: 'from_name',
      type: 'choice',
      option: 5,
      filter: 'from_name5',
      numRows: 1,
      options: ['All records with value', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    },
    {
      index: 14,
      name: 'F1 with Term',
      type: 'choice',
      option: 1,
      filter: 'F1 with Termtwo',
      numRows: 10,
      options: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
      isEntityMode: true,
      searchPlaceholder: 'term column'
    },
    {
      index: 15,
      name: 'Check Presence Text',
      type: 'check_presence',
      notNullNumRows: 9,
      notNullFilter: 'Check Presence TextAll records with value',
      nullNumRows: 21,
      nullFilter: 'Check Presence TextNo value'
    },
    {
      index: 16,
      name: 'F3 Entity',
      type: 'choice',
      option: 1,
      filter: 'F3 EntityNo value',
      numRows: 23,
      options: ['All records with value', 'No value', 'one', 'two'],
      isEntityMode: true
    },
    {
      index: 17,
      name: 'F5',
      type: 'choice',
      option: 2,
      filter: 'F5one',
      numRows: 1,
      options: ['All records with value', 'No value', 'one', 'two'],
      isEntityMode: true
    },
    {
      index: 18,
      name: 'F5 with filter',
      type: 'choice',
      option: 1,
      filter: 'F5 with filtertwo',
      numRows: 1,
      options: ['All records with value', 'two'],
      isEntityMode: true
    },
    {
      index: 19,
      name: 'Outbound1 (using F1)',
      type: 'choice',
      option: 2,
      filter: 'Outbound1 (using F1)four (o1)',
      numRows: 1,
      options: [
        'one (o1)', 'three (o1)', 'four (o1)', 'six (o1)', 'seven (o1)',
        'eight (o1)', 'nine (o1)', 'ten (o1)', 'eleven (o1)', 'twelve (o1)'
      ],
      isEntityMode: true
    },
    {
      index: 20,
      name: 'col_w_column_order_false',
      type: 'choice',
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
        generateChaiseURL(APP_NAMES.RECORDSET, testParams.schema_name, testParams.table_name, testInfo, baseURL) + testParams.sort,
        testParams.totalNumFacets,
        [0, 1, 11],
        testParams.defaults.pageSize
      );

      await testIndividualFacet(page, testParams.defaults.pageSize, testParams.totalNumFacets, facetParams);
    });
  }
});
