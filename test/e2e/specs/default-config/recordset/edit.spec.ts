import { test, TestInfo } from '@playwright/test';

// utils
import { testBulkEditLink } from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams = {
  schema_name: 'recordset-multi-edit',
  table_name: 'multi-edit-table',
  default_page_limit: 25,
  limit: 10,
  int_23_count: 11
};

test.describe('Recordset edit records', async () => {
  test.describe.configure({ mode: 'parallel' });

  const getURL = (testInfo: TestInfo, baseURL?: string) => {
    return generateChaiseURL(APP_NAMES.RECORDSET, testParams.schema_name, testParams.table_name, testInfo, baseURL);
  }

  test('recordset shows results with no limit defined', async ({ page, baseURL }, testInfo) => {
    await testBulkEditLink(page, getURL(testInfo, baseURL), testParams.default_page_limit);
  });

  test('recordset url includes a limit', async ({ page, baseURL }, testInfo) => {
    await testBulkEditLink(page, `${getURL(testInfo, baseURL)}?limit=${testParams.limit}`, testParams.limit);
  });

  test('recordset url includes a filter of int=23 without a limit', async ({ page, baseURL }, testInfo) => {
    await testBulkEditLink(page, `${getURL(testInfo, baseURL)}/int=23`, testParams.int_23_count);
  });

  test(`recordset url includes a filter of int=23 with a limit of ${testParams.limit}`, async ({ page, baseURL }, testInfo) => {
    await testBulkEditLink(page, `${getURL(testInfo, baseURL)}/int=23?limit=${testParams.limit}`, testParams.limit);
  });
});
