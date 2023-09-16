import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.configuration';

/**
 * go to login page and set the page context.
 * it will store the browser context in `STORAGE_STATE` location.
 */
export const performLogin = (cookie: any) => {
  test('Login user', async ({ page }) => {

    await page.goto(`${process.env.CHAISE_BASE_URL}/login/`);

    // add the localStorage so it doesn't show the warining.
    await page.evaluate(({ usedCookie, isCI }) => {

      document.cookie = `${usedCookie};path=/;${!isCI ? 'secure;' : ''}`;
      window.localStorage.setItem('session', '{"previousSession":true}');
    }, { usedCookie: cookie, isCI: process.env.CI })


    await page.context().storageState({ path: STORAGE_STATE });
  });

}

/**
 * return the session object for the main user (catalog owner).
 */
export const getMainUserSessionObject = () => {
  const session =  JSON.parse(process.env.WEBAUTHN_SESSION!);
  expect.soft(session.client).toBeTruthy();
  return session;
}
