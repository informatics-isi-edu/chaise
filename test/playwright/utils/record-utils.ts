import { BrowserContext, Page, TestInfo, expect, test } from '@playwright/test';

// locators
import RecordLocators from '@isrd-isi-edu/chaise/test/playwright/locators/record';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/playwright/locators/recordset';
import PageLocators from '@isrd-isi-edu/chaise/test/playwright/locators/page';
import ModalLocators from '@isrd-isi-edu/chaise/test/playwright/locators/modal';

// utils
import { getCatalogID, getEntityRow } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.parameters';

type RelatedTableRowValue = string | {
  url: string,
  caption: string
};

type RelatedTableTestParam = {
  testTitle: string,
  tableName: string,
  schemaName: string,
  displayname: string,
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
  rowValues?: RelatedTableRowValue[][],
  rowViewPaths?: { column: string, value: string }[][],
  markdownValue?: string,
  /**
   * default 25
   */
  pageSize?: number,

  add?: any
};

export const testRelatedTablePresentation = async (page: Page, context: BrowserContext, testInfo: TestInfo, params: RelatedTableTestParam) => {

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

  await test.step('table level actions', async () => {

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
  });

  await test.step('row level actions', async () => {
    if (params.rowViewPaths) {
      await test.step("'View Details' button should have the correct link.", async () => {
        const tableName = (params.isAssociation ? params.associationLeafTableName : params.tableName);
        if (!params.rowViewPaths) return;

        let index = 0;
        for (const row of params.rowViewPaths) {
          const savedData = getEntityRow(testInfo, params.schemaName, params.tableName, row);
          const expected = `/record/#${getCatalogID(testInfo.project.name)}/${params.schemaName}:${params.tableName}/RID=${savedData.RID}`;

          const btn = RecordLocators.getRelatedTableRowLink(page, params.displayname, index, params.isInline);
          expect(await btn.getAttribute('href')).toContain(expected);
          index++;
        }
      });
    }
  });
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
export const testShareCiteModal = async (page: Page, params: ShareCiteModalParams, URLPath?: string) => {

  // test('for share & citation modal', async ({ page, baseURL }, testInfo) => {

  // const expectedLink = typeof params.link === 'string' ? params.link : params.link(baseURL, testInfo);
  const expectedLink = params.link;

  const shareBtn = RecordLocators.getShareButton(page);
  const shareCiteModal = ModalLocators.getShareCiteModal(page);

  await test.step('share button should be available after the page is fully loaded.', async () => {
    // if (URLPath) {
    //   const PAGE_URL = `/record/#${getCatalogID(testInfo.project.name)}/${URLPath}`;
    //   await page.goto(`${baseURL}${PAGE_URL}`);
    // }

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

    let clipboardText = await PageLocators.getClipboardContent(page);
    expect.soft(clipboardText).toBe(expectedLink);

    if (params.verifyVersionedLink) {
      await btns.first().click();

      clipboardText = await PageLocators.getClipboardContent(page);
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
      await PageLocators.clickAndVerifyDownload(btn, params.bibtextFile, page);
    });
  }

  await test.step('clicking on close button should close the modal.', async () => {
    await ModalLocators.getCloseBtn(shareCiteModal).click();

    await shareCiteModal.waitFor({ state: 'detached' });
  });

  // });
}
