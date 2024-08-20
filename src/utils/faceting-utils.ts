import { FacetCheckBoxRow, RecordsetConfig, RecordsetDisplayMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import { DEFAULT_DISPLAYNAME } from '@isrd-isi-edu/chaise/src/utils/constants';
import LocalStorage from '@isrd-isi-edu/chaise/src/utils/storage';

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

export const getFacetOrderStorageKey = (reference: any): string => {
  return `facet-order-${reference.table.schema.catalog.id}_${reference.table.schema.name}_${reference.table.name}`;
}

/**
 * Return the order of facets that should be used initially.
 * @param reference the reference that represents the main recordset page
 */
export const getStoredFacetOrders = (reference: any): { facetIndex: number, isOpen?: boolean }[] | null => {
  const facetColumns = reference.facetColumns;
  const facetListKey = getFacetOrderStorageKey(reference);
  const facetOrder = LocalStorage.getStorage(facetListKey) as {
    name: string,
    open: boolean
  }[] || undefined;

  if (!facetOrder || !Array.isArray(facetOrder) || facetOrder.length === 0) {
    return null;
  }

  const res: { facetIndex: number, isOpen?: boolean }[] = [];

  // store the mapping between name and facetIndex
  const nameMap: { [facetName: string]: number } = {};
  facetColumns.forEach((fc: any, facetIndex: number) => {
    nameMap[fc.sourceObjectWrapper.name] = facetIndex;
  });

  // make sure the saved order are still part of the visible facets
  facetOrder.forEach((fo) => {
    // ignore the invalid or missing ones.
    if (!(fo.name in nameMap)) return;

    res.push({ facetIndex: nameMap[fo.name], isOpen: fo.open });

    // remove it so we know which facets were not in the stored order
    delete nameMap[fo.name];
  });

  // add the rest of visible facets that were not part of the stored order
  facetColumns.forEach((fc: any, facetIndex: number) => {
    const facetName = fc.sourceObjectWrapper.name;
    if (!(facetName in nameMap)) return;

    res.push({ facetIndex: facetIndex });
  });

  return res;
}

/**
 * Return an object where the key is the facet index and the value is its stored isOpen.
 *
 * @param reference the reference that represents the main recordset page
 */
export const getStoredFacetOpenStatus = (reference: any): { [facetIndex: string]: (boolean | undefined) } => {
  const storedOrder = getStoredFacetOrders(reference);
  if (!storedOrder) return {};

  const booleanRes: { [facetIndex: string]: (boolean | undefined) } = {};
  storedOrder.forEach((r) => { booleanRes[r.facetIndex] = r.isOpen; });
  return booleanRes;
}
