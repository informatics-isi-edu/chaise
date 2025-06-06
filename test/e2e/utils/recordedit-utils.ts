import test, { expect, Locator, Page, TestInfo } from '@playwright/test';
import { execSync } from 'child_process';
import { resolve } from 'path';
import moment from 'moment';

// locators
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import PageLocators from '@isrd-isi-edu/chaise/test/e2e/locators/page';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { APP_NAMES, UPLOAD_FOLDER } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { RecordsetRowValue, testRecordsetTableRowValues } from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';
import { testRecordMainSectionValues } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';
import { clickNewTabLink, generateChaiseURL, testTooltip } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

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
      execSync(`perl -e 'print \'1\' x ${f.size}' > ${path}`);
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
  /**
   * how many rows are visible in the initial fk picker.
   */
  modal_num_rows: number,
  /**
   * the index of the option that we should choose
   */
  modal_option_index: number,
  /**
   * the rowname of the selected option
   */
  rowName?: string
};

/**
 * clear the value of an input by clicking on the "x" button.
 *
 * Notes:
 *  - this function assumes the input already has a value and doesn't double check.
*   - in most cases it will click on the "x" for the input.
*   - in case of arrays, it will click on the "delete" icons until there aren't any.
 */
export const clearInputValue = async (
  page: Page, formNumber: number, name: string, displayname: string, inputType: RecordeditInputType,
) => {
  switch (inputType) {
    case RecordeditInputType.FK_DROPDOWN:
    case RecordeditInputType.FK_POPUP:
      const fkBtn = RecordeditLocators.getForeignKeyInputClear(page, displayname, formNumber);
      await fkBtn.click();
      break;
    case RecordeditInputType.TIMESTAMP:
      const timestampBtns = RecordeditLocators.getTimestampInputsForAColumn(page, name, formNumber);
      // we have to remove the date first, otherwise time will keep showing 00:00:00
      await timestampBtns.dateRemoveBtn.click();
      await timestampBtns.timeRemoveBtn.click();
      break;
    case RecordeditInputType.ARRAY:
      const elems = RecordeditLocators.getArrayFieldElements(page, name, formNumber);
      while (await elems.removeItemButtons.count() > 0) {
        await elems.removeItemButtons.nth(0).click();
      }
      break;
    default:
      const btn = RecordeditLocators.getInputRemoveButton(page, name, formNumber);
      await btn.click();
      break;
  }
}

/**
 * chagne the input value.
 *
 * Notes:
 *  - If the given value is invalid, this test will not proceed.
 *  - If you want to clear an input, we recommend calling `clearInputValue` instead.
 *
 * @returns
 */
export const setInputValue = async (
  page: Page, formNumber: number, name: string, displayname: string, inputType: RecordeditInputType,
  valueProps: SetInputValueProps | SetInputValueProps[], arrayBaseType?: RecordeditInputType
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

      if (valueProps.tooltip) {
        // when we select a file, the file button remains in focus, so we have to hover on some other element first
        await RecordeditLocators.getRequiredInfoEl(page).hover();
        await testTooltip(fileInputBtn, valueProps.tooltip, APP_NAMES.RECORDEDIT, true);
      }
      break;

    case RecordeditInputType.ARRAY:
      if (!Array.isArray(valueProps) || arrayBaseType === undefined) return;
      const elems = RecordeditLocators.getArrayFieldElements(page, name, formNumber);

      // remove the existing value if there are any
      while (await elems.removeItemButtons.count() > 0) {
        await elems.removeItemButtons.nth(0).click();
      }

      // add the values one by one.
      for (const val of valueProps) {
        const addItemName = RecordeditLocators.getArrayInputName(name, -1);
        const addOrDiscardMessage = 'Click \'Add\' to include the value or clear the entry to discard.';
        const addItemError = RecordeditLocators.getErrorMessageForAColumn(page, addItemName, formNumber, true);

        await setInputValue(page, formNumber, addItemName, displayname, arrayBaseType, val);
        await expect.soft(addItemError).toBeVisible();
        await expect.soft(addItemError).toHaveText(addOrDiscardMessage);
        await elems.addItemButton.click();
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
  disabled: boolean, valueProps?: SetInputValueProps | SetInputValueProps[], arrayBaseType?: RecordeditInputType
) => {
  let input;
  const inputControl = RecordeditLocators.getInputControlForAColumn(page, name, formNumber);
  switch (inputType) {
    case RecordeditInputType.BOOLEAN:
      input = RecordeditLocators.getDropdownElementByName(page, name, formNumber);
      await expect.soft(input).toBeVisible();
      if (disabled) {
        await expect.soft(inputControl).toContainClass('input-disabled');
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
    case RecordeditInputType.FK_DROPDOWN:
      input = RecordeditLocators.getForeignKeyInputDisplay(page, displayname, formNumber);
      await expect.soft(input).toBeVisible();
      if (disabled) {
        await expect.soft(input).toContainClass('input-disabled');
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
        await expect.soft(inputControl).toContainClass('input-disabled');
      }

      if (typeof valueProps !== 'string') return;
      await expect.soft(input).toHaveText(valueProps);
      break;

    case RecordeditInputType.ARRAY:
      if (!Array.isArray(valueProps) || arrayBaseType === undefined) return;

      for (const [index, val] of valueProps.entries()) {
        const itemName = RecordeditLocators.getArrayInputName(name, index);
        await testInputValue(page, formNumber, itemName, displayname, arrayBaseType, disabled, val);
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
 * @param displayType the display type (boolean, fk, timestamp, upload, 'any other string')
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

/**
 * click on the submit button and test that it works correctly. handles both single and multi create/edit.
 * @param page
 * @param params
 * @param isEditMode
 * @param timeout overrides the default timeout. useful when there are assets in the form.
 */
export const testSubmission = async (page: Page, params: TestSubmissionParams, isEditMode?: boolean, timeout?: number) => {
  await RecordeditLocators.getSubmitRecordButton(page).click();

  try {
    await expect(AlertLocators.getErrorAlert(page)).not.toBeAttached();
  } catch (exp) {
    // provide more information about what went wrong
    const alertContent = await AlertLocators.getErrorAlert(page).textContent();
    expect(alertContent).toEqual('');
    return;
  }

  await expect.soft(RecordeditLocators.getSubmitSpinner(page)).not.toBeAttached({ timeout: timeout });
  await expect.soft(ModalLocators.getUploadProgressModal(page)).not.toBeAttached({ timeout: timeout });

  if (params.resultRowValues.length === 1) {
    await page.waitForURL('**/record/**', { timeout: timeout });
    await testRecordMainSectionValues(page, params.resultColumnNames, params.resultRowValues[0]);

  } else {
    const resultset = RecordeditLocators.getRecoreditResultsetTables(page);
    await expect.soft(resultset).toBeVisible({ timeout: timeout });

    const expectedTitle = `${params.resultRowValues.length} ${params.tableDisplayname} records ${isEditMode ? 'updated' : 'created'} successfully`;
    await expect.soft(RecordeditLocators.getPageTitle(page)).toHaveText(expectedTitle);

    await testRecordsetTableRowValues(resultset, params.resultRowValues, true);
  }
}

/**
 * run the validation tests and make sure extra features for the input work
 *
 * used by testFormPresentationAndValidation. I extracted this into a function so we can recursively call it for arrays.
 * @private
 */
const _testInputValidationAndExtraFeatures = async (
  page: Page, formNumber: number, name: string, displayname: string, inputType: RecordeditInputType, arrayBaseType?: RecordeditInputType,
  existingValue?: SetInputValueProps | SetInputValueProps[], fkPopupTitle?: string
) => {
  const cellError = RecordeditLocators.getErrorMessageForAColumn(page, name, formNumber);

  switch (inputType) {
    case RecordeditInputType.ARRAY:
      const itemName = RecordeditLocators.getArrayInputName(name, -1);
      if (arrayBaseType) {
        await _testInputValidationAndExtraFeatures(page, formNumber, itemName, displayname, arrayBaseType);
      }
      break;

    case RecordeditInputType.JSON:
    case RecordeditInputType.JSONB:
      const jsonInput = RecordeditLocators.getInputForAColumn(page, name, formNumber);

      await test.step('should allow any valid JSON values.', async () => {
        const validJSONValues = [
          { stringVal: '{}', description: 'empty object' },
          { stringVal: '{\"name\":\"tester\"}', description: 'object' },
          { stringVal: '6534.9987', description: 'number' },
          { stringVal: 'null', description: 'null' },
          { stringVal: '\"          \"', description: 'string of spaces' }
        ];

        for await (const val of validJSONValues) {
          await jsonInput.clear();
          await jsonInput.fill(val.stringVal);
          await expect.soft(jsonInput, val.description).toHaveValue(val.stringVal);
          await expect.soft(cellError, val.description).not.toBeAttached();
          await jsonInput.clear();
        }
      });

      await test.step('should not allow invalid JSON values', async () => {
        const invalidJSONValues = [
          { stringVal: '{', description: 'only {' },
          { stringVal: '{name\":\"tester\"}', description: 'missing double qoute' },
          { stringVal: '          ', description: 'empty' }
        ];

        for await (const val of invalidJSONValues) {
          await jsonInput.clear();
          await jsonInput.fill(val.stringVal);
          await expect.soft(jsonInput, val.description).toHaveValue(val.stringVal);
          await expect.soft(cellError, val.description).toBeVisible();
          await expect.soft(cellError, val.description).toHaveText('Please enter a valid JSON value.');
          await jsonInput.clear();
        }
      });
      break;

    case RecordeditInputType.MARKDOWN:
      const markdownProps = RecordeditLocators.getMarkdownElements(page, name, formNumber);

      await test.step('should render markdown with inline preview and full preview button.', async () => {
        const markdownTestParams = [{
          input: 'RBK Project ghriwvfw nwoeifwiw qb2372b wuefiquhf pahele kabhi na phelke kabhiy gqeequhwqh',
          html: '<h3>RBK Project ghriwvfw nwoeifwiw qb2372b wuefiquhf pahele kabhi na phelke kabhiy gqeequhwqh</h3>\n',
          title: 'Heading'
        }, {
          input: 'E15.5 embryonic kidneys for sections\n' +
            '- E18.5 embryonic kidneys for cDNA synthesis\n' +
            '- Sterile PBS\n' +
            '- QIAShredder columns (Qiagen, cat no. 79654)\n' +
            '- DEPC-Treated Water',
          html: '<ul>\n' +
            '<li>E15.5 embryonic kidneys for sections</li>\n' +
            '<li>E18.5 embryonic kidneys for cDNA synthesis</li>\n' +
            '<li>Sterile PBS</li>\n' +
            '<li>QIAShredder columns (Qiagen, cat no. 79654)</li>\n' +
            '<li>DEPC-Treated Water</li>\n' +
            '</ul>\n',
          title: 'Unordered List'
        }, {
          // eslint-disable-next-line max-len
          input: 'This is bold text. nuf2uh3498hcuh23uhcu29hh  nfwnfi2nfn k2mr2ijri. Strikethrough wnnfw nwn wnf wu2h2h3hr2hrf13hu u 2u3h u1ru31r 1n3r uo13ru1ru',
          // eslint-disable-next-line max-len
          html: '<p><strong>This is bold text. nuf2uh3498hcuh23uhcu29hh  nfwnfi2nfn k2mr2ijri. Strikethrough wnnfw nwn wnf wu2h2h3hr2hrf13hu u 2u3h u1ru31r 1n3r uo13ru1ru</strong></p>\n',
          title: 'Bold'
        }, {
          // eslint-disable-next-line max-len
          input: 'This is italic text fcj2ij3ijjcn 2i3j2ijc3roi2joicj. Hum ja rahal chi gaam ta pher kail aaib. Khana kha ka aib rehal chi parson tak.',
          // eslint-disable-next-line max-len
          html: '<p><em>This is italic text fcj2ij3ijjcn 2i3j2ijc3roi2joicj. Hum ja rahal chi gaam ta pher kail aaib. Khana kha ka aib rehal chi parson tak.</em></p>\n',
          title: 'Italic'
        }, {
          input: '~~Strikethrough wnnfw nwn wnf wu2h2h3hr2hrf13hu u 2u3h u1ru31r 1n3r uo13ru1ru~~',
          html: '<p><s>Strikethrough wnnfw nwn wnf wu2h2h3hr2hrf13hu u 2u3h u1ru31r 1n3r uo13ru1ru</s></p>\n',
          title: ''
        }, {
          input: 'X^2^+Y^2^+Z^2^=0',
          html: '<p>X<sup>2</sup>+Y<sup>2</sup>+Z<sup>2</sup>=0</p>\n',
          title: ''
        }, {
          input: '[[RID]]',
          html: '<p><a href="/id/RID">RID</a></p>\n',
          title: ''
        }];

        const mdInput = RecordeditLocators.getInputForAColumn(page, name, formNumber);
        await mdInput.clear();
        for await (const param of markdownTestParams) {
          //if title defined found for markdown elements then send click command
          if (param.title) {
            const mdOption = markdownProps.getButton(param.title);
            await expect.soft(mdOption).toBeVisible();
            await mdOption.click();
          }

          // .fill will replace the content but we want to append to the content, so using .pressSequentially instead
          await mdInput.pressSequentially(param.input);

          // inline preview
          await markdownProps.previewButton.click();
          await expect.soft(markdownProps.previewContent).toBeVisible();
          expect.soft(await markdownProps.previewContent.innerHTML()).toEqual(param.html);
          await markdownProps.previewButton.click();
          await expect.soft(markdownProps.previewContent).not.toBeAttached();

          // modal preview
          const modal = ModalLocators.getMarkdownPreviewModal(page);
          await markdownProps.fullScreenButton.click();
          await expect.soft(modal).toBeVisible();
          const modalContent = ModalLocators.getMarkdownPreviewContent(modal);
          await expect.soft(modalContent).toBeVisible();
          expect.soft(await modalContent.innerHTML()).toEqual(param.html);

          await ModalLocators.getCloseBtn(modal).click();
          await expect.soft(modal).not.toBeAttached();

          await mdInput.clear();
        }
      });

      await test.step('help button should open the help page', async () => {
        const newPage = await clickNewTabLink(markdownProps.helpButton);
        await newPage.waitForURL('**/help/?page=chaise%2Fmarkdown-help');
        await expect.soft(PageLocators.getHelpPageMainTable(newPage)).toBeVisible();
        await newPage.close();
      });
      break;

    case RecordeditInputType.FK_POPUP:
      const displayedValue = RecordeditLocators.getForeignKeyInputDisplay(page, displayname, formNumber);
      const rsModal = ModalLocators.getForeignKeyPopup(page);

      if (typeof existingValue === 'string') {
        // before clearing the value, ensure the selected row has the right tooltip in the fk input modal first
        await test.step('check the tooltip of the selected row in the modal before clearing the value', async () => {
          await RecordeditLocators.getForeignKeyInputButton(page, displayname, formNumber).click();
          await expect.soft(rsModal).toBeVisible();

          // In the multi edit spec, we have 2 forms
          //   in the 1st form, the 1st row is selected
          //   in the 2nd form, the 3rd row is selected
          const selectedRowIndex = formNumber === 1 ? 0 : 2;
          await testTooltip(RecordsetLocators.getRowSelectButton(rsModal, selectedRowIndex), 'Selected', APP_NAMES.RECORDSET, true);

          await ModalLocators.getCloseBtn(rsModal).click();
          await expect.soft(rsModal).not.toBeAttached();
        });

        // value should be unchanged from previous test since the modal was closed with no selection made
        await test.step('clicking the "x" should remove the value in the foreign key field.', async () => {
          await expect.soft(displayedValue).toHaveText(existingValue);
          await RecordeditLocators.getForeignKeyInputClear(page, displayname, formNumber).click();
          await expect.soft(displayedValue).toHaveText('Select a value');
        });
      }

      await test.step('popup selector', async () => {
        await test.step('should have the proper title.', async () => {
          await RecordeditLocators.getForeignKeyInputButton(page, displayname, formNumber).click();
          await expect.soft(rsModal).toBeVisible();
          await expect.soft(RecordsetLocators.getRows(rsModal)).not.toHaveCount(0);
          if (fkPopupTitle) {
            await expect.soft(ModalLocators.getModalTitle(rsModal)).toContainText(fkPopupTitle);
          }
        });

        await test.step('closing without selecting should not select any values.', async () => {
          await ModalLocators.getCloseBtn(rsModal).click();
          await expect.soft(rsModal).not.toBeAttached();
          await expect.soft(displayedValue).toHaveText('Select a value');
        });
      });
      break;

    case RecordeditInputType.DATE:
      const dateInputProps = RecordeditLocators.getDateInputsForAColumn(page, name, formNumber);
      const dateRemoveBtn = RecordeditLocators.getInputRemoveButton(page, name, formNumber);

      await test.step('should complain about invalid date values.', async () => {
        // testing partial input
        await dateInputProps.date.clear();
        await dateInputProps.date.fill('1234-1');
        await expect.soft(cellError).toHaveText('Please enter a valid date value in YYYY-MM-DD format.');

        // clear the input and see if the error disapears
        // (.clear() wasn't working consistently)
        await dateRemoveBtn.click();
        await expect.soft(cellError).not.toBeAttached();
      });

      await test.step('"Today" button should enter the current date into the input', async () => {
        await dateInputProps.todayBtn.click();
        await expect.soft(dateInputProps.date).toHaveValue(moment().format('YYYY-MM-DD'));
      });

      await test.step('"clear" button should clear the date.', async () => {
        await expect.soft(dateRemoveBtn).toBeVisible();
        await dateRemoveBtn.click();
        await expect.soft(dateInputProps.date).toHaveValue('');
        await expect.soft(dateRemoveBtn).not.toBeAttached();
      });

      break;

    case RecordeditInputType.TIMESTAMP:
      const timestampProps = RecordeditLocators.getTimestampInputsForAColumn(page, name, formNumber);
      const timeErrorMessage = 'Please enter a valid time value in 24-hr HH:MM:SS format.';
      const dateErrorMessage = 'Please enter a valid date value in YYYY-MM-DD format.';

      await test.step('should complain about invalid values and allow valid ones.', async () => {
        await timestampProps.date.clear();
        await timestampProps.time.clear();

        // the test cases below are only checking time, so we should first add a proper date.
        await timestampProps.date.fill('2016-01-01');

        // If user enters an invalid time an error msg should appear
        await timestampProps.time.fill('24:12:00');
        await expect.soft(cellError).toHaveText(timeErrorMessage);

        // If user enters a valid time, then error msg should disappear
        await timestampProps.time.fill('12:00:00');
        await expect.soft(cellError).not.toBeAttached();

        // users can enter 1 digit in any place
        await timestampProps.time.clear();
        await timestampProps.time.fill('2:2:2');
        await expect.soft(cellError).not.toBeAttached();

        // users can enter just the hours
        await timestampProps.time.clear();
        await timestampProps.time.fill('08');
        await expect.soft(cellError).not.toBeAttached();

        // users can enter just the hours and minutes
        await timestampProps.time.clear();
        await timestampProps.time.fill('2:10');
        await expect.soft(cellError).not.toBeAttached();

        // users can enter 0 for the time
        await timestampProps.time.clear();
        await timestampProps.time.fill('00:00:00');
        await expect.soft(cellError).not.toBeAttached();

        // Invalid date + good time = error
        // If user enters a valid time but no date, an error msg should appear
        await timestampProps.date.clear();
        await timestampProps.time.clear();
        await timestampProps.time.fill('12:00:00');
        await expect.soft(cellError).toHaveText(dateErrorMessage);

        // Good date + good time = no error
        // Now, if user enters a valid date, then no error message should appear
        await timestampProps.date.fill('2016-01-01');
        await expect.soft(cellError).not.toBeAttached();

        // Good date + clear time = no error
        await timestampProps.time.clear();
        await expect.soft(cellError).not.toBeAttached();

      });

      await test.step('"Now" button should enter the current date and time', async () => {
        const nowObject = moment();
        const nowDate = nowObject.format('YYYY-MM-DD');
        await timestampProps.nowBtn.click();
        await expect.soft(timestampProps.date).toHaveValue(nowDate);

        await expect.soft(timestampProps.time).not.toHaveValue('');
        const UITime = await timestampProps.time.getAttribute('value') as string;
        const UIObject = moment(nowDate + UITime, 'YYYY-MM-DDTHH:mm:ssZ');
        expect.soft(UIObject.diff(nowObject, 'minutes')).toBeLessThan(1);
      });

      await test.step('"clear" button should clear both time and date.', async () => {
        await timestampProps.clearBtn.click();
        await expect.soft(timestampProps.date).toHaveValue('');
        await expect.soft(timestampProps.time).toHaveValue('');
      });

      break;

    case RecordeditInputType.INT_2:
    case RecordeditInputType.INT_4:
    case RecordeditInputType.INT_8:
      const intInput = RecordeditLocators.getInputForAColumn(page, name, formNumber);

      await test.step('should complain about invalid values and allow valid ones.', async () => {
        // a non-number value
        await intInput.clear();
        await intInput.fill('1j2yu');
        await expect.soft(cellError).toHaveText('Please enter a valid integer value.');

        await intInput.clear();
        await expect.soft(cellError).not.toBeAttached();

        // float number
        await intInput.fill('12.1');
        await expect.soft(cellError).toHaveText('Please enter a valid integer value.');

        await intInput.clear();
        await expect.soft(cellError).not.toBeAttached();

        // min and max values
        let invalidMaxNo = '2343243243242414423243242353253253253252352', invalidMinNo = '-2343243243242414423243242353253253253252352';
        if (inputType === RecordeditInputType.INT_2) {
          invalidMaxNo = '8375832757832', invalidMinNo = '-237587565';
        } else if (inputType === RecordeditInputType.INT_4) {
          invalidMaxNo = '3827374576453', invalidMinNo = '-326745374576375';
        }

        await intInput.clear();
        await intInput.fill(invalidMaxNo);
        await expect.soft(cellError).toContainText('This field requires a value less than');

        await intInput.clear();
        await expect.soft(cellError).not.toBeAttached();

        await intInput.fill(invalidMinNo);
        await expect.soft(cellError).toContainText('This field requires a value greater than');

        await intInput.clear();
        await intInput.fill('12')
        await expect.soft(cellError).not.toBeAttached();

        await intInput.clear();
      });
      break;

    case RecordeditInputType.NUMBER:
      const numInput = RecordeditLocators.getInputForAColumn(page, name, formNumber);

      await test.step('should complain about invalid values and allow valid ones.', async () => {
        // a non-number value
        await numInput.clear();
        await numInput.fill('1j2yu');
        await expect.soft(cellError).toHaveText('Please enter a valid decimal value.');

        // float number
        await numInput.clear();
        await numInput.fill('12.1');
        await expect.soft(cellError).not.toBeAttached();

        // int number
        await numInput.clear();
        await numInput.fill('12')
        await expect.soft(cellError).not.toBeAttached();

        await numInput.clear();
        await expect.soft(cellError).not.toBeAttached();
      });
      break;

    case RecordeditInputType.COLOR:
      const colorInput = RecordeditLocators.getInputForAColumn(page, name, formNumber);

      await test.step('should now allow invalid values and allow valid ones.', async () => {
        // an incomplete value
        await colorInput.clear();
        await colorInput.fill('#de');
        // the input won't validate until we focus somewhere else
        await RecordeditLocators.getRequiredInfoEl(page).click();
        await expect.soft(colorInput).toHaveValue(typeof existingValue === 'string' ? existingValue : '#');

        // a valid color
        await colorInput.clear();
        await colorInput.fill('#abcabc');
        await expect.soft(colorInput).toHaveValue('#abcabc');
        await expect.soft(cellError).not.toBeAttached();
      });

      await test.step('color picker popup', async () => {
        // focus somewhere else to make sure the popup is still not open
        await RecordeditLocators.getRequiredInfoEl(page).click();
        // open the popup
        await RecordeditLocators.getColorInputBtn(page, name, formNumber).click();

        const colorPopup = RecordeditLocators.getColorInputPopup(page);
        await expect.soft(colorPopup).toBeVisible();

        // make sure clear btn is offered regardless of null/not-null (just like any other  input)
        const colorClearBtn = RecordeditLocators.getColorInputPopupClearBtn(page);
        await expect.soft(colorClearBtn).toBeVisible();

        const colorPopupInput = RecordeditLocators.getColorInputPopupInput(page);
        await expect.soft(colorPopupInput).toBeVisible();

        // make sure users can use the color popup input
        const colorVal = '#555555';
        await colorPopupInput.clear();
        await colorPopupInput.fill(colorVal);
        await RecordeditLocators.getColorInputPopupSelectBtn(page).click();
        await expect.soft(colorPopup).not.toBeAttached();

        await expect.soft(colorInput).toHaveValue(colorVal);
        expect.soft(await RecordeditLocators.getColorInputBackground(page, name, formNumber)).toEqual(colorVal);

      });

      break;
  }
}


export type TestFormPresentationAndValidation = {
  /**
   * describe what this test is about.
   */
  description: string,
  schemaName: string,
  tableName: string,
  tableDisplayname: string,
  tableComment?: string,
  /**
   * applicaple only to edit mode
   */
  rowNames?: string[],

  columns: {
    name: string,
    displayname: string,
    type: RecordeditInputType,
    arrayBaseType?: RecordeditInputType,
    isRequired?: boolean,
    comment?: string,
    inlineComment?: string,
    disabled?: boolean,
    skipValidation?: boolean,
  }[],

  /**
   * the new values that should be used for the inputs.
   *
   */
  inputs: {
    [colName: string]: SetInputValueProps | SetInputValueProps[]
  }[],

  /**
   * existing values in the form
   */
  values?: {
    [colName: string]: SetInputValueProps | SetInputValueProps[]
  }[]
}

/**
 * can be used to test the recordedit page. works for single or multi, create or edit.
 *
 * Notes:
 * - If the input has an existing value, and no input, we will skip the validation as it will manipulate the value.
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
    if (isEditMode && params.rowNames && params.rowNames.length === 1) {
      pageTitle = `Edit ${params.tableDisplayname}: ${params.rowNames[0]}`;
    } else {
      const appendText = params.inputs.length > 1 ? 'records' : 'record';
      const action = isEditMode ? 'Edit' : 'Create';
      pageTitle = `${action} ${params.inputs.length} ${params.tableDisplayname} ${appendText}`;
    }

    const titleEl = RecordeditLocators.getPageTitle(page);
    await expect.soft(titleEl).toHaveText(pageTitle);

    const linkEl = RecordeditLocators.getPageTitleLink(page);
    const expectedLink = generateChaiseURL(APP_NAMES.RECORDSET, params.schemaName, params.tableName, testInfo, baseURL) + '?pcid='

    expect.soft(await linkEl.getAttribute('href')).toContain(expectedLink);

    if (params.tableComment) {
      /**
       * the default "hover element" that this function will use for recordedit is the "required info" which is directly below the title.
       * when the title tooltip is displayed, the tooltip is blocking the "required info", that's why in here we're passing our own hover element.
       */
      await testTooltip(linkEl, params.tableComment, APP_NAMES.RECORDEDIT, true, titleEl);
    }
  });

  await test.step('should have the corret head title.', async () => {
    let pageTitle;
    if (isEditMode) {
      pageTitle = `Edit ${params.tableDisplayname}`;
      if (params.rowNames && params.rowNames.length === 1) {
        pageTitle += `: ${params.rowNames[0]}`;
      }
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
    const formNumber = recordIndex + 1;

    for await (const col of params.columns) {
      await test.step(`record ${formNumber}, column ${col.name} (${col.type}${col.arrayBaseType ? ' ' + col.arrayBaseType : ''}), `, async () => {
        const existingValue = _getColumnValue(recordIndex, col.name);
        const newValue = _getColumnInput(recordIndex, col.name);
        const skipValidation = col.skipValidation || (!!existingValue && !newValue);

        // check the input and value
        await test.step('show the input with the correct value', async () => {
          await testInputValue(page, formNumber, col.name, col.displayname, col.type, !!col.disabled, existingValue);
        });

        if (col.disabled) return;

        // test the validators and extra features if needed
        if (!skipValidation) {
          let fkPopupTitle;
          if (col.type === RecordeditInputType.FK_POPUP) {
            fkPopupTitle = `Select ${col.displayname} for `;
            if (isEditMode) {
              fkPopupTitle += `${params.tableDisplayname}: `;
              if (params.rowNames && params.rowNames[recordIndex]) {
                fkPopupTitle += `${params.rowNames[recordIndex]}`;
              }
            } else {
              fkPopupTitle += `new ${params.tableDisplayname}`;
            }
          }
          await _testInputValidationAndExtraFeatures(
            page, formNumber, col.name, col.displayname, col.type, col.arrayBaseType, existingValue, fkPopupTitle
          );
        }

        // set the value
        if (newValue === undefined) return;
        await test.step('set the new value', async () => {
          await setInputValue(page, formNumber, col.name, col.displayname, col.type, newValue, col.arrayBaseType);
        });

      });
    }

  }
}

export type TestCreateRecordsParams = {
  tables: {
    num_files: number,
    presentation: TestFormPresentationAndValidation,
    submission: TestSubmissionParams
  }[]
};

/**
 * can be used for testing create scenario. works for single or multi create.
 * This function will also make sure that we can remove forms.
 *  - if num_files > 0, it will remove the last form.
 *  - otherwise will add an extra form and remove it.
 */
export const testCreateRecords = (usedParams: TestCreateRecordsParams) => {
  for (const params of usedParams.tables) {
    const presentation = params.presentation;

    test(`${presentation.description}`, async ({ page, baseURL }, testInfo) => {
      const numForms = presentation.inputs.length;

      await test.step('open recordedit page', async () => {
        await page.goto(generateChaiseURL(APP_NAMES.RECORDEDIT, presentation.schemaName, presentation.tableName, testInfo, baseURL));
        await RecordeditLocators.waitForRecordeditPageReady(page);
      });

      if (numForms > 1) {
        await test.step('clone more forms', async () => {
          let cnt = 1;
          while (cnt < numForms) {
            await RecordeditLocators.getCloneFormInputSubmitButton(page).click();
            await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(++cnt);
          }
        });
      }

      // test everything related to the form
      await testFormPresentationAndValidation(page, baseURL, testInfo, presentation, false);

      // this test clones the form and then remove the extra one. just to make sure nothing is affected by this.
      await test.step('remove form', async () => {
        // for the tests with file, we want to remove the actual form instead of adding a new one.
        const addExtraForm = params.num_files === 0;

        if (numForms === 1) {
          await test.step('remove button should not be offered when only one form is visible', async () => {
            await expect.soft(RecordeditLocators.getAllDeleteRowButtons(page)).toHaveCount(0);
          });
        }

        if (addExtraForm) {
          await test.step('clone an extra form', async () => {
            await RecordeditLocators.getCloneFormInputSubmitButton(page).click();
            await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(numForms + 1);
            await expect.soft(RecordeditLocators.getAllDeleteRowButtons(page)).toHaveCount(numForms + 1);
          });
        }

        await test.step('remove the last form', async () => {
          const cnt = addExtraForm ? numForms : numForms - 1;
          await RecordeditLocators.getDeleteRowButton(page, cnt).click();
          await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(cnt);
          await expect.soft(RecordeditLocators.getAllDeleteRowButtons(page)).toHaveCount(cnt === 1 ? 0 : cnt);
        });
      });

      await test.step('submit and save the data', async () => {
        let timeout: number | undefined;
        if (params.num_files > 0) {
          timeout = params.num_files * 30 * 1000;
        }
        await testSubmission(page, params.submission, false, timeout);
      });
    });
  }
}
