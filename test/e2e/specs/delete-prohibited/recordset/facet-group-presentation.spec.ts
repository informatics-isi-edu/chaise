import { test, expect, TestInfo, Page, Locator } from '@playwright/test';

// locators
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import {
  openRecordsetAndResetFacetState,
  TestIndividualFacetParams,
  testIndividualFacet,
  resetFacetState,
  testDisplayedFacets,
  openFacet,
  testSelectFacetOption,
  testDisplayedFacetItemsAndGroups,
  openFacetGroup,
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';
import {
  clickNewTabLink,
  dragAndDropWithScroll,
  generateChaiseURL,
} from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams = {
  schemaName: 'facet-group',
  tableName: 'main',
  sort: '@sort(id)',
  general: {
    numRows: 25,
    facetNames: [
      'id',
      'Group 1',
      'Outbound 1',
      'col1',
      'Group 2',
      'Assoc Related 1',
      'Assoc Related1 Outbound1',
      'col4',
      'Group 3',
      'col5',
      'col6',
      'col2',
      'col3',
    ],
    openFacetNames: ['id', 'Group 1', 'Group 2', 'Group 3'],
  },
  preselectedFilters: {
    facetObject: {
      and: [{ source: 'col4', choices: ['4-C', '4-D', '4-E', '4-F'] }],
    },
    facetBlob: 'N4IghgdgJiBcDaoDOB7ArgJwMYFM4ixQBsAWEAGgIAsUBLXJOeEEgWgGEKXWARLtgKL9WAMRABdAL5SgA',
    numRows: 4,
    facetNames: [
      'id',
      'Group 1',
      'Outbound 1',
      'col1',
      'Group 2',
      'Assoc Related 1',
      'Assoc Related1 Outbound1',
      'col4',
      'Group 3',
      'col5',
      'col6',
      'col2',
      'col3',
    ],
    openFacetNames: ['Group 1', 'Group 2', 'col4', 'Group 3'],
  },
  multipleSelection: {
    numRows: 25,
    numFacets: 10,
    openedFacets: [0],
    openedGroups: [1, 3, 4],
    facetSelections: [
      // group 1, outbound1
      {
        groupIdx: 1,
        facetIdx: 1,
        option: 1,
        numOptionsLoad: 6,
        numOptionsCumulative: 6,
        numRows: 11,
      },
      // group 2, assoc related 1
      {
        groupIdx: 3,
        facetIdx: 3,
        option: 0,
        numOptionsLoad: 6,
        numOptionsCumulative: 6,
        numRows: 5,
      },
      // group 3, col6
      {
        groupIdx: 4,
        facetIdx: 7,
        option: 1,
        numOptionsLoad: 12,
        numOptionsCumulative: 5,
        numRows: 2,
      },
      // col3
      { facetIdx: 9, option: 3, numOptionsLoad: 12, numOptionsCumulative: 4, numRows: 1 },
    ],
  },
  individualFacets: {
    numRows: 25,
    numFacets: 10,
    openedFacets: [0],
    openedGroups: [1, 3, 4],
    facets: <TestIndividualFacetParams[]>[
      {

      }
    ],
  },
};

/**
 * - display props
 *   - markdown in title
 *   - tooltip
 *   - open status
 *     - having a parent closed while the child is open
 * - being able to interact with the facets inside the group
 *    - clicking on a facet should open it
 *    - closing a facet group, should hide children but keep their state
 *    - presentation of facet
 *    - show more/less popup
 * - flow control tests
 *   - fourselection type of tests
 */

test.describe('Facet groups', () => {
  test.describe.configure({ mode: 'parallel' });

  test('with no preselected filters, correct facets should be displayed and opened', async ({
    page,
    baseURL,
  }, testInfo) => {
    const params = testParams.general;
    await page.goto(getURL(testInfo, baseURL));
    await RecordsetLocators.waitForRecordsetPageReady(page);
    await testDisplayedFacetItemsAndGroups(page, params.facetNames, params.openFacetNames);
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.numRows);
  });

  test('with preselected filters, correct facets should be displayed and opened', async ({
    page,
    baseURL,
  }, testInfo) => {
    const params = testParams.preselectedFilters;
    await page.goto(getURL(testInfo, baseURL, params.facetBlob));
    await RecordsetLocators.waitForRecordsetPageReady(page);
    await testDisplayedFacetItemsAndGroups(page, params.facetNames, params.openFacetNames);
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.numRows);
  });

  test('select multiple facets one after another', async ({ page, baseURL }, testInfo) => {
    const params = testParams.multipleSelection;

    await openRecordsetAndResetFacetState(
      page,
      getURL(testInfo, baseURL),
      params.numFacets,
      params.openedFacets,
      params.numRows,
      params.openedGroups,
      true
    );

    for await (const [index, facetSelection] of params.facetSelections.entries()) {
      await test.step(`select facet at index: ${facetSelection.facetIdx} and check the rows.`, async () => {
        if (typeof facetSelection.groupIdx === 'number') {
          await openFacetGroup(page, facetSelection.groupIdx);
        }
        const facet = RecordsetLocators.getFacetById(page, facetSelection.facetIdx);
        await expect.soft(facet).toBeVisible();

        // numOptionsCumulative meaning the number of options is constrained by each previous facet selection
        await openFacet(
          page,
          facet,
          facetSelection.facetIdx,
          facetSelection.numOptionsCumulative,
          1
        );
        await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(0);
        await testSelectFacetOption(
          page,
          facet,
          facetSelection.option,
          facetSelection.numRows,
          index + 1
        );

        // close the facet
        await RecordsetLocators.getFacetHeaderButtonById(facet, facetSelection.facetIdx).click();
      });
    }
  });

  test('select multiple facets in quick sequence', async ({ page, baseURL }, testInfo) => {
    const params = testParams.multipleSelection;

    await openRecordsetAndResetFacetState(
      page,
      getURL(testInfo, baseURL),
      params.numFacets,
      params.openedFacets,
      params.numRows,
      params.openedGroups,
      true
    );

    await test.step('open facets', async () => {
      for (const facetSelection of params.facetSelections) {
        if (typeof facetSelection.groupIdx === 'number') {
          await openFacetGroup(page, facetSelection.groupIdx);
        }
        const facet = RecordsetLocators.getFacetById(page, facetSelection.facetIdx);
        await expect.soft(facet).toBeVisible();
        await openFacet(
          page,
          facet,
          facetSelection.facetIdx,
          facetSelection.numOptionsLoad
        );
      }
      await expect.soft(RecordsetLocators.getOpenFacets(page)).toHaveCount(params.facetSelections.length);
    });

    await test.step('select facets and check the rows', async () => {
      // make sure facets are loaded first then select facet options 1 by 1
      for (let k = 0; k < params.facetSelections.length; k++) {
        const facetParams = params.facetSelections[k];
        const facet = RecordsetLocators.getFacetById(page, facetParams.facetIdx);
        // don't check the number of rows and filters until all selections are made
        await testSelectFacetOption(page, facet, facetParams.option);
      }

      const lastSelected = params.facetSelections[params.facetSelections.length - 1];

      await expect.soft(RecordsetLocators.getClearAllFilters(page)).toBeVisible();
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(lastSelected.numRows);
      await expect
        .soft(RecordsetLocators.getFacetFilters(page))
        .toHaveCount(params.facetSelections.length);
    });
  });

  // TODO
  // test.describe('Individual facets', () => {
  //   const params = testParams.individualFacets;

  //   for (const facetParams of params.facets) {
  //     test(`facet ${facetParams.name}`, async ({ page, baseURL }, testInfo) => {
  //       await openRecordsetAndResetFacetState(
  //         page,
  //         getURL(testInfo, baseURL),
  //         params.numFacets,
  //         params.openedFacets,
  //         params.numRows,
  //         params.openedGroups,
  //         true
  //       );
  //       await testIndividualFacet(page, params.numRows, params.numFacets, facetParams);
  //     });
  //   }
  // });
});

// helper functions
const getURL = (testInfo: TestInfo, baseURL?: string, facetBlob?: string) => {
  let base = generateChaiseURL(
    APP_NAMES.RECORDSET,
    testParams.schemaName,
    testParams.tableName,
    testInfo,
    baseURL
  );
  if (facetBlob) {
    base += `/*::facets::${facetBlob}`;
  }
  return base + testParams.sort;
};
