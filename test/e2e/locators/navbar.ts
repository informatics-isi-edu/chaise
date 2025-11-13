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

  static getBannerDismissBtn(key: string, page: Page): Locator {
    const banner = NavbarLocators.getBanner(key, page);
    return banner.locator('.close');
  }

  static getBrandLink(page: Page): Locator {
    return page.locator('.navbar-brand');
  }

  static getBrandImage(page: Page): Locator {
    return page.locator('#brand-image')
  }

  static getBrandText(page: Page): Locator {
    return page.locator('#brand-text')
  }

  static getUsername(page: Page): Locator {
    return page.locator('.username-display');
  }

  static getMenu(page: Page): Locator {
    return page.locator('.navbar-menu-options');
  }

  static getLoginMenuContainer(page: Page): Locator {
    return NavbarLocators.getContainer(page).locator('.login-menu-options');
  }

  static getLoginMenu(page: Page): Locator {
    return page.locator('.username-display > div.dropdown-menu');
  }

  static getProfileLink(page: Page): Locator {
    return page.locator('#profile-link');
  }

  static getLogoutLink(page: Page): Locator {
    return page.locator('#logout-link');
  }

  static getGoToRIDInput(page: Page): Locator {
    return page.locator('#rid-search-input');
  }

  static getGoToRIDButton(page: Page): Locator {
    return page.locator('.rid-search .chaise-search-btn');
  }

  static getGoToSnapshotNavbarButton(page: Page): Locator {
    return page.locator('.chaise-snapshot-control');
  }

  static getGoToSnapshotOrLiveToggleElements(page: Page) {
    const form = page.locator('.chaise-snapshot-form');
    const label = page.locator('.snapshot-form-label');

    return {
      label,
      snapshotOrLiveToggle: form.locator('.toggle-snapshot-live-btn'),
      toggleSnapshotItem: label.locator('.snapshot-item.dropdown-item'),
      toggleLiveItem: label.locator('.live-item.dropdown-item'),
    };
  }

  static goTOSnapshotFormElements(page: Page) {
    const form = page.locator('.chaise-snapshot-form');
    return {
      form,
      dateInput: form.locator('.snapshot-date-input'),
      timeInput: form.locator('.snapshot-time-input'),
      clearDateBtn: form.locator('.snapshot-date-clear'),
      clearTimeBtn: form.locator('.snapshot-time-clear'),
      nowBtn: form.locator('.date-time-now-btn'),
      applyBtn: form.locator('.snapshot-form-apply-btn'),
    }
  }

}
