import { test, expect, TestInfo, Page, Locator } from '@playwright/test';

// locators
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordeditLocators, {
  RecordeditInputType,
} from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';

// utils
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import {
  testRecordsetTableRowValues
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';
import {
  clickNewTabLink,
  generateChaiseURL,
  manuallyTriggerFocus
} from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import {
  EntityRowColumnValues,
  getEntityRowURL,
} from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { setInputValue } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { testRecordMainSectionPartialValues } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';

const testParams = {
  schemaName: 'foreign-key-modal',
  tableName: 'parent_table',
  foreignKeyDisplayname: 'fk1',
  foreignKeyTableName: 'fk1_table',
  modal: {
    title: 'Select fk1 for new parent_table',
    numRows: 3,
    values: [
      ['01', 'fk1 one'],
      ['02', 'fk1 two'],
      ['03', 'fk1 three'],
    ],
    rowViewPaths: [
      [{ column: 'id', value: '01' }],
      [{ column: 'id', value: '02' }],
      [{ column: 'id', value: '03' }],
    ],
    edit: {
      row: 1,
      id: '02',
      name: 'edited fk1 name',
      valuesAfterEdit: [
        ['01', 'fk1 one'],
        ['02', 'edited fk1 name'],
        ['03', 'fk1 three'],
      ],
    },
    delete: {
      row: 1,
      valuesAfterDelete: [
        ['01', 'fk1 one'],
        ['03', 'fk1 three'],
      ],
    },
    create: {
      id: '55555',
      name: 'created fk1 name',
      valuesAfterCreate: [
        ['01', 'fk1 one'],
        ['03', 'fk1 three'],
        ['55555', 'created fk1 name'],
      ],
      recordValues: [
        { id: '01' },
        { id: '03' },
        { id: '55555' },
      ],
    },
  },
};

test('fk modal controls', async ({ page, baseURL }, testInfo: TestInfo) => {
  const modal = ModalLocators.getRecordsetSearchPopup(page);
  const modalParams = testParams.modal;

  await test.step('load the page and open the modal', async () => {
    await page.goto(
      generateChaiseURL(
        APP_NAMES.RECORDEDIT,
        testParams.schemaName,
        testParams.tableName,
        testInfo,
        baseURL
      )
    );
    await RecordeditLocators.waitForRecordeditPageReady(page);

    const disp = testParams.foreignKeyDisplayname;
    const fkInput = RecordeditLocators.getForeignKeyInputButton(page, disp, 1);
    await expect(fkInput).toBeVisible();
    await fkInput.click();
    await expect(modal).toBeVisible();
  });

  await test.step('verify modal display', async () => {
    await expect.soft(ModalLocators.getModalTitle(modal)).toHaveText(modalParams.title);

    await expect.soft(RecordsetLocators.getRows(modal)).toHaveCount(modalParams.numRows);

    await testRecordsetTableRowValues(modal, modalParams.values, true);
  });

  await test.step('row-level view button', async () => {
    for (const [index, row] of modalParams.rowViewPaths.entries()) {
      await testViewButton(testInfo, modal, index, row);
    }
  });

  await test.step('row-level edit button', async () => {
    let newPage: Page;

    await test.step('clicking on edit opens recordedit in a new tab', async () => {
      const btn = RecordsetLocators.getRowEditButton(modal, testParams.modal.edit.row);
      newPage = await clickNewTabLink(btn);
      await RecordeditLocators.waitForRecordeditPageReady(newPage);
    });

    await test.step('modify the record', async () => {
      const inpType = RecordeditInputType.TEXT;

      await setInputValue(newPage, 1, 'name', 'name', inpType, testParams.modal.edit.name);
      await RecordeditLocators.submitForm(newPage);
      // wait until redirected to record page
      await RecordLocators.waitForRecordPageReady(newPage);
      await newPage.close();
      await manuallyTriggerFocus(page);
    });

    await test.step('verify updated values in the modal', async () => {
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(testParams.modal.numRows);

      // make sure the links are correct
      const newRow = [{ column: 'id', value: testParams.modal.edit.id }];
      for (const [index, row] of modalParams.rowViewPaths.entries()) {
        await testViewButton(
          testInfo,
          modal,
          index,
          index === testParams.modal.edit.row ? newRow : row
        );
      }

      // make sure the values are correct
      await testRecordsetTableRowValues(modal, modalParams.edit.valuesAfterEdit, true);
    });
  });

  await test.step('row-level delete button', async () => {
    // click on the delete button of the specified row
    await RecordsetLocators.getRowDeleteButton(modal, testParams.modal.delete.row).click();

    // confirm the deletion
    const deleteModal = ModalLocators.getConfirmDeleteModal(page);
    await expect.soft(deleteModal).toBeVisible();
    await ModalLocators.getOkButton(deleteModal).click();

    // test the values
    await expect
      .soft(RecordsetLocators.getRows(page))
      .toHaveCount(testParams.modal.delete.valuesAfterDelete.length);
    await testRecordsetTableRowValues(modal, modalParams.delete.valuesAfterDelete, true);
  });

  await test.step('create new button', async () => {
    let newPage: Page;

    await test.step('clicking on create new opens recordedit in a new tab', async () => {
      const createBtn = RecordsetLocators.getAddRecordsLink(modal);
      newPage = await clickNewTabLink(createBtn);
      await RecordeditLocators.waitForRecordeditPageReady(newPage);
    });

    await test.step('fill out the create form', async () => {
      const inpType = RecordeditInputType.TEXT;

      await setInputValue(newPage, 1, 'id', 'id', inpType, testParams.modal.create.id);
      await setInputValue(newPage, 1, 'name', 'name', inpType, testParams.modal.create.name);
      await RecordeditLocators.submitForm(newPage);
      // wait until redirected to record page
      await RecordLocators.waitForRecordPageReady(newPage);
      await newPage.close();
      await manuallyTriggerFocus(page);
    });

    await test.step('verify new values in the modal', async () => {
      // make sure the values are correct
      const expectedValues = testParams.modal.create.valuesAfterCreate;
      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(expectedValues.length);
      await testRecordsetTableRowValues(modal, expectedValues, true);

      /**
       * we cannot test the viewPaths because the new RID is not captured,
       * so instead we're navigating to record page.
       * this way we're also testing that the button opens in new tab correctly.
       *
       * NOTE: running in reverse order because the tooltip of the button was causing issues
       */
      for (let i = modalParams.create.recordValues.length - 1; i >= 0; --i) {
        const rowValues = modalParams.create.recordValues[i];
        const recordPage = await clickNewTabLink(RecordsetLocators.getRowViewButton(modal, i));
        await RecordLocators.waitForRecordPageReady(recordPage);
        await testRecordMainSectionPartialValues(recordPage, 2, rowValues);
        await recordPage.close();
      }
    });

    await test.step('view buttons properly navigate to the record page', async () => {

    });
  });
});

const testViewButton = async (
  testInfo: TestInfo,
  modal: Locator,
  index: number,
  row: EntityRowColumnValues
) => {
  const btn = RecordsetLocators.getRowViewButton(modal, index);
  const url = getEntityRowURL(
    testInfo,
    APP_NAMES.RECORD,
    testParams.schemaName,
    testParams.foreignKeyTableName,
    row
  );
  expect.soft(await btn.getAttribute('href')).toContain(url);
};
