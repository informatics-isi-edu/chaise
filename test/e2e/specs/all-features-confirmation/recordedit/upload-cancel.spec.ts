import { expect, Route, test } from '@playwright/test';
import moment from 'moment';

import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import { registerHatracNamespace } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import {
  createFiles,
  deleteFiles,
  getHatracChunkIndex,
  RecordeditFile,
  setInputValue,
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';

const SCHEMA = 'product-add';
const TABLE = 'file';
const TIMESTAMP = `${moment().format('x')}-upload-cancel`;
const NAMESPACE = `/hatrac/js/chaise/${TIMESTAMP}`;

/**
 * the number of chunks that are uploaded at the same time.
 * the file has one more chunk (5 MB each), so a chunk is still in the queue when the upload is canceled.
 */
const CHUNKS_IN_PARALLEL = 4;
const TEST_FILE: RecordeditFile = {
  name: 'testfile25MB_upload_cancel.txt',
  size: '26214400',
  path: 'testfile25MB_upload_cancel.txt',
};

test.describe('Recordedit upload cancel', () => {
  test.beforeAll(async () => {
    await createFiles([TEST_FILE]);
    // the global teardown deletes the namespace (which also removes the upload job that cancel doesn't delete)
    registerHatracNamespace(NAMESPACE);
  });

  test.afterAll(async () => {
    await deleteFiles([TEST_FILE]);
  });

  test('cancel aborts the chunk uploads', async ({ page, baseURL }, testInfo) => {
    test.slow();

    // hold the chunk requests, so none of the file content is sent to hatrac
    const heldChunks: Route[] = [];
    await page.route('**/hatrac/**', async (route) => {
      if (getHatracChunkIndex(route.request()) === null) {
        await route.continue();
        return;
      }
      heldChunks.push(route);
    });

    const abortedChunks: number[] = [];
    page.on('requestfailed', (request) => {
      const index = getHatracChunkIndex(request);
      if (index !== null) abortedChunks.push(index);
    });

    await test.step('start the upload', async () => {
      await page.goto(generateChaiseURL(APP_NAMES.RECORDEDIT, SCHEMA, TABLE, testInfo, baseURL));
      await RecordeditLocators.waitForRecordeditPageReady(page);

      await setInputValue(page, 1, 'fileid', 'fileid', RecordeditInputType.INT_4, '1');
      await setInputValue(page, 1, 'timestamp_txt', 'timestamp_txt', RecordeditInputType.TEXT, TIMESTAMP);
      await setInputValue(page, 1, 'uri', 'uri', RecordeditInputType.FILE, TEST_FILE);
      await RecordeditLocators.submitForm(page);

      await expect.poll(() => heldChunks.length, { timeout: 60_000 }).toBe(CHUNKS_IN_PARALLEL);
    });

    await test.step('cancel aborts the chunks', async () => {
      const uploadModal = ModalLocators.getUploadProgressModal(page);
      await ModalLocators.getUploadProgressCancelButton(uploadModal).click();

      await expect.soft(uploadModal).not.toBeAttached();
      await expect.soft(AlertLocators.getErrorAlert(page)).not.toBeAttached();
      await expect.poll(() => abortedChunks.length).toBe(CHUNKS_IN_PARALLEL);
    });

    await test.step('no other chunk is uploaded', async () => {
      // nothing should be sent after the cancel (e.g. the queued chunk, or the aborted ones again)
      await page.waitForTimeout(3000);
      expect.soft(heldChunks.length).toBe(CHUNKS_IN_PARALLEL);
    });

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
