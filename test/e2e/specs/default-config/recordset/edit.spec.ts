import { test } from '@playwright/test';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { testBulkEditLink } from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';

const testParams = {
  schema_name: 'recordset-multi-edit',
  table_name: 'multi-edit-table',
  default_page_limit: 25,
  limit: 10,
  int_23_count: 11
};

test.describe('Recordset edit records', async () => {
  test.describe.configure({ mode: 'parallel' });

  const PAGE_URL = (projectName: string) => `/recordset/#${getCatalogID(projectName)}/${testParams.schema_name}:${testParams.table_name}`
  test('recordset shows results with no limit defined', async ({ page, baseURL }, testInfo) => {
    await testBulkEditLink(page, `${baseURL}${PAGE_URL(testInfo.project.name)}`, testParams.default_page_limit);
  });

  test('recordset url includes a limit', async ({ page, baseURL }, testInfo) => {
    await testBulkEditLink(page, `${baseURL}${PAGE_URL(testInfo.project.name)}?limit=${testParams.limit}`, testParams.limit);
  });

  test('recordset url includes a filter of int=23 without a limit', async ({ page, baseURL }, testInfo) => {
    await testBulkEditLink(page, `${baseURL}${PAGE_URL(testInfo.project.name)}/int=23`, testParams.int_23_count);
  });

  test(`recordset url includes a filter of int=23 with a limit of ${testParams.limit}`, async ({ page, baseURL }, testInfo) => {
    await testBulkEditLink(page, `${baseURL}${PAGE_URL(testInfo.project.name)}/int=23?limit=${testParams.limit}`, testParams.limit);
  });
});
