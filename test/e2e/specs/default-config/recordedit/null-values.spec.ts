/* eslint-disable max-len */

import { expect, test } from '@playwright/test';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import { deleteHatracNamespaces, getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { clearInputValue, createFiles, deleteFiles, setInputValue, testSubmission } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import moment from 'moment';

const currentTimestampTimeStr = moment().format('x');

const longTextValue = [
  'asjdf;laksjdf;laj ;lkajsd;f lkajsdf;lakjs f;lakjs df;lasjd f;ladsjf;alskdjfa ;lskdjf a;lsdkjf a;lskdfjal;sdkfj',
  ' as;ldfkj as;dlf kjasl;fkaj;lfkjasl;fjas;ldfkjals;dfkjas;dlkfja;sldkfjasl;dkfjas;dlfkjasl;dfkja; lsdjfk a;lskdjf',
  ' a;lsdfj as;ldfja;sldkfja;lskjdfa;lskdjfa;lsdkfja;sldkfjas;ldfkjas;dlfkjas;lfkja;sldkjf a;lsjf ;laskj fa;slk jfa;sld',
  ' fjas;l js;lfkajs;lfkasjf;alsja;lk ;l kja'
].join('');

const testFiles = [
  {
    name: 'testfile500kb_nulltest.png',
    size: '512000',
    path: 'testfile500kb_nulltest.png'
  },
]

const testParams = {
  url: 'null-values:table_1/id=1',
  columns: [
    { name: 'int2_null_col', displayname: 'int2_null_col', type: RecordeditInputType.INT_2, value: '32767' },
    { name: 'int2_col', displayname: 'int2_col', type: RecordeditInputType.INT_2, value: null },

    { name: 'int4_null_col', displayname: 'int4_null_col', type: RecordeditInputType.INT_4, value: '-2147483648' },
    { name: 'int4_col', displayname: 'int4_col', type: RecordeditInputType.INT_4, value: null },

    { name: 'int8_null_col', displayname: 'int8_null_col', type: RecordeditInputType.INT_8, value: '9007199254740991' },
    { name: 'int8_col', displayname: 'int8_col', type: RecordeditInputType.INT_8, value: null },

    { name: 'float4_null_col', displayname: 'float4_null_col', type: RecordeditInputType.NUMBER, value: '4.6123' },
    { name: 'float4_col', displayname: 'float4_col', type: RecordeditInputType.NUMBER, value: null },

    { name: 'float8_null_col', displayname: 'float8_null_col', type: RecordeditInputType.NUMBER, value: '234523523.023045' },
    { name: 'float8_col', displayname: 'float8_col', type: RecordeditInputType.NUMBER, value: null },

    { name: 'text_null_col', displayname: 'text_null_col', type: RecordeditInputType.TEXT, value: 'sample' },
    { name: 'text_col', displayname: 'text_col', type: RecordeditInputType.TEXT, value: null },

    { name: 'longtext_null_col', displayname: 'longtext_null_col', type: RecordeditInputType.LONGTEXT, value: longTextValue },
    { name: 'longtext_col', displayname: 'longtext_col', type: RecordeditInputType.LONGTEXT, value: null },

    { name: 'markdown_null_col', displayname: 'markdown_null_col', type: RecordeditInputType.MARKDOWN, value: '<strong>Sample</strong>' },
    { name: 'markdown_col', displayname: 'markdown_col', type: RecordeditInputType.MARKDOWN, value: null },

    { name: 'bool_null_col', displayname: 'bool_null_col', type: RecordeditInputType.BOOLEAN, value: 'true' },
    { name: 'bool_true_col', displayname: 'bool_true_col', type: RecordeditInputType.BOOLEAN, value: 'false' },
    { name: 'bool_false_col', displayname: 'bool_false_col', type: RecordeditInputType.BOOLEAN, value: null },

    { name: 'timestamp_null_col', displayname: 'timestamp_null_col', type: RecordeditInputType.TIMESTAMP, value: { date_value: '2016-01-18', time_value: '13:00:00' } },
    { name: 'timestamp_col', displayname: 'timestamp_col', type: RecordeditInputType.TIMESTAMP, value: null },

    { name: 'timestamptz_null_col', displayname: 'timestamptz_null_col', type: RecordeditInputType.TIMESTAMP, value: { date_value: '2016-01-18', time_value: '13:00:00' } },
    { name: 'timestamptz_col', displayname: 'timestamptz_col', type: RecordeditInputType.TIMESTAMP, value: null },

    { name: 'date_null_col', displayname: 'date_null_col', type: RecordeditInputType.DATE, value: '2016-08-15' },
    { name: 'date_col', displayname: 'date_col', type: RecordeditInputType.DATE, value: null },

    { name: 'fk_null_col', displayname: 'fk_null_col', type: RecordeditInputType.FK_POPUP, value: { modal_num_rows: 1, modal_option_index: 0 } },
    { name: 'fk_col', displayname: 'fk_col', type: RecordeditInputType.FK_POPUP, value: null },

    { name: 'json_null_col', displayname: 'json_null_col', type: RecordeditInputType.JSON, value: '89.586' },
    { name: 'json_col', displayname: 'json_col', type: RecordeditInputType.TEXT, value: null },

    { name: 'asset_null_col', displayname: 'asset_null_col', type: RecordeditInputType.FILE, value: testFiles[0] },
    { name: 'asset_col', displayname: 'asset_col', type: RecordeditInputType.FILE, value: null },

    { name: 'color_rgb_hex_null_col', displayname: 'color_rgb_hex_null_col', type: RecordeditInputType.FILE, value: '#123456' },
    { name: 'color_rgb_hex_col', displayname: 'color_rgb_hex_col', type: RecordeditInputType.FILE, value: null },

    { name: 'array_text_null_col', displayname: 'array_text_null_col', type: RecordeditInputType.ARRAY, arrayBaseType: RecordeditInputType.TEXT, value: ['val1'] },
    { name: 'array_text_col', displayname: 'array_text_col', type: RecordeditInputType.ARRAY, arrayBaseType: RecordeditInputType.TEXT, value: null },

    { name: 'timestamp_txt', displayname: 'timestamp_txt', type: RecordeditInputType.TEXT, value: currentTimestampTimeStr },
  ],
  submission: {
    tableDisplayname: 'table_1',
    resultColumnNames: [
      'int2_null_col', 'int4_null_col', 'int8_null_col', 'float4_null_col', 'float8_null_col', 'text_null_col',
      'longtext_null_col', 'markdown_null_col', 'bool_null_col', 'bool_true_col',
      'timestamp_null_col', 'timestamptz_null_col', 'date_null_col', 'fk_null_col', 'json_null_col', 'timestamp_txt',
      'asset_null_col', 'asset_null_col_bytes', 'array_text_null_col', 'RID', 'RCT', 'RMT', 'RCB', 'RMB'
    ],
    resultRowValues: [[
      '32,767', '-2,147,483,648', '9,007,199,254,740,991', '4.6123', '234,523,523.0230', 'sample',
      longTextValue, '<strong>Sample</strong>', 'true', 'false', '2016-01-18 13:00:00', '2016-01-18 13:00:00',
      '2016-08-15', { caption: 'Abraham Lincoln', url: '/null-values:table_2/' }, '89.586', currentTimestampTimeStr,
      { caption: 'testfile500kb_nulltest.png', url: '/hatrac/js/chaise/' + currentTimestampTimeStr }, '512 kB', 'val1'
    ]]
  }
};

test('Null values in recordedit', async ({ page, baseURL }, testInfo) => {
  await test.step('create files', async () => {
    await createFiles(testFiles);
  });

  await test.step('open recordedit page', async () => {
    await page.goto(`${baseURL}/recordedit/#${getCatalogID(testInfo.project.name)}/${testParams.url}`);
    await RecordeditLocators.waitForRecordeditPageReady(page);
  });

  await test.step('should be able to clear inputs or add values to empty inputs', async () => {
    for await (const col of testParams.columns) {
      await test.step(`${col.name}`, async () => {
        if (col.value === null) {
          await clearInputValue(page, 1, col.name, col.displayname, col.type);
        } else {
          await setInputValue(page, 1, col.name, col.displayname, col.type, col.value, col.arrayBaseType);
        }
      });
    }
  });

  await test.step('should submit and save the data', async () => {
    await testSubmission(page, testParams.submission, true, 1 * 20 * 1000);
  });

  await test.step('delete create files', async () => {
    await deleteFiles(testFiles);
    await deleteHatracNamespaces([`/hatrac/js/chaise/${currentTimestampTimeStr}`]);
  });
})
