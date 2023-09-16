import { Locator, Page } from '@playwright/test';

export default class NavbarLocators {
  static getContainer(page: Page): Locator {
    return page.locator('#mainnav');
  }

  static getBanner(key: string, page: Page): Locator {
    let selector = '.chaise-navbar-banner-container';
    if (key) {
      selector += '.chaise-navbar-banner-container-' + key;
    }
    return page.locator(selector);
  }

  static getBannerContent(key: string, page: Page): Locator {
    const banner = NavbarLocators.getBanner(key, page);
    return banner.locator('.markdown-container');
  }

  static getBannerDismissBtn(key: string, page: Page) {
    const banner = NavbarLocators.getBanner(key, page);
    return banner.locator('.close');
  }

  static getBrandImage(page: Page) {
    return page.locator('#brand-image')
  }

  static getBrandText(page: Page) {
    return page.locator('#brand-text')
  }

  static getUsername(page: Page) {
    return page.locator('.username-display');
  }

  static getMenu(page: Page) {
    return page.locator('.navbar-menu-options');
  }

  static getLoginMenu(page: Page) {
    return page.locator('.username-display > div.dropdown-menu');
  }

  static getProfileLink(page: Page) {
    return page.locator('#profile-link');
  }

  static getLogoutLink(page: Page) {
    return page.locator('#logout-link');
  }
}
