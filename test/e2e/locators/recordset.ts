import { expect, Locator, Page } from '@playwright/test';

export type DefaultRangeInputLocators = {
  minInput: Locator;
  maxInput: Locator;
  minClear: Locator;
  maxClear: Locator;
  submit: Locator;
}

export type TimestampRangeInputLocators = {
  // date
  minDateInput: Locator;
  maxDateInput: Locator;
  minDateClear: Locator;
  maxDateClear: Locator;
  // time
  minTimeInput: Locator;
  maxTimeInput: Locator;
  minTimeClear: Locator;
  maxTimeClear: Locator;
  submit: Locator;
}

export type HistogramLocators = {
  zoom: Locator;
  zoomDisabled: Locator;
  unzoom: Locator;
  unzoomDisabled: Locator;
  reset: Locator;
}

export type TimestampDateTime = {
  date: string;
  time: string;
}

export default class RecordsetLocators {

  static async waitForRecordsetPageReady(container: Page | Locator, timeout?: number): Promise<void> {
    await RecordsetLocators.getRecordSetTable(container).waitFor({ state: 'visible', timeout });

    await container.locator('.recordset-main-spinner').waitFor({ state: 'detached', timeout });
  }

  static async waitForRecordsetAggregates(container: Page | Locator) {
    await expect.soft(container.locator('.table-column-spinner')).toHaveCount(0);
  }

  static getPageTitleElement(container: Page | Locator): Locator {
    return container.locator('#page-title');
  }

  static getPageTitleTooltip(container: Page | Locator): Locator {
    return this.getPageTitleElement(container).locator('.chaise-icon-for-tooltip');
  }

  static getPermalinkButton(container: Page | Locator): Locator {
    return container.locator('#permalink');
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

  static getDisplayText(container: Page | Locator): Locator {
    return this.getTotalCount(container).locator('.displaying-text');
  }

  static getTotalText(container: Page | Locator): Locator {
    return this.getTotalCount(container).locator('.total-count-text');
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

  static getRowCells(container: Page | Locator): Locator {
    return container.locator('td');
  }

  static getDisabledRows(container: Page | Locator): Locator {
    return container.locator('tr.disabled-row');
  }

  static getColumnNames(container: Page | Locator): Locator {
    return container.locator('.table-column-displayname > span');
  };

  static getFirstColumn(container: Page | Locator): Locator {
    return container.locator('.chaise-table-row td:nth-child(2)');
  }

  static getColumnCells(container: Page | Locator, index: number): Locator {
    return container.locator(`.chaise-table-row td:nth-child(${index+1})`)
  }

  static getColumnsWithTooltipIcon(container: Page | Locator): Locator {
    return container.locator('.table-column-displayname.chaise-icon-for-tooltip');
  };

  // Currently only in modals but could be part of recordset in different contexts/views
  static getSelectAllBtn(container: Page | Locator): Locator {
    return container.locator('.table-select-all-rows')
  };

  /* sort selectors */
  static getColumnSortButton(container: Page | Locator, rawColumnName: string): Locator {
    return container.locator(`.c_${rawColumnName} .not-sorted-icon`);
  };

  static getColumnSortAscButton(container: Page | Locator, rawColumnName: string): Locator {
    // the "desc-sorted-icon" shows on the button that changes the sort to "asc"
    return container.locator(`.c_${rawColumnName} .desc-sorted-icon`);
  };

  static getColumnSortDescButton(container: Page | Locator, rawColumnName: string): Locator {
    // the "asc-sorted-icon" shows on the button that changes the sort to "desc"
    return container.locator(`.c_${rawColumnName} .asc-sorted-icon`);
  };

  static getNoResultsRow(container: Page | Locator): Locator {
    return container.locator('#no-results-row');
  };


  // -------------------- row-level selectors ------------------------ //

  static getViewActionButtons(container: Page | Locator): Locator {
    return container.locator('.view-action-button');
  }

  static getEditActionButtons(container: Page | Locator): Locator {
    return container.locator('.edit-action-button');
  }

  static getDeleteActionButtons(container: Page | Locator): Locator {
    return container.locator('.delete-action-button');
  }

  static getCheckboxInputs(container: Page | Locator): Locator {
    return container.locator('.recordset-table').locator('.chaise-checkbox input');
  }

  static getDisabledCheckboxInputs(container: Page | Locator): Locator {
    return container.locator('.recordset-table').locator('.chaise-checkbox input[disabled]');
  }

  static getCheckedCheckboxInputs(container: Page | Locator): Locator {
    return container.locator('.recordset-table').locator('.chaise-checkbox input.checked');
  }

  static getClearSelectedRows(container: Page | Locator): Locator {
    return container.locator('.clear-all-btn');
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

  static getHideFilterPanelBtn(container: Page | Locator): Locator {
    return container.locator('.hide-filter-panel-btn');
  }

  static getShowFilterPanelBtn(container: Page | Locator): Locator {
    return container.locator('.show-filter-panel-btn');
}

  static getAllFacets(container: Page | Locator): Locator {
    return container.locator('.panel-group .facet-panel');
  }

  static getOpenFacets(container: Page | Locator): Locator {
    return container.locator('.panel-open');
  }

  static getClosedFacets(container: Page | Locator): Locator {
    return container.locator('.facet-panel button.collapsed');
  }

  static getFacetTitles(container: Page | Locator): Locator {
    return container.locator('.accordion-header .facet-header-text');
  }

  static getOpenFacetTitles(container: Page | Locator): Locator {
    return container.locator('.panel-open .facet-header-text');
  }

  static getFacetById(container: Page | Locator, idx: number): Locator {
    return container.locator(`.fc-${idx}`);
  }

  static getFacetHeaderById(container: Page | Locator, idx: number): Locator {
    return container.locator(`.fc-heading-${idx}`).locator('.facet-header-text');
  };

  static getFacetHeaderButtonById(facet: Locator, idx: number): Locator {
    return facet.locator(`.fc-heading-${idx} button`);
  }

  static getFacetSpinner(facet: Locator): Locator {
    return facet.locator('.facet-header-icon .facet-spinner')
  }

  // get child of accordion group, sibling to accordion heading
  static getFacetCollapse(facet: Locator): Locator {
    return facet.locator('.accordion-collapse');
  }

  static getFacetOptions(facet: Locator): Locator {
    return facet.locator('.chaise-checkbox label')
  }

  static getCheckedFacetOptions(facet: Locator): Locator {
    return facet.locator('.chaise-checkbox input.checked');
  }

  static getDisabledFacetOptions(facet: Locator): Locator {
    return facet.locator('.chaise-checkbox input[disabled]');
  }

  static getFacetMoreFiltersText(facet: Locator): Locator {
    return facet.locator('.more-filters');
  }

  static getFacetOption(facet: Locator, optionIdx: number): Locator {
    return facet.locator(`.checkbox-${optionIdx}`);
  }

  static getFacetSearchBox(facet: Locator): Locator {
    return facet.locator('.facet-search-input');
  }

  static getFacetSearchBoxById(facet: Locator): Locator {
    return facet.locator('.chaise-search-box');
  }

  static getFacetSearchPlaceholderById(facet: Locator): Locator {
    return RecordsetLocators.getFacetSearchBoxById(facet).locator('.chaise-input-placeholder');
  }

  static getFacetSearchBoxClear(facet: Locator): Locator {
    return facet.locator('.remove-search-btn');
  }

  static getList(facet: Locator): Locator {
    return facet.locator('.chaise-list-container');
  }

  static getShowMore(facet: Locator): Locator {
    return facet.locator('.show-more-btn');
  }

  /* range facet selectors */

  // there's integer/float/date inputs
  static getFacetRangeInputs(facet: Locator): DefaultRangeInputLocators {
    return {
      minInput: facet.locator('.range-min'),
      maxInput: facet.locator('.range-max'),
      minClear: facet.locator('.min-clear'),
      maxClear: facet.locator('.max-clear'),
      submit: facet.locator('.range-input-submit-btn')
    }
  }

  static getFacetRangeTimestampInputs(facet: Locator): TimestampRangeInputLocators {
    return {
      // date
      minDateInput: facet.locator('.ts-date-range-min'),
      maxDateInput: facet.locator('.ts-date-range-max'),
      minDateClear: facet.locator('.min-date-clear'),
      maxDateClear: facet.locator('.max-date-clear'),

      // time
      minTimeInput: facet.locator('.ts-time-range-min'),
      maxTimeInput: facet.locator('.ts-time-range-max'),
      minTimeClear: facet.locator('.min-time-clear'),
      maxTimeClear: facet.locator('.max-time-clear'),
      submit: facet.locator('.range-input-submit-btn')
    }
  }

  static getRangeInputValidationError(facet: Locator): Locator {
    return facet.locator('.range-input-error');
  }

  /* histogram selectors */
  static getFacetHistogram(facet: Locator): Locator {
    return facet.locator('.js-plotly-plot');
  };

  static getFacetHistogramButtons(facet: Locator): HistogramLocators {
    return {
      zoom: facet.locator('.zoom-plotly-button'),
      zoomDisabled: facet.locator('.zoom-plotly-button[disabled]'),
      unzoom: facet.locator('.unzoom-plotly-button'),
      unzoomDisabled: facet.locator('.unzoom-plotly-button[disabled]'),
      reset: facet.locator('.reset-plotly-button'),
    }
  }


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
    return container.getByText('Save current search criteria');
  }

  static getSavedQueriesOption(container: Page | Locator) {
    // substring matching
    return container.getByText('Show saved search criteria');
  }

}
