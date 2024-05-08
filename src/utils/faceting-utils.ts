import { FacetCheckBoxRow, RecordsetConfig, RecordsetDisplayMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import { DEFAULT_DISPLAYNAME } from '@isrd-isi-edu/chaise/src/utils/constants';

/**
 * Returns an object that can be used for showing the null filter
 * @param  {boolean?} selected whether it should be selected
 */
export function getNullFacetCheckBoxRow(selected?: boolean): FacetCheckBoxRow {
  return {
    selected: (typeof selected === 'boolean') ? selected : false,
    uniqueId: null,
    displayname: { 'value': null, 'isHTML': false }
  };
}

/**b
* Returns an object that can be used for showing the not-null filter
* @param  {boolean?} selected whether it should be selected
*/
export function getNotNullFacetCheckBoxRow(selected?: boolean): FacetCheckBoxRow {
  return {
    selected: (typeof selected === 'boolean') ? selected : false,
    isNotNull: true,
    displayname: { 'value': DEFAULT_DISPLAYNAME.notNull, 'isHTML': true }
  };
}

/**
 * Whether the facet panel is going to be open on load or not
 *
 * NOTE: will return false if faceting is disabled or should be hidden
 * default value is based on reference.display.facetPanelOpen
 * and if it's not defined, it will be:
 * - true: in fullscreen mode
 * - false: in any other modes
 * @param config the recordset config
 * @param initialReference the initial reference object
 */
export function getInitialFacetPanelOpen(config: RecordsetConfig, initialReference: any): boolean {
  if (config.disableFaceting || !config.showFaceting) return false;

  let res = initialReference.display.facetPanelOpen;
  if (typeof res !== 'boolean') {
    res = config.displayMode === RecordsetDisplayMode.FULLSCREEN;
  }
  return res;
}

/**
 * Change render order for facets based on 'newOrder'
 * @param defaultFacetColumns default order ex. 'reference.facetColumns'
 * @param newOrder order in which the facets should be rendered 
 * @returns facet columns in newOrder
 */
export const reorderFacets = (defaultFacetColumns:any[], newOrder:string[]) => {
  // Create a map to store the indices of elements in array `newOrder`
  const indexMap = new Map();
  for (let i = 0; i < newOrder.length; i++) {
      indexMap.set(newOrder[i], i);
  }

  const facetsInNewOrder = defaultFacetColumns.map((item: any, index: number) => [item, index])

  // Sort array `defaultFacetColumns` based on the indices in array `newOrder`
  facetsInNewOrder.sort((a, b) => {
      const indexA = indexMap.get(a[0].sourceObjectWrapper.name);
      const indexB = indexMap.get(b[0].sourceObjectWrapper.name);
      // If either element is not found in `newOrder`, move it to the end
      if (indexA === undefined) return 1;
      if (indexB === undefined) return -1;
      return indexA - indexB;
  });

  return facetsInNewOrder;
}