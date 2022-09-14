// Makes a string safe and valid for use in an HTML element's id attribute.
// Commonly used for column displaynames.
const makeSafeIdAttr = (string: string) => {
  const ID_SAFE_REGEX = /[^\w-]+/g;
  return String(string).replace(ID_SAFE_REGEX, '-');
}

export class recordPage {
  static getRelatedTableTitles = (page: any) => {
    return page.locator('.related-table-accordion .panel-title .rt-section-header .rt-displayname');
  }

  static getSidePanelHeadings = (page: any) => {
    return page.locator('li.toc-heading');
  }

  static getSidePanelTableTitles = (page: any) => {
    return page.locator('.columns-container li.toc-heading');
  }

  static getShareButton = (page: any) => {
    return page.locator('share');
  }

  static getShareModal = (page: any) => {
    return page.locator('.chaise-share-citation');
  }

  static getModalTitle = (page: any) => {
    return page.locator('.modal-title');
  }

  static getModalListElements = (page: any) => {
    return page.locator('li');
  }

  static getShareLinkHeader = (page: any) => {
    return page.locator('#share-link h2');
  }

  static getShareLinkSubHeaders = (page: any) => {
    return page.locator('#share-link h3');
  }

  static getVersionedLinkText = (page: any) => {
    return page.locator('#version');
  }
  
  static getPermalinkText = (page: any) => {
    return page.locator('#permalink');
  }

  static getCopyIcons = (page: any) => {
    return page.locator('#share-link .glyphicon.glyphicon-copy');
  }

  static getCitationHeader = (page: any) => {
    return page.locator('#citation h2');
  }

  static getCitationText = (page: any) => {
    return page.locator('#citation-text');
  }

  static getDownloadCitationHeader = (page: any) => {
    return page.locator('#download-citation h3');
  }

  static getBibtex = (page: any) => {
    return page.locator('#bibtex-download');
  }

  static getModalCloseBtn = (page: any) => {
    return page.locator('.modal-close');
  }

  static getEntityRelatedTableCss = (displayname: string) => '#entity-' + makeSafeIdAttr(displayname);
  static getEntityRelatedTable = (page: any, displayname: string) => {
    return page.locator(this.getEntityRelatedTableCss(displayname));
  }

  static getRelatedTableAccordionCss = (displayname: string) => '#rt-heading-' + makeSafeIdAttr(displayname);
  static getRelatedTableAccordion = (page: any, displayname: string) => {
    return page.locator(this.getRelatedTableAccordionCss(displayname));
  }

  static getToggleDisplayLinkCss = (displayname: string, isInline: boolean) => {
    const css = isInline ? this.getEntityRelatedTableCss(displayname) : this.getRelatedTableAccordionCss(displayname);
    // the link is not a child of the table, rather one of the accordion group
    return css + ' .toggle-display-link';
  }
  static getToggleDisplayLink = (page: any, displayname: string, isInline: boolean) => {
    return page.locator(this.getToggleDisplayLinkCss(displayname, isInline));
  }

  static getRelatedTableHeadingCss = (displayname: string) => this.getRelatedTableAccordionCss(displayname) + ' .panel-heading';
  static getRelatedTableHeading = (page: any, displayname: string) => {
    return page.locator(this.getRelatedTableHeadingCss(displayname));
  }

  static getRelatedTableSectionHeader = (page: any, displayname: string) => {
    return page.locator(this.getRelatedTableHeadingCss(displayname) + ' .rt-section-header');
  }

  static getRelatedTableInlineComment = (page: any, displayname: string) => {
    return page.locator(this.getRelatedTableAccordionCss(displayname) + ' .inline-tooltip');
  }

  static getMoreResultsLink = (page: any, displayname: string, isInline: boolean) => {
    const css = isInline ? this.getEntityRelatedTableCss(displayname) : this.getRelatedTableAccordionCss(displayname);
    // the link is not a child of the table, rather one of the accordion group
    return page.locator(css + ' .more-results-link');
  }

  static getColumnCommentHTML = (page: any, el: any) => {
    return el.getAttribute('uib-tooltip-html');
  }

  static getColumnComment = (page: any, el: any) => {
    return el.getAttribute('uib-tooltip');
  }

  static getRelatedTableCss = (displayname: string) => '#rt-' + makeSafeIdAttr(displayname);
  static getRelatedTable = (page: any, displayname: string) => {
    return page.locator(this.getRelatedTableCss(displayname));
  }

  static getRelatedTableRows = (page: any, displayname: string, isInline: boolean) => {
    const css = isInline ? this.getEntityRelatedTableCss(displayname) : this.getRelatedTableCss(displayname);
    return page.locator(css + ' .chaise-table-row');
  }

  static getAddRecordLinkCss = (displayname: string, isInline: boolean) => {
    const css = isInline ? this.getEntityRelatedTableCss(displayname) : this.getRelatedTableAccordionCss(displayname);
    // the link is not a child of the table, rather one of the accordion group
    return css + ' .add-records-link'
  }
  static getAddRecordLink = (page: any, displayname: string, isInline: boolean) => {
    return page.locator(this.getAddRecordLinkCss(displayname, isInline));
  }
}