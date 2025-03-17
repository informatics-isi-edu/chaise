/* eslint-disable max-len */
import { expect, test } from '@playwright/test';

// locators
import ExportLocators from '@isrd-isi-edu/chaise/test/e2e/locators/export';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { APP_NAMES, DOWNLOAD_FOLDER } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { getCatalogID, getEntityRow } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import {
  clickNewTabLink, deleteDownloadedFiles, generateChaiseURL, getPageId,
  getWindowName, testExportDropdown, testTooltip
} from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import {
  testMainSearch, testRecordsetDisplayWSortAfterPaging,
  testRecordsetTableRowValues, testTotalCount
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';

const testParams = {
  accommodation_tuple: {
    schema_name: 'product-recordset',
    table_name: 'accommodation',
    comment: 'List of different types of accommodations',
    displayName: 'Accommodations',
    title: 'Accommodations',
    key: 'id::gt::2001',
    shortest_key_filter: 'RID=',
    sortby: 'no_of_rooms',
    file_names: ['Accommodations.csv', 'accommodation.zip', 'BDBag.json'],
    columns: [
      { title: 'Name of Accommodation' },
      { title: 'Website', comment: 'A valid url of the accommodation' },
      { title: 'User Rating' },
      { title: 'Number of Rooms' },
      { title: 'Summary' },
      { title: 'Operational Since' },
      { title: 'Is Luxurious' },
      { title: 'json_col' },
      { title: 'json_col_with_markdown' },
      { title: 'no_of_beds', comment: 'test all-outbound + waitfor for normal columns' },
      { title: 'no_of_baths', comment: 'wait_for normal columns on multiple aggregates' },
      { title: 'Category', comment: 'Type of accommodation (Resort, Hotel, or Motel)' },
      { title: 'Type of Facilities', comment: 'Type of facilities (Luxury/Upscale/Basic)' },
      { title: 'Image Count', comment: 'Image Count' },
      { title: 'Image Distinct Count', comment: 'Image Distinct Count' },
      { title: 'Min Image ID', comment: 'Min Image ID' },
      { title: 'summary of Image ID', comment: 'Summary of Image ID' },
      { title: 'color_rgb_hex_column' }
    ],
    data: [
      {
        id: '2003',
        title: 'NH Munich Resort',
        website: {
          url: 'http://www.nh-hotels.com/hotels/munich',
          caption: 'Link to Website'
        },
        rating: '3.2000',
        no_of_rooms: '15',
        summary: 'NH Hotels has six resorts in the city of Munich. Very close to Munich Main Train Station -- the train being one of the most interesting choices of transport for travelling around Germany -- is the four-star NH München Deutscher Kaiser Hotel. In addition to the excellent quality of accommodation that it offers, the hotel is located close to Marienplatz, the monumental central square in the city, the Frauenkirche church, Stachus (Karlsplatz) and the Viktualienmarkt. Other places of interest to explore in Munich are the English garden, the spectacular Nymphenburg Palace and the German Museum, a museum of science and technology very much in keeping with the industrial spirit of the city. Do not forget to visit Munich at the end of September and beginning of October, the time for its most famous international festival: Oktoberfest! Beer, sausages, baked knuckles and other gastronomic specialities await you in a festive atmosphere on the grasslands of Theresienwiese. Not to be missed! And with NH Hotels you can choose the hotels in Munich which best suit your travel plans, with free WiFi and the possibility to bring your pets with you. NH Hotels has six resorts in the city of Munich. Very close to Munich Main Train Station -- the train being one of the most interesting choices of transport for travelling around Germany -- is the four-star NH München Deutscher Kaiser Hotel. In addition to the excellent quality of accommodation that it offers, the hotel is located close to Marienplatz, the monumental central square in the city, the Frauenkirche church, Stachus (Karlsplatz) and the Viktualienmarkt. Other places of interest to explore in Munich are the English garden, the spectacular Nymphenburg Palace and the German Museum, a museum of science and technology very much in keeping with the industrial spirit of the city. Do not forget to visit Munich at the end of September and beginning of October, the time for its most famous international festival: Oktoberfest! Beer, sausages, baked knuckles and other gastronomic specialities await you in a festive atmosphere on the grasslands of Theresienwiese. Not to be missed! And with NH Hotels you can choose the hotels in Munich which best suit your travel plans, with free WiFi and the possibility to bring your pets with you.',
        opened_on: '1976-06-15 00:00:00',
        luxurious: 'true',
        json_col: JSON.stringify({ 'name': 'testing_json' }, undefined, 2),
        json_col_with_markdown: 'Status is: “delivered”',
        no_of_beds: 'beds: 1, id: 2003, has gym, thumbnail: NH Hotel, Munich, image id cnt: 1',
        no_of_baths: 'baths: 1, id: 2003, images: 3001',
        category: 'Resort',
        type_of_facilities: 'Luxury',
        count_image_id: '1',
        count_distinct_image_id: '1',
        min_image_id: '3001',
        max_image_id: 'rating: 3.2000, max: 3001, count: 1, category: Resort',
        color_rgb_hex_column: '#123456'
      },
      {
        id: '2002',
        title: 'Sherathon Hotel',
        website: {
          url: 'http://www.starwoodhotels.com/sheraton/index.html',
          caption: 'Link to Website'
        },
        rating: '4.3000',
        no_of_rooms: '23',
        summary: 'Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.',
        opened_on: '2008-12-09 00:00:00',
        luxurious: 'true',
        json_col: '',
        json_col_with_markdown: 'Status is: “delivered”',
        no_of_beds: 'beds: 1, id: 2002, has gym, image id cnt: 4',
        no_of_baths: 'baths: 1, id: 2002, images: 3005, 3006, 3008, 30007',
        category: 'Hotel',
        type_of_facilities: 'Upscale',
        count_image_id: '4',
        count_distinct_image_id: '4',
        min_image_id: '3005',
        max_image_id: 'rating: 4.3000, max: 30007, count: 4, category: Hotel',
        color_rgb_hex_column: '#323456'
      },
      {
        id: '2004',
        title: 'Super 8 North Hollywood Motel',
        website: {
          url: 'https://www.kayak.com/hotels/Super-8-North-Hollywood-c31809-h40498/2016-06-09/2016-06-10/2guests',
          caption: 'Link to Website'
        },
        rating: '2.8000',
        no_of_rooms: '35',
        summary: 'Fair Hotel. Close to Universal Studios. Located near shopping areas with easy access to parking. Professional staff and clean rooms. Poorly-maintained rooms.',
        opened_on: '2013-06-11 00:00:00',
        luxurious: 'false',
        json_col: JSON.stringify({ 'age': 25, 'name': 'Testing' }, undefined, 2),
        json_col_with_markdown: 'Status is: “Processing”',
        no_of_beds: 'beds: 1, id: 2004, thumbnail: Motel thumbnail, image id cnt: 3',
        no_of_baths: 'baths: 1, id: 2004, images: 3009, 3010, 3011',
        category: 'Motel',
        type_of_facilities: 'Basic',
        count_image_id: '3',
        count_distinct_image_id: '3',
        min_image_id: '3009',
        max_image_id: 'rating: 2.8000, max: 3011, count: 3, category: Motel',
        color_rgb_hex_column: '#423456'
      },
      {
        id: '4004',
        title: 'Hilton Hotel',
        // website: '',
        website: {
          url: '',
          caption: ''
        },
        rating: '4.2000',
        no_of_rooms: '96',
        summary: 'Great Hotel. We\'ve got the best prices out of anyone. Stay here to make America great again. Located near shopping areas with easy access to parking. Professional staff and clean rooms. Poorly-maintained rooms.',
        opened_on: '2013-06-11 00:00:00',
        luxurious: 'true',
        json_col: '9876.3543',
        json_col_with_markdown: 'Status is: “Processing”',
        no_of_beds: 'beds: 1, id: 4004, has gym, image id cnt: 0',
        no_of_baths: 'baths: 1, id: 4004',
        category: 'Hotel',
        type_of_facilities: 'Upscale',
        count_image_id: '0',
        count_distinct_image_id: '0',
        min_image_id: '',
        max_image_id: '',
        color_rgb_hex_column: '#523456'
      }
    ],
    sortedData: [
      {
        columnName: 'Name of Accommodation',
        rawColumnName: 'title',
        columnPosition: 1,
        page1: {
          asc: ['NH Munich Resort', 'Radisson Hotel', 'Sherathon Hotel'],
          desc: ['Super 8 North Hollywood Motel', 'Sherathon Hotel', 'Sherathon Hotel']
        },
        page2: {
          asc: ['Sherathon Hotel', 'Super 8 North Hollywood Motel'],
          desc: ['Radisson Hotel', 'NH Munich Resort']
        }
      },
      {
        columnName: 'Number of Rooms',
        rawColumnName: 'no_of_rooms',
        columnPosition: 4,
        page1: {
          asc: ['15', '23', '23',],
          desc: ['46', '35', '23']
        },
        page2: {
          asc: ['35', '46'],
          desc: ['23', '15']
        }
      },
      {
        columnName: 'Operational Since',
        rawColumnName: 'opened_on',
        columnPosition: 6,
        page1: {
          asc: ['1976-06-15 00:00:00', '2002-01-22 00:00:00', '2008-12-09 00:00:00'],
          desc: ['2013-06-11 00:00:00', '2008-12-09 00:00:00', '2008-12-09 00:00:00']
        },
        page2: {
          asc: ['2008-12-09 00:00:00', '2013-06-11 00:00:00'],
          desc: ['2002-01-22 00:00:00', '1976-06-15 00:00:00']
        }
      },
      {
        columnName: 'Category',
        rawColumnName: 'F8V7Ebs7zt7towDneZvefw',
        columnPosition: 12,
        page1: {
          asc: ['Hotel', 'Hotel', 'Hotel'],
          desc: ['Resort', 'Motel', 'Hotel']
        },
        page2: {
          asc: ['Motel', 'Resort'],
          desc: ['Hotel', 'Hotel']
        }
      },
      {
        columnName: 'Type of Facilities',
        rawColumnName: 'hZ7Jzy0aC3Q3KQqz4DIXTw',
        columnPosition: 13,
        page1: {
          asc: ['Basic', 'Luxury', 'Upscale'],
          desc: ['Upscale', 'Upscale', 'Upscale']
        },
        page2: {
          asc: ['Upscale', 'Upscale'],
          desc: ['Luxury', 'Basic']
        }
      }
    ]
  },
  file_tuple: {
    schema_name: 'product-recordset',
    table_name: 'file',
    custom_page_size: 5,
    page_size: 10
  },
  tooltip: {
    exportDropdown: 'Click to choose an export format.',
    permalink: 'Click to copy the current URL to clipboard.',
    actionCol: 'Click on the action buttons to view, edit, or delete each record'
  },
  active_list: {
    schema_name: 'active_list_schema',
    table_name: 'main',
    sortby: 'main_id',
    data: [
      [
        'main one', // self_link_rowname
        'current: main one(1234501, 1,234,501), id: 01, array: 1,234,521, 1,234,522, 1,234,523, 1,234,524, 1,234,525', // self_link_id
        '1,234,501', //normal_col_int_col
        'current cnt: 5 - 1,234,511, 1234511, cnt_i1: 5', //normal_col_int_col_2
        'outbound1 one', //outbound_entity_o1
        'current: outbound2 one(1234521, 1,234,521), self_link_rowname: 1,234,501', //outbound_entity_o2
        '1,234,511', //outbound_scalar_o1
        'current: 1,234,521, 1234521, max_i1: 1,234,525, array i1: inbound1 one(1234521, 1,234,521), inbound1 two(1234522, 1,234,522)', //outbound_scalar_o2
        'outbound1_outbound1 one', // all_outbound_entity_o1_o1
        'current: outbound2_outbound1 one(12345111, 12,345,111), array: 12345221| 12345222', // all_outbound_entity_o2_o1
        '12,345,111', // all_outbound_scalar_o1_o1
        'current: 12,345,111, 12345111, o1_o1_o1: outbound1_outbound1_outbound1 one, o2_o1: 12,345,111', //all_outbound_scalar_o2_o1
        'inbound1 one, inbound1 two', // array_d_entity_i1
        'current: inbound2 one(12345221, 12,345,221), cnt: 5', // array_d_entity_i2
        '1,234,521, 1,234,522, 1,234,523, 1,234,524, 1,234,525', // array_d_scalar_i1
        'current: 12,345,221, 12,345,222 - 12345221| 12345222, max: 12,345,225', // array_d_scalar_i2
        '5', //cnt_i1
        'current: 5, 5, cnt_i1: 5, array_i3: inbound3 one', //cnt_i2
        '5', //cnt_d_i1
        'current: 5, 5, cnt_i1: 5, cnt_i2: 5, array_i4: i01, i02, i03, i04, i05', //cnt_d_i2
        '1,234,521', //min_i1
        'current: 12,345,221, 12345221, 12,345,111', //min_i2
        '1,234,525', //max_i1
        'current: 12,345,225, 12345225', //max_i2
        'virtual col value is 12,345,225', //virtual column
      ],
      [
        'main two', '', '1,234,502',
        '', '', '', '', '', '', '',
        '', '', '', '', '', '', '0',
        '', '0', '', '', '', '', '',
        ''
      ]
    ]
  },
  system_columns: {
    schema_name: 'system-columns-heuristic',
    table_name: 'system-columns',
    compactConfig: ['RCB', 'RMT'],
    detailedConfig: true,
    entryConfig: ['RCB', 'RMB', 'RMT'],
    compactColumnsSystemColumnsTable: ['id', 'text', 'int', 'RCB', 'RMT'],
    detailedColumns: ['RID', 'id', 'text', 'int', 'RCB', 'RMB', 'RCT', 'RMT'],
    compactColumnsPersonTable: ['id', 'text', 'RCB', 'RMT'], // no int column because it's the foreign key link (would be redundent)
    entryColumns: ['id', 'text', 'int', 'RCB', 'RMB', 'RMT']
  }
};

test.describe('View recordset', () => {
  test.describe.configure({ mode: 'parallel' });

  test('For recordset with columns with waitfor', async ({ page, baseURL }, testInfo) => {
    const params = testParams.active_list;
    const data = params.data;

    const PAGE_URL = generateChaiseURL(APP_NAMES.RECORDSET, params.schema_name, params.table_name, testInfo, baseURL);

    await test.step('should load recordset page', async () => {
      await page.goto(`${PAGE_URL}@sort(${params.sortby})`);

      await RecordsetLocators.waitForRecordsetPageReady(page);
      await RecordsetLocators.waitForRecordsetAggregates(page);
    });

    await test.step('should not show the total count if hide_row_count is true.', async () => {
      await testTotalCount(page, `Displaying all${data.length}records`)
    });

    await test.step('should honor the max_facet_depth of table and ignore the chaise-config setting', async () => {
      await expect.soft(RecordsetLocators.getSidePanel(page)).toBeVisible();
      await expect.soft(RecordsetLocators.getHideFilterPanelBtn(page)).toBeVisible();
      await expect.soft(RecordsetLocators.getAllFacets(page)).toHaveCount(16);
    });

    await test.step('should show correct table rows.', async () => {
      await testRecordsetTableRowValues(page, data, true);
    });

    await test.step('going to a recordset page with no results, the loader for columns should hide.', async () => {
      await page.goto(`${PAGE_URL}/main_id=03`);
      await RecordsetLocators.waitForRecordsetPageReady(page);
      await RecordsetLocators.waitForRecordsetAggregates(page);
    })
  });

  test(`For table ${testParams.accommodation_tuple.table_name}`, async ({ page, baseURL }, testInfo) => {
    const params = testParams.accommodation_tuple;
    const catalogID = getCatalogID(testInfo.project.name);
    const PAGE_URL = generateChaiseURL(APP_NAMES.RECORDSET, params.schema_name, params.table_name, testInfo, baseURL);

    await test.step('should load recordset page', async () => {
      await page.goto(`${PAGE_URL}/${params.key}@sort(${params.sortby})`);
      await RecordsetLocators.waitForRecordsetPageReady(page);
      await RecordsetLocators.waitForRecordsetAggregates(page);
    });

    await test.step('should not display facets if maxFacetDepth is 0 in the chaise-config', async () => {
      await expect.soft(RecordsetLocators.getSidePanel(page)).not.toBeVisible();
      await expect.soft(RecordsetLocators.getShowFilterPanelBtn(page)).not.toBeVisible();
      await expect.soft(RecordsetLocators.getHideFilterPanelBtn(page)).not.toBeVisible();
    });

    await test.step('presentation of the recordset page', async () => {
      if (!process.env.CI) {
        await test.step('delete files that may have been downloaded before', async () => {
          await deleteDownloadedFiles(params.file_names.map((name: string) => {
            return `${DOWNLOAD_FOLDER}/${name}`
          }));
        });
      }

      await test.step(`should have ${params.title} as title`, async () => {
        await expect.soft(RecordsetLocators.getPageTitleElement(page)).toHaveText(params.title);
      });

      await test.step('should have the correct tooltip.', async () => {
        await testTooltip(RecordsetLocators.getPageTitleTooltip(page), params.comment, APP_NAMES.RECORDSET);
      });

      await test.step('should have the correct head title using the heuristics for recordset app', async () => {
        const ccHeadTitle = 'show me on the navbar!';
        // <table-name> | chaiseConfig.headTitle
        expect.soft(await page.title()).toContain(`${params.title} | ${ccHeadTitle}`);
      });

      await test.step('should display the permalink button & a tooltip on hovering over it', async () => {
        const permalink = RecordsetLocators.getPermalinkButton(page);
        await expect.soft(permalink).toBeVisible();

        await testTooltip(permalink, testParams.tooltip.permalink, APP_NAMES.RECORDSET);
      });

      await test.step('should autofocus on search box', async () => {
        const searchBox = RecordsetLocators.getMainSearchInput(page);
        await expect.soft(searchBox).toBeVisible();

        const activeElementClass = await page.evaluate('document.activeElement.className');
        // main-search-input is hard-coded in `getMainSearchInput`, no need to have the "expected value" come from the element on the page
        expect.soft(activeElementClass).toEqual('main-search-input');
      });

      // The annotated page size will be "added" to the page limit dropdown ONLY if it is the selected option
      // Only need to test it is shown in the dropdown since that also implies it is selected
      await test.step('should use annotated page size', async () => {
        const expectedOptionText = '15';

        const pageLimitDropdown = RecordsetLocators.getPageLimitDropdown(page);
        await pageLimitDropdown.click();

        const pageLimitOption = RecordsetLocators.getPageLimitSelector(page, expectedOptionText);
        await expect.soft(pageLimitOption).toBeVisible();
        await expect.soft(pageLimitOption).toHaveText(expectedOptionText);

        // close the page limit dropdown
        await pageLimitDropdown.click();
      });

      await test.step('should show correct table rows', async () => {
        // mapping the data object values to an array for this test case
        // NOTE: each object in data is only used for this test. the defined test params could be changed to be an array of rowValues instead
        const testValues = params.data.map((tableRowData) => {
          const rowValues = Object.values(tableRowData);

          // removes the first entry in the array and adjusts the indexes of everything else
          // NOTE: we don't want to test the "id" column
          rowValues.shift();
          return rowValues;
        });

        await testRecordsetTableRowValues(page, testValues, true);
      });

      await test.step(`should have ${params.columns.length} columns`, async () => {
        const columnTitles = params.columns.map((col) => col.title);
        await expect.soft(RecordsetLocators.getColumnNames(page)).toHaveText(columnTitles);
      });

      await test.step('should display the Export dropdown button with proper tooltip.', async () => {
        const exportDropdown = ExportLocators.getExportDropdown(page);
        await expect.soft(exportDropdown).toBeVisible();

        await testTooltip(exportDropdown, testParams.tooltip.exportDropdown, APP_NAMES.RECORDSET);
      });

      await testExportDropdown(page, params.file_names, APP_NAMES.RECORDSET);

      await test.step('should show information icon after column name in column headers which have a comment and inspect the comment value', async () => {
        const columnsWComments = params.columns.filter((c) => typeof c.comment === 'string');

        const columnsEls = RecordsetLocators.getColumnsWithTooltipIcon(page);
        await expect.soft(columnsEls).toHaveCount(columnsWComments.length);

        const testColumnTooltip = async (idx: number) => {

          // if we reached the end of the list, then finish the test case
          if (idx === columnsWComments.length) return;

          const comment = columnsWComments[idx].comment;

          await testTooltip(columnsEls.nth(idx), comment, APP_NAMES.RECORDSET, true)
          await testColumnTooltip(idx + 1);
        }

        // go one by one over the columns w comments and test their tooltip
        await testColumnTooltip(0);
      });

      await test.step('have correct tooltip for action column', async () => {
        await testTooltip(RecordsetLocators.getActionsHeader(page), testParams.tooltip.actionCol, APP_NAMES.RECORDSET, true);
      });

      await test.step('apply different searches', async () => {
        // apply simple search words
        await testMainSearch(page, 'Super 8 North Hollywood Motel', 1);

        // apply conjunctive search words
        await testMainSearch(page, '"Super 8" motel "North Hollywood"', 1);

        // apply non-matching search words
        await testMainSearch(page, 'asdfghjkl', 0);
      });

      await test.step('JSON Column value should be searchable and check the link of the view details', async () => {
        const searchBox = RecordsetLocators.getMainSearchInput(page),
          searchSubmitButton = RecordsetLocators.getSearchSubmitButton(page);

        // search for a row that is not the first one after sorting
        await searchBox.fill('9876.3543');
        await searchSubmitButton.click();
        await RecordsetLocators.waitForRecordsetPageReady(page);

        await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(1);

        const keyValues = [{ column: 'id', value: params.data[3].id }];
        const dataRow = getEntityRow(testInfo, params.schema_name, params.table_name, keyValues);

        const filter = params.shortest_key_filter + dataRow.RID;
        const viewUrl = `/record/#${catalogID}/${params.schema_name}:${params.table_name}/${filter}`;

        expect.soft(await RecordsetLocators.getRowViewButton(page, 0).getAttribute('href')).toContain(viewUrl);

        // clear search
        await RecordsetLocators.getSearchClearButton(page).click();
      });

      // view link here should be different from the `it` case above
      await test.step('action columns should show view button that redirects to the record page', async () => {
        const keyValues = [{ column: 'id', value: params.data[0].id }];
        const dataRow = getEntityRow(testInfo, params.schema_name, params.table_name, keyValues);

        const filter = params.shortest_key_filter + dataRow.RID;
        const newPageUrl = `**/record/#${catalogID}/${params.schema_name}:${params.table_name}/${filter}**`;

        await expect.soft(RecordsetLocators.getViewActionButtons(page)).toHaveCount(4);

        await RecordsetLocators.getRowViewButton(page, 0).click();
        await page.waitForURL(newPageUrl);
        await page.goBack();
      });

      await test.step('action columns should show edit button that redirects to the recordedit page', async () => {
        const keyValues = [{ column: 'id', value: params.data[0].id }];
        const dataRow = getEntityRow(testInfo, params.schema_name, params.table_name, keyValues);

        const filter = params.shortest_key_filter + dataRow.RID;
        const newPageUrl = `**/recordedit/#${catalogID}/${params.schema_name}:${params.table_name}/${filter}**`;

        await expect.soft(RecordsetLocators.getEditActionButtons(page)).toHaveCount(4);

        const newPage = await clickNewTabLink(RecordsetLocators.getRowEditButton(page, 0));
        await newPage.waitForURL(newPageUrl);
        await newPage.close();
      });

      await test.step('action columns should show delete button that deletes record', async () => {
        await expect.soft(RecordsetLocators.getDeleteActionButtons(page)).toHaveCount(4);
        // delete the 4th row (Hilton Hotel)
        await RecordsetLocators.getRowDeleteButton(page, 3).click();

        const modal = ModalLocators.getConfirmDeleteModal(page);
        await ModalLocators.getOkButton(modal).click();

        await RecordsetLocators.waitForRecordsetPageReady(page);
        await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(3)
      });

      // if (!process.env.CI) {
        await test.step('delete files downloaded during the tests', async () => {
          await deleteDownloadedFiles(params.file_names.map((name: string) => {
            return `${DOWNLOAD_FOLDER}/${name}`
          }));
        });
      // }

    });

    // This "step" of tests relies on a row being deleted from the original data by one of the last test.steps in the presentation block
    //   because of this, the "sorting and paging" tests have to run in sequence following the above tests
    await test.step('sorting and paging features', async () => {
      await test.step('should load recordset page with a limit', async () => {
        await page.goto(`${PAGE_URL}?limit=3`);
        await RecordsetLocators.waitForRecordsetPageReady(page);

        await expect.soft(RecordsetLocators.getRows(page).nth(2)).toBeVisible();
      });

      for (const [index, dataParams] of params.sortedData.entries()) {
        const recordsOnPage1 = dataParams.page1.asc.length,
          recordsOnPage2 = dataParams.page2.asc.length,
          totalRecords = recordsOnPage1 + recordsOnPage2;

        await test.step(`should sort ${dataParams.columnName} column in ascending order.`, async () => {
          const initialSortButton = RecordsetLocators.getColumnSortButton(page, dataParams.rawColumnName);
          // Check the presence of initial sort button
          await expect.soft(initialSortButton).toBeVisible();

          // Click on sort button
          await initialSortButton.click();
          await testRecordsetDisplayWSortAfterPaging(
            page,
            RecordsetLocators.getColumnSortDescButton(page, dataParams.rawColumnName),
            dataParams.rawColumnName,
            recordsOnPage1,
            totalRecords,
            'first'
          );
          await expect.soft(RecordsetLocators.getColumnCells(page, dataParams.columnPosition)).toHaveText(dataParams.page1.asc);

          // Go to the next page
          await RecordsetLocators.getNextButton(page).click();
          await testRecordsetDisplayWSortAfterPaging(
            page,
            RecordsetLocators.getColumnSortDescButton(page, dataParams.rawColumnName),
            dataParams.rawColumnName,
            recordsOnPage2,
            totalRecords,
            'last'
          );
          await expect.soft(RecordsetLocators.getColumnCells(page, dataParams.columnPosition)).toHaveText(dataParams.page2.asc);

          // Go to the previous page
          await RecordsetLocators.getPreviousButton(page).click();
          await testRecordsetDisplayWSortAfterPaging(
            page,
            RecordsetLocators.getColumnSortDescButton(page, dataParams.rawColumnName),
            dataParams.rawColumnName,
            recordsOnPage1,
            totalRecords,
            'first'
          );
        });

        await test.step(`should sort ${dataParams.columnName} column in descending order.`, async () => {
          const sortDescBtn = RecordsetLocators.getColumnSortDescButton(page, dataParams.rawColumnName);
          // Check the presence of descending sort button
          await expect.soft(sortDescBtn).toBeVisible();

          // Click on sort button to sort in descending order
          await sortDescBtn.click();
          await testRecordsetDisplayWSortAfterPaging(
            page,
            RecordsetLocators.getColumnSortAscButton(page, dataParams.rawColumnName),
            dataParams.rawColumnName,
            recordsOnPage1,
            totalRecords,
            'first',
            '::desc::'
          );
          await expect.soft(RecordsetLocators.getColumnCells(page, dataParams.columnPosition)).toHaveText(dataParams.page1.desc);

          // Go to the next page
          await RecordsetLocators.getNextButton(page).click();
          await testRecordsetDisplayWSortAfterPaging(
            page,
            RecordsetLocators.getColumnSortAscButton(page, dataParams.rawColumnName),
            dataParams.rawColumnName,
            recordsOnPage2,
            totalRecords,
            'last',
            '::desc::'
          );
          await expect.soft(RecordsetLocators.getColumnCells(page, dataParams.columnPosition)).toHaveText(dataParams.page2.desc);

          // Go to the previous page
          await RecordsetLocators.getPreviousButton(page).click();
          await testRecordsetDisplayWSortAfterPaging(
            page,
            RecordsetLocators.getColumnSortAscButton(page, dataParams.rawColumnName),
            dataParams.rawColumnName,
            recordsOnPage1,
            totalRecords,
            'first',
            '::desc::'
          );
        });
      };
    });
  });

  test(`For table ${testParams.file_tuple.table_name}`, async ({ page, baseURL }, testInfo) => {
    const params = testParams.file_tuple;

    await test.step('should load recordset page', async () => {
      await page.goto(generateChaiseURL(APP_NAMES.RECORDSET, params.schema_name, params.table_name, testInfo, baseURL));
      await RecordsetLocators.waitForRecordsetPageReady(page);
    });

    await test.step(`should load the table with ${params.custom_page_size} rows of data based on the page size annotation.`, async () => {
      // Verify page count and on first page
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.custom_page_size);
    });

    await test.step('should display the proper row count and total row count.', async () => {
      await testTotalCount(page, 'Displaying first5of 14 records')
    });

    await test.step(`should have ${params.page_size} rows after paging to the second page, back to the first, and then changing page size to ${params.page_size}.`, async () => {
      const previousBtn = RecordsetLocators.getPreviousButton(page),
        pageLimitDropdown = RecordsetLocators.getPageLimitDropdown(page);

      // page to the next page then page back to the first page so the @before modifier is applied
      await RecordsetLocators.getNextButton(page).click();
      // wait for it to be on the second page
      await expect.soft(previousBtn).toBeEnabled();

      await previousBtn.click();
      // wait for it to be on the first page again
      expect.soft(page.url()).toContain('@after');
      await expect.soft(previousBtn).not.toBeEnabled();

      // make sure the dropdown is clickable
      await expect.soft(pageLimitDropdown).toBeEnabled();
      await pageLimitDropdown.click();

      // increase the page limit
      await RecordsetLocators.getPageLimitSelector(page, `${params.page_size}`).click();
      // verify more records are now shown
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.page_size);
    });

    await test.step('should have 14 rows and paging buttons disabled when changing the page size to 25.', async () => {
      const nextBtn = RecordsetLocators.getNextButton(page),
        prevBtn = RecordsetLocators.getPreviousButton(page);

      await RecordsetLocators.getPageLimitDropdown(page).click();

      await RecordsetLocators.getPageLimitSelector(page, '25').click();
      await expect.soft(nextBtn).not.toBeEnabled();
      await expect.soft(prevBtn).not.toBeEnabled()

      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(14);
    });
  });

  test('For window ID and page ID', async ({ page, baseURL }, testInfo) => {
    const params = testParams.accommodation_tuple;
    const PAGE_URL = generateChaiseURL(APP_NAMES.RECORDSET, params.schema_name, params.table_name, testInfo, baseURL);
    const URL = `${PAGE_URL}/${params.key}@sort(${params.sortby})`;

    let windowId: string, pageId: string;

    await test.step('should load recordset page', async () => {
      await page.goto(URL);
      await RecordsetLocators.waitForRecordsetPageReady(page);

      windowId = await getWindowName(page);
      pageId = await getPageId(page);
    });

    await test.step('clicking view action should change current window with the same window ID and a new page ID.', async () => {
      await expect.soft(RecordsetLocators.getViewActionButtons(page)).toHaveCount(params.data.length);
      await RecordsetLocators.getRowViewButton(page, 0).click();

      await RecordLocators.waitForRecordPageReady(page);
      expect.soft(await getWindowName(page)).toEqual(windowId);

      // pageId should change when the window changes page
      expect.soft(await getPageId(page)).not.toEqual(pageId);
    });

    // load the recordset page again
    await test.step('should load recordset page', async () => {
      await page.goto(URL);
      await RecordsetLocators.waitForRecordsetPageReady(page);

      windowId = await getWindowName(page);
      pageId = await getPageId(page);
    });

    await test.step('clicking edit action should open a new window with a new window ID and a new page ID.', async () => {
      await expect.soft(RecordsetLocators.getEditActionButtons(page)).toHaveCount(params.data.length);
      const newPage = await clickNewTabLink(RecordsetLocators.getRowEditButton(page, 0));

      await RecordeditLocators.waitForRecordeditPageReady(newPage);
      expect.soft(await getWindowName(newPage)).not.toEqual(windowId);

      // pageId should change when a new window is opened
      expect.soft(await getPageId(newPage)).not.toEqual(pageId);
      await newPage.close();

      expect(await getWindowName(page)).toEqual(windowId);
      // pageId should not have changed when a new window was opened
      expect(await getPageId(page)).toEqual(pageId);
    });
  });

  test('For chaise config properties when no catalog or schema:table is specified', async ({ page, baseURL }, testInfo) => {
    const params = testParams.accommodation_tuple;
    const catalogSchemaTable = `#${getCatalogID(testInfo.project.name)}/${params.schema_name}:${params.table_name}`;

    await test.step('should use the default catalog and schema:table defined in chaise config if no catalog or schema:table is present in the uri', async () => {
      await page.goto(`${baseURL}/recordset`);
      await RecordsetLocators.waitForRecordsetPageReady(page);

      expect.soft(page.url()).toContain(catalogSchemaTable);
      await expect.soft(RecordsetLocators.getPageTitleElement(page)).toHaveText('Accommodations');
    });

    await test.step('should use the default schema:table defined in chaise config if no schema:table is present in the uri.', async () => {
      await page.goto(`${baseURL}/recordset/#${getCatalogID(testInfo.project.name)}`);
      await RecordsetLocators.waitForRecordsetPageReady(page);

      expect.soft(page.url()).toContain(catalogSchemaTable);
      await expect.soft(RecordsetLocators.getPageTitleElement(page)).toHaveText('Accommodations');
    });
  });

  test('For chaise config properties with system columns heuristic properties', async ({ page, baseURL }, testInfo) => {
    const params = testParams.system_columns;

    await test.step('should load recordset page', async () => {
      await page.goto(generateChaiseURL(APP_NAMES.RECORDSET, params.schema_name, params.table_name, testInfo, baseURL));
      await RecordsetLocators.waitForRecordsetPageReady(page);
    });

    await test.step('with systemColumnsDisplayCompact: [\'RCB\', \'RMT\'], should have proper columns.', async () => {
      const columnNames = RecordsetLocators.getColumnNames(page);
      await expect.soft(columnNames).toHaveCount(params.compactColumnsSystemColumnsTable.length);
      await expect.soft(columnNames).toHaveText(params.compactColumnsSystemColumnsTable);
    });

    await test.step('systemColumnsDisplayDetailed: true, should have proper columns after clicking a row.', async () => {
      await expect.soft(RecordsetLocators.getViewActionButtons(page)).toHaveCount(1)

      await RecordsetLocators.getRowViewButton(page, 0).click();
      await RecordLocators.waitForRecordPageReady(page);

      const columnNames = RecordLocators.getAllColumnNames(page);
      await expect.soft(columnNames).toHaveCount(params.detailedColumns.length);
      await expect.soft(columnNames).toHaveText(params.detailedColumns);
    });

    await test.step('on record page, systemColumnsDisplayCompact should also be honored for related tables.', async () => {
      const columnNames = RecordsetLocators.getColumnNames(RecordLocators.getRelatedTable(page, 'person'));
      await expect.soft(columnNames).toHaveCount(params.compactColumnsPersonTable.length);
      await expect.soft(columnNames).toHaveText(params.compactColumnsPersonTable);
    });

    await test.step('on recordedit page with systemColumnsDisplayEntry: [\'RCB\', \'RMB\', \'RMT\'], should have proper columns', async () => {
      // click create
      await RecordLocators.getCreateRecordButton(page).click()
      await RecordeditLocators.waitForRecordeditPageReady(page);

      // test columns length
      const columnNames = RecordeditLocators.getAllColumnNames(page);
      await expect.soft(columnNames).toHaveCount(params.entryColumns.length);
      await expect.soft(columnNames).toHaveText(params.entryColumns);
    });
  });
});
