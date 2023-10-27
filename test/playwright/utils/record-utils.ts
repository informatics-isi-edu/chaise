import { Page, TestInfo, expect, test } from '@playwright/test';

// locators
import RecordLocators from '@isrd-isi-edu/chaise/test/playwright/locators/record';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/playwright/locators/recordset';
import PageLocators from '@isrd-isi-edu/chaise/test/playwright/locators/page';
import ModalLocators from '@isrd-isi-edu/chaise/test/playwright/locators/modal';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.parameters';
import { Modal } from 'react-bootstrap';

type RelatedTableTestParam = {
  testTitle: string,
  name: string,
  schemaName: string,
  displayname: string,
  inlineComment?: string,

  count: number,
  canEdit: boolean,
  canCreate: boolean,
  canDelete: boolean,

  isAssociation?: boolean,
  isMarkdown?: boolean
  isInline?: boolean,
  isTableMode?: boolean
  viewMore?: {
    name: string,
    displayname: string,
    filter: string,
  },
  rowValues?: string[],
  rowViewPaths?: string[],
  markdownValue?: string,
  /**
   * default 25
   */
  page_size?: number,
  testAdd?: boolean,
  testEdit?: boolean,
  testDelete?: boolean,
};

export const testRelatedTablePresentation = (pagePath: string, params: RelatedTableTestParam) => {
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/${pagePath}`;
    await page.goto(`${baseURL}${PAGE_URL}`);

    await RecordLocators.waitForRecordPageReady(page);
  });


  test('basic features', async ({ page }) => {
    test.skip(!!params.isInline && !params.inlineComment);

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
  });

  test(`table level actions for ${params.displayname}`, async ({ page, context }) => {

    await test.step('Explore button', async () => {
      const exploreButton = RecordLocators.getMoreResultsLink(page, params.displayname, params.isInline);

      await test.step('should be displayed.', async () => {
        await expect.soft(exploreButton).toBeVisible();
      });


      if (params.viewMore) {
        await test.step('should go to the recordset app with correct set of filters', async () => {
          const newPage = await PageLocators.clickNewTabLink(exploreButton, context);
          await newPage.waitForURL('**/recordset/**');
          await RecordsetLocators.waitForRecordsetPageReady(newPage);

          await expect.soft(RecordsetLocators.getPageTitleElement(newPage), 'recordset title missmatch.').toHaveText(params.viewMore!.displayname);

          const chiclets = RecordsetLocators.getFacetFilters(page);
          await expect.soft(chiclets, 'filter didn\'t show up').toHaveCount(1);
          await expect.soft(chiclets.first(), 'filter missmatch').toHaveText(params.viewMore!.filter)

          await newPage.close();
        });

      }

    });

    // if (typeof params.canEdit === 'boolean') {
    // }


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
