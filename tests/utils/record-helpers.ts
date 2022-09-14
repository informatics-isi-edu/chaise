import { expect, test } from '@playwright/test';
import fs from 'fs';
import { recordPage } from '@isrd-isi-edu/chaise/tests/utils/record.page';
import { recordsetPage } from '@isrd-isi-edu/chaise/tests/utils/recordset.page';


/**
 * opens the share and cite popup and test the content. The acceptable input:
 * {
 *   permalink: 'the permalink', // required
 *   hasVersionedLink: boolean, // whether versioned link is present or not
 *   verifyVersionedLink: boolean, // if true, we will test the versioned link too.
 *   citation: string, // (optional) pass null if citation should not be displayed.
 *   bintextFile: string, // (optional) the location of the bibtext file so we can delete it after downloading it
 * }
 */
export const testSharePopup = (page: any, sharePopupParams: any) => {
    let shareButton, shareModal;

    test('should show the share dialog when clicking the share button, and should have the expected elements', async () => {
      shareButton = await recordPage.getShareButton(page);
      shareModal = await recordPage.getShareModal(page);

      await shareButton.click();
      await page.waitForSelector(shareModal, { state: 'visible' });
      // disable animations in modal so that it doesn't 'fade out' (instead it instantly disappears when closed) which we can't track with waitFor conditions
      shareModal.allowAnimations(false);

      // verify modal dialog contents
      const modalTitle = await recordPage.getModalTitle(page);
      await expect(modalTitle).toHaveText(sharePopupParams.title);

      // share link
      let num = 1;
      if (sharePopupParams.citation) {
        // share link + citation + bibtext
        num = 3;
      }
      const modalListElements = await recordPage.getModalListElements(page)
      await expect(modalListElements).toHaveCount(num);
    });

    test('should have a share header present.', async () => {
      const shareLinkHeader = await recordPage.getShareLinkHeader(page);
      await expect(shareLinkHeader).toHaveText('Share Link');
    });


    let testMessage = 'should only have a permalink present (no versioned link).';
    if (sharePopupParams.hasVersionedLink) {
      testMessage = 'should have a versioned link and permalink present.'
    }
    test(testMessage, async () => {
      const subheaders = await recordPage.getShareLinkSubHeaders(page);
      await expect(subheaders).toHaveCount(sharePopupParams.hasVersionedLink ? 2 : 1);

      if (sharePopupParams.hasVersionedLink) {
        // just make sure the link is defined
        await expect(subheaders[0]).toContainText('Versioned Link');

        // verify versioned link
        // NOTE this is conditional because in some cases the version link is not based on resolver and is not easy to test
        if (sharePopupParams.verifyVersionedLink) {
          const versionedLinkText = await recordPage.getVersionedLinkText(page)
          await expect(versionedLinkText).toContainText(sharePopupParams.permalink);
        }
      }

      // verify permalink
      await expect(subheaders[sharePopupParams.hasVersionedLink ? 1 : 0]).toContainText('Live Link');
      const permalinkText = await recordPage.getPermalinkText(page);
      await expect(permalinkText).toHaveText(sharePopupParams.permalink);
    });

    const numCopyIcons = sharePopupParams.hasVersionedLink ? 2 : 1;
    test(`should have ${numCopyIcons} copy to clipboard icons visible.`, async () => {
      const copyIcons = await recordPage.getCopyIcons(page);
      await expect(copyIcons).toHaveCount(numCopyIcons);
    });

    // NOTE: the copy buttons functionality isn't being tested because it seems really hacky to test this feature
    // xtest('should have 2 copy to clipboard icons visible and verify they copy the content.', function () {
    //   var copyIcons, copyInput;

    //   element(by.id('share-link')).all(by.css('.glyphicon.glyphicon-copy')).then(function (icons) {
    //     copyIcons = icons;

    //     expect(icons.length).toBe(2, 'wrong number of copy to clipboard icons');

    //     // click icon to copy text
    //     return copyIcons[0].click();
    //   }).then(function () {
    //     // creating a new input element
    //     return browser.executeScript(function () {
    //       var el = document.createElement('input');
    //       el.setAttribute('id', 'copy_input');

    //       document.getElementById('share-link').appendChild(el);
    //     });
    //   }).then(function () {
    //     // use the browser to send the keys 'ctrl/cmd' + 'v' to paste contents
    //     copyInput = element(by.id('copy_input'));
    //     copyInput.sendKeys(protractor.Key.chord(protractor.Key.SHIFT, protractor.Key.INSERT));

    //     return chaisePage.recordPage.getVersionedLinkText().getText();
    //   }).then(function (versionedLink) {

    //     // select the input and get it's 'value' attribute to verify the pasted contents
    //     expect(copyInput.getAttribute('value')).toBe(versionedLink, 'copied text for versioned link is incorrect');
    //   });
    // }).pend('Test case feels hacky to test a feature of the OS that can't be tested by just verifying the value was copied.');

    if (sharePopupParams.citation) {
      test('should have a citation present,', async () => {
        // verify citation
        const citationHeader = await recordPage.getCitationHeader(page);
        await expect(citationHeader).toHaveText('Data Citation');
        const citationText = await recordPage.getCitationText(page);
        await expect(citationText).toHaveText(sharePopupParams.citation);

        // verify download citation
        const downloadCitationHeader = await recordPage.getDownloadCitationHeader(page);
        await expect(downloadCitationHeader).toHaveText('Download Data Citation:');
        const bibtex = await recordPage.getBibtex(page);
        await expect(bibtex).toHaveText('BibTex');
      });
    }

    if (!process.env.CI && sharePopupParams.bibtextFile) {
      test('should download the citation in BibTex format.', async () => {
        await recordPage.getBibtex(page).click();

        await fs.existsSync(process.env.PWD + '/test/e2e/' + sharePopupParams.bibtextFile);
      });
    }

    test.afterAll(async () => {
      // close dialog
      await recordPage.getModalCloseBtn(page).click();
    });
};

/**
 * required attributes:
 * name
 * schemaName
 * displayname
 * count
 * canCreate
 * canEdit
 * canDelete
 * optional attributes:
 * isAssociation
 * isMarkdown
 * isInline
 * isTableMode
 * viewMore:
 *  - name
 *  - displayname
 *  - filter
 * rowValues
 * rowViewPaths
 * markdownValue
 * page_size (default 25)
 *
 *
 * testAdd
 * testEdit
 * testDelete
 */
export const testRelatedTable = async (page: any, params: any, pageReadyCondition: Function) => {
  let currentEl: any, 
    currentElCss: string, 
    markdownToggleLink: any, 
    markdownToggleLinkCss: string,
    toggled = false, 
    noRows = false;

  test.beforeAll(async () => {
    currentEl = await (params.isInline 
      ? recordPage.getEntityRelatedTable(page, params.displayname) 
      : recordPage.getRelatedTableAccordion(page, params.displayname)
    );

    currentElCss = (params.isInline 
      ? recordPage.getEntityRelatedTableCss(params.displayname) 
      : recordPage.getRelatedTableAccordionCss(params.displayname)
    );

    markdownToggleLink = await recordPage.getToggleDisplayLink(page, params.displayname, params.isInline);
    markdownToggleLinkCss = recordPage.getToggleDisplayLinkCss(params.displayname, params.isInline);
  });

  if (!params.isInline) {
    test('title should be correct.', async () => {
      const titleEl = await recordPage.getRelatedTableSectionHeader(page, params.displayname);
      await expect(titleEl).toHaveText(params.displayname);
    });
  }

  if (params.inlineComment) {
    test('comment should be displayed and correct', async () => {
      const relatedTableInlineComment = await recordPage.getRelatedTableInlineComment(page, params.displayname);
      await expect(relatedTableInlineComment).toHaveText(params.comment); 
    });
  }

  test.describe(`regarding table level actions for table ${params.displayname}, `, () => {

    // Explore
    test.describe('`Explore` button, ', () => {
      let exploreBtn: any;

      test.beforeAll(async () => {
        exploreBtn = await recordPage.getMoreResultsLink(page, params.displayname, params.isInline);
      });

      test('should be displayed.', async () => {
        await expect(exploreBtn).toBeVisible();
      });

      test('should have the correct tooltip.', async () => {
        const comment = await recordPage.getColumnCommentHTML(page, exploreBtn);
        await expect(comment).toHaveText(`'Explore more ${params.displayname} records related to this ${params.baseTable}.'`);
      });

      if (params.viewMore) {
        test('should always go to recordset app with correct set of filters.', async () => {
          await exploreBtn.click()
          
          const url = await page.url()
          await expect(url).toContainText('recordset');
          await recordsetPage.recordsetPageReady(page);

          await expect(recordsetPage.getPageTitleElement(page)).toHaveText(params.viewMore.displayname);
          await expect(recordsetPage.getFacetFilters(page)).toHaveCount(1);
          await expect(recordsetPage.getFacetFilters(page).first()).toHaveText(params.viewMore.filter);
          // await expect(recordsetPage.getFacetFilters(page).nth(0)).toHaveText(params.viewMore.filter);
          // await expect(recordsetPage.getFacetFilters(page).nth(0)).toHaveText(params.viewMore.filter, {useInnerText: true});
          
          await page.navigate().back();
          await pageReadyCondition();
        });
      }
    });

    // Display Mode
    test.describe('view mode and rows, ', () => {
      let exploreBtn: any;

      if (params.isMarkdown || (params.isInline && !params.isTableMode)) {
        test('markdown container must be visible.', async () => {
          await expect(page.locator(currentElCss + ' .markdown-container')).toBeVisible();
        });

        if (params.markdownValue) {
          test('correct markdown values should be visible.', async () => {
            await expect(page.locator(currentElCss + ' .markdown-container').getAttribute('innerHTML')).toHaveText(params.markdownValue);
            // await expect(page.locator(currentElCss + ' .markdown-container').getAttribute('innerHTML')).toHaveText(params.markdownValue, {useInnerText: true});
          });
        }

        if (params.canEdit) {
          test('`Edit mode` button should be visible to switch to tabular mode.', async () => {
            // revert is `Display`
            await expect(markdownToggleLink).toBeVisible();
            await expect(markdownToggleLink).toHaveText('Edit mode');

            const comment = await recordPage.getColumnCommentHTML(page, markdownToggleLink)
            await expect(comment).toBe(`'Display edit controls for ${params.displayname} related to this ${params.baseTable}.'`);
          });
        } else {
          test('`Table mode` button should be visible to switch to tabular mode.', async () => {
            // revert is `Revert Display`
            await expect(markdownToggleLink).toBeVisible();
            await expect(markdownToggleLink).toHaveText('Table mode');

            const comment = await recordPage.getColumnCommentHTML(page, markdownToggleLink)
            await expect(comment).toBe(`'Display related ${params.displayname} in tabular mode.'`);
          });
        }

        test('clicking on the toggle should change the view to tabular.', async () => {
          await markdownToggleLink.click()
          await expect(markdownToggleLink).toHaveText('Custom mode');

          const comment = await recordPage.getColumnComment(page, markdownToggleLink);
          await expect(comment).toBe('Switch back to the custom display mode');

          toggled = true;
        });

      } else {
        test('option for different display modes should not be presented to user.', async () => {
          await expect(markdownToggleLink).toBeHidden();
        });
      }

      if (params.rowValues) {
        // since we toggled to row, the data should be available.
        test('rows of data should be correct and respect the given page_size.', async () => {
          // wait for table to be visible before waiting for it's contents to load
          exploreBtn = await recordPage.getMoreResultsLink(page, params.displayname, params.isInline);
          await expect(recordPage.getRelatedTableRows(page, params.displayname, params.isInline)).toHaveCount(params.rowValues.length);
          
          // TODO
          // checkRelatedRowValues(params.displayname, params.isInline, params.rowValues, );
        });
      }
    });

    if (typeof params.canCreate === 'boolean') {
      test(`'Add' button should be ${params.canCreate ? 'visible.' : 'invisible.'}`, async () => {
        const addBtn = await recordPage.getAddRecordLink(page, params.displayname, params.isInline);
        
        if (params.canCreate) {
          expect(addBtn).toBeVisible();
          const addBtnCss = recordPage.getAddRecordLinkCss(params.displayname, params.isInline);
          const comment = await recordPage.getColumnCommentHTML(page, addBtnCss + ' xpath=./..');
          
          await expect(comment).toBe(`'Connect ${params.displayname} records to this ${params.baseTable}.'`);  
        } else {
          expect(addBtn).toBeHidden();
        }
      });
    }
  });

  // // in our test cases we are changing the view to tabular
  // test.describe('regarding row level actions, ', function () {

  //   if (params.rowViewPaths) {
  //     test(''View Details' button should have the correct link.', function () {
  //       var tableName = (params.isAssociation ? params.relatedName : params.name);
  //       params.rowViewPaths.forEach(function (row, index) {
  //         var expected = '/record/#' + browser.params.catalogId + '/' + params.schemaName + ':' + tableName + '/';
  //         var dataRow = chaisePage.getEntityRow(params.schemaName, tableName, row);
  //         expected += 'RID=' + dataRow.RID;
  //         var btn = chaisePage.recordPage.getRelatedTableRowLink(params.displayname, index, params.isInline);
  //         expect(btn.getAttribute('href')).toContain(expected, 'link missmatch for index=' + index);
  //       });
        
  //     });
  //   }

  //   if (typeof params.canEdit === 'boolean') {
  //     if (!params.canEdit) {
  //       test('edit button should not be visible.', function () {
  //         expect(currentEl.all(by.css('.edit-action-button')).isPresent()).not.toBeTruthy();
          
  //       });
  //     } else if (params.rowViewPaths) {
  //       // only testing the first link (it's a button not a link, so testing all of them would add a lot of test time)
  //       test('clicking on 'edit` button should open a tab to recordedit page.', function () {
  //         var btn = chaisePage.recordPage.getRelatedTableRowEdtest(params.displayname, 0, params.isInline);

  //         expect(btn.isDisplayed()).toBeTruthy('edit button is missing.');
  //         chaisePage.clickButton(btn).then(function () {
  //           return browser.getAllWindowHandles();
  //         }).then(function (handles) {
  //           allWindows = handles;
  //           return browser.switchTo().window(allWindows[1]);
  //         }).then(function () {
  //           var tableName = (params.isAssociation ? params.relatedName : params.name);
  //           var result = '/recordedit/#' + browser.params.catalogId + '/' + params.schemaName + ':' + tableName;

  //           result += '/RID=' + chaisePage.getEntityRow(params.schemaName, tableName, params.rowViewPaths[0]).RID;

  //           expect(browser.driver.getCurrentUrl()).toContain(result, 'expected link missmatch.');
  //           return browser.close()
  //         }).then(function () {
  //           return browser.switchTo().window(allWindows[0]);
  //         }).then(function () {
            
  //         }).catch(function (err) {
  //           console.log(err);
  //           .fail();
  //         });
  //       });
  //     }
  //   }

  //   if (typeof params.canDelete === 'boolean') {
  //     test.describe('`Delete` or `Unlink` button, ', function () {
  //       var deleteBtn;
  //       beforeAll(function () {
  //         deleteBtn = chaisePage.recordPage.getRelatedTableRowDelete(params.displayname, 0, params.isInline);
          
  //       })
  //       if (params.canDelete) {
  //         test('should be visible.', function () {
  //           expect(deleteBtn.isDisplayed()).toBeTruthy('delete button is missing.');
            
  //         });

  //         if (params.isAssociation) {
  //           test('button tooltip should be `Unlink`.', function () {
  //             expect(deleteBtn.getAttribute('uib-tooltip')).toBe('Disconnect ' + params.displayname + ': ' + params.entityMarkdownName + ' from this ' + params.baseTable + '.');
              
  //           });
  //         } else {
  //           test('button tooltip be `Delete`.', function () {
  //             expect(deleteBtn.getAttribute('uib-tooltip')).toBe('Delete');
              
  //           });
  //         }

  //         test('it should update the table and title after confirmation.', function () {
  //           var currentCount, confirmButton;
  //           chaisePage.recordPage.getRelatedTableRows(params.displayname, params.isInline).count().then(function (count) {
  //             currentCount = count;
  //             return chaisePage.clickButton(deleteBtn);
  //           }).then(function () {
  //             confirmButton = chaisePage.recordPage.getConfirmDeleteButton();
  //             return browser.watest(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);
  //           }).then(function () {
  //             return confirmButton.click();
  //           }).then(function () {
  //             return chaisePage.waitForElementInverse(element(by.id('spinner')));
  //           }).then(function () {

  //             // make sure the rows are updated
  //             return browser.watest(function () {
  //               return chaisePage.recordPage.getRelatedTableRows(params.displayname, params.isInline).count().then(function (ct) {
  //                 return (ct == currentCount - 1);
  //               });
  //             }, browser.params.defaultTimeout);
  //           }).then(function () {
  //             return chaisePage.recordPage.getRelatedTableRows(params.displayname, params.isInline).count();
  //           }).then(function (count) {
  //             expect(count).toBe(currentCount - 1, 'count didn't change.');

  //             noRows = count == 0;
              
  //           }).catch(function (err) {
  //             console.log(err);
  //             .fail();
  //           })
  //         });

  //       } else {
  //         test('should not be visible.', function () {
  //           expect(deleteBtn.isDisplayed()).toBe(false, 'delete button was visible.');
            
  //         });
  //       }
  //     });
  //   }
  // });

  // // if it was markdown, we are changing the view, change it back.
  // afterAll(function () {
  //   if (toggled && !noRows) {
  //     markdownToggleLink.click().then(function () {
        
  //     }).catch(function (error) {
  //       console.log(error);
  //       .fail();
  //     });
  //   } else {
      
  //   }
  // });
};