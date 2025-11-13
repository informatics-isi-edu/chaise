import { test, expect } from '@playwright/test';

// locators
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import NavbarLocators from '@isrd-isi-edu/chaise/test/e2e/locators/navbar';
import PageLocators from '@isrd-isi-edu/chaise/test/e2e/locators/page';


// utils
import { getMainUserSessionObject } from '@isrd-isi-edu/chaise/test/e2e/utils/user-utils';
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import { clickNewTabLink } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

test.describe('Navbar', () => {
  test.describe.configure({ mode: 'parallel' });

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    await page.goto(generateChaiseURL(APP_NAMES.RECORDSET, 'product-navbar', 'accommodation', testInfo, baseURL));
  });

  test('basic features', async ({ page }) => {
    const navbar = NavbarLocators.getContainer(page);

    await test.step('navbar should be visible on load.', async () => {
      await expect.soft(navbar).toBeVisible();
    });

    await test.step('should display the right title from chaiseConfig.', async () => {
      // default heuristics
      await expect.soft(NavbarLocators.getBrandText(page)).toHaveText('Chaise');
      await expect.soft(NavbarLocators.getBrandLink(page)).toHaveAttribute('href', '/');
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
      /**
       * this used to use newPage.waitForURL() but for some reason it wasn't working properly on CI, so I rewrote it this way.
       */
      await newPage.waitForLoadState('domcontentloaded');
      expect.soft(newPage.url()).toContain(`/chaise/recordset/#${getCatalogID(testInfo.project.name)}/isa:dataset`)
      await newPage.close();
    });
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
      await expect.soft(loginMenu).toBeVisible();
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

  test('go to snapshot', async ({ page }) => {
    const navbar = NavbarLocators.getContainer(page);
    const navbarBtn = NavbarLocators.getGoToSnapshotNavbarButton(page);
    const formElements = NavbarLocators.goTOSnapshotFormElements(page);
    const labelElements = NavbarLocators.getGoToSnapshotOrLiveToggleElements(page);
    const versionInfo = PageLocators.getVersionInfoElements(page);

    await test.step('snapshot dropdown should be present', async () => {
      await expect.soft(navbar).toBeVisible();
      await expect.soft(navbarBtn).toBeVisible();
    });

    await test.step('clicking on snapshot dropdown should open the snapshot form', async () => {
      await navbarBtn.click();
      await expect.soft(formElements.form).toBeVisible();

      await expect.soft(labelElements.label).toHaveText('Show snapshot from:');
      // await expect.soft(labelElements.toggle).not.toBeAttached();
    });

    await test.step('clicking on now and apply should go to a versioned link.', async () => {
      await formElements.nowBtn.click();
      await formElements.applyBtn.click();

      const alert = AlertLocators.getWarningAlert(page);

      await page.waitForURL('**/recordset/**');
      await expect.soft(alert).toBeVisible();
      await expect.soft(alert).toContainText('Displaying the nearest available snapshot');
      await expect.soft(alert).toContainText('to the requested time of ');
    });

    await test.step('version info should be visible and should be able to go back to live version', async () => {
      await expect.soft(versionInfo.container).toBeVisible();
      await expect.soft(versionInfo.liveBtn).toBeVisible();
      await versionInfo.liveBtn.click();

      await page.waitForURL('**/recordset/**');
      await expect.soft(versionInfo.container).not.toBeVisible();

    });
  });
});

