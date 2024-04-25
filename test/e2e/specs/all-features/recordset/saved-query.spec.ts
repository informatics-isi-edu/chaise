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
import { clearInput } from '@isrd-isi-edu/chaise/test/e2e/utils/recordedit-utils';

const testParams = {
  table_name: 'main',
  minInputClass: 'range-min',
  minInputClearClass: 'min-clear',
  maxInputClass: 'range-max',
  maxInputClearClass: 'max-clear',
  firstSavedQueryName: 'main with int_col ( 11 to 22)',
  secondSavedQueryName: 'main with int_col ( 11 to 22); one',
  key: {
    name: 'id',
    operator: '=',
    value: '1'
  }
};

test.describe('View recordset page and form a query,', () => {

  test.beforeAll(async ({}, testInfo) => {
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

    await test.step('should load recordset page', async() => {
      const PAGE_URL = `/recordset/#${getCatalogID(testInfo.project.name)}/saved_query:${testParams.table_name}`;

      await page.goto(`${baseURL}${PAGE_URL}`);
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

      // inputs
      const minInput = RecordsetLocators.getRangeInput(facet, testParams.minInputClass);
      const maxInput = RecordsetLocators.getRangeInput(facet, testParams.maxInputClass);

      // clear buttons
      const minClear = RecordsetLocators.getInputClear(facet, testParams.minInputClearClass);
      const maxClear = RecordsetLocators.getInputClear(facet, testParams.maxInputClearClass);

      // facet should be open on page load
      await expect.soft(RecordsetLocators.getFacetCollapse(facet)).toBeVisible();
      await expect.soft(RecordsetLocators.getRangeSubmit(facet)).toBeVisible();

      // wait for histogram
      await expect.soft(RecordsetLocators.getHistogram(facet)).toBeVisible();

      // first clear the min and max
      await expect.soft(minClear).toBeVisible();
      await minClear.click();
      await maxClear.click();
      
      await minInput.fill('11');
      await maxInput.fill('22');

      await RecordsetLocators.getRangeSubmit(facet).click();
      
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

      await expect.soft(RecordeditLocators.getInputForAColumn(page, 'name', 1)).toHaveAttribute('value', testParams.firstSavedQueryName);

      const textAreaVal = 'main with:\n  - int_col (1 choice): int_col ( 11 to 22);';
      await expect.soft(RecordeditLocators.getTextAreaForAColumn(page, 'description', 1)).toHaveText(textAreaVal);

      await ModalLocators.saveQuerySubmit(createSavedQueryModal).click();
      
      await expect.soft(AlertLocators.getSuccessAlert(page)).toHaveText('SuccessSearch criteria saved.');
    });

    await test.step('open apply saved queries modal, verify query was saved, and close the modal', async () => {
      await RecordsetLocators.getSavedQueryDropdown(page).click();
      await RecordsetLocators.getSavedQueriesOption(page).click();

      const savedQueriesModal = ModalLocators.getSavedQueriesModal(page);
      await expect.soft(ModalLocators.getModalRows(savedQueriesModal)).toHaveCount(1);

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

      await expect.soft(RecordeditLocators.getInputForAColumn(page, 'name', 1)).toHaveAttribute('value', testParams.secondSavedQueryName);
    });

    await test.step('change name and description then save the query', async () => {
      const queryNameInput = RecordeditLocators.getInputForAColumn(page, 'name', 1);
      await queryNameInput.fill('');
      await queryNameInput.fill('Second saved query');

      const descriptionInput = RecordeditLocators.getTextAreaForAColumn(page, 'description', 1);
      await clearInput(descriptionInput);
      await descriptionInput.fill('Second query description');

      const createSavedQueryModal = ModalLocators.getCreateSavedQueryModal(page);
      await ModalLocators.saveQuerySubmit(createSavedQueryModal).click();
      await expect.soft(AlertLocators.getAlerts(page)).toHaveCount(2);
    });

    await test.step('open apply saved query modal, verify 2 queries now, and apply first saved query', async () => {
      await RecordsetLocators.getSavedQueryDropdown(page).click();
      await RecordsetLocators.getSavedQueriesOption(page).click();

      const savedQueriesModal = ModalLocators.getSavedQueriesModal(page);
      await expect.soft(ModalLocators.getModalRows(savedQueriesModal)).toHaveCount(2);

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

  test('should have proper citation in share cite modal', async ({ page, baseURL }, testInfo) => {
    const keyValues = [{ column: testParams.key.name, value: testParams.key.value }];
    const entityRow = getEntityRow(testInfo, 'saved_query', testParams.table_name, keyValues);
    const ridValue = entityRow.RID, rctValue = entityRow.RCT;
    const link = `${baseURL}/record/#${getCatalogID(testInfo.project.name)}/saved_query:${testParams.table_name}/RID=${ridValue}`;

    await test.step('should load record page', async () => {
      const keys = [];
      keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
      const PAGE_URL = `/record/#${getCatalogID(testInfo.project.name)}/saved_query:${testParams.table_name}/${keys.join('')}`;
  
      await page.goto(`${baseURL}${PAGE_URL}`);
  
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
});

