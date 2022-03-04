export default class MathUtils {
  static getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  };

  /**
   * Generates a unique uuid
   * @returns {String} a string of length 24
   */
  static uuid = (): string => {
    const s4 = MathUtils.uuidS4;
    return s4() + s4() + s4() + s4() + s4() + s4();
  };

  /**
   * @returns a random string of a deterministic length of 4
   * @private
   */
  private static uuidS4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(36);
  }
}
