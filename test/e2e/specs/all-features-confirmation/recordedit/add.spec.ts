import { test } from '@playwright/test';

import { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import { testCreateRecords, TestCreateRecordsParams } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';

const parallelTestParams: TestCreateRecordsParams = {
  tables: [
    {
      num_files: 0,
      presentation: {
        description: 'multi create',
        schemaName: 'product-add',
        tableName: 'accommodation',
        tableDisplayname: 'Accommodations',
        tableComment: 'List of different types of accommodations',
        columns: [
          { name: 'id', displayname: 'Id', type: RecordeditInputType.INT_4, disabled: true },
          { name: 'title', displayname: 'Name of Accommodation', type: RecordeditInputType.TEXT, isRequired: true },
          { name: 'website', displayname: 'Website', type: RecordeditInputType.TEXT, comment: 'A valid url of the accommodation' },
          {
            name: 'category', displayname: 'Category', type: RecordeditInputType.FK_POPUP, isRequired: true,
            comment: 'Type of accommodation (Resort, Hotel, or Motel)'
          },
          { name: 'rating', displayname: 'User Rating', type: RecordeditInputType.NUMBER, isRequired: true },
          {
            name: 'summary', displayname: 'Summary', type: RecordeditInputType.LONGTEXT, isRequired: true,
            inlineComment: 'A comment displayed for the summary column'
          },
          { name: 'description', displayname: 'Description', type: RecordeditInputType.MARKDOWN },
          { name: 'json_col', displayname: 'json_col', type: RecordeditInputType.JSON },
          {
            name: 'no_of_rooms', displayname: 'Number of Rooms', type: RecordeditInputType.INT_2,
            inlineComment: 'This shows the number of rooms!'
          },
          { name: 'opened_on', displayname: 'Operational Since', type: RecordeditInputType.TIMESTAMP, isRequired: true },
          { name: 'date_col', displayname: 'date_col', type: RecordeditInputType.DATE },
          { name: 'luxurious', displayname: 'Is Luxurious', type: RecordeditInputType.BOOLEAN, isRequired: true },
          { name: 'text_array', displayname: 'text_array', type: RecordeditInputType.ARRAY, arrayBaseType: RecordeditInputType.TEXT },
          { name: 'boolean_array', displayname: 'boolean_array', type: RecordeditInputType.ARRAY, arrayBaseType: RecordeditInputType.BOOLEAN },
          { name: 'int4_array', displayname: 'int4_array', type: RecordeditInputType.ARRAY, arrayBaseType: RecordeditInputType.INT_4 },
          { name: 'float4_array', displayname: 'float4_array', type: RecordeditInputType.ARRAY, arrayBaseType: RecordeditInputType.NUMBER },
          { name: 'date_array', displayname: 'date_array', type: RecordeditInputType.ARRAY, arrayBaseType: RecordeditInputType.DATE },
          {
            name: 'timestamp_array', displayname: 'timestamp_array',
            type: RecordeditInputType.ARRAY, arrayBaseType: RecordeditInputType.TIMESTAMP
          },
          {
            name: 'timestamptz_array', displayname: 'timestamptz_array',
            type: RecordeditInputType.ARRAY, arrayBaseType: RecordeditInputType.TIMESTAMP
          },
          { name: 'color_rgb_hex_column', displayname: 'color_rgb_hex_column', type: RecordeditInputType.COLOR, isRequired: true },
        ],
        inputs: [
          {
            'title': 'new title 1 ™', 'website': 'https://example1.com', 'category': { modal_num_rows: 5, modal_option_index: 0, rowName: 'Hotel' },
            'rating': '1', 'summary': 'This is the summary of this column 1.', 'description': '## Description 1 ©',
            'json_col': JSON.stringify({ 'items': { 'qty': 6, 'product': 'apple ®' }, 'customer': 'John Smith' }, undefined, 2),
            'no_of_rooms': '1', 'opened_on': { date_value: '2017-01-01', time_value: '01:01:01' }, 'date_col': '2017-01-01', 'luxurious': 'false',
            'text_array': ['v1', 'v2'], 'boolean_array': ['true'],
            'int4_array': ['1', '2'], 'float4_array': ['1', '2.2'],
            'date_array': ['2001-01-01', '2002-02-02'], 'timestamp_array': [{ date_value: '2001-01-01', time_value: '01:01:01' }],
            'timestamptz_array': [{ date_value: '2001-01-01', time_value: '01:01:01' }],
            'color_rgb_hex_column': '#123456'
          },
          {
            'title': 'new title 2', 'website': 'https://example2.com', 'category': { modal_num_rows: 5, modal_option_index: 1, rowName: 'Ranch' },
            'rating': '2', 'summary': 'This is the summary of this column 2.', 'description': '## Description 2',
            'json_col': JSON.stringify({ 'items': { 'qty': 6, 'product': 'apple' }, 'customer': 'John Smith' }, undefined, 2),
            'no_of_rooms': '2', 'opened_on': { date_value: '2017-02-02', time_value: '02:02:02' }, 'date_col': '2017-02-02', 'luxurious': 'true',
            'text_array': ['v2', 'v3'], 'boolean_array': ['false'], 'int4_array': ['1', '2'], 'float4_array': ['2', '3.3'],
            'date_array': ['2002-02-02'], 'timestamp_array': [{ date_value: '2002-02-02', time_value: '02:02:02' }],
            'timestamptz_array': [{ date_value: '2002-02-02', time_value: '02:02:02' }],
            'color_rgb_hex_column': '#654321'
          }
        ]
      },
      submission: {
        tableDisplayname: 'Accommodations',
        resultColumnNames: [
          'title', 'website', 'product-add_fk_category', 'rating', 'summary', 'description',
          'json_col', 'no_of_rooms', 'opened_on', 'date_col', 'luxurious',
          'text_array', 'boolean_array', 'int4_array', 'float4_array', 'date_array', 'timestamp_array', 'timestamptz_array', 'color_rgb_hex_column'
        ],
        resultRowValues: [
          [
            'new title 1 ™', { url: 'https://example1.com', caption: 'Link to Website' },
            { url: '/product-add:category/term=Hotel', caption: 'Hotel' },
            '1.0000', 'This is the summary of this column 1.', 'Description 1 ©',
            JSON.stringify({ 'items': { 'qty': 6, 'product': 'apple ®' }, 'customer': 'John Smith' }, undefined, 2),
            '1', '2017-01-01 01:01:01', '2017-01-01', 'false',
            'v1, v2', 'true', '1, 2', '1.0000, 2.2000', '2001-01-01, 2002-02-02', '2001-01-01 01:01:01', '2001-01-01 01:01:01',
            '#123456'
          ],
          [
            'new title 2', { url: 'https://example2.com', caption: 'Link to Website' },
            { url: '/product-add:category/term=Ranch', caption: 'Ranch' },
            '2.0000', 'This is the summary of this column 2.', 'Description 2',
            JSON.stringify({ 'items': { 'qty': 6, 'product': 'apple' }, 'customer': 'John Smith' }, undefined, 2),
            '2', '2017-02-02 02:02:02', '2017-02-02', 'true',
            'v2, v3', 'false', '1, 2', '2.0000, 3.3000', '2002-02-02', '2002-02-02 02:02:02', '2002-02-02 02:02:02',
            '#654321'
          ]
        ]
      }
    }
  ]
}

test.describe('Recordedit create (parallel)', () => {
  test.describe.configure({ mode: 'parallel' });
  testCreateRecords(parallelTestParams);
});

