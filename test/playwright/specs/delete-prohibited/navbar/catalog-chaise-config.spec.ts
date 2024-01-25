import { test, expect } from '@playwright/test';

// locators
import NavbarLocators from '@isrd-isi-edu/chaise/test/playwright/locators/navbar';
import PageLocators from '@isrd-isi-edu/chaise/test/playwright/locators/page';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/playwright/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.parameters';

test.describe('Navbar', () => {

  test('when navbar is visible', async ({ page, baseURL, context }, testInfo) => {
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
        const newPage = await PageLocators.clickNewTabLink(loginMenuOption, context);

        await newPage.close();
      });
    }
  });

  test('should hide the navbar bar if the hideNavbar query parameter is set to true', async ({ page, baseURL }, testInfo) => {
    const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/catalog-config-navbar:config-table`;
    await page.goto(`${baseURL}${PAGE_URL}?hideNavbar=true`);

    await RecordsetLocators.waitForRecordsetPageReady(page);

    await expect(NavbarLocators.getContainer(page)).not.toBeAttached();
  });

});