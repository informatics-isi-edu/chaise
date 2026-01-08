import { test, expect, TestInfo, Page, Locator } from '@playwright/test';

// locators
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { changeStoredOrder, moveFacet, testMenuBtnDisabled, testMenuBtnIndicator } from '@isrd-isi-edu/chaise/test/e2e/utils/facet-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import {
  openRecordsetAndResetFacetState,
  TestIndividualFacetParams,
  testIndividualFacet,
  resetFacetState,
  testDisplayedFacets,
  testDisplayedFacetItemsAndGroups,
  openFacet,
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

const testParams = {
  tableName: 'main_reorder',
  numRows: 6,
  numFacets: 7,
  facetNames: ['col_1', 'Group 1', 'col_6', 'col_2', 'col_3', 'col_5', 'col_4', 'Group 2', 'id'],
  openFacetNames: ['col_1', 'Group 1', 'Group 2'],
  facetNamesAfterReorder: ['col_4', 'col_1', 'Group 2', 'id', 'Group 1', 'col_6', 'col_3', 'col_5', 'col_2'],
  openFacetNamesAfterReorder: ['col_1', 'Group 2', 'Group 1'],
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
    facetNames: ['col_1', 'Group 1', 'col_6', 'col_2', 'col_3', 'col_5', 'col_4', 'Group 2', 'id'],
    openFacetNames: ['col_1', 'Group 1', 'Group 2'],
    openFacetIndexes: [0],
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
    facetNames: ['Group 2', 'id', 'Group 1', 'col_5', 'col_6', 'col_3', 'col_2', 'col_4', 'col_1'],
    openFacetNames: ['Group 2', 'col_5', 'col_4'],
    openFacetIndexes: [4, 5],
    groupIndexesToOpen: [1],
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
    facetNames: ['col_1', 'col_4', 'Group 1', 'col_3', 'col_5', 'col_2', 'col_6', 'Group 2', 'id'],
    openFacetNames: ['Group 1', 'Group 2', 'id'],
    openFacetIndexes: [6],
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
    facetNames: ['col_1', 'Group 1', 'col_2', 'col_5', 'col_3', 'col_6', 'col_4', 'Group 2', 'id'],
    openFacetNames: ['col_1'],
    openFacetIndexes: [0],
    groupIndexesToOpen: [1],
  },
];

const facetSelectionParams: TestIndividualFacetParams[] = [
  {
    description: 'scalar choice',
    index: 2,
    name: 'col_2',
    type: 'choice',
    options: ['All records with value', 'No value', '1-2', '2-2', '3-2', '4-2', '5-2', '6-2'],
    option: 4,
    filter: 'col_23-2',
    numRows: 1
  },
  {
    description: 'entity choice',
    index: 3,
    name: 'col_3',
    type: 'choice',
    options: ['All records with value', 'No value', '1-3', '2-3', '3-3', '4-3', '5-3', '6-3'],
    option: 5,
    filter: 'col_34-3',
    numRows: 1
  },
]

test.describe('Reorder facet groups', () => {
  test.describe.configure({ mode: 'parallel' });

  test('changing order', async ({ page, baseURL }, testInfo) => {
    const params = testParams;
    const menuBtn = RecordsetLocators.getSidePanelHeadingMenu(page);
    const saveBtn = RecordsetLocators.getSaveFacetOrderBtn(page);
    const applyDefaultBtn = RecordsetLocators.getShowDefaultFacetOrderBtn(page);
    const applySavedBtn = RecordsetLocators.getApplySavedFacetOrderBtn(page);

    await test.step('open recordset and check order', async () => {
      await page.goto(
        generateChaiseURL(APP_NAMES.RECORDSET, SCHEMA_NAME, params.tableName, testInfo, baseURL)
      );
      await RecordsetLocators.waitForRecordsetPageReady(page);
      await testDisplayedFacetItemsAndGroups(page, params.facetNames, params.openFacetNames);
    });

    await test.step('reorder facets and groups', async () => {
      // children of Group 1
      await moveFacet(page, 2, 4);
      // move Group 1 to the end
      await moveFacet(page, 1, 6, true, false);
      // move col_4 to top
      await moveFacet(page, 5, 0);
      await testDisplayedFacetItemsAndGroups(page, params.facetNamesAfterReorder, params.openFacetNamesAfterReorder);
    });

    await test.step('the Save button should be available and clicking on it should save the order.', async () => {
      await testMenuBtnIndicator(menuBtn, true);
      await menuBtn.click();

      await testMenuBtnDisabled(saveBtn, false);
      await testMenuBtnDisabled(applyDefaultBtn, false);
      await testMenuBtnDisabled(applySavedBtn, true);
      await saveBtn.click();

      await testMenuBtnIndicator(menuBtn, false);
      await testDisplayedFacetItemsAndGroups(page, params.facetNamesAfterReorder, params.openFacetNamesAfterReorder);
    });

    // calling this here so the open state is not saved
    await test.step('interacting with facets', async () => {
      await testFacetSelection(page, testInfo, [0]);
    });

    await test.step('clicking on "Reset to default" should display the default order.', async () => {
      await menuBtn.click();
      // since the previous test is opening and closing facets, the save button will be available
      await testMenuBtnDisabled(saveBtn, false);
      await testMenuBtnDisabled(applyDefaultBtn, false);
      await testMenuBtnDisabled(applySavedBtn, false)
      await applyDefaultBtn.click();

      await testMenuBtnIndicator(menuBtn, true);
      await testDisplayedFacetItemsAndGroups(page, params.facetNames, params.openFacetNames);
    });

    await test.step('clicking on "Apply saved state" should display the saved state.', async () => {
      await menuBtn.click();
      await testMenuBtnDisabled(saveBtn, false);
      await testMenuBtnDisabled(applyDefaultBtn, true);
      await testMenuBtnDisabled(applySavedBtn, false)
      await applySavedBtn.click();

      await testMenuBtnIndicator(menuBtn, false);
      await testDisplayedFacetItemsAndGroups(page, params.facetNamesAfterReorder, params.openFacetNamesAfterReorder);
    });

    await test.step('refreshing the page should display the saved order and open state.', async () => {
      await page.reload();
      await RecordsetLocators.waitForRecordsetPageReady(page);
      await testDisplayedFacetItemsAndGroups(page, params.facetNamesAfterReorder, params.openFacetNamesAfterReorder);
    });

    await test.step('changing the order of facets without clicking on save should not save the order.', async () => {
      await moveFacet(page, 0, 4);
      await page.reload();
      await RecordsetLocators.waitForRecordsetPageReady(page);
      await testDisplayedFacetItemsAndGroups(page, params.facetNamesAfterReorder, params.openFacetNamesAfterReorder);
    });
  });

  for (const currTest of storageTests) {
    test(`stored order: ${currTest.description}`, async ({ page, baseURL }, testInfo) => {
      await testStoredOrder(
        page,
        baseURL,
        testInfo,
        currTest.tableName,
        currTest.storage,
        currTest.facetNames,
        currTest.openFacetNames,
        currTest.openFacetIndexes,
        currTest.groupIndexesToOpen ? currTest.groupIndexesToOpen : [],
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
  facetNames: string[],
  openFacetNames: string[],
  openFacetIndexes: number[],
  groupIndexesToOpen: number[],
) => {
  await test.step('correct facets should be displayed.', async () => {
    await page.goto(
      generateChaiseURL(APP_NAMES.RECORDSET, SCHEMA_NAME, tableName, testInfo, baseURL)
    );
    await changeStoredOrder(page, testInfo, SCHEMA_NAME, tableName, storage);
    await RecordsetLocators.waitForRecordsetPageReady(page);
    await testDisplayedFacetItemsAndGroups(page, facetNames, openFacetNames);
  });

  if (groupIndexesToOpen.length > 0) {
    await test.step('opening groups as needed.', async () => {
      for await (const groupIndex of groupIndexesToOpen) {
        const facetGroup = RecordsetLocators.getFacetGroupById(page, groupIndex);
        const headerBtn = RecordsetLocators.getFacetGroupHeaderButtonById(facetGroup, groupIndex);
        await headerBtn.click();
        await expect.soft(RecordsetLocators.getFacetGroupBody(facetGroup)).toBeVisible();
      }
    });
  }

  await test.step('interacting with facets', async () => {
    await testFacetSelection(page, testInfo, openFacetIndexes);
  });

  await test.step('refreshing the page should show initial state.', async () => {
    await page.reload();
    await RecordsetLocators.waitForRecordsetPageReady(page);
    await testDisplayedFacetItemsAndGroups(page, facetNames, openFacetNames);
  });
};

const testFacetSelection = async (page: Page, testInfo: TestInfo, openFacetIndexes: number[]) => {
  if (openFacetIndexes.length > 0) {
    await resetFacetState(page, testParams.numFacets, openFacetIndexes, testParams.numRows, undefined, true);
  }

  for await (const facetParams of facetSelectionParams) {
    await test.step(`${facetParams.description}`, async () => {
      await testIndividualFacet(page, testInfo, testParams.numRows, testParams.numFacets, facetParams);
    });
  }
};