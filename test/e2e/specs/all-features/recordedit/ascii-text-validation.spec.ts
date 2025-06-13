import { test, expect } from '@playwright/test';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { clearInputValue, setInputValue } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';

const errorMessagePrepend = 'Only ASCII characters are accepted. Invalid character: ';

const testParams = {
  schema_table: 'ascii-text-validation:main',
  cases: [
    {
      type: RecordeditInputType.TEXT,
      column_name: 'text_col',
      column_displayname: 'text_col',
      inputs: [
        { value: 'Accepted value', error: false },
        { value: 'Accepted value€', error: '€ (position 15 of 15)' },
        { value: 'Èat', error: 'È (position 1 of 3)' },
        { value: 'eat', error: false },
      ],
    },
    {
      type: RecordeditInputType.LONGTEXT,
      column_name: 'longtext_col',
      column_displayname: 'longtext_col',
      inputs: [
        { value: 'Accepted value', error: false },
        { value: 'Accepted value€', error: '€ (position 15 of 15)' },
        { value: 'Èat', error: 'È (position 1 of 3)' },
        { value: 'eat', error: false },
      ]
    },
    {
      type: RecordeditInputType.MARKDOWN,
      column_name: 'markdown_col',
      column_displayname: 'markdown_col',
      inputs: [
        { value: '* Markdown with IÑvalid characters', error: 'Ñ (position 18 of 34)' },
        { value: '* Markdown with valid characters', error: false }
      ]
    },
    {
      type: RecordeditInputType.JSON,
      column_name: 'json_col',
      column_displayname: 'json_col',
      inputs: [
        { value: '\"valid json\"', error: false },
        { value: '\"invalid Ý json\"', error: 'Ý (position 10 of 16)' }
      ]
    },
    {
      type: RecordeditInputType.ARRAY,
      arrayBaseType: RecordeditInputType.TEXT,
      column_name: 'array_text',
      column_displayname: 'array_text',
      inputs: [
        { value: ['this text has non-ascii chÂraceters'], error: 'Â (position 27 of 35)' },
        { value: ['valid value1', 'valid value 2'], error: false },
        { value: ['valid text', 'ïnvalid text'], error: 'ï (position 1 of 12)' },
      ]
    }
  ]
}

test('asciiTextValidation chaise-config support,', async ({ page, baseURL }, testInfo) => {
  /**
   * NOTE: the all-features spec is running sequentially right now, that's why this spec is created with steps
   * instead of individual tests.
   *
   * if we changed the all-features to allow parallel tests, we should
   * - change the outer test to be test.describe
   * - change the first step to be a test.beforeeach
   * - change the first test.step to be individual test blocks
   */
  await test.step('load the page', async () => {
    const PAGE_URL = `/recordedit/#${getCatalogID(testInfo.project.name)}/${testParams.schema_table}`;
    await page.goto(`${baseURL}${PAGE_URL}`);
    await RecordeditLocators.waitForRecordeditPageReady(page);
  });

  for await (const params of testParams.cases) {
    await test.step(`${params.type}`, async () => {
      const cellError = RecordeditLocators.getErrorMessageForAColumn(page, params.column_name, 1);

      for await (const [inpIndex, inpParams] of params.inputs.entries()) {
        const hasError = typeof inpParams.error === 'string';
        const stepMessage = `value ${inpIndex}: ${hasError ? 'should be accepted' : 'should show an error'}`;

        await test.step(stepMessage, async () => {
          // setInputValue for array only works for valid values. so we have to manually test it here if testing error case
          if (hasError && params.type === RecordeditInputType.ARRAY && params.arrayBaseType) {
            const addItemName = RecordeditLocators.getArrayInputName(params.column_name, -1);
            const addItemError = RecordeditLocators.getErrorMessageForAColumn(page, addItemName, 1);

            for await (const [valIndex, val] of (inpParams.value as string[]).entries()) {
              await setInputValue(page, 1, addItemName, params.column_displayname, params.arrayBaseType, val);

              // the last item is going to cause error, so we cannot click
              const addItemBtn = RecordeditLocators.getArrayFieldElements(page, params.column_name, 1).addItemButton;
              if (valIndex === inpParams.value.length - 1) {
                await expect(addItemBtn).toBeDisabled();
              } else {
                await addItemBtn.click();
              }
            }

            await expect.soft(addItemError).toHaveText(errorMessagePrepend + inpParams.error);
          }

          else {
            await setInputValue(page, 1, params.column_name, params.column_displayname, params.type, inpParams.value, params.arrayBaseType);
            if (hasError) {
              await expect.soft(cellError).toHaveText(errorMessagePrepend + inpParams.error);
            } else {
              await expect.soft(cellError).not.toBeAttached();
            }
            await clearInputValue(page, 1, params.column_name, params.column_displayname, params.type);
          }
        });
      }
    });
  }

});
