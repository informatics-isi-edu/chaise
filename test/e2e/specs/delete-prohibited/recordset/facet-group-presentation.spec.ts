import { test, expect, TestInfo, Page, Locator } from '@playwright/test';

// locators
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

// utils
import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { APP_NAMES } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';
import {
  openRecordsetAndResetFacetState, TestIndividualFacetParams, testIndividualFacet, resetFacetState,
  testDisplayedFacets
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';
import { clickNewTabLink, dragAndDropWithScroll, generateChaiseURL } from '@isrd-isi-edu/chaise/test/e2e/utils/page-utils';

// TODO


const testParams = {

};

  /**
   * - display props
   *   - markdown in title
   *   - tooltip
   *   - open status
   *     - having a parent closed while the child is open
   * - being able to interact with the facets inside the group
   *    - clicking on a facet should open it
   *    - closing a facet group, should hide children but keep their state
   *    - presentation of facet
   *    - show more/less popup
   * - flow control tests
   *   - fourselection type of tests
   */

test.describe('Facet groups', () => {
  // test.describe.configure({ mode: 'parallel' });

  test('when none of the facets are opened by default, the first group and its first child must be opened', async ({ page }) => {

  });

  test('when some of the facets are opened by default, facets are displayed according to the annotation', async ({ page }) => {

  });

})