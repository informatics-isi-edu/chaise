import { test, expect } from '@playwright/test';

// locators
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import ErdLocators from '@isrd-isi-edu/chaise/test/e2e/locators/erd';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { APP_NAMES, DOWNLOAD_FOLDER } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import {
  clickAndVerifyDownload,
  deleteDownloadedFiles,
} from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const SCHEMA = 'erd-test';
const MAIN = `${SCHEMA}:main`;
const OUTBOUND = `${SCHEMA}:outbound_1`;
const INBOUND = `${SCHEMA}:inbound_1`;
const ISOLATED = `${SCHEMA}:isolated`;
const SELF_REF = `${SCHEMA}:self_ref`;
const ALL_TABLE_IDS = [MAIN, OUTBOUND, INBOUND, ISOLATED, SELF_REF];

// edge ids are fk constraint ids (`schema:constraint_name`)
const MAIN_FK1 = `${SCHEMA}:main_fk_to_outbound_1`;
const MAIN_FK2 = `${SCHEMA}:main_fk2_to_outbound_1`;
const INBOUND_FK = `${SCHEMA}:inbound_1_fk_to_main`;
const SELF_FK = `${SCHEMA}:self_ref_fk_to_self`;

test.describe.configure({ mode: 'parallel' });

test.describe('ERD app', () => {
  test('presentation and detail levels', async ({ page, baseURL }, testInfo) => {
    const catalogId = getCatalogID(testInfo.project.name);
    await page.goto(`${baseURL}/${APP_NAMES.ERD}/#${catalogId}`);
    await ErdLocators.waitForErdPageReady(page);

    await test.step('page title and heading', async () => {
      await expect.soft(ErdLocators.getTitle(page)).toHaveText(`Catalog ${catalogId} Data Model`);
      await expect.soft(page).toHaveTitle(`Data Model #${catalogId} | Chaise`);
    });

    await test.step('all tables and edges present', async () => {
      await expect.soft(ErdLocators.getNodes(page)).toHaveCount(5);
      for (const id of ALL_TABLE_IDS) {
        await expect.soft(ErdLocators.getNode(page, id)).toBeVisible();
      }
      const mainHeader = ErdLocators.getNodeHeader(ErdLocators.getNode(page, MAIN));
      await expect.soft(mainHeader).toHaveText('main');
      await expect.soft(mainHeader).toHaveAttribute('title', MAIN);

      await expect.soft(ErdLocators.getEdges(page)).toHaveCount(4);
      // playwright reports rendered svg <g> edges as hidden, so assert attachment
      for (const id of [MAIN_FK1, MAIN_FK2, INBOUND_FK, SELF_FK]) {
        await expect.soft(ErdLocators.getEdge(page, id)).toBeAttached();
      }
    });

    await test.step('parallel fks render as distinct curves', async () => {
      const d1 = await ErdLocators.getEdgePath(page, MAIN_FK1).getAttribute('d');
      const d2 = await ErdLocators.getEdgePath(page, MAIN_FK2).getAttribute('d');
      expect.soft(d1).toMatch(/Q/);
      expect.soft(d2).toMatch(/Q/);
      expect.soft(d1).not.toBe(d2);
    });

    await test.step('self-referencing fk renders as a loop', async () => {
      // a curve command proves non-degeneracy: straight paths are M...L... only
      await expect.soft(ErdLocators.getEdgePath(page, SELF_FK)).toHaveAttribute('d', /C/);
    });

    await test.step('default detail shows keys only', async () => {
      const outbound = ErdLocators.getNode(page, OUTBOUND);
      await expect.soft(ErdLocators.getColumnNames(outbound)).toHaveText(['id', 'RID']);

      const inbound = ErdLocators.getNode(page, INBOUND);
      await expect
        .soft(ErdLocators.getPkColumns(inbound))
        .toHaveText(['id', 'key_col_1', 'key_col_2', 'RID']);

      // fk badges are suppressed at the keys level, and fk columns are hidden
      await expect.soft(ErdLocators.getFkBadges(page)).toHaveCount(0);
      const main = ErdLocators.getNode(page, MAIN);
      await expect.soft(ErdLocators.getColumnNames(main)).toHaveText(['id', 'RID']);

      const keyColRow = ErdLocators.getNodeRows(inbound).filter({ hasText: 'key_col_1' });
      await expect.soft(ErdLocators.getColumnTypes(keyColRow)).toHaveText('text');
    });

    await test.step('names detail hides all columns', async () => {
      await ErdLocators.getDetailDropdown(page).click();
      await ErdLocators.getDropdownOption(page, 'Table Names').click();
      await ErdLocators.waitForLayoutSettled(page);

      await expect.soft(ErdLocators.getNodeRows(page)).toHaveCount(0);
      await expect.soft(ErdLocators.getNodes(page)).toHaveCount(5);
    });

    await test.step('keys + foreign keys detail shows fk columns', async () => {
      await ErdLocators.getDetailDropdown(page).click();
      await ErdLocators.getDropdownOption(page, 'Keys + Foreign Keys').click();
      await ErdLocators.waitForLayoutSettled(page);

      const main = ErdLocators.getNode(page, MAIN);
      // the FK badge is nested inside the column-name span, so match that entry with a regex
      await expect
        .soft(ErdLocators.getColumnNames(main))
        .toHaveText(['id', /^fk_to_outbound_1/, /^fk2_to_outbound_1/, 'RID']);
      await expect.soft(ErdLocators.getFkBadges(main)).toHaveCount(2);

      const inbound = ErdLocators.getNode(page, INBOUND);
      await expect.soft(ErdLocators.getFkBadges(inbound)).toHaveCount(1);
    });

    await test.step('all columns detail shows everything', async () => {
      await ErdLocators.getDetailDropdown(page).click();
      await ErdLocators.getDropdownOption(page, 'All Columns').click();
      await ErdLocators.waitForLayoutSettled(page);

      const main = ErdLocators.getNode(page, MAIN);
      await expect
        .soft(ErdLocators.getColumnNames(main))
        .toHaveText(['id', /^fk_to_outbound_1/, /^fk2_to_outbound_1/, 'plain_col', 'RID']);
    });
  });

  test('toolbar interactions', async ({ page, baseURL }, testInfo) => {
    await page.goto(`${baseURL}/${APP_NAMES.ERD}/#${getCatalogID(testInfo.project.name)}`);
    await ErdLocators.waitForErdPageReady(page);

    await test.step('focus dims unconnected tables', async () => {
      await ErdLocators.getNode(page, OUTBOUND).click();

      await expect.soft(ErdLocators.getFocusedNodes(page)).toHaveCount(1);
      await expect.soft(ErdLocators.getNode(page, OUTBOUND)).toHaveClass(/erd-node-focused/);
      await expect.soft(ErdLocators.getNode(page, ISOLATED)).toHaveClass(/erd-node-dimmed/);
      await expect.soft(ErdLocators.getNode(page, INBOUND)).toHaveClass(/erd-node-dimmed/);
      await expect.soft(ErdLocators.getNode(page, SELF_REF)).toHaveClass(/erd-node-dimmed/);
      await expect
        .soft(ErdLocators.getNode(page, MAIN))
        .not.toHaveClass(/erd-node-dimmed|erd-node-focused/);

      // both parallel fks touch the focused pair, so both highlight
      await expect.soft(ErdLocators.getEdge(page, MAIN_FK1)).toHaveClass(/erd-edge-highlighted/);
      await expect.soft(ErdLocators.getEdge(page, MAIN_FK2)).toHaveClass(/erd-edge-highlighted/);
      await expect.soft(ErdLocators.getEdge(page, INBOUND_FK)).toHaveClass(/erd-edge-dimmed/);
      await expect.soft(ErdLocators.getEdge(page, SELF_FK)).toHaveClass(/erd-edge-dimmed/);
    });

    await test.step('pane click clears focus', async () => {
      // click a corner so we don't land on a node
      await ErdLocators.getPane(page).click({ position: { x: 5, y: 5 } });

      await expect.soft(ErdLocators.getFocusedNodes(page)).toHaveCount(0);
      await expect.soft(ErdLocators.getDimmedNodes(page)).toHaveCount(0);
      await expect.soft(ErdLocators.getHighlightedEdges(page)).toHaveCount(0);
      await expect.soft(ErdLocators.getDimmedEdges(page)).toHaveCount(0);
    });

    await test.step('toolbar collapse and expand', async () => {
      await ErdLocators.getHideSettingsButton(page).click();
      await expect.soft(ErdLocators.getToolbar(page)).not.toBeAttached();
      await expect.soft(ErdLocators.getCollapsedToolbar(page)).toBeVisible();

      await ErdLocators.getShowSettingsButton(page).click();
      await expect.soft(ErdLocators.getToolbar(page)).toBeVisible();
      await expect.soft(ErdLocators.getCollapsedToolbar(page)).not.toBeAttached();
    });

    await test.step('unchecking a table removes it', async () => {
      const tables = ErdLocators.getChecklist(page, 'Tables');
      const item = ErdLocators.getChecklistItem(tables, INBOUND);

      await ErdLocators.getChecklistCheckbox(item).click();
      await ErdLocators.waitForLayoutSettled(page);
      await expect.soft(ErdLocators.getNode(page, INBOUND)).not.toBeAttached();
      await expect.soft(ErdLocators.getEdge(page, INBOUND_FK)).not.toBeAttached();
      await expect.soft(ErdLocators.getEdge(page, MAIN_FK1)).toBeAttached();
      await expect.soft(ErdLocators.getEdge(page, MAIN_FK2)).toBeAttached();
      await expect.soft(ErdLocators.getEdge(page, SELF_FK)).toBeAttached();
      await expect.soft(ErdLocators.getNodes(page)).toHaveCount(4);

      await ErdLocators.getChecklistCheckbox(item).click();
      await ErdLocators.waitForLayoutSettled(page);
      await expect.soft(ErdLocators.getNodes(page)).toHaveCount(5);
    });

    await test.step('unchecking the schema empties the canvas', async () => {
      const schemas = ErdLocators.getChecklist(page, 'Schemas');
      const item = ErdLocators.getChecklistItem(schemas, SCHEMA);

      await ErdLocators.getChecklistCheckbox(item).click();
      await ErdLocators.waitForLayoutSettled(page);
      await expect.soft(ErdLocators.getNodes(page)).toHaveCount(0);
      const tables = ErdLocators.getChecklist(page, 'Tables');
      await expect
        .soft(ErdLocators.getChecklistEmpty(tables))
        .toHaveText('No tables to show. Select a schema above.');

      await ErdLocators.getChecklistCheckbox(item).click();
      await ErdLocators.waitForErdPageReady(page);
      await expect.soft(ErdLocators.getNodes(page)).toHaveCount(5);
    });

    await test.step('layout algorithm switch', async () => {
      await ErdLocators.getLayoutDropdown(page).click();
      await ErdLocators.getDropdownOption(page, 'Radial').click();
      await ErdLocators.waitForLayoutSettled(page);

      await expect.soft(ErdLocators.getNodes(page)).toHaveCount(5);
      await expect.soft(ErdLocators.getEdges(page)).toHaveCount(4);
      await expect.soft(AlertLocators.getWarningAlert(page)).not.toBeAttached();
    });

    await test.step('node dragging moves the node', async () => {
      const node = ErdLocators.getNode(page, ISOLATED);
      const before = await node.evaluate((el) => el.style.transform);

      const box = await node.boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;
      await page.mouse.move(box.x + box.width / 2, box.y + 10);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 60, box.y + 70, { steps: 5 });
      await page.mouse.up();

      // assert the position changed, never its absolute value
      await expect.poll(async () => node.evaluate((el) => el.style.transform)).not.toBe(before);
      await expect.soft(ErdLocators.getNodeHeader(node)).toHaveText('isolated');
      await expect.soft(AlertLocators.getAlerts(page)).toHaveCount(0);
    });

    await test.step('erd display mode swaps edge markers', async () => {
      await ErdLocators.getDisplayModeDropdown(page).click();
      await ErdLocators.getDropdownOption(page, 'ERD').click();
      // mode change re-runs the layout (see the settings-change effect)
      await ErdLocators.waitForLayoutSettled(page);

      // crow's foot notation marks both ends; simplified mode only has an end arrow
      await expect
        .soft(ErdLocators.getEdgePath(page, MAIN_FK1))
        .toHaveAttribute('marker-start', /erd-marker/);
      await expect
        .soft(ErdLocators.getEdgePath(page, MAIN_FK1))
        .toHaveAttribute('marker-end', /erd-marker/);

      await ErdLocators.getDisplayModeDropdown(page).click();
      await ErdLocators.getDropdownOption(page, 'Simplified').click();
      await ErdLocators.waitForLayoutSettled(page);
      await expect
        .soft(ErdLocators.getEdgePath(page, MAIN_FK1))
        .not.toHaveAttribute('marker-start', /erd-marker/);
    });

    await test.step('remove overlaps keeps all tables', async () => {
      await ErdLocators.getRemoveOverlapsButton(page).click();
      await ErdLocators.waitForLayoutSettled(page);

      await expect.soft(ErdLocators.getNodes(page)).toHaveCount(5);
      await expect.soft(AlertLocators.getWarningAlert(page)).not.toBeAttached();
    });
  });

  test('export pdf', async ({ page, baseURL }, testInfo) => {
    await page.goto(`${baseURL}/${APP_NAMES.ERD}/#${getCatalogID(testInfo.project.name)}`);
    await ErdLocators.waitForErdPageReady(page);

    await deleteDownloadedFiles([`${DOWNLOAD_FOLDER}/erd.pdf`]);
    await clickAndVerifyDownload(ErdLocators.getExportPdfButton(page), 'erd.pdf');
  });

  test('no catalog specified', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/${APP_NAMES.ERD}/`);

    const errorModal = ModalLocators.getErrorModal(page);
    await expect(errorModal).toBeVisible();
    await expect(errorModal).toContainText('No Catalog');
    await expect(errorModal).toContainText('No catalog specified');
  });
});
