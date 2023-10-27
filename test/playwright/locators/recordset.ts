import { Locator, Page } from '@playwright/test';

export default class RecordsetLocators {
  static async waitForRecordsetPageReady(page: Page, timeout?: number): Promise<void> {
    await RecordsetLocators.getRecordSetTable(page).waitFor({ state: 'visible', timeout });

    await page.locator('.recordest-main-spinner').waitFor({ state: 'detached', timeout });
  }

  static async waitForAggregates(page: Page, timeout?: number): Promise<void> {
    await page.locator('.table-column-spinner').waitFor({ state: 'hidden', timeout });
  }

  static getPageTitleElement(page: Page): Locator {
    return page.locator('page-title');
  }

  static getRecordSetTable(page: Page): Locator {
    return page.locator('.recordset-table');
  }

  static getFacetFilters(page: Page): Locator {
    return page.locator('.chiclets-container .filter-chiclet');
  }

}
