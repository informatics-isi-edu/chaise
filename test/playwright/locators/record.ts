import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { Locator, Page } from '@playwright/test';

export default class RecordLocators {
  static async waitForRecordPageReady(page: Page, timeout?: number) {
    await RecordLocators.getEntityTitleElement(page).waitFor({ state: 'visible', timeout });
    await RecordLocators.getMainSectionTable(page).waitFor({ state: 'visible', timeout });
    await RecordLocators.getRelatedSectionSpinner(page).waitFor({ state: 'detached', timeout })
    await RecordLocators.getTableOfContentsRelatedSpinner(page).waitFor({ state: 'detached', timeout })
  }

  // ----------------- general selectors -------------------- //
  static getEntityTitleElement(container: Locator | Page): Locator {
    return container.locator('.entity-title');
  }

  static getTableOfContentsRelatedSpinner(container: Locator | Page): Locator {
    return container.locator('#rt-toc-loading');
  }

  static getSidePanelHeadings(container: Locator | Page): Locator {
    return container.locator('.columns-container li.toc-heading');
  }

  static getShareButton(container: Locator | Page): Locator {
    return container.locator('.share-cite-btn');
  }

  // ----------------- main section selectors ------------------------ //

  static getMainSectionTable(container: Locator | Page): Locator {
    return container.locator('.record-main-section-table');
  }

  static getEntityRelatedTable(container: Locator | Page, displayname: string): Locator {
    displayname = makeSafeIdAttr(displayname);
    return container.locator(`#entity-${displayname}`);
  }

  static getColumns(container: Locator | Page): Locator {
    return container.locator('tr:not(.forced-hidden) td.entity-key');
  }

  static getAllColumnNames(container: Locator | Page): Locator {
    return container.locator('tr:not(.forced-hidden) td.entity-key > span.column-displayname > span');
  }

  static getColumnNameElement(container: Locator | Page, columnDisplayName: string): Locator {
    const displayName = makeSafeIdAttr(columnDisplayName);
    return container.locator(`.entity-row-${displayName} td.entity-key > span.column-displayname`);
  }

  static getAllColumnValues(container: Locator | Page): Locator {
    return container.locator('tr:not(.forced-hidden) td.entity-value');
  }

  static getColumnValue(container: Locator | Page, columnName: string): Locator {
    return container.locator(`#row-${columnName} .entity-value span`);
  }

  // --------------------- related table selectors ----------------- //

  static getRelatedTableContainer(container: Locator | Page, displayname: string, isInline?: boolean): Locator {
    if (isInline) return RecordLocators.getEntityRelatedTable(container, displayname);
    return RecordLocators.getRelatedTableAccordion(container, displayname);
  }

  static getRelatedTableAccordion(container: Locator | Page, displayname: string): Locator {
    displayname = makeSafeIdAttr(displayname);
    return container.locator(`#rt-heading-${displayname}`);
  }

  static getRelatedSectionSpinner(page: Page): Locator {
    return page.locator('.related-section-spinner');
  }

  static getDisplayedRelatedTableTitles(page: Page): Locator {
    return page.locator('.chaise-accordion:not(.forced-hidden) .chaise-accordion-header .chaise-accordion-displayname')
  }

  static getRelatedMarkdownContainer(page: Page, displayname: string, isInline?: boolean): Locator {
    const loc = RecordLocators.getRelatedTableContainer(page, displayname, isInline);
    return loc.locator('.related-markdown-content');
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
    const loc = RecordLocators.getRelatedTableContainer(page, displayname, isInline);
    return loc.locator('.bulk-edit-link');
  }

  static getRelatedTableExploreLink(page: Page, displayname: string, isInline?: boolean): Locator {
    const loc = RecordLocators.getRelatedTableContainer(page, displayname, isInline);
    return loc.locator('.more-results-link');
  }

  static getRelatedTableAddButton(page: Page, displayname: string, isInline?: boolean): Locator {
    const loc = RecordLocators.getRelatedTableContainer(page, displayname, isInline);
    return loc.locator('.add-records-link');
  }

  static getRelatedTableUnlinkButton(page: Page, displayname: string, isInline?: boolean): Locator {
    const loc = RecordLocators.getRelatedTableContainer(page, displayname, isInline);
    return loc.locator('.unlink-records-link');
  }

  static getRelatedTableToggleDisplay(page: Page, displayname: string, isInline?: boolean): Locator {
    const loc = isInline ? RecordLocators.getEntityRelatedTable(page, displayname) : RecordLocators.getRelatedTableAccordion(page, displayname);
    return loc.locator('.toggle-display-link');
  }


}
