import { test, expect } from '@playwright/test';

// locators
import RecordLocators from '@isrd-isi-edu/chaise/test/playwright/locators/record';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.parameters';

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
  relatedTables: [

  ],
  scrollToDisplayname: 'table_w_aggregates'
};

test.describe('Related tables', () => {

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    const keys = [];
    keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
    const PAGE_URL = `/record/#${getCatalogID(testInfo.project.name)}/${testParams.schemaName}:${testParams.table_name}/${keys.join('&')}`;

    await page.goto(`${baseURL}${PAGE_URL}`);

    await RecordLocators.waitForRecordPageReady(page);
  });

  // TODO

});

test.describe('Scroll to query parameter', () => {
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
    await expect(heading).toBeInViewport();

    // make sure it is open
    await expect(heading).toHaveClass(/show/);
  });
});
