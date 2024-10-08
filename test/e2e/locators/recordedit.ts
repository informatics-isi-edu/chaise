import { FrameLocator, Locator, Page } from '@playwright/test';
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

  static getAddMoreButton(container: Locator | Page): Locator {
    return container.locator('#recordedit-add-more');
  }

  static getRecordeditForms(container: Locator | Page): Locator {
    return container.locator('.recordedit-form .form-header');
  }

  static getRecoreditResultsetTables(container: Locator | Page): Locator {
    return container.locator('.resultset-tables');
  }

  static getAllColumnNames(container: Locator | Page): Locator {
    return container.locator('.entity-key-column > .entity-key > span.column-displayname > span');
  }

  static getColumnNamesWithTooltip(container: Locator | Page): Locator {
    return container.locator('.entity-key-column > .entity-key > span.column-displayname.chaise-icon-for-tooltip > span');
  }

  static getColumnNameByColumnIndex(container: Locator | Page, index: number): Locator {
    return container.locator(`.entity-key-column > .entity-key.entity-key-${index} > span.column-displayname > span`);
  }

  static getColumnInlineComments(container: Locator | Page): Locator {
    return container.locator('.inline-comment-row');
  }

  static getColumnRequiredIcon(colNameElement: Locator): Locator {
    return colNameElement.locator('xpath=./../..').locator('.text-danger');
  }

  static getAllColumnPermissionOverlays(container: Locator | Page): Locator {
    return container.locator('.column-permission-overlay');
  }

  static getAllDeleteRowButtons(container: Locator | Page): Locator {
    return container.locator('button.remove-form-btn');
  }

  // Forms are indexed starting with 1, delete row button is indexed with 0
  static getDeleteRowButton(container: Locator | Page, index: number): Locator {
    index = index || 0;
    return RecordeditLocators.getAllDeleteRowButtons(container).nth(index);
  }

  static getSubmitSpinner(container: Locator | Page): Locator {
    return container.locator('.submit-spinner');
  }

  // ---------------- input-level selectors -------------- //

  /**
    * returns the cell (entity-value).
    * this is useful if we want to test the extra classes attached to it.
    */
  static getFormInputCell(container: Locator | Page, name: string, formNumber: number, isArray?: boolean): Locator {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    if (isArray) {
      return container.locator(`.array-input-field-container-${inputName}`).locator('xpath=..');
    }
    return container.locator(`.input-switch-container-${inputName}`).locator('xpath=..')
  }

  static getInputForAColumn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    return container.locator(`.c_${formNumber}-${name}`);
  }

  static getDateInputsForAColumn(container: Locator | Page, name: string, formNumber: number): { date: Locator, todayBtn: Locator } {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    return {
      date: container.locator(`.${inputName}`),
      todayBtn: container.locator(`.input-switch-container-${inputName} .date-today-btn`)
    }
  }

  static getTimestampInputsForAColumn(container: Locator | Page, name: string, formNumber: number): {
    date: Locator, time: Locator, nowBtn: Locator, clearBtn: Locator, dateRemoveBtn: Locator, timeRemoveBtn: Locator
  } {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    const wrapper = container.locator(`.input-switch-container-${inputName}`);
    return {
      date: wrapper.locator(`.${inputName}-date`),
      time: wrapper.locator(`.${inputName}-time`),
      nowBtn: wrapper.locator('.date-time-now-btn'),
      clearBtn: wrapper.locator('.date-time-clear-btn'),
      dateRemoveBtn: wrapper.locator('.input-switch-date .input-switch-clear'),
      timeRemoveBtn: wrapper.locator('.input-switch-time .input-switch-clear')
    };
  }

  static getInputControlForAColumn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    return container.locator(`.input-switch-container-${inputName}`).locator('.chaise-input-control');
  }

  static getInputRemoveButton(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    return container.locator(`.input-switch-container-${inputName}`).locator('.remove-input-btn');
  }

  /**
   * return the error message that is displayed for an input
   * @param container the container that the input is part of
   * @param name name of the input
   * @param formNumber the form number value
   * @param isWarning whether this is for the warning messages or not (.e.g. the add or remove warning of arrays)
   * @returns
   */
  static getErrorMessageForAColumn(container: Locator | Page, name: string, formNumber: number, isWarning?: boolean): Locator {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    const erroClass = isWarning ? 'input-switch-error-warning' : 'input-switch-error-danger';
    return container.locator(`.input-switch-container-${inputName}`).locator('.input-switch-error.' + erroClass);
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

  /**
   * only applicaple to inputs that have a "fake" placehodler: boolean, file, foriegnkey, and iframe.
   */
  static getInputPlaceholderMessage(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    return container.locator(`.input-switch-container-${inputName}`).locator('.chaise-input-placeholder');
  }

  // -------------- file input selectors --------------- //
  static getTextFileInputForAColumn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    return container.locator(`.input-switch-container-${inputName}`).locator('.chaise-input-control > span');
  }

  static getFileInputButtonForAColumn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    return container.locator(`.input-switch-container-${inputName}`).locator('.chaise-input-group-append');
  }

  // -------------- color input selectors -------------- //
  static getColorInputForAColumn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    return container.locator(`.input-switch-container-${inputName}`).locator('input');
  }

  static async getColorInputBackground(page: Page, name: string, formNumber: number): Promise<string> {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    return await page.evaluate(async ({ inputName }) => {
      const el = document.querySelector(`.input-switch-container-${inputName} .chaise-color-picker-preview`) as HTMLElement;
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx || !el) return '';
      ctx.fillStyle = el.style.backgroundColor;
      return ctx.fillStyle;
    }, { inputName });
  }

  static getColorInputBtn(container: Locator | Page, name: string, formNumber: number): Locator {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    return container.locator(`.input-switch-container-${inputName} button`);
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

  static getModalPopupButtons(container: Page | Locator): Locator {
    return container.locator('.modal-popup-btn');
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
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    return container.locator(`.input-switch-container-${inputName} .dropdown-toggle`);
  }

  static getDropdownMenuByName = (container: Locator | Page, name: string, formNumber: number) => {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    return container.locator(`.input-switch-container-${inputName} .dropdown-menu`);
  }

  // --------------- foreign key dropdown selectors ------------- //
  static getFkeyDropdowns(container: Locator | Page): Locator {
    return container.locator('.fk-dropdown');
  }

  static getDropdownSelectableOptions(container: Locator | Page): Locator {
    return container.locator('.dropdown-menu.show').locator('.dropdown-select-value');
  }

  static getFKDropdownOptions(container: Locator | Page): Locator {
    return container.locator('.dropdown-menu.show').locator('.dropdown-list li');
  }

  static getDropdownDisabledOptions(container: Locator | Page): Locator {
    return container.locator('.dropdown-menu.show').locator('.dropdown-item.disabled');
  }

  static getDropdownRow(container: Locator | Page, index: number): Locator {
    return this.getDropdownSelectableOptions(container).nth(index);
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

  // ------------- iframe-field selectors ----------------- //

  /**
   * all the props that are needed for testing iframe field
   */
  static getIframeFieldProps(container: Locator | Page, name: string, formNumber?: number) {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    const inputSwitchContainer = container.locator(`.input-switch-container-${inputName}`);
    return {
      container: inputSwitchContainer.locator('.input-switch-iframe'),
      popupButton: inputSwitchContainer.locator('.chaise-input-group-append button'),
      clearButton: inputSwitchContainer.locator('.input-switch-clear'),
      display: inputSwitchContainer.locator('.chaise-input-control')
    };
  }

  /**
   * these are based on the test/e2e/utils/input-iframe-test.html file
   */
  static getInputIframeTestProps(iframe: FrameLocator) {
    return {
      alertButton: iframe.locator('#iframe-alert-btn'),
      submitButton: iframe.locator('#iframe-submit-btn'),
      creator: iframe.locator('#creator'),
      file_content: iframe.locator('#file-content'),
      notes: iframe.locator('#notes'),
    }
  }

  // ------------- array selectors ----------------- //

  static getArrayFieldContainer(container: Locator | Page, name: string, formNumber: number) {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    return container.locator(`.array-input-field-container-${inputName}`);
  }

  /**
   * Returns the elemens that are needed for testing arrays.
   *
   * if you would like to test each individual input, use the `getArrayInputName` function to find its appropriate
   * name and then use the other functions that are used for inptus (e.g. `getInputForAColumn`).
   */
  static getArrayFieldElements(container: Locator | Page, name: string, formNumber: number) {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    const elem = container.locator(`.array-input-field-container-${inputName}`);
    return {
      container: elem,
      addItemContainer: elem.locator('.add-element-container'),
      addItemButton: elem.locator('.add-button'),
      removeItemButtons: elem.locator('.array-remove-button'),
    };
  }

  /**
   * Returns the input name that chaise uses for the n-th input for an array column.
   *
   * @param name the name of the column
   * @param index the index of the value (use -1 if it's for the "new-item" one)
   * @returns
   */
  static getArrayInputName(name: string, index: number) {
    const append = index === -1 ? 'new-item' : `${index}-val`;
    return `${name}-${append}`;
  }


  // ------------- markdown selectors ----------------- //
  static getMarkdownElements(container: Locator | Page, name: string, formNumber: number) {
    formNumber = formNumber || 1;
    const inputName = `c_${formNumber}-${name}`;
    const elem = container.locator(`.input-switch-container-${inputName}`);

    return {
      container: elem,
      getButton: (title: string) => elem.locator(`button[title="${title}"]`),
      helpButton: elem.locator('button[title="Help"]'),
      previewButton: elem.locator('button[title="Preview"]'),
      fullScreenButton: elem.locator('button[title="Fullscreen Preview"]'),
      previewContent: elem.locator('.md-preview .markdown-container')
    }

  }
}
