import { Page, Locator } from '@playwright/test';

export default class PageLocators {

  static getTooltipContainer(page: Page): Locator {
    return page.locator('.tooltip').first();
  }

  static getMarkdownContainer(container: Page | Locator) : Locator {
    return container.locator('.markdown-container:not(.chaise-comment)');
  }
}
