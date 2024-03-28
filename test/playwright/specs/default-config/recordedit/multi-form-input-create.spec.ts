import { test, expect, Page, TestInfo } from '@playwright/test';
import ModalLocators from '@isrd-isi-edu/chaise/test/playwright/locators/modal';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/playwright/locators/recordset';
import RecordLocators from '@isrd-isi-edu/chaise/test/playwright/locators/record';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/playwright/locators/recordedit';
import { getCatalogID, getEntityRow } from '@isrd-isi-edu/chaise/test/playwright/utils/catalog-utils';
import { testRecordsetTableRowValues } from '@isrd-isi-edu/chaise/test/playwright/utils/recordset-utils';

const MULI_FORM_INPUT_FORM_NUMBER = -1;

const testFiles = [
  {
    name: 'testfile128kb_1.png',
    size: '12800',
    path: 'testfile128kb_1.png'
  },
  {
    name: 'testfile128kb_2.png',
    size: '12800',
    path: 'testfile128kb_2.png'
  },
  {
    name: 'testfile128kb_3.png',
    size: '12800',
    path: 'testfile128kb_3.png',
  }
];

const testParams = {
  schema_table: 'multi-form-input:main',
  max_input_rows: 200,
  apply_tests: {
    number_of_forms: 5,
    types: [
      {
        type: 'textarea',
        column_name: 'markdown_col',
        column_displayname: 'markdown_col',
        apply_to_all: {
          value: '**markdown value**',
          column_values_after: [
            '**markdown value**',
            '**markdown value**',
            '**markdown value**',
            '**markdown value**',
            '**markdown value**'
          ],
        },
        apply_to_some: {
          value: 'some **markdown**',
          deselected_forms: [1, 2],
          column_values_after: [
            '**markdown value**',
            '**markdown value**',
            'some **markdown**',
            'some **markdown**',
            'some **markdown**',
          ],
        },
        clear_some: {
          deselected_forms: [3, 4],
          column_values_after: [
            '**markdown value**',
            '**markdown value**',
            'some **markdown**',
            'some **markdown**',
            '',
          ]
        },
        manual_test: {
          value: 'manual value',
          formNumber: 4,
          column_values_after: [
            '**markdown value**',
            '**markdown value**',
            'some **markdown**',
            'manual value',
            '',
          ]
        }
      },
      {
        type: 'text',
        column_name: 'text_col',
        column_displayname: 'text_col',
        apply_to_all: {
          value: 'all text input',
          column_values_after: [
            'all text input',
            'all text input',
            'all text input',
            'all text input',
            'all text input'
          ]
        },
        apply_to_some: {
          value: 'some value',
          deselected_forms: [1, 3],
          column_values_after: [
            'all text input',
            'some value',
            'all text input',
            'some value',
            'some value'
          ]
        },
        clear_some: {
          deselected_forms: [4, 5],
          column_values_after: [
            'all text input',
            '',
            'all text input',
            'some value',
            'some value'
          ]
        },
        manual_test: {
          value: 'manual',
          formNumber: 5,
          column_values_after: [
            'all text input',
            '',
            'all text input',
            'some value',
            'manual'
          ]
        }
      },
      {
        type: 'int',
        column_name: 'int_col',
        column_displayname: 'int_col',
        apply_to_all: {
          value: '432',
          column_values_after: [
            '432',
            '432',
            '432',
            '432',
            '432'
          ]
        },
        apply_to_some: {
          value: '666',
          deselected_forms: [1, 3],
          column_values_after: [
            '432',
            '666',
            '432',
            '666',
            '666'
          ]
        },
        clear_some: {
          deselected_forms: [4, 5],
          column_values_after: [
            '432',
            '',
            '432',
            '666',
            '666'
          ]
        },
        manual_test: {
          value: '2',
          formNumber: 5,
          column_values_after: [
            '432',
            '',
            '432',
            '666',
            '2'
          ]
        }
      },
      {
        type: 'float',
        column_name: 'float_col',
        column_displayname: 'float_col',
        apply_to_all: {
          value: '12.2',
          column_values_after: [
            '12.2',
            '12.2',
            '12.2',
            '12.2',
            '12.2'
          ],
        },
        apply_to_some: {
          value: '4.65',
          deselected_forms: [1, 2],
          column_values_after: [
            '12.2',
            '12.2',
            '4.65',
            '4.65',
            '4.65',
          ],
        },
        clear_some: {
          deselected_forms: [3, 4],
          column_values_after: [
            '12.2',
            '12.2',
            '4.65',
            '4.65',
            '',
          ]
        },
        manual_test: {
          value: '5',
          formNumber: 4,
          column_values_after: [
            '12.2',
            '12.2',
            '4.65',
            '5',
            '',
          ]
        }
      },
      {
        type: 'date',
        column_name: 'date_col',
        column_displayname: 'date_col',
        apply_to_all: {
          value: '2011-10-09',
          column_values_after: [
            '2011-10-09',
            '2011-10-09',
            '2011-10-09',
            '2011-10-09',
            '2011-10-09',
          ],
        },
        apply_to_some: {
          value: '2022-06-06',
          deselected_forms: [1, 2],
          column_values_after: [
            '2011-10-09',
            '2011-10-09',
            '2022-06-06',
            '2022-06-06',
            '2022-06-06'
          ],
        },
        clear_some: {
          deselected_forms: [3, 4],
          column_values_after: [
            '2011-10-09',
            '2011-10-09',
            '2022-06-06',
            '2022-06-06',
            '',
          ]
        },
        manual_test: {
          value: '2006-06-06',
          formNumber: 4,
          column_values_after: [
            '2011-10-09',
            '2011-10-09',
            '2022-06-06',
            '2006-06-06',
            '',
          ]
        }
      },
      {
        type: 'timestamp',
        column_name: 'timestamp_col',
        column_displayname: 'timestamp_col',
        apply_to_all: {
          date_value: '2021-10-09', time_value: '18:00',
          column_values_after: [
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
          ],
        },
        apply_to_some: {
          date_value: '2012-11-10', time_value: '06:00',
          deselected_forms: [1, 2],
          column_values_after: [
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2012-11-10', time_value: '06:00' },
            { date_value: '2012-11-10', time_value: '06:00' },
            { date_value: '2012-11-10', time_value: '06:00' }
          ],
        },
        clear_some: {
          deselected_forms: [3, 4],
          column_values_after: [
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2012-11-10', time_value: '06:00' },
            { date_value: '2012-11-10', time_value: '06:00' },
            { date_value: '', time_value: '' }
          ]
        },
        manual_test: {
          date_value: '2006-06-06', time_value: '06:06',
          formNumber: 4,
          column_values_after: [
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2021-10-09', time_value: '18:00' },
            { date_value: '2012-11-10', time_value: '06:00' },
            { date_value: '2006-06-06', time_value: '06:06' },
            { date_value: '', time_value: '' }
          ]
        }
      },
      {
        type: 'boolean',
        column_displayname: 'boolean_col',
        column_name: 'boolean_col',
        apply_to_all: {
          value: 'true',
          column_values_after: [
            'true',
            'true',
            'true',
            'true',
            'true'
          ]
        },
        apply_to_some: {
          value: 'false',
          deselected_forms: [1, 3],
          column_values_after: [
            'true',
            'false',
            'true',
            'false',
            'false',
          ]
        },
        clear_some: {
          deselected_forms: [4, 5],
          column_values_after: [
            'true',
            'Select a value',
            'true',
            'false',
            'false',
          ]
        },
        manual_test: {
          value: 'true',
          formNumber: 5,
          column_values_after: [
            'true',
            'Select a value',
            'true',
            'false',
            'true',
          ]
        }
      },
      {
        type: 'fk',
        column_displayname: 'fk_col',
        column_name: 'lIHKX0WnQgN1kJOKR0fK5A',
        apply_to_all: {
          modal_num_rows: 4,
          modal_option_index: 0,
          column_values_after: [
            'one',
            'one',
            'one',
            'one',
            'one',
          ],
        },
        apply_to_some: {
          deselected_forms: [1, 2],
          modal_num_rows: 4,
          modal_option_index: 2,
          column_values_after: [
            'one',
            'one',
            'three',
            'three',
            'three',
          ],
        },
        clear_some: {
          deselected_forms: [3, 4],
          column_values_after: [
            'one',
            'one',
            'three',
            'three',
            'Select a value',
          ]
        },
        manual_test: {
          formNumber: 4,
          modal_num_rows: 4,
          modal_option_index: 3,
          column_values_after: [
            'one',
            'one',
            'three',
            'four',
            'Select a value',
          ]
        }
      },
      {
        type: 'upload',
        column_displayname: 'asset_col',
        column_name: 'asset_col',
        apply_to_all: {
          value: testFiles[0],
          column_values_after: [
            testFiles[0].name,
            testFiles[0].name,
            testFiles[0].name,
            testFiles[0].name,
            testFiles[0].name,
          ],
        },
        apply_to_some: {
          deselected_forms: [1, 2],
          value: testFiles[1],
          column_values_after: [
            testFiles[0].name,
            testFiles[0].name,
            testFiles[1].name,
            testFiles[1].name,
            testFiles[1].name,
          ],
        },
        clear_some: {
          deselected_forms: [3, 4],
          column_values_after: [
            testFiles[0].name,
            testFiles[0].name,
            testFiles[1].name,
            testFiles[1].name,
            'No file Selected'
          ]
        },
        manual_test: {
          formNumber: 4,
          value: testFiles[2],
          column_values_after: [
            testFiles[0].name,
            testFiles[0].name,
            testFiles[1].name,
            testFiles[2].name,
            ''
          ]
        }
      }
    ],
    submission_results: [
      ['1', 'markdown value', 'all text input', '432', '12.2000', '2011-10-09', '2021-10-09 18:00:00', 'true', '1', process.env.CI ? '' : 'testfile128kb_1.png'],
      ['2', 'markdown value', '', '', '12.2000', '2011-10-09', '2021-10-09 18:00:00', '', '1', process.env.CI ? '' : 'testfile128kb_1.png'],
      ['3', 'some markdown', 'all text input', '432', '4.6500', '2022-06-06', '2012-11-10 06:00:00', 'true', '3', process.env.CI ? '' : 'testfile128kb_2.png'],
      ['4', 'manual value', 'some value', '666', '5.0000', '2006-06-06', '2006-06-06 06:06:00', 'false', '4', process.env.CI ? '' : 'testfile128kb_3.png'],
      ['5', '', 'manual', '2', '', '', '', 'true', '', ''],
    ]
  },
  submission: {
    table_name: 'main',
    schema_name: 'multi-form-input',
    table_displayname: 'main',
    result_columns: [
      'id', 'markdown_col', 'text_col', 'int_col', 'float_col', 'date_col', 'timestamp_input', 'boolean_input',
      'lIHKX0WnQgN1kJOKR0fK5A', 'asset_col'
    ],
    test_results: true,
    files: testFiles
  }
};

test.describe('multi form input in create mode', () => {

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    const PAGE_URL = `/recordedit/#${getCatalogID(testInfo.project.name)}/${testParams.schema_table}`;
    await page.goto(`${baseURL}${PAGE_URL}`);
    await RecordeditLocators.waitForRecordeditPageReady(page);
  });

  test('general features', async ({ page }) => {
    const cloneFormSubmitButton = RecordeditLocators.getCloneFormInputSubmitButton(page);
    const mdToggleBtn = RecordeditLocators.getMultiFormToggleButton(page, 'markdown_col');

    await test.step('it should not be offered in single mode', async () => {
      await expect.soft(mdToggleBtn).not.toBeAttached();
    });

    await test.step('should be displayed as soon as users added a new form.', async () => {
      await cloneFormSubmitButton.click();
      await expect.soft(mdToggleBtn).toBeVisible();
    });

    await test.step('it should not be offered for disabled columns.', async () => {
      await expect.soft(RecordeditLocators.getInputForAColumn(page, 'id', 1)).toBeDisabled();
      await expect.soft(RecordeditLocators.getMultiFormToggleButton(page, 'id')).not.toBeAttached();
    });

    await test.step('by default only the first form should be selected.', async () => {
      await mdToggleBtn.click();
      await expect.soft(RecordeditLocators.getMultiFormApplyBtn(page)).toBeVisible();
      await testFormInputCellSelected(page, 'markdown_col', 1, true);
    });

    await test.step('the newly cloned form should not be selected.', async () => {
      await cloneFormSubmitButton.click();
      await testFormInputCellSelected(page, 'markdown_col', 3, false);
    });

    await test.step('clicking on each cell in the form should toggle the selection.', async () => {
      const formInputCell = RecordeditLocators.getFormInputCell(page, 'markdown_col', 3);
      await formInputCell.click();
      await testFormInputCellSelected(page, 'markdown_col', 3, true);
      await formInputCell.click();
      await testFormInputCellSelected(page, 'markdown_col', 3, false);
    });

    await test.step('previous selection should remain after closing and opening again.', async () => {
      const formInputCell = RecordeditLocators.getFormInputCell(page, 'markdown_col', 3);
      const applyBtn = RecordeditLocators.getMultiFormApplyBtn(page);
      await formInputCell.click();
      await expect.soft(formInputCell).toHaveClass(/entity-active/);
      // close the multi-form-row
      await mdToggleBtn.click();
      // wait for it to close
      await expect.soft(applyBtn).not.toBeAttached();
      // open the multi-form-row
      await mdToggleBtn.click();
      // wait for it to open again
      await expect.soft(applyBtn).toBeVisible();
      // make sure it still has the class
      await expect.soft(formInputCell).toHaveClass(/entity-active/);
    });

    await test.step('after closing the multi form input, clicking on cell should not have any effect.', async () => {
      const formInputCell = RecordeditLocators.getFormInputCell(page, 'markdown_col', 1);

      // also testing the close button
      await RecordeditLocators.getMultiFormCloseBtn(page).click();
      await formInputCell.click();
      // since it's closed, it shouldn't have the class
      await testFormInputCellSelected(page, 'markdown_col', 1, false);
    });

    await test.step('checkbox functionality', async () => {
      const checkboxLabel = RecordeditLocators.getMultiFormInputCheckboxLabel(page);
      const selectAllCheckbox = RecordeditLocators.getMultiFormInputCheckbox(page);

      await test.step('the label should reflect what is selected.', async () => {
        // open it
        await mdToggleBtn.click();
        // make sure it is selected
        await testFormInputCellSelected(page, 'markdown_col', 1, true);
        await expect.soft(checkboxLabel).toHaveText('2 of 3 selected records');
      });

      await test.step('the label should update after adding a new form', async () => {
        await cloneFormSubmitButton.click();
        await expect.soft(checkboxLabel).toHaveText('2 of 4 selected records');
      })

      await test.step('when partially selected, clicking on the checkbox should select all forms', async () => {
        await selectAllCheckbox.click();
        await expect.soft(checkboxLabel).toHaveText('4 of 4 selected records');

        for (const i of [1, 2, 3, 4]) {
          await testFormInputCellSelected(page, 'markdown_col', i, true);
        }
      });

      await test.step('when all selected, clicking on the checkbox should dselect all forms', async () => {
        await expect.soft(checkboxLabel).toHaveText('4 of 4 selected records');
        await selectAllCheckbox.click();
        await expect.soft(checkboxLabel).toHaveText('Select All');
        for (const i of [1, 2, 3, 4]) {
          await testFormInputCellSelected(page, 'markdown_col', i, false);
        }
      });

      await test.step('when none are selected, clicking on the checkbox should select all forms', async () => {
        await expect.soft(checkboxLabel).toHaveText('Select All');
        await selectAllCheckbox.click();
        await expect.soft(checkboxLabel).toHaveText('4 of 4 selected records');
        for (const i of [1, 2, 3, 4]) {
          await testFormInputCellSelected(page, 'markdown_col', i, true);
        }
      });

    });

  });

  test('for different column types', async ({ page }) => {
    //
  });



});

const testFormInputCellSelected = async (page: Page, name: string, index: number, isSelected: boolean) => {
  if (isSelected) {
    await expect.soft(RecordeditLocators.getFormInputCell(page, name, index)).toHaveClass(/entity-active/);
  } else {
    await expect.soft(RecordeditLocators.getFormInputCell(page, name, index)).not.toHaveClass(/entity-active/);
  }
};
