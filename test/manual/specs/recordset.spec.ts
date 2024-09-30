import { test } from '@playwright/test';

import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

test('View recordset', async ({page, baseURL}, testInfo) => {
  await test.step('open recordset page', async () => {
    await page.goto(generateChaiseURL(APP_NAMES.RECORDSET, 'product-recordset', 'accommodation', testInfo, baseURL));
    await page.pause();
    await RecordsetLocators.waitForRecordsetPageReady(page);
    await RecordsetLocators.waitForRecordsetAggregates(page);
  });

  await test.step('pause for manual testing.', async () => {
    // refer to manual-test.md for the manual tests that should be done.
    await page.pause();
  })
})
