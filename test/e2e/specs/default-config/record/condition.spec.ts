/* eslint-disable max-len */
import { test, expect } from '@playwright/test';

// locators
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';

// utils
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const schemaName = 'condition-test';
const tableName = 'main';

/**
 * Test cases for the condition feature on visible columns and foreign keys.
 *
 * Data setup:
 * - Row 1 (id=1): inbound1 has 1 row, path_table has 1 row (through outbound1.id=1)
 * - Row 2 (id=2): inbound1 has no rows, path_table has no rows (through outbound1.id=2)
 * - inbound_empty has no rows for either row
 *
 * Condition source types tested:
 * - Local column (inline source in condition)
 * - All-outbound scalar (inline source in condition)
 * - All-outbound entity (sourcekey, for pattern condition with $self.values)
 * - 1-hop inbound entity set (sourcekey)
 * - 1-hop inbound entity set always empty (sourcekey)
 * - Multi-hop with inbound entity set (sourcekey)
 *
 * Displayed column types tested:
 * - Local column (source inline in visible-columns)
 * - 1-hop outbound (source inline)
 * - All-outbound 2-hop (source inline)
 * - 1-hop inbound entity set (sourcekey with entity:true)
 * - Multi-hop with inbound entity set (sourcekey with entity:true)
 * - Aggregate cnt (sourcekey with aggregate)
 */
const testCases = [
  {
    description: 'row with inbound data (id=1)',
    key: 'id=1',
    // display names come from column names, table names, or sourcekey names
    visibleColumns: [
      'title',
      'local_col',           // condition: local src, on_empty:hide, has value -> shown
      'local_col_2',         // condition: inbound1 entity set, on_empty:hide, has data -> shown
      'outbound1_col',       // condition: outbound src, on_empty:hide, has value -> shown
      'outbound2_col',       // condition: inbound_empty entity set, on_empty:show, empty -> shown
      'inbound1',            // condition: inbound1 entity set, on_empty:hide, has data -> shown (inline entity, display = table name)
      'path_table',          // condition: path entity set, on_empty:hide, has data -> shown (inline entity, display = table name)
      'inbound1_cnt',        // condition: inbound1 entity set, on_empty:hide, has data -> shown (aggregate, display = markdown_name)
      'local_col_4',         // condition: outbound entity, pattern eq $self.values.id "1" -> "show" -> shown
    ],
    hiddenColumns: [
      'local_col_3',         // condition: inbound1 entity set, on_empty:show, has data -> hidden
    ],
    tocHeaders: [
      'Summary',
      'inbound1 (1)',        // condition: inbound1 entity set, on_empty:hide, has data -> shown
      'path_table (1)',      // condition: inbound_empty entity set, on_empty:show, empty -> shown
    ],
    shownRelatedTables: ['inbound1', 'path_table'],
    hiddenRelatedTables: ['inbound_empty', 'assoc_related'],
  },
  {
    description: 'row without inbound data (id=2)',
    key: 'id=2',
    visibleColumns: [
      'title',
      'local_col',           // condition: local src, on_empty:hide, has value -> shown
      'local_col_3',         // condition: inbound1 entity set, on_empty:show, empty -> shown
      'outbound1_col',       // condition: outbound src, on_empty:hide, has value -> shown
      'outbound2_col',       // condition: inbound_empty entity set, on_empty:show, empty -> shown
    ],
    hiddenColumns: [
      'local_col_2',         // condition: inbound1 entity set, on_empty:hide, empty -> hidden
      'inbound1',            // condition: inbound1 entity set, on_empty:hide, empty -> hidden
      'path_table',          // condition: path entity set, on_empty:hide, empty -> hidden
      'inbound1_cnt',        // condition: inbound1 entity set, on_empty:hide, empty -> hidden
      'local_col_4',         // condition: outbound entity, pattern eq $self.values.id "1" with id=2 -> "" -> hidden
    ],
    tocHeaders: [
      'Summary',
      'assoc_related (1)',   // condition: inbound1 entity set, on_empty:show, empty -> shown
      'path_table (0)',      // condition: inbound_empty entity set, on_empty:show, empty -> shown (no data)
    ],
    shownRelatedTables: ['assoc_related', 'path_table'],
    hiddenRelatedTables: ['inbound1', 'inbound_empty'],
  },
];

test.describe.configure({ mode: 'parallel' });

// TODO fix the test cases and unskip
test.skip('Condition on visible columns and foreign keys', () => {

  for (const tc of testCases) {
    test(`${tc.description}`, async ({ page, baseURL }, testInfo) => {
      await test.step('should load the record page', async () => {
        const url = generateChaiseURL(APP_NAMES.RECORD, schemaName, tableName, testInfo, baseURL) + `/${tc.key}`;
        await page.goto(url);
        await RecordLocators.waitForRecordPageReady(page);
      });

      await test.step('table of contents should only show non-hidden items', async () => {
        const tocHeaders = RecordLocators.getSidePanelHeadings(page);
        await expect.soft(tocHeaders).toHaveCount(tc.tocHeaders.length);
        await expect.soft(tocHeaders).toHaveText(tc.tocHeaders);
      });

      await test.step('visible columns should be present', async () => {
        const allColumnNames = RecordLocators.getAllColumnNames(page);
        await expect.soft(allColumnNames).toHaveCount(tc.visibleColumns.length);
        await expect.soft(allColumnNames).toHaveText(tc.visibleColumns);
      });

      await test.step('hidden columns should not be in the DOM', async () => {
        for (const colName of tc.hiddenColumns) {
          const colEl = RecordLocators.getColumnNameElement(page, colName);
          await expect.soft(colEl).not.toBeAttached();
        }
      });

      await test.step('shown related tables should be visible', async () => {
        const displayedTitles = RecordLocators.getDisplayedRelatedTableTitles(page);
        await expect.soft(displayedTitles).toHaveCount(tc.shownRelatedTables.length);
      });

      await test.step('hidden related tables should not be visible', async () => {
        for (const rtName of tc.hiddenRelatedTables) {
          const rtAccordion = RecordLocators.getRelatedTableAccordion(page, rtName);
          await expect.soft(rtAccordion).toHaveClass(/forced-hidden/);
        }
      });

      if (tc.shownRelatedTables.length > 0) {
        await test.step('shown related tables should have correct data', async () => {
          for (const rtName of tc.shownRelatedTables) {
            const rtContainer = RecordLocators.getRelatedTable(page, rtName);
            await expect.soft(rtContainer).toBeVisible();
          }
        });
      }
    });
  }
});
