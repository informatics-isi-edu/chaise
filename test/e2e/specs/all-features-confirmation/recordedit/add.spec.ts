import { test, expect } from '@playwright/test';
import moment from 'moment';

import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import { deleteHatracNamespaces } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import {
  createFiles, deleteFiles, testFormPresentationAndValidation,
  TestFormPresentationAndValidation, testSubmission,
  TestSubmissionParams
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const currentTimestampTimeStr = moment().format('x');

const testFiles = [
  {
    name: 'testfile1MB_add.txt',
    size: '1024000',
    path: 'testfile1MB_add.txt',
    tooltip: '- testfile1MB_add.txt\n- 1000 kB'
  },
  {
    name: 'testfile500kb_add.png',
    size: '512000',
    path: 'testfile500kb_add.png',
    tooltip: '- testfile500kb_add.png\n- 500 kB'
  },
  {
    name: 'testfile10MB_add.txt',
    size: '10240000',
    path: 'testfile10MB_add.txt',
    tooltip: '- testfile10MB_add.txt\n- 9.77 MB'
  },
];

// we're testing this table multiple times
const fileTableDefaultPresentationProps = {
  schemaName: 'product-add',
  tableName: 'file',
  tableDisplayname: 'file',
  tableComment: 'asset/object',
  columns: [
    { name: 'fileid', displayname: 'fileid', type: RecordeditInputType.INT_4, skipValidation: true },
    { name: 'uri', displayname: 'uri', type: RecordeditInputType.FILE, comment: 'asset/reference' },
    { name: 'timestamp_txt', displayname: 'timestamp_txt', type: RecordeditInputType.TEXT, skipValidation: true }
  ]
}

const testParams: {
  tables: {
    num_files: number,
    presentation: TestFormPresentationAndValidation,
    submission: TestSubmissionParams
  }[]
} = {
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
    },
    {
      num_files: 2, // only two forms will be submitted
      presentation: {
        ...fileTableDefaultPresentationProps,
        description: 'multi create with new files',
        inputs: [
          { 'fileid': '1', 'uri': testFiles[0], 'timestamp_txt': currentTimestampTimeStr },
          { 'fileid': '2', 'uri': testFiles[1], 'timestamp_txt': currentTimestampTimeStr },
          { 'fileid': '3', 'uri': testFiles[1], 'timestamp_txt': currentTimestampTimeStr } // the form will be removed
        ]
      },
      submission: {
        tableDisplayname: 'file',
        resultColumnNames: ['fileid', 'uri', 'filename', 'bytes'],
        resultRowValues: [
          [
            '1',
            { caption: 'testfile1MB_add.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/1/.txt/3a8c740953a168d9761d0ba2c9800475:` },
            'testfile1MB_add.txt',
            '1.02 MB'
          ],
          [
            '2',
            { caption: 'testfile500kb_add.png', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/2/.png/2ada69fe3cdadcefddc5a83144bddbb4:` },
            'testfile500kb_add.png',
            '512 kB'
          ]
        ]
      }
    },
    {
      num_files: 2, // only two forms will be submitted
      presentation: {
        description: 'multi create when one file previously uploaded to hatrac',
        schemaName: 'product-add',
        tableName: 'file',
        tableDisplayname: 'file',
        tableComment: 'asset/object',
        columns: [
          { name: 'fileid', displayname: 'fileid', type: RecordeditInputType.INT_4, skipValidation: true },
          { name: 'uri', displayname: 'uri', type: RecordeditInputType.FILE, comment: 'asset/reference' },
          { name: 'timestamp_txt', displayname: 'timestamp_txt', type: RecordeditInputType.TEXT, skipValidation: true }
        ],
        inputs: [
          { 'fileid': '1', 'uri': testFiles[2], 'timestamp_txt': currentTimestampTimeStr }, // this is new
          { 'fileid': '2', 'uri': testFiles[1], 'timestamp_txt': currentTimestampTimeStr }, // this is uploaded in the previous test
          { 'fileid': '3', 'uri': testFiles[1], 'timestamp_txt': currentTimestampTimeStr } // the form will be removed
        ]
      },
      submission: {
        tableDisplayname: 'file',
        resultColumnNames: ['fileid', 'uri', 'filename', 'bytes'],
        resultRowValues: [
          [
            '1',
            { caption: 'testfile10MB_add.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/1/.txt/b5dad28809685d9764dbd08fa23600bc:` },
            'testfile10MB_add.txt',
            '10.2 MB'
          ],
          [
            '2',
            { caption: 'testfile500kb_add.png', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/2/.png/2ada69fe3cdadcefddc5a83144bddbb4:` },
            'testfile500kb_add.png',
            '512 kB'
          ]
        ]
      }
    },
    {
      num_files: 2, // only two forms will be submitted
      presentation: {
        description: 'multi create when both files previously uploaded to hatrac',
        schemaName: 'product-add',
        tableName: 'file',
        tableDisplayname: 'file',
        tableComment: 'asset/object',
        columns: [
          { name: 'fileid', displayname: 'fileid', type: RecordeditInputType.INT_4, skipValidation: true },
          { name: 'uri', displayname: 'uri', type: RecordeditInputType.FILE, comment: 'asset/reference' },
          { name: 'timestamp_txt', displayname: 'timestamp_txt', type: RecordeditInputType.TEXT, skipValidation: true }
        ],
        inputs: [
          { 'fileid': '1', 'uri': testFiles[0], 'timestamp_txt': currentTimestampTimeStr }, // this is uploaded in the previous test
          { 'fileid': '2', 'uri': testFiles[1], 'timestamp_txt': currentTimestampTimeStr }, // this is uploaded in the previous test
          { 'fileid': '3', 'uri': testFiles[1], 'timestamp_txt': currentTimestampTimeStr } // the form will be removed
        ]
      },
      submission: {
        tableDisplayname: 'file',
        resultColumnNames: ['fileid', 'uri', 'filename', 'bytes'],
        resultRowValues: [
          [
            '1',
            { caption: 'testfile1MB_add.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/1/.txt/3a8c740953a168d9761d0ba2c9800475:` },
            'testfile1MB_add.txt',
            '1.02 MB'
          ],
          [
            '2',
            { caption: 'testfile500kb_add.png', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/2/.png/2ada69fe3cdadcefddc5a83144bddbb4:` },
            'testfile500kb_add.png',
            '512 kB'
          ]
        ]
      }
    },
    {
      num_files: 2,
      presentation: {
        description: 'file upload with outbound fkey usage in url_pattern',
        schemaName: 'product-add',
        tableName: 'file_w_fk_in_url_pattern',
        tableDisplayname: 'file_w_fk_in_url_pattern',
        columns: [
          { name: 'id', displayname: 'id', type: RecordeditInputType.TEXT, isRequired: true, skipValidation: true },
          { name: 'category', displayname: 'Category', type: RecordeditInputType.FK_POPUP, isRequired: false, skipValidation: true },
          { name: 'asset_col', displayname: 'asset_col', type: RecordeditInputType.FILE , skipValidation: true},
          { name: 'timestamp_txt', displayname: 'timestamp_txt', type: RecordeditInputType.TEXT, skipValidation: true }
        ],
        inputs: [
          {
            'id': '3',
            'asset_col': testFiles[0],
            'category': { modal_num_rows: 5, modal_option_index: 1, rowName: 'Ranch' },
            'timestamp_txt': currentTimestampTimeStr
          },
          {
            'id': '4',
            'asset_col': testFiles[1],
            'category': { modal_num_rows: 5, modal_option_index: 3, rowName: 'Resort' },
            'timestamp_txt': currentTimestampTimeStr
          },
          // the form will be removed:
          {
            'id': '5',
            'asset_col': testFiles[1],
            'category': { modal_num_rows: 5, modal_option_index: 0, rowName: 'Hotel' },
            'timestamp_txt': currentTimestampTimeStr
          }
        ]
      },
      submission: {
        tableDisplayname: 'file_w_fk_in_url_pattern',
        resultColumnNames: ['id', 'Category', 'asset_col'],
        resultRowValues: [
          [ '3', '10004', { caption: 'testfile1MB_add.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/Ranch/3/` } ],
          [ '4', '10006', { caption: 'testfile500kb_add.png', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/Resort/4/` } ]
        ]
      }
    }
  ]
}


test.describe('Recordedit create', () => {
  /**
   * we have to make sure we're running test cases sequentially since upload test cases are testing that users
   * can upload the same file to the same location. That's why we're not running tests here in parallel
   */

  test.beforeAll(async () => {
    await createFiles(testFiles);
  });

  for (const params of testParams.tables) {
    const presentation = params.presentation;

    test(`${presentation.description}`, async ({ page, baseURL }, testInfo) => {
      const numForms = presentation.inputs.length;

      await test.step('open recordedit page', async () => {
        await page.goto(generateChaiseURL(APP_NAMES.RECORDEDIT, presentation.schemaName, presentation.tableName, testInfo, baseURL));
        await RecordeditLocators.waitForRecordeditPageReady(page);
      });

      if (numForms > 1) {
        await test.step('clone more forms', async () => {
          let cnt = 1;
          while (cnt < numForms) {
            await RecordeditLocators.getCloneFormInputSubmitButton(page).click();
            await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(++cnt);
          }
        });
      }

      // test everything related to the form
      await testFormPresentationAndValidation(page, baseURL, testInfo, presentation, false);

      // this test clones the form and then remove the extra one. just to make sure nothing is affected by this.
      await test.step('remove form', async () => {
        // for the tests with file, we want to remove the actual form instead of adding a new one.
        const addExtraForm = params.num_files === 0;

        if (numForms === 1) {
          await test.step('remove button should not be offered when only one form is visible', async () => {
            await expect.soft(RecordeditLocators.getAllDeleteRowButtons(page)).toHaveCount(0);
          });
        }

        if (addExtraForm) {
          await test.step('clone an extra form', async () => {
            await RecordeditLocators.getCloneFormInputSubmitButton(page).click();
            await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(numForms + 1);
            await expect.soft(RecordeditLocators.getAllDeleteRowButtons(page)).toHaveCount(numForms + 1);
          });
        }

        await test.step('remove the last form', async () => {
          const cnt = addExtraForm ? numForms : numForms - 1;
          await RecordeditLocators.getDeleteRowButton(page, cnt).click();
          await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(cnt);
          await expect.soft(RecordeditLocators.getAllDeleteRowButtons(page)).toHaveCount(cnt === 1 ? 0 : cnt);
        });
      });

      await test.step('submit and save the data', async () => {
        let timeout: number | undefined;
        if (params.num_files > 0) {
          timeout = params.num_files * 30 * 1000;
        }
        await testSubmission(page, params.submission, false, timeout);
      });
    });
  }

  test.afterAll(async () => {
    await deleteFiles(testFiles);
    await deleteHatracNamespaces([`/hatrac/js/chaise/${currentTimestampTimeStr}`]);
  });

});
