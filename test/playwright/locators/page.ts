import { Page, Locator, BrowserContext, expect } from '@playwright/test';
import { DOWNLOAD_FOLDER } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.parameters';

export default class PageLocators {

  /**
   * click on the given link and return the opened page instance.
   *
   * Example:
   * const newPage = await PageLocators.clickNewTabLink(someButton, context);
   * await newPage.waitForURL('someURL');
   * await newPage.close();
   */
  static async clickNewTabLink(locator: Locator, context: BrowserContext) {
    const pagePromise = context.waitForEvent('page');
    await locator.click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    return newPage;
  }

  /**
   * click on the given element and verify that it initiated a download
   * @param locator the button that will be clicked
   * @param expectedFileName pass undefined if you don't want to test the actual file path and just test that something was downloaded.
   * @param page the page object
   */
  static async clickAndVerifyDownload(locator: Locator, expectedFileName: string | undefined, page: Page) {
    const downloadPromise = page.waitForEvent('download');
    await locator.click();
    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // Wait for the download process to complete and save the downloaded file somewhere.
    await download.saveAs(DOWNLOAD_FOLDER + '/' +  filename);

    if (expectedFileName) {
      expect.soft(filename).toEqual(expectedFileName);
    }

    await download.delete();
  }

  static async getClipboardContent(page: Page) : Promise<string> {
    return await page.evaluate('navigator.clipboard.readText()');
  }
}
