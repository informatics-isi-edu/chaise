
/**
 * Return true if the input is string, otherwise false.
 * @param inp
 * @returns
 */
export function isStringAndNotEmpty(inp: any): boolean {
  return typeof inp === 'string' && inp.length > 0;
}

/**
 * Verifies that the object is defined and the containing key/value pair is a non-empty string
 */
export function isObjectAndKeyDefined(obj: any, keyName: string): boolean {
  return (obj && typeof obj[keyName] === 'string' && obj[keyName] !== '');
}

export function isNonEmptyObject(obj: any): boolean {
  return typeof obj === 'object' && obj !== null && Object.keys(obj).length > 0;
}

/**
 * Verifies that the object is not null and is defined.
 */
export function isObjectAndNotNull(obj: any): boolean {
  return typeof obj === 'object' && obj !== null;
}

/**
 * Verifies that the given data is integer
 * @param  {Object}  data
 * @return {Boolean} whether it is integer or not
 */
export function isInteger(data: any): boolean {
  return (typeof data === 'number') && (data % 1 === 0);
}


/**
 * https://stackoverflow.com/questions/37688318/typescript-interface-possible-to-make-one-or-the-other-properties-required#comment123219068_66605669
 */
type Only<T, U> = { [P in keyof T]: T[P] } & Omit<{ [P in keyof U]?: never }, keyof T>

/**
 * use this when you want to create a union of different custom types
 *
 * For example:
 *
 * type Type1 = { name: string };
 * type Type2 = { id: string };
 *
 * type MainType = Either<Type1, Type2>
 */
export type Either<T, U> = Only<T, U> | Only<U, T>;
