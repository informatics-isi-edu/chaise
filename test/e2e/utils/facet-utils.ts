import { Page, TestInfo } from '@playwright/test';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';

/**
 * change the local storage value for the order of facets for the main table and refresh the page.
 */
export const changeStoredOrder = async (page: Page, testInfo: TestInfo, schemaName: string, tableName: string, order: unknown) => {
  const keyName = `facet-order-${getCatalogID(testInfo.project.name)}_${schemaName}_${tableName}`;
  const orderStr = JSON.stringify(order);
  await page.evaluate(
    ({ keyName, orderStr }) => {
      window.localStorage.setItem(keyName, orderStr);
    },
    { keyName, orderStr }
  );

  await page.reload();
};
