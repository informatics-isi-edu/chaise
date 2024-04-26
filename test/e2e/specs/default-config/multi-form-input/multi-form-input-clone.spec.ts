import { test, expect } from '@playwright/test';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { clearInput } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';

const testParams = {
  schema_table: 'multi-form-input:main',
  max_input_rows: 200,
}

test('clone button', async ({ page, baseURL }, testInfo) => {
  const cloneFormInput = RecordeditLocators.getCloneFormInput(page);
  const cloneFormSubmitButton = RecordeditLocators.getCloneFormInputSubmitButton(page);

  await test.step('should be visible on load', async () => {
    const PAGE_URL = `/recordedit/#${getCatalogID(testInfo.project.name)}/${testParams.schema_table}`;
    await page.goto(`${baseURL}${PAGE_URL}`);
    await RecordeditLocators.waitForRecordeditPageReady(page);

    await expect(cloneFormInput).toBeVisible();
  });

  await test.step('should alert the user when they try to add more forms than the limit allows.', async () => {
    const numberGreaterThanMax = testParams.max_input_rows + 1;
    const errorMessage = [
      'Error',
      `Cannot add ${numberGreaterThanMax} records. `,
      `Please input a value between 1 and ${testParams.max_input_rows}, inclusive.`
    ].join('');

    await cloneFormInput.fill(numberGreaterThanMax.toString());
    await cloneFormSubmitButton.click();

    await expect.soft(AlertLocators.getErrorAlert(page)).toHaveText(errorMessage);
  });

  await test.step('should allow users to add the maximum amount of forms.', async () => {
    await clearInput(cloneFormInput);
    await cloneFormInput.fill(testParams.max_input_rows.toString());
    await cloneFormSubmitButton.click();

    await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(testParams.max_input_rows + 1);

    // submit the form
    await RecordeditLocators.getSubmitRecordButton(page).click();

    const resultset = RecordeditLocators.getRecoreditResultsetTables(page);
    await expect.soft(resultset).toBeVisible({ timeout: 30 * 1000 });
    await expect.soft(RecordsetLocators.getRows(resultset)).toHaveCount(testParams.max_input_rows + 1);
  });

});
