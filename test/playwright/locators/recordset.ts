import { Locator, Page } from '@playwright/test';

export default class RecordsetLocators {
  /**
   * @param container pass `page` if on recordset app and the container's locator if on popups or other apps.
   */
  static async waitForRecordsetPageReady(container: Page | Locator, timeout?: number): Promise<void> {
    await RecordsetLocators.getRecordSetTable(container).waitFor({ state: 'visible', timeout });

    await container.locator('.recordest-main-spinner').waitFor({ state: 'detached', timeout });
  }

  /**
   * @param container pass `page` if on recordset app and the container's locator if on popups or other apps.
   */
  static async waitForAggregates(container: Page | Locator, timeout?: number): Promise<void> {
    return container.locator('.table-column-spinner').waitFor({ state: 'hidden', timeout });
  }

  /**
   * @param container pass `page` if on recordset app and the container's locator if on popups or other apps.
   */
  static getPageTitleElement(container: Page | Locator): Locator {
    return container.locator('#page-title');
  }

  /**
   * @param container pass `page` if on recordset app and the container's locator if on popups or other apps.
   */
  static getTotalCount(container: Page | Locator): Locator {
    return container.locator('.chaise-table-header-total-count');
  }

  /**
   * @param container pass `page` if on recordset app and the container's locator if on popups or other apps.
   */
  static getRecordSetTable(container: Page | Locator): Locator {
    return container.locator('.recordset-table');
  }

  /**
   * @param container pass `page` if on recordset app and the container's locator if on popups or other apps.
   */
  static getFacetFilters(container: Page | Locator): Locator {
    return container.locator('.chiclets-container .filter-chiclet');
  }

  /**
   * @param container pass `page` if on recordset app and the container's locator if on popups or other apps.
   */
  static getRows(container: Page | Locator): Locator {
    return container.locator('.chaise-table-row');
  }

  /**
   * @param container pass `page` if on recordset app and the container's locator if on popups or other apps.
   */
  static getViewActionButtons(container: Page | Locator): Locator {
    return container.locator('.view-action-button');
  }

  /**
   * @param container pass `page` if on recordset app and the container's locator if on popups or other apps.
   */
  static getViewActionButton(container: Page | Locator, rowIndex: number): Locator {
    return RecordsetLocators.getRows(container).nth(rowIndex).locator('td').nth(0).locator('.view-action-button');
  }

  /**
   * @param container pass `page` if on recordset app and the container's locator if on popups or other apps.
   */
  static getEditButton(container: Page | Locator, rowIndex: number): Locator {
    return RecordsetLocators.getRows(container).nth(rowIndex).locator('td').nth(0).locator('.edit-action-button');
  }

  /**
   * @param container pass `page` if on recordset app and the container's locator if on popups or other apps.
   */
  static getDeleteButton(container: Page | Locator, rowIndex: number): Locator {
    return RecordsetLocators.getRows(container).nth(rowIndex).locator('td').nth(0).locator('.delete-action-button');
  }

}
