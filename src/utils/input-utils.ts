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
      inputType = 'markdown';
      break;
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

export function formatDatetime(value: any, options: TimestampOptions) {
  if (value) {
    let momentObj;
    if (typeof value === 'string') {
      // create a moment object (value should be string format)
      momentObj = options.currentMomentFormat ? windowRef.moment(value, options.currentMomentFormat) : windowRef.moment(value);
    } else {
      momentObj = value;
    }

    return {
      date: momentObj.format(dataFormats.date),
      time: momentObj.format(dataFormats.time24),
      datetime: momentObj.format(options.outputMomentFormat)
    };
  }

  return null;
}

export const INTEGER_LIMITS = {
  INT_2_MIN: '-32768',
  INT_2_MAX: '32767',
  INT_4_MIN: '-2147483648',
  INT_4_MAX: '2147483647',
  INT_8_MIN: '-9223372036854775808',
  INT_8_MAX: '9223372036854775807'
}

export const ERROR_MESSAGES = {
  REQUIRED: 'Please enter a value for this field.',
  INTEGER_2_MIN: 'This field requires a value greater than ' + INTEGER_LIMITS.INT_2_MIN + '.',
  INTEGER_4_MIN: 'This field requires a value greater than ' + INTEGER_LIMITS.INT_4_MIN + '.',
  INTEGER_8_MIN: 'This field requires a value greater than ' + INTEGER_LIMITS.INT_8_MIN + '.',
  INTEGER_2_MAX: 'This field requires a value less than ' + INTEGER_LIMITS.INT_2_MAX + '.',
  INTEGER_4_MAX: 'This field requires a value less than ' + INTEGER_LIMITS.INT_4_MAX + '.',
  INTEGER_8_MAX: 'This field requires a value less than ' + INTEGER_LIMITS.INT_8_MAX + '.',
  INVALID_INTEGER: 'Please enter a valid integer value.',
  INVALID_NUMERIC: 'Please enter a valid decimal value.',
  INVALID_DATE: `Please enter a valid date value in ${dataFormats.placeholder.date} format.`,
  INVALID_TIME: `Please enter a valid time value in 24-hr ${dataFormats.placeholder.time} format.`,
  INVALID_TIMESTAMP: 'Please enter a valid date and time value.',
  INVALID_COLOR: 'Please enter a valid color value.',
  INVALID_JSON: 'Please enter a valid JSON value.',
  INVALID_BOOLEAN: 'Please enter a valid boolean value.'
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
      placeholder = ['2001-01-01T01:01:01-08:00', '2002-02-02T02:02:02-08:00']
    case 'timestamp':
      placeholder = ['2001-01-01T01:01:01', '2002-02-02T02:02:02']
      break;
    case 'date':
      placeholder = ['2001-01-01', '2001-02-02']
      break;
    case 'numeric':
    case 'float4':
    case 'float8':
      placeholder = [1, 2.2]
      break;
    case 'int2':
    case 'int4':
    case 'int8':
      placeholder = [1, 2]
      break;
    case 'boolean':
      placeholder = [true, false]
      break;
    default:
      placeholder = ['value1', 'value2']
      break;
  }

  return placeholder;
}

export function humanFileSize(size: number) {
  // Math.log(0) is -Infinity
  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return Number((size / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

const integer2FieldValidation = (value: string) => {
  if (!value) return;
  let isValid = true;
  // test regex first
  isValid = dataFormats.regexp.integer.test(value);
  if (!isValid) return ERROR_MESSAGES.INVALID_INTEGER;

  // test min/max
  isValid = parseInt(value, 10) >= parseInt(INTEGER_LIMITS.INT_2_MIN, 10);
  if (!isValid) return ERROR_MESSAGES.INTEGER_2_MIN;

  return parseInt(value, 10) <= parseInt(INTEGER_LIMITS.INT_2_MAX, 10) || ERROR_MESSAGES.INTEGER_2_MAX;
}

const integer4FieldValidation = (value: string) => {
  if (!value) return;
  let isValid = true;
  // test regex first
  isValid = dataFormats.regexp.integer.test(value);
  if (!isValid) return ERROR_MESSAGES.INVALID_INTEGER;

  // test min/max
  isValid = parseInt(value, 10) >= parseInt(INTEGER_LIMITS.INT_4_MIN, 10);
  if (!isValid) return ERROR_MESSAGES.INTEGER_4_MIN;

  return parseInt(value, 10) <= parseInt(INTEGER_LIMITS.INT_4_MAX, 10) || ERROR_MESSAGES.INTEGER_4_MAX;
}

const integer8FieldValidation = (value: string) => {
  if (!value) return;
  let isValid = true;
  // test regex first
  isValid = dataFormats.regexp.integer.test(value);
  if (!isValid) return ERROR_MESSAGES.INVALID_INTEGER;

  // test min/max
  isValid = parseInt(value, 10) >= parseInt(INTEGER_LIMITS.INT_8_MIN, 10);
  if (!isValid) return ERROR_MESSAGES.INTEGER_8_MIN;

  return parseInt(value, 10) <= parseInt(INTEGER_LIMITS.INT_8_MAX, 10) || ERROR_MESSAGES.INTEGER_8_MAX;
}

const integerFieldValidation = {
  value: dataFormats.regexp.integer,
  message: ERROR_MESSAGES.INVALID_INTEGER
};

const numericFieldValidation = {
  value: dataFormats.regexp.float,
  message: ERROR_MESSAGES.INVALID_NUMERIC
};

const dateFieldValidation = (value: string) => {
  if (!value) return;
  const date = windowRef.moment(value, dataFormats.date, true);
  return date.isValid() || ERROR_MESSAGES.INVALID_DATE;
};

const timeFieldValidation = (value: string) => {
  if (!value) return;
  const date = windowRef.moment(value, dataFormats.time, true);
  return date.isValid() || ERROR_MESSAGES.INVALID_TIME;
};

const timestampFieldValidation = (value: string) => {
  if (!value) return;
  const timestamp = windowRef.moment(value, dataFormats.timestamp, true);
  return timestamp.isValid() || ERROR_MESSAGES.INVALID_TIMESTAMP;
};

const timestamptzFieldValidation = (value: string) => {
  if (!value) return;
  const timestamp = windowRef.moment(value, dataFormats.datetime.return, true);
  return timestamp.isValid() || ERROR_MESSAGES.INVALID_TIMESTAMP;
};

const colorFieldValidation = (value: string) => {
  if (!value) return;
  return (/#[0-9a-fA-F]{6}$/i.test(value)) || ERROR_MESSAGES.INVALID_COLOR;
}

export const VALIDATE_VALUE_BY_TYPE: {
  [key: string]: any;
} = {
  'int': integerFieldValidation,
  'integer2': integer2FieldValidation,
  'integer4': integer4FieldValidation,
  'integer8': integer8FieldValidation,
  'float': numericFieldValidation,
  'number': numericFieldValidation,
  'date': dateFieldValidation,
  'time': timeFieldValidation,
  'timestamp': timestampFieldValidation,
  'timestamptz': timestamptzFieldValidation,
  'color': colorFieldValidation,
};
/**
 * Function to check if there is scrollbar for textarea
 */
export const hasVerticalScrollbar = (element: any) => {
  if (!element) return;
  return element.scrollHeight > element.clientHeight;
};
