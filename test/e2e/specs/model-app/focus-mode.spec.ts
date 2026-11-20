import { test, expect, Page } from '@playwright/test';

// locators
import ModelAppLocators from '@isrd-isi-edu/chaise/test/e2e/locators/model-app';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';

const SCHEMA = 'model-test';
const ISOLATED = `${SCHEMA}:isolated`;

const FOCUS_SCHEMA = 'model-test-focus-mode';
const FOCUS = `${FOCUS_SCHEMA}:focus`;
const OUTBOUND = `${FOCUS_SCHEMA}:outbound_t`;
const INBOUND = `${FOCUS_SCHEMA}:inbound_t`;
const BOTH = `${FOCUS_SCHEMA}:both_t`;
const ASSOCIATION = `${FOCUS_SCHEMA}:focus_tag`;
const FAR_SIDE = `${FOCUS_SCHEMA}:tag`;
const LONG_NAME = `${FOCUS_SCHEMA}:inbound_with_a_very_long_table_name`;
const TWO_HOPS = `${FOCUS_SCHEMA}:two_hops`;
const UNRELATED = `${FOCUS_SCHEMA}:unrelated`;

// a second schema, so focus mode has a neighbor in another schema
const FOCUS_SCHEMA_2 = 'model-test-focus-mode-2';
const REMOTE = `${FOCUS_SCHEMA_2}:remote`;

const CATALOG_OPTION = 'Catalog (all tables)';

/**
 * the model app url for the test catalog, followed by `path` (e.g. `/schema:table`)
 */
const modelURL = (baseURL: string | undefined, catalogId: string, path = '') => `${baseURL}/${APP_NAMES.MODEL}/#${catalogId}${path}`;

/**
 * a flag on window that only a page reload clears
 */
const setReloadMarker = (page: Page) => page.evaluate(() => {
  (window as unknown as { modelTestMarker?: boolean }).modelTestMarker = true;
});

const hasReloadMarker = (page: Page) => page.evaluate(() => (window as unknown as { modelTestMarker?: boolean }).modelTestMarker === true);

/**
 * pick an option in the model scope dropdown
 */
const pickScope = async (page: Page, label: string) => {
  await ModelAppLocators.getScopeDropdownToggle(page).click();
  await ModelAppLocators.getScopeDropdownOption(page, label).click();
  await ModelAppLocators.waitForLayoutSettled(page);
};

test.describe.configure({ mode: 'parallel' });

test.describe('Model app focus mode', () => {
  test('focus url', async ({ page, baseURL }, testInfo) => {
    const catalogId = getCatalogID(testInfo.project.name);
    await page.goto(modelURL(baseURL, catalogId, `/${FOCUS}`));
    await ModelAppLocators.waitForPageReady(page);

    await test.step('title and scope', async () => {
      await expect.soft(ModelAppLocators.getTitle(page)).toHaveText(`Catalog ${catalogId} Data Model: ${FOCUS} and its neighbors`);
      await expect.soft(page).toHaveTitle(`Data Model #${catalogId}: ${FOCUS} | Chaise`);
      await expect.soft(ModelAppLocators.getScopeDropdownToggle(page)).toHaveText(FOCUS);
    });

    await test.step('only the neighbors are drawn', async () => {
      await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(8);
      await expect.soft(ModelAppLocators.getEdges(page)).toHaveCount(8);
      await expect.soft(ModelAppLocators.getNode(page, TWO_HOPS)).not.toBeAttached();
      await expect.soft(ModelAppLocators.getNode(page, UNRELATED)).not.toBeAttached();
    });

    await test.step('header colors', async () => {
      const expected: [string, string][] = [
        [FOCUS, 'model-table-node-focus'],
        [OUTBOUND, 'model-table-node-outbound'],
        [BOTH, 'model-table-node-both'],
        [INBOUND, 'model-table-node-inbound'],
        [ASSOCIATION, 'model-table-node-inbound'],
        [FAR_SIDE, 'model-table-node-inbound'],
        [LONG_NAME, 'model-table-node-inbound'],
        [REMOTE, 'model-table-node-inbound'],
      ];
      for (const [tableId, className] of expected) {
        await expect.soft(ModelAppLocators.getNodeBox(ModelAppLocators.getNode(page, tableId))).toContainClass(className);
      }
      await expect.soft(ModelAppLocators.getLegendItems(page)).toHaveText(['Focused table', 'Referenced by', 'Referencing', 'Both']);
    });

    await test.step('schema:table headers', async () => {
      await expect.soft(ModelAppLocators.getNodeHeader(ModelAppLocators.getNode(page, INBOUND))).toHaveText(INBOUND);
      const longHeader = ModelAppLocators.getNodeHeader(ModelAppLocators.getNode(page, LONG_NAME));
      await expect.soft(longHeader).toHaveText(LONG_NAME);
      await expect.soft(longHeader).toContainClass('model-table-node-header-two-lines');
    });

    await test.step('lists cover only the neighbors', async () => {
      const tables = ModelAppLocators.getTablesChecklist(page);
      await expect.soft(ModelAppLocators.getChecklistTitle(tables)).toHaveText('Neighboring tables');
      await expect.soft(ModelAppLocators.getChecklistItems(tables)).toHaveCount(7);
      await expect.soft(ModelAppLocators.getChecklistItem(tables, FOCUS)).not.toBeAttached();
      await expect.soft(ModelAppLocators.getChecklistSummary(tables)).toHaveText('Found 7 (7 Displayed)');
      await expect.soft(ModelAppLocators.getChecklistSearch(tables)).not.toBeAttached();

      const schemas = ModelAppLocators.getSchemasChecklist(page);
      await expect.soft(ModelAppLocators.getChecklistItems(schemas)).toHaveText([FOCUS_SCHEMA, FOCUS_SCHEMA_2]);
    });
  });

  test('lists in focus mode', async ({ page, baseURL }, testInfo) => {
    await page.goto(modelURL(baseURL, getCatalogID(testInfo.project.name), `/${FOCUS}`));
    await ModelAppLocators.waitForPageReady(page);
    const tables = ModelAppLocators.getTablesChecklist(page);
    const schemas = ModelAppLocators.getSchemasChecklist(page);

    await test.step('hide and show all', async () => {
      await ModelAppLocators.getChecklistHideAll(tables).click();
      await ModelAppLocators.waitForLayoutSettled(page);
      await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(1);
      await expect.soft(ModelAppLocators.getNode(page, FOCUS)).toBeVisible();
      await expect.soft(ModelAppLocators.getLegendItems(page)).toHaveText(['Focused table']);

      await ModelAppLocators.getChecklistShowAll(tables).click();
      await ModelAppLocators.waitForLayoutSettled(page);
      await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(8);
    });

    await test.step('legend drops hidden kinds', async () => {
      await ModelAppLocators.getChecklistCheckbox(ModelAppLocators.getChecklistItem(tables, BOTH)).click();
      await ModelAppLocators.waitForLayoutSettled(page);
      await expect.soft(ModelAppLocators.getLegendItems(page)).toHaveText(['Focused table', 'Referenced by', 'Referencing']);
    });

    await test.step('unchecking every schema keeps the focused table', async () => {
      for (const schema of [FOCUS_SCHEMA, FOCUS_SCHEMA_2]) {
        await ModelAppLocators.getChecklistCheckbox(ModelAppLocators.getChecklistItem(schemas, schema)).click();
        await ModelAppLocators.waitForLayoutSettled(page);
      }
      await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(1);
      await expect.soft(ModelAppLocators.getNode(page, FOCUS)).toBeVisible();
      await expect.soft(ModelAppLocators.getChecklistEmpty(tables)).toHaveText('No tables to show. Select a schema above.');
    });
  });

  test('no neighbors', async ({ page, baseURL }, testInfo) => {
    await page.goto(modelURL(baseURL, getCatalogID(testInfo.project.name), `/${ISOLATED}`));
    await ModelAppLocators.waitForPageReady(page);

    await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(1);
    for (const checklist of [ModelAppLocators.getSchemasChecklist(page), ModelAppLocators.getTablesChecklist(page)]) {
      await expect.soft(ModelAppLocators.getChecklistEmpty(checklist)).toHaveText('This table has no neighbors.');
    }
    await expect.soft(ModelAppLocators.getLegendItems(page)).toHaveText(['Focused table']);
  });

  test('focused table schema is not listed', async ({ page, baseURL }, testInfo) => {
    // remote's only neighbor is in the other schema
    await page.goto(modelURL(baseURL, getCatalogID(testInfo.project.name), `/${REMOTE}`));
    await ModelAppLocators.waitForPageReady(page);

    const schemas = ModelAppLocators.getSchemasChecklist(page);
    await expect.soft(ModelAppLocators.getChecklistItems(schemas)).toHaveText([FOCUS_SCHEMA]);
  });

  test('scope dropdown and history', async ({ page, baseURL }, testInfo) => {
    const catalogId = getCatalogID(testInfo.project.name);
    await page.goto(modelURL(baseURL, catalogId, '?hideNavbar=true&pcid=x'));
    await ModelAppLocators.waitForPageReady(page);
    const schemas = ModelAppLocators.getSchemasChecklist(page);
    const remoteSchema = ModelAppLocators.getChecklistCheckbox(ModelAppLocators.getChecklistItem(schemas, FOCUS_SCHEMA_2));

    await test.step('catalog scope', async () => {
      await expect.soft(ModelAppLocators.getScopeDropdownToggle(page)).toHaveText(CATALOG_OPTION);
      await expect.soft(ModelAppLocators.getLegend(page)).not.toBeAttached();

      // so going back can tell the saved catalog view from a fresh one
      await remoteSchema.click();
      await ModelAppLocators.waitForLayoutSettled(page);
      await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(6);
      await setReloadMarker(page);
    });

    await test.step('search the options', async () => {
      await ModelAppLocators.getScopeDropdownToggle(page).click();
      await expect.soft(ModelAppLocators.getScopeDropdownSelectedOption(page)).toHaveText(CATALOG_OPTION);

      // with the colon, since every table in the focus mode schemas has "focus" in its schema name
      const search = ModelAppLocators.getScopeDropdownSearch(page);
      await search.fill(':focus');
      await expect.soft(ModelAppLocators.getScopeDropdownOptions(page)).toHaveCount(2);
      await search.fill('catalog');
      await expect.soft(ModelAppLocators.getScopeDropdownOptions(page)).toHaveText([CATALOG_OPTION]);
      await search.fill('no_such_table');
      await expect.soft(ModelAppLocators.getScopeDropdownNoResults(page)).toHaveText('No Results');

      await search.fill(':focus');
      await ModelAppLocators.getScopeDropdownOption(page, FOCUS).click();
      await ModelAppLocators.waitForLayoutSettled(page);
    });

    await test.step('picking a table', async () => {
      // the logging param is dropped, the others carry over
      await expect.soft(page).toHaveURL(new RegExp(`/${FOCUS}\\?hideNavbar=true$`));
      await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(8);
      await expect.soft(ModelAppLocators.getLegend(page)).toBeVisible();

      await ModelAppLocators.getScopeDropdownToggle(page).click();
      await expect.soft(ModelAppLocators.getScopeDropdownSelectedOption(page)).toHaveText(FOCUS);
      await page.keyboard.press('Escape');
      await expect.soft(ModelAppLocators.getScopeDropdownMenu(page)).not.toBeAttached();
    });

    await test.step('back and forward', async () => {
      await page.goBack();
      await ModelAppLocators.waitForLayoutSettled(page);
      await expect.soft(page).toHaveURL(new RegExp(`#${catalogId}\\?hideNavbar=true&pcid=x$`));
      await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(6);
      await expect.soft(remoteSchema).toBeChecked();
      await expect.soft(ModelAppLocators.getLegend(page)).not.toBeAttached();

      await page.goForward();
      await ModelAppLocators.waitForLayoutSettled(page);
      await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(8);
      expect.soft(await hasReloadMarker(page)).toBe(true);
    });

    await test.step('back to the catalog', async () => {
      await pickScope(page, CATALOG_OPTION);
      await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(6);
      expect.soft(await hasReloadMarker(page)).toBe(true);
    });
  });

  test('catalog from a focus url', async ({ page, baseURL }, testInfo) => {
    // nothing was saved for the catalog, so it shows the focused table's schema
    await page.goto(modelURL(baseURL, getCatalogID(testInfo.project.name), `/${FOCUS}`));
    await ModelAppLocators.waitForPageReady(page);

    await pickScope(page, CATALOG_OPTION);
    const schemas = ModelAppLocators.getSchemasChecklist(page);
    await expect.soft(ModelAppLocators.getChecklistCheckbox(ModelAppLocators.getChecklistItem(schemas, FOCUS_SCHEMA))).toBeChecked();
    await expect.soft(ModelAppLocators.getChecklistCheckbox(ModelAppLocators.getChecklistItem(schemas, SCHEMA))).not.toBeChecked();
    await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(9);
  });

  test('checklist tiers', async ({ page, baseURL }, testInfo) => {
    await page.goto(modelURL(baseURL, getCatalogID(testInfo.project.name)));
    await ModelAppLocators.waitForPageReady(page);
    const tables = ModelAppLocators.getTablesChecklist(page);
    const schemas = ModelAppLocators.getSchemasChecklist(page);

    await test.step('5 tables: no summary or search', async () => {
      await expect.soft(ModelAppLocators.getChecklistSummary(tables)).not.toBeAttached();
      await expect.soft(ModelAppLocators.getChecklistSearch(tables)).not.toBeAttached();
    });

    await test.step('15 tables: summary and search', async () => {
      for (const schema of [FOCUS_SCHEMA, FOCUS_SCHEMA_2]) {
        await ModelAppLocators.getChecklistCheckbox(ModelAppLocators.getChecklistItem(schemas, schema)).click();
        await ModelAppLocators.waitForLayoutSettled(page);
      }
      await expect.soft(ModelAppLocators.getChecklistSummary(tables)).toHaveText('Found 15 of 15 (15 Displayed)');

      // with the colon, since every table in the focus mode schemas has "focus" in its schema name
      const search = ModelAppLocators.getChecklistSearch(tables);
      await search.fill(':focus');
      await expect.soft(ModelAppLocators.getChecklistSummary(tables)).toHaveText('Found 2 of 15 (2 Displayed)');
      await search.fill('');
      await expect.soft(ModelAppLocators.getChecklistSummary(tables)).toHaveText('Found 15 of 15 (15 Displayed)');
    });
  });

  test('unqualified table name', async ({ page, baseURL }, testInfo) => {
    // `focus` is unique in the catalog
    await page.goto(modelURL(baseURL, getCatalogID(testInfo.project.name), '/focus'));
    await ModelAppLocators.waitForPageReady(page);

    await expect.soft(ModelAppLocators.getScopeDropdownToggle(page)).toHaveText(FOCUS);
    await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(8);
  });

  test('table outside the diagram', async ({ page, baseURL }, testInfo) => {
    // ermrest's own table in public, a schema the diagram skips
    await page.goto(modelURL(baseURL, getCatalogID(testInfo.project.name), '/public:ERMrest_Client'));

    const errorModal = ModalLocators.getErrorModal(page);
    await expect(errorModal).toBeVisible();
    await expect.soft(errorModal).toContainText('is not part of the data model diagram');
  });

  test('hash edit after load', async ({ page, baseURL }, testInfo) => {
    const catalogId = getCatalogID(testInfo.project.name);
    await page.goto(modelURL(baseURL, catalogId));
    await ModelAppLocators.waitForPageReady(page);
    await setReloadMarker(page);

    await page.evaluate((hash) => { window.location.hash = hash; }, `${catalogId}/${FOCUS}`);
    await ModelAppLocators.waitForLayoutSettled(page);
    await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(8);
    // switched in place, without a reload
    expect.soft(await hasReloadMarker(page)).toBe(true);
  });

  test('hash edit after an unknown table', async ({ page, baseURL }, testInfo) => {
    const catalogId = getCatalogID(testInfo.project.name);
    await page.goto(modelURL(baseURL, catalogId, `/${SCHEMA}:no_such_table`));
    await expect(ModalLocators.getErrorModal(page)).toBeVisible();

    await page.evaluate((hash) => { window.location.hash = hash; }, catalogId);
    await ModelAppLocators.waitForPageReady(page);
    await expect.soft(ModalLocators.getErrorModal(page)).not.toBeAttached();
    await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(5);
  });

  test('hash edit after an unknown catalog', async ({ page, baseURL }, testInfo) => {
    const catalogId = getCatalogID(testInfo.project.name);
    await page.goto(`${baseURL}/${APP_NAMES.MODEL}/#999999`);
    await expect(ModalLocators.getErrorModal(page)).toBeVisible();

    // the model app isn't set up yet, so app-wrapper does the reload
    await page.evaluate((hash) => { window.location.hash = hash; }, catalogId);
    await ModelAppLocators.waitForPageReady(page);
    await expect.soft(ModalLocators.getErrorModal(page)).not.toBeAttached();
    await expect.soft(ModelAppLocators.getNodes(page)).toHaveCount(5);
  });
});
