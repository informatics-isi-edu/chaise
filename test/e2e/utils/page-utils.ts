import { expect, Locator, Page, test } from '@playwright/test';
import fs from 'fs';

// Locators
import ExportLocators from '@isrd-isi-edu/chaise/test/e2e/locators/export';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import PageLocators from '@isrd-isi-edu/chaise/test/e2e/locators/page';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';

// utils
import { APP_NAMES, DOWNLOAD_FOLDER } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';

export async function getClipboardContent(page: Page): Promise<string> {
  return await page.evaluate('navigator.clipboard.readText()');
}

export async function getPageURLOrigin(page: Page): Promise<string> {
  return await page.evaluate(() => { return document.location.origin });
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
 * @param waitCond if the page takes some time to trigger the download, add the proper wait condition.
 */
export async function clickAndVerifyDownload(locator: Locator, expectedFileName: string | undefined, waitCond?: () => Promise<void>) {
  const downloadPromise = locator.page().waitForEvent('download');
  await locator.click();

  if (waitCond) {
    await waitCond();
  }

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


export async function testButtonState(button: Locator, useSoftExpect: boolean, isVisible: boolean, isDisabled?: boolean, label?: string) {
  const expectFn = useSoftExpect ? expect.soft : expect;

  if (!isVisible) {
    await expectFn(button).not.toBeVisible();
    return;
  }

  await expectFn(button).toBeVisible();

  if (typeof isDisabled === 'boolean') {
    if (isDisabled) {
      await expectFn(button).toBeDisabled();
    } else {
      await expectFn(button).not.toBeDisabled();
    }
  }

  if (label) {
    await expectFn(button).toHaveText(label);
  }
}

export async function deleteDownloadedFiles(filePaths: string[]) {
  filePaths.forEach((path: string) => {
    if (fs.existsSync(path)) {
      // delete if there is any existing file with same name
      fs.unlinkSync(path);
      console.log(`file: ${path} has been removed`);
    }
  });
};

/**
 * function to test the export dropdown on record and recordset pages. If filenames has 3 values in it, then the
 * 3rd test below will run checking the "configurations" submenu option
 *
 * @param fileNames string names for files to verify have downloaded
 */
export async function testExportDropdown(page: Page, fileNames: string[]) {
  await test.step(`should have ${fileNames.length} options in the export dropdown menu.`, async () => {
    const exportButton = ExportLocators.getExportDropdown(page);

    await exportButton.click();
    await expect.soft(ExportLocators.getExportOptions(page)).toHaveCount(fileNames.length);
    // close the dropdown
    await exportButton.click();
  });

  await test.step('should have "This record (CSV)" as a download option and download the file.', async () => {
    await ExportLocators.getExportDropdown(page).click();

    const csvOption = ExportLocators.getExportOption(page, 'This record (CSV)');
    await expect.soft(csvOption).toHaveText('This record (CSV)');

    await clickAndVerifyDownload(csvOption, fileNames[0]);
  });

  await test.step('should have "BDBag" as a download option and download the file.', async () => {
    test.skip(!!process.env.CI, 'in CI the export server component is not configured and cannot be tested');

    await ExportLocators.getExportDropdown(page).click();

    const bagOption = ExportLocators.getExportOption(page, 'BDBag');
    await expect.soft(bagOption).toHaveText('BDBag');

    await clickAndVerifyDownload(bagOption, fileNames[1], async () => {
      const modal = ModalLocators.getExportModal(page)
      await expect.soft(modal).toBeVisible();
      await expect.soft(modal).not.toBeAttached();
    });
  });

  // NOTE: this is very specific to the test done in record/presentation.spec.ts
  if (fileNames.length > 2) {
    await test.step('should have "Configurations" option that opens a submenu to download the config file.', async () => {
      test.skip(!!process.env.CI, 'in CI the export server component is not configured and cannot be tested');

      await ExportLocators.getExportDropdown(page).click();

      const configOption = ExportLocators.getExportOption(page, 'configurations');
      await expect.soft(configOption).toHaveText('Configurations');

      await configOption.click();

      await expect.soft(ExportLocators.getExportSubmenuOptions(page)).toHaveCount(1);

      const bdBagSubmenu = ExportLocators.getExportSubmenuOption(page, 'BDBag');
      await expect.soft(bdBagSubmenu).toBeVisible();

      await clickAndVerifyDownload(bdBagSubmenu, fileNames[2]); // use the last filename since it is the suggested filename

      /**
       * hover over to make the dropdown menu tooltip OverlayTrigger trigger so it will hide when another tooltip is shown in a later test

       *
       * NOTE: this is only an issue when `NODE_ENV="development"` since we are adding "focus" event for tooltips
       *   this has no harm if the tooltip is not showing (node environment is production)
       *   see /src/components/tooltip.tsx for more info
       */
      await ExportLocators.getExportDropdown(page).hover();
    });
  }
}
