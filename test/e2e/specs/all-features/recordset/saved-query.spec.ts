import { test, expect } from '@playwright/test';
import moment from 'moment';

// locators
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID, getEntityRow, updateCatalogAnnotation } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { testShareCiteModal } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import { generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

const testParams = {
  table_name: 'main',
  firstSavedQueryName: 'main with int_col ( 11 to 22)',
  secondSavedQueryName: 'main with int_col ( 11 to 22); one',
  key: {
    name: 'id',
    operator: '=',
    value: '1'
  }
};

test.describe('View recordset page and form a query,', () => {

  test.beforeAll('update the catalog annotation', async ({}, testInfo) => {
    const catalogId = getCatalogID(testInfo.project.name);

    await updateCatalogAnnotation(catalogId, {
      'tag:isrd.isi.edu,2019:chaise-config': {
        savedQueryConfig: {
          defaultName: {
            totalTextLimit: 80,
          },
          storageTable: {
            catalog: catalogId,
            schema: 'saved_query',
            table: 'saved_query',
            columnNameMapping: {
              queryId: 'query_id',
              catalog: 'catalog',
              schemaName: 'schema_name',
              tableName: 'table_name',
              userId: 'user_id',
              queryName: 'name',
              description: 'description',
              facets: 'facets',
              encodedFacets: 'encoded_facets',
              lastExecutionTime: 'last_execution_time'
            }
          }
        }
      },
      'tag:misd.isi.edu,2015:display': {
        show_saved_query: true
      }
    });
  });

  test('For table ' + testParams.table_name + ',', async ({ page, baseURL }, testInfo) => {

    await test.step('should load recordset page', async () => {
      await page.goto(generateChaiseURL(APP_NAMES.RECORDSET, 'saved_query', testParams.table_name, testInfo, baseURL));
      await RecordsetLocators.waitForRecordsetPageReady(page);
    });

    await test.step('should show a saved query dropdown', async () => {
      const sqDropdown = RecordsetLocators.getSavedQueryDropdown(page);
      const savedQueryMenuItems = RecordsetLocators.getSavedQueryOptions(page);

      await expect.soft(sqDropdown).toBeVisible();

      await sqDropdown.click();
      await expect.soft(savedQueryMenuItems).toHaveCount(2);

      // close the dropdown
      await sqDropdown.click();
    });

    await test.step('apply filter in int_col facet and open save query form', async () => {
      const facetIdx = 1;
      const facet = RecordsetLocators.getFacetById(page, facetIdx);

      // inputs, clear buttons, and submit
      const inputLocators = RecordsetLocators.getFacetRangeInputs(facet);

      // facet should be open on page load
      await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();
      await expect.soft(inputLocators.submit).toBeVisible();

      // wait for histogram
      await expect.soft(RecordsetLocators.getFacetHistogram(facet)).toBeVisible();

      // first clear the min and max
      await inputLocators.minClear.click();
      await inputLocators.maxClear.click();

      await inputLocators.minInput.fill('11');
      await inputLocators.maxInput.fill('22');

      await inputLocators.submit.click();

      // wait for table rows to load and check count
      await expect(RecordsetLocators.getRows(page)).toHaveCount(12);

        // close the facet
      await RecordsetLocators.getFacetHeaderButtonById(facet, facetIdx).click();

      await RecordsetLocators.getSavedQueryDropdown(page).click();
      await RecordsetLocators.getSaveQueryOption(page).click();

      const createSavedQueryModal = ModalLocators.getCreateSavedQueryModal(page);
      await expect.soft(ModalLocators.saveQuerySubmit(createSavedQueryModal)).toBeVisible();
    });

    await test.step('have correct modal title and default values then save the query', async () => {
      const createSavedQueryModal = ModalLocators.getCreateSavedQueryModal(page);
      await expect.soft(ModalLocators.getModalTitle(createSavedQueryModal)).toHaveText('Save current search criteria for table main');

      await expect.soft(RecordeditLocators.getInputForAColumn(createSavedQueryModal, 'name', 1)).toHaveValue(testParams.firstSavedQueryName);

      const textAreaVal = 'main with:\n  - int_col (1 choice): int_col ( 11 to 22);';
      await expect.soft(RecordeditLocators.getInputForAColumn(createSavedQueryModal, 'description', 1)).toHaveValue(textAreaVal);

      await ModalLocators.saveQuerySubmit(createSavedQueryModal).click();

      await expect.soft(AlertLocators.getSuccessAlert(page)).toHaveText('SuccessSearch criteria saved.');
    });

    await test.step('open apply saved queries modal, verify query was saved, and close the modal', async () => {
      await RecordsetLocators.getSavedQueryDropdown(page).click();
      await RecordsetLocators.getSavedQueriesOption(page).click();

      const savedQueriesModal = ModalLocators.getSavedQueriesModal(page);
      await expect.soft(RecordsetLocators.getRows(savedQueriesModal)).toHaveCount(1);

      await ModalLocators.getCloseBtn(savedQueriesModal).click();
    });

    await test.step('try to save the same query again', async () => {
      await RecordsetLocators.getSavedQueryDropdown(page).click()
      await RecordsetLocators.getSaveQueryOption(page).click();

      const duplicateQueryModal = ModalLocators.getDuplicateSavedQueryModal(page);
      await expect.soft(duplicateQueryModal).toBeVisible();

      await expect.soft(ModalLocators.getModalTitle(duplicateQueryModal)).toHaveText('Duplicate Saved Search');
      await expect.soft(ModalLocators.getModalText(duplicateQueryModal)).toContainText(`name "${testParams.firstSavedQueryName}"`);

      await ModalLocators.getCloseBtn(duplicateQueryModal).click();
    });

    await test.step('apply filter in text_col facet and open save query form', async () => {
      const facetIdx = 6, optionIdx = 2;

      const facet = RecordsetLocators.getFacetById(page, facetIdx);
      await RecordsetLocators.getFacetHeaderButtonById(facet, facetIdx).click();

      // wait for facet checkboxes to load
      await expect.soft(RecordsetLocators.getFacetOptions(facet)).toHaveCount(6);
      await RecordsetLocators.getFacetOption(facet, optionIdx).click();

      await RecordsetLocators.getSavedQueryDropdown(page).click();
      await RecordsetLocators.getSaveQueryOption(page).click();

      const createSavedQueryModal = ModalLocators.getCreateSavedQueryModal(page);
      await expect.soft(ModalLocators.saveQuerySubmit(createSavedQueryModal)).toBeVisible();

      await expect.soft(RecordeditLocators.getInputForAColumn(createSavedQueryModal, 'name', 1)).toHaveValue(testParams.secondSavedQueryName);
    });

    await test.step('change name and description then save the query', async () => {
      const createSavedQueryModal = ModalLocators.getCreateSavedQueryModal(page);

      const queryNameInput = RecordeditLocators.getInputForAColumn(createSavedQueryModal, 'name', 1);
      await queryNameInput.clear();
      await queryNameInput.fill('Second saved query');

      const descriptionInput = RecordeditLocators.getInputForAColumn(createSavedQueryModal, 'description', 1);
      await descriptionInput.clear();
      await descriptionInput.fill('Second query description');

      await ModalLocators.saveQuerySubmit(createSavedQueryModal).click();
      await expect.soft(AlertLocators.getAlerts(page)).toHaveCount(2);
    });

    await test.step('open apply saved query modal, verify 2 queries now, and apply first saved query', async () => {
      await RecordsetLocators.getSavedQueryDropdown(page).click();
      await RecordsetLocators.getSavedQueriesOption(page).click();

      const savedQueriesModal = ModalLocators.getSavedQueriesModal(page);
      await expect.soft(RecordsetLocators.getRows(savedQueriesModal)).toHaveCount(2);

      // queries are in order of their "last_execution_time" which is set to "now" when the query is saved
      // 2nd saved query should be the first row in the modal, we want to click the 1st saved query
      await ModalLocators.getApplySavedQueryButtons(savedQueriesModal, 1).click();
    });

    await test.step('should change the filters applied and show first query that was saved', async () => {
      await RecordsetLocators.waitForRecordsetPageReady(page);

      await expect.soft(RecordsetLocators.getRows(page)).toHaveCount(12);
      await expect.soft(RecordsetLocators.getFacetFilters(page)).toHaveCount(1);
      await expect.soft(RecordsetLocators.getFacetFilter(page, 0)).toHaveText('int_col11 to 22');
    });
  });
});

test('should have proper citation in share cite modal', async ({ page, baseURL }, testInfo) => {
  const keyValues = [{ column: testParams.key.name, value: testParams.key.value }];
  const entityRow = getEntityRow(testInfo, 'saved_query', testParams.table_name, keyValues);
  const ridValue = entityRow.RID, rctValue = entityRow.RCT;
  const recordPageURL = generateChaiseURL(APP_NAMES.RECORD, 'saved_query', testParams.table_name, testInfo, baseURL);
  const link = `${recordPageURL}/RID=${ridValue}`;

  await test.step('should load record page', async () => {
    const keys = [];
    keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
    await page.goto(`${recordPageURL}/${keys.join('')}`);
    await RecordLocators.waitForRecordPageReady(page);
  });

  await testShareCiteModal(
    page,
    testInfo,
    {
      title: 'Share and Cite',
      link,
      hasVersionedLink: true, // the table has history-capture: true
      verifyVersionedLink: false,
      citation: [
        'Joshua Chudy, Aref Shafaei. This is long text so it can be used in a title. Journal of Front End Faceting Test Data ',
        `${link} (${moment(rctValue).format('YYYY')}).`
      ].join('')
    }
  );
});

