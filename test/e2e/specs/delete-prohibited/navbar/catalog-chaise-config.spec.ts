import { test, expect } from '@playwright/test';

import NavbarLocators from '@isrd-isi-edu/chaise/test/e2e/locators/navbar';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { clickNewTabLink } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

test.describe('Navbar', () => {

  test('when navbar is visible', async ({ page, baseURL }, testInfo) => {
    const navbar = NavbarLocators.getContainer(page);
    const loginMenuOption = NavbarLocators.getLoginMenuContainer(page);

    await test.step('navbar should be visible on load.', async () => {
      const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/catalog-config-navbar:config-table`;
      await page.goto(`${baseURL}${PAGE_URL}`);
      await navbar.waitFor({ state: 'visible' });
    });

    await test.step('should display the right title from catalog annotation chaiseConfig.', async () => {
      await expect.soft(NavbarLocators.getBrandText(page)).toHaveText('override test123');
    });

    await test.step('should not display a brand image/logo', async () => {
      const brandImage = NavbarLocators.getBrandImage(page)
      await expect.soft(brandImage).toBeVisible();
      await expect.soft(brandImage).toHaveAttribute('src', '../images/logo.png');
    });

    await test.step('should show a banner on top of the navbar', async () => {
      const banner = NavbarLocators.getBannerContent('', page);
      await expect.soft(banner).toBeVisible();
      await expect.soft(banner).toHaveText('This is a banner with link');
    });

    await test.step('should show a link for the login information since chaiseConfig.loggedInMenu is an object', async () => {
      await expect.soft(loginMenuOption).toHaveText('Outbound Profile Link')
    });

    if (!process.env.CI) {
      await test.step('should open a new tab when clicking the link for the login information', async () => {
        const newPage = await clickNewTabLink(loginMenuOption);

        await newPage.close();
      });
    }
  });

  test('should hide the navbar bar if the hideNavbar query parameter is set to true', async ({ page, baseURL }, testInfo) => {
    const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/catalog-config-navbar:config-table`;
    await page.goto(`${baseURL}${PAGE_URL}?hideNavbar=true`);

    await RecordsetLocators.waitForRecordsetPageReady(page);

    await expect.soft(NavbarLocators.getContainer(page)).not.toBeAttached();
  });

});
