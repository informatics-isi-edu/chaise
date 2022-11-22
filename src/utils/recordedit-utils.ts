/**
 * Utility functions related to recordedit and other create/update functionality
 */

// models
import { LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit'

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utilities
import { getInputType, isDisabled } from '@isrd-isi-edu/chaise/src/utils/input-utils';

/**
 * Create a columnModel based on the given column that can be used in a recordedit form
 * @param column the column object from ermrestJS
 */
export function columnToColumnModel(column: any): RecordeditColumnModel {
  const isInputDisabled: boolean = isDisabled(column);
  const stackNode = LogService.getStackNode(
    column.isForeignKey ? LogStackTypes.FOREIGN_KEY : LogStackTypes.COLUMN,
    column.table,
    { source: column.compressedDataSource, entity: column.isForeignKey }
  );
  const stackPath = column.isForeignKey ? LogStackPaths.FOREIGN_KEY : LogStackPaths.COLUMN;

  var type;
  if (column.isAsset) {
    type = 'file'
  } else if (isInputDisabled) {
    type = 'disabled';
  } else if (column.isForeignKey) {
    type = 'popup-select';
  } else {
    type = getInputType(column.type);
  }

  // if (type == 'boolean') {
  //   var trueVal = InputUtils.formatBoolean(column, true),
  //     falseVal = InputUtils.formatBoolean(column, false),
  //     booleanArray = [trueVal, falseVal];

  //   // create map
  //   var booleanMap = {};
  //   booleanMap[trueVal] = true;
  //   booleanMap[falseVal] = false;
  // }

  return {
    // allInput: undefined,
    // booleanArray: booleanArray || [],
    // booleanMap: booleanMap || {},
    column: column,
    isDisabled: isInputDisabled,
    isRequired: !column.nullok && !isInputDisabled,
    inputType: type,
    // highlightRow: false,
    // showSelectAll: false,
    // logStackNode: stackNode, // should not be used directly, take a look at getColumnModelLogStack
    // logStackPathChild: stackPath // should not be used directly, use getColumnModelLogAction getting the action string
  };
}