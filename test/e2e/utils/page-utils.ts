import { Page, Locator, expect } from '@playwright/test';
import { DOWNLOAD_FOLDER } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';

import PageLocators from '@isrd-isi-edu/chaise/test/e2e/locators/page';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';

import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';

export async function getClipboardContent(page: Page): Promise<string> {
  return await page.evaluate('navigator.clipboard.readText()');
}

/**
 * click on the given link and return the opened page instance.
 *
 * Example:
 *
 * const newPage = await PageLocators.clickNewTabLink(someButton, context);
 *
 * await newPage.waitForURL('someURL');
 *
 * await newPage.close();
 */
export async function clickNewTabLink(locator: Locator) {
  const pagePromise = locator.page().context().waitForEvent('page');
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
export async function clickAndVerifyDownload(locator: Locator, expectedFileName: string | undefined) {
  const downloadPromise = locator.page().waitForEvent('download');
  await locator.click();
  const download = await downloadPromise;
  const filename = download.suggestedFilename();

  // Wait for the download process to complete and save the downloaded file somewhere.
  await download.saveAs(DOWNLOAD_FOLDER + '/' + filename);

  if (expectedFileName) {
    expect.soft(filename).toEqual(expectedFileName);
  }

  await download.delete();
}

/**
 * hover over an element and make sure it shows the expected tooltip
 *
 * To make sure the hover goes away after this test, we're hovering over an element.
 * This element is chosen based on app.
 */
export async function testTooltip(locator: Locator, expectedTooltip: string | RegExp, appName: APP_NAMES, isSoft?: boolean) {
  await locator.hover();

  const el = PageLocators.getTooltipContainer(locator.page());

  const expectFn = isSoft ? expect.soft : expect;

  await expectFn(el).toBeVisible();
  await expectFn(el).toHaveText(expectedTooltip);

  // hover over an element that we know doesn't have tooltip to remove the tooltip
  let hoverEl;
  switch (appName) {
    case APP_NAMES.RECORD:
      hoverEl = RecordLocators.getEntityTitleElement(locator.page());
      break;
    case APP_NAMES.RECORDSET:
      hoverEl = RecordsetLocators.getTotalCount(locator.page());
      break;
    case APP_NAMES.RECORDEDIT:
      hoverEl = RecordeditLocators.getRequiredInfoEl(locator.page());
      break;
    default:
      // TODO what about other apps
      hoverEl = locator.page().locator('.app-container');
      break;
  }

  await hoverEl.hover();
  await expectFn(el).not.toBeAttached();

}

/**
 * This function should be used when we expect browser to call the focus event.
 * in playwright all opened tabs are focused and focus is never lost.
 * so we have to manually call focus on the page.
 */
export async function manuallyTriggerFocus(page: Page) {
  await page.evaluate(() =>
    document.dispatchEvent(new Event('focus', { bubbles: true })),
  );
}
