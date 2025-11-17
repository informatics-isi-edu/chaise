import { test, expect, TestInfo, Page, Locator } from '@playwright/test';

// locators
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { changeStoredOrder } from '@isrd-isi-edu/chaise/test/e2e/utils/facet-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import {
  openRecordsetAndResetFacetState,
  TestIndividualFacetParams,
  testIndividualFacet,
  resetFacetState,
  testDisplayedFacets,
  testDisplayedFacetItemsAndGroups,
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';
import {
  clickNewTabLink,
  dragAndDropWithScroll,
  generateChaiseURL,
} from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

/**
 * - similar to reorder-facet first test
 * - open page with saved state
 *   - the multiple tests that we have in facet-groups.md
 *   - do we need any more tests for multiple groups?
 *
 */

const SCHEMA_NAME = 'facet-group';

const reorderParams = {
  tableName: 'main_reorder',
  expectedFacetNames: ['col_1', 'Group 1', 'col_6', 'col_2', 'col_3', 'col_5', 'col_4', 'Group 2', 'id'],
  expectedOpenFacetNames: ['col_1', 'Group 1', 'Group 2'],
}

const storageTests = [
  {
    description: 'invalid stored order',
    tableName: 'main_reorder',
    storage: [
      { name: 'invalid_facet_1', open: false },
      {
        markdown_name: 'missing group',
        open: false,
        children: [
          { name: 'col_5', open: true },
          { name: 'col_6', open: false },
          { name: 'col_3', open: false },
          { name: 'col_2', open: false },
        ],
      }
    ],
    expectedFacetNames: ['col_1', 'Group 1', 'col_6', 'col_2', 'col_3', 'col_5', 'col_4', 'Group 2', 'id'],
    expectedOpenFacetNames: ['col_1', 'Group 1', 'Group 2'],
  },
  {
    description: 'simple reorder and open states',
    tableName: 'main_reorder',
    storage: [
      { markdown_name: 'Group 2', open: true, children: [{ name: 'id', open: false }] },
      {
        markdown_name: 'Group 1',
        open: false,
        children: [
          { name: 'col_5', open: true },
          { name: 'col_6', open: false },
          { name: 'col_3', open: false },
          { name: 'col_2', open: false },
        ],
      },
      { name: 'col_4', open: true },
      { name: 'col_1', open: false },
    ],
    expectedFacetNames: ['Group 2', 'id', 'Group 1', 'col_5', 'col_6', 'col_3', 'col_2', 'col_4', 'col_1'],
    expectedOpenFacetNames: ['Group 2', 'col_5', 'col_4'],
  },
  {
    description: 'missing children (group first)',
    tableName: 'main_reorder',
    storage:[
      { name: 'col_1', open: false },
      { name: 'col_4', open: false },
      {
        markdown_name: 'Group 1',
        open: true,
        children: [
          { name: 'col_3', open: false },
        ],
      },
      { markdown_name: 'Group 2', open: true, children: [{ name: 'id', open: true }] },
      { name: 'col_5', open: false },
      { name: 'col_2', open: false },
    ],
    expectedFacetNames: ['col_1', 'col_4', 'Group 1', 'col_3', 'col_5', 'col_2', 'col_6', 'Group 2', 'id'],
    expectedOpenFacetNames: ['Group 1', 'Group 2', 'id'],
  },
  {
    description: 'missing children (group last, all closed)',
    tableName: 'main_reorder',
    storage: [
      { name: 'col_1', open: false },
      { name: 'col_2', open: false },
      { name: 'col_4', open: false },
      { name: 'col_5', open: false },
      { markdown_name: 'Group 2', open: false, children: [{ name: 'id', open: false }] },
      {
        markdown_name: 'Group 1',
        open: false,
        children: [
          { name: 'col_3', open: false },
        ],
      },
    ],
    expectedFacetNames: ['col_1', 'Group 1', 'col_2', 'col_5', 'col_3', 'col_6', 'col_4', 'Group 2', 'id'],
    expectedOpenFacetNames: ['col_1'],
  },
];

test.describe('Reorder facet groups', () => {
  test.describe.configure({ mode: 'parallel' });

  test('changing order', async ({ page, baseURL }, testInfo) => {
    const params = reorderParams;

    await test.step('open recordset and reset facet state', async () => {
      await page.goto(
        generateChaiseURL(APP_NAMES.RECORDSET, SCHEMA_NAME, params.tableName, testInfo, baseURL)
      );
      await RecordsetLocators.waitForRecordsetPageReady(page);
      await testDisplayedFacetItemsAndGroups(page, params.expectedFacetNames, params.expectedOpenFacetNames);
    });

    // TODO

  });

  for (const currTest of storageTests) {
    test(`stored order: ${currTest.description}`, async ({ page, baseURL }, testInfo) => {
      await testStoredOrder(
        page,
        baseURL,
        testInfo,
        currTest.tableName,
        currTest.storage,
        currTest.expectedFacetNames,
        currTest.expectedOpenFacetNames
      );
    });
  }
});

const testStoredOrder = async (
  page: Page,
  baseURL: string | undefined,
  testInfo: TestInfo,
  tableName: string,
  storage: unknown,
  expectedFacetNames: string[],
  expectedOpenFacetNames: string[]
) => {
  await test.step('correct facets should be displayed.', async () => {
    await page.goto(
      generateChaiseURL(APP_NAMES.RECORDSET, SCHEMA_NAME, tableName, testInfo, baseURL)
    );
    await changeStoredOrder(page, testInfo, SCHEMA_NAME, tableName, storage);
    await RecordsetLocators.waitForRecordsetPageReady(page);
    await testDisplayedFacetItemsAndGroups(page, expectedFacetNames, expectedOpenFacetNames);
  });

  // TODO
  // await test.step('interacting with facets', async () => {
  // await testFacetSelection(page, currParams.openFacets.indexes);
  // });

  // await test.step('refreshing the page should show initial state.', async () => {
  //   await page.reload();
  //   await RecordsetLocators.waitForRecordsetPageReady(page);
  //   await testDisplayedFacetItemsAndGroups(page, expectedFacetNames, expectedOpenFacetNames);
  // });
};
