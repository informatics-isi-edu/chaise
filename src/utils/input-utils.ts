/**
 * Utility functions related to inputs
 */

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