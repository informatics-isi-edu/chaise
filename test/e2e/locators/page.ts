import { Page, Locator } from '@playwright/test';

export default class PageLocators {

  static getTooltipIcon(container: Page | Locator): Locator {
    return container.locator('.chaise-icon-for-tooltip');
  }

  static getTooltipContainer(page: Page): Locator {
    return page.locator('.tooltip').first();
  }

  static getMarkdownContainer(container: Page | Locator) : Locator {
    return container.locator('.markdown-container:not(.chaise-comment)');
  }

  static getFooterContainer(page: Page): Locator {
    return page.locator('#footer');
  }

  static getFooterLink(page: Page): Locator {
    return PageLocators.getFooterContainer(page).locator('a');
  }

  static getHelpPageMainTable(page: Page): Locator {
    return page.locator('#mainTable')
  }

  static getLoginAppEmptyContainer(page: Page): Locator {
    return page.locator('.login-app-empty-container');
  }

  static getVersionInfoElements(page: Page) {
    const container = page.locator('.chaise-title-version-info')
    return {
      container,
      liveBtn: container.locator('.show-live-btn'),
    };
  }
}
