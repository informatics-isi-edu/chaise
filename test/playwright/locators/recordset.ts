import { Locator, Page } from '@playwright/test';

export default class RecordsetLocators {

  static async waitForRecordsetPageReady(container: Page | Locator, timeout?: number): Promise<void> {
    await RecordsetLocators.getRecordSetTable(container).waitFor({ state: 'visible', timeout });

    await container.locator('.recordest-main-spinner').waitFor({ state: 'detached', timeout });
  }


  static async waitForAggregates(container: Page | Locator, timeout?: number): Promise<void> {
    return container.locator('.table-column-spinner').waitFor({ state: 'hidden', timeout });
  }


  static getPageTitleElement(container: Page | Locator): Locator {
    return container.locator('#page-title');
  }

  // ---------------- facet panel selectors ------------------ //

  static getSidePanel(container: Page | Locator): Locator {
    return container.locator('.side-panel-resizable');
  }


  static getFacetFilters(container: Page | Locator): Locator {
    return container.locator('.chiclets-container .filter-chiclet');
  }

  // --------------- main search selectors ------------------- //

  static getMainSearchBox(container: Page | Locator): Locator {
    return container.locator('.recordset-main-search');
  }

  static getMainSearchPlaceholder(container: Page | Locator): Locator {
    return RecordsetLocators.getMainSearchBox(container).locator('.chaise-input-placeholder');
  }

  static getMainSearchInput(container: Page | Locator): Locator {
    return RecordsetLocators.getMainSearchBox(container).locator('.main-search-input')
  }

  static getSearchSubmitButton(container: Page | Locator): Locator {
    return RecordsetLocators.getMainSearchBox(container).locator('.chaise-search-btn');
  }

  static getSearchClearButton(container: Page | Locator): Locator {
    return RecordsetLocators.getMainSearchBox(container).locator('remove-search-btn');
  }

  // --------------- table-level selectors ------------------- //

  /**
 * @param container pass `page` if on recordset app and the container's locator if on popups or other apps.
 */
  static getTotalCount(container: Page | Locator): Locator {
    return container.locator('.chaise-table-header-total-count');
  }

  static getNextButton(container: Page | Locator): Locator {
    return container.locator('.chaise-table-next-btn');
  }

  static getPreviousButton(container: Page | Locator): Locator {
    return container.locator('.chaise-table-previous-btn');
  }

  static getPageLimitDropdown(container: Page | Locator): Locator {
    return container.locator('.page-size-dropdown');
  }

  static getPageLimitSelector = function (container: Page | Locator, limit: string): Locator {
    return container.locator(`.page-size-limit-${limit}`);
  }

  static getAddRecordsLink(container: Page | Locator): Locator {
    return container.locator('.chaise-table-header-create-link');
  }

  static getBulkEditLink(container: Page | Locator): Locator {
    return container.locator('.chaise-table-header-edit-link');
  }

  static getRecordSetTable(container: Page | Locator): Locator {
    return container.locator('.recordset-table');
  }

  static getRows(container: Page | Locator): Locator {
    return container.locator('.chaise-table-row');
  }

  static getDisabledRows(container: Page | Locator): Locator {
    return container.locator('tr.disabled-row');
  }


  // -------------------- row-level selectors ------------------------ //

  static getViewActionButtons(container: Page | Locator): Locator {
    return container.locator('.view-action-button');
  }

  static getCheckboxInputs(container: Page | Locator): Locator {
    return RecordsetLocators.getRows(container).locator('.chaise-checkbox input');
  }

  static getDisabledCheckboxInputs(container: Page | Locator): Locator {
    return RecordsetLocators.getRows(container).locator('.chaise-checkbox input[disabled]');
  }

  static getRowFirstCell(container: Page | Locator, rowIndex: number, isDisabled?: boolean): Locator {
    const rows = isDisabled ? RecordsetLocators.getRows(container) : RecordsetLocators.getDisabledRows(container)
    return rows.nth(rowIndex).locator('td:not(.action-btns)').first();
  }

  static getRowCheckboxInput(container: Page | Locator, rowIndex: number): Locator {
    return RecordsetLocators.getRows(container).nth(rowIndex).locator('.chaise-checkbox input');
  }

  static getRowViewButton(container: Page | Locator, rowIndex: number): Locator {
    return RecordsetLocators.getRows(container).nth(rowIndex).locator('td').nth(0).locator('.view-action-button');
  }


  static getRowEditButton(container: Page | Locator, rowIndex: number): Locator {
    return RecordsetLocators.getRows(container).nth(rowIndex).locator('td').nth(0).locator('.edit-action-button');
  }


  static getRowDeleteButton(container: Page | Locator, rowIndex: number): Locator {
    return RecordsetLocators.getRows(container).nth(rowIndex).locator('td').nth(0).locator('.delete-action-button');
  }


}
