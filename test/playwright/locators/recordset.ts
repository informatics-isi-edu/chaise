import { Locator, Page } from '@playwright/test';

export default class RecordsetLocators {
  static async waitForRecordsetPageReady(page: Page) {
    await RecordsetLocators.getRecordSetTable(page).waitFor({ state: 'visible' });
  }

  static async waitForAggregates(page: Page) {
    page.locator('.table-column-spinner').waitFor({ state: 'hidden' });
  }

  static getRecordSetTable(page: Page): Locator {
    return page.locator('.recordset-table');
  }

}
