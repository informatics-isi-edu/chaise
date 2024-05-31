import { test, expect } from '@playwright/test';

// locators
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { 
  openFacet, openRecordsetAndResetFacetState, testSelectFacetOption
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';

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
    `${baseURL}/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}${testParams.sort}`,
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
        await openFacet(page,facet, facetParams.facetIdx, facetParams.numOptionsCumulative, 1);
        await testSelectFacetOption(page, facet, facetParams.option, facetParams.numRows, index + 1);
        
        // close the facet
        await RecordsetLocators.getFacetHeaderButtonById(facet, facetParams.facetIdx).click();
      });
    };
  });
});

test('Testing four facet selections in quick sequence and verifying data after all selections', async ({ page, baseURL }, testInfo) => {

  await openRecordsetAndResetFacetState(page,
    `${baseURL}/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}${testParams.sort}`,
    testParams.totalNumFacets,
    [0, 1, 11],
    testParams.defaults.pageSize
  );

  await test.step('should open facets, click an option in each, and verify the data after', async () => {
    const numFacets = testParams.multipleFacets.length;

    const facet1 = RecordsetLocators.getFacetById(page, testParams.multipleFacets[0].facetIdx);
    const facet2 = RecordsetLocators.getFacetById(page, testParams.multipleFacets[1].facetIdx);
    const facet3 = RecordsetLocators.getFacetById(page, testParams.multipleFacets[2].facetIdx);
    const facet4 = RecordsetLocators.getFacetById(page, testParams.multipleFacets[3].facetIdx);

    // open the four facets in reverse order (from bottom to top)
    await openFacet(page, facet4, testParams.multipleFacets[3].facetIdx, testParams.multipleFacets[3].numOptionsLoad, 1);
    await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets - 1);

    await openFacet(page, facet3, testParams.multipleFacets[2].facetIdx, testParams.multipleFacets[2].numOptionsLoad, 2);
    await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets - 2);

    await openFacet(page, facet2, testParams.multipleFacets[1].facetIdx, testParams.multipleFacets[1].numOptionsLoad, 3);
    await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets - 3);

    await openFacet(page, facet1, testParams.multipleFacets[0].facetIdx, testParams.multipleFacets[0].numOptionsLoad, 4);
    await expect.soft(RecordsetLocators.getOpenFacets(page)).toHaveCount(numFacets);

    // make sure facets are loaded first then select facet optins 1 by 1
    await testSelectFacetOption(page, facet1, testParams.multipleFacets[0].option, testParams.multipleFacets[0].numRows, 1);

    // wait for spinner to dissappear
    await expect.soft(RecordsetLocators.getFacetSpinner(facet2)).not.toBeVisible();
    await testSelectFacetOption(page, facet2, testParams.multipleFacets[1].option, testParams.multipleFacets[1].numRows, 2);
    await testSelectFacetOption(page, facet3, testParams.multipleFacets[2].option, testParams.multipleFacets[2].numRows, 3);

    // wait for spinner to dissappear
    await expect.soft(RecordsetLocators.getFacetSpinner(facet4)).not.toBeVisible();
    await testSelectFacetOption(page, facet4, testParams.multipleFacets[3].option, testParams.multipleFacets[3].numRows, numFacets);
  });
});