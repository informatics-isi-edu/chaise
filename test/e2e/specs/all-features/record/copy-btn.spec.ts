import { test, expect } from '@playwright/test';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import ExportLocators from '@isrd-isi-edu/chaise/test/e2e/locators/export';

import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { getEntityRow } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { testSubmission } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { testShareCiteModal } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams = {
  table_name: 'editable-id-table',
  tocHeaders: [
    'Summary', 'accommodation_image (4)', 'booking (2)', 'more-files (1)',
    'more-media (1)', 'new_media (2)', 'new_media_2 (2)', 'new_media_3 (2)',
    'new_media_4 (2)', 'new_media_5 (2)', 'new_media_6 (2)',
    'new_media_7 (2)', 'new_media_8 (2)', 'new_media_9 (2)'
  ],
  html_table_name: 'html-name-table',
  html_table_display: '<strong>Html Name</strong>',
  copy_test: {
    table_name: 'editable-id-table',
    table_displayname: 'Editable Id Table',
    table_inner_html_display: '<strong>Editable Id Table</strong>',
    entity_title: '1',
    entity_inner_html_title: '<strong>1</strong>',
    /**
     * testing the following scenarios:
     * - normal columns can be copied over.
     * - generated columns are ignored.
     * - asset metadata are copied with the asset.
     */
    column_names: ['id', 'text', 'int', 'asset1_uri', 'asset1_filename', 'asset1_bytes'],
    column_values: [
      [
        '777',
        'text',
        '17',
        {
          url: 'https://example.com/path/to/saved_filename.png',
          caption: 'saved_filename.png'
        },
        'saved_filename.png',
        '512 kB'
      ]
    ]
  }
};

test.describe('View existing record,', function () {

  test('disableDefaultExport=true and showWriterEmptyRelatedOnLoad=false chaise-config support', async ({ page, baseURL }, testInfo) => {
    await test.step('should load the page properly', async () => {
      await page.goto(generateChaiseURL(APP_NAMES.RECORD, 'product-max-RT', 'accommodation', testInfo, baseURL) + '/id=2002');
      await RecordLocators.waitForRecordPageReady(page);
    });

    await test.step('should have only "This record (CSV)" option in export menu because of `disableDefaultExport` chaise-config.', async () => {
      await ExportLocators.getExportDropdown(page).click();
      const options = ExportLocators.getExportOptions(page);
      await expect.soft(options).toHaveCount(1);
      await expect.soft(options).toHaveText('This record (CSV)');
    });

    await test.step('should hide empty related tables on load', async () => {
      const headers = RecordLocators.getSidePanelHeadings(page);
      await expect.soft(headers).toHaveCount(testParams.tocHeaders.length);
      await expect.soft(headers).toHaveText(testParams.tocHeaders);
    });

  });

  // tests for subtitle link, resolverImplicitCatalog, and no citation in share modal, and disabled export button
  test(`for table ${testParams.html_table_name} table`, async ({ page, baseURL, context }, testInfo) => {
    const baseAppURL = generateChaiseURL(APP_NAMES.RECORD, 'editable-id', testParams.html_table_name, testInfo, baseURL);

    await test.step('should load the page properly', async () => {
      await page.goto(`${baseAppURL}/id=1`);
      await RecordLocators.waitForRecordPageReady(page);
    });

    await test.step('should display the entity subtitle name with html in it', async () => {
      await expect.soft(RecordLocators.getEntitySubTitleElement(page)).toHaveText(testParams.html_table_display);
    });

    // we're not using default tempaltes and csv option is disabled
    await test.step('export button should be disabled', async () => {
      await expect.soft(ExportLocators.getExportDropdown(page)).toBeDisabled();
    });

    await test.step('should hide the column headers and collapse the table of contents based on table-display annotation.', async () => {
      for (const i of [0, 1, 2]) {
        await expect.soft(RecordLocators.getColumns(page).nth(i)).not.toBeVisible();
      }
      await expect.soft(RecordLocators.getSidePanel(page)).toHaveClass(/close-panel/);
    });

    // test that no citation appears in share modal when no citation is defined on table
    await test.step('share and cite modal', async () => {
      const keyValues = [{ column: 'id', value: '1' }];
      const ridValue = getEntityRow(testInfo, 'editable-id', testParams.html_table_name, keyValues).RID;
      const link = `${baseAppURL}/RID=${ridValue}`;
      await testShareCiteModal(page, testInfo, {
        title: 'Share',
        link,
        hasVersionedLink: true,
        verifyVersionedLink: false,
        citation: false,
      });
    });

    await test.step('open a new tab, update the current record, close the tab, and then verify the share dialog alert warning appears', async () => {
      // go to recordedit in a new tab
      const newPage = await context.newPage();
      await newPage.goto(generateChaiseURL(APP_NAMES.RECORDEDIT, 'editable-id', testParams.html_table_name, testInfo, baseURL) + '/id=1');
      await RecordeditLocators.waitForRecordeditPageReady(newPage);

      // set a field and submit
      await RecordeditLocators.getInputForAColumn(newPage, 'text', 1).fill('edited');
      await RecordeditLocators.submitForm(newPage);
      await newPage.waitForURL('**/record/**');

      // close the second tab
      await newPage.close();

      // open the share popup on the first tab
      await RecordLocators.getShareButton(page).click();
      const shareCiteModal = ModalLocators.getShareCiteModal(page);
      await expect.soft(shareCiteModal).toBeVisible();

      const alert = AlertLocators.getWarningAlert(shareCiteModal);
      await expect.soft(alert).toBeVisible();
      const expected = [
        'Warning',
        'The displayed content may be stale due to recent changes made by other users. ',
        'You may wish to review the changes prior to sharing the live link below. ',
        'Or, you may share the older content using the versioned link.',
      ].join('');
      await expect.soft(alert).toHaveText(expected);

    });

  });

  test(`for table ${testParams.copy_test.table_name} table`, async ({ page, baseURL }, testInfo) => {
    await test.step('should load the page properly', async () => {
      await page.goto(generateChaiseURL(APP_NAMES.RECORD, 'editable-id', testParams.copy_test.table_name, testInfo, baseURL) + '/id=1');
      await RecordLocators.waitForRecordPageReady(page);
    });

    await test.step('should not have the default csv export option and only the defined template should be available', async () => {
      await ExportLocators.getExportDropdown(page).click();
      /**
       * the acl test cases might run in parallel with this one and add the "Configurations".
       * so we cannot assume the number of options here.
       */
      const annotTemplate = ExportLocators.getExportOption(page, 'Defined template');
      await expect.soft(annotTemplate).toHaveText('Defined template');
      await expect.soft(ExportLocators.getExportOption(page, 'This record (CSV)')).not.toBeAttached();

      await ExportLocators.getExportDropdown(page).click();
    });

    await test.step('should display the entity title and subtitle based on their markdown patterns.', async () => {
      const subtitle = RecordLocators.getEntitySubTitleElementInner(page);
      await expect.soft(subtitle).toHaveText(testParams.copy_test.table_displayname)
      expect.soft(await subtitle.innerHTML()).toBe(testParams.copy_test.table_inner_html_display);

      const title = RecordLocators.getEntityTitleElement(page);
      await expect.soft(title).toHaveText(testParams.copy_test.entity_title);
      expect.soft(await title.innerHTML()).toBe(testParams.copy_test.entity_inner_html_title);
    });

    await test.step('copy button', async () => {

      await test.step('should redirect to recordedit when clicked.', async () => {
        await RecordLocators.getCopyRecordButton(page).click();
        await page.waitForURL('**/recordedit/**');
        await RecordeditLocators.waitForRecordeditPageReady(page);
        await expect.soft(RecordeditLocators.getRecordeditForms(page)).toHaveCount(1);
      });

      await test.step('should have the proper page and tab title', async () => {
        await expect.soft(RecordeditLocators.getPageTitle(page)).toHaveText(`Create 1 ${testParams.copy_test.table_displayname} record`);
        await expect.soft(await RecordeditLocators.getPageTitleLinkInner(page).innerHTML()).toBe(testParams.copy_test.table_inner_html_display);

        const chaiseConfigHeadtitle = 'this one should be ignored in favor of navbarBrandText';
        await expect.soft(page).toHaveTitle(`Create new ${testParams.copy_test.table_displayname} | ${chaiseConfigHeadtitle}`)
      });

      // because of a bug in column permission error,
      // chaise was showing the column permission overlay and users couldn't
      // edit the values. This test case is to make sure that logic is correct
      await test.step('should not have any permission errors', async () => {
        await expect.soft(RecordeditLocators.getAllColumnPermissionOverlays(page)).not.toBeAttached();
      });

      await test.step('should have "Automatically Generated" in an input that is generated.', async () => {
        const inp = RecordeditLocators.getInputForAColumn(page, 'generated', 1);
        await expect.soft(inp).toHaveAttribute('placeholder', 'Automatically generated');
      });

      await test.step('should alert the user if trying to submit data without changing the id.', async () => {
        await RecordeditLocators.getSubmitRecordButton(page).click();
        const alert = AlertLocators.getErrorAlert(page);
        await expect.soft(alert).toBeVisible();
        await expect.soft(alert).toContainText('The entry cannot be created/updated. Please use a different id for this record.');
      });

      await test.step('after changing the id and submission, all the appropriate data should be copied.', async () => {
        await RecordeditLocators.getInputForAColumn(page, 'id', 1).fill('777');
        await testSubmission(page, {
          tableDisplayname: testParams.copy_test.table_displayname,
          resultColumnNames: testParams.copy_test.column_names,
          resultRowValues: testParams.copy_test.column_values
        });
      });

    });
  });
});
