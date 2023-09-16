import { Browser } from '@playwright/test';

export default class PageLocators {
  static async navigate(url: string, browser: Browser) {
    let page = await browser.newPage();
    await page.goto(url);
  }

  static async recordsetPageReady(page: any) {
    // page.
  }
}
