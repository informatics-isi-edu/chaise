import { test, expect, TestInfo, Page, Locator } from '@playwright/test';

import ModalLocators from '@isrd-isi-edu/chaise/test/e2e/locators/modal';
import RecordeditLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordedit';
import RecordLocators from '@isrd-isi-edu/chaise/test/e2e/locators/record';
import RecordsetLocators from '@isrd-isi-edu/chaise/test/e2e/locators/recordset';

import { getCatalogID } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import {
  testClearAllFilters, testDisplayedFacets, testSelectFacetOption,
} from '@isrd-isi-edu/chaise/test/e2e/utils/recordset-utils';

/**
 * first layer facets:
 *
 * main
 *     <-- main_inbound1
 *                      <-- main_inbound1_inbound1 : "Entity path" and "Entity path with filter" facets
 *                      <-- main_inbound1_inbound2: "Entity path 2" facet
 *     <-- main_inbound2
 *                      <-- main_inbound2_inbound1 : "Entity path with shared prefix"
 *                      --> main_inbound2_outbound1: "Entity path with shared prefix and filter"
 *     <-- main_inbound3
 *                      <-- main_inbound3_inbound1: "Entity Path with fast filter"
 *                      <-- main_inbound3_inbound1_fast_filter: the fast_fitler_source of prev facet
 *
 * To simplify the second layer facets, I added a facet_2nd_layer_hub which has fk to all the tables above,
 * and other new tables have inbound to them to be displayed as facets. so regardless of which facet we opened
 * for the first layer, the second layer facets all look the same in UI but they have different paths to the main table.
 *
 * facet_2nd_layer_hub
 *                    --> main_inbound1_inbound1
 *                    --> main_inbound_1_inbound2
 *                    --> main_inbound2_inbound1
 *                    --> main_inbound2_outbound1
 *                    --> main_inbound3_inbound1
 *                    <-- facet_2nd_layer_hub_inbound1: "2nd layer Entity path" and "2nd layer Entity path with filter" facets
 *                    <-- facet_2nd_layer_hub_inbound2: "2nd layer Entity path 2" facet
 *                    <-- facet_2nd_layer_hub_inbound3: "2nd layer Entity path with shared prefix"
 *                    <-- facet_2nd_layer_hub_inbound4: "2nd layer Entity path with shared prefix and filter"
 *                    <-- facet_2nd_layer_hub_inbound5: "2nd layer Entity Path with fast filter"
 *                    <-- facet_2nd_layer_hub_inbound5_fast_filter: the fast_fitler_source of prev facet
 *
 */

type FacetParamType = {
  /**
   * facet index
   */
  index: number,
  name: string,
  /**
   * if defined, we will first select the option defined here.
   */
  otherFacet?: {
    index: number,
    option: number,
    numRows: number
  },
  popup: {
    uiContext: string,
    title: string,
    facetNames: string[],
    numRows: number,
    facets: {
      index: number,
      name: string,
      options: string[],
      select?: {
        option: number,
        numRows: number
      },
      popup?: {
        uiContext: string,
        title: string,
        numRows: number
      }
    }[]
  }

}

const facetNames = [
  'Entity path', 'Entity path 2', 'Entity path with filter', 'Entity path with shared prefix',
  'Entity path with shared prefix and filter', 'Entity path with fast filter'
]

const testParams: {
  facets: FacetParamType[]
} = {
  facets: [
    {
      index: 0,
      name: 'Entity path',
      popup: {
        uiContext: 'main:',
        title: 'Select Entity path',
        facetNames: facetNames,
        numRows: 0, // TODO
        facets: [
          {
            index: 0,
            name: 'Entity path',
            options: ['All records with value'], // TODO
            select: {
              option: 1,// TOOD
              numRows: 5, // TODO
            }
          }
        ]
      }
    }
  ]
}

/******************** helpers ************************/

const getChaiseURL = (appName: string, tableName: string, baseURL: string | undefined, testInfo: TestInfo) => {
  return `${baseURL}/${appName}/#${getCatalogID(testInfo.project.name)}/facet-within-facet:${tableName}`;
};

/**
 * This function must be defined before the test blocks.
 * @param initialPageLoad the initial operation to load the recordset instance. it should return the container of recordset instance
 */
const testFacetWithinFacet = (initialPageLoad: (page: Page, baseURL: string | undefined, testInfo: TestInfo) => Promise<Page | Locator>) => {

  // make sure facet within facet works for all the different types of entity facets we have (shared prefix, with filter, etc)
  for (const firstLevelProps of testParams.facets) {
    test(`first level: ${firstLevelProps.name}`, async ({ page, baseURL }, testInfo) => {
      let container: Page | Locator;

      await test.step('open the recordset instance', async () => {
        container = await initialPageLoad(page, baseURL, testInfo);
      });

      if (firstLevelProps.otherFacet) {
        await test.step('select an option in one of the facets', async () => {
          const f = RecordsetLocators.getFacetById(container, firstLevelProps.otherFacet!.index);
          await expect.soft(f).toBeVisible();
          await testSelectFacetOption(container, f, firstLevelProps.otherFacet!.option, firstLevelProps.otherFacet!.numRows, 1);
        });
      }

      await test.step('open the facet popup', async () => {
        const firstLevelModal = ModalLocators.getFacetPopup(page, 1);
        const secondLevelModal = ModalLocators.getFacetPopup(page, 2);

        await test.step('title, ui context, and number of rows must be correct', async () => {
          const f = RecordsetLocators.getFacetById(container, firstLevelProps.index);
          await RecordsetLocators.getShowMore(f).click();
          await expect.soft(firstLevelModal).toBeVisible();
          await RecordsetLocators.waitForRecordsetPageReady(firstLevelModal);

          await expect.soft(ModalLocators.getModalHeaderContext(firstLevelModal)).toHaveText(firstLevelProps.popup.uiContext);
          await expect.soft(ModalLocators.getModalTitle(firstLevelModal)).toHaveText(firstLevelProps.popup.title);
          await expect.soft(RecordsetLocators.getRows(firstLevelModal)).toHaveCount(firstLevelProps.popup.numRows);
        });

        await test.step('facet panel must be displayed with proper facets', async () => {
          const showBtn = RecordsetLocators.getShowFilterPanelBtn(firstLevelModal);
          await expect.soft(showBtn).toBeVisible();
          await showBtn.click();
          // all of them are open based on the annotation
          await testDisplayedFacets(firstLevelModal, firstLevelProps.popup.facetNames, firstLevelProps.popup.facetNames);
        });

        for await (const secondLevelProps of firstLevelProps.popup.facets) {
          await test.step(`second level: ${secondLevelProps.name}`, async () => {
            const popupFacetEl = RecordsetLocators.getFacetById(firstLevelModal, secondLevelProps.index);

            await test.step('correct options should be displayed', async () => {
              // wait for list to be fully visible
              await expect.soft(RecordsetLocators.getList(popupFacetEl)).toBeVisible();
              // wait for facet checkboxes to load
              await expect.soft(RecordsetLocators.getFacetOptions(popupFacetEl)).toHaveText(secondLevelProps.options);
            });

            if (secondLevelProps.select) {
              await test.step('selecting an option should change the displayed rows', async () => {
                await testSelectFacetOption(firstLevelModal, popupFacetEl, secondLevelProps.select!.option, secondLevelProps.select!.numRows, 1);
              });
            }

            if (secondLevelProps.popup) {
              await test.step('show more must be offered but the opened popup should not have facet panel', async () => {
                const showMore = RecordsetLocators.getShowMore(popupFacetEl);
                await expect.soft(showMore).toBeVisible();
                await RecordsetLocators.getShowMore(popupFacetEl).click();
                await expect.soft(secondLevelModal).toBeVisible();
                await RecordsetLocators.waitForRecordsetPageReady(secondLevelModal);

                await expect.soft(ModalLocators.getModalHeaderContext(secondLevelModal)).toHaveText(secondLevelProps.popup!.uiContext);
                await expect.soft(ModalLocators.getModalTitle(secondLevelModal)).toHaveText(secondLevelProps.popup!.title);
                await expect.soft(RecordsetLocators.getRows(secondLevelModal)).toHaveCount(secondLevelProps.popup!.numRows);

                await expect.soft(RecordsetLocators.getShowFilterPanelBtn(secondLevelModal)).not.toBeVisible();
                await ModalLocators.getCloseBtn(secondLevelModal).click();
                await expect.soft(secondLevelModal).not.toBeAttached();
              });
            }

            if (secondLevelProps.select) {
              await test.step('clear all facetes', async () => {
                await testClearAllFilters(firstLevelModal, firstLevelProps.popup.numRows);
              });
            }
          });
        }
      });

    })

  }
}

/******************** tests ************************/


test.describe('facet within facet', () => {
  // TODO this return has been added so it doesn't affect the CI build. I'll remove it once everything is ready.
  return;

  test.describe.configure({ mode: 'parallel' });

  test.describe('recordset page', () => {
    testFacetWithinFacet(
      async (page, baseURL, testInfo) => {
        await page.goto(getChaiseURL('recordset', 'main', baseURL, testInfo));
        await RecordsetLocators.waitForRecordsetPageReady(page);
        return page;
      }
    )
  });

  // TODO unskip once the config files are done
  test.skip('record link popup', () => {
    testFacetWithinFacet(
      async (page, baseURL, testInfo) => {
        await page.goto(getChaiseURL('record', 'record_main', baseURL, testInfo) + '/id=record_main_01');
        await RecordLocators.waitForRecordPageReady(page);
        const modal = ModalLocators.getAddPureBinaryPopup(page);
        await RecordLocators.getRelatedTableAddButton(page, 'main association', true).click();
        await expect(modal).toBeVisible();
        return modal;
      }
    )
  });

  // TODO unskip once the config files are done
  test.skip('recoredit fk popup', () => {
    testFacetWithinFacet(
      async (page, baseURL, testInfo) => {
        await page.goto(getChaiseURL('recordedit', 'main', baseURL, testInfo));
        await RecordeditLocators.waitForRecordeditPageReady(page);
        const modal = ModalLocators.getForeignKeyPopup(page);
        await RecordeditLocators.getForeignKeyInputButton(page, 'fk_to_main', 1).click();
        await expect(modal).toBeVisible();
        return modal;
      }
    )
  });
});
