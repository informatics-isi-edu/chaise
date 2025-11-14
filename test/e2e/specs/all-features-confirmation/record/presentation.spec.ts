/* eslint-disable max-len */
import { expect, Locator, test } from '@playwright/test';
import moment from 'moment';

// locators
import ExportLocators from '@isrd-isi-edu/chaise/test/e2e/locators/export';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import NavbarLocators from '@isrd-isi-edu/chaise/test/e2e/locators/navbar';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { APP_NAMES, DOWNLOAD_FOLDER } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { getCatalogID, getEntityRow } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { deleteDownloadedFiles, generateChaiseURL, getPageURLOrigin, testExportDropdown, testTooltip } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import { testRecordMainSectionValues, testRelatedTablePresentation, testShareCiteModal } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';

const testParams: any = {
  schema_name: 'product-record',
  table_name: 'accommodation',
  key: 'id=2002',
  title: 'Sherathon Hotel',
  subTitle: 'Accommodations',
  tableComment: 'List of different types of accommodations',
  inlineTableWithCommentName: 'booking',
  inlineTableComment: 'booking inline related table comment',
  tocHeaders: [
    'Summary', 'accommodation_collections (1)', 'table_w_aggregates (1)', 'accommodation_image_assoc (1)', 'table_w_invalid_row_markdown_pattern (1)', 'accommodation_image (2+)'
  ],
  tables_order: ['accommodation_image', 'media'],
  file_names: [
    'Accommodations.csv',
    // updated in test() with 1 more rows
    'BDBag.json'
  ],
  related_table_name_with_page_size_annotation: 'accommodation_image',
  inline_none_test: {
    index: 4,
    displayname: 'booking'
  },
  page_size: 2,
  related_tables: [
    {
      title: 'accommodation_image',
      displayname: 'accommodation_image',
      columns: ['id', 'filename', 'uri', 'content_type', 'bytes', 'timestamp', 'image_width', 'image_height', 'preview'],
      data: [
        { id: 3005, filename: 'Four Points Sherathon 1', uri: 'http://images.trvl-media.com/hotels/1000000/30000/28200/28110/28110_190_z.jpg', content_type: 'image/jpeg', bytes: 0, timestamp: '2016-01-18T00:00:00-08:00', image_width: null, image_height: null, preview: null },
        { id: 3006, filename: 'Four Points Sherathon 2', uri: 'http://images.trvl-media.com/hotels/1000000/30000/28200/28110/28110_190_z.jpg', content_type: 'image/jpeg', bytes: 0, timestamp: '2016-06-05T00:00:00-07:00', image_width: null, image_height: null, preview: null }
      ]
    },
    {
      title: 'media',
      displayname: '<strong>media</strong>',
      columns: ['id'],
      data: []
    }
  ],
  no_related_data: {
    key: 'id=4004',
    tables_order: ['accommodation_image', 'media']
  },
  sidePanelTest: {
    schema_name: 'product-record',
    table_name: 'accommodation_collection',
    key: 'id=2003',
    toc_count: 8,
    table_to_show: 'Categories_5',
    side_panel_table_order: ['Summary', 'Categories_collection (5)', 'media (1)', 'Categories_collection_2 (5)', 'Categories_3 (5)', 'Categories_4 (5)', 'Categories_5 (5)', 'Categories_6 (5)']
  },
  sharePopupParams: {
    title: 'Share and Cite',
    // link: '', // updated in test()
    // the table has history-capture: true
    hasVersionedLink: true,
    verifyVersionedLink: true,
    citation: 'accommodation_inbound1 one, accommodation_inbound1 three, accommodation_inbound1 five(3). Sherathon Hotel. accommodation_outbound1_outbound3 one http://www.starwoodhotels.com/sheraton/index.html (' + moment().format('YYYY') + ').',
    // bibtextFile: '' // updated in test()
  },
  inline_columns: [
    {
      title: 'a related entity with a path of length 3',
      tableName: 'accommodation_collection',
      schemaName: 'product-record',
      displayname: 'accommodation_collections',
      baseTableName: 'Accommodations',
      count: 1,
      canEdit: true,
      canCreate: false,
      isInline: true,
      isTableMode: false,
      viewMore: {
        displayname: 'accommodation_collections',
        filter: 'AccommodationsSherathon Hotel'
      },
      rowValues: [
        ['2000', 'Sherathon Hotel']
      ],
      rowViewPaths: [[{
        column: 'id',
        value: '2000'
      }]]
    },
    {
      title: 'a related entity with aggregate columns',
      tableName: 'table_w_aggregates',
      schemaName: 'product-record',
      displayname: 'table_w_aggregates',
      baseTableName: 'Accommodations',
      count: 1,
      canEdit: true,
      canCreate: false, // it has filter in source, so create is disabled
      isInline: true,
      isTableMode: false,
      viewMore: {
        name: 'table_w_aggregates',
        displayname: 'table_w_aggregates',
        filter: 'AccommodationsSherathon Hotel'
      },
      rowValues: [
        ['3', '102', '102', '1', '1']
      ],
      rowViewPaths: [[{
        column: 'id',
        value: '3'
      }]]
    },
    {
      title: 'a related entity with association between accomodation and image',
      tableName: 'accommodation_image_assoc',
      schemaName: 'product-record',
      displayname: 'accommodation_image_assoc',
      baseTableName: 'Accommodations',
      isAssociation: true,
      associationLeafTableName: 'file',
      entityMarkdownName: '3005',
      count: 1,
      pageSize: 2,
      canEdit: true,
      canCreate: true,
      canDelete: true, // NOTE: was canUnlink
      isInline: true,
      isTableMode: false,
      viewMore: {
        name: 'file',
        displayname: 'file',
        filter: 'accommodation_image_assocSherathon Hotel'
      },
      rowValues: [
        ['3005', 'Four Points Sherathon 1', 'http://images.trvl-media.com/hotels/1000000/30000/28200/28110/28110_190_z.jpg', 'image/jpeg', '0', '2016-01-18 00:00:00', '', '', '']
      ],
      rowViewPaths: [[{
        column: 'id',
        value: '3005'
      }]]
    },
    {
      title: 'a related entity with invalid row markdown pattern',
      tableName: 'table_w_invalid_row_markdown_pattern',
      schemaName: 'product-record',
      displayname: 'table_w_invalid_row_markdown_pattern',
      baseTableName: 'Accommodations',
      isInline: true,
      isTableMode: true,
      viewMore: {
        name: 'table_w_invalid_row_markdown_pattern',
        displayname: 'table_w_invalid_row_markdown_pattern',
        filter: 'AccommodationsSherathon Hotel'
      },
      rowValues: [
        ['two']
      ],
      rowViewPaths: [[{
        column: 'id',
        value: '2002'
      }]]
    }
  ],
  noTooltipHeaderTest: {
    commentFalse: {
      schemaName: 'product-record',
      tableName: 'booking',
      key: 'id=1'
    },
    noComment: {
      schemaName: 'product-record',
      tableName: 'accommodation_outbound1',
      key: 'id=o1_1'
    }
  }
};

test.describe('View existing record', () => {
  test.describe.configure({ mode: 'parallel' });

  test(`For table ${testParams.table_name}`, async ({ page, baseURL }, testInfo) => {
    const catalogID = getCatalogID(testInfo.project.name);

    await test.step('should load record page', async () => {
      await page.goto(generateChaiseURL(APP_NAMES.RECORD, testParams.schema_name, testParams.table_name, testInfo, baseURL) + `/${testParams.key}`);
      await RecordLocators.waitForRecordPageReady(page);
    });

    await test.step('go to snapshot should not be visible based on chaiseConfig', async () => {
      await expect.soft(NavbarLocators.getGoToSnapshotNavbarButton(page)).not.toBeAttached();
    });

    await test.step('presentation of the record page', async () => {
      const keyValues = [{ column: 'id', value: '2002' }];
      const ridValue = getEntityRow(testInfo, testParams.schema_name, testParams.table_name, keyValues).RID;

      const origin = await getPageURLOrigin(page);

      /**
       * this is used for testing the values of related tables.
       * The actual value that we want to test is the inner element of the cell.
       */
      const findRelatedMarkdownValue = (value: Locator) => value.locator('.related-markdown-content');

      // update testParams now that we have testInfo
      testParams.file_names = [
        'Accommodations.csv',
        `accommodation_${ridValue}.zip`,
        'BDBag.json'
      ];

      testParams.sharePopupParams.link = `${origin}/id/${catalogID}/${ridValue}`;
      testParams.sharePopupParams.bibtextFile = `${testParams.table_name}_${ridValue}.bib`;

      testParams.columns = [
        { title: 'Id', value: '2002', type: 'serial4' },
        { title: 'Name of Accommodation', value: 'Sherathon Hotel, accommodation_inbound3 one| accommodation_inbound3 three| accommodation_inbound3 five', type: 'text' },
        {
          title: 'Website', type: 'text', comment: 'A valid url of the accommodation', match: 'html',
          value: {
            url: 'http://www.starwoodhotels.com/sheraton/index.html',
            caption: 'Link to Website'
          }
        },
        {
          title: 'Category', type: 'text', comment: 'can support markdown',
          value: {
            url: generateChaiseURL(APP_NAMES.RECORD, testParams.schema_name, 'category', testInfo, baseURL) + `/RID=${getEntityRow(testInfo, testParams.schema_name, 'category', [{ column: 'id', value: '10003' }]).RID}`,
            caption: 'Hotel'
          }
        },
        {
          title: 'booking', type: 'inline',
          value: {
            value: ['2', '350.0000', '2016-04-18 00:00:00', '4', '200.0000', ' 2016-05-31 00:00:00'].join(' '),
            valueLocator: findRelatedMarkdownValue
          }
        },
        { title: 'User Rating', value: '4.3000', type: 'float4', markdown_title: '<strong>User Rating</strong>' },
        { title: 'Summary', value: 'Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.', type: 'longtext' },
        { title: 'Description', type: 'markdown', match: 'html', value: 'CARING. SHARING. DARING.\nRadisson® is synonymous with outstanding levels of service and comfort delivered with utmost style. And today, we deliver even more to make sure we maintain our position at the forefront of the hospitality industry now and in the future.\nOur hotels are service driven, responsible, socially and locally connected and demonstrate a modern friendly attitude in everything we do. Our aim is to deliver our outstanding Yes I Can! SM service, comfort and style where you need us.\nTHE RADISSON® WAY Always positive, always smiling and always professional, Radisson people set Radisson apart. Every member of the team has a dedication to Yes I Can! SM hospitality – a passion for ensuring the total wellbeing and satisfaction of each individual guest. Imaginative, understanding and truly empathetic to the needs of the modern traveler, they are people on a special mission to deliver exceptional Extra Thoughtful Care.\n' },
        { title: 'Number of Rooms', value: '23', type: 'int2' },
        {
          title: 'Cover Image', type: 'int2',
          value: {
            url: generateChaiseURL(APP_NAMES.RECORD, testParams.schema_name, 'file', testInfo, baseURL) + `/RID=${getEntityRow(testInfo, testParams.schema_name, 'file', [{ column: 'id', value: '3005' }]).RID}`,
            caption: '3005'
          }
        },
        { title: 'Thumbnail', value: null, type: 'int4' },
        { title: 'Operational Since', value: '2008-12-09 00:00:00', type: 'timestamptz' },
        { title: 'Is Luxurious', value: 'true', type: 'boolean' },
        {
          title: 'accommodation_collections', value: {
            value: 'Sherathon Hotel, accommodation_outbound1_outbound2 one, max: Sherathon Hotel',
            valueLocator: findRelatedMarkdownValue
          }, comment: 'collections', type: 'inline'
        },
        {
          title: 'table_w_aggregates', comment: 'has aggregates',
          value: {
            url: generateChaiseURL(APP_NAMES.RECORD, testParams.schema_name, 'table_w_aggregates', testInfo, baseURL) + `/RID=${getEntityRow(testInfo, testParams.schema_name, 'table_w_aggregates', [{ column: 'id', value: '3' }]).RID}`,
            caption: '3',
            valueLocator: findRelatedMarkdownValue
          }
        },
        { title: '# thumbnail collection', comment: 'Count of thumbnail collection', value: '1', markdown_title: '# thumbnail collection' },
        { title: '# distinct thumbnail collection', comment: 'Count distinct of thumbnail collection', value: '1', markdown_title: '# distinct thumbnail collection' },
        { title: 'agg column with waitfor entityset and all-outbound', comment: 'Minimum of title', value: 'Sherathon Hotel, accommodation_outbound1_outbound4 one, accommodation_inbound2 one| accommodation_inbound2 three| accommodation_inbound2 five', markdown_title: 'agg column with waitfor entityset and all-outbound' },
        { title: 'Max Name of accommodation_collection', comment: 'maximum of title', value: 'Sherathon Hotel', markdown_title: 'Max Name of accommodation_collection' },
        { title: 'json_col', value: null },
        { title: 'json_col_with_markdown', value: 'Status is: “delivered”', match: 'html' },
        {
          title: 'accommodation_image_assoc', comment: 'Accommodation Image',
          value: {
            url: generateChaiseURL(APP_NAMES.RECORD, testParams.schema_name, 'file', testInfo, baseURL) + `/RID=${getEntityRow(testInfo, testParams.schema_name, 'file', [{ column: 'id', value: '3005' }]).RID}`,
            caption: '3005',
            valueLocator: findRelatedMarkdownValue
          }
        },
        { title: 'table_w_invalid_row_markdown_pattern', 'value': true }, // set value to true for testing columnNames but skip testing value (since it's a recordset table)
        { title: 'virtual column wait_for all-outbound', 'value': 'virtual value of 2002 with title Sherathon Hotel', markdown_title: 'virtual column wait_for all-outbound' },
        { title: 'virtual column wait_for agg', 'value': 'virtual Sherathon Hotel', markdown_title: 'virtual column wait_for agg' },
        { title: 'virtual column wait_for entity set', 'value': 'Sherathon Hotel', markdown_title: 'virtual column wait_for entity set' },
        { title: 'color_rgb_hex_column', value: '  #323456', match: 'html' }
      ];

      await test.step('delete files that may have been downloaded before', async () => {
        await deleteDownloadedFiles(testParams.file_names.map((name: string) => {
          return `${DOWNLOAD_FOLDER}/${name}`
        }));
      });

      const notNullColumns = testParams.columns.filter((c: any) => {
        return !c.hasOwnProperty('value') || c.value !== null;
      });

      await test.step(`should have '${testParams.title}' as title`, async () => {
        await expect.soft(RecordLocators.getEntityTitleElement(page)).toHaveText(testParams.title);
      });

      await test.step(`should have '${testParams.subTitle}' as subTitle`, async () => {
        await expect.soft(RecordLocators.getEntitySubTitleElement(page)).toHaveText(testParams.subTitle);
      });

      await test.step('subTitle should have the correct table tooltip.', async () => {
        await testTooltip(
          RecordLocators.getEntitySubTitleElement(page),
          testParams.tableComment,
          APP_NAMES.RECORD,
          true
        );
      });

      await test.step('should have the correct head title using the heuristics for record app', async () => {
        const ccHeadTitle = 'show me on the navbar!';
        // <table-name>: <row-name> | chaiseConfig.headTitle
        // NOTE: subTitle and title are badly named
        expect.soft(await page.title()).toContain(`${testParams.subTitle}: ${testParams.title} | ${ccHeadTitle}`);
      });

      await test.step(`should show ${notNullColumns.length} columns only`, async () => {
        await expect.soft(RecordLocators.getColumns(page)).toHaveCount(notNullColumns.length);
      });

      await test.step('should show the action buttons properly', async () => {
        const createButton = RecordLocators.getCreateRecordButton(page),
          editButton = RecordLocators.getEditRecordButton(page),
          deleteButton = RecordLocators.getDeleteRecordButton(page),
          exportButton = ExportLocators.getExportDropdown(page),
          showAllRTButton = RecordLocators.getShowAllRelatedEntitiesButton(page),
          shareButton = RecordLocators.getShareButton(page);

        await expect.soft(createButton).toBeVisible();
        await expect.soft(editButton).toBeVisible();
        await expect.soft(deleteButton).toBeVisible();
        await expect.soft(showAllRTButton).toBeVisible();
        await expect.soft(exportButton).toBeVisible();
        await expect.soft(shareButton).toBeVisible();
      });

      await testShareCiteModal(page, testInfo, testParams.sharePopupParams);

      await testExportDropdown(page, testParams.file_names, APP_NAMES.RECORD);

      await test.step('should render columns which are specified to be visible and in order', async () => {
        const pageColumns = RecordLocators.getAllColumnNames(page);

        await expect.soft(pageColumns).toHaveCount(notNullColumns.length);

        const columnTitles = notNullColumns.map((col: any) => col.title);
        await expect.soft(pageColumns).toHaveText(columnTitles);
      });

      await test.step('should show proper tooltips for columns that have it.', async () => {
        const columns = notNullColumns.filter((c: any) => (typeof c.comment === 'string'));

        for (const col of columns) {
          const colEl = RecordLocators.getColumnNameElement(page, col.title);
          // col.comment should be defined and a string since we filtered notNullColumns to begin this test
          const comment = col.comment ? col.comment : '';
          await testTooltip(colEl, comment, APP_NAMES.RECORD, true);
        }

      });

      await test.step('should show inline comment for inline table with one defined', async () => {
        const commentEl = RecordLocators.getInlineRelatedTableInlineComment(page, testParams.inlineTableWithCommentName);
        await expect.soft(commentEl).toHaveText(testParams.inlineTableComment);
      });

      await test.step('should render column names based on their markdown pattern.', async () => {
        const columns = testParams.columns.filter((c: any) => (c.markdown_title));

        for (const col of columns) {
          const title = col.markdown_title ? col.markdown_title : '';
          const colEl = RecordLocators.getColumnNameElement(page, title);

          const html = await colEl.locator('span').innerHTML();
          expect.soft(html).toContain(col.markdown_title);
        }
      });

      await test.step('should validate the values of each column', async () => {
        await expect.soft(RecordLocators.getAllColumnValues(page)).toHaveCount(notNullColumns.length);

        const columns = testParams.columns.filter((c: any) => (c.hasOwnProperty('value') && c.value));
        const colNames = columns.map((col: any) => col.title);
        const colValues = columns.map((col: any) => col.value)

        await testRecordMainSectionValues(page, colNames, colValues);
      });

      await test.step('should show related table names and their tables', async () => {
        const relatedTables = testParams.related_tables,
          tableCount = relatedTables.length;

        await expect.soft(RecordLocators.getRelatedSectionSpinner(page)).not.toBeVisible();

        const rtTitles = RecordLocators.getDisplayedRelatedTableTitles(page);
        await expect.soft(rtTitles).toHaveCount(relatedTables.length);

        // check the headings have the right name and in the right order
        // tables should be in order based on annotation for visible foreign_keys
        // Headings have a '-' when page loads, and a count after them
        await expect.soft(rtTitles).toHaveText(testParams.tables_order);

        let rt;
        // rely on the UI data for looping, not expectation data
        for (let i = 0; i < tableCount; i++) {
          rt = relatedTables[i];

          // verify all columns are present
          const rsTable = RecordLocators.getRelatedTable(page, rt.displayname);
          const columns = RecordsetLocators.getColumnNames(rsTable);
          const systemColumns = ['RID', 'RCT', 'RMT', 'RCB', 'RMB'];

          const numCols = await columns.count();
          let index = 0;
          for (let j = 0; j < numCols; j++) {
            const columnName = await columns.nth(j).innerText();
            if (systemColumns.indexOf(columnName) === -1) {
              expect.soft(columnName).toEqual(rt.columns[index]);
              index++;
            }
          }

          // verify all rows are present
          await expect.soft(RecordsetLocators.getRows(rsTable)).toHaveCount(rt.data.length);
          await expect.soft(rtTitles.nth(i)).toHaveText(rt.title);
        }
      });

      /**
       * NOTE this test should be improved
       * while the rest of test cases are not making any assumption about the page,
       * this one is assuming certain inline related entity
       */
      await test.step('visible column related table with inline inbound fk should display `None` in markdown display mode if no data was found.', async () => {
        const displayname = testParams.inline_none_test.displayname;

        const relatedEl = RecordLocators.getEntityRelatedTable(page, displayname);
        const confirmModal = ModalLocators.getConfirmDeleteModal(page);
        const confirmButton = ModalLocators.getOkButton(confirmModal);
        const toggleDisplayButton = RecordLocators.getRelatedTableToggleDisplay(page, displayname, true);

        await toggleDisplayButton.click();

        // make sure the table shows up
        const rsTable = RecordLocators.getRelatedTable(page, displayname);
        await expect.soft(rsTable).toBeVisible();

        // delete the first row
        await RecordsetLocators.getRowDeleteButton(rsTable, 0).click();
        await expect.soft(confirmModal).toBeVisible();
        await confirmButton.click();
        await expect.soft(confirmModal).not.toBeVisible();

        // make sure there is 1 row
        await expect.soft(RecordsetLocators.getRows(rsTable)).toHaveCount(1);

        // delete the other row
        await RecordsetLocators.getRowDeleteButton(rsTable, 0).click();
        await expect.soft(confirmModal).toBeVisible();
        await confirmButton.click();
        await expect.soft(confirmModal).not.toBeVisible();

        // make sure there are zero rows
        await expect.soft(RecordsetLocators.getRows(rsTable)).toHaveCount(0);

        // switch the display mode
        await toggleDisplayButton.click();

        const md = RecordLocators.getValueMarkdownContainer(relatedEl);
        await expect.soft(md).toHaveText('None');
      });

      /**
       * NOTE this test should be improved
       * while the rest of test cases are not making any assumption about the page,
       * this one is assuming certain inline related entity.
       * This test case also relies on the previous `it`
       */
      await test.step('empty inline inbound fks should disappear when `Hide All Related Records` was clicked.', async () => {
        const showAllRTButton = RecordLocators.getShowAllRelatedEntitiesButton(page);
        const displayname = testParams.inline_none_test.displayname;

        await showAllRTButton.click();
        await expect.soft(RecordLocators.getEntityRelatedTable(page, displayname)).not.toBeVisible();
        await showAllRTButton.click();
      });

      // Related tables are contextualized with `compact/brief`, but if that is not specified it will inherit from `compact`
      await test.step('should honor the page_size annotation for the table, file, in the compact context based on inheritance.', async () => {
        const relatedTableName = testParams.related_table_name_with_page_size_annotation;
        const rsTable = RecordLocators.getRelatedTable(page, relatedTableName);

        await expect.soft(RecordsetLocators.getRows(rsTable)).toHaveCount(testParams.page_size);
      });

      await test.step('clicking the related table heading should change the heading and hide the table.', async () => {
        const displayname = testParams.related_tables[0].title;
        const panelHeading = RecordLocators.getRelatedTableHeading(page, displayname);
        const rsTable = RecordLocators.getRelatedTable(page, displayname);

        // related table should be open by default
        await expect.soft(panelHeading).not.toHaveAttribute('class', /collapsed/);
        await expect.soft(rsTable).toBeVisible();

        await panelHeading.click();
        await expect.soft(panelHeading).toHaveAttribute('class', /collapsed/);
        await expect.soft(rsTable).not.toBeVisible();
      });

      // There is a media table linked to accommodations but this accommodation (Sheraton Hotel) doesn't have any media
      await test.step('should show and hide a related table with zero values upon clicking a link to toggle visibility of related entities', async () => {
        const showAllRTButton = RecordLocators.getShowAllRelatedEntitiesButton(page),
          tableDisplayname = '<strong>media</strong>',
          noResultsMessage = 'No Results Found';

        const rsTable = RecordLocators.getRelatedTable(page, tableDisplayname);
        await showAllRTButton.click();
        await expect.soft(rsTable).not.toBeVisible();

        await showAllRTButton.click();
        // empty related table should show
        await expect.soft(rsTable).toBeVisible();

        // check the no results text appears properly
        await expect.soft(RecordsetLocators.getNoResultsRow(rsTable)).toHaveText(noResultsMessage);

        await showAllRTButton.click();
        await expect.soft(rsTable).not.toBeVisible();
      });

      await test.step('should show the related table names in the correct order in the Table of Contents (including inline)', async () => {
        await expect.soft(RecordLocators.getSidePanelHeadings(page)).toHaveText(testParams.tocHeaders);
      });

      await test.step('regarding inline related entities, ', async () => {

        await test.step('refresh the page', async () => {
          await page.reload();
          await RecordLocators.waitForRecordPageReady(page);
        });

        for (let i = 0; i < testParams.inline_columns.length; i++) {
          const params = testParams.inline_columns[i];
          params.baseTable = testParams.subTitle;

          await test.step(`for ${params.title},`, async () => {
            await testRelatedTablePresentation(page, testInfo, params);
          });
        }
      });

      await test.step('delete files that may have been downloaded during tests', async () => {
        await deleteDownloadedFiles(testParams.file_names.map((name: string) => {
          return `${DOWNLOAD_FOLDER}/${name}`
        }));
      });
    });
  });

  test('For a record with all of its related tables as empty', async ({ page, baseURL }, testInfo) => {
    const params = testParams.no_related_data;

    await test.step('should load record page', async () => {
      await page.goto(generateChaiseURL(APP_NAMES.RECORD, testParams.schema_name, testParams.table_name, testInfo, baseURL) + `/${params.key}`);
      await RecordLocators.waitForRecordPageReady(page);
    });

    await test.step('should show all of the related tables in the correct order.', async () => {

      await expect.soft(RecordLocators.getRelatedTables(page)).toHaveCount(params.tables_order.length);

      const showAllRTButton = RecordLocators.getShowAllRelatedEntitiesButton(page);

      await expect.soft(RecordLocators.getDisplayedRelatedTableTitles(page)).toHaveText(params.tables_order);
      await expect.soft(showAllRTButton).toHaveText('Hide empty sections');

      await showAllRTButton.click();
      await expect.soft(RecordLocators.getRelatedTables(page)).toHaveCount(0);
      await expect.soft(RecordLocators.getRelatedTables(page)).not.toHaveCount(params.tables_order.length);

      // show the related tables again for the next test
      await showAllRTButton.click();
    });

    await test.step('should have "booking" related table with bulk edit disabled when there are no rows in the table', async () => {
      const btn = RecordLocators.getRelatedTableBulkEditLink(page, 'booking', true);

      await expect.soft(btn).toBeVisible();
      await expect.soft(btn).toBeDisabled();
    });
  });

  test('For side panel table of contents in Record App', async ({ page, baseURL }, testInfo) => {
    const params = testParams.sidePanelTest;

    await test.step('should load record page', async () => {
      await page.goto(generateChaiseURL(APP_NAMES.RECORD, params.schema_name, params.table_name, testInfo, baseURL) + `/${params.key}`);
      await RecordLocators.waitForRecordPageReady(page);
    });

    await test.step('Table of contents should be displayed by default', async () => {
      await expect.soft(RecordLocators.getSidePanel(page)).toBeVisible();
    });

    await test.step('On click of Related table name in TOC, page should move to the contents and open the table details', async () => {
      const rtTableHeading = RecordLocators.getRelatedTableAccordionContent(page, params.table_to_show);

      await RecordLocators.getSidePanelItemById(page, 5).click();
      // related table should be visible
      await expect.soft(rtTableHeading).toBeVisible();
      await expect.soft(rtTableHeading).toContainClass('show');
    });

    await test.step('Record count along with heading should match for the panel and related table content should be in correct order', async () => {
      const tableNames = RecordLocators.getSidePanelHeadings(page);

      await expect.soft(tableNames).toHaveCount(params.toc_count);
      await expect.soft(tableNames).toHaveText(params.side_panel_table_order);
    });

    await test.step('Side panel should hide/show by clicking pull button', async () => {
      const recPan = RecordLocators.getSidePanel(page);
      const hideTocBtn = RecordLocators.getHideTocBtn(page);

      await expect.soft(hideTocBtn.locator('.chaise-icon')).toContainClass('chaise-sidebar-close');
      await expect.soft(recPan).toContainClass('open-panel');

      await hideTocBtn.click();
      const showTocBtn = RecordLocators.getShowTocBtn(page);

      await expect.soft(showTocBtn.locator('.chaise-icon')).toContainClass('chaise-sidebar-open');
      await expect.soft(recPan).toContainClass('close-panel');
    });
  });

  test('using comment:false should suppress the model comment and hide subtitle tooltip', async ({page, baseURL}, testInfo) => {
    const params = testParams.noTooltipHeaderTest.commentFalse;
    await page.goto(generateChaiseURL(APP_NAMES.RECORD, params.schemaName, params.tableName, testInfo, baseURL) + `/${params.key}`);
    await RecordLocators.waitForRecordPageReady(page);
    await expect.soft(RecordLocators.getEntitySubTitleElement(page)).not.toContainClass('chaise-icon-for-tooltip');
  });

  test('tables without any comment should not show the subtitle tooltip', async ({page, baseURL}, testInfo) => {
    const params = testParams.noTooltipHeaderTest.noComment;
    await page.goto(generateChaiseURL(APP_NAMES.RECORD, params.schemaName, params.tableName, testInfo, baseURL) + `/${params.key}`);
    await RecordLocators.waitForRecordPageReady(page);
    await expect.soft(RecordLocators.getEntitySubTitleElement(page)).not.toContainClass('chaise-icon-for-tooltip');
  });
});
