/**
 * Utility functions related to inputs
 */

// constants
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';

// models
import { RecordeditColumnModel, TimestampOptions } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

/**
 * Recursively sets the display type for inputs (currently for recordedit)
 * @param {Object} type - the type object defining the columns type
 */
export function getInputType(type: any): string {
  let inputType;

  if (type.isArray) {
    return 'array';
  }

  switch (type.name) {
    case 'timestamp':
    case 'timestamptz':
      inputType = 'timestamp';
      break;
    case 'date':
      inputType = 'date';
      break;
    case 'float4':
    case 'float8':
    case 'numeric':
      inputType = 'number';
      break;
    case 'int2':
      inputType = 'integer2';
      break;
    case 'int4':
      inputType = 'integer4';
      break;
    case 'int8':
      inputType = 'integer8';
      break;
    case 'boolean':
      inputType = 'boolean';
      break;
    case 'markdown':
    case 'longtext':
      inputType = 'longtext';
      break;
    case 'json':
    case 'jsonb':
      inputType = 'json';
      break;
    case 'color_rgb_hex':
      inputType = 'color';
      break;
    case 'shorttext':
    default:
      inputType = type.baseType ? getInputType(type.baseType) : 'text';
      break;
  }

  return inputType;
}

/**
 * given a typename string, will return a more human readable version of it.
 */
export function getSimpleColumnType(typename: string): string {
  switch (typename) {
    case 'timestamp':
      return 'timestamp';
    case 'timestamptz':
      return 'timestamp with timezone';
    case 'date':
      return 'date';
    case 'float4':
    case 'float8':
    case 'numeric':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'int2':
    case 'int4':
    case 'int8':
      return 'integer';
    default:
      return 'text';
  }
}

/**
 * return whether the input is disabled or not
 *   NOTE: this will always return a boolean even if column.inputDisabled is an object
 * @param column the column object from ermrestJS
 */
export function isDisabled(column: any): boolean {
  return column.inputDisabled ? true : false;
}

/**
 * Return `disabled` if,
 *  - columnModel is marked as disabled
 *  - based on dynamic ACLs the column cannot be updated (based on canUpdateValues)
 *  - TODO show all
 * @param formNumber
 * @param columnModel
 * @param canUpdateValues
 * @returns
 */
export function getInputTypeOrDisabled(formNumber: number, columnModel: RecordeditColumnModel, canUpdateValues: any): string {
  const valName = `${formNumber}-${columnModel.column.name}`;

  if (columnModel.isDisabled || (canUpdateValues && valName in canUpdateValues && canUpdateValues[valName] === false)) {
    // TODO: if columnModel.showSelectAll, disable input
    return 'disabled';
  }
  return columnModel.inputType;
}

/**
 * return the disabled input value based on input type
 * @param column the column object from ermrestJS
 */
export function getDisabledInputValue(column: any) {
  // inputDisabled might be an object with a message so avoid using above `isDisabled` function
  const disabled = column.inputDisabled;
  if (disabled) {
    if (typeof disabled === 'object') return disabled.message;
    return '';
  } else if (column.isForeignKey) {
    return 'Select a value';
  } else if (column.isAsset) {
    return 'No file Selected';
  }
}

export function formatDatetime(value: string, options: TimestampOptions) {
  if (value) {
    // create a moment object (value should be string format)
    const momentObj = options.currentMomentFormat ? windowRef.moment(value, options.currentMomentFormat) : windowRef.moment(value);
    return {
      date: momentObj.format(dataFormats.date),
      time: momentObj.format(dataFormats.time24),
      datetime: momentObj.format(options.outputMomentFormat)
    };
  }

  return null;
}


export const ERROR_MESSAGES = {
  REQUIRED: 'Please enter a value for this field.',
  INVALID_INTEGER: 'Please enter a valid integer value.',
  INVALID_NUMERIC: 'Please enter a valid decimal value.',
  INVALID_DATE: 'Please enter a valid date value.',
  INVALID_TIMESTAMP: 'Please enter a valid date and time value.',
  INVALID_JSON: 'Please enter a valid JSON value.'
}

export function formatInt(value: string) {
  const intVal = parseInt(value, 10);
  return !isNaN(intVal) ? intVal : null;
}

export function formatFloat(value: string) {
  const floatVal = parseFloat(value);
  return !isNaN(floatVal) ? floatVal : null;
}

/**
 * given the column and a valid, return the displayed value.
 * checks for preformat config before returning true/falsew
 */
export function formatBoolean(column: any, value: any) {
  return column.formatvalue(value);
}

/**
 * If the value is not null or undefined, return it. otherwise return the alt.
 */
export function replaceNullOrUndefined(val: any, alt: any) {
  return (val === null || val === undefined) ? alt : val;
}

export function arrayFieldPlaceholder(baseType: string) {
  let placeholder;
  switch (baseType) {
    case 'timestamptz':
      placeholder = 'example: [ \"2001-01-01T01:01:01-08:00\", \"2002-02-02T02:02:02-08:00\" ]'
    case 'timestamp':
      placeholder = 'example: [ \"2001-01-01T01:01:01\", \"2002-02-02T02:02:02\" ]'
      break;
    case 'date':
      placeholder = 'example: [ \"2001-01-01\", \"2001-02-02\" ]'
      break;
    case 'numeric':
    case 'float4':
    case 'float8':
      placeholder = 'example: [ 1, 2.2 ]'
      break;
    case 'int2':
    case 'int4':
    case 'int8':
      placeholder = 'example: [ 1, 2 ]'
      break;
    case 'boolean':
      placeholder = 'example: [ true, false ]'
      break;
    default:
      placeholder = 'example: [ \"value1\", \"value2\" ]'
      break;
  }

  return placeholder;
}

export function humanFileSize(size: number) {
  const i = Math.floor( Math.log(size) / Math.log(1024) );
  return Number(( size / Math.pow(1024, i) ).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}
