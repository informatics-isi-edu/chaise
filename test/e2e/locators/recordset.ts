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

  // ---------------- facet chiclet selectors ---------------- //

  static getSelectedRowsFilters(container: Page | Locator): Locator {
    // // adding ".selected-chiclet-name" to the selector to not select the clear-all-btn
    return container.locator('.selected-chiclets').locator('.selected-chiclet .selected-chiclet-name');
  }

  static getFacetFilters(container: Page | Locator): Locator {
    return container.locator('.chiclets-container .filter-chiclet');
  }

  static getFacetFilter(container: Page | Locator, idx: number): Locator {
    return container.locator('.chiclets-container .filter-chiclet').nth(idx);
  }

  static getClearAllFilters(container: Page | Locator): Locator {
    return container.locator('.clear-all-filters');
  }

  static getClearCustomFilters(container: Page | Locator): Locator {
    return container.locator('.clear-custom-filters');
  }

  static getClearCustomFacets(container: Page | Locator): Locator {
    return container.locator('.clear-custom-facets');
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
    return RecordsetLocators.getMainSearchBox(container).locator('.remove-search-btn');
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

  static getActionsHeader(container: Page | Locator): Locator {
    return container.locator('.actions-header');
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

  static getRowSelectButton(container: Page | Locator, rowIndex: number): Locator {
    return RecordsetLocators.getRows(container).nth(rowIndex).locator('td').nth(0).locator('.select-action-button');
  }


  // ---------------- facet panel selectors ------------------ //

  static getSidePanel(container: Page | Locator): Locator {
    return container.locator('.side-panel-resizable');
  }

  static getFacetById(container: Page | Locator, idx: number): Locator {
    return container.locator(`.fc-${idx}`);
  }

  static getFacetHeaderButtonById(facet: Locator, idx: number): Locator {
    return facet.locator(`.fc-heading-${idx} button`);
  }

  // get child of accordion group, sibling to accordion heading
  static getFacetCollapse(facet: Locator): Locator {
    return facet.locator('.accordion-collapse');
  }

  static getFacetOptions(facet: Locator): Locator {
    return facet.locator('.chaise-checkbox label')
  }

  static getFacetOption(facet: Locator, optionIdx: number) {
    return facet.locator(`.checkbox-${optionIdx}`);
}

  /* range facet selectors */
  // there's integer/float/date/timestamp inputs
  static getRangeInput(facet: Locator, className: string): Locator {
    return facet.locator(`.${className}`);
  }

  static getInputClear(facet: Locator, className: string): Locator {
    // NOTE: same as getRangeInput selector
    return facet.locator(`.${className}`);
  }

  static getRangeSubmit(facet: Locator): Locator {
    return facet.locator('.range-input-submit-btn');
  }

  /* histogram selectors */
  static getHistogram(facet: Locator): Locator {
    return facet.locator('.js-plotly-plot');
  };


  // ---------------- saved query selector ------------------- //

  static getSavedQueryDropdown(container: Page | Locator): Locator {
    return container.locator('.saved-query-menu button')
  }

  // all dropdown menu items
  static getSavedQueryOptions(container: Page | Locator): Locator {
    return container.locator('.saved-query-menu-item');
  }

  // recordedit option to save a query
  static getSaveQueryOption(container: Page | Locator): Locator {
    // substring matching
    return container.locator('text=Save current search criteria');
  }

  static getSavedQueriesOption(container: Page | Locator) {
    // substring matching
    return container.locator('text=Show saved search criteria');
  }

}
