import { test, expect, Page } from '@playwright/test';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import ExportLocators from '@isrd-isi-edu/chaise/test/e2e/locators/export';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';

import { getCatalogID, updateCatalogAnnotation } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { performLogin, removeAuthCookieAndReload } from '@isrd-isi-edu/chaise/test/e2e/utils/user-utils';

export const runStaticACLTests = () => {

  test('anonymous user should be shown login modal when viewing recoredit app', async ({ page, baseURL }, testInfo) => {
    await page.goto(`${baseURL}/recordedit/#${getCatalogID(testInfo.project.name)}/multi-permissions:static_acl_table/id=1`);
    await removeAuthCookieAndReload(page);

    const modal = ModalLocators.getLoginModal(page);
    await expect(modal).toBeVisible();
    await expect(ModalLocators.getModalTitle(modal)).toHaveText('You need to be logged in to continue.');
  });

  test.describe('shareCite.acls support', () => {
    test('using only `show` should show and enable the button', async ({ page, baseURL }, testInfo) => {
      const catalogId = getCatalogID(testInfo.project.name);
      await updateCatalogAnnotation(catalogId, {
        'tag:isrd.isi.edu,2019:chaise-config': { 'shareCite': { 'acls': { 'show': ['*'] } } }
      });
      await gotToRecordPageAndCheckShareBtn(page, baseURL, catalogId, true, true);
    });

    test('using only `enable` should show and enable the button', async ({ page, baseURL }, testInfo) => {
      const catalogId = getCatalogID(testInfo.project.name);
      await updateCatalogAnnotation(catalogId, {
        'tag:isrd.isi.edu,2019:chaise-config': { 'shareCite': { 'acls': { 'show': ['*'] } } }
      });
      await gotToRecordPageAndCheckShareBtn(page, baseURL, catalogId, true, true);
    });

    test.describe('defining show and enable', () => {
      test.beforeAll(async ({ }, testInfo) => {
        const catalogId = getCatalogID(testInfo.project.name);
        await updateCatalogAnnotation(catalogId, {
          'tag:isrd.isi.edu,2019:chaise-config': {
            'shareCite': {
              'acls': {
                // both main and restricted user can see it
                'show': [process.env.AUTH_COOKIE_ID, process.env.RESTRICTED_AUTH_COOKIE_ID],
                // only enabled for the main user
                'enable': [process.env.AUTH_COOKIE_ID]
              }
            }
          }
        });
      });

      test('should be enabled for the main user based on the chaise-config property', async ({ page, baseURL }, testInfo) => {
        // main user should be able to see and click
        await gotToRecordPageAndCheckShareBtn(page, baseURL, getCatalogID(testInfo.project.name), true, true);
      });

      test('should be disabled for the restricted user based on the chaise-config property', async ({ page, baseURL }, testInfo) => {
        await performLogin(process.env.RESTRICTED_AUTH_COOKIE, '', page);

        // should be disabled for restricted user
        await gotToRecordPageAndCheckShareBtn(page, baseURL, getCatalogID(testInfo.project.name), true, false);
      });

      test('should be hidden for anonymous user based on the chaise-config property', async ({ page, baseURL }, testInfo) => {
        const catalogId = getCatalogID(testInfo.project.name);
        await page.goto(`${baseURL}/record/#${catalogId}/multi-permissions:static_acl_table/id=1`);
        await removeAuthCookieAndReload(page);

        // anonymous user should not even see it
        await gotToRecordPageAndCheckShareBtn(page, baseURL, catalogId, false, false);
      });

      test.afterAll(async ({ }, testInfo) => {
        const catalogId = getCatalogID(testInfo.project.name);
        await updateCatalogAnnotation(catalogId, {});
      });
    });
  });

  test.describe('exportConfigsSubmenu support', () => {
    test('using only `show` should show and enable the button', async ({ page, baseURL }, testInfo) => {
      const catalogId = getCatalogID(testInfo.project.name);
      await updateCatalogAnnotation(catalogId, {
        'tag:isrd.isi.edu,2019:chaise-config': { 'exportConfigsSubmenu': { 'acls': { 'show': ['*'] } } }
      });
      await goToRecordPageAndCheckExportConfigsBtn(page, baseURL, catalogId, true, true);
    });

    test('using only `enable` should show and enable the button', async ({ page, baseURL }, testInfo) => {
      const catalogId = getCatalogID(testInfo.project.name);
      await updateCatalogAnnotation(catalogId, {
        'tag:isrd.isi.edu,2019:chaise-config': { 'exportConfigsSubmenu': { 'acls': { 'show': ['*'] } } }
      });
      await goToRecordPageAndCheckExportConfigsBtn(page, baseURL, catalogId, true, true);
    });

    test.describe('defining show and enable', () => {
      test.beforeAll(async ({ }, testInfo) => {
        const catalogId = getCatalogID(testInfo.project.name);
        await updateCatalogAnnotation(catalogId, {
          'tag:isrd.isi.edu,2019:chaise-config': {
            'exportConfigsSubmenu': {
              'acls': {
                // both main and restricted user can see it
                'show': [process.env.AUTH_COOKIE_ID, process.env.RESTRICTED_AUTH_COOKIE_ID],
                // only enabled for the main user
                'enable': [process.env.AUTH_COOKIE_ID]
              }
            }
          }
        });
      });

      test('should be enabled for the main user based on the chaise-config property', async ({ page, baseURL }, testInfo) => {
        // main user should be able to see and click
        await goToRecordPageAndCheckExportConfigsBtn(page, baseURL, getCatalogID(testInfo.project.name), true, true);
      });

      test('should be disabled for the restricted user based on the chaise-config property', async ({ page, baseURL }, testInfo) => {
        await performLogin(process.env.RESTRICTED_AUTH_COOKIE, '', page);

        // should be disabled for restricted user
        await goToRecordPageAndCheckExportConfigsBtn(page, baseURL, getCatalogID(testInfo.project.name), true, false);
      });

      test('should be hidden for anonymous user based on the chaise-config property', async ({ page, baseURL }, testInfo) => {
        const catalogId = getCatalogID(testInfo.project.name);
        await page.goto(`${baseURL}/record/#${catalogId}/multi-permissions:static_acl_table/id=1`);
        await removeAuthCookieAndReload(page);

        // anonymous user should not even see it
        await goToRecordPageAndCheckExportConfigsBtn(page, baseURL, catalogId, false, false);
      });

      test.afterAll(async ({ }, testInfo) => {
        const catalogId = getCatalogID(testInfo.project.name);
        await updateCatalogAnnotation(catalogId, {});
      });
    });
  });

  // TODO more static acl tests should be added
};



/********************** helper functions ************************/

const gotToRecordPageAndCheckShareBtn = async (
  page: Page, baseURL: string | undefined, catalogId: string, isPresent: boolean, isEnabled: boolean
) => {
  await page.goto(`${baseURL}/record/#${catalogId}/multi-permissions:static_acl_table/id=1`);
  await RecordLocators.waitForRecordPageReady(page);

  const btn = RecordLocators.getShareButton(page);
  if (!isPresent) {
    await expect(btn).not.toBeAttached();
    return;
  }

  await expect(btn).toBeAttached();
  if (isEnabled) {
    await expect(btn).not.toBeDisabled();
  } else {
    await expect(btn).toBeDisabled();
  }
};

const goToRecordPageAndCheckExportConfigsBtn = async (
  page: Page, baseURL: string | undefined, catalogId: string, isPresent: boolean, isEnabled: boolean
) => {
  await page.goto(`${baseURL}/record/#${catalogId}/multi-permissions:static_acl_table/id=1`);
  await RecordLocators.waitForRecordPageReady(page);

  await ExportLocators.getExportDropdown(page).click();

  const configOption = ExportLocators.getExportOption(page, 'configurations');
  if (!isPresent) {
    await expect(configOption).not.toBeAttached();
    return;
  }

  await expect(configOption).toBeAttached();
  if (isEnabled) {
    await configOption.click();
    await expect(ExportLocators.getExportSubmenuOptions(page)).toHaveCount(1);
  } else {
    await expect(configOption).toHaveClass(/disable-link/);
  }
};


