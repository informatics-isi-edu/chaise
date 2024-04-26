import { execSync } from 'child_process';
import { resolve } from 'path';
import { expect, Locator, Page } from '@playwright/test';

import { UPLOAD_FOLDER } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import { RecordsetRowValue, testRecordsetTableRowValues } from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import { testRecordMainSectionValues } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';


export type RecordeditFile = {
  name: string,
  size: number | string,
  path: string,
  skipCreation?: boolean,
  skipDeletion?: boolean
}

/**
 * create files in the given path. This should be called before test cases
 * parent directory that these files will be uploaded into is test/e2e/data_setup/uploaded_files.
 * That means the given path should be a path that is valid in uploaded_files folder.
 *
 * @param  {RecordeditFile[]} files array of objects with at least path, and size as attributes.
 */
export const createFiles = async (files: RecordeditFile[]) => {

  for (const f of files) {
    if (!f.skipCreation) {
      const path = resolve(UPLOAD_FOLDER, f.path);
      execSync(`mkdir -p ${UPLOAD_FOLDER}`);
      execSync(`perl -e 'print \"1\" x ${f.size}' > ${path}`);
      console.log(`${path} created`);
    }
  }

};

/**
* removes the given files. read the createFiles documentation for more info about files and path
* @param  {RecordeditFile[]} files array of objects with at least path, and size as attributes.
*/
export const deleteFiles = async (files: RecordeditFile[]) => {
  files.forEach((f) => {
    if (f.skipDeletion) return;
    const path = resolve(UPLOAD_FOLDER, f.path);
    execSync(`rm ${path}`);
    console.log(`${path} deleted`);
  });
};

/**
 * can be used for setting a file for an input.
 * @param file the file that will be selected
 * @param fileInputBtn the button that opens the file chooser when users click on it
 * @param fileTextInput the text input that displays the selected file
 */
export const selectFile = async (file: RecordeditFile, fileInputBtn: Locator, fileTextInput: Locator) => {
  const fileChooserPromise = fileInputBtn.page().waitForEvent('filechooser');
  await fileInputBtn.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(resolve(UPLOAD_FOLDER, file.path));
  await expect.soft(fileTextInput).toHaveText(file.name);
}


export const selectDropdownValue = async (dropdownEl: Locator, value: string) => {
  const text = await dropdownEl.innerText();

  // if it's alredy selected, abort
  if (text.trim() === value) return;

  // open the dropdown
  await dropdownEl.click();

  const optionsContainer = RecordeditLocators.getOpenDropdownOptionsContainer(dropdownEl.page());
  await expect.soft(optionsContainer).toBeVisible();

  const options = RecordeditLocators.getDropdownOptions(dropdownEl.page());
  await options.getByText(value).click();
}

type SetInputValueProps = string | RecordeditFile | {
  date_value: string,
  time_value: string
} | {
  modal_num_rows: number,
  modal_option_index: number
};

/**
 * while `inputEl.fill('')` is supposed to clear the input, in some cases (textarea for example) it might not work
 * as expected. In those cases you can use this function.
 *
 * https://github.com/microsoft/playwright/issues/12828#issuecomment-1341129233
 */
export const clearInput = async (inputEl: Locator) => {
  await inputEl.focus();
  await inputEl.page().keyboard.press('Meta+A');
  await inputEl.page().keyboard.press('Backspace');
}

/**
 *
 * expected types: 'timestamp', 'boolean', 'fk', 'fk-dropdown', any other string
 *
 * expected valueProps:
 * {
 *
 * // general:
 *  value,
 *
 * // time stamp props:
 *  date_value,
 *  time_value,
 *
 * // fk props:
 *  modal_num_rows,
 *  modal_option_index,
 *
 * }
 *
 * @returns
 */
export const setInputValue = async (
  page: Page, formNumber: number, name: string, displayname: string, inputType: RecordeditInputType, valueProps: SetInputValueProps
) => {
  switch (inputType) {
    case RecordeditInputType.BOOLEAN:
      if (typeof valueProps !== 'string') return;

      const dropdown = RecordeditLocators.getDropdownElementByName(page, name, formNumber);
      await selectDropdownValue(dropdown, valueProps);
      await expect.soft(RecordeditLocators.getDropdownText(dropdown)).toHaveText(valueProps);
      break;

    case RecordeditInputType.FK_POPUP:
      if (typeof valueProps !== 'object' || !(('modal_num_rows' in valueProps) && ('modal_option_index' in valueProps))) {
        return;
      }

      await RecordeditLocators.getForeignKeyInputButton(page, displayname, formNumber).click();
      const rsModal = ModalLocators.getRecordsetSearchPopup(page);
      await expect.soft(rsModal).toBeVisible();
      await expect.soft(RecordsetLocators.getRows(rsModal)).toHaveCount(valueProps.modal_num_rows);
      await RecordsetLocators.getRowSelectButton(rsModal, valueProps.modal_option_index).click();
      await expect.soft(rsModal).not.toBeAttached();
      break;

    case RecordeditInputType.FK_DROPDOWN:
      if (typeof valueProps !== 'object' || !(('modal_num_rows' in valueProps) && ('modal_option_index' in valueProps))) {
        return;
      }

      await RecordeditLocators.getDropdownElementByName(page, name, formNumber).click();
      const dropdownOptions = RecordeditLocators.getDropdownSelectableOptions(page);
      await expect.soft(dropdownOptions).toHaveCount(valueProps.modal_num_rows);
      await dropdownOptions.nth(valueProps.modal_option_index).click();
      await expect.soft(dropdownOptions).not.toBeAttached();
      break;

    case RecordeditInputType.TIMESTAMP:
      if (typeof valueProps !== 'object' || !(('time_value' in valueProps) && ('date_value' in valueProps))) {
        return;
      }

      const inputs = RecordeditLocators.getTimestampInputsForAColumn(page, name, formNumber);
      await inputs.clearBtn.click();
      await inputs.date.fill('');
      await inputs.date.fill(valueProps.date_value);
      await inputs.time.fill('');
      await inputs.time.fill(valueProps.time_value);
      break;

    case RecordeditInputType.FILE:
      if (typeof valueProps !== 'object' || !('name' in valueProps)) return;

      const fileInputBtn = RecordeditLocators.getFileInputButtonForAColumn(page, name, formNumber);
      const fileTextInput = RecordeditLocators.getTextFileInputForAColumn(page, name, formNumber);
      await selectFile(valueProps, fileInputBtn, fileTextInput);
      break;

    default:
      if (typeof valueProps !== 'string') return;

      let inputEl;
      if (inputType === RecordeditInputType.MARKDOWN || inputType === RecordeditInputType.LONGTEXT) {
        inputEl = RecordeditLocators.getTextAreaForAColumn(page, name, formNumber);
      } else {
        inputEl = RecordeditLocators.getInputForAColumn(page, name, formNumber);
      }
      await clearInput(inputEl);
      await inputEl.fill(valueProps);
      break;
  }
};

/**
 * test the values displayed on the forms for a column
 *
 * expectedValues expected type will be different depending on the input type. for all the types expect the following
 * it should be an array of strings.
 * - timestamp: array of objects with date_value and time_value props
 *
 * @param {string} name the column name
 * @param {string}} displayname the column displayname
 * @param {string} displayType the display type (boolean, fk, timestamp, upload, "any other string")
 * @param {boolean} allDisabled whether we should test that all the inputs are disabled or not
 * @param {any[]} expectedValues the expected values
 * @returns
 */
export const testFormValuesForAColumn = async (
  page: Page, name: string, displayname: string, inputType: RecordeditInputType, allDisabled: boolean, expectedValues: SetInputValueProps[]
) => {

  let formNumber = 1, input;
  const inputControl = RecordeditLocators.getInputControlForAColumn(page, name, formNumber);
  for (const value of expectedValues) {
    switch (inputType) {
      case RecordeditInputType.BOOLEAN:
        if (typeof value !== 'string') return;

        input = RecordeditLocators.getDropdownElementByName(page, name, formNumber);
        if (allDisabled) {
          await expect.soft(inputControl).toHaveClass(/input-disabled/);
        }
        await expect.soft(input).toHaveText(value);
        break;

      case RecordeditInputType.FK_POPUP:
        if (typeof value !== 'string') return;

        input = RecordeditLocators.getForeignKeyInputDisplay(page, displayname, formNumber);
        if (allDisabled) {
          await expect.soft(input).toHaveClass(/input-disabled/);
        }
        await expect.soft(input).toHaveText(value);
        break;

      case RecordeditInputType.TIMESTAMP:
        if (typeof value !== 'object' || !('date_value' in value) || !('time_value' in value)) return;
        input = RecordeditLocators.getTimestampInputsForAColumn(page, name, formNumber);
        if (allDisabled) {
          await expect.soft(input.date).toBeDisabled();
          await expect.soft(input.time).toBeDisabled();
        }
        await expect.soft(input.date).toHaveValue(value.date_value);
        await expect.soft(input.time).toHaveValue(value.time_value);
        break;

      case RecordeditInputType.FILE:
        if (typeof value !== 'string') return;

        input = RecordeditLocators.getTextFileInputForAColumn(page, name, formNumber);
        if (allDisabled) {
          await expect.soft(inputControl).toHaveClass(/input-disabled/);
        }
        await expect.soft(input).toHaveText(value);
        break;

      default:
        if (typeof value !== 'string') return;

        if (inputType === RecordeditInputType.LONGTEXT || inputType === RecordeditInputType.MARKDOWN) {
          input = RecordeditLocators.getTextAreaForAColumn(page, name, formNumber)
        } else {
          input = RecordeditLocators.getInputForAColumn(page, name, formNumber);
        }
        if (allDisabled) {
          await expect.soft(input).toBeDisabled();
        }
        await expect.soft(input).toHaveValue(value);
        break;
    }

    formNumber++;
  }


};


type TestSubmissionParams = {
  tableDisplayname: string,
  resultColumnNames: string[],
  /**
   * the caller should properly handle assets. so if there are some asset columns that
   * we're not uploading in the CI, the caller should skip their values and not this function.
   */
  resultRowValues: RecordsetRowValue[]
}

export const testSubmission = async (page: Page, params: TestSubmissionParams, isEditMode?: boolean, timeout?: number) => {
  await RecordeditLocators.getSubmitRecordButton(page).click();
  await expect.soft(AlertLocators.getErrorAlert(page)).not.toBeAttached();

  await expect.soft(ModalLocators.getUploadProgressModal(page)).not.toBeAttached({ timeout: timeout });

  if (params.resultRowValues.length === 1) {
    await page.waitForURL('**/record/**');
    await testRecordMainSectionValues(page, params.resultColumnNames, params.resultRowValues[0]);

  } else {
    const resultset = RecordeditLocators.getRecoreditResultsetTables(page);
    await expect.soft(resultset).toBeVisible();

    const expectedTitle = `${params.resultRowValues.length} ${params.tableDisplayname} records ${isEditMode ? 'updated' : 'created'} successfully`;
    await expect.soft(RecordeditLocators.getPageTitle(page)).toHaveText(expectedTitle);

    await testRecordsetTableRowValues(resultset, params.resultRowValues, true);
  }
}
