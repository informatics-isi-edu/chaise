import { test, expect } from '@playwright/test';

// locators
import NavbarLocators from '@isrd-isi-edu/chaise/test/e2e/locators/navbar';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';

// utils
import { getMainUserSessionObject } from '@isrd-isi-edu/chaise/test/e2e/utils/user-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

test.describe('Navbar', () => {


  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    await page.goto(generateChaiseURL(APP_NAMES.RECORDSET, 'product-navbar', 'accommodation', testInfo, baseURL));
  })

  test('basic features,', async ({ page }) => {
    const navbar = NavbarLocators.getContainer(page);

    await test.step('navbar should be visible on load.', async () => {
      await expect.soft(navbar).toBeVisible();
    });

    await test.step('should display the right title from chaiseConfig', async () => {
      await expect.soft(NavbarLocators.getBrandText(page)).toHaveText('test123')
    });

    await test.step('should use the brand image/logo specified in chaiseConfig', async () => {
      await expect.soft(NavbarLocators.getBrandImage(page)).toHaveAttribute('src', '../images/genetic-data.png');
    });

    await test.step('should include the headTitle from chaiseConfig in the tab title (head > title)', async () => {
      const title = await page.title();
      /**
       * the expected value is misleading. we're only supposed to ignore this for the title which is tested above
       * but should be used as part of the page/tab title
       */
      expect.soft(title).toContain('this one should be ignored in favor of navbarBrandText');
    });
  });

  test('menu support', async ({ page }) => {
    const menu = NavbarLocators.getMenu(page);

    await test.step('for the menu, should generate the correct # of list items based on acls to show/hide specific options', async () => {
      /**
       * Count the number of nodes that are being shown (top level and submenus)
       * - Local: config has 14 but 1 is hidden by ACLs
       * - CI: config has 14 but 7 are hidden based on ACLs
       */
      await expect.soft(menu.locator('a')).toHaveCount(!process.env.CI ? 13 : 7);
    });

    await test.step('should prefer markdownName over name when both are defined', async () => {
      await expect.soft(menu.locator('.chaise-nav-item').nth(1).locator('.dropdown-toggle')).toHaveText('Test Recordsets');
    });

    await test.step('should render a markdown pattern using proper HTML', async () => {
      // in ci we don't have the same globus groups so the "show" ACL hides the 3rd link ("Records")
      const idx = (!process.env.CI ? 3 : 2);

      const html = await menu.locator('.chaise-nav-item').nth(idx).innerHTML();
      expect.soft(html).toContain('<strong>Recordedit</strong>');
    });

    if (!process.env.CI) {
      const editMenu = menu.locator('.chaise-nav-item').nth(3);
      const disabledSubMenuOptions = editMenu.locator('a.disable-link');

      await test.step('should have 4 top level dropdown menus', async () => {
        await expect.soft(menu.locator('.chaise-nav-item')).toHaveCount(4);
      });

      await test.step('should have a disabled "Records" links', async () => {
        const disabledEl = menu.locator('a.disable-link').nth(0);
        await expect.soft(disabledEl, 'text missmatch').toHaveText('Records');
      });

      await test.step('should have a header and a disabled "Edit Exisisting Record" submenu link (no children)', async () => {
        await editMenu.click();
        await expect.soft(editMenu.locator('.chaise-dropdown-header').first(), 'submenu header text missmatch').toHaveText('For Mutating Data');

        await expect.soft(disabledSubMenuOptions, 'wrong number of disabled options').toHaveCount(4);
        await expect.soft(disabledSubMenuOptions.nth(0), 'first disabled link text missmatch').toHaveText('Edit Existing Record');
      });

      await test.step('should have disabled "Edit Records" submenu link (has children)', async() => {
        //menu should still be open from previous test case
        await expect.soft(disabledSubMenuOptions.nth(1), 'second disabled link text missmatch').toHaveText('Edit Records');
      });

      await test.step('should have a "mailto:" link displayed properly', async () => {
        const links = editMenu.locator('.dropdown-menu a');
        await expect.soft(links, 'links length missmatch').toHaveCount(7);

        const el = links.nth(6);
        await expect.soft(el, 'help link title missmatch').toHaveText('Help with Editing');
        await expect.soft(el, 'mailto link missmatch').toHaveAttribute('href', 'mailto:support@isrd.isi.edu.test');
      });
    }
  });

  test('login menu', async ({ page }) => {
    const username = NavbarLocators.getUsername(page);
    const loginMenu = NavbarLocators.getLoginMenu(page);
    const profileLink = NavbarLocators.getProfileLink(page);
    const profileModal = ModalLocators.getProfileModal(page);

    await test.step('should show the "Full Name" of the logged in user in the top right', async () => {
      const session = getMainUserSessionObject();
      expect.soft(session.client).toBeTruthy();
      const name = !process.env.CI ? session.client.full_name : session.client.display_name;
      await expect.soft(username).toHaveText(name);
    });

    await test.step('clicking on username should open the login dropdown menu.', async () => {
      await username.click();
      await expect.soft(loginMenu).toBeVisible();

      await expect.soft(profileLink, 'profile link shows wrong text').toHaveText('My Profile');
      await expect.soft(NavbarLocators.getLogoutLink(page), 'logout link shows wrong text').toHaveText('Log Out');
    });

    await test.step('should open the profile card on click of My Profile link', async () => {
      await profileLink.click();

      await expect.soft(profileModal).toBeVisible();
    });

    await test.step('should close the profile card on click of X on the modal window', async () => {
      await ModalLocators.getCloseBtn(profileModal).click();

      await expect.soft(profileModal).not.toBeAttached();
    });
  });
});

