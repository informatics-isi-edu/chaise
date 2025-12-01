import { Page, expect } from '@playwright/test';

import PageLocators from '@isrd-isi-edu/chaise/test/e2e/locators/page';

/**
 * go to login page and set the page context.
 * set `storagePath` to '' if you want to skip changing storage
 */
export const performLogin = async (page: Page, cookie: any, storagePath: string, testAppLoad?: boolean) => {
  await page.goto(`${process.env.CHAISE_BASE_URL}/login/`);

  if (testAppLoad) {
    // the fact that element is there, it means that the app didn't fail to load
    await expect(PageLocators.getLoginAppEmptyContainer(page)).toBeAttached();
  }

  // add the localStorage so it doesn't show the warining.
  await page.evaluate(({ usedCookie, isCI }) => {

    document.cookie = `${usedCookie};path=/;${!isCI ? 'secure;' : ''}`;
    window.localStorage.setItem('session', '{"previousSession":true}');
  }, { usedCookie: cookie, isCI: process.env.CI })

  if (storagePath !== '') {
    await page.context().storageState({ path: storagePath });
  }
}

/**
 * useful for testsing anonymous access
 */
export const removeAuthCookieAndReload = async (page: Page) => {
  await page.evaluate(({ isCI }) => {
    document.cookie = `webauthn=;path=/;${!isCI ? 'secure;' : ''}`;
  }, { isCI: process.env.CI })
  await page.reload();
}

/**
 * return the session object for the main user (catalog owner).
 * (populated during setup)
 */
export const getMainUserSessionObject = () => {
  return JSON.parse(process.env.WEBAUTHN_SESSION!);
}

