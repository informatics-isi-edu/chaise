import { execSync } from 'child_process';
import { resolve } from 'path';
import test, { expect, Locator, Page, TestInfo } from '@playwright/test';

import { APP_NAMES, UPLOAD_FOLDER } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import RecordeditLocators, { RecordeditArrayBaseType, RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import { RecordsetRowValue, testRecordsetTableRowValues } from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import { testRecordMainSectionValues } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';
import { testTooltip } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';

export type RecordeditExpectedColumn = {
  name: string,
  title: string,
  nullok?: boolean
};

/**
 * make sure recordedit is showing the correct columns
 */
export const testRecordeditColumnNames = async (container: Locator | Page, columns: RecordeditExpectedColumn[]) => {
  const cols = RecordeditLocators.getAllColumnNames(container)
  await expect.soft(cols).toHaveCount(columns.length);

  let index = 0;
  for (const expectation of columns) {
    const col = cols.nth(index);
    await expect.soft(col).toHaveText(expectation.title);
    const req = RecordeditLocators.getColumnRequiredIcon(col);
    if (expectation.nullok) {
      await expect.soft(req).not.toBeAttached();
    } else {
      await expect.soft(req).toBeVisible();
    }
    index++;
  }
}

export type RecordeditFile = {
  name: string,
  size: number | string,
  path: string,
  skipCreation?: boolean,
  skipDeletion?: boolean,
  tooltip?: string
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

  // TODO why is this not working?
  // if (file.tooltip) {
  //   await testTooltip(fileTextInput, file.tooltip, APP_NAMES.RECORDEDIT, true);
  // }
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
  modal_option_index: number,
  rowName?: string
};

/**
 *
 * expected types: 'timestamp', 'boolean', 'fk', 'fk-dropdown', 'array' , or any other string
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
  page: Page, formNumber: number, name: string, displayname: string, inputType: RecordeditInputType,
  valueProps: SetInputValueProps | SetInputValueProps[], arrayBaseType?: RecordeditArrayBaseType
) => {
  switch (inputType) {
    case RecordeditInputType.BOOLEAN:
      if (typeof valueProps !== 'string') return;

      const dropdown = RecordeditLocators.getDropdownElementByName(page, name, formNumber);
      await selectDropdownValue(dropdown, valueProps);
      await expect.soft(RecordeditLocators.getDropdownText(dropdown)).toHaveText(valueProps);
      break;

    case RecordeditInputType.COLOR:
      if (typeof valueProps !== 'string') return;
      const colorInput = RecordeditLocators.getInputForAColumn(page, name, formNumber);
      await colorInput.clear();
      await colorInput.fill(valueProps);
      // the input won't validate until we press enter or change focus
      await RecordeditLocators.getRequiredInfoEl(page).focus();
      // make sure the displayed value is correct
      await expect.soft(colorInput).toHaveValue(valueProps);
      // make sure the background color is correct
      expect.soft(await RecordeditLocators.getColorInputBackground(page, name, formNumber)).toEqual(valueProps);
      break;

    case RecordeditInputType.FK_POPUP:
      if (typeof valueProps !== 'object' || !(('modal_num_rows' in valueProps) && ('modal_option_index' in valueProps))) {
        return;
      }

      await RecordeditLocators.getForeignKeyInputButton(page, displayname, formNumber).click();
      const rsModal = ModalLocators.getForeignKeyPopup(page);
      await expect.soft(rsModal).toBeVisible();
      await expect.soft(RecordsetLocators.getRows(rsModal)).toHaveCount(valueProps.modal_num_rows);
      await RecordsetLocators.getRowSelectButton(rsModal, valueProps.modal_option_index).click();
      await expect.soft(rsModal).not.toBeAttached();

      if (valueProps.rowName) {
        await expect.soft(RecordeditLocators.getForeignKeyInputDisplay(page, displayname, formNumber)).toHaveText(valueProps.rowName);
      }


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
      await inputs.date.clear();
      await inputs.date.fill(valueProps.date_value);
      await inputs.time.clear();
      await inputs.time.fill(valueProps.time_value);
      break;

    case RecordeditInputType.FILE:
      if (typeof valueProps !== 'object' || !('name' in valueProps)) return;

      const fileInputBtn = RecordeditLocators.getFileInputButtonForAColumn(page, name, formNumber);
      const fileTextInput = RecordeditLocators.getTextFileInputForAColumn(page, name, formNumber);
      await selectFile(valueProps, fileInputBtn, fileTextInput);
      break;

    case RecordeditInputType.ARRAY:
      if (!Array.isArray(valueProps) || arrayBaseType === undefined) return;
      const elems = RecordeditLocators.getArrayFieldElements(page, name, formNumber, 'text');

      // remove the existing value if there are any
      while (await elems.removeItemButtons.count() > 0) {
        await elems.removeItemButtons.nth(0).click();
      }

      // add the values one by one.
      // TODO finalize this
      for (const val of valueProps) {
        switch (arrayBaseType) {
          case RecordeditArrayBaseType.TIMESTAMP:
            if (typeof val !== 'object' || !(('time_value' in val) && ('date_value' in val))) {
              return;
            }
            const inputs = RecordeditLocators.getTimestampInputsForAColumn(page, name, formNumber);
            await inputs.clearBtn.click();
            await inputs.date.clear();
            await inputs.date.fill(val.date_value);
            await inputs.time.clear();
            await inputs.time.fill(val.time_value);

            break;
          case RecordeditArrayBaseType.BOOLEAN:
            break;
          default:
            if (typeof val !== 'string') continue;
            await elems.addItemInput.fill(val);
            await elems.addItemButton.click();
            break;
        }
      }
      break;

    default:
      if (typeof valueProps !== 'string') return;

      const inputEl = RecordeditLocators.getInputForAColumn(page, name, formNumber);
      await inputEl.clear();
      await inputEl.fill(valueProps);
      await expect.soft(inputEl).toHaveValue(valueProps);
      break;
  }
};

/**
 * test the value diplayed for a input on the recordedit form
 */
export const testInputValue = async (
  page: Page, formNumber: number, name: string, displayname: string, inputType: RecordeditInputType,
  disabled: boolean, valueProps?: SetInputValueProps | SetInputValueProps[], arrayBaseType?: RecordeditArrayBaseType
) => {
  let input;
  const inputControl = RecordeditLocators.getInputControlForAColumn(page, name, formNumber);
  switch (inputType) {
    case RecordeditInputType.BOOLEAN:
      input = RecordeditLocators.getDropdownElementByName(page, name, formNumber);
      await expect.soft(input).toBeVisible();
      if (disabled) {
        await expect.soft(inputControl).toHaveClass(/input-disabled/);
      }

      if (typeof valueProps !== 'string') return;
      await expect.soft(input).toHaveText(valueProps);
      break;

    case RecordeditInputType.COLOR:
      input = RecordeditLocators.getColorInputForAColumn(page, name, formNumber);
      await expect.soft(input).toBeVisible();

      if (typeof valueProps !== 'string') return;
      // make sure the displayed value is correct
      await expect.soft(input).toHaveValue(valueProps);
      // make sure the background color is correct
      expect.soft(await RecordeditLocators.getColorInputBackground(page, name, formNumber)).toEqual(valueProps);
      break;

    case RecordeditInputType.FK_POPUP:
      input = RecordeditLocators.getForeignKeyInputDisplay(page, displayname, formNumber);
      await expect.soft(input).toBeVisible();
      if (disabled) {
        await expect.soft(input).toHaveClass(/input-disabled/);
      }

      if (typeof valueProps !== 'string') return;
      await expect.soft(input).toHaveText(valueProps);
      break;

    case RecordeditInputType.TIMESTAMP:
      input = RecordeditLocators.getTimestampInputsForAColumn(page, name, formNumber);
      await expect.soft(input.date).toBeVisible();
      await expect.soft(input.time).toBeVisible();
      if (disabled) {
        await expect.soft(input.date).toBeDisabled();
        await expect.soft(input.time).toBeDisabled();
      }

      if (typeof valueProps !== 'object' || !('date_value' in valueProps) || !('time_value' in valueProps)) return;
      await expect.soft(input.date).toHaveValue(valueProps.date_value);
      await expect.soft(input.time).toHaveValue(valueProps.time_value);
      break;

    case RecordeditInputType.FILE:
      input = RecordeditLocators.getTextFileInputForAColumn(page, name, formNumber);
      await expect.soft(input).toBeVisible();
      if (disabled) {
        await expect.soft(inputControl).toHaveClass(/input-disabled/);
      }

      if (typeof valueProps !== 'string') return;
      await expect.soft(input).toHaveText(valueProps);
      break;

    case RecordeditInputType.ARRAY:
      // TODO support more types
      if (!Array.isArray(valueProps)) return;
      const elems = RecordeditLocators.getArrayFieldElements(page, name, formNumber, 'text');

      let index = 0;
      for (const val of valueProps) {
        if (typeof val !== 'string') continue;
        input = elems.inputs.nth(index);
        if (disabled) {
          await expect.soft(input).toBeDisabled();
        }
        await expect.soft(input).toHaveValue(val);
        index++;
      }

      break;

    default:
      input = RecordeditLocators.getInputForAColumn(page, name, formNumber);
      await expect.soft(input).toBeVisible();
      if (disabled) {
        await expect.soft(input).toBeDisabled();
      }

      if (typeof valueProps !== 'string') return;
      await expect.soft(input).toHaveValue(valueProps);
      break;
  }
}

/**
 * test the values displayed on the forms for a column
 *
 * expectedValues expected type will be different depending on the input type. for all the types expect the following
 * it should be an array of strings.
 * - timestamp: array of objects with date_value and time_value props
 * - array: array of array of texts.
 *
 * NOTE: 'array' only supports array of texts for now.
 *
 * @param name the column name
 * @param displayname the column displayname
 * @param displayType the display type (boolean, fk, timestamp, upload, "any other string")
 * @param allDisabled whether we should test that all the inputs are disabled or not
 * @param expectedValues the expected values
 * @returns
 */
export const testFormValuesForAColumn = async (
  page: Page, name: string, displayname: string, inputType: RecordeditInputType, allDisabled: boolean,
  expectedValues: (SetInputValueProps | SetInputValueProps[])[]
) => {
  let formNumber = 1;
  for (const value of expectedValues) {
    await testInputValue(page, formNumber, name, displayname, inputType, allDisabled, value);
    formNumber++;
  }
};


export type TestSubmissionParams = {
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
  await expect.soft(RecordeditLocators.getSubmitSpinner(page)).not.toBeAttached({ timeout: timeout });

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


export type TestFormPresentationAndValidation = {
  description: string,
  schemaName: string,
  tableName: string,
  tableDisplayname: string,
  tableComment?: string,
  /**
   * applicaple only to single edit mode
   */
  rowName?: string,

  columns: {
    name: string,
    displayname: string,
    type: RecordeditInputType,


    arrayBaseType?: RecordeditArrayBaseType,
    isRequired?: boolean,
    comment?: string,
    inlineComment?: string,

    disabled?: boolean,

    skipValidation?: boolean,
  }[],

  inputs: {
    [colName: string]: SetInputValueProps | SetInputValueProps[]
  }[],

  values?: {
    [colName: string]: SetInputValueProps | SetInputValueProps[]
  }[]
}

/**
 * can be used to test the recordedit page. Currenly only works for single-edit, single-create, or multi-create.
 */
export const testFormPresentationAndValidation = async (
  page: Page, baseURL: string | undefined, testInfo: TestInfo, params: TestFormPresentationAndValidation, isEditMode?: boolean
) => {

  const _getColumnValue = (recordIndex: number, colName: string) => {
    if (Array.isArray(params.values) && params.values.length > recordIndex && typeof params.values[recordIndex][colName] !== 'undefined') {
      return params.values[recordIndex][colName];
    }
    return undefined;
  };

  const _getColumnInput = (recordIndex: number, colName: string) => {
    if (Array.isArray(params.inputs) && params.inputs.length > recordIndex && typeof params.inputs[recordIndex][colName] !== 'undefined') {
      return params.inputs[recordIndex][colName];
    }
    return undefined;
  }

  await test.step('should have the correct page title.', async () => {
    await RecordeditLocators.waitForRecordeditPageReady(page);

    let pageTitle;
    if (isEditMode) {
      pageTitle = `Edit ${params.tableDisplayname}: ${params.rowName}`;
    } else {
      pageTitle = `Create 1 ${params.tableDisplayname} record`;
    }

    await expect.soft(RecordeditLocators.getPageTitle(page)).toHaveText(pageTitle);

    const linkEl = RecordeditLocators.getPageTitleLink(page);
    const expectedLink = `${baseURL}/recordset/#${getCatalogID(testInfo.project.name)}/${params.schemaName}:${params.tableName}?pcid=`;

    expect.soft(await linkEl.getAttribute('href')).toContain(expectedLink);
    if (params.tableComment) {
      await testTooltip(linkEl, params.tableComment, APP_NAMES.RECORDEDIT, true);
    }
  });

  await test.step('should have the corret head title.', async () => {
    let pageTitle;
    if (isEditMode) {
      pageTitle = `Edit ${params.tableDisplayname}: ${params.rowName}`;
    } else {
      pageTitle = `Create new ${params.tableDisplayname}`;
    }
    expect.soft(await page.title()).toContain(pageTitle + ' | ');
  });

  await test.step('should show the proper buttons.', async () => {
    if (isEditMode) {
      await expect.soft(RecordeditLocators.getRecordeditResetButton(page)).toBeVisible();
    } else {
      await expect.soft(RecordeditLocators.getCloneFormInputSubmitButton(page)).toBeVisible();
    }
    const submitBtn = RecordeditLocators.getSubmitRecordButton(page);
    await expect.soft(submitBtn).toBeVisible();
    await expect.soft(submitBtn).toHaveText('Save');
  });

  await test.step('should show the columns in the expected order and mark the required ones.', async () => {
    const columns = RecordeditLocators.getAllColumnNames(page);
    await expect.soft(columns).toHaveCount(params.columns.length);

    for await (const [index, expectedCol] of params.columns.entries()) {
      const col = columns.nth(index);
      await expect.soft(col).toHaveText(expectedCol.displayname);
      const requiredIcon = RecordeditLocators.getColumnRequiredIcon(col);
      const errorMessage = `missmatch required status, index=${index}, name=${expectedCol.name}`;
      if (expectedCol.isRequired) {
        await expect.soft(requiredIcon, errorMessage).toBeVisible();
      } else {
        await expect.soft(requiredIcon, errorMessage).not.toBeVisible();
      }
    }
  });

  await test.step('should properly show the column tooltips and inline tooltips.', async () => {
    const expectedColsWTooltip: number[] = [];
    const expectedInlineComments: string[] = [];
    params.columns.forEach((c, i) => {
      if (c.comment) {
        expectedColsWTooltip.push(i);
      }
      else if (c.inlineComment) {
        expectedInlineComments.push(c.inlineComment);
      }
    });

    // inline comments
    const inlineComments = RecordeditLocators.getColumnInlineComments(page);
    await expect.soft(inlineComments).toHaveCount(expectedInlineComments.length);
    await expect.soft(inlineComments).toHaveText(expectedInlineComments);

    // tooltips
    const colsWithTooltip = RecordeditLocators.getColumnNamesWithTooltip(page);
    await expect.soft(colsWithTooltip).toHaveCount(expectedColsWTooltip.length);
    for (const i of expectedColsWTooltip) {
      await testTooltip(RecordeditLocators.getColumnNameByColumnIndex(page, i), params.columns[i].comment!, APP_NAMES.RECORDEDIT, true);
    }
  });

  for await (const recordIndex of Array.from(Array(params.inputs.length).keys())) {

    if (recordIndex > 0) {
      await test.step('should be able to clone new record', async () => {
        await RecordeditLocators.getCloneFormInputSubmitButton(page).click();
        await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(recordIndex + 1);
      });
    }

    for await (const col of params.columns) {
      await test.step(`record index=${recordIndex}, column ${col.name}, `, async () => {

        // check the input and value
        await test.step('show the input with the correct value', async () => {
          await testInputValue(page, recordIndex + 1, col.name, col.displayname, col.type, !!col.disabled, _getColumnValue(recordIndex, col.name));
        });

        if (col.disabled) return;

        // TODO
        // test the validators and extra features if needed
        // if (!col.skipValidation) {
        // switch (col.type) {
        //   case RecordeditInputType.ARRAY:
        //     // TODO
        //     break;

        //   default:
        //     break;
        // }
        // }

        // set the value
        const newVal = _getColumnInput(recordIndex, col.name);
        if (newVal === undefined) return;

        await test.step('set the new value', async () => {
          await setInputValue(page, recordIndex + 1, col.name, col.displayname, col.type, newVal, col.arrayBaseType);
        });

      });
    }

  }
}


