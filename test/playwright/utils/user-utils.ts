import { Page, test } from '@playwright/test';

/**
 * go to login page and set the page context.
 */
export const performLogin = async (cookie: any, storagePath: string, page: Page) => {
  await page.goto(`${process.env.CHAISE_BASE_URL}/login/`);

  // add the localStorage so it doesn't show the warining.
  await page.evaluate(({ usedCookie, isCI }) => {

    document.cookie = `${usedCookie};path=/;${!isCI ? 'secure;' : ''}`;
    window.localStorage.setItem('session', '{"previousSession":true}');
  }, { usedCookie: cookie, isCI: process.env.CI })


  await page.context().storageState({ path: storagePath });
}
