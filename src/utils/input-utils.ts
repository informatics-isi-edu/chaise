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
 * return whether the input is disabled or not
 *   NOTE: this will always return a boolean even if column.inputDisabled is an object
 * @param column the column object from ermrestJS
 */
export function isDisabled(column: any): boolean {
  return column.inputDisabled ? true : false;
}

export function getInputTypeOrDisabled(columnModel: RecordeditColumnModel): string {
  if (columnModel.isDisabled) {
    // TODO: if columnModel.showSelectAll, disable input
    // TODO: create column models, no column model, enable!
    // TODO: is editMode and user cannot update this row, disable
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

/**
 * Map type to default heights for different inputs (currently for recordedit)
 */
export const DEFAULT_HEGHT_MAP: any = {
  'number': 47,
  'date': 47,
  'timestamp': 82,
  'text': 47 ,
  'timestamptz': 82,
  'float4': 47,
  'float8': 47,
  'numeric': 47,
  'integer2': 47,
  'integer4': 47,
  'integer8': 47,
  'boolean': 47,
  'markdown': 47,
  'longtext': 47,
  'json': 47,
  'color': 47,
  'shorttext': 47,
  'disabled': 47
}

export const ERROR_MESSAGES = {
  REQUIRED: 'Please enter a value for this field.',
  INVALID_INTEGER: 'Please enter a valid integer value.',
  INVALID_NUMERIC: 'Please enter a valid decimal value.',
  INVALID_DATE: 'Please enter a valid date value.',
  INVALID_TIMESTAMP: 'Please enter a valid date and time value.'
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
