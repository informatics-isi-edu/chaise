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
   * description of the config
   */
  description: string,
  /**
   * if defined, we will first select the option defined here.
   */
  otherFacet?: {
    index: number,
    option: number,
    numRows: number,
    /**
     * how many filters are visible after selection (default: 1)
     */
    numFacetFilters: number
  }[],
  popup: {
    uiContext: string,
    title: string,
    facetNames: string[],
    numRows: number,
    facets: {
      index: number,
      name: string,
      options: string[],
      /**
       * if defined, selection is done proior to opening the popup.
       */
      select?: {
        option: number,
        numRows: number,
        /**
         * the name that appears above the table summarizing the selected filters
         */
        filterName?: string,
        /**
         * how many filters are visible after selection, default=1
         */
        numFacetFilters?: number
      }[],
      popup?: {
        uiContext: string,
        title: string,
        numRows: number,
        /**
         * list of selected items
         */
        selectedChiclets?: string[]
      },
      /**
       * useful if you want to select something without affecting other facets.
       */
      clearAll?: boolean
    }[]
  }

}

const popuFacetNames = [
  '2nd layer entity path', '2nd layer entity path 2', '2nd layer entity path with filter', '2nd layer entity path with shared prefix',
  '2nd layer entity path with shared prefix and filter', '2nd layer entity path with fast filter'
]

const getTestParams = (rootUIContext: string): {
  facets: FacetParamType[]
} => {
  return {
    facets: [
      {
        index: 0,
        name: 'Entity path',
        description: 'general case without any selection',
        popup: {
          uiContext: rootUIContext + ':',
          title: 'Select Entity path',
          facetNames: popuFacetNames,
          numRows: 10,
          facets: [
            {
              index: 0,
              name: popuFacetNames[0],
              options: [
                'All records with value', 'No value',
                'facet_2nd_layer_hub_inbound1_10', 'facet_2nd_layer_hub_inbound1_11', 'facet_2nd_layer_hub_inbound1_12',
                'facet_2nd_layer_hub_inbound1_13', 'facet_2nd_layer_hub_inbound1_14', 'facet_2nd_layer_hub_inbound1_15'
              ],
              popup: {
                uiContext: rootUIContext + 'Entity path:',
                title: 'Select 2nd layer entity path',
                numRows: 6
              }
            },
            {
              index: 1,
              name: popuFacetNames[1],
              options: [
                'All records with value', 'No value',
                'facet_2nd_layer_hub_inbound2_10', 'facet_2nd_layer_hub_inbound2_11', 'facet_2nd_layer_hub_inbound2_12',
                'facet_2nd_layer_hub_inbound2_13', 'facet_2nd_layer_hub_inbound2_14', 'facet_2nd_layer_hub_inbound2_15'
              ],
              popup: {
                uiContext: rootUIContext + 'Entity path:',
                title: 'Select 2nd layer entity path 2',
                numRows: 6
              }
            },
            {
              index: 2,
              name: popuFacetNames[2],
              options: [
                'All records with value',
                'facet_2nd_layer_hub_inbound1_10', 'facet_2nd_layer_hub_inbound1_11', 'facet_2nd_layer_hub_inbound1_12',
                'facet_2nd_layer_hub_inbound1_13', 'facet_2nd_layer_hub_inbound1_14', 'facet_2nd_layer_hub_inbound1_15'
              ],
              popup: {
                uiContext: rootUIContext + 'Entity path:',
                title: 'Select 2nd layer entity path with filter',
                numRows: 6
              }
            },
            {
              index: 3,
              name: popuFacetNames[3],
              options: [
                'All records with value', 'No value',
                'facet_2nd_layer_hub_inbound3_10', 'facet_2nd_layer_hub_inbound3_11', 'facet_2nd_layer_hub_inbound3_12',
                'facet_2nd_layer_hub_inbound3_13', 'facet_2nd_layer_hub_inbound3_14', 'facet_2nd_layer_hub_inbound3_15'
              ],
              popup: {
                uiContext: rootUIContext + 'Entity path:',
                title: 'Select 2nd layer entity path with shared prefix',
                numRows: 6
              }
            },
            {
              index: 4,
              name: popuFacetNames[4],
              options: [
                'All records with value',
                'facet_2nd_layer_hub_inbound4_10', 'facet_2nd_layer_hub_inbound4_11', 'facet_2nd_layer_hub_inbound4_12',
                'facet_2nd_layer_hub_inbound4_13', 'facet_2nd_layer_hub_inbound4_14', 'facet_2nd_layer_hub_inbound4_15'
              ],
              popup: {
                uiContext: rootUIContext + 'Entity path:',
                title: 'Select 2nd layer entity path with shared prefix and filter',
                numRows: 6
              }
            },
            {
              index: 5,
              name: popuFacetNames[5],
              options: [
                'All records with value', 'No value',
                'facet_2nd_layer_hub_inbound5_10', 'facet_2nd_layer_hub_inbound5_11', 'facet_2nd_layer_hub_inbound5_12',
                'facet_2nd_layer_hub_inbound5_13', 'facet_2nd_layer_hub_inbound5_14', 'facet_2nd_layer_hub_inbound5_15'
              ],
              popup: {
                uiContext: rootUIContext + 'Entity path:',
                title: 'Select 2nd layer entity path with fast filter',
                numRows: 6
              }
            },
          ]
        }
      },
      {
        index: 1,
        name: 'Entity path 2',
        description: 'selection at the root',
        otherFacet: [{
          index: 0,
          option: 1, // null
          numRows: 18,
          numFacetFilters: 1
        }, {
          index: 0,
          option: 2,
          numRows: 19,
          numFacetFilters: 1
        }],
        popup: {
          uiContext: rootUIContext + ':',
          title: 'Select Entity path 2',
          facetNames: popuFacetNames,
          numRows: 8,
          facets: [
            {
              index: 0,
              name: popuFacetNames[0],
              options: [
                'All records with value', 'facet_2nd_layer_hub_inbound1_13',
                'facet_2nd_layer_hub_inbound1_14', 'facet_2nd_layer_hub_inbound1_15'
              ],
              popup: {
                uiContext: rootUIContext + 'Entity path 2:',
                title: 'Select 2nd layer entity path',
                numRows: 3
              }
            },
            {
              index: 1,
              name: popuFacetNames[1],
              options: [
                'All records with value', 'facet_2nd_layer_hub_inbound2_13',
                'facet_2nd_layer_hub_inbound2_14', 'facet_2nd_layer_hub_inbound2_15'
              ],
              popup: {
                uiContext: rootUIContext + 'Entity path 2:',
                title: 'Select 2nd layer entity path 2',
                numRows: 3
              }
            },
            {
              index: 2,
              name: popuFacetNames[2],
              options: [
                'All records with value', 'facet_2nd_layer_hub_inbound1_13',
                'facet_2nd_layer_hub_inbound1_14', 'facet_2nd_layer_hub_inbound1_15'
              ],
              popup: {
                uiContext: rootUIContext + 'Entity path 2:',
                title: 'Select 2nd layer entity path with filter',
                numRows: 3
              }
            },
            {
              index: 3,
              name: popuFacetNames[3],
              options: [
                'All records with value', 'facet_2nd_layer_hub_inbound3_13',
                'facet_2nd_layer_hub_inbound3_14', 'facet_2nd_layer_hub_inbound3_15'
              ],
              popup: {
                uiContext: rootUIContext + 'Entity path 2:',
                title: 'Select 2nd layer entity path with shared prefix',
                numRows: 3
              }
            },
            {
              index: 4,
              name: popuFacetNames[4],
              options: [
                'All records with value', 'facet_2nd_layer_hub_inbound4_13',
                'facet_2nd_layer_hub_inbound4_14', 'facet_2nd_layer_hub_inbound4_15'
              ],
              popup: {
                uiContext: rootUIContext + 'Entity path 2:',
                title: 'Select 2nd layer entity path with shared prefix and filter',
                numRows: 3
              }
            },
            {
              index: 5,
              name: popuFacetNames[5],
              options: [
                'All records with value', 'facet_2nd_layer_hub_inbound5_13',
                'facet_2nd_layer_hub_inbound5_14', 'facet_2nd_layer_hub_inbound5_15'
              ],
              popup: {
                uiContext: rootUIContext + 'Entity path 2:',
                title: 'Select 2nd layer entity path with fast filter',
                numRows: 3
              }
            },
          ]
        }
      },
      {
        index: 2,
        name: 'Entity path with filter',
        description: 'path with filter, selection on the popup',
        popup: {
          uiContext: rootUIContext + ':',
          title: 'Select Entity path with filter',
          facetNames: popuFacetNames,
          numRows: 10,
          facets: [
            {
              index: 0,
              name: popuFacetNames[0],
              options: [
                'All records with value', 'No value',
                'facet_2nd_layer_hub_inbound1_10', 'facet_2nd_layer_hub_inbound1_11', 'facet_2nd_layer_hub_inbound1_12',
                'facet_2nd_layer_hub_inbound1_13', 'facet_2nd_layer_hub_inbound1_14', 'facet_2nd_layer_hub_inbound1_15'
              ],
              select: [{
                option: 1, // null
                numRows: 5,
              }, {
                option: 2,
                numRows: 6,
                filterName: '2nd layer entity pathNo value , facet_2nd_layer_hub_inbound1_10'
              }]
            },
            {
              index: 1,
              name: popuFacetNames[1],
              options: ['All records with value', 'facet_2nd_layer_hub_inbound2_10', 'facet_2nd_layer_hub_inbound2_11']
            },
            {
              index: 2,
              name: popuFacetNames[2],
              options: ['All records with value', 'facet_2nd_layer_hub_inbound1_10', 'facet_2nd_layer_hub_inbound1_11'],
              popup: {
                uiContext: rootUIContext + 'Entity path with filter:',
                title: 'Select 2nd layer entity path with filter',
                numRows: 2
              }
            },
            {
              index: 3,
              name: popuFacetNames[3],
              options: ['All records with value', 'facet_2nd_layer_hub_inbound3_10', 'facet_2nd_layer_hub_inbound3_11']
            },
            {
              index: 4,
              name: popuFacetNames[4],
              options: ['All records with value', 'facet_2nd_layer_hub_inbound4_10', 'facet_2nd_layer_hub_inbound4_11']
            },
            {
              index: 5,
              name: popuFacetNames[5],
              options: ['All records with value', 'facet_2nd_layer_hub_inbound5_10', 'facet_2nd_layer_hub_inbound5_11']
            }
          ]
        }
      },
      {
        index: 3,
        name: 'Entity path with shared prefix',
        description: 'select filters for itself and see it has no effect on the popup. shared prefix filter on popup',
        otherFacet: [{
          index: 3,
          option: 1, // null
          numRows: 19,
          numFacetFilters: 1
        }, {
          index: 3,
          option: 2,
          numRows: 20,
          numFacetFilters: 1
        }],
        popup: {
          uiContext: rootUIContext + ':',
          title: 'Select Entity path with shared prefix',
          facetNames: popuFacetNames,
          numRows: 8,
          facets: [
            {
              index: 0,
              name: popuFacetNames[0],
              options: [
                'All records with value', 'No value', 'facet_2nd_layer_hub_inbound1_13',
                'facet_2nd_layer_hub_inbound1_14', 'facet_2nd_layer_hub_inbound1_15'
              ],
              popup: {
                uiContext: rootUIContext + 'Entity path with shared prefix:',
                title: 'Select 2nd layer entity path',
                numRows: 3
              }
            },
            {
              index: 1,
              name: popuFacetNames[1],
              options: [
                'All records with value', 'No value','facet_2nd_layer_hub_inbound2_13',
                'facet_2nd_layer_hub_inbound2_14', 'facet_2nd_layer_hub_inbound2_15'
              ]
            },
            {
              index: 2,
              name: popuFacetNames[2],
              options: [
                'All records with value', 'facet_2nd_layer_hub_inbound1_13',
                'facet_2nd_layer_hub_inbound1_14', 'facet_2nd_layer_hub_inbound1_15'
              ]
            },
            {
              index: 3,
              name: popuFacetNames[3],
              options: [
                'All records with value', 'No value', 'facet_2nd_layer_hub_inbound3_13',
                'facet_2nd_layer_hub_inbound3_14', 'facet_2nd_layer_hub_inbound3_15'
              ],
              select: [{
                option: 4,
                numRows: 1,
              },{
                option: 1, // null
                numRows: 6,
              }],
              popup: {
                uiContext: rootUIContext + 'Entity path with shared prefix:',
                title: 'Select 2nd layer entity path with shared prefix',
                numRows: 3,
                selectedChiclets: ['No value', 'facet_2nd_layer_hub_inbound3_15']
              }
            },
            {
              index: 4,
              name: popuFacetNames[4],
              options: [ 'All records with value', 'facet_2nd_layer_hub_inbound4_15' ],
              popup: {
                uiContext: rootUIContext + 'Entity path with shared prefix:',
                title: 'Select 2nd layer entity path with shared prefix and filter',
                numRows: 1
              }
            },
            {
              index: 5,
              name: popuFacetNames[5],
              options: [ 'All records with value', 'facet_2nd_layer_hub_inbound5_15' ]
            },
          ]
        }
      },
      {
        index: 4,
        name: 'Entity path with shared prefix and filter',
        description: 'shared prefix facet interactions',
        popup: {
          uiContext: rootUIContext + ':',
          title: 'Select Entity path with shared prefix and filter',
          facetNames: popuFacetNames,
          numRows: 10,
          facets: [
            {
              index: 3,
              name: popuFacetNames[3],
              options: [
                'All records with value', 'No value', 'facet_2nd_layer_hub_inbound3_06',
                'facet_2nd_layer_hub_inbound3_07', 'facet_2nd_layer_hub_inbound3_08', 'facet_2nd_layer_hub_inbound3_09',
                'facet_2nd_layer_hub_inbound3_10', 'facet_2nd_layer_hub_inbound3_11', 'facet_2nd_layer_hub_inbound3_12',
                'facet_2nd_layer_hub_inbound3_13', 'facet_2nd_layer_hub_inbound3_14', 'facet_2nd_layer_hub_inbound3_15'
              ],
              select: [{
                option: 3,
                numRows: 1
              }, {
                option: 4,
                numRows: 2,
                numFacetFilters: 1
              }]
            },
            {
              index: 4,
              name: popuFacetNames[4],
              options: [
                'All records with value', 'facet_2nd_layer_hub_inbound4_06', 'facet_2nd_layer_hub_inbound4_07',
                'facet_2nd_layer_hub_inbound4_08', 'facet_2nd_layer_hub_inbound4_09'
              ],
              select: [{
                option: 1,
                numRows: 1,
                numFacetFilters: 2
              }],
              popup: {
                uiContext: rootUIContext + 'Entity path with shared prefix and filter:',
                title: 'Select 2nd layer entity path with shared prefix and filter',
                numRows: 4,
                selectedChiclets: ['facet_2nd_layer_hub_inbound4_06']
              }
            }
          ]
        }
      },
      {
        index: 5,
        name: 'Select 2nd layer entity path with fast filter',
        description: 'fast filter',
        popup: {
          uiContext: rootUIContext + ':',
          title: 'Select Entity path with fast filter',
          facetNames: popuFacetNames,
          numRows: 8,
          facets: [
            {
              index: 5,
              name: popuFacetNames[5],
              options: [
                'All records with value', 'No value', 'facet_2nd_layer_hub_inbound5_13',
                'facet_2nd_layer_hub_inbound5_14', 'facet_2nd_layer_hub_inbound5_15'
              ],
              select: [{
                option: 1,
                numRows: 5
              }, {
                option: 2,
                numRows: 6
              }],
              popup: {
                uiContext: rootUIContext + 'Entity path with fast filter:',
                title: 'Select 2nd layer entity path with fast filter',
                numRows: 3,
                selectedChiclets: ['No value', 'facet_2nd_layer_hub_inbound5_13']
              }
            },
            // open another one and make sure it works
            {
              index: 0,
              name: popuFacetNames[0],
              options: ['All records with value', 'facet_2nd_layer_hub_inbound1_13'],
              popup: {
                uiContext: rootUIContext + 'Entity path with fast filter:',
                title: 'Select 2nd layer entity path',
                numRows: 1,
                selectedChiclets: []
              }
            }
          ]
        }
      }
    ]
  }
}

/******************** helpers ************************/

const getChaiseURL = (appName: string, tableName: string, baseURL: string | undefined, testInfo: TestInfo) => {
  return `${baseURL}/${appName}/#${getCatalogID(testInfo.project.name)}/facet-within-facet:${tableName}`;
};

/**
 * This function must be defined before the test blocks.
 * @param rootUIContext the ui context of the page (depends on where the recordset instance is)
 * @param initialPageLoad the initial operation to load the recordset instance. it should return the container of recordset instance
 */
const testFacetWithinFacet = (
  rootUIContext: string,
  initialPageLoad: (page: Page, baseURL: string | undefined, testInfo: TestInfo) => Promise<Page | Locator>
) => {

  // make sure facet within facet works for all the different types of entity facets we have (shared prefix, with filter, etc)
  const testParams = getTestParams(rootUIContext)
  for (const firstLevelProps of testParams.facets) {
    test(`first level: ${firstLevelProps.name}`, async ({ page, baseURL }, testInfo) => {
      let container: Page | Locator;

      await test.step('open the recordset instance', async () => {
        container = await initialPageLoad(page, baseURL, testInfo);
      });

      if (Array.isArray(firstLevelProps.otherFacet) && firstLevelProps.otherFacet.length > 0) {
        await test.step('select an option in one of the facets', async () => {
          for await (const item of firstLevelProps.otherFacet!) {
            const f = RecordsetLocators.getFacetById(container, item.index);
            await expect.soft(f).toBeVisible();
            await testSelectFacetOption(container, f, item.option, item.numRows, item.numFacetFilters);
          }
        });
      }

      await test.step('facet popup', async () => {
        const firstLevelModal = ModalLocators.getFacetPopup(page, 1);
        const secondLevelModal = ModalLocators.getFacetPopup(page, 2);

        await test.step('display title, ui context, and number of rows', async () => {
          const f = RecordsetLocators.getFacetById(container, firstLevelProps.index);
          await RecordsetLocators.getShowMore(f).click();
          await expect.soft(firstLevelModal).toBeVisible();
          await RecordsetLocators.waitForRecordsetPageReady(firstLevelModal);

          await expect.soft(ModalLocators.getModalHeaderContext(firstLevelModal)).toHaveText(firstLevelProps.popup.uiContext);
          await expect.soft(ModalLocators.getModalTitle(firstLevelModal)).toHaveText(firstLevelProps.popup.title);
          await expect.soft(RecordsetLocators.getRows(firstLevelModal)).toHaveCount(firstLevelProps.popup.numRows);
        });

        await test.step('display facet options', async () => {
          const showBtn = RecordsetLocators.getShowFilterPanelBtn(firstLevelModal);
          await expect.soft(showBtn).toBeVisible();
          await showBtn.click();
          // all of them are open based on the annotation
          await testDisplayedFacets(firstLevelModal, firstLevelProps.popup.facetNames, firstLevelProps.popup.facetNames);
        });

        for await (const secondLevelProps of firstLevelProps.popup.facets) {
          await test.step(`second level: ${secondLevelProps.name}`, async () => {
            const popupFacetEl = RecordsetLocators.getFacetById(firstLevelModal, secondLevelProps.index);

            await test.step('display facet options', async () => {
              // wait for list to be fully visible
              await expect.soft(RecordsetLocators.getList(popupFacetEl)).toBeVisible();
              // wait for facet checkboxes to load
              await expect.soft(RecordsetLocators.getFacetOptions(popupFacetEl)).toHaveText(secondLevelProps.options);
            });

            if (Array.isArray(secondLevelProps.select) && secondLevelProps.select.length > 0) {
              await test.step('selecting facet option(s)', async () => {
                for await (const item of secondLevelProps.select!) {
                  await testSelectFacetOption(firstLevelModal, popupFacetEl, item.option, item.numRows, item.numFacetFilters);
                  if (item.filterName) {
                    await expect.soft(RecordsetLocators.getFacetFilters(firstLevelModal).nth(0)).toHaveText(item.filterName);
                  }
                }
              });
            }

            if (secondLevelProps.popup) {
              await test.step('facet popup', async () => {
                const showMore = RecordsetLocators.getShowMore(popupFacetEl);
                await expect.soft(showMore).toBeVisible();
                await RecordsetLocators.getShowMore(popupFacetEl).click();
                await expect.soft(secondLevelModal).toBeVisible();
                await RecordsetLocators.waitForRecordsetPageReady(secondLevelModal);

                await expect.soft(RecordsetLocators.getShowFilterPanelBtn(secondLevelModal)).not.toBeVisible();
                await expect.soft(ModalLocators.getModalHeaderContext(secondLevelModal)).toHaveText(secondLevelProps.popup!.uiContext);
                await expect.soft(ModalLocators.getModalTitle(secondLevelModal)).toHaveText(secondLevelProps.popup!.title);
                await expect.soft(RecordsetLocators.getRows(secondLevelModal)).toHaveCount(secondLevelProps.popup!.numRows);

                const chiclets = secondLevelProps.popup!.selectedChiclets;
                if (chiclets) {
                  await expect.soft(RecordsetLocators.getSelectedRowsFilters(secondLevelModal)).toHaveCount(chiclets.length);
                  await expect.soft(RecordsetLocators.getSelectedRowsFilters(secondLevelModal)).toHaveText(chiclets);
                }

                await ModalLocators.getCloseBtn(secondLevelModal).click();
                await expect.soft(secondLevelModal).not.toBeAttached();
              });
            }

            if (secondLevelProps.clearAll) {
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

  test.describe.configure({ mode: 'parallel' });

  test.describe('recordset page', () => {
    testFacetWithinFacet(
      'main',
      async (page, baseURL, testInfo) => {
        await page.goto(getChaiseURL('recordset', 'main', baseURL, testInfo));
        await RecordsetLocators.waitForRecordsetPageReady(page);
        return page;
      }
    )
  });

  test.describe('record link popup', () => {
    testFacetWithinFacet(
      'main association',
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

  test.describe('recoredit fk popup', () => {
    testFacetWithinFacet(
      'fk_to_main',
      async (page, baseURL, testInfo) => {
        await page.goto(getChaiseURL('recordedit', 'recordedit_main', baseURL, testInfo));
        await RecordeditLocators.waitForRecordeditPageReady(page);
        const modal = ModalLocators.getForeignKeyPopup(page);
        await RecordeditLocators.getForeignKeyInputButton(page, 'fk_to_main', 1).click();
        await expect(modal).toBeVisible();

        await expect.soft(RecordsetLocators.getShowFilterPanelBtn(modal)).toBeVisible();
        await RecordsetLocators.getShowFilterPanelBtn(modal).click();
        await expect.soft(RecordsetLocators.getSidePanel(modal)).toHaveAttribute('class', /open-panel/);

        return modal;
      }
    )
  });
});
