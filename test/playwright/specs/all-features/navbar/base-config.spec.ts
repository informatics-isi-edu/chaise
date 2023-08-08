import { test, expect } from '@playwright/test';

test.describe('Navbar', () => {

  test('basic features,', async ({ page }) => {
    const navbar = page.locator('#mainnav');

    await test.step('navbar should be visible on load.', async () => {
      await page.goto('https://dev.isrd.isi.edu/~ashafaei/chaise/recordset/#1/isa:dataset');

      await navbar.waitFor({ state: 'visible' });
    })

    await test.step('navbar should have the proper brand text and logo', async () => {
      // await expect.soft(page.locator('#brand-text').textContent()).toEqual('chaise');

      await expect.soft(page.locator('#brand-image')).toHaveAttribute('src', '../images/genetic-data.png');
    });


    await test.step('tab title should be correct', async () => {
      page.title().then((t) => {
        expect.soft(t).toContain('this one should be ignored in favor of navbarBrandText');
      }).catch((err) => {
        expect.soft(false, 'page title returned an error').toBeTruthy;
      });
    });
  });


  test.describe('rest of features', () => {
    test('feature 1', () => {
      expect(false).toBeFalsy();
    });

    test('feature 2', () => {
      expect(true).toBeTruthy();
    });
  });

  test.describe('rest of rest of features', () => {
    test('feature 1 1', () => {
      expect(false).toBeFalsy();
    });

    test('feature 2 2', () => {
      expect(true).toBeTruthy();
    });
  });

})
