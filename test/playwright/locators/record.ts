import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { Locator, Page } from '@playwright/test';

export default class RecordLocators {
  static async waitForRecordPageReady(page: Page, timeout?: number) {
    await RecordLocators.getEntityTitleElement(page).waitFor({ state: 'visible', timeout });
    await RecordLocators.getMainSectionTable(page).waitFor({ state: 'visible', timeout });
    await RecordLocators.getRelatedSectionSpinner(page).waitFor({ state: 'detached', timeout })
    await RecordLocators.getTableOfContentsRelatedSpinner(page).waitFor({ state: 'detached', timeout })
  }

  static getEntityTitleElement(page: Page): Locator {
    return page.locator('.entity-title');
  }

  static getMainSectionTable(page: Page): Locator {
    return page.locator('.record-main-section-table');
  }

  static getEntityRelatedTable(page: Page, displayname: string): Locator {
    displayname = makeSafeIdAttr(displayname);
    return page.locator(`#entity-${displayname}`);
  }

  static getRelatedSectionSpinner(page: Page): Locator {
    return page.locator('.related-section-spinner');
  }

  static getTableOfContentsRelatedSpinner(page: Page): Locator {
    return page.locator('#rt-toc-loading');
  }

  static getDisplayedRelatedTableTitles(page: Page): Locator {
    return page.locator('.chaise-accordion:not(.forced-hidden) .chaise-accordion-header .chaise-accordion-displayname')
  }

  static getRelatedTableAccordion(page: Page, displayname: string): Locator {
    displayname = makeSafeIdAttr(displayname);
    return page.locator(`#rt-heading-${displayname}`);
  }

  static getRelatedTableHeading(page: Page, displayname: string): Locator {
    return RecordLocators.getRelatedTableAccordion(page, displayname).locator('.panel-heading');
  }

  static getRelatedTableSectionHeader(page: Page, displayname: string): Locator {
    return RecordLocators.getRelatedTableHeading(page, displayname).locator('.chaise-accordion-header');
  }

  static getRelatedTableSectionHeaderDisplayname(page: Page, displayname: string): Locator {
    return RecordLocators.getRelatedTableHeading(page, displayname).locator('.chaise-accordion-header .chaise-accordion-displayname');
  }

  static getRelatedTableInlineComment(page: Page, displayname: string): Locator {
    return RecordLocators.getRelatedTableAccordion(page, displayname).locator('.inline-tooltip');
  }

  static getRelatedTableAccordionContent(page: Page, displayname: string): Locator {
    const acc = RecordLocators.getRelatedTableAccordion(page, displayname);
    return acc.locator('.accordion-collapse');
  }

  static getRelatedTableBulkEditLink(page: Page, displayname: string, isInline?: boolean): Locator {
    const loc = isInline ? RecordLocators.getEntityRelatedTable(page, displayname) : RecordLocators.getRelatedTableAccordion(page, displayname);
    return loc.locator('.bulk-edit-link');
  }

  static getRelatedTableExploreLink(page: Page, displayname: string, isInline?: boolean): Locator {
    const loc = isInline ? RecordLocators.getEntityRelatedTable(page, displayname) : RecordLocators.getRelatedTableAccordion(page, displayname);
    return loc.locator('.more-results-link');
  }

  static getRelatedTableAddButton(page: Page, displayname: string, isInline?: boolean): Locator {
    const loc = isInline ? RecordLocators.getEntityRelatedTable(page, displayname) : RecordLocators.getRelatedTableAccordion(page, displayname);
    return loc.locator('.add-records-link');
  }

  static getRelatedTableUnlinkButton(page: Page, displayname: string, isInline?: boolean): Locator {
    const loc = isInline ? RecordLocators.getEntityRelatedTable(page, displayname) : RecordLocators.getRelatedTableAccordion(page, displayname);
    return loc.locator('.unlink-records-link');
  }

  static getRelatedTableToggleDisplay(page: Page, displayname: string, isInline?: boolean): Locator {
    const loc = isInline ? RecordLocators.getEntityRelatedTable(page, displayname) : RecordLocators.getRelatedTableAccordion(page, displayname);
    return loc.locator('.toggle-display-link');
  }

  static getSidePanelHeadings(page: Page): Locator {
    return page.locator('.columns-container li.toc-heading');
  }

  static getShareButton(page: Page): Locator {
    return page.locator('.share-cite-btn');
  }

}
