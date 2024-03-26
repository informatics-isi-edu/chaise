import { test } from '@playwright/test';

// utils
import { performLogin } from '@isrd-isi-edu/chaise/test/playwright/utils/user-utils';
import { MAIN_USER_STORAGE_STATE, RESTRICTED_USER_STORAGE_STATE } from '@isrd-isi-edu/chaise/test/playwright/utils/constants';

test('login and create a session for the main user', async ({ page }) => {
  await performLogin(process.env.AUTH_COOKIE, MAIN_USER_STORAGE_STATE, page);
});

test('login and create a session for the second user', async ({ page }) => {
  await performLogin(process.env.RESTRICTED_AUTH_COOKIE, RESTRICTED_USER_STORAGE_STATE, page);
});
