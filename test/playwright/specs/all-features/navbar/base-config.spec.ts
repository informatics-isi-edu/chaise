import { test, expect } from '@playwright/test';
import NavbarLocators from '@isrd-isi-edu/chaise/test/playwright/locators/navbar';
import { getMainUserSessionObject } from '@isrd-isi-edu/chaise/test/playwright/utils/user-utils';

test.describe('Navbar', () => {

  test('basic features,', async ({ page, baseURL }) => {
    const navbar = page.locator('#mainnav');

    await test.step('navbar should be visible on load.', async () => {
      await page.goto(`${baseURL}/recordset/#${process.env.CATALOG_ID!}/isa:dataset`);

      await navbar.waitFor({ state: 'visible' });
    })

    await test.step('navbar should have the proper brand text and logo', async () => {
      await expect.soft(NavbarLocators.getBrandImage(page)).toHaveAttribute('src', '../images/genetic-data.png');
    });

    await test.step('should show the "Full Name" of the logged in user in the top right', async () => {
      const session = getMainUserSessionObject();
      if (session.client) {
        const client = session.client;
        const name = (!process.env.CI ? client.full_name : client.display_name);
        await expect.soft(NavbarLocators.getUsername(page)).toHaveText(name);
      }
    });

    await test.step('tab title should be correct', async () => {
      await page.waitForLoadState();
      const title = await page.title();
      expect.soft(title).toContain('this one should be ignored in favor of navbarBrandText');
    });
  });
});

