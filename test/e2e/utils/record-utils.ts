import { Locator, Page, TestInfo, expect, test } from '@playwright/test';

// locators
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';

import { getCatalogID, getEntityRow, EntityRowColumnValues } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { APP_NAMES, PW_PROJECT_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import {
  clickAndVerifyDownload, clickNewTabLink, getClipboardContent,
  manuallyTriggerFocus, testTooltip
} from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';
import { RecordsetColValue, RecordsetRowValue, testRecordsetTableRowValues } from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';


/**
 * TODO this function is currently only used for recordedit result test, but
 * we should also use this for the 'should validate the values of each column' test in record-helpers.js
 */
export const testRecordMainSectionValues = async (page: Page, expectedColumnNames: string[], expectedColumnValues: RecordsetRowValue) => {
  await RecordLocators.waitForRecordPageReady(page);

  await expect(RecordLocators.getColumns(page)).toHaveCount(expectedColumnNames.length);
  await expect(RecordLocators.getAllColumnNames(page)).toHaveText(expectedColumnNames);

  const allValues = RecordLocators.getAllColumnValues(page);
  let index = 0;
  for (const expectedValue of expectedColumnValues) {
    const value = allValues.nth(index);
    if (typeof expectedValue === 'string') {
      await expect.soft(value).toHaveText(expectedValue);
    } else {
      const link = value.locator('a');
      expect.soft(await link.getAttribute('href')).toContain(expectedValue.url);
      await expect.soft(link).toHaveText(expectedValue.caption);
    }
    index++;
  }
}

/**
 * similar to testRecordMainSectionValues but instead of making sure all values have the expected values, it will
 * only test the given columns
 */
export const testRecordMainSectionPartialValues = async (page: Page, numCols: number, expectedValues: { [colName: string]: RecordsetColValue }) => {
  await RecordLocators.waitForRecordPageReady(page);
  await expect(RecordLocators.getColumns(page)).toHaveCount(numCols);
  for (const colName of Object.keys(expectedValues)) {
    const value = RecordLocators.getColumnValue(page, colName);
    const expectedValue = expectedValues[colName];

    if (typeof expectedValue === 'string') {
      await expect.soft(value).toHaveText(expectedValue);
    } else {
      const link = value.locator('a');
      expect.soft(await link.getAttribute('href')).toContain(expectedValue.url);
      await expect.soft(link).toHaveText(expectedValue.caption);
    }
  }
}


type ShareCiteModalParams = {
  /**
   * the modal title
   */
  title: string,
  /**
   * the main link
   */
  link: string,
  /**
   * whether versioned link is present or not
   */
  hasVersionedLink: boolean,
  /**
   * if true, we will test the versioned link too.
   */
  verifyVersionedLink: boolean,
  /**
   * pass `false` when citation should not be displayed.
   */
  citation?: string | false,
  /**
   * the location of the bibtext file so we can delete it after downloading it
   */
  bibtextFile?: string,
}

export const testShareCiteModal = async (page: Page, testInfo: TestInfo, params: ShareCiteModalParams) => {
  const expectedLink = params.link;
  const shareBtn = RecordLocators.getShareButton(page);
  const shareCiteModal = ModalLocators.getShareCiteModal(page);

  await test.step('share button should be available after the page is fully loaded.', async () => {

    await RecordLocators.waitForRecordPageReady(page);
    await expect.soft(shareBtn).toBeVisible();
  });

  await test.step('should show the share dialog when clicking the share button.', async () => {
    await shareBtn.click();

    await expect.soft(shareCiteModal).toBeVisible();

    await expect.soft(ModalLocators.getModalTitle(shareCiteModal)).toHaveText(params.title)

    // share link + citation + bibtext or just share link
    const count = params.citation ? 3 : 1;
    await expect.soft(ModalLocators.getModalListElements(shareCiteModal)).toHaveCount(count);

    await expect.soft(ModalLocators.getShareLinkHeader(shareCiteModal)).toHaveText('Share Link');
  });

  await test.step('should have proper links.', async () => {
    const expectedHeaders: string | string[] = params.hasVersionedLink ? ['Versioned Link', 'Live Link'] : ['Live Link'];
    await expect.soft(ModalLocators.getShareLinkSubHeaders(shareCiteModal)).toContainText(expectedHeaders);

    await expect.soft(ModalLocators.getLiveLinkElement(shareCiteModal)).toHaveText(expectedLink);

    if (params.verifyVersionedLink) {
      // we cannot actually test the versioned link, so we're just making sure that it starts with the link
      await expect.soft(ModalLocators.getVersionedLinkElement(shareCiteModal)).toContainText(expectedLink);
    }
  });

  // unable to run this on safari due to permission issue (https://github.com/microsoft/playwright/issues/13037)
  if (testInfo.project.name !== PW_PROJECT_NAMES.SAFARI) {
    await test.step('copy to clipboard buttons should be available and work', async () => {
      const btns = ModalLocators.getShareLinkCopyBtns(shareCiteModal);

      await expect.soft(btns).toHaveCount(params.hasVersionedLink ? 2 : 1);

      // TODO test copy to clipboard
      const liveBtn = btns.nth(params.hasVersionedLink ? 1 : 0);
      await liveBtn.click();

      let clipboardText = await getClipboardContent(page);
      expect.soft(clipboardText).toBe(expectedLink);

      if (params.verifyVersionedLink) {
        await btns.first().click();

        clipboardText = await getClipboardContent(page);
        expect.soft(clipboardText).toContain(expectedLink);
      }
    });
  }

  if (params.citation) {
    await test.step('should have a citation present', async () => {
      if (!params.citation) return;

      // verify citation
      await expect.soft(ModalLocators.getCitationHeader(shareCiteModal)).toHaveText('Data Citation');
      await expect.soft(ModalLocators.getCitationText(shareCiteModal)).toHaveText(params.citation);

      // verify bibtex
      await expect.soft(ModalLocators.getDownloadCitationHeader(shareCiteModal)).toHaveText('Download Data Citation:');
      await expect.soft(ModalLocators.getBibtex(shareCiteModal)).toHaveText('BibTex');
    });
  } else if (params.citation === false) {
    await test.step('citation should not be present', async () => {
      await expect.soft(ModalLocators.getCitationHeader(shareCiteModal)).not.toBeVisible();
      await expect.soft(ModalLocators.getCitationText(shareCiteModal)).not.toBeVisible();
    });
  }

  if (params.bibtextFile) {
    await test.step('should download the citation in BibTex format.', async () => {
      const btn = ModalLocators.getBibtex(shareCiteModal);
      await clickAndVerifyDownload(btn, params.bibtextFile);
    });
  }

  await test.step('clicking on close button should close the modal.', async () => {
    await ModalLocators.getCloseBtn(shareCiteModal).click();

    await expect.soft(shareCiteModal).not.toBeAttached();
  });

}

export type RelatedTableTestParams = {
  tableName: string,
  schemaName: string,
  /**
   * the displayname that users see on the page
   */
  displayname: string,
  /**
   * the name of the table that this record app belongs to
   */
  baseTableName: string,

  isAssociation?: boolean,
  associationLeafTableName?: string,
  /**
   * used for testing the tooltip of unlink btn
   */
  entityMarkdownName?: string,

  inlineComment?: string,

  count: number,

  canEdit?: boolean,
  bulkEditLink?: string,

  canCreate?: boolean,

  /**
   * if true and isAssociation=false, this function will remove the first displayed row.
   */
  canDelete?: boolean,

  isMarkdown?: boolean
  isInline?: boolean,
  isTableMode?: boolean
  viewMore?: {
    displayname: string,
    filter: string,
  },
  rowValues?: RecordsetRowValue[],
  rowViewPaths?: { column: string, value: string }[][],
  markdownValue?: string,
  /**
   * default 25
   */
  pageSize?: number
};

export const testRelatedTablePresentation = async (page: Page, testInfo: TestInfo, params: RelatedTableTestParams) => {
  const currentEl = RecordLocators.getRelatedTableContainer(page, params.displayname, params.isInline);
  const markdownToggleLink = RecordLocators.getRelatedTableToggleDisplay(page, params.displayname, params.isInline);
  const rows = RecordsetLocators.getRows(currentEl);
  const tableName = params.isAssociation && params.associationLeafTableName ? params.associationLeafTableName : params.tableName;

  // if it was markdown, we are changing the view, change it back. these booleans are used for that
  let hasNoRows = false, displayIsToggled = false;

  const getURL = (appName: string, tName: string, rowVal: EntityRowColumnValues) => {
    const savedData = getEntityRow(testInfo, params.schemaName, tableName, rowVal);
    return `/${appName}/#${getCatalogID(testInfo.project.name)}/${params.schemaName}:${tName}/RID=${savedData.RID}`;
  }

  if (!params.isInline) {
    await test.step('title should be correct', async () => {
      const titleEl = RecordLocators.getRelatedTableSectionHeaderDisplayname(page, params.displayname);
      await expect.soft(titleEl).toHaveText(params.displayname);
    });
  }

  if (params.inlineComment) {
    await test.step('inline comment should be displayed.', async () => {
      const inlineComment = RecordLocators.getRelatedTableInlineComment(page, params.displayname);
      // we have to have this otherwise typescript will complain
      if (!params.inlineComment) return;
      await expect.soft(inlineComment).toHaveText(params.inlineComment);
    });
  }

  await test.step('table level', async () => {
    if (params.isMarkdown || (params.isInline && !params.isTableMode)) {
      const md = RecordLocators.getRelatedMarkdownContainer(page, params.displayname, params.isInline);

      await test.step('markdown container must be visible.', async () => {
        await expect.soft(md).toBeVisible();

        if (params.markdownValue) {
          const innerHTML = await md.innerHTML();
          expect.soft(innerHTML).toBe(params.markdownValue);
        }
      });

      if (typeof params.canEdit === 'boolean') {
        await test.step('the button to switch from/to tabular mode should be visible.', async () => {
          await expect.soft(markdownToggleLink).toHaveText(params.canEdit ? 'Edit mode' : 'Table mode');
        });

        await test.step('toggle button should have the proper tooltip', async () => {
          const expectedTooltip = params.canEdit ?
            `Display edit controls for ${params.displayname} records related to this ${params.baseTableName}.` :
            `Display related ${params.displayname} in tabular mode.`;

          await testTooltip(markdownToggleLink, expectedTooltip, APP_NAMES.RECORD, true);
        });
      }

      await test.step('clicking on the toggle should change the view to tabular.', async () => {
        await markdownToggleLink.click();
        await expect.soft(markdownToggleLink).toHaveText('Custom mode');
        await testTooltip(markdownToggleLink, 'Switch back to the custom display mode.', APP_NAMES.RECORD, true);

        displayIsToggled = true;
      });


    } else {
      await test.step('option for different display modes should not be presented to user.', async () => {
        await expect.soft(markdownToggleLink).not.toBeVisible();
      });
    }

    if (params.rowValues) {
      await test.step('rows of data should be correct and respect the given page_size.', async () => {
        // silence the ts error
        if (!params.rowValues) return;

        await testRecordsetTableRowValues(currentEl, params.rowValues, true);
      });
    }


    await test.step('Explore button', async () => {
      const exploreButton = RecordLocators.getRelatedTableExploreLink(page, params.displayname, params.isInline);

      await test.step('should be displayed.', async () => {
        await expect.soft(exploreButton).toBeVisible();
      });


      if (params.viewMore) {
        await test.step('should go to the recordset app with correct set of filters', async () => {
          if (!params.viewMore) return;

          await exploreButton.click();
          await page.waitForURL('**/recordset/**');
          await RecordsetLocators.waitForRecordsetPageReady(page);

          await expect.soft(RecordsetLocators.getPageTitleElement(page), 'recordset title missmatch.').toHaveText(params.viewMore.displayname);

          const chiclets = RecordsetLocators.getFacetFilters(page);
          await expect.soft(chiclets).toHaveCount(1);

          // const content = await chiclets.first().textContent();
          // expect.soft(content, 'filter missmatch').toBe(params.viewMore!.filter)
          await expect.soft(chiclets.nth(0)).toHaveText(params.viewMore.filter);

          await page.goBack();
          await RecordLocators.waitForRecordPageReady(page);
        });
      }

    });

    // bulk edit
    if (typeof params.canEdit === 'boolean') {
      const bulkEditTest = params.canEdit ? '`Bulk Edit` button should be visible with correct link' : '`Bulk Edit` button should not be offered.';
      await test.step(bulkEditTest, async () => {
        const btn = RecordLocators.getRelatedTableBulkEditLink(page, params.displayname, params.isInline);

        if (!params.canEdit) {
          await expect.soft(btn).not.toBeVisible();
        } else {
          await expect.soft(btn).toBeVisible();

          if (params.bulkEditLink) {
            expect.soft(await btn.getAttribute('href')).toContain(params.bulkEditLink);
          }
        }
      });
    }

    if (typeof params.canCreate === 'boolean') {
      const addBtn = RecordLocators.getRelatedTableAddButton(page, params.displayname, params.isInline);

      await test.step(`Add button should be ${params.canCreate ? 'visible' : 'invisible'}.`, async () => {
        if (params.canCreate) {
          await expect.soft(addBtn).toBeVisible();
        } else {
          await expect.soft(addBtn).not.toBeVisible();
        }
      });

      if (params.canCreate) {
        await test.step('Add/link button should have the proper tooltip.', async () => {
          const expected = params.isAssociation ?
            `Connect ${params.displayname} records to this ${params.baseTableName}.` :
            `Create ${params.displayname} records for this ${params.baseTableName}.`;

          await testTooltip(addBtn, expected, APP_NAMES.RECORD, true);
        });
      }
    }
  });

  await test.step('row level', async () => {
    if (!params.isTableMode) {
      await test.step('make sure tabular mode is displayed', async () => {
        const text = await markdownToggleLink.innerText();
        if (text === 'Edit mode') {
          await markdownToggleLink.click();
          displayIsToggled = true;
        }

        await expect.soft(markdownToggleLink).toHaveText('Custom mode');
      });
    }

    if (params.rowViewPaths) {
      await test.step('`View Details` button should have the correct link.', async () => {
        if (!params.rowViewPaths) return;

        let index = 0;
        for (const row of params.rowViewPaths) {
          const btn = RecordsetLocators.getRowViewButton(currentEl, index);
          expect.soft(await btn.getAttribute('href')).toContain(getURL('record', tableName, row));
          index++;
        }
      });
    }

    if (typeof params.canEdit === 'boolean') {
      await test.step(`edit button should${!params.canEdit ? ' not ' : ' '}be visible.`, async () => {
        const editBtns = currentEl.locator('.edit-action-button');
        if (params.canEdit) {
          // await page.pause();
          await expect.soft(editBtns.first()).toBeVisible();
        } else {
          await expect.soft(editBtns.first()).not.toBeVisible();
        }
      });

      if (params.canEdit && params.rowViewPaths) {
        // only testing the first link (it's a button not a link, so testing all of them would add a lot of test time)
        await test.step('clicking on edit button should open a tab to recordedit page', async () => {
          const btn = RecordsetLocators.getRowEditButton(currentEl, 0);

          await expect.soft(btn).toBeVisible();

          // silence the ts error
          if (!params.rowViewPaths) return;

          const newPage = await clickNewTabLink(btn);
          await newPage.waitForURL(`**${getURL('recordedit', tableName, params.rowViewPaths[0])}**`);
          await newPage.close();
        });
      }
    }

    if (typeof params.canDelete === 'boolean') {
      await test.step('Delete or Unlink button', async () => {
        let deleteBtn: Locator;
        if (params.canDelete) {
          await test.step('should be visible', async () => {
            deleteBtn = RecordsetLocators.getRowDeleteButton(currentEl, 0);
            await expect.soft(deleteBtn).toBeVisible();
          });

          await test.step('should have the proper tooltip', async () => {
            let expected = 'Delete';
            if (params.isAssociation) {
              expected = `Disconnect ${params.displayname}:${params.entityMarkdownName} from this ${params.baseTableName}.`;
            }
            await testTooltip(deleteBtn, expected, APP_NAMES.RECORD, true);
          });

          if (!params.isAssociation) {
            await test.step('it should update the table and title after confirmation.', async () => {
              const currCount = await rows.count();
              const confirmModal = ModalLocators.getConfirmDeleteModal(page);

              await deleteBtn.click();

              await expect.soft(confirmModal).toBeVisible();

              await ModalLocators.getOkButton(confirmModal).click();

              await expect.soft(confirmModal).not.toBeAttached();

              await expect.soft(rows).toHaveCount(currCount - 1);

              hasNoRows = currCount - 1 === 0;
            });
          }

        } else {
          await test.step('should not be visible', async () => {
            await expect.soft(deleteBtn).not.toBeVisible();
          });
        }
      });
    }
  });

  // if it was markdown, we are changing the view, change it back.
  if (displayIsToggled && !hasNoRows) {
    await test.step('toggle display mode back', async () => {
      await markdownToggleLink.click();
      await expect.soft(markdownToggleLink).toHaveText(params.canEdit ? 'Edit mode' : 'Table mode');
    });
  }

}

type AddRelatedTableParams = {
  tableName: string,
  schemaName: string,
  /**
   * the displayname of the related reference (what users see)
   */
  displayname: string,
  isInline?: boolean,
  /**
   * the displayname of the related table
   */
  tableDisplayname: string,
  prefilledValues: {
    [colName: string]: {
      value: string,
      /**
       * this function currently only supports fk input and normal input elements.
       */
      inputType: RecordeditInputType,
      isDisabled: boolean
    }
  },
  rowValuesAfter: RecordsetRowValue[]
}

export const testAddRelatedTable = async (page: Page, inputCallback: (newPage: Page) => Promise<void>, params: AddRelatedTableParams) => {
  await test.step('Add feature', async () => {
    let newPage: Page;
    await test.step('clicking on `Add` button should open recordedit.', async () => {
      const addBtn = RecordLocators.getRelatedTableAddButton(page, params.displayname, params.isInline);
      newPage = await clickNewTabLink(addBtn);
      await newPage.waitForURL(`**/${params.schemaName}:${params.tableName}**`);
      await expect.soft(newPage).toHaveURL(/prefill\=/);
      await expect.soft(RecordeditLocators.getPageTitle(newPage)).toHaveText(`Create 1 ${params.tableDisplayname} record`);

      await RecordeditLocators.waitForRecordeditPageReady(newPage);
    });

    await test.step('the opened form should have the proper prefilled values.', async () => {
      if (!newPage) return;

      for await (const colName of Object.keys(params.prefilledValues)) {
        const expectedCol = params.prefilledValues[colName];

        let input;
        switch (expectedCol.inputType) {
          case RecordeditInputType.FK_POPUP:
            input = RecordeditLocators.getForeignKeyInputDisplay(newPage, colName, 1);
            await expect.soft(input).toHaveText(expectedCol.value);
            if (expectedCol.isDisabled) {
              await expect.soft(input).toHaveClass(/input-disabled/);
            } else {
              await expect.soft(input).not.toHaveClass(/input-disabled/);
            }
            break
          // TODO we should add other types if we need to
          default:
            input = RecordeditLocators.getInputForAColumn(newPage, colName, 1);
            await expect.soft(input).toHaveValue(expectedCol.value);
            if (expectedCol.isDisabled) {
              await expect.soft(input).toBeDisabled();
            } else {
              await expect.soft(input).not.toBeDisabled();
            }
            break;
        }
      }
    });

    await test.step('submitting the form and coming back to record page should update the related table.', async () => {
      if (!newPage) return;

      // change other inputs
      await inputCallback(newPage);

      await RecordeditLocators.submitForm(newPage);
      await newPage.waitForURL('**/record/**');
      await newPage.close();

      await manuallyTriggerFocus(page);

      const currentEl = RecordLocators.getRelatedTableContainer(page, params.displayname, params.isInline);
      await testRecordsetTableRowValues(currentEl, params.rowValuesAfter, true);
    });

  });
}

type AddAssociationTableParams = {
  displayname: string,
  isInline?: boolean,

  modalTitle: string,
  totalCount: number,
  disabledRows: string[],
  selectOptions: number[],
  rowValuesAfter: RecordsetRowValue[],
  search?: {
    term: string,
    afterSearchCount: number
    afterSearchDisabledRows: string[],
  }
}

export const testAddAssociationTable = async (page: Page, params: AddAssociationTableParams) => {
  await test.step('link feature', async () => {
    const rsModal = ModalLocators.getRecordsetSearchPopup(page);

    await test.step('clicking on `Link` button should open up a modal.', async () => {
      const addBtn = RecordLocators.getRelatedTableAddButton(page, params.displayname, params.isInline);
      await addBtn.click();

      await expect.soft(rsModal).toBeVisible();
      await expect.soft(ModalLocators.getModalTitle(rsModal)).toHaveText(params.modalTitle);
      await expect.soft(RecordsetLocators.getRows(rsModal)).toHaveCount(params.totalCount);

      const expectedText = `Displaying all${params.totalCount}of ${params.totalCount} records`;
      await expect.soft(RecordsetLocators.getTotalCount(rsModal)).toHaveText(expectedText);

      // check the state of the facet panel
      await expect.soft(RecordsetLocators.getSidePanel(rsModal)).toBeVisible();
    });

    await test.step('current values must be disabled.', async () => {
      const disabledRows = RecordsetLocators.getDisabledRows(rsModal);
      await expect.soft(disabledRows).toHaveCount(params.disabledRows.length);

      let index = 0;
      for (const expected of params.disabledRows) {
        const disabledCell = RecordsetLocators.getRowFirstCell(rsModal, index, true);
        await expect.soft(disabledCell).toHaveText(expected);
        index++;
      }
    });

    if (params.search) {
      await test.step('should be able to search the displayed values.', async () => {
        if (!params.search) return;

        const searchInp = RecordsetLocators.getMainSearchInput(rsModal);
        const searchSubmitBtn = RecordsetLocators.getSearchSubmitButton(rsModal);

        // search
        await searchInp.fill(params.search.term);
        await searchSubmitBtn.click();

        // wait for rows to update
        await expect.soft(RecordsetLocators.getRows(rsModal)).toHaveCount(params.search.afterSearchCount)

        // make sure the disabled list is updated
        const disabledRows = RecordsetLocators.getDisabledRows(rsModal);
        await expect.soft(disabledRows).toHaveCount(params.search.afterSearchDisabledRows.length);

        let index = 0;
        for (const expected of params.search.afterSearchDisabledRows) {
          const disabledCell = RecordsetLocators.getRowFirstCell(rsModal, index, true);
          await expect.soft(disabledCell).toHaveText(expected);
          index++;
        }

        // clear search
        await RecordsetLocators.getSearchClearButton(rsModal).click();
        await expect.soft(RecordsetLocators.getRows(rsModal)).toHaveCount(params.totalCount);

      });
    }

    await test.step('user should be able to select new values and submit.', async () => {
      // select the options
      for (const op of params.selectOptions) {
        await RecordsetLocators.getRowCheckboxInput(rsModal, op).click();
      }

      await ModalLocators.getSubmitButton(rsModal).click();
      await expect.soft(rsModal).not.toBeAttached();

      const currentEl = RecordLocators.getRelatedTableContainer(page, params.displayname, params.isInline);
      await testRecordsetTableRowValues(currentEl, params.rowValuesAfter, true);

    });
  });
}

type BatchUnlinkAssociationParams = {
  displayname: string,
  isInline?: boolean,
  modalTitle: string,
  totalCount: number,
  selectOptions: number[],
  postDeleteMessage: string,
  rowValuesAfter: RecordsetRowValue[],
}

export const testBatchUnlinkAssociationTable = async (page: Page, params: BatchUnlinkAssociationParams) => {
  await test.step('Batch Unlink feature', async () => {
    const rsModal = ModalLocators.getRecordsetSearchPopup(page);

    await test.step('clicking on `Unlink records` button should open up a modal.', async () => {
      const unlinkBtn = RecordLocators.getRelatedTableUnlinkButton(page, params.displayname, params.isInline);
      await unlinkBtn.click();

      await expect.soft(rsModal).toBeVisible();
      await expect.soft(ModalLocators.getModalTitle(rsModal)).toHaveText(params.modalTitle);
      await expect.soft(RecordsetLocators.getRows(rsModal)).toHaveCount(params.totalCount);

      const expectedText = `Displaying all${params.totalCount}of ${params.totalCount} records`;
      await expect.soft(RecordsetLocators.getTotalCount(rsModal)).toHaveText(expectedText);

      // check the state of the facet panel
      await expect.soft(RecordsetLocators.getSidePanel(rsModal)).toBeVisible();
    });

    await test.step('user should be able to select values to unlink and submit.', async () => {
      // select the options
      for (const op of params.selectOptions) {
        await RecordsetLocators.getRowCheckboxInput(rsModal, op).click();
      }

      // click on submit
      await ModalLocators.getSubmitButton(rsModal).click();

      // confirm the unlink
      const confirmModal = ModalLocators.getConfirmDeleteModal(page);
      await expect.soft(confirmModal).toBeVisible();
      await expect.soft(ModalLocators.getModalTitle(confirmModal)).toHaveText('Confirm Unlink');
      await expect.soft(ModalLocators.getModalText(confirmModal)).toHaveText('Are you sure you want to unlink 2 records?');
      const okBtn = ModalLocators.getOkButton(confirmModal);
      await expect.soft(okBtn).toHaveText('Unlink');
      await okBtn.click();
      await expect.soft(confirmModal).not.toBeAttached();

      // make sure summary modal shows up
      const summaryModal = ModalLocators.getErrorModal(page);
      await expect.soft(summaryModal).toBeVisible();
      await expect.soft(ModalLocators.getModalTitle(summaryModal)).toHaveText('Batch Unlink Summary');
      await expect.soft(ModalLocators.getModalText(summaryModal)).toHaveText(params.postDeleteMessage);

      // close the summary modal
      await ModalLocators.getCloseBtn(summaryModal).click();
      await expect.soft(summaryModal).not.toBeAttached();

      // make sure the recordset modal rows update
      await expect.soft(RecordsetLocators.getRows(rsModal)).toHaveCount(params.rowValuesAfter.length);

      // close the recordset modal
      await ModalLocators.getCloseBtn(rsModal).click();
      await expect.soft(rsModal).not.toBeAttached();

      // make sure correct values are displayed
      const currentEl = RecordLocators.getRelatedTableContainer(page, params.displayname, params.isInline);
      await testRecordsetTableRowValues(currentEl, params.rowValuesAfter, true);
    });

  });
}

/**
 * click on the given button to open the delete-confirm. make sure it looks good, and then confirm.
 * @param btn the delete btn
 * @param confirmText the confirm text
 */
export const testDeleteConfirm = async (page: Page, btn: Locator, confirmText: string) => {
  await btn.click();

  const modal = ModalLocators.getConfirmDeleteModal(page);
  await expect.soft(ModalLocators.getModalTitle(modal)).toHaveText('Confirm Delete');

  await expect.soft(ModalLocators.getModalText(modal)).toHaveText(confirmText);

  await ModalLocators.getOkButton(modal).click();
  await expect.soft(modal).not.toBeAttached();
}
