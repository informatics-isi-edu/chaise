import { test, expect } from '@playwright/test';

// locators
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import {
  openFacet, openRecordsetAndResetFacetState, testSelectFacetOption
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams: any = {
  schema_name: 'faceting',
  table_name: 'main',
  sort: '@sort(id)',
  totalNumFacets: 23,
  defaults: {
    numRows: 1,
    pageSize: 25
  },
  multipleFacets: [
    // F1
    { facetIdx: 10, option: 2, numOptionsLoad: 11, numOptionsCumulative: 11, numRows: 10 },
    // to_name
    { facetIdx: 11, option: 0, numOptionsLoad: 10, numOptionsCumulative: 2, numRows: 5 },
    // f3 (term)
    { facetIdx: 12, option: 1, numOptionsLoad: 3, numOptionsCumulative: 2, numRows: 5 },
    // from_name
    { facetIdx: 13, option: 2, numOptionsLoad: 11, numOptionsCumulative: 6, numRows: 1 }
  ]
}

test('Testing four facet selections 1 at a time,', async ({ page, baseURL }, testInfo) => {
  await openRecordsetAndResetFacetState(page,
    generateChaiseURL(APP_NAMES.RECORDSET, testParams.schema_name, testParams.table_name, testInfo, baseURL) + testParams.sort,
    testParams.totalNumFacets,
    [0, 1, 11],
    testParams.defaults.pageSize
  );

  await test.step('selecting facet options and verifying row after each selection', async () => {
    for await (const [index, facetParams] of testParams.multipleFacets.entries()) {
      // eslint-disable-next-line max-len
      await test.step(`for facet at index: ${facetParams.facetIdx}, it should open the facet, select a value to filter on, and update the search criteria.`, async () => {
        const facet = RecordsetLocators.getFacetById(page, facetParams.facetIdx);

        // numOptionsCumulative meaning the number of options is constrained by each previous facet selection
        await openFacet(page, facet, facetParams.facetIdx, facetParams.numOptionsCumulative, 1);
        await expect.soft(RecordsetLocators.getCheckedFacetOptions(facet)).toHaveCount(0);
        await testSelectFacetOption(page, facet, facetParams.option, facetParams.numRows, index + 1);

        // close the facet
        await RecordsetLocators.getFacetHeaderButtonById(facet, facetParams.facetIdx).click();
      });
    };
  });
});

test('Testing four facet selections in quick sequence and verifying data after all selections', async ({ page, baseURL }, testInfo) => {

  await openRecordsetAndResetFacetState(page,
    generateChaiseURL(APP_NAMES.RECORDSET, testParams.schema_name, testParams.table_name, testInfo, baseURL) + testParams.sort,
    testParams.totalNumFacets,
    [0, 1, 11],
    testParams.defaults.pageSize
  );

  await test.step('should open facets, click an option in each, and verify the data after', async () => {
    // open the four facets in reverse order (from bottom to top)
    let facetParams, facet;
    for (let i = testParams.multipleFacets.length, j = 1; i > 0; i--, j++) {
      facetParams = testParams.multipleFacets[i-1];
      facet = RecordsetLocators.getFacetById(page, facetParams.facetIdx);
      await openFacet(page, facet, facetParams.facetIdx, facetParams.numOptionsLoad, j);
      await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets - j);
    }

    // make sure facets are loaded first then select facet optins 1 by 1
    for (let k = 0; k < testParams.multipleFacets; k++) {
      facetParams = testParams.multipleFacets[k];
      facet = RecordsetLocators.getFacetById(page, facetParams.facetIdx);
      await testSelectFacetOption(page, facet, facetParams.option, facetParams.numRows, k + 1);
    }
  });
});
