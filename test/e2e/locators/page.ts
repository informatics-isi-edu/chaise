import { Page, Locator } from '@playwright/test';

export default class PageLocators {

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
}
