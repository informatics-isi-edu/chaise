import { FacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/models/recordset';
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
