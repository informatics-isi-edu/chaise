/* eslint-disable max-len */
import { test, expect } from '@playwright/test';

// locators
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';

// utils
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import { testAddRelatedTable } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';
import { setInputValue } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';

const schemaName = 'condition-test';
const tableName = 'main';

/**
 * Coverage map (see condition-task-imp.md for the design):
 *
 * Condition source types:
 *   - sync local column            -> cond_local_null  (vis-col local_col)
 *   - sync all-outbound scalar     -> cond_outbound_scalar  (vis-col outbound1_col)
 *   - sync all-outbound entity     -> inline cond on pattern_local_col
 *   - inline condition + wait_for  -> inline cond on pattern_with_waitfor_col
 *   - async inbound entityset      -> cond_inbound1  (shared by 3 items; condition_pattern over
 *                                     $self -> exercises single-inbound entityset $self end-to-end)
 *   - async aggregate cnt          -> cond_inbound_count (vis-col inbound1_count_col)
 *   - async pure-and-binary        -> cond_assoc  (vis-fk assoc_target)
 *   - async 3-hop with shared-prefix sourcekey -> cond_path_multi  (vis-fk path_target;
 *                                     condition_pattern over $self -> exercises multi-hop entityset
 *                                     $self end-to-end, proving chaise routes the page to $self)
 *   - async path with filter       -> cond_path_filter  (vis-fk filtered_inbound1)
 *   - on_empty:"show" inversion    -> cond_always_show  (vis-fk always_shown_table)
 *   - no-source (pattern-only)     -> inline + condition_key, on both vis-col
 *                                     (ns_inline_show / ns_inline_hide / ns_key_show)
 *                                     and vis-fk (ns_related_show / ns_related_hide).
 *                                     These are evaluated synchronously at column-build
 *                                     time and filtered before chaise sees them.
 *
 * Visible item exercising both a condition AND its own display.wait_for:
 *   inline-related vis-col "inbound1 (inline)" — condition_key cond_inbound1
 *   plus display.markdown_pattern with wait_for cond_input_wf.
 *
 * Shared condition between vis-col and vis-fk:
 *   cond_inbound1 is referenced from vis-col #7 (inline-related), vis-col #8
 *   (count column), and vis-fk #1 (standalone inbound1 section).
 */

test.describe.configure({ mode: 'parallel' });

test.describe('Condition on visible columns and foreign keys', () => {

  test('id=1 (populated): all conditioned content shown', async ({ page, baseURL }, testInfo) => {
    const url = generateChaiseURL(APP_NAMES.RECORD, schemaName, tableName, testInfo, baseURL) + '/id=1';
    await page.goto(url);
    await RecordLocators.waitForRecordPageReady(page);

    await test.step('main-section visible columns are exactly the expected list, in order', async () => {
      // ns_inline_show / ns_key_show: no-source conditions that render non-empty -> kept.
      // ns_inline_hide: no-source condition that renders empty -> filtered out by the
      // no-source filter pass in ermrestjs (applyNoSourceConditions).
      await expect.soft(RecordLocators.getAllColumnNames(page)).toHaveText([
        'title',
        'local_col',
        'outbound1_col',
        'outbound2_col',
        'pattern_local_col',
        'pattern_with_waitfor_col',
        'gated_col',
        'inbound1_count_col',
        'ns_inline_show',
        'ns_key_show',
      ]);
    });

    await test.step('related-table accordions are exactly the expected list, in order', async () => {
      // ns_related_show: no-source condition renders non-empty -> kept.
      // ns_related_hide: no-source condition renders empty -> filtered out.
      await expect.soft(RecordLocators.getDisplayedRelatedTableTitles(page)).toHaveText([
        'inbound1',
        'assoc_target',
        'filtered_inbound1',
        'path_target',
        'always_shown_table',
        'ns_related_show',
      ]);
    });

    await test.step('side-panel TOC lists every visible section', async () => {
      await expect.soft(RecordLocators.getSidePanelHeadings(page)).toHaveText([
        'Summary',
        'inbound1 (1)',
        'assoc_target (1)',
        'filtered_inbound1 (1)',
        'path_target (1)',
        'always_shown_table (0)',
        'ns_related_show (0)',
      ]);
    });
  });

  test('id=2 (empty): conditioned content hidden, only unconditional + on_empty:"show" + no-source-show remain', async ({ page, baseURL }, testInfo) => {
    const url = generateChaiseURL(APP_NAMES.RECORD, schemaName, tableName, testInfo, baseURL) + '/id=2';
    await page.goto(url);
    await RecordLocators.waitForRecordPageReady(page);

    await test.step('title + outbound columns + no-source-show columns remain in main-section', async () => {
      // no-source conditions are deterministic (don't depend on row data), so ns_inline_show
      // and ns_key_show appear for id=2 just like for id=1.
      await expect.soft(RecordLocators.getAllColumnNames(page)).toHaveText([
        'title',
        'outbound1_col',
        'outbound2_col',
        'ns_inline_show',
        'ns_key_show',
      ]);
    });

    await test.step('inbound1 + always_shown_table + ns_related_show accordions are visible', async () => {
      await expect.soft(RecordLocators.getDisplayedRelatedTableTitles(page)).toHaveText([
        'inbound1',
        'always_shown_table',
        'ns_related_show',
      ]);
    });

    await test.step('TOC lists Summary + visible related sections', async () => {
      await expect.soft(RecordLocators.getSidePanelHeadings(page)).toHaveText([
        'Summary',
        'inbound1 (0)',
        'always_shown_table (0)',
        'ns_related_show (0)',
      ]);
    });
  });

  test('id=1: a source used as display + condition + gated value is read once', async ({ page, baseURL }, testInfo) => {
    // Two dedup paths, both should collapse to a single read:
    //  - cond_inbound1_src (entity set) is BOTH the inbound1 vis-fk display AND the source of
    //    cond_inbound1 -> the condition source folds onto the display (one entity-set read).
    //  - cond_inbound_count_src (cnt aggregate) is BOTH inbound1_count_col's value AND its own
    //    gate cond_inbound_count -> the gated value folds onto the condition source (one count read).
    const ermrestReads: string[] = [];
    page.on('request', (req) => {
      const u = req.url();
      if (req.method() === 'GET' && u.includes('/ermrest/catalog/') &&
        (u.includes('/entity/') || u.includes('/attributegroup/') || u.includes('/aggregate/'))) {
        ermrestReads.push(u);
      }
    });

    const url = generateChaiseURL(APP_NAMES.RECORD, schemaName, tableName, testInfo, baseURL) + '/id=1';
    await page.goto(url);
    await RecordLocators.waitForRecordPageReady(page);
    await page.waitForLoadState('networkidle');

    // the inbound1 entity-set read (related reads aggregate rows via array_d). This is the
    // query shared by the inbound1 vis-fk display and the cond_inbound1 source. The count
    // aggregate (cnt), the kind=primary filtered read, and the multi-hop path read also touch
    // inbound1 but are distinct queries, so the source-hash anchor + array_d excludes them.
    const inbound1EntitySetReads = ermrestReads.filter((u) =>
      u.includes('M:=condition-test:inbound1/(main_id)') &&
      u.includes('array_d') &&
      !u.includes('kind=primary')
    );

    // the inbound1 count aggregate, shared by inbound1_count_col's value and its gate.
    const inbound1CountReads = ermrestReads.filter((u) => u.includes('cnt(T:RID)') && u.includes('inbound1:main_id'));

    await test.step('inbound1 entity set is read exactly once', async () => {
      expect(inbound1EntitySetReads, 'inbound1 entity-set reads:\n' + inbound1EntitySetReads.join('\n')).toHaveLength(1);
    });

    await test.step('inbound1 count aggregate is read exactly once', async () => {
      expect(inbound1CountReads, 'inbound1 count reads:\n' + inbound1CountReads.join('\n')).toHaveLength(1);
    });
  });

  test('id=2: adding a related record re-evaluates conditions', async ({ page, baseURL }, testInfo) => {
    const url = generateChaiseURL(APP_NAMES.RECORD, schemaName, tableName, testInfo, baseURL) + '/id=2';
    await page.goto(url);
    await RecordLocators.waitForRecordPageReady(page);

    await test.step('initial state: inbound1-keyed columns absent; inbound1 vis-fk available for Add records', async () => {
      await expect.soft(RecordLocators.getAllColumnNames(page)).toHaveText([
        'title',
        'outbound1_col',
        'outbound2_col',
        'ns_inline_show',
        'ns_key_show',
      ]);
      await expect.soft(RecordLocators.getDisplayedRelatedTableTitles(page)).toHaveText([
        'inbound1',
        'always_shown_table',
        'ns_related_show',
      ]);
    });

    // Open the inbound1 vis-fk's "Add records" form, fill it, submit, return.
    // testAddRelatedTable closes the recordedit tab and refocuses the record
    // page — that focus event is what triggers chaise's update flow, which
    // in Option B re-runs evaluateConditionModel for every condition.
    await testAddRelatedTable(
      page,
      async (newPage) => {
        await setInputValue(newPage, 1, 'id', 'id', RecordeditInputType.INT_4, '99');
        await setInputValue(newPage, 1, 'value', 'value', RecordeditInputType.TEXT, 'new');
        await setInputValue(newPage, 1, 'kind', 'kind', RecordeditInputType.TEXT, 'primary');
      },
      {
        tableName: 'inbound1',
        schemaName,
        displayname: 'inbound1',
        tableDisplayname: 'inbound1',
        prefilledValues: {
          main_id: { value: 'Row 2', inputType: RecordeditInputType.FK_POPUP, isDisabled: true },
        },
        rowValuesAfter: [['99', 'new', 'primary']],
      }
    );

    await test.step('after add: inbound1-keyed items become visible (re-evaluation worked)', async () => {
      await RecordLocators.waitForRecordPageReady(page);

      // gated_col (cond_inbound1) and inbound1_count_col (cond_inbound_count)
      // flip from hidden to shown because their conditions now resolve to
      // non-empty. ns_inline_show / ns_key_show remain visible throughout.
      await expect.soft(RecordLocators.getAllColumnNames(page)).toHaveText([
        'title',
        'outbound1_col',
        'outbound2_col',
        'gated_col',
        'inbound1_count_col',
        'ns_inline_show',
        'ns_key_show',
      ]);

      // filtered_inbound1 (path_filter on inbound1.kind=primary) flips because
      // the new row has kind=primary. assoc_target and path_target stay
      // hidden because their data chains are still empty for main.id=2 —
      // proving re-evaluation in BOTH directions is correct, not blanket "show".
      // ns_related_show remains visible (no-source conditions are unaffected by re-evaluation).
      await expect.soft(RecordLocators.getDisplayedRelatedTableTitles(page)).toHaveText([
        'inbound1',
        'filtered_inbound1',
        'always_shown_table',
        'ns_related_show',
      ]);
    });
  });

});
