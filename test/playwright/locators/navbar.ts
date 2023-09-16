import { Locator, Page } from '@playwright/test';

export default class NavbarLocators {
  static getBanner(key: string, page: Page) : Locator {
    const prefix = 'chaise-navbar-banner-container';
    return page.locator(`.${prefix}${key ? (prefix + '-key') : ''}`);
  }

  static getBannerDismissBtn (key: string, page: Page) {
    const banner =  NavbarLocators.getBanner(key, page);
    return banner.locator('.close');
}

  static getTitle (page: any) {
    return page.locator('#brand-text');
  }

  static getBrandImage(page: any) {
    return page.locator('#brand-image')
  }
}
