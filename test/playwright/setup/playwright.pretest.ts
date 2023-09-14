import { test } from '@playwright/test';
import { performLogin } from '@isrd-isi-edu/chaise/test/playwright/utils/user-utils';

test.describe('Login user', () => {
  performLogin(process.env.AUTH_COOKIE);
});
