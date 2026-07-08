import { test, expect, Page } from '@playwright/test';

import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import {
  createFiles,
  deleteFiles,
  selectFile,
  RecordeditFile,
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';

/**
 * file-selection validation for asset columns in recordedit.
 *
 * - `product-add:file` `uri` declares `filename_ext_filter: [".txt", ".png"]` and no
 *   `allow_empty_file`, so it exercises the extension filter and the empty-file rejection.
 * - `product-add:file_w_fk_in_url_pattern` `asset_col` sets `allow_empty_file: true`, so it
 *   exercises the opted-in case where an empty file is accepted.
 */
const SCHEMA = 'product-add';
const FORM_NUMBER = 1;

const REJECT_TABLE = 'file';
const REJECT_COLUMN = 'uri';
const ALLOW_EMPTY_TABLE = 'file_w_fk_in_url_pattern';
const ALLOW_EMPTY_COLUMN = 'asset_col';

const EMPTY_FILE: RecordeditFile = {
  name: 'file_validation_empty.txt',
  size: '0',
  path: 'file_validation_empty.txt',
};
const BAD_EXT_FILE: RecordeditFile = {
  name: 'file_validation_bad.pdf',
  size: '10',
  path: 'file_validation_bad.pdf',
};
const testFiles = [EMPTY_FILE, BAD_EXT_FILE];

/**
 * Select a file for an asset column. Pass `skipFilenameCheck` when the selection is expected to
 * be rejected (no value is set, so the input keeps its placeholder).
 */
const selectAssetFile = (
  page: Page,
  column: string,
  file: RecordeditFile,
  skipFilenameCheck = false
) =>
  selectFile(
    file,
    RecordeditLocators.getFileInputButtonForAColumn(page, column, FORM_NUMBER),
    RecordeditLocators.getTextFileInputForAColumn(page, column, FORM_NUMBER),
    skipFilenameCheck
  );

test.describe('Recordedit file-selection validation', () => {
  // keep the file's tests in one worker so createFiles/deleteFiles don't race across workers
  test.describe.configure({ mode: 'default' });

  test.beforeAll(async () => {
    await createFiles(testFiles);
  });

  test.afterAll(async () => {
    await deleteFiles(testFiles);
  });

  test('rejects an empty file', async ({ page, baseURL }, testInfo) => {
    await page.goto(
      generateChaiseURL(APP_NAMES.RECORDEDIT, SCHEMA, REJECT_TABLE, testInfo, baseURL)
    );
    await RecordeditLocators.waitForRecordeditPageReady(page);

    await selectAssetFile(page, REJECT_COLUMN, EMPTY_FILE, true);

    await expect
      .soft(AlertLocators.getErrorAlert(page))
      .toContainText(
        `The selected file "${EMPTY_FILE.name}" is empty (0 bytes). Empty files are not allowed.`
      );
    // the value is not set, so the "select a file" placeholder is still shown
    await expect
      .soft(RecordeditLocators.getInputPlaceholderMessage(page, REJECT_COLUMN, FORM_NUMBER))
      .toBeVisible();
  });

  test('rejects a disallowed extension', async ({ page, baseURL }, testInfo) => {
    await page.goto(
      generateChaiseURL(APP_NAMES.RECORDEDIT, SCHEMA, REJECT_TABLE, testInfo, baseURL)
    );
    await RecordeditLocators.waitForRecordeditPageReady(page);

    await selectAssetFile(page, REJECT_COLUMN, BAD_EXT_FILE, true);

    await expect
      .soft(AlertLocators.getErrorAlert(page))
      .toContainText(
        `Invalid file extension for "${BAD_EXT_FILE.name}". Valid file extensions are .txt,.png`
      );
    await expect
      .soft(RecordeditLocators.getInputPlaceholderMessage(page, REJECT_COLUMN, FORM_NUMBER))
      .toBeVisible();
  });

  test('allows an empty file when opted in', async ({ page, baseURL }, testInfo) => {
    await page.goto(
      generateChaiseURL(APP_NAMES.RECORDEDIT, SCHEMA, ALLOW_EMPTY_TABLE, testInfo, baseURL)
    );
    await RecordeditLocators.waitForRecordeditPageReady(page);

    // no skipFilenameCheck: the empty file is accepted, so selectFile asserts the input shows its name
    await selectAssetFile(page, ALLOW_EMPTY_COLUMN, EMPTY_FILE);

    // no rejection alert should appear
    await expect.soft(AlertLocators.getErrorAlert(page)).toHaveCount(0);
  });
});
