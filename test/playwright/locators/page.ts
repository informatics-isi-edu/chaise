import { Locator, BrowserContext } from '@playwright/test';

export default class PageLocators {

  /**
   * click on the given link and return the opened page instance.
   */
  static async clickNewTabLink(locator: Locator, context: BrowserContext) {
    const pagePromise = context.waitForEvent('page');
    await locator.click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    return newPage;
  }
}
