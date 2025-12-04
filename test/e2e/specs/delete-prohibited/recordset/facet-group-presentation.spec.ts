import { test, expect, TestInfo } from '@playwright/test';

// locators
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import {
  openRecordsetAndResetFacetState,
  TestIndividualFacetParams,
  testIndividualFacet, openFacet,
  testSelectFacetOption,
  testDisplayedFacetItemsAndGroups,
  openFacetGroup
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';
import {
  generateChaiseURL,
  testTooltip
} from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import PageLocators from '@isrd-isi-edu/chaise/test/e2e/locators/page';

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
    groupTooltips: {
      1: null,
      3: 'comment for group 2!',
      4: null
    }
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
        option: 3, // outbound 1 two
        numOptionsLoad: 7,
        numOptionsCumulative: 7,
        numRows: 11,
      },
      // group 2, assoc related 1
      {
        groupIdx: 3,
        facetIdx: 3,
        option: 0, // not-null
        numOptionsLoad: 7,
        numOptionsCumulative: 7,
        numRows: 5,
      },
      // group 3, col6
      {
        groupIdx: 4,
        facetIdx: 7,
        option: 1, // null
        numOptionsLoad: 2,
        numOptionsCumulative: 2,
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
    facets: <TestIndividualFacetParams[]>[
      {
        description: 'scalar choice',
        type: 'choice',
        name: 'col1',
        index: 2,
        options: ['All records with value', 'No value', '1-A', '1-B', '1-C', '1-D', '1-E', '1-F', '1-G', '1-H', '1-I', '1-J'],
        option: 5,
        numRows: 1,
        filter: 'col11-D',
        modal: {
          numRows: 25,
          numCheckedRows: 0,
          columnNames: ['col1', 'Number of Occurrences'],
          select: {
            options: [0,1],
            numRows: 2,
          }
        }
      },
      {
        description: 'entity choice',
        type: 'choice',
        name: 'Outbound 1',
        index: 1,
        isEntityMode: true,
        options: ['All records with value', 'No value', 'Outbound 1 one', 'Outbound 1 two', 'Outbound 1 three', 'Outbound 1 four', 'Outbound 1 five'],
        option: 2, // outbound 1 one
        numRows: 4,
        filter: 'Outbound 1Outbound 1 one',
        textSearch: [{
          term: 'four',
          options: ['All records with value', 'No value', 'Outbound 1 four'],
        }],
        modal: {
          numRows: 5,
          numCheckedRows: 0,
          columnNames: ['outbound1_id', 'name'],
          firstColumn: {
            name: 'outbound1_id',
            values: ['01', '02', '03', '04', '05'],
            sortable: true,
            valuesAfterSort: ['05', '04', '03', '02', '01'],
            select: {
              options: [3, 4],
              numRows: 15
            }
          }
        },
      },
      {
        description: 'entity choice using path prefix',
        type: 'choice',
        name: 'Assoc Related1 Outbound1',
        index: 4,
        isEntityMode: true,
        options: ['All records with value', 'No value', 'Related 1 outbound 1 one', 'Related 1 outbound 1 two', 'Related 1 outbound 1 three'],
        option: 4,
        numRows: 2,
        filter: 'Assoc Related1 Outbound1Related 1 outbound 1 three',
        textSearch: [{
          term: '03',
          options: ['All records with value', 'No value', 'Related 1 outbound 1 three']
        }],
        modal: {
          numRows: 3,
          numCheckedRows: 0,
          columnNames: ['assoc_related1_outbound1_id', 'name', 'third_col'],
          select: {
            options: [0],
            numRows: 3,
          }
        }
      },
      {
        description: 'timestamp range',
        type: 'timestamp',
        name: 'col6',
        index: 7,
        listElems: 0,
        notNullNumRows: 23,
        nullNumRows: 2,
        initialMin: {
          date: '2025-11-21',
          time: '00:00:00',
        },
        initialMax: {
          date: '2025-11-21',
          time: '23:00:01',
        },
        error: 'Please enter a valid date value in YYYY-MM-DD format.',
        range: {
          min: { date: '2025-11-21', time: '10:08:00' },
          max: { date: '2025-11-21', time: '17:26:12' },
          filter: 'col62025-11-21 10:08:00 to 2025-11-21 17:26:12',
          numRows: 6,
        },
        justMin: {
          min: { date: '2025-11-21', time: '15:00:00' },
          filter: 'col6≥ 2025-11-21 15:00:00',
          numRows: 17,
        },
        justMax: {
          max: { date: '2025-11-21', time: '20:00:00' },
          filter: 'col6≤ 2025-11-21 20:00:00',
          numRows: 12,
        }
      },
      {
        description: 'check presence',
        type: 'check_presence',
        name: 'col5',
        index: 6,
        notNullNumRows: 15,
        notNullFilter: 'col5All records with value',
        nullNumRows: 10,
        nullFilter: 'col5No value',
      },
    ],
  },
};

/**
 * - display props
 *   x markdown in title
 *   - tooltip
 *   x open status
 *     x having a parent closed while the child is open
 * - being able to interact with the facets inside the group
 *    x clicking on a facet should open it
 *    - closing a facet group, should hide children but keep their state
 *    x presentation of facet
 *    x show more/less popup
 * x flow control tests
 *   x fourselection type of tests
 */

test.describe('Facet groups', () => {
  test.describe.configure({ mode: 'parallel' });

  test('with no preselected filters', async ({
    page,
    baseURL,
  }, testInfo) => {
    const params = testParams.general;

    await test.step('facets should be displayed and opened', async () => {
      await page.goto(getURL(testInfo, baseURL));
      await RecordsetLocators.waitForRecordsetPageReady(page);
      await testDisplayedFacetItemsAndGroups(page, params.facetNames, params.openFacetNames);
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(params.numRows);
    });

    await test.step('tooltips should be correct', async () => {
      for await (const [groupIdx, tooltip] of Object.entries(params.groupTooltips)) {
        const groupHeader = RecordsetLocators.getFacetGroupHeaderById(page, parseInt(groupIdx));
        const icon = PageLocators.getTooltipIcon(groupHeader);
        if (tooltip) {
          await expect.soft(icon).toBeVisible();
          await testTooltip(groupHeader, tooltip, APP_NAMES.RECORDSET, true);
        } else {
          await expect.soft(icon).toHaveCount(0);
        }
      }
    });

    await test.step('opening and closing group should not change state of its children', async () => {
      // Outbound1 inside Group 1
      const groupIndex = 1;
      const facetIndex = 1;
      const options = [
        'All records with value', 'No value', 'Outbound 1 one', 'Outbound 1 two', 'Outbound 1 three', 'Outbound 1 four', 'Outbound 1 five'
      ];
      const optiosnAfterSelect = ['All records with value', 'No value', 'Outbound 1 one'];
      const searchTerm = 'out';

      const facet = RecordsetLocators.getFacetById(page, facetIndex);
      const facetHeader = RecordsetLocators.getFacetHeaderButtonById(facet, facetIndex);
      const facetSearchBox = RecordsetLocators.getFacetSearchBox(facet);
      await expect.soft(facet).toBeVisible();

      // open the facet
      await facetHeader.click();
      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveText(options);

      // search for something
      await facetSearchBox.fill(searchTerm);
      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveText(options);

      // close the parent group
      const facetGroup = RecordsetLocators.getFacetGroupById(page, groupIndex);
      const groupHeader = RecordsetLocators.getFacetGroupHeaderButtonById(facetGroup, groupIndex);
      const groupBody = RecordsetLocators.getFacetGroupBody(facetGroup);
      await groupHeader.click();
      await expect.soft(groupBody).toBeHidden();

      // make a change in other facets
      await testSelectFacetOption(page, RecordsetLocators.getFacetById(page, 0), 0, 1);

      // open the group and it should load the child facet as it was
      await groupHeader.click();
      await expect.soft(groupBody).toBeVisible();
      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveText(optiosnAfterSelect);
      await expect.soft(facetSearchBox).toHaveValue(searchTerm);

    });

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
      await test.step(`select facet index=${facetSelection.facetIdx} and check the rows.`, async () => {
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
        await openFacet(page, facet, facetSelection.facetIdx, facetSelection.numOptionsLoad);
      }
      await expect
        .soft(RecordsetLocators.getOpenFacets(page))
        .toHaveCount(params.facetSelections.length);
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

  test.describe('Individual facets', () => {
    const params = testParams.individualFacets;

    for (const facetParams of params.facets) {
      test(`${facetParams.description}`, async ({ page, baseURL }, testInfo) => {
        await openRecordsetAndResetFacetState(
          page,
          getURL(testInfo, baseURL),
          params.numFacets,
          params.openedFacets,
          params.numRows,
          undefined, // keep the groups opened
          true
        );
        await testIndividualFacet(page, params.numRows, params.numFacets, facetParams);
      });
    }
  });
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
