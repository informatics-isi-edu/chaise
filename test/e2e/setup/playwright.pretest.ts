import { test } from '@playwright/test';

// utils
import { performLogin } from '@isrd-isi-edu/chaise/test/e2e/utils/user-utils';
import { MAIN_USER_STORAGE_STATE, RESTRICTED_USER_STORAGE_STATE } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';

test('login and create a session for the main user', async ({ page, browser, browserName }) => {
  console.log(`browser information: ${browserName} ${browser.version()}`);

  await performLogin(process.env.AUTH_COOKIE, MAIN_USER_STORAGE_STATE, page);
});

test('login and create a session for the second user', async ({ page }) => {
  await performLogin(process.env.RESTRICTED_AUTH_COOKIE, RESTRICTED_USER_STORAGE_STATE, page);
});
