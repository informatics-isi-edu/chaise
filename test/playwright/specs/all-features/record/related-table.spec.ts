import moment from 'moment';
import { test, expect, Page } from '@playwright/test';
import RecordLocators from '@isrd-isi-edu/chaise/test/playwright/locators/record';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/playwright/locators/recordedit';
import { getCatalogID, getEntityRow } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.parameters';
import { testAddRelatedTable, testRelatedTablePresentation, testShareCiteModal } from '@isrd-isi-edu/chaise/test/playwright/utils/record-utils';

const testParams = {
  schemaName: 'product-unordered-related-tables-links',
  table_name: 'accommodation',
  key: {
    name: 'id',
    value: '2004',
    operator: '='
  },
  headers: [
    'booking', // normal
    'schedule', // has search
    'media', // has row_markdown_pattern
    'association_table', // association
    'accommodation_image', // association with page_size
    'association_table_markdown', // association with markdown
    'related_table_2', // related entity with path length 3, wait_for entity set but no markdown patt
    'table_w_aggregates', // related entity with aggregate columns
    'table_w_invalid_row_markdown_pattern', // related entity with invalid row_markdown_pattern
    'inbound related with display.wait_for entityset', //related entity with wait_for entityset and markdown patt
    'inbound related with display.wait_for agg', //related entity with wait_for agg and markdown pattern
    'inbound related with filter on main table', // related entity with filter on main table
    'inbound related with filter on related table', // related entity with filter on related table
    'association with filter on main table',
    'association with filter on related table', // association with filter on related table
    'path of length 3 with filters' // path of length 3 with filters
  ],
  tocHeaders: [
    'Summary', 'booking (6)', 'schedule (2)', 'media (1)', 'association_table (1)',
    'accommodation_image (2+)', 'association_table_markdown (1)', 'related_table_2 (1)',
    'table_w_aggregates (2)', 'table_w_invalid_row_markdown_pattern (1)',
    'inbound related with display.wait_for entityset (3)',
    'inbound related with display.wait_for agg (3)',
    'inbound related with filter on main table (6)',
    'inbound related with filter on related table (1)',
    'association with filter on main table (1)',
    'association with filter on related table (1)',
    'path of length 3 with filters (1)'
  ],
  scrollToDisplayname: 'table_w_aggregates'
};

test.describe('Related tables', () => {
  const keys = [];
  keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
  const URL_PATH = `${testParams.schemaName}:${testParams.table_name}/${keys.join('&')}`;

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    const PAGE_URL = `/record/#${getCatalogID(testInfo.project.name)}/${URL_PATH}`;

    await page.goto(`${baseURL}${PAGE_URL}`);

    await RecordLocators.waitForRecordPageReady(page);
  });

  // TODO
  test('overal structure of the page', async ({ page }) => {
    await test.step('table of contents should be displayed properly and in correct order', async () => {
      await expect.soft(RecordLocators.getSidePanelHeadings(page)).toHaveCount(testParams.tocHeaders.length);
      await expect.soft(RecordLocators.getSidePanelHeadings(page)).toHaveText(testParams.tocHeaders);
    });

    await test.step('related entities should show in the expected order', async () => {
      await expect.soft(RecordLocators.getDisplayedRelatedTableTitles(page)).toHaveCount(testParams.headers.length);
      await expect.soft(RecordLocators.getDisplayedRelatedTableTitles(page)).toHaveText(testParams.headers);
    });
  });

  test('share popup when the citation annotation has wait_for of all-outbound', async ({ page, baseURL }, testInfo) => {
    const keyValues = [{ column: testParams.key.name, value: testParams.key.value }];
    const ridValue = getEntityRow(testInfo, testParams.schemaName, testParams.table_name, keyValues).RID;
    const link = `${baseURL}/record/#${getCatalogID(testInfo.project.name)}/${testParams.schemaName}:${testParams.table_name}/RID=${ridValue}`;
    await testShareCiteModal(
      page,
      {
        title: 'Share and Cite',
        link,
        // the table has history-capture: false
        hasVersionedLink: false,
        verifyVersionedLink: false,
        citation: [
          'Super 8 North Hollywood Motel, accommodation_outbound1_outbound1 two ',
          'https://www.kayak.com/hotels/Super-8-North-Hollywood-c31809-h40498/2016-06-09/2016-06-10/2guests ',
          `(${moment().format('YYYY')}).`,
        ].join(''),
        // we don't need to test this here as well (it has been tested in record presentation)
        bibtextFile: `accommodation_${ridValue}.bib`,
      }
    );
  });

  test('for a one-hop away related entity', async ({ page, baseURL }, testInfo) => {
    await testRelatedTablePresentation(
      page,
      testInfo,
      {
        testTitle: 'inbound related, no applink or row_markdown_pattern',
        tableName: 'booking',
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'booking',
        baseTableName: 'Accommodations',
        count: 6,
        canDelete: true,
        canEdit: true,
        inlineComment: true,
        comment: 'booking inline comment',
        bulkEditLink: [
          `${baseURL}/recordedit/#${getCatalogID(testInfo.project.name)}`,
          'product-unordered-related-tables-links:booking',
          // we cannot test the actual facet blob since it's based on RID
          // and we also don't have access to ermrestjs here to encode it for us
          '*::facets::'
        ].join('/'),
        viewMore: {
          displayname: 'booking',
          filter: 'AccommodationsSuper 8 North Hollywood Motel'
        },
        rowValues: [
          ['125.0000', '2016-03-12 00:00:00'],
          ['100.0000', '2016-06-01 00:00:00'],
          ['110.0000', '2016-05-19 01:00:00'],
          ['120.0000', '2015-11-10 00:00:00'],
          ['180.0000', '2016-09-04 01:00:00'],
          ['80.0000', '2016-01-01 00:00:00'],
        ],
        rowViewPaths: [
          [{ column: 'accommodation_id', value: '2004' }, { column: 'id', value: '8' }],
          [{ column: 'accommodation_id', value: '2004' }, { column: 'id', value: '9' }],
          [{ column: 'accommodation_id', value: '2004' }, { column: 'id', value: '10' }],
          [{ column: 'accommodation_id', value: '2004' }, { column: 'id', value: '11' }],
          [{ column: 'accommodation_id', value: '2004' }, { column: 'id', value: '12' }],
          [{ column: 'accommodation_id', value: '2004' }, { column: 'id', value: '13' }]
        ]
      }
    );

    await testAddRelatedTable(
      page,
      async (newPage: Page) => {
        const inp = RecordeditLocators.getInputForAColumn(newPage, 'price', 1);
        await inp.fill('247.00');
      },
      {
        tableName: 'booking',
        schemaName: 'product-unordered-related-tables-links',
        displayname: 'booking',
        tableDisplayname: 'booking',
        prefilledValues: {
          'fk_1': { value: 'Super 8 North Hollywood Motel', inputType: RecordeditInputType.FK_DROPDOWN, isDisabled: true }, // the same fk
          'fk_2': { value: 'Super 8 North Hollywood Motel', inputType: RecordeditInputType.FK_DROPDOWN, isDisabled: true }, // superset fk
          'fk2_col': { value: '4', inputType: RecordeditInputType.FK_DROPDOWN, isDisabled: false }, // the second column of fk_2
          'fk_3': { value: 'Select a value', inputType: RecordeditInputType.FK_DROPDOWN, isDisabled: false }, // supserset fk but nullok
          'fk3_col1': { value: '', inputType: RecordeditInputType.FK_DROPDOWN, isDisabled: false },
          'fk_4': { value: 'Super 8 North Hollywood Motel', inputType: RecordeditInputType.FK_DROPDOWN, isDisabled: true }, // supserset fk
          'fk_5': { value: '4: four', inputType: RecordeditInputType.FK_DROPDOWN, isDisabled: true } // the second column of fk_2 that is a fk to another table
        },
        rowValuesAfter: [
          ['247.0000', ''],
          ['100.0000', '2016-06-01 00:00:00'],
          ['110.0000', '2016-05-19 01:00:00'],
          ['120.0000', '2015-11-10 00:00:00'],
          ['180.0000', '2016-09-04 01:00:00'],
          ['80.0000', '2016-01-01 00:00:00'],
        ]
      }
    );
  });

  test('for a related entity with search applink', async ({ page }, testInfo) => {
    await testRelatedTablePresentation(
      page,
      testInfo,
      {
        testTitle: "inbound related, has row_markdown_pattern",
        schemaName: "product-unordered-related-tables-links",
        displayname: "media",
        tableName: "media",
        baseTableName:"Accommodations",
        count: 1,
        canDelete: true,
        canEdit: false,
        markdownValue: "<p>2004</p>\n",
        isMarkdown: true
      }
    )
  });

  // test('for a pure and binary association', async ({ page }, testInfo) => {

  // });

});

test.skip('Scroll to query parameter', () => {
  test('after page load should scroll to the related table', async ({ page, baseURL }, testInfo) => {
    const keys = [];
    keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
    const PAGE_URL = `/record/#${getCatalogID(testInfo.project.name)}/${testParams.schemaName}:${testParams.table_name}/${keys.join('&')}`;

    await page.goto(`${baseURL}${PAGE_URL}?scrollTo=${testParams.scrollToDisplayname}`);

    await RecordLocators.waitForRecordPageReady(page);

    const heading = RecordLocators.getRelatedTableAccordionContent(page, testParams.scrollToDisplayname);

    // make sure it exists
    await heading.waitFor({ state: 'visible' });

    // make sure it scrolls into view
    await expect.soft(heading).toBeInViewport();

    // make sure it is open
    await expect.soft(heading).toHaveClass(/show/);
  });
});
