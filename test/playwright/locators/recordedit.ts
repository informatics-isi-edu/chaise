import { Locator, Page } from '@playwright/test';

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

  static getPageTitle(container: Locator | Page): Locator {
    return container.locator('#page-title');
  }

  static getRequiredInfoEl(container: Locator | Page): Locator {
    return container.locator('.required-info');
  }

  static getSubmitRecordButton(container: Locator | Page): Locator {
    return container.locator('#submit-record-button');
  };


}
