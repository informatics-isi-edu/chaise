import { Locator, test, expect, TestInfo, Page } from '@playwright/test';
import chance from 'chance';

// locators
import AlertLocators from '@isrd-isi-edu/chaise/test/e2e/locators/alert';
import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { testRecordMainSectionValues } from '@isrd-isi-edu/chaise/test/e2e/utils/record-utils';
import {
  openFacet, openFacetAndTestFilterOptions, testColumnSort,
  testClearAllFilters, testFacetOptionsAndModalRows, testModalClose,
  testSelectFacetOption, testShowMoreClick, testSubmitModalSelection
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';
import { dragAndDrop } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';


const testParams = {
  schema_name: 'faceting',
  table_name: 'main',
  sort: '@sort(id)',
  totalNumFacets: 23,
  initialState: {
    facetNames: [
      'id', 'int_col', 'float_col', 'date_col', 'timestamp_col', 'text_col',
      'longtext_col', 'markdown_col', 'boolean_col', 'jsonb_col', 'F1',
      'to_name', 'f3 (term)', 'from_name', 'F1 with Term', 'Check Presence Text',
      'F3 Entity', 'F5', 'F5 with filter', 'Outbound1 (using F1)',
      'col_w_column_order_false', 'col_w_column_order', 'col_w_long_values'
    ],
    facetNamesAfterReorder: [
      'id', 'int_col', 'float_col', 'date_col', 'timestamp_col', 'text_col',
      'longtext_col', 'markdown_col', 'boolean_col', 'jsonb_col', 'F1',
      'to_name', 'f3 (term)', 'from_name', 'F1 with Term', 'Check Presence Text',
      'F3 Entity', 'F5', 'F5 with filter', 'Outbound1 (using F1)',
      'col_w_column_order_false', 'col_w_column_order', 'col_w_long_values'
    ],
    originalStorage: [
      { 'name': 'id', 'open': true }, { 'name': 'int_col', 'open': true }, { 'name': 'float_col' }, { 'name': 'date_col' },
      { 'name': 'timestamp_col' }, { 'name': 'text_col' }, { 'name': 'longtext_col' }, { 'name': 'markdown_col' },
      { 'name': 'boolean_col' }, { 'name': 'jsonb_col' }, { 'name': 'eqK7CNP-yhTDab74BW-7lQ' }, { 'name': 'cD8qWek-pEc_of8BUq0kAw', 'open': true },
      { 'name': 'BLzaX0hgTVx7uaLkFXlKsw' }, { 'name': 'ebn2okbwlp5O0XoSYfzGiA' }, { 'name': 'rtIZqlhTdgze1YnEizt_Vg' }, { 'name': 'text_col_2' },
      { 'name': '2LEfnTGwdKB6dv-TLbBSmg' }, { 'name': '8onrFoVWlj7BhbQ003jSHg' },
      { 'name': 'Z5zkN76i7M1ZC9iGs6kZOQ' }, { 'name': 'cpvZOR762iRCtNVMPFIApg' },
      { 'name': 'col_w_column_order_false' }, { 'name': 'col_w_column_order' }, { 'name': 'col_w_long_values' }
    ]
  },
  savedStateWInvalids: {
    storage: [
      { 'name': 'some_invalid_facet_name', 'open': true }, // this is an invalid name.
      { 'name': 'timestamp_col' }, { 'name': 'text_col' }, { 'name': 'longtext_col' }, { 'name': 'markdown_col' },
      { 'name': 'id', 'open': true }, { 'name': 'int_col', 'open': true }, { 'name': 'float_col' }, { 'name': 'date_col' },
      { 'name': 'RMB', 'open': true }, // this is a valid column but it's not part of the annotation
      { 'name': 'boolean_col' }, { 'name': 'jsonb_col' }, { 'name': 'eqK7CNP-yhTDab74BW-7lQ' }, { 'name': 'cD8qWek-pEc_of8BUq0kAw', 'open': true },
      { 'name': 'BLzaX0hgTVx7uaLkFXlKsw' }, { 'name': 'ebn2okbwlp5O0XoSYfzGiA' }, { 'name': 'rtIZqlhTdgze1YnEizt_Vg' }, { 'name': 'text_col_2' },
      { 'name': '2LEfnTGwdKB6dv-TLbBSmg' }, { 'name': '8onrFoVWlj7BhbQ003jSHg' },
      { 'name': 'Z5zkN76i7M1ZC9iGs6kZOQ' }, { 'name': 'cpvZOR762iRCtNVMPFIApg' },
      { 'name': 'col_w_long_values' }, { 'name': 'col_w_column_order_false' }, { 'name': 'col_w_column_order' },
      { 'name': 'RCT', 'open': true }, // this is a valid column but it's not part of the annotation
    ],
    facetNames: [
      'timestamp_col', 'text_col', 'longtext_col', 'markdown_col',
      'id', 'int_col', 'float_col', 'date_col',
      'boolean_col', 'jsonb_col', 'F1',
      'to_name', 'f3 (term)', 'from_name', 'F1 with Term', 'Check Presence Text',
      'F3 Entity', 'F5', 'F5 with filter', 'Outbound1 (using F1)',
      'col_w_long_values', 'col_w_column_order_false', 'col_w_column_order'
    ],
  },
  savedStateWMissing: {
    storage: [
      { 'name': 'col_w_column_order_false' }, { 'name': 'col_w_column_order' },
      { 'name': 'col_w_long_values' }, { 'name': 'id' },
    ],
    facetNames: [
      'col_w_column_order_false', 'col_w_column_order', 'col_w_long_values', 'id',
      'int_col', 'float_col', 'date_col', 'timestamp_col', 'text_col',
      'longtext_col', 'markdown_col', 'boolean_col', 'jsonb_col', 'F1',
      'to_name', 'f3 (term)', 'from_name', 'F1 with Term', 'Check Presence Text',
      'F3 Entity', 'F5', 'F5 with filter', 'Outbound1 (using F1)',
    ]
  }


}


test.describe('Facet reorder feature', () => {
  test.describe.configure({ mode: 'parallel' });

  // TODO
  test.skip('customizing the order of facets', async ({ page, baseURL }, testInfo) => {
    await test.step('User should be able to drag and change the order of facets.', async () => {
      await page.goto(getURL(testInfo, baseURL));
      await RecordsetLocators.waitForRecordsetPageReady(page);
      await page.pause();


      await expect.soft(RecordsetLocators.getAllFacets(page)).toHaveCount(testParams.totalNumFacets);
      await expect.soft(RecordsetLocators.getFacetTitles(page)).toHaveText(testParams.initialState.facetNames);

      await moveFacet(page, 0, 1);
      await page.pause();

      await moveFacet(page, 1, 3);
      await page.pause();

      await moveFacet(page, 5, 3);
      await page.pause();

      await expect.soft(RecordsetLocators.getFacetTitles(page)).toHaveText(testParams.initialState.facetNamesAfterReorder);
    });

    await test.step('interacting with the reordered facets should work as expected', async () => {

    });


    await test.step('refreshing the page should display the saved order.', async () => {

    });
  });

  test('opening a page where the saved state has extra or invalid facets', async ({ page, baseURL }, testInfo) => {
    await test.step('facets should be displayed based on the stored order and invalid ones should be ignored.', async () => {
      await page.goto(getURL(testInfo, baseURL));
      await changeStoredOrder(page, testInfo, testParams.savedStateWInvalids.storage);
      await RecordsetLocators.waitForRecordsetPageReady(page);

      await expect.soft(RecordsetLocators.getAllFacets(page)).toHaveCount(testParams.totalNumFacets);
      await expect.soft(RecordsetLocators.getFacetTitles(page)).toHaveText(testParams.savedStateWInvalids.facetNames);
    });

    // TODO interact with the page and make sure everything is working
  });

  test('opening a page where the saved state does not include all the visible facets.', async ({ page, baseURL }, testInfo) => {
    await test.step('facets should be displayed based on the stored order and invalid ones should be ignored.', async () => {
      await page.goto(getURL(testInfo, baseURL));
      await changeStoredOrder(page, testInfo, testParams.savedStateWMissing.storage);
      await RecordsetLocators.waitForRecordsetPageReady(page);

      await expect.soft(RecordsetLocators.getAllFacets(page)).toHaveCount(testParams.totalNumFacets);
      await expect.soft(RecordsetLocators.getFacetTitles(page)).toHaveText(testParams.savedStateWMissing.facetNames);
    });

    // TODO interact with the page and make sure everything is working
  });

});

/********************** helper functions ************************/

const getURL = (testInfo: TestInfo, baseURL?: string) => {
  return `${baseURL}/recordset/#${getCatalogID(testInfo.project.name)}/${testParams.schema_name}:${testParams.table_name}${testParams.sort}`;
}

const moveFacet = async (page: Page, facetIndex: number, destIndex: number) => {
  const source = RecordsetLocators.getFacetMoveIcon(page, facetIndex);
  const target = RecordsetLocators.getFacetMoveIcon(page, destIndex);
  await dragAndDrop(page, source, target);
  // await source.dragTo(target);
}

const changeStoredOrder = async (page: Page, testInfo: TestInfo, order: any) => {
  const keyName = `facet-order-${getCatalogID(testInfo.project.name)}_${testParams.schema_name}_${testParams.table_name}`;
  const orderStr = JSON.stringify(order);
  await page.evaluate(({ keyName, orderStr }) => {
    window.localStorage.setItem(keyName, orderStr);
  }, { keyName, orderStr });

  await page.reload();
}
