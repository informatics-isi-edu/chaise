import { Page, test } from '@playwright/test';

/**
 * go to login page and set the page context.
 * set `storagePath` to '' if you want to skip changing storage
 */
export const performLogin = async (cookie: any, storagePath: string, page: Page) => {
  await page.goto(`${process.env.CHAISE_BASE_URL}/login/`);

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

