import { Locator, Page } from '@playwright/test';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

/**
 * TODO
 * we should eventually move this to src/ folder so chaise
 * uses the same names.
 * I didn't move this because of the pending array changes.
 *
 * (created this based on the switch-case in input-switch.tsx)
 */
export enum RecordeditInputType {
  IFRAME = 'iframe',

  ARRAY = 'array',

  FK_POPUP = 'popup-select',
  FK_DROPDOWN = 'dropdown-select',

  FILE = 'file',

  TIMESTAMP = 'timestamp',
  DATE = 'date',

  INT_2 = 'integer2',
  INT_4 = 'integer4',
  INT_8 = 'integer8',
  NUMBER = 'number',

  BOOLEAN = 'boolean',

  MARKDOWN = 'markdown',
  LONGTEXT = 'longtext',

  JSON = 'json',
  JSONB = 'jsonb',

  COLOR = 'color',
  TEXT = 'text'
}

export default class RecordeditLocators {

  static async waitForRecordeditPageReady(container: Locator | Page, timeout?: number) {
    await RecordeditLocators.getSubmitRecordButton(container).waitFor({ state: 'visible', timeout });
  }

  // --------------- page-level selectors ---------------- //

  static async submitForm(container: Locator | Page) {
    await RecordeditLocators.getSubmitRecordButton(container).click();
  }

  static getPageTitle(container: Locator | Page): Locator {
    return container.locator('#page-title');
  }

  static getPageTitleLink(container: Locator | Page): Locator {
    return container.locator('#page-title a');
  }

  static getPageTitleLinkInner(container: Locator | Page): Locator {
    return container.locator('#page-title a span');
  }

  static getRequiredInfoEl(container: Locator | Page): Locator {
    return container.locator('.required-info');
  }

  static getSubmitRecordButton(container: Locator | Page): Locator {
    return container.locator('#submit-record-button');
  }

  static getCloneFormInput(container: Locator | Page): Locator {
    return container.locator('#copy-rows-input');
  }

  static getCloneFormInputSubmitButton(container: Locator | Page): Locator {
    return container.locator('#copy-rows-submit');
  }

  static getRecordeditResetButton(container: Locator | Page): Locator {
    return container.locator('#recordedit-reset');
  }

  static getBulkDeleteButton(container: Locator | Page): Locator {
    return container.locator('#bulk-delete-button');
  }

  static getRecordeditForms(container: Locator | Page): Locator {
    return container.locator('.recordedit-form .form-header');
  }

  static getRecoreditResultsetTables(container: Locator | Page): Locator {
    return container.locator('.resultset-tables');
  }

  static getAllColumnPermissionOverlays(container: Locator | Page): Locator {
    return container.locator('.column-permission-overlay');
  }

  static getAllDeleteRowButtons(container: Locator | Page): Locator {
    return container.locator('button.remove-form-btn');
  }

  static getDeleteRowButton(container: Locator | Page, index: number): Locator {
    index = index || 0;
    return RecordeditLocators.getAllDeleteRowButtons(container).nth(index);
  }


  // ---------------- input-level selectors -------------- //

  /**
    * returns the cell (entity-value).
    * this is useful if we want to test the extra classes attached to it.
    */
  static getFormInputCell(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    // TODO does this work?
    return container.locator(`.input-switch-container-${formNumber}-${name}`).locator('xpath=..')
  }

  static getInputForAColumn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    return container.locator(`input[name="${formNumber}-${name}"]`);
  }

  static getTextAreaForAColumn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    return container.locator(`textarea[name="${formNumber}-${name}"]`);
  }

  static getDateInputsForAColumn(container: Locator | Page, name: string, formNumber: number): { date: Locator, todayBtn: Locator } {
    formNumber = formNumber || 1;
    const inputName = `${formNumber}-${name}`;
    return {
      date: container.locator(`input[name="${inputName}"]`),
      todayBtn: container.locator(`.input-switch-container-${inputName} .date-today-btn`)
    }
  }

  static getTimestampInputsForAColumn(container: Locator | Page, name: string, formNumber: number): {
    date: Locator, time: Locator, nowBtn: Locator, clearBtn: Locator
  } {
    formNumber = formNumber || 1;
    const inputName = `${formNumber}-${name}`;
    const wrapper = container.locator(`.input-switch-container-${inputName}`);
    return {
      date: wrapper.locator(`input[name="${inputName}-date"]`),
      time: wrapper.locator(`input[name="${inputName}-time"]`),
      nowBtn: wrapper.locator('.date-time-now-btn'),
      clearBtn: wrapper.locator('.date-time-clear-btn')
    };
  }

  static getInputControlForAColumn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    return container.locator(`.input-switch-container-${formNumber}-${name}`).locator('.chaise-input-control');
  }

  static getErrorMessageForAColumn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    return container.locator(`.input-switch-container-${formNumber}-${name}`).locator('.input-switch-error.text-danger');
  }

  static getColumnPermissionOverlay(container: Locator | Page, columnDisplayName: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    columnDisplayName = makeSafeIdAttr(columnDisplayName);
    return container.locator(`.column-permission-overlay-${formNumber}-${columnDisplayName}`)
  }

  static getColumnPermissionError(container: Locator | Page, columnDisplayName: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    columnDisplayName = makeSafeIdAttr(columnDisplayName);
    return container.locator(`.column-permission-warning-${formNumber}-${columnDisplayName}`)
  }

  // -------------- file input selectors --------------- //
  static getTextFileInputForAColumn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    return container.locator(`.input-switch-container-${formNumber}-${name}`).locator('.chaise-input-control > span');
  }

  static getFileInputButtonForAColumn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    return container.locator(`.input-switch-container-${formNumber}-${name}`).locator('.chaise-input-group-append');
  }

  // -------------- color input selectors -------------- //
  static getColorInputForAColumn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    return container.locator(`.input-switch-container-${formNumber}-${name}`).locator('input');
  }

  static async getColorInputBackground(page: Page, name: string, formNumber: number): Promise<string> {
    formNumber = formNumber || 1;
    return await page.evaluate(async () => {
      const el = document.querySelector(`.input-switch-container-${formNumber}-${name} .chaise-color-picker-preview`) as HTMLElement;
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx || !el) return '';
      ctx.fillStyle = el.style.backgroundColor;
      return ctx.fillStyle;
    })
  }

  static getColorInputBtn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    return container.locator(`.input-switch-container-${formNumber}-${name} button`);
  }

  static getColorInputPopup(container: Locator | Page): Locator {
    return container.locator('.chaise-color-picker-popup:not(.sp-hidden)');
  }

  static getColorInputPopupInput(container: Locator | Page): Locator {
    return RecordeditLocators.getColorInputPopup(container).locator('.sp-input');
  }

  static getColorInputPopupClearBtn(container: Locator | Page): Locator {
    return RecordeditLocators.getColorInputPopup(container).locator('.sp-clear');
  }

  static getColorInputPopupSelectBtn(container: Locator | Page): Locator {
    return RecordeditLocators.getColorInputPopup(container).locator('.sp-choose');
  }

  // -------------- foreignkey input selectors -------------- //
  static getForeignKeyInputDisplay(container: Locator | Page, columnDisplayName: string, formNumber: number): Locator {
    columnDisplayName = makeSafeIdAttr(columnDisplayName);
    return container.locator(`#form-${formNumber}-${columnDisplayName}-display`);
  }

  static getForeignKeyInputButton(container: Locator | Page, columnDisplayName: string, formNumber: number): Locator {
    columnDisplayName = makeSafeIdAttr(columnDisplayName);
    return container.locator(`#form-${formNumber}-${columnDisplayName}-button`);
  }

  static getForeignKeyInputClear(container: Locator | Page, columnDisplayName: string, formNumber: number): Locator {
    return RecordeditLocators.getForeignKeyInputDisplay(container, columnDisplayName, formNumber).locator('.remove-input-btn');
  }


  // ----------------- multi form input selectors ------------------- //

  static getMultiFormToggleButton(container: Locator | Page, columnDisplayName: string): Locator {
    columnDisplayName = makeSafeIdAttr(columnDisplayName);
    return container.locator('.multi-form-' + columnDisplayName);
  }

  static getMultiFormApplyBtn(container: Locator | Page): Locator {
    return container.locator('.multi-form-input-apply-btn');
  }

  static getMultiFormClearBtn(container: Locator | Page): Locator {
    return container.locator('.multi-form-input-clear-btn');
  }

  static getMultiFormCloseBtn(container: Locator | Page): Locator {
    return container.locator('.multi-form-input-close-btn');
  }

  static getMultiFormInputCheckbox(container: Locator | Page): Locator {
    return container.locator('.multi-form-input-checkbox input');
  }

  static getMultiFormInputCheckboxLabel(container: Locator | Page): Locator {
    return container.locator('.multi-form-input-checkbox label');
  }


  // ------------------ dropdown selectors  --------------------- //
  static getDropdownElementByName = (container: Locator | Page, name: string, formNumber: number) => {
    return container.locator(`.input-switch-container-${formNumber}-${name} .dropdown-toggle`);
  }

  // --------------- foreign key dropdown selectors ------------- //
  static getFkeyDropdowns(container: Locator | Page): Locator {
    return container.locator('.fk-dropdown');
  }

  static getDropdownSelectableOptions(container: Locator | Page): Locator {
    return container.locator('.dropdown-menu.show').locator('.dropdown-select-value');
  }

  static getDropdownLoadMoreRow(container: Locator | Page): Locator {
    return container.locator('.dropdown-menu .load-more-row');
  }

  static getDropdownSearch(container: Locator | Page): Locator {
    return container.locator('.dropdown-menu .search-row .chaise-input-control input');
  }

  // ------------- boolean dropdown selectors ----------------- //
  static getDropdownText(dropdown: Locator): Locator {
    return dropdown.locator('.chaise-input-control');
  }

  static getOpenDropdownOptionsContainer(container: Locator | Page): Locator {
    return container.locator('.dropdown-menu.show');
  }

  // Gets the boolean dropdown options after the input is opened and attached to input container
  static getDropdownOptions(container: Locator | Page): Locator {
    return container.locator('.dropdown-menu.show').locator('li');
  }
}
