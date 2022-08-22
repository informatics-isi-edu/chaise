import StorageService from '@isrd-isi-edu/chaise/src/utils/storage';

export class AuthnStorageService {
  static LOCAL_STORAGE_KEY = 'session'; // name of object session information is stored under
  static PROMPT_EXPIRATION_KEY = 'promptExpiration'; // name of key for prompt expiration value

  /**
   * Functions that interact with the StorageService tokens
   * There are 3 keys stored under the LOCAL_STORAGE_KEY object, PROMPT_EXPIRATION_KEY, PREVIOUS_SESSION_KEY
   */

  // returns data stored in loacal storage for `keyName`
  private static _getKeyFromStorage = (keyName: string) => {
    return StorageService.getStorage(AuthnStorageService.LOCAL_STORAGE_KEY)[keyName];
  };

  // creates an expiration token with `keyName`
  private static _createToken = (keyName: string) => {
    const data = {} as any;
    const hourFromNow = new Date();
    hourFromNow.setHours(hourFromNow.getHours() + 1);

    data[keyName] = hourFromNow.getTime();

    StorageService.updateStorage(AuthnStorageService.LOCAL_STORAGE_KEY, data);
  };

  // extends the expiration token with `keyName` if it hasn't expired
  private static _extendToken = (keyName: string) => {
    if (this.keyExistsInStorage(keyName) && !this.expiredToken(keyName)) {
      this._createToken(keyName);
    }
  };

  /*** Public Functions ***/

  // checks if the expiration token with `keyName` has expired
  static expiredToken = (keyName: string) => {
    const sessionStorage = StorageService.getStorage(this.LOCAL_STORAGE_KEY);

    return (sessionStorage && new Date().getTime() > sessionStorage[keyName]);
  };

  // verifies value exists for `keyName`
  static keyExistsInStorage = (keyName: string) => {
    const sessionStorage = StorageService.getStorage(this.LOCAL_STORAGE_KEY);

    return (sessionStorage && sessionStorage[keyName]);
  };

  // create value in storage with `keyName` and `value`
  static setKeyInStorage = (keyName: string, value: string | boolean) => {
    const data = {} as any;

    data[keyName] = value;

    StorageService.updateStorage(this.LOCAL_STORAGE_KEY, data);
  };

  // removes the key/value pair at `keyName`
  static removeKeyFromStorage = (keyName: string) => {
    if (this.keyExistsInStorage(keyName)) {
      StorageService.deleteStorageValue(this.LOCAL_STORAGE_KEY, keyName);
    }
  };

  static createPromptExpirationToken = () => {
    this._createToken(this.PROMPT_EXPIRATION_KEY);
  }

  static extendPromptExpirationToken = () => {
    this._extendToken(this.PROMPT_EXPIRATION_KEY);
  }
}