export default class NavbarLocators {
  static getBanner(key: string, page: any) {
    const prefix = 'chaise-navbar-banner-container';
    return page.locator(`.${prefix}${key ? (prefix + '-key') : ''}`);
  }

  static getTitle (page: any) {
    return page.locator('#brand-text');
  }

  static getBrandImage(page: any) {
    return page.locator('#brand-image')
  }
}
