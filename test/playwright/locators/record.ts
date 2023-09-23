import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { Locator, Page } from '@playwright/test';

export default class RecordLocators {
  static async waitForRecordPageReady(page: Page) {
    await RecordLocators.getEntityTitleElement(page).waitFor({ state: 'visible' });
    await RecordLocators.getMainSectionTable(page).waitFor({ state: 'visible' });
    await RecordLocators.getRelatedSectionSpinner(page).waitFor({ state: 'detached' })
  }

  static getEntityTitleElement(page: Page): Locator {
    return page.locator('.entity-title');
  }

  static getMainSectionTable(page: Page): Locator {
    return page.locator('.record-main-section-table');
  }

  static getRelatedSectionSpinner(page: Page): Locator {
    return page.locator('.related-section-spinner');
  }

  static getRelatedTableAccordion(page: Page, displayname: string): Locator {
    displayname = makeSafeIdAttr(displayname);
    return page.locator(`#rt-heading-${displayname}`);
  }

  static getRelatedTableAccordionContent(page: Page, displayname: string): Locator {
    const acc = RecordLocators.getRelatedTableAccordion(page, displayname);
    return acc.locator('.accordion-collapse');
  }
}
