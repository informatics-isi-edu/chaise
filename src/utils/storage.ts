import $log from '@isrd-isi-edu/chaise/src/services/logger';

export default class LocalStorage {
  static localStorageNotAvailable = (() => {
    try {
      const test = '__chaise_storage_probe__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return false;
    } catch {
      $log.warn('localStorage is not available');
      return true;
    }
  })();

  static localStorage: any = null;

  /**
   * Deletes all the data in local storage defined under `storageLocation`
   *
   * @param storageLocation - name of object data is stored under
   * @returns true if the operation succeeded
   */
  static deleteStorageNamespace = function (storageLocation: string): boolean {
    if (LocalStorage.localStorageNotAvailable) return false;

    try {
      localStorage.removeItem(storageLocation);
      return true;
    } catch (e) {
      $log.warn(`failed to remove localStorage key "${storageLocation}"`, e);
      return false;
    }
  };

  /**
   * Deletes the data in local storage defined under `storageLocation` with `keyName`
   *
   * @param storageLocation - name of object data is stored under
   * @param keyName - key name of the data to be deleted
   * @returns true if the operation succeeded
   */
  static deleteStorageValue = function (storageLocation: string, keyName: string): boolean {
    if (LocalStorage.localStorageNotAvailable) return false;

    const value = LocalStorage.getStorage(storageLocation);
    if (!value) return false;

    delete value[keyName];
    return LocalStorage.setStorage(storageLocation, value);
  };

  /**
   * Stores data in local storage under `storageLocation`
   *
   * @param storageLocation - name of object data is stored under
   * @param data - data to be stored
   * @returns true if the operation succeeded
   */
  static setStorage = function (storageLocation: string, data: object): boolean {
    if (LocalStorage.localStorageNotAvailable) return false;

    try {
      localStorage.setItem(storageLocation, JSON.stringify(data));
      return true;
    } catch (e) {
      $log.warn(`failed to write localStorage key "${storageLocation}"`, e);
      return false;
    }
  };

  /**
   * Gets the data in local storage defined under `storageLocation`
   *
   * @param storageLocation - name of object data is stored under
   */
  static getStorage = function (storageLocation: string) {
    if (LocalStorage.localStorageNotAvailable) return null;

    const value = localStorage.getItem(storageLocation);
    try {
      return value ? JSON.parse(value) : null;
    } catch (e) {
      $log.debug(`Error parsing localStorage item "${storageLocation}"`, e);
      return null;
    }
  };

  /**
   * Updates the data in local storage under `storageLocation`
   *
   * @param storageLocation - name of object data is stored under
   * @param data - data to be merged into the existing entry
   * @returns true if the operation succeeded
   */
  static updateStorage = function (storageLocation: string, data: any): boolean {
    if (LocalStorage.localStorageNotAvailable) return false;

    const storedData = LocalStorage.getStorage(storageLocation) || {} as any;

    Object.keys(data).forEach((key) => {
      storedData[key] = data[key];
    });

    return LocalStorage.setStorage(storageLocation, storedData);
  };

  /**
   * Returns all localStorage keys that start with the given prefix.
   * Use this instead of touching `window.localStorage` directly so callers
   * stay isolated from the storage availability check.
   *
   * @param prefix - the key prefix to match
   */
  static getKeysWithPrefix = function (prefix: string): string[] {
    if (LocalStorage.localStorageNotAvailable) return [];

    const keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) keys.push(key);
      }
    } catch (e) {
      $log.warn('failed to iterate localStorage keys', e);
    }
    return keys;
  };
}
