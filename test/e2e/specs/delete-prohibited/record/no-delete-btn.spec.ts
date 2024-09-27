import { test, expect } from '@playwright/test';

import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import NavbarLocators from '@isrd-isi-edu/chaise/test/e2e/locators/navbar';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import { getCatalogID, getEntityRow, updateCatalogAnnotation } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { getPageURLOrigin } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';


test.describe('record page with specific chaise-config properties', () => {
  let pageURLWithRID = '', RIDValue = '';

  test.beforeAll(async ({ }, testInfo) => {
    const catalogId = getCatalogID(testInfo.project.name);

    // make sure the resolverImplicitCatalog is the same as current catalog id
    await updateCatalogAnnotation(catalogId, {
      'tag:isrd.isi.edu,2019:chaise-config': {
        'resolverImplicitCatalog': catalogId,
        /**
         * we have to make sure the config params that the other parallel test needs are also included
         * NOTE:
         * there might be a better way to do this. the function could fetch the existing annot and merge them.
         * calling updateCatalogAnnotation in both specs won't work because one will override another one.
         * also ermrest might throw a 503 if we attempt to change the catalog at the same time.
         */
        'navbarBrandText': 'override test123',
        'navbarBrandImage': '../images/logo.png'
      }
    });
  });

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    const urlPrefix = `${baseURL}/record/#${getCatalogID(testInfo.project.name)}/product-record:accommodation`;

    RIDValue = getEntityRow(testInfo, 'product-record', 'accommodation', [{ column: 'id', value: '4004' }]).RID;
    pageURLWithRID = `${urlPrefix}/RID=${RIDValue}`;

    await page.goto(`${urlPrefix}/id=4004`);
    await RecordLocators.waitForRecordPageReady(page);
  });

  test('different parts of the page', async ({ page }) => {
    await test.step('should display a disabled delete record button', async () => {
      await expect.soft(RecordLocators.getDeleteRecordButton(page)).toBeDisabled();
    });

    await test.step('Record Table of Contents panel should be hidden by default as chaiseConfig entry hideTableOfContents is true.', async () => {
      const showTocBtn = RecordLocators.getShowTocBtn(page);
      await expect.soft(showTocBtn).toBeVisible();
      await expect.soft(RecordLocators.getSidePanel(page)).toHaveClass(/close-panel/);

      // open toc for next test
      await showTocBtn.click();
    });

    await test.step('Related tables should all show by default because of showWriterEmptyRelatedOnLoad=true', async () => {
      const expectedHeaders = ['Summary', 'booking (0)', 'accommodation_collections (0)', 'table_w_aggregates (0)',
        'accommodation_image_assoc (0)', 'table_w_invalid_row_markdown_pattern (0)',
        'accommodation_image (0)', 'media (0)'];

      await expect.soft(RecordLocators.getSidePanelHeadings(page)).toHaveCount(expectedHeaders.length);
      await expect.soft(RecordLocators.getSidePanelHeadings(page)).toHaveText(expectedHeaders);
    });

    await test.step('Should have the proper permalink in the share popup if resolverImplicitCatalog is the same as catalogId', async () => {
      const origin = await getPageURLOrigin(page);
      const shareModal = ModalLocators.getShareCiteModal(page);

      await RecordLocators.getShareButton(page).click();
      await expect.soft(shareModal).toBeVisible();
      await expect.soft(ModalLocators.getLiveLinkElement(shareModal)).toHaveText(`${origin}/id/${RIDValue}`);

    });
  });

  test('should show an error dialog if an improper RID is typed into the RID search box', async ({ page }) => {
    // test.skip(!!process.env.CI, 'in CI the resolver server component is not configured and cannot be tested');

    await NavbarLocators.getGoToRIDInput(page).clear();
    await NavbarLocators.getGoToRIDInput(page).fill('someobviouslywrongRID');
    await NavbarLocators.getGoToRIDButton(page).click();

    const errModal = ModalLocators.getErrorModal(page);
    await expect(errModal).toBeVisible();
    await expect(ModalLocators.getModalTitle(errModal)).toHaveText('Record Not Found');

    await expect(ModalLocators.getModalText(errModal)).toHaveText(
      'The record does not exist or may be hidden. If you continue to face this issue, please contact the system administrator.'
    );

    await ModalLocators.getCloseBtn(errModal).click();
    await expect(page).toHaveURL(pageURLWithRID);

  });
});
