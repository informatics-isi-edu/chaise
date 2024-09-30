import { test, expect } from '@playwright/test';

// locators
import PageLocators from '@isrd-isi-edu/chaise/test/e2e/locators/page';

// utils
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const appName = [APP_NAMES.RECORDEDIT, APP_NAMES.RECORDSET];
test.describe('Page Footer', () => {
  appName.forEach((name: APP_NAMES) => {

    test.beforeEach(async ({ page, baseURL }, testInfo) => {
      await page.goto(generateChaiseURL(name, 'product', 'accommodation', testInfo, baseURL));
    });

    test('Checking footer in ' + name + ' page:', async ({ page }) => {
      const footerMain = PageLocators.getFooterContainer(page);
      const footerLink = PageLocators.getFooterLink(page);

      await test.step('footer should be visible on load', async () => {
        await expect.soft(footerMain).toBeVisible();
      });

      await test.step('Page footer link should be visible', async () => {
        await expect.soft(footerLink).toBeVisible();
      })

      await test.step('Page footer link should match with "privacy-policy"', async () => {
        await expect.soft(footerLink).toHaveAttribute('href', /privacy-policy/);
      })

    });
  });
});
