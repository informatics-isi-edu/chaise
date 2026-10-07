import { expect, Page, Request, test, TestInfo } from '@playwright/test';
import moment from 'moment';

import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
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
const TIMESTAMP = `${moment().format('x')}-upload-filename`;
const NAMESPACE = `/hatrac/js/chaise/${TIMESTAMP}`;
const NUM_RECORD_COLUMNS = 4;

/**
 * createFiles fills both files with the same character, so they have the same content.
 * with the same fileid and timestamp, the second one is uploaded to the same hatrac object as an existing file.
 *
 * NOTE: the files must not be .txt (text/plain). Apache on ubuntu (CI) compresses text/plain responses with mod_deflate,
 * which removes the content-md5 and content-length headers, so the existing file is not detected.
 */
const ORIGINAL_FILE: RecordeditFile = {
  name: 'testfile_upload_filename_original.png',
  size: '100',
  path: 'testfile_upload_filename_original.png',
};
const RENAMED_FILE: RecordeditFile = {
  name: 'testfile_upload_filename_renamed.png',
  size: '100',
  path: 'testfile_upload_filename_renamed.png',
};

/**
 * open the create form, fill it, and submit it.
 * @returns the rows that were sent to ermrest
 */
const createRecord = async (page: Page, baseURL: string | undefined, testInfo: TestInfo, file: RecordeditFile) => {
  await page.goto(generateChaiseURL(APP_NAMES.RECORDEDIT, SCHEMA, TABLE, testInfo, baseURL));
  await RecordeditLocators.waitForRecordeditPageReady(page);

  await setInputValue(page, 1, 'fileid', 'fileid', RecordeditInputType.INT_4, '1');
  await setInputValue(page, 1, 'timestamp_txt', 'timestamp_txt', RecordeditInputType.TEXT, TIMESTAMP);
  await setInputValue(page, 1, 'uri', 'uri', RecordeditInputType.FILE, file);

  const createdRows = waitForCreatedRows(page, SCHEMA, TABLE);
  await RecordeditLocators.submitForm(page);
  return createdRows;
};

test.describe('Recordedit upload of an existing file', () => {
  test.beforeAll(async () => {
    await createFiles([ORIGINAL_FILE, RENAMED_FILE]);
    registerHatracNamespace(NAMESPACE);
  });

  test.afterAll(async () => {
    await deleteFiles([ORIGINAL_FILE, RENAMED_FILE]);
  });

  test('saves when the filename update fails', async ({ page, baseURL }, testInfo) => {
    let originalUrl = '';

    await test.step('upload the file', async () => {
      const rows = await createRecord(page, baseURL, testInfo, ORIGINAL_FILE);
      originalUrl = String(rows[0].uri);

      // a versioned url (`<namespace>/<fileid>/<ext>/<md5>:<version>`)
      expect.soft(originalUrl.startsWith(`${NAMESPACE}/1/.png/`)).toBe(true);
      expect.soft(originalUrl).toContain(':');
      await testRecordMainSectionPartialValues(page, NUM_RECORD_COLUMNS, { filename: ORIGINAL_FILE.name });
    });

    await test.step('upload it again with a different name', async () => {
      // updating the filename is best effort, so a failure shouldn't stop the submission
      const filenameUpdates: Request[] = [];
      await page.route(
        (url) => url.pathname.endsWith(';metadata/content-disposition'),
        async (route) => {
          filenameUpdates.push(route.request());
          await route.fulfill({ status: 403, contentType: 'text/plain', body: 'Forbidden' });
        }
      );

      const uploadRequests: Request[] = [];
      page.on('request', (request) => {
        if (isHatracUploadJobRequest(request) || getHatracChunkIndex(request) !== null) uploadRequests.push(request);
      });

      const rows = await createRecord(page, baseURL, testInfo, RENAMED_FILE);

      expect.soft(filenameUpdates).toHaveLength(1);
      // the existing file is used, so nothing is uploaded and the existing version is saved
      expect.soft(uploadRequests).toHaveLength(0);
      expect.soft(rows[0].uri).toBe(originalUrl);
      expect.soft(rows[0].filename).toBe(RENAMED_FILE.name);

      await testRecordMainSectionPartialValues(page, NUM_RECORD_COLUMNS, {
        uri: { url: originalUrl, caption: RENAMED_FILE.name },
        filename: RENAMED_FILE.name,
      });
      await expect.soft(AlertLocators.getErrorAlert(page)).not.toBeAttached();
    });
  });
});
