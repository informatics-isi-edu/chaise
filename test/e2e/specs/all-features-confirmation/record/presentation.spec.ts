/* eslint-disable max-len */
import { expect, Locator, test } from '@playwright/test';
import fs from 'fs';
import moment from 'moment';

// locators
import ExportLocators from '@isrd-isi-edu/chaise/test/e2e/locators/export';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { getCatalogID, getEntityRow } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { deleteDownloadedFiles, testTooltip } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import { testRelatedTablePresentation, testShareCiteModal } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';

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
    // updated in test() with 2 more rows
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
  ]
};

test.describe('View existing record', () => {
  test.describe.configure({ mode: 'parallel' });

  test(`For table ${testParams.table_name}`, async ({ page, baseURL }, testInfo) => {
    const catalogID = getCatalogID(testInfo.project.name);
    let cc: any;

    await test.step('should load record page', async () => {
      const PAGE_URL = `/record/#${catalogID}/${testParams.schema_name}:${testParams.table_name}/${testParams.key}`;

      await page.goto(`${baseURL}${PAGE_URL}`);
      await RecordLocators.waitForRecordPageReady(page);

      cc = await page.evaluate(() => {
        // cast to 'any' typed variable so we can avoid typescript errors
        const windowRef: any = window;
        return windowRef.chaiseConfig;
      });
    });

    await test.step('should load document title defined in chaise-config.js and have deleteRecord=true, resolverImplicitCatalog=2, and shareCite defined', async () => {
      expect.soft(cc.deleteRecord).toBeTruthy();
      expect.soft(cc.resolverImplicitCatalog).toBe(100);

      expect.soft(cc.shareCite).toBeDefined();
      expect.soft(cc.shareCite.acls.show).toEqual(['*']);
      expect.soft(cc.shareCite.acls.enable).toEqual(['*']);
    });

    await test.step('presentation of the record page', async () => {
      const keyValues = [{ column: 'id', value: '2002' }];
      const ridValue = getEntityRow(testInfo, testParams.schema_name, testParams.table_name, keyValues).RID;

      const origin = await page.evaluate(() => window.origin);

      // update testParams now that we have testInfo
      testParams.file_names = [
        'Accommodations.csv',
        `accommodation_${ridValue}.zip`,
        `accommodation_${ridValue}.bib`,
        'BDBag.json'
      ];

      testParams.sharePopupParams.link = `${origin}/id/${catalogID}/${ridValue}`;
      testParams.sharePopupParams.bibtextFile = `${testParams.table_name}_${ridValue}.bib`;

      testParams.columns = [
        { title: 'Id', value: '2002', type: 'serial4' },
        { title: 'Name of Accommodation', value: 'Sherathon Hotel, accommodation_inbound3 one| accommodation_inbound3 three| accommodation_inbound3 five', type: 'text' },
        { title: 'Website', value: '<p><a href="http://www.starwoodhotels.com/sheraton/index.html" class="external-link-icon">Link to Website</a></p>\n', type: 'text', comment: 'A valid url of the accommodation', match: 'html' },
        {
          title: 'Category', value: 'Hotel', type: 'text', comment: 'can support markdown',
          presentation: {
            type: 'url',
            url: `${baseURL}/record/#${catalogID}/${testParams.schema_name}:category/`,
            table_name: 'category',
            key_value: [{ column: 'id', value: '10003' }]
          }
        },
        { title: 'booking', value: '<p><strong class="vocab">2</strong> <strong class="vocab">350.0000</strong> <strong class="vocab">2016-04-18 00:00:00</strong> <strong class="vocab">4</strong> <strong class="vocab">200.0000</strong> <strong class="vocab">2016-05-31 00:00:00</strong></p>\n', type: 'inline' },
        { title: 'User Rating', value: '4.3000', type: 'float4', markdown_title: '<strong>User Rating</strong>' },
        { title: 'Summary', value: 'Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.', type: 'longtext' },
        { title: 'Description', type: 'markdown', match: 'html', value: '<p><strong>CARING. SHARING. DARING.</strong><br>\nRadisson<sup>®</sup> is synonymous with outstanding levels of service and comfort delivered with utmost style. And today, we deliver even more to make sure we maintain our position at the forefront of the hospitality industry now and in the future.<br>\nOur hotels are service driven, responsible, socially and locally connected and demonstrate a modern friendly attitude in everything we do. Our aim is to deliver our outstanding <code>Yes I Can!</code> <sup>SM</sup> service, comfort and style where you need us.</p>\n<p><strong>THE RADISSON<sup>®</sup> WAY</strong> Always positive, always smiling and always professional, Radisson people set Radisson apart. Every member of the team has a dedication to <code>Yes I Can!</code> <sup>SM</sup> hospitality – a passion for ensuring the total wellbeing and satisfaction of each individual guest. Imaginative, understanding and truly empathetic to the needs of the modern traveler, they are people on a special mission to deliver exceptional Extra Thoughtful Care.</p>\n' },
        { title: 'Number of Rooms', value: '23', type: 'int2' },
        {
          title: 'Cover Image', value: '3005', type: 'int2',
          presentation: {
            type: 'url',
            url: `${baseURL}/record/#${catalogID}/${testParams.schema_name}:file/`,
            table_name: 'file',
            key_value: [{ column: 'id', value: '3005' }]
          }
        },
        { title: 'Thumbnail', value: null, type: 'int4' },
        { title: 'Operational Since', value: '2008-12-09 00:00:00', type: 'timestamptz' },
        { title: 'Is Luxurious', value: 'true', type: 'boolean' },
        { title: 'accommodation_collections', value: '<p>Sherathon Hotel, accommodation_outbound1_outbound2 one, max: Sherathon Hotel</p>', comment: 'collections', type: 'inline' },
        {
          title: 'table_w_aggregates', value: '3', comment: 'has aggregates',
          presentation: {
            type: 'inline',
            url: `${baseURL}/record/#${catalogID}/${testParams.schema_name}:table_w_aggregates/`,
            table_name: 'table_w_aggregates', key_value: [{ column: 'id', value: '3' }]
          }
        },
        { title: '# thumbnail collection', comment: 'Count of thumbnail collection', value: '1', markdown_title: '# thumbnail collection' },
        { title: '# distinct thumbnail collection', comment: 'Count distinct of thumbnail collection', value: '1', markdown_title: '# distinct thumbnail collection' },
        { title: 'agg column with waitfor entityset and all-outbound', comment: 'Minimum of title', value: 'Sherathon Hotel, accommodation_outbound1_outbound4 one, accommodation_inbound2 one| accommodation_inbound2 three| accommodation_inbound2 five', markdown_title: 'agg column with waitfor entityset and all-outbound' },
        { title: 'Max Name of accommodation_collection', comment: 'maximum of title', value: 'Sherathon Hotel', markdown_title: 'Max Name of accommodation_collection' },
        { title: 'json_col', value: null },
        { title: 'json_col_with_markdown', value: '<p>Status is: “delivered”</p>\n', match: 'html' },
        {
          title: 'accommodation_image_assoc', comment: 'Accommodation Image', value: '3005',
          presentation: {
            type: 'inline',
            url: `${baseURL}/record/#${catalogID}/${testParams.schema_name}:file/`,
            table_name: 'file',
            key_value: [{ column: 'id', value: '3005' }]
          }
        },
        { title: 'table_w_invalid_row_markdown_pattern' },
        { title: 'virtual column wait_for all-outbound', 'value': 'virtual value of 2002 with title Sherathon Hotel', markdown_title: 'virtual column wait_for all-outbound' },
        { title: 'virtual column wait_for agg', 'value': 'virtual Sherathon Hotel', markdown_title: 'virtual column wait_for agg' },
        { title: 'virtual column wait_for entity set', 'value': 'Sherathon Hotel', markdown_title: 'virtual column wait_for entity set' },
        { title: 'color_rgb_hex_column', value: '<p><span class="chaise-color-preview" style="background-color:#323456"> </span> #323456</p>\n', match: 'html' }
      ];

      if (!process.env.CI) {
        await test.step('delete files', async () => {
          // delete files that may have been downloaded before
          await deleteDownloadedFiles(testParams.file_names);
        });
      }

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
        // <table-name>: <row-name> | chaiseConfig.headTitle
        // NOTE: subTitle and title are badly named
        expect.soft(await page.title()).toContain(`${testParams.subTitle}: ${testParams.title} | ${cc.headTitle}`);
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

      await test.step('should have 3 options in the export dropdown menu.', async () => {
        const exportButton = ExportLocators.getExportDropdown(page);

        await exportButton.click();
        await expect.soft(ExportLocators.getExportOptions(page)).toHaveCount(3);
        // close the dropdown
        await exportButton.click();
      });

      if (!process.env.CI) {
        await test.step('should have "This record (CSV)" as a download option and download the file.', async () => {
          await ExportLocators.getExportDropdown(page).click();

          const csvOption = ExportLocators.getExportOption(page, 'This record (CSV)');
          await expect.soft(csvOption).toHaveText('This record (CSV)');

          const fileLocation = `${process.env.PWD}/test/e2e/${testParams.file_names[0]}`;
          const downloadPromise = page.waitForEvent('download');

          await csvOption.click();
          const download = await downloadPromise;
          await download.saveAs(fileLocation);

          expect.soft(fs.existsSync(fileLocation)).toBeTruthy();
        });

        await test.step('should have "BDBag" as a download option and download the file.', async () => {
          await ExportLocators.getExportDropdown(page).click();

          const bagOption = ExportLocators.getExportOption(page, 'BDBag');
          await expect.soft(bagOption).toHaveText('BDBag');

          const fileLocation = `${process.env.PWD}/test/e2e/${testParams.file_names[1]}`;
          const downloadPromise = page.waitForEvent('download');

          await bagOption.click();

          const modal = ModalLocators.getExportModal(page)
          await expect.soft(modal).toBeVisible();
          await expect.soft(modal).not.toBeAttached();

          const download = await downloadPromise;
          await download.saveAs(fileLocation);

          expect.soft(fs.existsSync(fileLocation)).toBeTruthy();
        });

        await test.step('should have "Configurations" option that opens a submenu to download the config file.', async () => {
          // let exportSubmenuOptions, configOption;
          await ExportLocators.getExportDropdown(page).click();

          const configOption = ExportLocators.getExportOption(page, 'configurations');
          await expect.soft(configOption).toHaveText('Configurations');

          await configOption.click();

          await expect.soft(ExportLocators.getExportSubmenuOptions(page)).toHaveCount(1);

          const bdBagSubmenu = ExportLocators.getExportSubmenuOption(page, 'BDBag');
          await expect.soft(bdBagSubmenu).toBeVisible();

          const fileLocation = `${process.env.PWD}/test/e2e/${testParams.file_names[2]}`;
          const downloadPromise = page.waitForEvent('download');

          await bdBagSubmenu.click();

          const download = await downloadPromise;
          await download.saveAs(fileLocation);

          expect.soft(fs.existsSync(fileLocation)).toBeTruthy();

          /**
           * hover over to make the dropdown menu tooltip OverlayTrigger trigger so it will hide when another tooltip is shown in a later test

           *
           * NOTE: this is only an issue when `NODE_ENV="development"` since we are adding "focus" event for tooltips
           *   this has no harm if the tooltip is not showing (node environment is production)
           *   see /src/components/tooltip.tsx for more info
           */
          await ExportLocators.getExportDropdown(page).hover();
        });
      }

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

      // TODO playwright: modify testRecordMainSectionValues and use it here instead
      await test.step('should validate the values of each column', async () => {
        await expect.soft(RecordLocators.getAllColumnValues(page)).toHaveCount(notNullColumns.length);

        const columns = testParams.columns.filter((c: any) => (c.hasOwnProperty('value') && c.value));
        for (const column of columns) {
          const columnTitle = column.markdown_title ? column.markdown_title : column.title;

          let columnEl;
          if (column.type === 'inline') {
            columnEl = RecordLocators.getRelatedMarkdownContainer(page, columnTitle, true);
            expect(await columnEl.innerHTML()).toContain(column.value);
          } else if (column.match === 'html') {
            columnEl = RecordLocators.getEntityRelatedTable(page, columnTitle);

            const html = await RecordLocators.getValueMarkdownContainer(columnEl).innerHTML();
            expect(html).toContain(column.value);
          } else {
            columnEl = RecordLocators.getEntityRelatedTable(page, columnTitle);
            if (column.presentation) {
              if (column.presentation.type === 'inline') columnEl = RecordLocators.getRelatedMarkdownContainer(page, columnTitle, true);

              const aTag = RecordLocators.getLinkChild(columnEl);
              const dataRow = getEntityRow(testInfo, testParams.schema_name, column.presentation.table_name, column.presentation.key_value);
              const columnUrl = `${column.presentation.url}RID=${dataRow.RID}`;

              expect.soft(await aTag.getAttribute('href')).toContain(columnUrl);
              await expect.soft(aTag).toHaveText(column.value);
            } else {
              await expect.soft(columnEl).toHaveText(column.value);
            }
          }
        }
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

      if (!process.env.CI) {
        await test.step('delete files', async () => {
          // delete files that may have been downloaded during tests
          await deleteDownloadedFiles(testParams.file_names);
        });
      }
    });
  });

  test('For a record with all of it\'s related tables as empty', async ({ page, baseURL }, testInfo) => {
    const params = testParams.no_related_data;

    await test.step('should load record page', async () => {
      const PAGE_URL = `/record/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}/${params.key}`;

      await page.goto(`${baseURL}${PAGE_URL}`);
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
      await expect.soft(btn).toHaveClass(/disabled/);
    });

    await test.step('should have "accommodation_collections" related table with bulk edit removed when the user cannot create and there are no rows present', async () => {
      const btn = RecordLocators.getRelatedTableBulkEditLink(page, 'accommodation_collections', true);
      await expect.soft(btn).not.toBeVisible();
    });
  });

  test('For side panel table of contents in Record App', async ({ page, baseURL }, testInfo) => {
    const params = testParams.sidePanelTest;

    await test.step('should load record page', async () => {
      const PAGE_URL = `/record/#${getCatalogID(testInfo.project.name)}/${params.schema_name}:${params.table_name}/${params.key}`;

      await page.goto(`${baseURL}${PAGE_URL}`);
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
      await expect.soft(rtTableHeading).toHaveClass(/show/);
    });

    await test.step('Record count along with heading should match for the panel and related table content should be in correct order', async () => {
      const tableNames = RecordLocators.getSidePanelHeadings(page);

      await expect.soft(tableNames).toHaveCount(params.toc_count);
      await expect.soft(tableNames).toHaveText(params.side_panel_table_order);
    });

    await test.step('Side panel should hide/show by clicking pull button', async () => {
      const recPan = RecordLocators.getSidePanel(page);
      const hideTocBtn = RecordLocators.getHideTocBtn(page);

      await expect.soft(hideTocBtn.locator('.chaise-icon')).toHaveClass(/chaise-sidebar-close/);
      await expect.soft(recPan).toHaveClass(/open-panel/);

      await hideTocBtn.click();
      const showTocBtn = RecordLocators.getShowTocBtn(page);

      await expect.soft(showTocBtn.locator('.chaise-icon')).toHaveClass(/chaise-sidebar-open/);
      await expect.soft(recPan).toHaveClass(/close-panel/);
    });
  });
});
