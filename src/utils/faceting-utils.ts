import { FacetCheckBoxRow, RecordsetConfig, RecordsetDisplayMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import { DEFAULT_DISPLAYNAME } from '@isrd-isi-edu/chaise/src/utils/constants';
import LocalStorage from '@isrd-isi-edu/chaise/src/utils/storage';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';

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
 *
 * This function consults both the annotation and the stored order.
 *
 * @param reference the reference that represents the main recordset page
 */
export const getInitialFacetOrder = (reference: any): { facetIndex: number, isOpen: boolean }[] => {
  const res: { facetIndex: number, isOpen: boolean }[] = [];
  const facetColumns = reference.facetColumns;
  const facetListKey = getFacetOrderStorageKey(reference);
  const facetOrder = LocalStorage.getStorage(facetListKey) as {
    name: string,
    open: boolean
  }[] || undefined;
  let atLeastOneIsOpen = false;

  // no valid stored value was found in storage, so return the annotaion value.
  if (!facetOrder || !Array.isArray(facetOrder) || facetOrder.length === 0) {
    facetColumns.forEach((fc: any, index: number) => {
      if (fc.isOpen) atLeastOneIsOpen = true;
      res.push({ facetIndex: index, isOpen: fc.isOpen });
    });

    // all the facets are closed, open the first one
    if (!atLeastOneIsOpen && res.length > 0) {
      res[0].isOpen = true;
    }
    return res;
  }

  // store the mapping between name and facetIndex
  const annotOrder: { [facetName: string]: { facetIndex: number, isOpen: boolean, hasFilters: boolean } } = {};
  facetColumns.forEach((fc: any, facetIndex: number) => {
    annotOrder[fc.sourceObjectWrapper.name] = {
      facetIndex,
      isOpen: fc.isOpen,
      // if the facet has filters, we have to open it.
      hasFilters: fc.filters.length > 0
    };
  });

  // make sure the saved order are still part of the visible facets
  facetOrder.forEach((fo) => {
    // ignore the invalid or missing ones.
    if (!isObjectAndKeyDefined(fo, 'name') || !(fo.name in annotOrder)) return;

    const currOrder = annotOrder[fo.name];
    let isOpen = currOrder.isOpen;
    if (typeof fo.open === 'boolean') {
      isOpen = fo.open;
    }
    // if the facet has filters, we have to open it so we can show the initial state properly
    if (currOrder.hasFilters) {
      isOpen = true;
    }
    res.push({ facetIndex: currOrder.facetIndex, isOpen });

    if (isOpen) {
      atLeastOneIsOpen = true;
    }

    // remove it so we know which facets were not in the stored order (it will also make sure duplicates are ignored)
    delete annotOrder[fo.name];
  });

  // add the rest of visible facets that were not part of the stored order
  facetColumns.forEach((fc: any, facetIndex: number) => {
    const facetName = fc.sourceObjectWrapper.name;
    if (!(facetName in annotOrder)) return;
    const isOpen = annotOrder[facetName].isOpen;
    if (isOpen) {
      atLeastOneIsOpen = true;
    }
    res.push({ facetIndex: facetIndex, isOpen });
  });

  // all the facets are closed, open the first one
  if (!atLeastOneIsOpen && res.length > 0) {
    res[0].isOpen = true;
  }

  return res;
}

/**
 * Return the order of facets (and their open status) that should be used initially.
 *
 * Notes:
 *   - The returned object has two props:
 *     - order: the same response that you get from getInitialFacetOrder
 *     - openStatus: an object where the key is the facet index and the returned value is whether the facet
 *       should be open or not.
 *   - This function consults both the annotation and the stored order.
 *
 * @param reference the reference that represents the main recordset page
 */
export const getInitialFacetOpenStatus = (reference: any): {
  order: { facetIndex: number, isOpen: boolean }[],
  openStatus: { [facetIndex: string]: boolean }
} => {
  const storedOrder = getInitialFacetOrder(reference);

  const booleanRes: { [facetIndex: string]: boolean } = {};
  storedOrder.forEach((r) => { booleanRes[r.facetIndex] = r.isOpen; });
  return { order: storedOrder, openStatus: booleanRes };
}
