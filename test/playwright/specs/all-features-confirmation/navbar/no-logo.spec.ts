import { test, expect } from '@playwright/test';

// locators
import NavbarLocators from '@isrd-isi-edu/chaise/test/playwright/locators/navbar';
import { clickNewTabLink } from '@isrd-isi-edu/chaise/test/playwright/utils/page-utils';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/playwright/utils/catalog-utils';
import { getMainUserSessionObject } from '@isrd-isi-edu/chaise/test/playwright/utils/user-utils';

test.describe('Navbar', () => {

  test.beforeEach(async ({ page, baseURL, browser, browserName }, testInfo) => {
    const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/product-navbar:accommodation`;
    await page.goto(`${baseURL}${PAGE_URL}`);

    console.log(`browser information: ${browserName} ${browser.version()}`);
  })

  test('basic features', async ({ page }) => {
    const navbar = NavbarLocators.getContainer(page);

    await test.step('navbar should be visible on load.', async () => {
      await navbar.waitFor({ state: 'visible' });
    });

    await test.step('should display the right title from chaiseConfig.', async () => {
      // default heuristics
      await expect.soft(NavbarLocators.getBrandText(page)).toHaveText('Chaise');
    });

    await test.step('should include the headTitle from chaiseConfig in the tab title (head > title)', async () => {
      // from chaise-config.js
      await expect.soft(page).toHaveTitle('Accommodations | show me on the navbar!');
    });

    await test.step('should not display a brand image/logo', async () => {
      await expect.soft(NavbarLocators.getBrandImage(page)).toHaveCount(0);
    });
  });

  test('banner support', async ({ page }) => {
    const banner1 = NavbarLocators.getBannerContent('banner-1-custom-key', page);
    const banner1Dismiss = NavbarLocators.getBannerDismissBtn('banner-1-custom-key', page);

    const banner2 = NavbarLocators.getBannerContent('banner-2-custom-key', page);
    const banner2Dismiss = NavbarLocators.getBannerDismissBtn('banner-2-custom-key', page);

    const banner3 = NavbarLocators.getBannerContent('banner-3-custom-key', page);

    const banner4 = NavbarLocators.getBannerContent('banner-4-custom-key', page);
    const banner4Dismiss = NavbarLocators.getBannerDismissBtn('banner-4-custom-key', page);


    await test.step('should hide banner based on given acls.', async () => {
      await expect.soft(banner3).toHaveCount(0);
    });

    await test.step('should be able to show multiple banners', async () => {
      await expect.soft(banner1, 'banner 1 is missing').toBeVisible();
      await expect.soft(banner1, 'banner 1 content missmatch').toHaveText('banner 1');

      await expect.soft(banner2, 'banner 2 is missing').toBeVisible();
      await expect.soft(banner2, 'banner 2 content missmatch').toHaveText('banner 2');

      await expect.soft(banner4, 'banner 4 is missing').toBeVisible();
      await expect.soft(banner4, 'banner 4 content missmatch').toHaveText('banner 4');
    });

    await test.step('should show dismiss button based on the given configuration', async () => {
      await expect.soft(banner1Dismiss, 'banner 1 dismiss is missing').toBeVisible();
      await expect.soft(banner2Dismiss, 'banner 2 is displayed').toHaveCount(0);
      await expect.soft(banner4Dismiss, 'banner 4 dismiss is missing').toBeVisible();
    });

    await test.step('clicking on dismiss button should close the banner.', async () => {
      await banner1Dismiss.click();
      await expect.soft(banner1, 'banner 1 didnt close').toHaveCount(0);

      await banner4Dismiss.click();
      await expect.soft(banner4, 'banner 4 didnt close').toHaveCount(0);
    });
  });

  test('menu support', async ({ page }, testInfo) => {
    const menu = NavbarLocators.getMenu(page);

    await test.step('should generate the correct # of list items', async () => {
      // counted from chaise config doc rather than having code count
      await expect.soft(menu.locator('a')).toHaveCount(7);
    });

    // TODO why only local?
    if (!process.env.CI) {
      // Menu options: ['Search', 'RecordSets', 'Dataset', 'File', 'RecordEdit', 'Add Records', 'Edit Existing Record']
      await test.step('top level menu with no children should use default "newTab" value and navigate in a new tab', async () => {
        const searchOption = menu.locator('.chaise-nav-item').nth(0);

        await expect.soft(searchOption, 'first top level menu option text missmatch').toHaveText('Search');

        const newPage = await clickNewTabLink(searchOption);
        await newPage.waitForURL('**/chaise/search/#1/isa:dataset**');
        await newPage.close();
      });

      await test.step('first level nested link should inherit newTab value from parent and navigate in a new tab', async () => {
        const recordsetsMenu = menu.locator('.chaise-nav-item').nth(1);

        await expect.soft(recordsetsMenu.locator('.dropdown-toggle'), 'Second top level menu option text missmatch').toHaveText('RecordSets');

        // click the option
        await recordsetsMenu.click();

        const datasetOption = recordsetsMenu.locator('a').nth(1);

        await expect.soft(datasetOption, 'First 2nd level option for RecordSets missmatch').toHaveText('Dataset');

        // check that clicking opens the link
        const newPage = await clickNewTabLink(datasetOption);
        await newPage.waitForURL(`**/chaise/recordset/#${getCatalogID(testInfo.project.name)}/isa:dataset**`);
        await newPage.close();
      });
    }
  });

  test('login menu support', async ({ page }) => {
    const navbar = NavbarLocators.getContainer(page);
    const username = NavbarLocators.getUsername(page);
    const loginMenu = NavbarLocators.getLoginMenu(page);

    await test.step('should show the "Display Name" of the logged in user in the top right based on chaise-config property', async () => {
      const session = getMainUserSessionObject();
      expect.soft(session.client).toBeTruthy();
      await expect.soft(username).toHaveText(session.client.display_name);
    });

    await test.step('clicking on username should open the login dropdown menu.', async () => {
      await username.click();

      await loginMenu.waitFor({ state: 'visible' });
    })

    await test.step('should change the name of the "My Profile" and "Log Out" links', async () => {
      await expect.soft(NavbarLocators.getProfileLink(page), 'profile link shows wrong text').toHaveText('User Profile');
      await expect.soft(NavbarLocators.getLogoutLink(page), 'logout link shows wrong text').toHaveText('Logout');
    });

    await test.step('should have a disabled link named "Disabled Link"', async () => {
      // .dropdown-menu > * is needed as we can have multiple nested submenu
      // inside login dropdown (including div, a, etc). This selector will select all first level children under login dropdown
      await expect.soft(navbar.locator('.username-display > div.dropdown-menu > *'), 'wrong number of top level options').toHaveCount(4);

      await expect.soft(loginMenu.locator('a.disable-link').first(), 'disabled link text missmatch').toHaveText('Disabled Link');
    });

    await test.step('should generate the correct # of list items.', async () => {
      // counted from chaise config doc rather than having code count
      // 7 menu options defined in chaise-config
      // accounts for 2 broken menu options that are set as invalid
      await expect.soft(loginMenu.locator('a')).toHaveCount(5);
    });
  });
});

