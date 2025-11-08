import {
  FacetCheckBoxRow,
  RecordsetConfig,
  RecordsetDisplayMode,
} from '@isrd-isi-edu/chaise/src/models/recordset';
import { DEFAULT_DISPLAYNAME } from '@isrd-isi-edu/chaise/src/utils/constants';

/**
 * Returns an object that can be used for showing the null filter
 * @param  {boolean?} selected whether it should be selected
 */
export function getNullFacetCheckBoxRow(selected?: boolean): FacetCheckBoxRow {
  return {
    selected: typeof selected === 'boolean' ? selected : false,
    uniqueId: null,
    displayname: { value: null, isHTML: false },
  };
}

/**b
 * Returns an object that can be used for showing the not-null filter
 * @param  {boolean?} selected whether it should be selected
 */
export function getNotNullFacetCheckBoxRow(selected?: boolean): FacetCheckBoxRow {
  return {
    selected: typeof selected === 'boolean' ? selected : false,
    isNotNull: true,
    displayname: { value: DEFAULT_DISPLAYNAME.notNull, isHTML: true },
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
  if (config.disableFaceting || !initialReference.display.showFaceting) return false;

  let res = initialReference.display.facetPanelOpen;
  if (typeof res !== 'boolean') {
    res = config.displayMode === RecordsetDisplayMode.FULLSCREEN;
  }
  return res;
}