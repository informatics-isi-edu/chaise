import { test } from '@playwright/test';

import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';

test('View recordset', async ({page, baseURL}, testInfo) => {
  await test.step('open recordset page', async () => {
    await page.goto(`${baseURL}/recordset/#${getCatalogID(testInfo.project.name)}/product-recordset:accommodation`);
    await page.pause();
    await RecordsetLocators.waitForRecordsetPageReady(page);
    await RecordsetLocators.waitForRecordsetAggregates(page);
  });

  await test.step('pause for manual testing.', async () => {
    // refer to manual-test.md for the manual tests that should be done.
    await page.pause();
  })
})
