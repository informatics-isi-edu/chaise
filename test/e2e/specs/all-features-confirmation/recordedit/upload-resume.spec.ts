import { expect, Request, test } from '@playwright/test';
import moment from 'moment';

import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import { registerHatracNamespace } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import { testRecordMainSectionPartialValues } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';
import {
  createFiles,
  deleteFiles,
  getHatracChunkIndex,
  isHatracUploadJobRequest,
  RecordeditFile,
  setInputValue,
  waitForCreatedRows,
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';

const SCHEMA = 'product-add';
const TABLE = 'file';
const TIMESTAMP = `${moment().format('x')}-upload-resume`;
const NAMESPACE = `/hatrac/js/chaise/${TIMESTAMP}`;
const NUM_RECORD_COLUMNS = 4;
const UPLOAD_TIMEOUT = 120_000;

// two chunks (5 MB each), so the first one can be uploaded before the second one fails
const TEST_FILE: RecordeditFile = {
  name: 'testfile10MB_upload_resume.txt',
  size: '10240000',
  path: 'testfile10MB_upload_resume.txt',
};

test.describe('Recordedit upload resume', () => {
  test.beforeAll(async () => {
    await createFiles([TEST_FILE]);
    registerHatracNamespace(NAMESPACE);
  });

  test.afterAll(async () => {
    await deleteFiles([TEST_FILE]);
  });

  test('resumes an interrupted upload', async ({ page, baseURL }, testInfo) => {
    test.slow();

    const requestedChunks: number[] = [];
    const uploadJobRequests: Request[] = [];
    page.on('request', (request) => {
      if (isHatracUploadJobRequest(request)) uploadJobRequests.push(request);
    });

    const firstChunkFinished = page.waitForEvent('requestfinished', {
      predicate: (request) => getHatracChunkIndex(request) === 0,
      timeout: UPLOAD_TIMEOUT,
    });
    // only awaited when the second chunk is requested, so avoid an unhandled rejection if the test fails before that
    firstChunkFinished.catch(() => {});

    /*
     * fail the second chunk once, after the first one is uploaded.
     * 408 is not retried, and chaise keeps the upload job for it, so the upload can be resumed.
     */
    let failSecondChunk = true;
    await page.route('**/hatrac/**', async (route) => {
      const index = getHatracChunkIndex(route.request());
      if (index !== null) requestedChunks.push(index);

      if (index === 1 && failSecondChunk) {
        failSecondChunk = false;
        await firstChunkFinished;
        /*
         * give chaise time to record the first chunk as uploaded (only a few event loop ticks, but chaise doesn't expose
         * that state). if it's not enough, the second save uploads chunk 0 again and the test fails instead of passing wrongly.
         */
        await page.waitForTimeout(3000);
        await route.fulfill({ status: 408, contentType: 'text/plain', body: 'Request Timeout' });
        return;
      }
      await route.continue();
    });

    await test.step('interrupt the upload', async () => {
      await page.goto(generateChaiseURL(APP_NAMES.RECORDEDIT, SCHEMA, TABLE, testInfo, baseURL));
      await RecordeditLocators.waitForRecordeditPageReady(page);

      await setInputValue(page, 1, 'fileid', 'fileid', RecordeditInputType.INT_4, '1');
      await setInputValue(page, 1, 'timestamp_txt', 'timestamp_txt', RecordeditInputType.TEXT, TIMESTAMP);
      await setInputValue(page, 1, 'uri', 'uri', RecordeditInputType.FILE, TEST_FILE);
      await RecordeditLocators.submitForm(page);

      await expect(AlertLocators.getErrorAlert(page)).toBeVisible({ timeout: UPLOAD_TIMEOUT });
      await expect.soft(ModalLocators.getUploadProgressModal(page)).not.toBeAttached();
      expect.soft([...requestedChunks].sort()).toEqual([0, 1]);
      expect.soft(uploadJobRequests).toHaveLength(1);
    });

    await test.step('save again resumes the upload', async () => {
      requestedChunks.length = 0;
      uploadJobRequests.length = 0;

      // stay on the same page, the uploaded chunks are only tracked in memory
      const createdRows = waitForCreatedRows(page, SCHEMA, TABLE, UPLOAD_TIMEOUT);
      await RecordeditLocators.submitForm(page);
      const rows = await createdRows;

      // only the second chunk is uploaded, using the same upload job
      expect.soft(requestedChunks).toEqual([1]);
      expect.soft(uploadJobRequests).toHaveLength(0);
      expect.soft(String(rows[0].uri).startsWith(`${NAMESPACE}/1/.txt/`)).toBe(true);

      await testRecordMainSectionPartialValues(page, NUM_RECORD_COLUMNS, {
        uri: { url: `${NAMESPACE}/1/.txt/`, caption: TEST_FILE.name },
        filename: TEST_FILE.name,
      });
    });

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
