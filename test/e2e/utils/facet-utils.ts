import { expect, Locator, Page, TestInfo } from '@playwright/test';

// locators
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { dragAndDropWithScroll } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

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


/**
 * This function will move a facet to the original positon of the destination facet.
 * Since moving the facet will also change the position of all the other facets (including destination facet),
 * in the end the facet might not go exactly where you would expect depending on how tall facets are.
 *
 * so for example if the we have f0, f1, f2, f3, and f4. And assume f0 is open and has 10 items, calling this function with
 * moveFacet(page, 0, 1) might move the f0 to be after f2 (while you might expect that this should just change the position of f0 and f1).
 *
 * NOTE: if we realize that this function is not deterministic, we should move this test to manual testing document.
 */
export const moveFacet = async (page: Page, facetIndex: number, destIndex: number, isSourceGroup?: boolean, isDestGroup?: boolean) => {
  const source = isSourceGroup ? RecordsetLocators.getFacetGroupMoveIcon(page, facetIndex) : RecordsetLocators.getFacetMoveIcon(page, facetIndex);
  const target = isDestGroup ? RecordsetLocators.getFacetGroupMoveIcon(page, destIndex) : RecordsetLocators.getFacetMoveIcon(page, destIndex);
  await dragAndDropWithScroll(page, source, target);
}


export const testMenuBtnIndicator = async (locator: Locator, hasIndicator: boolean) => {
  await expect.soft(locator).toBeVisible();
  if (hasIndicator) {
    await expect.soft(locator).toContainClass('chaise-btn-with-indicator');
  } else {
    await expect.soft(locator).not.toContainClass('chaise-btn-with-indicator');
  }
};

export const testMenuBtnDisabled = async (locator: Locator, disabled: boolean) => {
  await expect.soft(locator).toBeVisible();
  if (disabled) {
    await expect.soft(locator).toContainClass('disabled');
  } else {
    await expect.soft(locator).not.toContainClass('disabled');
  }
}
