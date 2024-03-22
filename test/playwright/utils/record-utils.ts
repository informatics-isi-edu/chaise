import { Locator, Page, TestInfo, expect, test } from '@playwright/test';

// locators
import RecordLocators from '@isrd-isi-edu/chaise/test/playwright/locators/record';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/playwright/locators/recordset';
import ModalLocators from '@isrd-isi-edu/chaise/test/playwright/locators/modal';
import PageLocators from '@isrd-isi-edu/chaise/test/playwright/locators/page';
import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/playwright/locators/recordedit';

import { getCatalogID, getEntityRow, EntityRowColumnValues } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.parameters';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/playwright/utils/constants';
import { clickAndVerifyDownload, clickNewTabLink, getClipboardContent, testTooltip } from '@isrd-isi-edu/chaise/test/playwright/utils/page-utils';
import { RecordsetRowValue, testRecordsetTableRowValues } from '@isrd-isi-edu/chaise/test/playwright/utils/recordset-utils';

type RelatedTableTestParams = {
  testTitle: string,
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

  comment?: string,
  inlineComment?: boolean,

  count: number,

  canEdit?: boolean,
  bulkEditLink?: string,

  canCreate?: boolean,
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
  pageSize?: number,

  add?: AddRelatedTableParams
};

export const testRelatedTablePresentation = async (page: Page, testInfo: TestInfo, params: RelatedTableTestParams) => {
  const currentEl = params.isInline ? RecordLocators.getEntityRelatedTable(page, params.displayname) : RecordLocators.getRelatedTableAccordion(page, params.displayname);
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

  if (params.inlineComment && params.comment) {
    await test.step('inline comment should be displayed.', async () => {
      const inlineComment = RecordLocators.getRelatedTableInlineComment(page, params.displayname);
      // we have to have this otherwise typescript will complain
      if (!params.comment) return;
      await expect.soft(inlineComment).toHaveText(params.comment);
    });
  }

  await test.step('table level', async () => {
    if (params.isMarkdown || (params.isInline && !params.isTableMode)) {
      const md = PageLocators.getMarkdownContainer(currentEl);

      await test.step('markdown container must be visible.', async () => {
        await expect.soft(md).toBeVisible();

        if (params.markdownValue) {
          await expect.soft(md).toHaveAttribute('innerHTML', params.markdownValue);
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

        await test.step('clicking on the toggle should change the view to tabular.', async () => {
          await markdownToggleLink.click();
          await expect.soft(markdownToggleLink).toHaveText('Custom mode');

          await testTooltip(markdownToggleLink, 'Switch back to the custom display mode.', APP_NAMES.RECORD, true);

          displayIsToggled = true;
        });
      }
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
          await exploreButton.click();
          await page.waitForURL('**/recordset/**');
          await RecordsetLocators.waitForRecordsetPageReady(page);

          await expect.soft(RecordsetLocators.getPageTitleElement(page), 'recordset title missmatch.').toHaveText(params.viewMore!.displayname);

          const chiclets = RecordsetLocators.getFacetFilters(page);
          await expect.soft(chiclets, 'filter didn\'t show up').toHaveCount(1);

          // const content = await chiclets.first().textContent();
          // expect.soft(content, 'filter missmatch').toBe(params.viewMore!.filter)
          await expect.soft(chiclets.nth(0)).toHaveText(params.viewMore!.filter);

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
        expect.soft(addBtn.isVisible()).toBe(params.canCreate);
      });

      if (params.canCreate) {
        await test.step('Add/link button should have the proper tooltip.', async () => {
          const expected = params.isAssociation ?
            `Connect ${params.displayname} records to this ${params.baseTableName}.` :
            `Create ${params.displayname} records for this ${params.baseTableName}.`;

          await testTooltip(addBtn, expected, APP_NAMES.RECORD, true);
        });

        if (params.add) {
          await testAddRelatedTable(addBtn, params.add);
        }
      }
    }
  });

  await test.step('row level', async () => {
    if (params.rowViewPaths) {
      await test.step("'View Details' button should have the correct link.", async () => {
        if (!params.rowViewPaths) return;

        let index = 0;
        for (const row of params.rowViewPaths) {
          const btn = RecordsetLocators.getViewActionButton(currentEl, index);
          expect.soft(await btn.getAttribute('href')).toContain(getURL('record', tableName, row));
          index++;
        }
      });
    }

    if (typeof params.canEdit === 'boolean') {
      if (!params.canEdit) {
        await test.step('edit button should not be visible.', async () => {
          expect.soft(currentEl.locator('.edit-action-button')).toBeVisible();
        });
      } else if (params.rowViewPaths) {
        // only testing the first link (it's a button not a link, so testing all of them would add a lot of test time)
        await test.step('clicking on edit button should open a tab to recordedit page', async () => {
          const btn = RecordsetLocators.getEditButton(currentEl, 0);

          expect.soft(btn).toBeVisible();

          // silence the ts error
          if (!params.rowViewPaths) return;

          const newPage = await clickNewTabLink(btn);
          await newPage.waitForURL(`**/chaise${getURL('recordedit', tableName, params.rowViewPaths[0])}`);
          await newPage.close();
        });
      }
    }

    if (typeof params.canDelete === 'boolean') {
      test.step('Delete or Unlink button', async () => {
        const deleteBtn = RecordsetLocators.getDeleteButton(currentEl, 0);

        if (params.canDelete) {
          await test.step('should be visible', async () => {
            expect.soft(deleteBtn).toBeVisible();
          });

          await test.step('should have the proper tooltip', async () => {
            let expected = 'Delete';
            if (params.isAssociation) {
              expected = `Disconnect ${params.displayname}: ${params.tableName} from this ${params.baseTableName}.`;
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
    });
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
   * pass `null` citation should not be displayed.
   */
  citation: string | null,
  /**
   * the location of the bibtext file so we can delete it after downloading it
   */
  bibtextFile?: string,
}

/**
 * test share cite modal features.
 *
 * @param params
 * @param URLPath if you want the test case to navigate before testing, pass the url path. otherwise skip this.
 */
export const testShareCiteModal = async (page: Page, params: ShareCiteModalParams) => {
  const expectedLink = params.link;
  const shareBtn = RecordLocators.getShareButton(page);
  const shareCiteModal = ModalLocators.getShareCiteModal(page);

  await test.step('share button should be available after the page is fully loaded.', async () => {

    await RecordLocators.waitForRecordPageReady(page);

    await shareBtn.waitFor({ state: 'visible' });
  });

  await test.step('should show the share dialog when clicking the share button.', async () => {
    await shareBtn.click();

    await expect(shareCiteModal).toBeVisible();

    await expect.soft(ModalLocators.getModalTitle(shareCiteModal)).toHaveText(params.title)

    // share link + citation + bibtext or just share link
    const count = params.citation ? 3 : 1;
    await expect.soft(ModalLocators.getModalListElements(shareCiteModal)).toHaveCount(count);

    await expect.soft(ModalLocators.getShareLinkHeader(shareCiteModal)).toHaveText('Share Link');
  });

  await test.step('should have proper links.', async () => {
    const expectedHeaders: string | string[] = params.hasVersionedLink ? ['Versioned Link', 'Live Link'] : ['Live Link'];
    await expect.soft(ModalLocators.getShareLinkSubHeaders(shareCiteModal)).toHaveText(expectedHeaders);

    await expect.soft(ModalLocators.getLiveLinkElement(shareCiteModal)).toHaveText(expectedLink);

    if (params.verifyVersionedLink) {
      // we cannot actually test the versioned link, so we're just making sure that it starts with the link
      await expect.soft(ModalLocators.getVersionedLinkElement(shareCiteModal)).toContainText(expectedLink);
    }
  });

  await test.step('copy to clipboard buttons should be available and work', async () => {
    const btns = ModalLocators.getShareLinkCopyBtns(shareCiteModal);

    await expect.soft(btns).toHaveCount(params.hasVersionedLink ? 2 : 1);

    // TODO test copy to clipboard
    const liveBtn = btns.nth(params.hasVersionedLink ? 1 : 0);
    await liveBtn.click();

    await page.pause();

    let clipboardText = await getClipboardContent(page);
    expect.soft(clipboardText).toBe(expectedLink);

    if (params.verifyVersionedLink) {
      await btns.first().click();

      clipboardText = await getClipboardContent(page);
      expect.soft(clipboardText).toBe(expectedLink);
    }
  });

  if (params.citation) {
    await test.step('should have a citation present', async () => {
      // verify citation
      await expect.soft(ModalLocators.getCitationHeader(shareCiteModal)).toHaveText('Data Citation');
      await expect.soft(ModalLocators.getCitationText(shareCiteModal)).toHaveText(params.citation!);

      // verify bibtex
      await expect.soft(ModalLocators.getDownloadCitationHeader(shareCiteModal)).toHaveText('Download Data Citation:');
      await expect.soft(ModalLocators.getBibtex(shareCiteModal)).toHaveText('BibTex');
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

    await shareCiteModal.waitFor({ state: 'detached' });
  });

}


type AddRelatedTableParams = {
  tableName: string,
  schemaName: string,
  /**
   * the displayname of the related reference (what users see)
   */
  relatedDisplayname: string,
  /**
   * the displayname of the related table
   */
  tableDisplayname: string,
  prefilledValues: {
    [colName: string]: {
      value: string,
      inputType: RecordeditInputType,
      isDisabled: boolean
    }
  },
  rowValuesAfter: RecordsetRowValue[]
}

export const testAddRelatedTable = async (addBtn: Locator, params: AddRelatedTableParams) => {
  await test.step('Add feature', async () => {

    let newPage: Page;
    await test.step('clicking on `Add` button should open recordedit.', async () => {
      newPage = await clickNewTabLink(addBtn);
      await newPage.waitForURL(`**/${params.schemaName}:${params.tableName}`);
      await expect(newPage).toHaveURL(/prefill\=/);
      await expect(RecordeditLocators.getPageTitle(newPage)).toHaveText(`Create 1 ${params.tableDisplayname}`)
    });

    await test.step('the opened form should have the prefill value for foreignkey.', async () => {
      // TODO
    });

    await test.step('submitting the form and coming back to record page should update the related table.', async () => {
      if (!newPage) return;


      // TODO

      newPage.close();
    });


    //   var recordeditUrl = browser.params.url + '/recordedit/#' + browser.params.catalogId + "/" + params.schemaName + ":" + params.tableName;

    //   expect(addBtn.isDisplayed()).toBeTruthy("add button is not displayed");
    //   // .click will focus on the element and therefore shows the tooltip.
    //   // and that messes up other tooltip tests that we have
    //   chaisePage.clickButton(addBtn).then(function () {
    //     // This Add link opens in a new tab so we have to track the windows in the browser...
    //     return browser.getAllWindowHandles();
    //   }).then(function (handles) {
    //     allWindows = handles;
    //     // ... and switch to the new tab here...
    //     return browser.switchTo().window(allWindows[1]);
    //   }).then(function () {
    //     return chaisePage.waitForElement(element(by.id('submit-record-button')));
    //   }).then(function () {

    //     return browser.wait(function () {
    //       return browser.driver.getCurrentUrl().then(function (url) {
    //         return url.startsWith(recordeditUrl);
    //       });
    //     }, browser.params.defaultTimeout);
    //   }).then(function () {
    //     // ... and then get the url from this new tab...
    //     return browser.driver.getCurrentUrl();
    //   }).then(function (url) {
    //     expect(url.indexOf('prefill=')).toBeGreaterThan(-1, "didn't have prefill");

    //     var title = chaisePage.recordEditPage.getEntityTitleElement().getText();
    //     expect(title).toBe('Create 1 ' + params.tableDisplayname + ' record', "recordedit title missmatch.");

    //     done();
    //   }).catch(function (err) {
    //     console.log(err);
    //     done.fail();
    //   });
    // });

    // it("the opened form should have the prefill value for foreignkey.", function (done) {
    //   for (var column in params.prefilledValues) {
    //     ((col) => {
    //       if (typeof params.prefilledValues[col] === 'object') {
    //         const colObj = params.prefilledValues[col];
    //         let input
    //         // disabled FK inputs are tested differently than disabled text inputs
    //         if (colObj.displayType === 'input') {
    //           input = chaisePage.recordEditPage.getInputForAColumn(col, 1);
    //           expect(input.getAttribute('value')).toBe(colObj.value, "value missmatch for " + col);
    //           expect(input.getAttribute('disabled')).toBe(colObj.value === "" ? null : 'true', "disabled missmatch for " + col);
    //         } else {
    //           input = chaisePage.recordEditPage.getForeignKeyInputDisplay(col, 1);
    //           expect(input.getText()).toBe(colObj.value, "value missmatch for " + col);

    //           input.getAttribute('class').then((classAttr) => {
    //             if (!colObj.isDisabled) {
    //               expect(classAttr.indexOf('input-disabled')).toBe(-1, col + " was disabled.");
    //             } else {
    //               expect(classAttr.indexOf('input-disabled')).toBeGreaterThan(-1, col + " was not disabled.");
    //             }
    //           });
    //         }

    //       } else {
    //         // NOTE/TODO: should probably be removed since all tests should be migrated to have an object
    //         const fkInput = chaisePage.recordEditPage.getForeignKeyInputDisplay(col, 1);
    //         expect(fkInput.getText()).toBe(params.prefilledValues[col], "value missmatch for " + col);

    //         fkInput.getAttribute('class').then((classAttr) => {
    //           if (params.prefilledValues[col] === "") {
    //             expect(classAttr.indexOf('input-disabled')).toBe(-1, col + " was disabled.");
    //           } else {
    //             expect(classAttr.indexOf('input-disabled')).toBeGreaterThan(-1, col + " was not disabled.");
    //           }
    //         });
    //       }
    //     })(column);
    //   }
    //   done();
    // });

    // it("submitting the form and coming back to record page should update the related table.", function (done) {
    //   inputCallback().then(function () {
    //     return chaisePage.recordEditPage.submitForm();
    //   }).then(function () {
    //     // wait until redirected to record page
    //     return browser.wait(EC.presenceOf(element(by.className('record-container'))), browser.params.defaultTimeout);
    //   }).then(function () {
    //     return browser.close();
    //   }).then(function () {
    //     return browser.switchTo().window(allWindows[0]);
    //   }).then(function () {
    //     //TODO should remove this, but sometimes it's not working in test cases
    //     return browser.driver.navigate().refresh();
    //   }).then(function () {
    //     // check for the updated value.
    //     //there's no loading indocator, so we have to wait for count
    //     return browser.wait(function () {
    //       return chaisePage.recordPage.getRelatedTableRows(params.relatedDisplayname, isInline).count().then(function (cnt) {
    //         return cnt === params.rowValuesAfter.length;
    //       }, function (err) { throw err; });
    //     });
    //   }).then(function () {
    //     checkRelatedRowValues(params.relatedDisplayname, isInline, params.rowValuesAfter, done);
    //   }).catch(function (error) {
    //     console.log(error);
    //     done.fail();
    //   });
    // });
  });
}
