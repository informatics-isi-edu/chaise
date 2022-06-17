import { defaultDisplayname } from '@isrd-isi-edu/chaise/src/utils/constants';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

/**
 * Returns an object that can be used for showing the null filter
 * @param  {boolean} selected whether it should be selected
 * @param  {boolean} disabled whether it should be disabled
 * 
 * NOTE: refactored in react branch to require parmaeter to be boolean type instead of null or objects
 */
export function getNullFilter(selected: boolean, disabled: boolean) {
  return {
      selected: selected,
      disabled: disabled,
      uniqueId: null,
      displayname: {'value': null, 'isHTML': false},
      tooltip: {
          value: MESSAGE_MAP.tooltip.null,
          isHTML: false
      },
      alwaysShowTooltip: true
  };
}

/**
 * Returns an object that can be used for showing the not-null filter
 * @param  {boolean} selected whether it should be selected
 * @param  {boolean} disabled whether it should be disabled
 * 
 * NOTE: refactored in react branch to require parmaeter to be boolean type instead of null or objects
 */
export function getNotNullFilter(selected: boolean) {
  return {
      selected: selected,
      isNotNull: true,
      displayname: {'value': defaultDisplayname.notNull, 'isHTML': true},
      tooltip: {
          value: MESSAGE_MAP.tooltip.notNull,
          isHTML: false
      },
      alwaysShowTooltip: true
  };
}