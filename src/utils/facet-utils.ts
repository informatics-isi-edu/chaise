import { FacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/models/recordset';
import { DEFAULT_DISPLAYNAME } from '@isrd-isi-edu/chaise/src/utils/constants';

/**
 * Returns an object that can be used for showing the null filter
 * @param  {boolean?} selected whether it should be selected
 * @param  {boolean?} disabled whether it should be disabled
 */
export function getNullFacetCheckBoxRow(selected?: boolean, disabled?: boolean): FacetCheckBoxRow {
  return {
    selected: (typeof selected === 'boolean') ? selected : false,
    disabled: (typeof disabled === 'boolean') ? disabled : false,
    uniqueId: null,
    displayname: { 'value': null, 'isHTML': false },
    // TODO
    // tooltip: {
    //   value: messageMap.tooltip.null,
    //   isHTML: false
    // },
    alwaysShowTooltip: true
  };
}

/**b
* Returns an object that can be used for showing the not-null filter
* @param  {boolean?} selected whether it should be selected
*/
export function getNotNullFacetCheckBoxRow(selected?: boolean): FacetCheckBoxRow {
  return {
    selected: (typeof selected === 'boolean') ? selected : false,
    disabled: false,
    isNotNull: true,
    displayname: { 'value': DEFAULT_DISPLAYNAME.notNull, 'isHTML': true },
    // TODO
    // tooltip: {
    //   value: messageMap.tooltip.notNull,
    //   isHTML: false
    // },
    alwaysShowTooltip: true
  };
}
