import { test, expect, Locator } from '@playwright/test';
import NavbarLocators from '@isrd-isi-edu/chaise/test/playwright/locators/navbar';
import PageLocators from '@isrd-isi-edu/chaise/test/playwright/locators/page';

test.describe('Navbar', () => {
  const PAGE_URL = `/recordset/#${process.env.CATALOG_ID!}/product-navbar:accommodation`;

  test.beforeEach(async ({ browser, baseURL }) => {
    PageLocators.navigate(`${baseURL}${PAGE_URL}`, browser);
  })

  test('basic features,', async ({ page, baseURL, browser }) => {
    const navbar = page.locator('#mainnav');

    await test.step('navbar should be visible on load.', async () => {

      await navbar.waitFor({ state: 'visible' });
    });

    await test.step('should display the right title from chaiseConfig.', async () => {
      // default heuristics
      await expect.soft(NavbarLocators.getTitle(page).textContent()).toEqual('Chaise');
    });

    await test.step('should include the headTitle from chaiseConfig in the tab title (head > title)', async () => {
      await expect(page).toHaveTitle('show me on the navbar!');
    });

    await test.step('should not display a brand image/logo', function () {
      expect(NavbarLocators.getBrandImage(page)).toHaveCount(0);
    });
  });

  test('banner support,', async ({ page, baseURL, browser }) => {

    test.beforeEach(() => {
      console.log('running before each');
      PageLocators.navigate(`${baseURL}${PAGE_URL}`, browser);
    })

    let banner1 : Locator, banner2 : Locator, banner3 : Locator, banner4 : Locator,
      banner1Dismiss : Locator, banner2Dismiss : Locator, banner4Dismiss : Locator;

    test.beforeAll(function () {
      console.log('running before all')
      PageLocators.navigate(`${baseURL}${PAGE_URL}`, browser);

      banner1 = NavbarLocators.getBanner('banner-1-custom-key', page);
      banner1Dismiss = NavbarLocators.getBannerDismissBtn('banner-1-custom-key', page);

      banner2 = NavbarLocators.getBanner('banner-2-custom-key', page);
      banner2Dismiss = NavbarLocators.getBannerDismissBtn('banner-2-custom-key', page);

      banner3 = NavbarLocators.getBanner('banner-3-custom-key', page);

      banner4 = NavbarLocators.getBanner('banner-4-custom-key', page);
      banner4Dismiss = NavbarLocators.getBannerDismissBtn('banner-4-custom-key', page);
    });

    test.step('should hide banner based on given acls.', () => {
      expect(banner3).toHaveCount(0);
    });


  })
});

