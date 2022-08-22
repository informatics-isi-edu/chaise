/**
 * Generate random number between min and max range
 * @param min minimum number
 * @param max maximum number
 * @returns {number} random number generated
 */
export function generateRandomInteger(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Generates a unique uuid
 * @returns {String} a string of length 24
 */
export function generateUUID(): string {
  return uuidS4() + uuidS4() + uuidS4() + uuidS4() + uuidS4() + uuidS4();
}

/**
 * @returns a random string of a deterministic length of 4
 * @private
 */
function uuidS4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(36);
}

/**
 *
 * @param min minimum number
 * @param max maximum number
 * @returns random number generated
 */
export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
