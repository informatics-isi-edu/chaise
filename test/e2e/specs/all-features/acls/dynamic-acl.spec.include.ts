import { test, expect, TestInfo, Page } from '@playwright/test';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';

import { getCatalogID, importACLs } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { createFiles, deleteFiles, setInputValue } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { APP_NAMES, RESTRICTED_USER_STORAGE_STATE } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL, testTooltip } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

/**
 * dynamic_acl_main_table rows:
 *  1: editable, deletable
 *  2: non-edit, non-delete
 *  3: non-edit, deletable
 *  4: editable, non-delete
 *  5: all visible columns are non-editable
 *  6: name cannot be editted
 *  7: editable, non-delete
 *  8: editable, deletable
 *  9: editable, non-delete
 *
 * dynamic_acl_related_table:
 *  1: editable, deletable
 *  2: non-edit, non-delete
 *  3: non-edit, deletable
 *  4: editable, non-delete
 *  5: non-edit, deletable
 *  6: non-edit, deletable
 *
 * dynamic_acl_related_table_2:
 * just used for testing bulkedit, and none are editable
 *
 * dynamic_acl_assoc_table:
 *  (1, 1): non-delete
 *  (1, 2): deletable
 *  dynamic_acl_related_assoc_table:
 *  1: editable, deletable
 *  2: non-edit, non-delete
 */
const testParams = {
  dynamic_acl: {
    row_ids: {
      editable_deletable: 1,
      non_edit_non_delete: 2,
      non_edit_deletable: 3,
      editable_non_delete: 4,
      all_vis_col_non_edit: 5,
      some_vis_col_non_edit: 6,
    },
    related: {
      main_id: 1,
      inbound_displayname: 'related_1',
      inbound_displayname2: 'related_2',
      assoc_displayname: 'related_3',
    }
  },
  files: [{
    name: 'testfile500kb_nopermission.png',
    size: '512000',
    displaySize: '500KB',
    path: 'testfile500kb_nopermission.png',
  }],
  unauthorized_message: 'You are not authorized to upload or modify the file at this location. Please contact your system administrators.'
};


export const runDynamicACLTests = () => {

  // run with the restricted user
  test.use({ storageState: RESTRICTED_USER_STORAGE_STATE });

  test.beforeAll(async ({ }, testInfo) => {
    // create the files
    await createFiles(testParams.files);

    // add acls
    const catalogId = getCatalogID(testInfo.project.name);
    await importACLs({
      'catalog': {
        'id': catalogId,
        'schemas': {
          'multi-permissions': {
            'tables': {
              'dynamic_acl_main_table': {
                'acl_bindings': {
                  // row 1, 3, 5, 6, 8 can be deleted
                  'deletable_rows': {
                    'types': ['delete'],
                    'projection': [
                      {
                        'or': [
                          { 'filter': 'id', 'operand': 1 },
                          { 'filter': 'id', 'operand': 3 },
                          { 'filter': 'id', 'operand': 5 },
                          { 'filter': 'id', 'operand': 6 },
                          { 'filter': 'id', 'operand': 8 }
                        ]
                      },
                      'id'
                    ],
                    'projection_type': 'nonnull'
                  },
                  // row 1, 4, 5, 6, 7, 8, 9 can be updated
                  'updatable_rows': {
                    'types': ['update'],
                    'projection': [
                      {
                        'or': [
                          { 'filter': 'id', 'operand': 1 },
                          { 'filter': 'id', 'operand': 4 },
                          { 'filter': 'id', 'operand': 5 },
                          { 'filter': 'id', 'operand': 6 },
                          { 'filter': 'id', 'operand': 7 },
                          { 'filter': 'id', 'operand': 8 },
                          { 'filter': 'id', 'operand': 9 }
                        ]
                      },
                      'id'
                    ],
                    'projection_type': 'nonnull'
                  }
                },
                'columns': {
                  // id is generated
                  'name': {
                    'acl_bindings': {
                      'updatable_rows': false,
                      'updatable_cols': {
                        'types': ['update'],
                        'projection': [
                          { 'filter': 'id', 'operand': 5, 'negate': true },
                          { 'filter': 'id', 'operand': 6, 'negate': true },
                          'id'
                        ],
                        'projection_type': 'nonnull'
                      }
                    }
                  },
                  'fk_col': {
                    'acl_bindings': {
                      'updatable_rows': false,
                      'updatable_cols': {
                        'types': ['update'],
                        'projection': [
                          { 'filter': 'id', 'operand': 5, 'negate': true },
                          'id'
                        ],
                        'projection_type': 'nonnull'
                      }
                    }
                  }
                }
              },
              'dynamic_acl_file_table': {
                'acl_bindings': {
                  // row 1 be updated
                  'updatable_rows': {
                    'types': ['update'],
                    'projection': [
                      {
                        'or': [
                          { 'filter': 'id', 'operand': 1 }
                        ]
                      },
                      'id'
                    ],
                    'projection_type': 'nonnull'
                  }
                }
              },
              'dynamic_acl_related_table': {
                'acl_bindings': {
                  // row 1, 3 can be deleted
                  'deletable_rows': {
                    'types': ['delete'],
                    'projection': [
                      {
                        'or': [
                          { 'filter': 'id', 'operand': 1 },
                          { 'filter': 'id', 'operand': 3 }
                        ]
                      },
                      'id'
                    ],
                    'projection_type': 'nonnull'
                  },
                  // row 1, 4 can be deleted
                  'updatable_rows': {
                    'types': ['update'],
                    'projection': [
                      {
                        'or': [
                          { 'filter': 'id', 'operand': 1 },
                          { 'filter': 'id', 'operand': 4 },
                        ]
                      },
                      'id'
                    ],
                    'projection_type': 'nonnull'
                  }
                }
              },
              'dynamic_acl_related_table_2': {
                'acl_bindings': {
                  // row 9999 can be edited (a row that doesn't exist)
                  'updatable_rows': {
                    'types': ['update'],
                    'projection': [
                      {
                        'or': [
                          { 'filter': 'id', 'operand': 9999 },
                        ]
                      },
                      'id'
                    ],
                    'projection_type': 'nonnull'
                  }
                }
              },
              'dynamic_acl_assoc_table': {
                'acl_bindings': {
                  // association (1,2) can be deleted
                  'deletable_rows': {
                    'types': ['delete'],
                    'projection': [
                      { 'filter': 'id_1', 'operand': 1 },
                      { 'filter': 'id_2', 'operand': 2 },
                      'id_1'
                    ],
                    'projection_type': 'nonnull'
                  }
                }
              },
              'dynamic_acl_related_assoc_table': {
                'acl_bindings': {
                  // related 1 can be deleted
                  'deletable_rows': {
                    'types': ['delete'],
                    'projection': [
                      { 'filter': 'id', 'operand': 1 },
                      'id'
                    ],
                    'projection_type': 'nonnull'
                  },
                  // related 1 can be updated
                  'updatable_rows': {
                    'types': ['update'],
                    'projection': [
                      { 'filter': 'id', 'operand': 1 },
                      'id'
                    ],
                    'projection_type': 'nonnull'
                  }
                }
              }
            }
          }
        }
      }
    });
  });

  /******************** record tests ************************/
  test.describe('When viewing Record app for a table with dynamic acls', () => {
    test('when the row can be edited and deleted', async ({ page, baseURL }, testInfo) => {
      await testRecordAppEditAndDeleteButtons(testParams.dynamic_acl.row_ids.editable_deletable, true, true, page, baseURL, testInfo);
    });

    test('when the row cannot be edited or deleted, both buttons should not be displayed.', async ({ page, baseURL }, testInfo) => {
      // in this case none of the buttons show up (no edit, no delete, no create)
      await page.goto(getRecordURL(testParams.dynamic_acl.row_ids.non_edit_non_delete, baseURL, testInfo));

      await RecordLocators.waitForRecordPageReady(page);
      await expect.soft(RecordLocators.getEditRecordButton(page)).not.toBeAttached();

      await expect.soft(RecordLocators.getDeleteRecordButton(page)).not.toBeAttached();
    });

    test('when the row cannot be edited but can be deleted', async ({ page, baseURL }, testInfo) => {
      await testRecordAppEditAndDeleteButtons(testParams.dynamic_acl.row_ids.non_edit_deletable, false, true, page, baseURL, testInfo);
    });

    test('when the row can be edited but not deleted', async ({ page, baseURL }, testInfo) => {
      await testRecordAppEditAndDeleteButtons(testParams.dynamic_acl.row_ids.editable_non_delete, true, false, page, baseURL, testInfo);
    });

    test('when all the columns in a row are not editable', async ({ page, baseURL }, testInfo) => {
      test.skip(true, 'tcrs support has been removed because of performance issues');
      await testRecordAppEditAndDeleteButtons(testParams.dynamic_acl.row_ids.all_vis_col_non_edit, true, true, page, baseURL, testInfo);
    });

    test('when some of the columns in a row are not editable', async ({ page, baseURL }, testInfo) => {
      test.skip(true, 'tcrs support has been removed because of performance issues');
      await testRecordAppEditAndDeleteButtons(testParams.dynamic_acl.row_ids.all_vis_col_non_edit, true, true, page, baseURL, testInfo);
    });

    test('when the related tables have dynamic acls', async ({ page, baseURL }, testInfo) => {
      await test.step('should load the page properly', async () => {
        await page.goto(getRecordURL(testParams.dynamic_acl.related.main_id, baseURL, testInfo));
        await RecordLocators.waitForRecordPageReady(page);
      });

      await test.step('for an association table', async () => {
        await testRelatedTableEditAndDeleteButtons(
          page,
          testParams.dynamic_acl.related.assoc_displayname,
          false,
          [true, false],
          [false, true],
          true
        );
      });

      await test.step('for a related table', async () => {
        await test.step('with some editable rows', async () => {
          await testRelatedTableEditAndDeleteButtons(
            page,
            testParams.dynamic_acl.related.inbound_displayname,
            false,
            [true, false, false, true],
            [true, false, true, false]
          );

          await test.step('next page without any editable rows', async () => {
            const disp = testParams.dynamic_acl.related.inbound_displayname;
            const container = RecordLocators.getRelatedTableContainer(page, disp, false);
            await RecordsetLocators.getNextButton(container).click();
            await testRelatedTableEditAndDeleteButtons(
              page,
              disp,
              true,
              [false, false],
              [false, false],
              false,
              'There are no related_1 records that you can edit in this page. There may be editable records in other pages.'
            )
          });
        });

        await test.step('with no editable rows', async () => {
          await testRelatedTableEditAndDeleteButtons(
            page,
            testParams.dynamic_acl.related.inbound_displayname2,
            true,
            [false, false],
            [false, false],
            false,
            'There are no related_2 records that you can edit in this page.'
          );
        });
      });
    });

  });

  /******************** recordedit tests ************************/
  test.describe('when viewing Recordedit app for a table with dynamic acls', () => {

    test('when none of the rows can be edited, users should see the unauthorized access error.', async ({ page, baseURL }, testInfo) => {
      await page.goto(getRecordeditURL('id=2;id=5', baseURL, testInfo));

      const modal = ModalLocators.getErrorModal(page);
      await expect(modal).toBeVisible();
      await expect.soft(ModalLocators.getModalTitle(modal)).toHaveText('Unauthorized Access');
      await expect.soft(ModalLocators.getModalText(modal)).toContainText('You are not authorized to perform this action.');
    });

    test('when some of the rows cannot be edited', async ({ page, baseURL }, testInfo) => {

      await test.step('should load the page properly', async () => {
        // 1 all except id enabled, 2 table-level disabled, 3 all vis columns disabled
        await page.goto(getRecordeditURL('id=1;id=2;id=5', baseURL, testInfo));
        await RecordeditLocators.waitForRecordeditPageReady(page);
      });

      await test.step('a dismissiable warning should be displayed about omited forms', async () => {
        const alert = AlertLocators.getWarningAlert(page);
        await expect.soft(alert).toBeVisible();
        await expect.soft(alert).toContainText('2/3 entries were removed from editing due to the lack of permission.');
      });

      await test.step('only the editable records should be displayed', async () => {
        await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(1);

        await expect.soft(RecordeditLocators.getInputForAColumn(page, 'id', 1)).toBeDisabled();
        await expect.soft(RecordeditLocators.getInputForAColumn(page, 'name', 1)).not.toBeDisabled();
      });

      await test.step('submitting the form should properly ignore the disabeld rows', async () => {
        await RecordeditLocators.getInputForAColumn(page, 'name', 1).fill('new one');
        await RecordeditLocators.submitForm(page);
        // wait for url change (which means successful request)
        await page.waitForURL('**/record/**');
      });

    });

    test('when some of the columns in one of the rows cannot be edited', async ({ page, baseURL }, testInfo) => {
      await test.step('should load the page properly', async () => {
        await page.goto(getRecordeditURL('id=1;id=6', baseURL, testInfo));
        await RecordeditLocators.waitForRecordeditPageReady(page);
      });

      await test.step('the non-editable field should be disabled.', async () => {
        const input = RecordeditLocators.getInputForAColumn(page, 'name', 2);
        await expect.soft(input).toBeDisabled();
        await expect.soft(input).toHaveValue('six');
      });

      await test.step('Trying to edit a column in another row should display a warning', async () => {
        const overlay = RecordeditLocators.getColumnPermissionOverlay(page, 'name', 1);
        const warn = RecordeditLocators.getColumnPermissionError(page, 'name', 1);

        await expect.soft(warn).not.toBeVisible();
        await expect.soft(overlay).toBeAttached();
        await overlay.click();

        const message = 'This field cannot be modified. To modify it, remove all records that have this field disabled (e.g. Record Number 2)';
        await expect.soft(warn).toBeVisible();
        await expect.soft(warn).toHaveText(message);
      });

      await test.step('removing the from with non-editable column should allow users to submit', async () => {
        // remove the form that has issues
        await RecordeditLocators.getDeleteRowButton(page, 1).click();
        await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(1);

        await RecordeditLocators.getInputForAColumn(page, 'name', 1).fill('1');
        await RecordeditLocators.submitForm(page);
        // wait for url change (which means successful request)
        await page.waitForURL('**/record/**');
      });
    });

    test('when none of the rows can be deleted', async ({ page, baseURL }, testInfo) => {
      await test.step('should load the page properly', async () => {
        await page.goto(getRecordeditURL('id=7;id=9', baseURL, testInfo));
        await RecordeditLocators.waitForRecordeditPageReady(page);
      });

      await test.step('Bulk delete button should be disabled.', async () => {
        const btn = RecordeditLocators.getBulkDeleteButton(page);
        await expect.soft(btn).toBeVisible();
        await expect.soft(btn).toBeDisabled();
      });
    });

    test('when some rows cannot be deleted', async ({ page, baseURL }, testInfo) => {
      await test.step('should load the page properly', async () => {
        await page.goto(getRecordeditURL('id=7;id=8;id=9', baseURL, testInfo));
        await RecordeditLocators.waitForRecordeditPageReady(page);
      });

      await test.step('Bulk delete button should be present and user should be able to click it', async () => {
        const btn = RecordeditLocators.getBulkDeleteButton(page);
        const modal = ModalLocators.getConfirmDeleteModal(page);
        const modalOkBtn = ModalLocators.getOkButton(modal);

        await expect.soft(btn).toBeVisible();
        await btn.click();
        await expect.soft(modal).toBeVisible();
        await expect.soft(ModalLocators.getModalText(modal)).toHaveText('Are you sure you want to delete all 3 of the displayed records?');
        await expect.soft(modalOkBtn).toHaveText('Delete');
        await modalOkBtn.click();
      });

      await test.step('After the delete is done, user should see the proper message', async () => {
        // make sure summary modal shows up
        const summaryModal = ModalLocators.getErrorModal(page);
        await expect.soft(summaryModal).toBeVisible();
        await expect.soft(ModalLocators.getModalTitle(summaryModal)).toHaveText('Batch Delete Summary');

        const expectedBody = [
          '1 record successfully deleted. 2 records could not be deleted. Check the error details below to see more information.',
          'Show Error Details'
        ].join('');
        await expect.soft(ModalLocators.getModalText(summaryModal)).toHaveText(expectedBody);
      });

      await test.step('clicking on close button should remove the deleted rows from the form', async () => {
        // close the summary modal
        const summaryModal = ModalLocators.getErrorModal(page);
        await ModalLocators.getCloseBtn(summaryModal).click();
        await expect.soft(summaryModal).not.toBeAttached();
        // only one row was deletable
        await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(2);
      });
    });

    test('when trying to create a file without permission, user should be shown an error alert', async ({ page, baseURL }, testInfo) => {
      await test.step('should load the page properly', async () => {
        await page.goto(generateChaiseURL(APP_NAMES.RECORDEDIT, 'multi-permissions', 'dynamic_acl_file_table', testInfo, baseURL) + '/id=1');
        await RecordeditLocators.waitForRecordeditPageReady(page);
      });

      await test.step('after clicking on submit, user should see an error.', async () => {
        await setInputValue(page, 1, 'uri', 'uri', RecordeditInputType.FILE, testParams.files[0]);

        await RecordeditLocators.submitForm(page);
        const alert = AlertLocators.getErrorAlert(page);
        await expect.soft(alert).toBeVisible();
        await expect.soft(alert).toContainText(testParams.unauthorized_message);
      });
    });

  });

  /******************** recordset tests ************************/
  test.describe('When viewing Recordset app for a table with dynamic acls', () => {
    test('when some of the displayed rows are not editable/deletable, ', async ({ page, baseURL }, testInfo) => {
      // NOTE recordset doesn't ask for tcrs and therefore cannot accurately guess the acl for id=5
      await testRecordSetEditAndDeleteButtons(
        page, baseURL, testInfo,
        'id=1;id=2;id=3;id=4;id=5;id=6', 6, false,
        [true, false, false, true, true, true],
        [true, false, true, false, true, true]
      );
    });

    test('when none of the displayed rows are editable, ', async ({ page, baseURL }, testInfo) => {
      await testRecordSetEditAndDeleteButtons(page, baseURL, testInfo, 'id=2;id=3', 2, true, [false, false], [false, true]);
    });
  });

  test.afterAll(async ({ }, testInfo) => {
    // remove the added files
    await deleteFiles(testParams.files);
    // clean up the acls
    const catalogId = getCatalogID(testInfo.project.name);
    await importACLs({
      'catalog': {
        'id': catalogId,
        'schemas': {
          'multi-permissions': {
            'tables': {
              'dynamic_acl_main_table': {
                'acl_bindings': {},
                'columns': {
                  'name': { 'acl_bindings': {} },
                  'fk_col': { 'acl_bindings': {} }
                }
              },
              'dynamic_acl_related_table': {
                'acl_bindings': {}
              },
              'dynamic_acl_assoc_table': {
                'acl_bindings': {}
              },
              'dynamic_acl_related_assoc_table': {
                'acl_bindings': {}
              }
            }
          }
        }
      }
    });
  });

};



/******************** record helpers ************************/
const getRecordURL = (id: number, baseURL: string | undefined, testInfo: TestInfo) => {
  return generateChaiseURL(APP_NAMES.RECORD, 'multi-permissions', 'dynamic_acl_main_table', testInfo, baseURL) + '/id=' + id;
};

const testRecordAppEditAndDeleteButtons = async (
  id: number, editable: boolean, deletable: boolean, page: Page, baseURL: string | undefined, testInfo: TestInfo
) => {
  await test.step('should load the page properly', async () => {
    await page.goto(getRecordURL(id, baseURL, testInfo));
    await RecordLocators.waitForRecordPageReady(page);
  });

  await test.step('should display the Edit link' + (editable ? '' : ' as a disabled'), async () => {
    const button = RecordLocators.getEditRecordButton(page);
    await expect.soft(button).toBeAttached();

    if (editable) {
      await expect.soft(button).not.toBeDisabled();
    } else {
      await expect.soft(button).toBeDisabled();
    }
  });

  await test.step('should display the Delete link' + (deletable ? '' : ' as disabled'), async () => {
    const button = RecordLocators.getDeleteRecordButton(page);
    await expect.soft(button).toBeAttached();

    if (deletable) {
      await expect.soft(button).not.toBeDisabled();
    } else {
      await expect.soft(button).toBeDisabled();
    }
  });
};

const testRelatedTableEditAndDeleteButtons = async (
  page: Page, displayname: string, disableBulkEdit: boolean,
  expectedEdit: boolean[], expectedDelete: boolean[], isAssoc?: boolean,
  bulkEditTooltip?: string
) => {
  const container = RecordLocators.getRelatedTableContainer(page, displayname, false);

  await test.step('rows should be displayed properly', async () => {
    await expect(RecordsetLocators.getRows(container)).toHaveCount(expectedEdit.length);
  });

  await test.step(`Bulk edit button is displayed ${disableBulkEdit ? ' as disabled' : ''}`, async () => {
    const link = RecordLocators.getRelatedTableBulkEditLink(page, displayname, false);
    await expect.soft(link).toBeVisible();
    if (disableBulkEdit) {
      await expect.soft(link).toBeDisabled();
    } else {
      await expect.soft(link).toBeEnabled();
    }

    if (bulkEditTooltip) {
      await testTooltip(link, bulkEditTooltip, APP_NAMES.RECORD, true);
    }
  });

  await test.step('Edit button should display based on related table acls', async () => {
    let index = 0;
    for (const exp of expectedEdit) {
      const btn = RecordsetLocators.getRowEditButton(container, index);
      if (exp) {
        await expect.soft(btn).toBeVisible();
      } else {
        await expect.soft(btn).not.toBeAttached();
      }
      index += 1;
    }
  });

  await test.step(`${isAssoc ? 'Unlink' : 'Delete'} button should display based on ${isAssoc ? 'association' : 'related'} table acls`, async () => {
    let index = 0;
    for (const exp of expectedDelete) {
      const btn = RecordsetLocators.getRowDeleteButton(container, index);
      if (exp) {
        await expect.soft(btn).toBeVisible();
      } else {
        await expect.soft(btn).not.toBeAttached();
      }
      index += 1;
    }
  });
};

/******************** recordedit helpers ************************/
const getRecordeditURL = (filter: string, baseURL: string | undefined, testInfo: TestInfo) => {
  return generateChaiseURL(APP_NAMES.RECORDEDIT, 'multi-permissions', 'dynamic_acl_main_table', testInfo, baseURL) + '/' + filter + '/@sort(id)';
};


/******************** recordset helpers ************************/
const testRecordSetEditAndDeleteButtons = async (
  page: Page, baseURL: string | undefined, testInfo: TestInfo,
  uriFilter: string, rowCount: number, disableBulkEdit: boolean, expectedEditable: boolean[], expectedDeletable: boolean[]
) => {
  await test.step('should load the page properly and show correct number of rows', async () => {
    await page.goto(
      generateChaiseURL(APP_NAMES.RECORDSET, 'multi-permissions', 'dynamic_acl_main_table', testInfo, baseURL) + '/' + uriFilter + '/@sort(id)'
    );
    await RecordsetLocators.waitForRecordsetPageReady(page);
    await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(rowCount);
  });

  await test.step(`should display the bulk edit link${disableBulkEdit ? ' as disabled' : ''}`, async () => {
    const link = RecordsetLocators.getBulkEditLink(page);
    await expect.soft(link).toBeVisible();
    if (disableBulkEdit) {
      await expect.soft(link).toBeDisabled();
    } else {
      await expect.soft(link).toBeEnabled();
    }
  });

  await test.step('action buttons should be displayed correctly.', async () => {
    let index = 0;
    for (const expected of expectedEditable) {
      await expect.soft(RecordsetLocators.getRowViewButton(page, index)).toBeVisible();
      const edit = RecordsetLocators.getRowEditButton(page, index);
      if (expected) {
        await expect.soft(edit).toBeVisible();
      } else {
        await expect.soft(edit).not.toBeAttached();
      }

      const deleteBtn = RecordsetLocators.getRowDeleteButton(page, index);
      if (expectedDeletable[index]) {
        await expect.soft(deleteBtn).toBeVisible();
      } else {
        await expect.soft(deleteBtn).not.toBeAttached();
      }

      index++;
    }
  });
};
