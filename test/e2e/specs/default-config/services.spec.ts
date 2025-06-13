import { test, expect } from '@playwright/test';
import { ERMREST_URL } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';

/**
 * this spec can be used to see if the backend services are running or not.
 */
test.describe('backend services', () => {
  test.describe.configure({ mode: 'parallel' });

  test('ermresolve should work', async ({ page }) => {
    const response = await page.request.get(ERMREST_URL!.replace('ermrest', 'id/test'));
    expect(response.status()).toBe(400);
    expect(await response.text()).toContain('Request malformed. Detail: Key "test" is not a recognized ID format.');
  });

  test('export should work', async ({page}) => {
    const url = ERMREST_URL!.replace('ermrest', 'deriva/export/bdbag');
    const response = await page.request.get(url);
    expect(response.status()).toBe(405);
    expect(await response.text()).toContain('The method is not allowed for the requested URL.');
  });


})
