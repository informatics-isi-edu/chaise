// Makes a string safe and valid for use in an HTML element's id attribute.
// Commonly used for column displaynames.
const makeSafeIdAttr = (string: string) => {
  const ID_SAFE_REGEX = /[^\w-]+/g;
  return String(string).replace(ID_SAFE_REGEX, '-');
}

export class recordsetPage {
  static recordsetPageReady = (page: any) => {
    return page.waitForSelector('.recordset-table', {state: 'visible'});
  }

  static getPageTitleElement = (page: any) => {
    return page.locator('#page-title');
  }

  static getFacetFilters = (page: any) => {
    return page.locator('.chiclets-container .filter-chiclet');
  }
}