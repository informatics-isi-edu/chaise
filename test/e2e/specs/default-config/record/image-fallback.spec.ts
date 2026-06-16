import { test, expect } from '@playwright/test';

import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';

import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

test.describe.configure({ mode: 'parallel' });

const APPLIED_CLASS = 'chaise-image-fallback-applied';

// keep in sync with errorMessages.imageFallback in src/utils/constants.ts
// (can't import from src/ here since it assumes a browser environment)
const FALLBACK_MESSAGES = {
  unauthorized: 'Login is required to view this image.',
  forbidden: 'You do not have permission to view this image.',
  notFound: 'This image could not be found.',
  unknownError: 'This image could not be loaded.',
};

/**
 * each markdown column renders one <img> that fails to load. we intercept the image
 * GET (so onerror fires) and the follow-up HEAD (so chaise can classify the failure).
 * `head` is the status returned for the HEAD; `expectTitle` is the resulting tooltip.
 */
const cases: { col: string; pattern: string; head?: number; expectTitle?: string }[] = [
  {
    col: 'col_unauthorized',
    pattern: '**/image-fallback/unauthorized.png',
    head: 401,
    expectTitle: FALLBACK_MESSAGES.unauthorized,
  },
  {
    col: 'col_forbidden',
    pattern: '**/image-fallback/forbidden.png',
    head: 403,
    expectTitle: FALLBACK_MESSAGES.forbidden,
  },
  {
    col: 'col_not_found',
    pattern: '**/image-fallback/not-found.png',
    head: 404,
    expectTitle: FALLBACK_MESSAGES.notFound,
  },
  // HEAD succeeds but the image still failed to render -> generic fallback
  {
    col: 'col_generic',
    pattern: '**/image-fallback/generic.png',
    head: 200,
    expectTitle: FALLBACK_MESSAGES.unknownError,
  },
  // opt-out: the image carries chaise-image-fallback-disabled, so no HEAD and no swap
  { col: 'col_disabled', pattern: '**/image-fallback/disabled.png' },
];

test.describe('broken-image fallback,', () => {
  test('shows the right fallback per failure type and honors the opt-out class', async ({
    page,
    baseURL,
  }, testInfo) => {
    // intercept each failing image. GET -> abort (fail the image); HEAD -> return the
    // mocked status so chaise classifies it. col_real_404 is intentionally NOT routed
    // so it hits a real same-origin 404 from the server (the real-404 smoke).
    for (const c of cases) {
      await page.route(c.pattern, (route, request) => {
        if (request.method() === 'HEAD' && typeof c.head === 'number') {
          return route.fulfill({ status: c.head });
        }
        return route.abort();
      });
    }

    await page.goto(
      generateChaiseURL(
        APP_NAMES.RECORD,
        'image-fallback',
        'image-fallback-table',
        testInfo,
        baseURL
      ) + '/id=1'
    );
    await RecordLocators.waitForRecordPageReady(page);

    await test.step('classifies each failure and shows the matching fallback + tooltip', async () => {
      for (const c of cases) {
        if (!c.expectTitle) continue;
        const img = page.locator(`#row-${c.col} img`);
        await expect(img).toHaveClass(new RegExp(APPLIED_CLASS));
        await expect(img).toHaveAttribute('title', c.expectTitle);
      }
    });

    await test.step('keeps the original url in data-original-src', async () => {
      const img = page.locator('#row-col_unauthorized img');
      await expect(img).toHaveAttribute(
        'data-original-src',
        /\/image-fallback\/unauthorized\.png$/
      );
    });

    await test.step('a real same-origin 404 (no mock) shows the not-found fallback', async () => {
      const img = page.locator('#row-col_real_404 img');
      await expect(img).toHaveClass(new RegExp(APPLIED_CLASS));
      await expect(img).toHaveAttribute('title', FALLBACK_MESSAGES.notFound);
    });

    await test.step('the chaise-image-fallback-disabled class skips the fallback entirely', async () => {
      // a control image being handled proves the error pass ran for the page...
      await expect(page.locator('#row-col_generic img')).toHaveClass(new RegExp(APPLIED_CLASS));
      // ...so the opt-out image should still be untouched (native broken image).
      const disabled = page.locator('#row-col_disabled img');
      await expect(disabled).not.toHaveClass(new RegExp(APPLIED_CLASS));
      await expect(disabled).not.toHaveAttribute('title', /.+/);
    });
  });
});
