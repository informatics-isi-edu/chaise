import { test } from '@playwright/test';
import moment from 'moment';

import { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import { createFiles, deleteFiles, testCreateRecords, TestCreateRecordsParams } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { deleteHatracNamespaces } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';

const currentTimestampTimeStr = moment().format('x');

const testFiles = [
  {
    name: 'testfile1MB_add_seq.txt',
    size: '1024000',
    path: 'testfile1MB_add_seq.txt',
    tooltip: '- testfile1MB_add_seq.txt\n- 1000 kB'
  },
  {
    name: 'testfile500kb_add_seq.png',
    size: '512000',
    path: 'testfile500kb_add_seq.png',
    tooltip: '- testfile500kb_add_seq.png\n- 500 kB'
  },
  {
    name: 'testfile10MB_add_seq.txt',
    size: '10240000',
    path: 'testfile10MB_add_seq.txt',
    tooltip: '- testfile10MB_add_seq.txt\n- 9.77 MB'
  },
  {
    name: 'testfile128kb_add_seq_4.txt',
    size: '12800',
    path: 'testfile128kb_add_seq_4.txt',
  },
  {
    name: 'testfile500kb_add_seq_5.png',
    size: '512000',
    path: 'testfile500kb_add_seq_5.png',
    tooltip: '- testfile500kb_add_seq_5.png\n- 500 kB',
  },
  {
    name: 'testfile128kb_add_seq_6.txt',
    size: '12800',
    path: 'testfile128kb_add_seq_6.txt',
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
};

const fileWitWaitForDefaultPresentationProps = {
  schemaName: 'product-add',
  tableName: 'file_w_wait_for_in_url_pattern_1',
  tableDisplayname: 'file_w_wait_for_in_url_pattern_1',
  columns: [
    { name: 'id', displayname: 'id', type: RecordeditInputType.INT_4, isRequired: true, skipValidation: true },
    {
      name: 'fk_col',
      displayname: 'fk_col',
      type: RecordeditInputType.FK_POPUP,
      isRequired: false, skipValidation: true
    },
    { name: 'asset_col', displayname: 'asset_col', type: RecordeditInputType.FILE, skipValidation: true },
    { name: 'asset_col_2', displayname: 'asset_col_2', type: RecordeditInputType.FILE, skipValidation: true },
    { name: 'timestamp_txt', displayname: 'timestamp_txt', type: RecordeditInputType.TEXT, skipValidation: true },
  ],
};

const testParams: TestCreateRecordsParams = {
  tables: [
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
            { caption: 'testfile1MB_add_seq.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/1/.txt/3a8c740953a168d9761d0ba2c9800475:` },
            'testfile1MB_add_seq.txt',
            '1.02 MB'
          ],
          [
            '2',
            { caption: 'testfile500kb_add_seq.png', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/2/.png/2ada69fe3cdadcefddc5a83144bddbb4:` },
            'testfile500kb_add_seq.png',
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
            { caption: 'testfile10MB_add_seq.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/1/.txt/b5dad28809685d9764dbd08fa23600bc:` },
            'testfile10MB_add_seq.txt',
            '10.2 MB'
          ],
          [
            '2',
            { caption: 'testfile500kb_add_seq.png', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/2/.png/2ada69fe3cdadcefddc5a83144bddbb4:` },
            'testfile500kb_add_seq.png',
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
            { caption: 'testfile1MB_add_seq.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/1/.txt/3a8c740953a168d9761d0ba2c9800475:` },
            'testfile1MB_add_seq.txt',
            '1.02 MB'
          ],
          [
            '2',
            { caption: 'testfile500kb_add_seq.png', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/2/.png/2ada69fe3cdadcefddc5a83144bddbb4:` },
            'testfile500kb_add_seq.png',
            '512 kB'
          ]
        ]
      }
    },
    {
      num_files: 2,
      presentation: {
        description: 'upload with $fkey in url_pattern',
        schemaName: 'product-add',
        tableName: 'file_w_fk_in_url_pattern',
        tableDisplayname: 'file_w_fk_in_url_pattern',
        columns: [
          { name: 'id', displayname: 'id', type: RecordeditInputType.TEXT, isRequired: true, skipValidation: true },
          { name: 'category', displayname: 'Category', type: RecordeditInputType.FK_POPUP, isRequired: false, skipValidation: true },
          { name: 'asset_col', displayname: 'asset_col', type: RecordeditInputType.FILE, skipValidation: true },
          { name: 'timestamp_txt', displayname: 'timestamp_txt', type: RecordeditInputType.TEXT, skipValidation: true }
        ],
        inputs: [
          {
            'id': '3',
            'asset_col': testFiles[3],
            'category': { modal_num_rows: 5, modal_option_index: 1, rowName: 'Ranch' },
            'timestamp_txt': currentTimestampTimeStr
          },
          {
            'id': '4',
            'asset_col': testFiles[4],
            'category': { modal_num_rows: 5, modal_option_index: 3, rowName: 'Resort' },
            'timestamp_txt': currentTimestampTimeStr
          },
          // the form will be removed:
          {
            'id': '5',
            'asset_col': testFiles[4],
            'category': { modal_num_rows: 5, modal_option_index: 0, rowName: 'Hotel' },
            'timestamp_txt': currentTimestampTimeStr
          }
        ]
      },
      submission: {
        tableDisplayname: 'file_w_fk_in_url_pattern',
        resultColumnNames: ['id', 'Category', 'asset_col'],
        resultRowValues: [
          ['3', '10004', { caption: 'testfile128kb_add_seq_4.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/Ranch/3/` }],
          ['4', '10006', { caption: 'testfile500kb_add_seq_5.png', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/Resort/4/` }]
        ]
      }
    },
    {
      num_files: 2,
      presentation: {
        ...fileWitWaitForDefaultPresentationProps,
        description: 'upload with wait_for in url_pattern (single)',
        inputs: [
          {
            'id': '1',
            'asset_col': testFiles[3],
            'asset_col_2': testFiles[5],
            'fk_col': { modal_num_rows: 5, modal_option_index: 1, rowName: 'two' },
            'timestamp_txt': currentTimestampTimeStr
          },
          // the form will be removed (making sure that the removed form is not causing any validation issues):
          {
            'id': '4',
            'asset_col': testFiles[5],
            'asset_col_2': testFiles[5],
            'timestamp_txt': currentTimestampTimeStr
          },
        ],
      },
      submission: {
        tableDisplayname: 'file_w_wait_for_in_url_pattern_1',
        resultColumnNames: ['id', 'fk_col', 'asset_col', 'asset_col_2'],
        resultRowValues: [
          [
            '1',
            { caption: 'two', url: '/product-add:file_w_wait_for_in_url_pattern_1_o1/' },
            { caption: 'testfile128kb_add_seq_4.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/asset-1-twenty-two/1/` },
            { caption: 'testfile128kb_add_seq_6.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/asset-2-twenty-two/1/` }
          ]
        ]
      }
    },
    {
      num_files: 3,
      presentation: {
        ...fileWitWaitForDefaultPresentationProps,
        description: 'upload with wait_for in url_pattern (multi)',
        inputs: [
          {
            'id': '2',
            'asset_col': testFiles[3],
            'asset_col_2': testFiles[5],
            'fk_col': { modal_num_rows: 5, modal_option_index: 1, rowName: 'two' },
            'timestamp_txt': currentTimestampTimeStr
          },
          {
            'id': '3',
            'asset_col': testFiles[4],
            'asset_col_2': testFiles[4],
            'fk_col': { modal_num_rows: 5, modal_option_index: 2, rowName: 'three' },
            'timestamp_txt': currentTimestampTimeStr
          },
          {
            'id': '4',
            // testing that the wait-for can ignore empty rows
          },
          // the form will be removed (making sure that the removed form is not causing any validation issues):
          {
            'id': '5',
            'asset_col': testFiles[5],
            'asset_col_2': testFiles[5],
            'timestamp_txt': currentTimestampTimeStr
          },
        ],
      },
      submission: {
        tableDisplayname: 'file_w_wait_for_in_url_pattern_1',
        resultColumnNames: ['id', 'fk_col', 'asset_col', 'asset_col_2'],
        resultRowValues: [
          [
            '2', '2',
            { caption: 'testfile128kb_add_seq_4.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/asset-1-twenty-two/2/` },
            { caption: 'testfile128kb_add_seq_6.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/asset-2-twenty-two/2/` }
          ],
          [
            '3', '3',
            { caption: 'testfile500kb_add_seq_5.png', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/asset-1-thirty-three/3/` },
            { caption: 'testfile500kb_add_seq_5.png', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/asset-2-thirty-three/3/` }
          ],
          [
            '4', '', '', ''
          ]
        ]
      }
    },
    {
      num_files: 2,
      presentation: {
        description: 'upload with wait_for in url_pattern (composite fk w inbound agg)',
        schemaName: 'product-add',
        tableName: 'file_w_wait_for_in_url_pattern_2',
        tableDisplayname: 'file_w_wait_for_in_url_pattern_2',
        columns: [
          { name: 'id', displayname: 'id', type: RecordeditInputType.INT_4, isRequired: true, skipValidation: true },
          {
            name: 'Composite Foreign key',
            displayname: 'Composite Foreign key',
            type: RecordeditInputType.FK_POPUP,
            isRequired: false, skipValidation: true
          },
          { name: 'asset_col', displayname: 'asset_col', type: RecordeditInputType.FILE, skipValidation: true },
          { name: 'timestamp_txt', displayname: 'timestamp_txt', type: RecordeditInputType.TEXT, skipValidation: true },
        ],
        inputs: [
          {
            'id': '1',
            'asset_col': testFiles[3],
            'Composite Foreign key': { modal_num_rows: 5, modal_option_index: 1, rowName: 'two' },
            'timestamp_txt': currentTimestampTimeStr
          },
          {
            'id': '2',
            'asset_col': testFiles[4],
            'Composite Foreign key': { modal_num_rows: 5, modal_option_index: 2, rowName: 'three' },
            'timestamp_txt': currentTimestampTimeStr
          },
          {
            'id': '3',
            // testing that the wait-for can ignore empty rows
          },
          // the form will be removed (making sure that the removed form is not causing any validation issues):
          {
            'id': '4',
            'asset_col': testFiles[5],
            'timestamp_txt': currentTimestampTimeStr
          },
        ],
      },
      submission: {
        tableDisplayname: 'file_w_wait_for_in_url_pattern_2',
        resultColumnNames: ['id', 'Composite Foreign key', 'asset_col'],
        resultRowValues: [
          [
            '1', '12:22',
            { caption: 'testfile128kb_add_seq_4.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/asset-3-o1_i1_twenty-two/1/` },
          ],
          [
            '2', '13:23',
            { caption: 'testfile500kb_add_seq_5.png', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/asset-3-o1_i1_thirty-three/2/` },
          ],
          [
            '3', '', '',
          ]
        ]
      }
    }
  ]
}


test.describe('Recordedit create', () => {
  /**
   * we have to make sure we're running test cases sequentially since upload test cases are testing that users
   * can upload the same file to the same location. That's why we're not running tests here in parallel.
   *
   * also having all the asset uploads done sequentially makes the test cases more stable and faster.
   */
  test.describe.configure({ mode: 'default' });

  test.beforeAll(async () => {
    await createFiles(testFiles);
  });

  testCreateRecords(testParams);

  test.afterAll(async () => {
    await deleteFiles(testFiles);
    await deleteHatracNamespaces([`/hatrac/js/chaise/${currentTimestampTimeStr}`]);
  });
});
