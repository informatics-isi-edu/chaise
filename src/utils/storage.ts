export default class LocalStorage {
  static localStorageNotAvailable = false;

  static localStorage: any = null;

  // TODO: figure out how to initialize this
  constructor() {
    // a simple test to ensure localStorage is available
    // (in some cases localStorage might be null)
    try {
      const test = 'test';
      localStorage = window.localStorage;
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
    } catch (e: unknown) {
      // $log.warn(messageMap.localStorageDisabled);
      console.log('local storage disabled');
      LocalStorage.localStorageNotAvailable = true;
    }
  }

  /**
   * Deletes all the data in local storage defined under `storageLocation`
   *
   * @param {String} storageLocation - name of object data is stored under
   */
  static deleteStorageNamespace = function (storageLocation: string) {
    if (LocalStorage.localStorageNotAvailable) return;

    localStorage.removeItem(storageLocation);
  };

  /**
   * Deletes the data in local storage defined under `storageLocation` with `keyName`
   *
   * @param {String} storageLocation - name of object data is stored under
   * @param {String} keyName - key name of the data to be deleted
   */
  static deleteStorageValue = function (storageLocation: string, keyName: string) {
    if (LocalStorage.localStorageNotAvailable) return;

    const value = LocalStorage.getStorage(storageLocation);

    delete value[keyName];
    LocalStorage.setStorage(storageLocation, value);
  };

  /**
   * Stores data in local storage under `storageLocation`
   *
   * @param {String} storageLocation - name of object data is stored under
   * @param {Object} data - data to be stored
   */
  static setStorage = function (storageLocation: string, data: object) {
    if (LocalStorage.localStorageNotAvailable) return;

    localStorage.setItem(storageLocation, JSON.stringify(data));
  };

  /**
   * Gets the data in local storage defined under `storageLocation`
   *
   * @param {String} storageLocation - name of object data is stored under
   */
  static getStorage = function (storageLocation: string) {
    if (LocalStorage.localStorageNotAvailable) return null;

    const value = localStorage.getItem(storageLocation);
    return value ? JSON.parse(value) : null;
  };

  /**
   * Updates the data in local storage under `storageLocation`
   *
   * @param {Object} data - data to be updated
   * @param {String} storageLocation - name of object data is stored under
   */
  static updateStorage = function (storageLocation: string, data: any) {
    if (LocalStorage.localStorageNotAvailable) return;

    const storedData = LocalStorage.getStorage(storageLocation) || {} as any;

    Object.keys(data).forEach((key) => {
      storedData[key] = data[key];
    });

    LocalStorage.setStorage(storageLocation, storedData);
  };

  static isAvailable = (LocalStorage.localStorageNotAvailable === false);
}
