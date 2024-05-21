import { test, expect } from '@playwright/test';

// locators
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';

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
    { facetIdx: 10, option: 2, numOptions: 11, numRows: 10 },
    { facetIdx: 11, option: 0, numOptions: 2, numRows: 5 },
    { facetIdx: 12, option: 1, numOptions: 2, numRows: 5 },
    { facetIdx: 13, option: 2, numOptions: 6, numRows: 1 }
  ]
}

test('Testing four facet selections 1 at a time,', async ({ page, baseURL }, testInfo) => {
  const clearAll = RecordsetLocators.getClearAllFilters(page);
  await test.step('should load recordset page', async () => {
    const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}${testParams.sort}`;

    await page.goto(`${baseURL}${PAGE_URL}`);
    await RecordsetLocators.waitForRecordsetPageReady(page);
  });

  await test.step('close default open facets', async () => {
    let facet = RecordsetLocators.getFacetById(page, 11);
    await RecordsetLocators.getFacetHeaderButtonById(facet, 11).click();
    await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets - 2);

    facet = RecordsetLocators.getFacetById(page, 1);
    await RecordsetLocators.getFacetHeaderButtonById(facet, 1).click();
    await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets - 1);

    facet = RecordsetLocators.getFacetById(page, 0);
    await RecordsetLocators.getFacetHeaderButtonById(facet, 0).click();
  });

  await test.step('clear all filters', async () => {
    await clearAll.click();
    await expect.soft(clearAll).not.toBeVisible();
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.defaults.pageSize);
  });

  await test.step('selecting facet options and verifying row after each selection', async () => {
    for await (const [index, facetParams] of testParams.multipleFacets.entries()) {
      // eslint-disable-next-line max-len
      await test.step(`for facet at index: ${facetParams.facetIdx}, it should open the facet, select a value to filter on, and update the search criteria.`, async () => {
        const facet = RecordsetLocators.getFacetById(page, facetParams.facetIdx);
        const facetHeader = RecordsetLocators.getFacetHeaderButtonById(facet, facetParams.facetIdx);
        await facetHeader.click()

        // wait for facet to open
        await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();
        // wait for facet checkboxes to load
        await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveCount(facetParams.numOptions);
        // wait for list to be fully visible
        await expect.soft(RecordsetLocators.getList(facet)).toBeVisible();

        await RecordsetLocators.getFacetOption(facet, facetParams.option).click();

        // wait for request to return
        await expect.soft(RecordsetLocators.getClearAllFilters(page)).toBeVisible();
        // wait for facet filter to load
        await expect.soft(RecordsetLocators.getFacetFilters(page)).toHaveCount(index + 1)

        // wait for table rows to load
        await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(facetParams.numRows);

        await facetHeader.click();
      });
    };
  });
});

test('Testing four facet selections in quick sequence and verifying data after all selections', async ({ page, baseURL }, testInfo) => {
  const clearAll = RecordsetLocators.getClearAllFilters(page);
  await test.step('should load recordset page', async () => {
    const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}${testParams.sort}`;

    await page.goto(`${baseURL}${PAGE_URL}`);
    await RecordsetLocators.waitForRecordsetPageReady(page);
  });

  await test.step('close default open facets', async () => {
    let facet = RecordsetLocators.getFacetById(page, 11);
    await RecordsetLocators.getFacetHeaderButtonById(facet, 11).click();
    await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets - 2);

    facet = RecordsetLocators.getFacetById(page, 1);
    await RecordsetLocators.getFacetHeaderButtonById(facet, 1).click();
    await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets - 1);

    facet = RecordsetLocators.getFacetById(page, 0);
    await RecordsetLocators.getFacetHeaderButtonById(facet, 0).click();
  });

  await test.step('clear all filters', async () => {
    await clearAll.click();
    await expect.soft(clearAll).not.toBeVisible();
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.defaults.pageSize);
  });

  await test.step('should open facets, click an option in each, and verify the data after', async () => {
    const numFacets = testParams.multipleFacets.length;

    const facet1 = RecordsetLocators.getFacetById(page, testParams.multipleFacets[0].facetIdx);
    const facet2 = RecordsetLocators.getFacetById(page, testParams.multipleFacets[1].facetIdx);
    const facet3 = RecordsetLocators.getFacetById(page, testParams.multipleFacets[2].facetIdx);
    const facet4 = RecordsetLocators.getFacetById(page, testParams.multipleFacets[3].facetIdx);

    // open the four facets in reverse order (from bottom ot top)
    await RecordsetLocators.getFacetHeaderButtonById(facet4, testParams.multipleFacets[3].facetIdx).click();
    await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets - 1);

    await RecordsetLocators.getFacetHeaderButtonById(facet3, testParams.multipleFacets[2].facetIdx).click();
    await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets - 2);

    await RecordsetLocators.getFacetHeaderButtonById(facet2, testParams.multipleFacets[1].facetIdx).click();
    await expect.soft(RecordsetLocators.getClosedFacets(page)).toHaveCount(testParams.totalNumFacets - 3);

    await RecordsetLocators.getFacetHeaderButtonById(facet1, testParams.multipleFacets[0].facetIdx).click();
    await expect.soft(RecordsetLocators.getOpenFacets(page)).toHaveCount(numFacets);

    // make sure facet is loaded first then select facet optins 1 by 1
    await expect.soft(RecordsetLocators.getFacetCollapse(facet1)).toBeVisible();
    await expect.soft(RecordsetLocators.getFacetOptions(facet1)).toHaveCount(testParams.multipleFacets[0].numOptions);
    await expect.soft(RecordsetLocators.getList(facet1)).toBeVisible();

    await expect.soft(RecordsetLocators.getFacetOption(facet1, testParams.multipleFacets[0].option)).toBeVisible();
    await page.waitForTimeout(50);

    await RecordsetLocators.getFacetOption(facet1, testParams.multipleFacets[0].option).click();
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.multipleFacets[0].numRows);
    await expect.soft(RecordsetLocators.getFacetFilters(page)).toHaveCount(1);

    await RecordsetLocators.getFacetOption(facet2, testParams.multipleFacets[1].option).click();
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.multipleFacets[1].numRows);
    await expect.soft(RecordsetLocators.getFacetFilters(page)).toHaveCount(2);

    await RecordsetLocators.getFacetOption(facet3, testParams.multipleFacets[2].option).click();
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.multipleFacets[2].numRows);
    await expect.soft(RecordsetLocators.getFacetFilters(page)).toHaveCount(3);

    await RecordsetLocators.getFacetOption(facet4, testParams.multipleFacets[3].option).click();
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.multipleFacets[3].numRows);
    await expect.soft(RecordsetLocators.getFacetFilters(page)).toHaveCount(numFacets);
  });
});