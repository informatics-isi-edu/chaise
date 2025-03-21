import { test, expect, TestInfo, Page, Locator } from '@playwright/test';

import RecordeditLocators, { RecordeditInputType } from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';

import { removeAuthCookieAndReload } from '@isrd-isi-edu/chaise/test/e2e/utils/user-utils';
import { setInputValue } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

test.describe('error handling', () => {
  // run all test cases in here in parallel
  test.describe.configure({ mode: 'parallel' });

  test.describe('record app', () => {
    test('navigating to a page with invalid table name', async ({ page, baseURL }, testInfo) => {
      const errorModal = ModalLocators.getErrorModal(page);

      await test.step('An error modal should appear with proper title and message', async () => {
        await page.goto(getChaiseURL(APP_NAMES.RECORD, 'accommodation_not_found', baseURL, testInfo) + '/id=11223312121');
        await expect.soft(errorModal).toBeVisible();
        await testModalTitleAndText(errorModal,
          'Item Not Found',
          'Table accommodation_not_found not found in schema.Click OK to go to the Home Page.'
        );
      });

      await test.step('clicking on OK button should redirect to homepage', async () => {
        await ModalLocators.getOkButton(errorModal).click();
        // we cannot check the exact url as it runs on CI and local. so we're just making sure it's not recordset
        await page.waitForURL(new RegExp('^((?!recordset).)*$'));
      });
    });

    test('navigating to a page with that returns no record', async ({ page, baseURL }, testInfo) => {
      const errorModal = ModalLocators.getErrorModal(page);
      const recordPageURL = getChaiseURL(APP_NAMES.RECORD, 'accommodation', baseURL, testInfo) + '/id=11223312121';

      await test.step('An error modal should appear with proper title and message', async () => {
        await page.goto(recordPageURL);
        await expect.soft(errorModal).toBeVisible();
        await testModalTitleAndText(errorModal,
          'Record Not Found',
          [
            'The record does not exist or may be hidden. ',
            'If you continue to face this issue, please contact the system administrator.',
            'Click OK to show the list of all records.'
          ].join('')
        );
      });

      await test.step('clicking on OK button should redirect to the recordset page', async () => {
        await ModalLocators.getOkButton(errorModal).click();
        await page.waitForURL('**' + getChaiseURL(APP_NAMES.RECORDSET, 'accommodation', baseURL, testInfo) + '**');
      });

      await test.step('clicking back button should go back to the initial page', async () => {
        await page.goBack();
        await expect.soft(page).toHaveURL(recordPageURL);
      });
    });

    test('navigating to a page that returns multiple records', async ({ page, baseURL }, testInfo) => {
      const errorModal = ModalLocators.getErrorModal(page);

      await test.step('An error modal should appear with proper title and message', async () => {
        await page.goto(getChaiseURL(APP_NAMES.RECORD, 'multiple_records', baseURL, testInfo) + '/id=10007');
        await expect.soft(errorModal).toBeVisible();
        await testModalTitleAndText(errorModal,
          'Multiple Records Found',
          'There are more than 1 record found for the filters provided.Click OK to show all the matched records.'
        );
      });

      await test.step('clicking on OK button should redirect to the recordset page', async () => {
        await ModalLocators.getOkButton(errorModal).click();
        // using wildcard since the url might have query parameters and sort
        await page.waitForURL('**' + getChaiseURL(APP_NAMES.RECORDSET, 'multiple_records', '', testInfo) + '/id=10007**');
      });
    });

    test('attempting to delete a record that is already referenced', async ({ page, baseURL }, testInfo) => {
      const errorModal = ModalLocators.getErrorModal(page);

      await test.step('users should see an error with proper information about the issue', async () => {
        await page.goto(getChaiseURL(APP_NAMES.RECORD, 'accommodation', baseURL, testInfo) + '/id=2002');
        await RecordLocators.waitForRecordPageReady(page);

        await RecordLocators.getDeleteRecordButton(page).click();
        const confirmModal = ModalLocators.getConfirmDeleteModal(page);
        await expect.soft(confirmModal).toBeVisible();
        await ModalLocators.getOkButton(confirmModal).click();
        await expect.soft(confirmModal).not.toBeAttached();

        await expect.soft(errorModal).toBeVisible();
        await expect.soft(ModalLocators.getModalTitle(errorModal)).toHaveText('Conflict');
        const text = ModalLocators.getModalText(errorModal);

        // depending on when this test case is running, it could be one of these error messages
        const expectedDeleteMessages = [
          'This entry cannot be deleted as it is still referenced from the booking table.',
          'This entry cannot be deleted as it is still referenced from the accommodation_image table.'
        ]
        await expect.soft(text).toContainText(new RegExp(`(${expectedDeleteMessages.join('|')})`));
        await expect.soft(text).toContainText([
          'All dependent entries must be removed before this item can be deleted.  ',
          'If you have trouble removing dependencies please contact the site administrator.Show Error Details'
        ].join(''));
      });

      await test.step('the error should be dissmissible', async () => {
        const btn = ModalLocators.getCloseBtn(errorModal);
        await expect.soft(btn).toBeVisible();
        await btn.click();
        await expect.soft(errorModal).not.toBeAttached();
      });
    });

    test('session expired alert', async ({ page, baseURL }, testInfo) => {
      await testSessionExpiredAlert(page, getChaiseURL(APP_NAMES.RECORD, 'accommodation', baseURL, testInfo) + '/id=2004');
    });
  });

  test.describe('recordset app', () => {
    test('using invalid page size on the annotation', async ({ page, baseURL }, testInfo) => {
      const errorModal = ModalLocators.getErrorModal(page);

      await test.step('An error errorModal window should appear with proper title and message', async () => {
        await page.goto(getChaiseURL(APP_NAMES.RECORDSET, 'multiple_records', baseURL, testInfo));
        await expect.soft(errorModal).toBeVisible();
        await testModalTitleAndText(errorModal,
          'Invalid Input',
          '\'limit\' must be greater than 0Click OK to go to the Home Page.'
        );
      });

      await test.step('clicking on OK button should redirect to homepage', async () => {
        await ModalLocators.getOkButton(errorModal).click();
        // we cannot check the exact url as it runs on CI and local. so we're just making sure it's not recordset
        await page.waitForURL(new RegExp('^((?!recordset).)*$'));
      });
    });

    test('attempting to delete a row that is already referenced', async ({ page, baseURL }, testInfo) => {
      const errorModal = ModalLocators.getErrorModal(page);

      await test.step('users should see an error with proper information about the issue', async () => {
        await page.goto(getChaiseURL(APP_NAMES.RECORDSET, 'file', baseURL, testInfo));
        await RecordsetLocators.waitForRecordsetPageReady(page);

        await RecordsetLocators.getRowDeleteButton(page, 0).click();

        const confirmModal = ModalLocators.getConfirmDeleteModal(page);
        await expect.soft(confirmModal).toBeVisible();
        await ModalLocators.getOkButton(confirmModal).click();

        await expect.soft(errorModal).toBeVisible();
        await expect.soft(ModalLocators.getModalTitle(errorModal)).toHaveText('Conflict');
        const text = ModalLocators.getModalText(errorModal);

        await expect.soft(text).toContainText('This entry cannot be deleted as it is still referenced');
      });

      await test.step('the error should be dissmissible', async () => {
        const btn = ModalLocators.getCloseBtn(errorModal);
        await expect.soft(btn).toBeVisible();
        await btn.click();
        await expect.soft(errorModal).not.toBeAttached();
      });
    });

    test('navigating to a page with invalid page criteria', async ({ page, baseURL }, testInfo) => {
      const errorModal = ModalLocators.getErrorModal(page);

      await test.step('should display the Invalid Page Criteria error', async () => {
        await page.goto(getChaiseURL(APP_NAMES.RECORDSET, 'accommodation', baseURL, testInfo) + '/id=2002@after()');
        await expect.soft(errorModal).toBeVisible();
        await testModalTitleAndText(errorModal,
          'Invalid Page Criteria',
          'Sort modifier is required with paging.Click OK to reload this page without Invalid Page Criteria.'
        );
      });

      await test.step('On click of OK button the page should reload the page without the paging condition.', async () => {
        await ModalLocators.getOkButton(errorModal).click();
        await RecordsetLocators.waitForRecordsetPageReady(page);
      });
    });

    test('generic conflict (409) error', async ({ page, baseURL }, testInfo) => {
      const errorModal = ModalLocators.getErrorModal(page);

      await test.step('should display the proper error modal and hide the error details by default', async () => {
        /**
         * In this the case the error is happening because the facetblob
         * has a filter that is not compatible with the value,
         * the filter is:
         * {
         *   "and": [
         *     {
         *       "source": [
         *         {"filter": "luxurious", "operand_pattern": "12"},
         *         "id"
         *       ],
         *       "choices": ["2003"]
         *     }
         *   ]
         * }
         */
        const facet = 'N4IghgdgJiBcDaoDOB7ArgJwMYFM6JADMBLAGwBccM4RS0APTY9JEAGhBQAcrIoB9LmHKUMEGgEYATCAC+HYjAC6HLAAsUxXKwQgpABn0BmEEtlmgA';
        await page.goto(getChaiseURL(APP_NAMES.RECORDSET, 'accommodation', baseURL, testInfo) + '/*::facets::' + facet);
        await expect.soft(errorModal).toBeVisible();
        await testModalTitleAndText(errorModal,
          'Conflict',
          [
            'An unexpected error has occurred. Try clearing your cache.  ',
            'If you continue to face this issue, please contact the system administrator.',
            'Click OK to go to the Home Page. ',
            'Show Error Details'
          ].join('')
        );
      });

      await test.step('toggling the error details should show the raw error.', async () => {
        const toggleBtn = ModalLocators.getToggleErrorDetailsButton(errorModal);
        const details = ModalLocators.getErrorDetails(errorModal);
        await expect.soft(details).not.toBeAttached();
        await expect.soft(toggleBtn).toHaveText('Show Error Details');

        await toggleBtn.click();
        await expect.soft(toggleBtn).toHaveText('Hide Error Details');
        await expect.soft(details).toContainText('invalid input syntax for type boolean: \"12\"');

        await toggleBtn.click();
        await expect.soft(details).not.toBeAttached();
        await expect.soft(toggleBtn).toHaveText('Show Error Details');
      });
    });

    test('session expired alert', async ({ page, baseURL }, testInfo) => {
      await testSessionExpiredAlert(page, getChaiseURL(APP_NAMES.RECORDSET, 'accommodation', baseURL, testInfo));
    });
  });

  test.describe('recordedit app', () => {
    test('navigating to a page with that returns no record', async ({ page, baseURL }, testInfo) => {
      const errorModal = ModalLocators.getErrorModal(page);
      const recordPageURL = getChaiseURL(APP_NAMES.RECORDEDIT, 'accommodation', baseURL, testInfo) + '/id=11223312121';

      await test.step('An error modal window should appear with proper title and message', async () => {
        await page.goto(recordPageURL);
        await expect.soft(errorModal).toBeVisible();
        await testModalTitleAndText(errorModal,
          'Record Not Found',
          [
            'The record does not exist or may be hidden. ',
            'If you continue to face this issue, please contact the system administrator.',
            'Click OK to show the list of all records.'
          ].join('')
        );
      });

      await test.step('clicking on OK button should redirect to the recordset page', async () => {
        await ModalLocators.getOkButton(errorModal).click();
        await page.waitForURL('**' + getChaiseURL(APP_NAMES.RECORDSET, 'accommodation', '', testInfo) + '**');
      });
    });

    test('navigating to a page with invalid page limit', async ({ page, baseURL }, testInfo) => {
      const errorModal = ModalLocators.getErrorModal(page);

      await test.step('An error popup should appear with proper title and message', async () => {
        await page.goto(getChaiseURL(APP_NAMES.RECORDEDIT, 'multiple_records', baseURL, testInfo) + '/?limit=-1');
        await expect.soft(errorModal).toBeVisible();
        await testModalTitleAndText(errorModal,
          'Invalid Input',
          '\'limit\' must be greater than 0Click OK to go to the multiple_records.'
        );
      });

      await test.step('clicking on OK button should redirect to recordset', async () => {
        await ModalLocators.getOkButton(errorModal).click();
        await page.waitForURL('**' + getChaiseURL(APP_NAMES.RECORDSET, 'multiple_records', '', testInfo) + '**');
      });
    });

    test('navigating to a page with invalid page criteria', async ({ page, baseURL }, testInfo) => {
      const errorModal = ModalLocators.getErrorModal(page);

      await test.step('should display the Invalid Page Criteria error', async () => {
        await page.goto(getChaiseURL(APP_NAMES.RECORDEDIT, 'accommodation', baseURL, testInfo) + '/id=2002@after()');
        await expect.soft(errorModal).toBeVisible();
        await testModalTitleAndText(errorModal,
          'Invalid Page Criteria',
          'Sort modifier is required with paging.Click OK to reload this page without Invalid Page Criteria.'
        );
      });

      await test.step('On click of OK button the page should reload the page without the paging condition.', async () => {
        await ModalLocators.getOkButton(errorModal).click();
        await RecordeditLocators.waitForRecordeditPageReady(page);
      });
    });

    test('navigating to a page with invalid page criteria and filters', async ({ page, baseURL }, testInfo) => {
      const errorModal = ModalLocators.getErrorModal(page);

      await test.step('should display the Invalid Page Criteria error', async () => {
        await page.goto(getChaiseURL(APP_NAMES.RECORDEDIT, 'accommodation', baseURL, testInfo) + '/id::gt:2002@after()');
        await expect.soft(errorModal).toBeVisible();
        await testModalTitleAndText(errorModal,
          'Invalid Page Criteria',
          'Sort modifier is required with paging.Click OK to reload this page without Invalid Page Criteria.'
        );
      });

      await test.step('On click of OK button the page should reload the page without paging condition but with invalid filters', async () => {
        await ModalLocators.getOkButton(errorModal).click();
        await expect.soft(errorModal).toBeVisible();
        await testModalTitleAndText(errorModal,
          'Invalid Filter',
          'Couldn\'t parse \'id::gt:2002\' filter.Click OK to show the list of all records.'
        );
      });

      await test.step('clicking on OK button on the new error should reload the page without any filters.', async () => {
        await ModalLocators.getOkButton(errorModal).click();
        // we cannot check that the page has been reloaded, so instead we're making sure the error is gone and the page is ready
        await expect.soft(errorModal).not.toBeAttached();
        await expect.soft(RecordeditLocators.getPageTitle(page)).toHaveText('Create 1 Accommodations record');
      });

    });

    test('editting a record without changing data', async ({ baseURL, page }, testInfo) => {
      await test.step('open recordedit page', async () => {
        await page.goto(getChaiseURL(APP_NAMES.RECORDEDIT, 'category', baseURL, testInfo) + '/id=10003');
        await RecordeditLocators.waitForRecordeditPageReady(page);
      });

      await test.step('an alert should be displayed upon submission', async () => {
        const alert = AlertLocators.getWarningAlert(page);
        await RecordeditLocators.submitForm(page);
        await expect.soft(alert).toBeVisible();
        await expect.soft(alert).toHaveText([
          'WarningNo data was changed in the update request. ',
          'Please check the form content and resubmit the data.'
        ].join(''));
      });
    });

    test('duplicate key value and required errors while creating a record', async ({ baseURL, page }, testInfo) => {
      const recordeditError = AlertLocators.getErrorAlert(page);
      await test.step('open recordedit page', async () => {
        await page.goto(getChaiseURL(APP_NAMES.RECORDEDIT, 'category', baseURL, testInfo));
        await RecordeditLocators.waitForRecordeditPageReady(page);
      });

      await test.step('submitting without setting values should result in the required error', async () => {
        await RecordeditLocators.submitForm(page);
        await expect.soft(recordeditError).toBeVisible();
        await expect.soft(recordeditError).toHaveText([
          'ErrorSorry, the data could not be submitted because there are errors on the form. ',
          'Please check all fields and try again.'
        ].join(''));
        const requiredError = 'Please enter a value for this field.';
        await expect.soft(RecordeditLocators.getErrorMessageForAColumn(page, 'id', 1)).toHaveText(requiredError);
        await expect.soft(RecordeditLocators.getErrorMessageForAColumn(page, 'term', 1)).toHaveText(requiredError);
      });

      await test.step('submitting after using a duplicate key value should return in the duplicate error.', async () => {
        await setInputValue(page, 1, 'id', 'id', RecordeditInputType.INT_4, '99999');
        await setInputValue(page, 1, 'term', 'term', RecordeditInputType.TEXT, 'Castle');
        await RecordeditLocators.submitForm(page);
        await expect.soft(recordeditError).toBeVisible();
        await expect.soft(recordeditError).toHaveText([
          'ErrorThe entry cannot be created/updated. ',
          'Please use a different term for this record. ',
          'Click here to see the conflicting record that already exists.'
        ].join(''));

      });

    });
  });

});

/******************** helpers ************************/
const getChaiseURL = (appName: APP_NAMES, tableName: string, baseURL: string | undefined, testInfo: TestInfo) => {
  return generateChaiseURL(appName, 'product-record', tableName, testInfo, baseURL);
};

const testModalTitleAndText = async (errorModal: Locator, expectedTitle: string, expectedText: string) => {
  await expect.soft(ModalLocators.getModalTitle(errorModal)).toHaveText(expectedTitle);
  await expect.soft(ModalLocators.getModalText(errorModal)).toHaveText(expectedText);
}

const testSessionExpiredAlert = async (page: Page, url: string) => {
  await page.goto(url);
  await removeAuthCookieAndReload(page);
  const alert = AlertLocators.getWarningAlert(page);
  await expect.soft(alert).toHaveText(
    'WarningYour login session has expired. You are now accessing data anonymously. Log in to continue your privileged access.'
  );
}
