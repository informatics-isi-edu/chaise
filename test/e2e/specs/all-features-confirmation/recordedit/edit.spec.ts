/* eslint-disable max-len */
import { expect, test } from '@playwright/test';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import { deleteHatracNamespaces, getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import {
  createFiles, deleteFiles, testFormPresentationAndValidation,
  TestFormPresentationAndValidation, testSubmission,
  TestSubmissionParams
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import moment from 'moment';


const currentTimestampTimeStr = moment().format('x');

const testFiles = [
  {
    name: 'testfile500kb_edit.png',
    size: '512000',
    path: 'testfile500kb_edit.png',
    tooltip: '- testfile500kb_edit.png\n- 500 kB'
  },
  {
    name: 'testfile1MB_edit.txt',
    size: '1024000',
    path: 'testfile1MB_edit.txt',
    tooltip: '- testfile1MB_edit.txt\n- 1000 kB'
  }
];

// we're testing this table multiple times
const accomodationDefaultPresentationProps = {
  schemaName: 'product-edit',
  tableName: 'accommodation',
  tableDisplayname: 'Accommodations',
  tableComment: 'List of different types of accommodations',
  columns: [
    { name: 'id', displayname: 'Id', type: RecordeditInputType.INT_4, disabled: true },
    { name: 'title', displayname: 'Name of Accommodation', type: RecordeditInputType.TEXT, isRequired: true },
    { name: 'website', displayname: 'Website', type: RecordeditInputType.TEXT, comment: 'A valid url of the accommodation' },
    {
      name: 'category', displayname: 'Category', type: RecordeditInputType.FK_POPUP, isRequired: true,
      comment: '_markdown_ comment can be turned off'
    },
    {
      name: 'rating', displayname: 'User Rating', type: RecordeditInputType.NUMBER, isRequired: true,
      inlineComment: 'Average user rating from 1 to 5 stars'
    },
    { name: 'summary', displayname: 'Summary', type: RecordeditInputType.LONGTEXT, isRequired: true },
    { name: 'description', displayname: 'Description', type: RecordeditInputType.MARKDOWN },
    { name: 'no_of_rooms', displayname: 'Number of Rooms', type: RecordeditInputType.INT_4 },
    {
      name: 'opened_on', displayname: 'Operational Since', type: RecordeditInputType.TIMESTAMP, isRequired: true,
      inlineComment: 'The exact time and date where this accommodation became available!'
    },
    { name: 'date_col', displayname: 'date_col', type: RecordeditInputType.DATE },
    { name: 'luxurious', displayname: 'Is Luxurious', type: RecordeditInputType.BOOLEAN },
    { name: 'json_col', displayname: 'json_col', type: RecordeditInputType.JSON },
    { name: 'text_array', displayname: 'text_array', type: RecordeditInputType.ARRAY, arrayBaseType: RecordeditInputType.TEXT, isRequired: true },
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
    { name: 'color_rgb_hex_column', displayname: 'color_rgb_hex_column', type: RecordeditInputType.COLOR },
  ]
};

const fileTableDefaultPresentationProps = {
  schemaName: 'product-edit',
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
    filter: string
    presentation: TestFormPresentationAndValidation,
    submission: TestSubmissionParams
  }[]
} = {
  tables: [
    {
      num_files: 0,
      filter: 'id=2000',
      presentation: {
        description: 'single edit',
        ...accomodationDefaultPresentationProps,
        rowNames: ['Sherathon Hotel'],
        values: [
          {
            'id': '2000', 'title': 'Sherathon Hotel',
            'website': 'http://www.starwoodhotels.com/sheraton/index.html', 'category': 'Hotel', 'rating': '4.3',
            'summary': 'Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.',
            'description': '**CARING. SHARING. DARING.**', 'no_of_rooms': '23', 'opened_on': { date_value: '2008-12-09', time_value: '00:00:00' },
            'date_col': '2008-12-09', 'luxurious': 'true', 'json_col': '',
            'text_array': ['v2', 'v3'], 'boolean_array': ['false'], 'int4_array': ['1'], 'float4_array': ['1.1', '2.2'],
            'date_array': '', 'timestamp_array': ['2003-03-03T03:03:03'],
            'timestamptz_array': [{ date_value: '2002-02-02', time_value: '02:02:02' }],
            'color_rgb_hex_column': '#623456'
          }
        ],
        inputs: [
          {
            'title': 'new title 1', 'website': 'https://new-site.com', 'category': { modal_num_rows: 5, modal_option_index: 1, rowName: 'Ranch' },
            'rating': '1e0', 'summary': 'This is the summary of this column 1.', 'description': '## Description 1',
            'json_col': JSON.stringify({ 'items': { 'qty': 6, 'product': 'apple' }, 'customer': 'John Smith' }, undefined, 2),
            'no_of_rooms': '1', 'opened_on': { date_value: '2017-01-01', time_value: '01:01:01' }, 'date_col': '2017-01-01', 'luxurious': 'false',
            'text_array': ['v1', 'v2'], 'boolean_array': ['true', 'false'],
            'int4_array': ['1', '2', '3'], 'float4_array': ['1', '2.2'],
            'date_array': ['2001-01-01', '2002-02-02'], 'timestamp_array': [{ date_value: '2001-03-01', time_value: '01:01:01' }],
            'timestamptz_array': [{ date_value: '2001-01-01', time_value: '01:01:01' }, { date_value: '2004-04-04', time_value: '11:11:11' }],
            'color_rgb_hex_column': '#723456'
          },
        ]
      },
      submission: {
        tableDisplayname: 'Accommodations',
        resultColumnNames: [ // this is single edit, so these are record page columns
          'Name of Accommodation', 'Website', 'Category', 'User Rating', 'Summary', 'Description', 'Number of Rooms',
          'Operational Since', 'date_col', 'Is Luxurious', 'json_col',
          'text_array', 'boolean_array', 'int4_array', 'float4_array', 'date_array', 'timestamp_array', 'timestamptz_array', 'color_rgb_hex_column'
        ],
        resultRowValues: [
          [
            'new title 1', { url: 'https://new-site.com', caption: 'Link to Website' }, { url: '/product-edit:category/', caption: 'Ranch' },
            '1.0000', 'This is the summary of this column 1.', 'Description 1', '1', '2017-01-01 01:01:01', '2017-01-01', 'false',
            JSON.stringify({ 'items': { 'qty': 6, 'product': 'apple' }, 'customer': 'John Smith' }, undefined, 2),
            'v1, v2', 'true, false', '1, 2, 3', '1.0000, 2.2000', '2001-01-01, 2002-02-02', '2001-03-01 01:01:01',
            '2001-01-01 01:01:01, 2004-04-04 11:11:11', '#723456'
          ]
        ]
      }
    },
    {
      num_files: 0,
      filter: 'id=2001;id=2004@sort(id)',
      presentation: {
        description: 'multi edit',
        ...accomodationDefaultPresentationProps,
        rowNames: ['Radisson Hotel', 'Super 8 North Hollywood Motel'],
        values: [
          {
            'id': '2001', 'title': 'Radisson Hotel',
            'website': 'http://www.radisson.com/', 'category': 'Hotel', 'rating': '4.7',
            'summary': 'Radisson Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.',
            'description': '** CARING. SHARING. DARING.**\nRadisson^®^ is synonymous with outstanding levels of service and comfort delivered with utmost style. And today, we deliver even more to make sure we maintain our position at the forefront of the hospitality industry now and in the future.\nOur hotels are service driven, responsible, socially and locally connected and demonstrate a modern friendly attitude in everything we do. Our aim is to deliver our outstanding `Yes I Can!` ^SM^ service, comfort and style where you need us.\n\n**THE RADISSON^®^ WAY** Always positive, always smiling and always professional, Radisson people set Radisson apart. Every member of the team has a dedication to `Yes I Can!` ^SM^ hospitality – a passion for ensuring the total wellbeing and satisfaction of each individual guest. Imaginative, understanding and truly empathetic to the needs of the modern traveler, they are people on a special mission to deliver exceptional Extra Thoughtful Care.',
            'no_of_rooms': '46', 'opened_on': { date_value: '2002-01-22', time_value: '00:00:00' },
            'date_col': '2008-12-09', 'luxurious': 'true', 'json_col': JSON.stringify({ 'name': 'testing_json' }, undefined, 2),
            'text_array': ['val1'], 'boolean_array': ['false', 'false'], 'int4_array': ['1', '2', '3', '4', '5'], 'float4_array': ['-5.2'],
            'date_array': '', 'timestamp_array': '',
            'timestamptz_array': '', 'color_rgb_hex_column': '#223456'
          },
          {
            'id': '2004', 'title': 'Super 8 North Hollywood Motel',
            'website': 'https://www.kayak.com/hotels/Super-8-North-Hollywood-c31809-h40498/2016-06-09/2016-06-10/2guests', 'category': 'Motel', 'rating': '2.8',
            'summary': 'Fair Hotel. Close to Universal Studios. Located near shopping areas with easy access to parking. Professional staff and clean rooms. Poorly-maintained rooms.',
            'description': '** CARING. SHARING. DARING.**\nRadisson^®^ is synonymous with outstanding levels of service and comfort delivered with utmost style. And today, we deliver even more to make sure we maintain our position at the forefront of the hospitality industry now and in the future.\nOur hotels are service driven, responsible, socially and locally connected and demonstrate a modern friendly attitude in everything we do. Our aim is to deliver our outstanding `Yes I Can!` ^SM^ service, comfort and style where you need us.\n\n**THE RADISSON^®^ WAY** Always positive, always smiling and always professional, Radisson people set Radisson apart. Every member of the team has a dedication to `Yes I Can!` ^SM^ hospitality – a passion for ensuring the total wellbeing and satisfaction of each individual guest. Imaginative, understanding and truly empathetic to the needs of the modern traveler, they are people on a special mission to deliver exceptional Extra Thoughtful Care.',
            'no_of_rooms': '35', 'opened_on': { date_value: '2013-06-11', time_value: '00:00:00' },
            'date_col': '2008-12-09', 'luxurious': 'false', 'json_col': JSON.stringify({ 'age': 25, 'name': 'Testing' }, undefined, 2),
            'text_array': ['val2'], 'boolean_array': ['false'], 'int4_array': ['1'], 'float4_array': ['1.1', '2.2'],
            'date_array': '', 'timestamp_array': '',
            'timestamptz_array': [{ date_value: '2022-02-02', time_value: '02:02:02' }, { date_value: '2024-04-04', time_value: '04:04:04' }],
            'color_rgb_hex_column': '#423456'
          }
        ],
        inputs: [
          {
            'title': 'Very simple Resort', 'website': 'http://simple-resort.com', 'category': { modal_num_rows: 5, modal_option_index: 3, rowName: 'Resort' },
            'rating': '1.2', 'summary': 'A very simple resort', 'description': '_A resort!_',
            'no_of_rooms': '100', 'opened_on': { date_value: '2020-01-01', time_value: '01:01:01' }, 'date_col': '2020-12-01', 'luxurious': 'true',
            'boolean_array': ['true'], 'int4_array': ['1'], 'float4_array': ['-0.5'],
            'date_array': ['2002-02-02', '2002-02-02'], 'timestamp_array': [{ date_value: '2015-03-04', time_value: '12:12:12' }],
            'timestamptz_array': [{ date_value: '2005-05-05', time_value: '10:01:01' }, { date_value: '2004-04-04', time_value: '11:11:11' }]
          },
          {
            'category': { modal_num_rows: 5, modal_option_index: 4, rowName: 'Castle' }, 'website': 'http://best-castle.com',
            'rating': '3.4', 'opened_on': { date_value: '2015-05-05', time_value: '05:05:05' }, 'date_col': '2018-12-01',
            'summary': 'Best castle in the world!', 'description': '**Best castle in the world!**',
            'float4_array': ['5'],
            'color_rgb_hex_column': '#999999'
          }
        ]
      },
      submission: {
        tableDisplayname: 'Accommodations',
        resultColumnNames: [
          'Name of Accommodation', 'Website', 'Category', 'User Rating', 'Summary', 'Description', 'Number of Rooms',
          'Operational Since', 'date_col', 'Is Luxurious',
          'text_array', 'boolean_array', 'int4_array', 'float4_array', 'date_array', 'timestamp_array', 'timestamptz_array', 'color_rgb_hex_column'
        ],
        resultRowValues: [
          [
            'Very simple Resort', { url: 'http://simple-resort.com', caption: 'Link to Website' }, { url: '/product-edit:category/', caption: 'Resort' },
            '1.2000', 'A very simple resort', 'A resort!', '100', '2020-01-01 01:01:01', '2020-12-01', 'true',
            'val1', 'true', '1', '-0.5000', '2002-02-02, 2002-02-02', '2015-03-04 12:12:12',
            '2005-05-05 10:01:01, 2004-04-04 11:11:11', '#223456'
          ],
          [
            'Super 8 North Hollywood Motel', { url: 'http://best-castle.com', caption: 'Link to Website' }, { url: '/product-edit:category/', caption: 'Castle' },
            '3.4000', 'Best castle in the world!', 'Best castle in the world!', '35', '2015-05-05 05:05:05', '2018-12-01', 'false',
            'val2', 'false, false, true', '1, 2, 3', '5.0000', '', '', '2022-02-02 02:02:02, 2024-04-04 05:04:04', '#999999'
          ]
        ]
      }
    },
    {
      num_files: 1,
      filter: 'id=90008',
      presentation: {
        description: 'single edit file upload',
        ...fileTableDefaultPresentationProps,
        rowNames: ['90008'],
        values: [
          { 'fileid': '', 'uri': 'Four Points Sherathon 3', 'timestamp_txt': '' }
        ],
        inputs: [
          { 'fileid': '4', 'uri': testFiles[0], 'timestamp_txt': currentTimestampTimeStr }
        ]
      },
      submission: {
        tableDisplayname: 'file',
        resultColumnNames: ['fileid', 'uri', 'filename', 'bytes'],
        resultRowValues: [
          [
            '4',
            { caption: 'testfile500kb_edit.png', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/4/.png/` },
            'testfile500kb_edit.png',
            '512 kB'
          ]
        ]
      }
    },
    {
      num_files: 2,
      filter: 'id=any(3005,3006)@sort(id)',
      presentation: {
        description: 'multi edit file upload',
        ...fileTableDefaultPresentationProps,
        rowNames: ['3005', '3006'],
        values: [
          { 'fileid': '', 'uri': 'Four Points Sherathon 1', 'timestamp_txt': '' },
          { 'fileid': '', 'uri': 'Four Points Sherathon 2', 'timestamp_txt': '' }
        ],
        inputs: [
          { 'fileid': '5', 'uri': testFiles[0], 'timestamp_txt': currentTimestampTimeStr },
          { 'fileid': '6', 'uri': testFiles[1], 'timestamp_txt': currentTimestampTimeStr }
        ]
      },
      submission: {
        tableDisplayname: 'file',
        resultColumnNames: ['fileid', 'uri', 'filename', 'bytes'],
        resultRowValues: [
          [
            '5',
            { caption: 'testfile500kb_edit.png', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/5/.png/` },
            'testfile500kb_edit.png',
            '512 kB'
          ],
          [
            '6',
            { caption: 'testfile1MB_edit.txt', url: `/hatrac/js/chaise/${currentTimestampTimeStr}/6/.txt/` },
            'testfile1MB_edit.txt',
            '1.02 MB'
          ]
        ]
      }
    }
  ]
}


test.describe('Recordedit edit', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const [index, params] of testParams.tables.entries()) {
    const presentation = params.presentation;

    test(`${presentation.description}`, async ({ page, baseURL }, testInfo) => {

      // create files if this is the first one
      if (index === 0) {
        await test.step('create files', async () => {
          await createFiles(testFiles);
        });
      }

      await test.step('open recordedit page', async () => {
        const url = `${baseURL}/recordedit/#${getCatalogID(testInfo.project.name)}/${presentation.schemaName}:${presentation.tableName}`;
        await page.goto(url + '/' + params.filter);
      });

      // test everything related to the form
      await testFormPresentationAndValidation(page, baseURL, testInfo, presentation, true);

      await test.step('submit and save the data', async () => {
        let timeout: number | undefined;
        if (params.num_files > 0) {
          timeout = params.num_files * 30 * 1000;
        }
        await testSubmission(page, params.submission, true, timeout);
      });


      // remove files if this is the last one
      if (index === testParams.tables.length - 1) {
        await test.step('delete create files', async () => {
          await deleteFiles(testFiles);
          await deleteHatracNamespaces([`/hatrac/js/chaise/${currentTimestampTimeStr}`]);
        });
      }
    });
  }

  test('remove form button', async ({ page, baseURL }, testInfo) => {
    await test.step('open recordedit page', async () => {
      const url = `${baseURL}/recordedit/#${getCatalogID(testInfo.project.name)}/product-edit:booking`;
      await page.goto(url + '/id=any(1,2,3,4,5,6,7,8,9,10,11,12)@sort(id)');
    });

    await test.step('remove several forms and edit some of the data"', async () => {
      const formsToBeRemoved = [8, 6, 3, 2, 0];
      const originalNumRows = 12;

      await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(originalNumRows);

      for await (const [index, formIndex] of formsToBeRemoved.entries()) {
        await RecordeditLocators.getDeleteRowButton(page, formIndex).click();
        await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(originalNumRows - (index+1));
      }

      await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(originalNumRows - formsToBeRemoved.length);

      // the first form (formNumber=1) is not visible anymore
      const inp = RecordeditLocators.getInputForAColumn(page, 'price', 2);
      await inp.clear();
      await inp.fill('2500');
    });

    await test.step('submit and save data.', async () => {
      await testSubmission(page, {
        tableDisplayname: 'booking',
        resultColumnNames: ['id', 'accommodation_id', 'price', 'booking_date'],
        resultRowValues: [
          ['2', '2002', '2,500.0000', '2016-04-18 00:00:00'],
          ['5', '2003', '240.0000', '2016-01-25 00:00:00'],
          ['6', '2003', '320.0000', '2016-02-09 00:00:00'],
          ['8', '2004', '125.0000', '2016-03-12 00:00:00'],
          ['10', '2004', '110.0000', '2016-05-19 01:00:00'],
          ['11', '2004', '120.0000', '2015-11-10 00:00:00'],
          ['12', '2004', '180.0000', '2016-09-04 01:00:00'],
        ]
      }, true);
    });

  });
});
