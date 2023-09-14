import { test, expect } from '@playwright/test';

test.describe('Navbar', () => {

  test('basic features,', async ({ page, baseURL }) => {
    const navbar = page.locator('#mainnav');

    await test.step('navbar should be visible on load.', async () => {
      await page.goto(`${baseURL}/recordset/#${process.env.CATALOG_ID!}/isa:dataset`);

      await navbar.waitFor({ state: 'visible' });
    })

    await test.step('navbar should have the proper brand text and logo', async () => {
      // await expect.soft(page.locator('#brand-text').textContent()).toEqual('chaise');

      await expect.soft(page.locator('#brand-image')).toHaveAttribute('src', '../images/genetic-data.png');
    });

    await test.step('should show the "Full Name" of the logged in user in the top right', async () => {
      const client = JSON.parse(process.env.WEBAUTHN_SESSION!).client;
      const name = (!process.env.CI ? client.full_name : client.display_name);
      await expect.soft(page.locator('.username-display')).toHaveText(name);
    });


    await test.step('tab title should be correct', async () => {
      page.title().then((t) => {
        expect.soft(t).toContain('this one should be ignored in favor of navbarBrandText');
      }).catch((err) => {
        expect.soft(false, 'page title returned an error').toBeTruthy;
      });
    });
  });
});

