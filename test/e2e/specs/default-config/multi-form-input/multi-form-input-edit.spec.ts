import { test, expect, TestInfo } from '@playwright/test';

import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';

import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { setInputValue, testSubmission } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';


const MULI_FORM_INPUT_FORM_NUMBER = -1;

const testParams = {
  multiEdit: {
    filter: 'id=9001;id=9002@sort(id)',
    columnsWithToggle: [
      'markdown_col', 'text_col', 'int_col',
      'float_col', 'date_col', 'timestamp_col', 'boolean_col', 'fk_col', 'array_text'
    ],
    submission: {
      tableDisplayname: 'main',
      resultColumnNames: [
        'markdown_col', 'text_col', 'int_col', 'float_col', 'date_col', 'timestamp_input', 'boolean_input',
        'lIHKX0WnQgN1kJOKR0fK5A', 'asset_col', 'array_text'
      ],
      resultRowValues: [
        ['markdown value 9001', 'text value 9001', '666', '', '', '', '', '', '', ''],
        ['markdown value 9002', '', '9,002', '', '2023-11-11', '', '', '', '', ''],
      ]
    }
  },
  domainFilter: {
    tableName: 'table_w_domain_filter',
    filter: 'id=1;id=2@sort(id)',
    popup: {
      colDisplayname: 'fk_col',
      colName: 'ryb03_WTq7RSmwG7_gNXgw',
      errorMessage: [
        'This feature is constrained by Text column. ',
        'Make sure all the records you want to set fk_col for, have the same values for those fields. ',
        'Try again after upadting those fields.'
      ].join('')
    },
    dropdown: {
      colDisplayname: 'fk2_col',
      colName: 'PGdROfG2vixU8Z4k_JS-Hg',
      errorMessage: [
        'This feature is constrained by Second text column and fk_col. ',
        'Make sure all the records you want to set fk2_col for, have the same values for those fields. ',
        'Try again after upadting those fields.'
      ].join('')
    }
  }
}

test.describe('Regarding multi form input button', () => {
  const getURL = (schema_table: string, testInfo: TestInfo, baseURL?: string) => {
    return generateChaiseURL(APP_NAMES.RECORDEDIT, '', schema_table, testInfo, baseURL);
  }

  test('in single edit the toggle button should not be available', async ({ page, baseURL }, testInfo) => {
    await page.goto(`${getURL('multi-form-input:main', testInfo, baseURL)}/id=9001`);
    await RecordeditLocators.waitForRecordeditPageReady(page);

    await expect.soft(RecordeditLocators.getMultiFormToggleButton(page, 'markdown_col')).not.toBeVisible();
  });

  test('in multi edit', async ({ page, baseURL }, testInfo) => {
    await test.step('the toggle button should be offered on all non-disabled columns.', async () => {
      await page.goto(`${getURL('multi-form-input:main', testInfo, baseURL)}/${testParams.multiEdit.filter}`);
      await RecordeditLocators.waitForRecordeditPageReady(page);

      await expect.soft(RecordeditLocators.getMultiFormToggleButton(page, 'id')).not.toBeVisible();
      for (const colName of testParams.multiEdit.columnsWithToggle) {
        await expect.soft(RecordeditLocators.getMultiFormToggleButton(page, colName)).toBeVisible();
      }
    });

    await test.step('user should be able to use this control to change some values for columns.', async () => {
      // testing only one column here as we're doing all the tests in create mode already
      // we could add more tests similar to create mode here, but I don't think it's needed.
      await RecordeditLocators.getMultiFormToggleButton(page, 'int_col').click();

      await setInputValue(page, MULI_FORM_INPUT_FORM_NUMBER, 'int_col', 'int_col', RecordeditInputType.INT_4, '666');

      await RecordeditLocators.getMultiFormApplyBtn(page).click();
    });

    // we used to have bug where the clear all wasn't working as expected for fkeys. so we're specifically testing it here
    await test.step('user should be able to clear all foreign key values.', async () => {
      const clearBtn = RecordeditLocators.getMultiFormClearBtn(page);
      await RecordeditLocators.getMultiFormToggleButton(page, 'fk_col').click();
      await RecordeditLocators.getMultiFormInputCheckbox(page).click();
      await expect.soft(clearBtn).not.toBeDisabled();
      await clearBtn.click();
    });

    await test.step('user should be able to submit and save data.', async () => {
      /**
       * increse the timeout because of upload modal
       * 2 records, 10 seconds for each
       */
      await testSubmission(page, testParams.multiEdit.submission, true, 2 * 20 * 1000);
    });
  });

  test('domain-filter support', async ({ page, baseURL }, testInfo) => {
    const params = testParams.domainFilter;

    await test.step('page should load properly', async () => {
      await page.goto(`${getURL('multi-form-input:' + params.tableName, testInfo, baseURL)}/${params.filter}`);
      await RecordeditLocators.waitForRecordeditPageReady(page);
    });

    await test.step('for foreignkey popups', async () => {
      const errorMessage = RecordeditLocators.getErrorMessageForAColumn(page, params.popup.colName, MULI_FORM_INPUT_FORM_NUMBER);

      await test.step('if there was just one form is selected, the domain-filter of that form should be honored in the popup', async () => {
        await RecordeditLocators.getMultiFormToggleButton(page, params.popup.colDisplayname).click();

        const valueProps = { modal_num_rows: 1, modal_option_index: 0 };
        await setInputValue(
          page, MULI_FORM_INPUT_FORM_NUMBER, params.popup.colName, params.popup.colDisplayname,
          RecordeditInputType.FK_POPUP, valueProps
        );

        await RecordeditLocators.getMultiFormApplyBtn(page).click();
      });

      await test.step('if multiple selected, after clicking the popup, should compute domain-filters for selected forms', async () => {
        // select all
        await RecordeditLocators.getMultiFormInputCheckbox(page).click();
        // click on the fk to trigger the error
        await RecordeditLocators.getForeignKeyInputButton(page, params.popup.colDisplayname, MULI_FORM_INPUT_FORM_NUMBER).click();

        await expect.soft(errorMessage).toBeVisible();
        await expect.soft(errorMessage).toHaveText(params.popup.errorMessage)

      });

      await test.step('after fixing the issue, fk popup should open properly and the error should be hidden.', async () => {
        await setInputValue(page, 1, 'text_col', 'Text column', RecordeditInputType.TEXT, 'val2');

        const valueProps = { modal_num_rows: 2, modal_option_index: 0 };
        await setInputValue(
          page, MULI_FORM_INPUT_FORM_NUMBER, params.popup.colName, params.popup.colDisplayname,
          RecordeditInputType.FK_POPUP, valueProps
        );

        await expect.soft(errorMessage).not.toBeVisible();
      });
    });

    await test.step('for foreignkey dropdowns', async () => {
      const errorMessage = RecordeditLocators.getErrorMessageForAColumn(page, params.dropdown.colName, MULI_FORM_INPUT_FORM_NUMBER);

      await test.step('if there was just one form is selected, the domain-filter of that form should be honored in the popup', async () => {
        await RecordeditLocators.getMultiFormToggleButton(page, params.dropdown.colDisplayname).click();

        const valueProps = { modal_num_rows: 1, modal_option_index: 0 };
        await setInputValue(
          page, MULI_FORM_INPUT_FORM_NUMBER, params.dropdown.colName, params.dropdown.colDisplayname,
          RecordeditInputType.FK_DROPDOWN, valueProps
        );

        await RecordeditLocators.getMultiFormApplyBtn(page).click();
      });

      await test.step('if multiple selected, after clicking the popup, should compute domain-filters for selected forms', async () => {
        // select all
        await RecordeditLocators.getMultiFormInputCheckbox(page).click();
        // click on the fk to trigger the error
        await RecordeditLocators.getDropdownElementByName(page, params.dropdown.colName, MULI_FORM_INPUT_FORM_NUMBER).click();

        await expect.soft(errorMessage).toBeVisible();
        await expect.soft(errorMessage).toHaveText(params.dropdown.errorMessage)

      });

      await test.step('after fixing the issue, fk popup should open properly and the error should be hidden.', async () => {
        await setInputValue(page, 1, 'text_col_2', 'Second text column', RecordeditInputType.TEXT, 'val2');

        const valueProps = { modal_num_rows: 2, modal_option_index: 0 };
        await setInputValue(
          page, MULI_FORM_INPUT_FORM_NUMBER, params.dropdown.colName, params.dropdown.colDisplayname,
          RecordeditInputType.FK_DROPDOWN, valueProps
        );

        await expect.soft(errorMessage).not.toBeVisible();
      });
    });

  });

});

