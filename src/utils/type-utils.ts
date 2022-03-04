export default class TypeUtils {
  /**
   * Return true if the input is string, otherwise false.
   * @param inp
   * @returns
   */
  static isStringAndNotEmpty(inp: any): boolean {
    return typeof inp === 'string' && inp.length > 0;
  }

  /**
   * Verifies that the object is defined and the containing key/value pair is a non-empty string
   */
  static isObjectAndKeyDefined(obj: any, keyName: string): boolean {
    return (obj && typeof obj[keyName] === 'string' && obj[keyName] !== '');
  }

  static isNonEmptyObject(obj: any): boolean {
    return typeof obj === 'object' && obj !== null && Object.keys(obj).length > 0;
  }

  /**
   * Verifies that the object is not null and is defined.
   */
  static isObjectAndNotNull(obj: any): boolean {
    return typeof obj === 'object' && obj !== null;
  }

  /**
   * Verifies that the given data is integer
   * @param  {Object}  data
   * @return {Boolean} whether it is integer or not
   */
  static isInteger(data: any): boolean {
    return (typeof data === 'number') && (data % 1 === 0);
  }
}
