import { test, expect, TestInfo } from '@playwright/test';
import { resolve } from 'path';

import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';

import { copyFileToChaiseDir, getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { setInputValue, testRecordeditColumnNames, testSubmission } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';

const testParams = {
  schema_table: 'input-iframe:main',
  columns: [
    { name: 'id', title: 'id', nullok: false },
    { name: 'creator', title: 'iframe input', nullok: false },
  ],
  idColumnName: 'id',
  iframeInputName: 'creator',
  create: {
    modalTitle: 'Select iframe input for new main',
    emptyConfirmText: [
      'You are about to close the popup without setting any values (i.e. no change will be made to the record). Do you still want to proceed?',
      'To set the values, first click Cancel to dismiss this confirmation, then click the appropriate submit button in the popup.',
      'Click OK to close the popup without setting any values.'
    ].join(''),
    id: '1',
    values: {
      creator: 'John Smith',
      file_content: 'the file should have this content.',
      notes: ''
    },
    secondAttemptValues: {
      creator: 'John Smith II',
      file_content: 'actually the content should be this one.',
      notes: '["note 1","note 2"]'
    },
    submission: {
      tableDisplayname: 'main',
      resultColumnNames: ['id', 'creator', 'notes'],
      resultRowValues: [['1', 'John Smith II', 'note 1, note 2']]
    }
  },
  edit: {
    modalTitle: 'Select iframe input for main: 1',
    id: '1',
    existingValues: {
      creator: 'John Smith II',
      file_content: 'actually the content should be this one.',
      notes: '["note 1","note 2"]'
    },
    newValues: {
      creator: 'Kylan Gentry',
      file_content: 'new file content',
      // testing clearing the value
      notes: ''
    },
    submission: {
      tableDisplayname: 'main',
      // notes has been cleared, so it will not be offered.
      resultColumnNames: ['id', 'creator'],
      resultRowValues: [['1', 'Kylan Gentry']]
    }
  }
}


test.describe('input-iframe support in recordedit', () => {

  test.beforeAll(() => {
    copyIframeToLocation();
  });

  test('create mode', async ({ page, baseURL }, testInfo) => {
    const iframeInput = RecordeditLocators.getIframeFieldProps(page, testParams.iframeInputName);
    const iframeFieldModal = ModalLocators.getIframeFieldModal(page);
    const iframeFieldModalAlert = AlertLocators.getErrorAlert(iframeFieldModal);
    const iframePage = page.frameLocator('iframe');
    const iframeElementProps = RecordeditLocators.getInputIframeTestProps(iframePage);

    await test.step('should load the page and show the proper inputs.', async () => {
      await page.goto(getRecordeditURL(baseURL, testInfo));
      await RecordeditLocators.waitForRecordeditPageReady(page);
      await testRecordeditColumnNames(page, testParams.columns);
    });

    await test.step('proper input should be offered for the column with "input_iframe"', async () => {
      await expect.soft(iframeInput.container).toBeVisible();
    });

    await test.step('clicking on the input should open up the iframe popup', async () => {
      await iframeInput.popupButton.click();

      await expect.soft(iframeFieldModal).toBeVisible();
      await expect.soft(ModalLocators.getModalTitle(iframeFieldModal)).toHaveText(testParams.create.modalTitle);

      // make sure the spinner is hidden
      await expect.soft(ModalLocators.getIframeFieldModalSpinner(iframeFieldModal)).not.toBeAttached();
    });

    await test.step('closing the iframe without submitting should show an error', async () => {
      const confirm = ModalLocators.getIframeFieldCloseConfirmModal(page);
      await ModalLocators.getCloseBtn(iframeFieldModal).click();

      await expect.soft(iframeFieldModal).toBeVisible();
      await expect.soft(confirm).toBeVisible();
      await expect.soft(ModalLocators.getModalText(confirm)).toHaveText(testParams.create.emptyConfirmText);

      await ModalLocators.getCancelButton(confirm).click();
      await expect.soft(confirm).not.toBeAttached();

      await expect.soft(iframeFieldModal).toBeVisible();
    });

    await test.step('the iframe should be able to show alerts in the popup', async () => {
      await expect.soft(iframeElementProps.alertButton).toBeVisible();

      await iframeElementProps.alertButton.click();
      await expect.soft(iframeFieldModalAlert).toHaveText('ErrorThis alert should be displayed on the popup.');
      await AlertLocators.getAlertCloseButton(iframeFieldModalAlert).click();
      await expect.soft(iframeFieldModalAlert).not.toBeAttached();
    });

    await test.step('submitting iframe data without providing all the information should show an alert', async () => {
      await iframeElementProps.submitButton.click();
      await expect.soft(iframeFieldModalAlert).toBeVisible();
      await AlertLocators.getAlertCloseButton(iframeFieldModalAlert).click();
      await expect.soft(iframeFieldModalAlert).not.toBeAttached();
    });

    await test.step('submitting iframe data after adding all the information should close the modal and show the input.', async () => {
      await setIframeInputValues(iframeElementProps, testParams.create.values);
      await iframeElementProps.submitButton.click();

      // modal has been closed
      await expect.soft(iframeFieldModal).not.toBeAttached();

      // the data is displayed properly
      await expect.soft(iframeInput.display).toHaveText(testParams.create.values.creator);

    });

    await test.step('clicking on the input should open the modal with the previous values.', async () => {
      await iframeInput.popupButton.click();

      await expect.soft(iframeFieldModal).toBeVisible();
      await expect.soft(ModalLocators.getModalTitle(iframeFieldModal)).toHaveText(testParams.create.modalTitle);
      // make sure the spinner is hidden
      await expect.soft(ModalLocators.getIframeFieldModalSpinner(iframeFieldModal)).not.toBeAttached();

      // test the values
      await expect.soft(iframeElementProps.creator).toHaveValue(testParams.create.values.creator);
      await expect.soft(iframeElementProps.file_content).toHaveValue(testParams.create.values.file_content);
      await expect.soft(iframeElementProps.notes).toHaveValue(testParams.create.values.notes);

      // change the values and submit
      await setIframeInputValues(iframeElementProps, testParams.create.secondAttemptValues);
      await iframeElementProps.submitButton.click();
      await expect.soft(iframeFieldModal).not.toBeAttached();

      // the data is displayed properly
      await expect.soft(iframeInput.display).toHaveText(testParams.create.secondAttemptValues.creator);
    });

    await test.step('submitting the form should save the record.', async () => {
      await setInputValue(page, 1, testParams.idColumnName, testParams.idColumnName, RecordeditInputType.TEXT, testParams.create.id);
      await testSubmission(page, testParams.create.submission);
    });

  });


  test('edit mode', async ({ page, baseURL }, testInfo) => {
    const iframeInput = RecordeditLocators.getIframeFieldProps(page, testParams.iframeInputName);
    const iframeFieldModal = ModalLocators.getIframeFieldModal(page);
    const iframePage = page.frameLocator('iframe');
    const iframeElementProps = RecordeditLocators.getInputIframeTestProps(iframePage);

    await test.step('should load the page and show the proper inputs.', async () => {
      await page.goto(getRecordeditURL(baseURL, testInfo, 'id=1'));
      await RecordeditLocators.waitForRecordeditPageReady(page);
      await testRecordeditColumnNames(page, testParams.columns);
    });

    await test.step('proper input with proper values should be offered for the column with "input_iframe"', async () => {
      await expect.soft(iframeInput.container).toBeVisible();
      await expect.soft(iframeInput.display).toHaveText(testParams.edit.existingValues.creator);
    });

    await test.step('clicking on the input should open the modal with the previous values', async () => {
      await iframeInput.popupButton.click();

      await expect.soft(iframeFieldModal).toBeVisible();
      await expect.soft(ModalLocators.getModalTitle(iframeFieldModal)).toHaveText(testParams.edit.modalTitle);

      // make sure the spinner is hidden
      await expect.soft(ModalLocators.getIframeFieldModalSpinner(iframeFieldModal)).not.toBeAttached();

      await expect.soft(iframeElementProps.creator).toHaveValue(testParams.edit.existingValues.creator);
      await expect.soft(iframeElementProps.file_content).toHaveValue(testParams.edit.existingValues.file_content);
      await expect.soft(iframeElementProps.notes).toHaveValue(testParams.edit.existingValues.notes);
    });

    await test.step('user should be able to update and submit the iframe data', async () => {
      await setIframeInputValues(iframeElementProps, testParams.edit.newValues);
      await iframeElementProps.submitButton.click();
      await expect.soft(iframeFieldModal).not.toBeAttached();

      await expect.soft(iframeInput.display).toHaveText(testParams.edit.newValues.creator);
    });

    await test.step('submitting the form should save the record.', async () => {
      await testSubmission(page, testParams.edit.submission);
    });

  });


});


/********************** helper functions ************************/

const getRecordeditURL = (baseURL: string | undefined, testInfo: TestInfo, filter?: string) => {
  return `${baseURL}/recordedit/#${getCatalogID(testInfo.project.name)}/${testParams.schema_table}/${filter ? filter : ''}`;
}

/**
 * copy the iframe example into proper location
 */
const copyIframeToLocation = () => {
  const iframeLocation = resolve(__dirname, './../../../utils/input-iframe-test.html');
  copyFileToChaiseDir(iframeLocation, 'input-iframe-test.html');
}

const setIframeInputValues = async (iframeElementProps: any, values: any) => {
  await iframeElementProps.creator.clear();
  await iframeElementProps.creator.fill(values.creator);
  await iframeElementProps.file_content.clear();
  await iframeElementProps.file_content.fill(values.file_content);
  await iframeElementProps.notes.clear();
  await iframeElementProps.notes.fill(values.notes);
}
