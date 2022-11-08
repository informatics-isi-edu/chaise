const DEFAULT_COOKIE_PATH = '/';

export class CookieService {

  /**
   * Add a cookie.
   * @param name name of the cookie
   * @param value value of the cookie
   * @param expireDate the expireation date
   * @param path Indicates a URL path, defaults to '/'
   * @param domain domain/host of the cookie
   */
  static setCookie(name: string, value: string | object, expireDate: Date, path = DEFAULT_COOKIE_PATH, domain?: string): void {
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    document.cookie =
      `${name}=${value};expires=${expireDate.toUTCString()}` +
      (path ? ';path=' + path : '') +
      (domain ? ';domain=' + domain : '');
  }

  /**
   * Delete the given cookie based on its name.
   * If matching cookie doesn't exists, it will return false.
   * @param name name of the cookie
   * @param path Indicates a URL path, defaults to '/'
   * @param domain domain/host of the cookie
   * @returns {boolean} true if the cookie got deleted, false if cookie didn't exist
   */
  static deleteCookie(name: string, path = DEFAULT_COOKIE_PATH, domain?: string): boolean {
    if (this.checkIfCookieExists(name)) {
      document.cookie =
        `${name}=` +
        (path ? ';path=' + path : '') +
        (domain ? ';domain=' + domain : '') +
        ';expires=Thu, 01 Jan 1970 00:00:01 GMT';

      return true;
    }
    return false;
  }

  /**
   * cookie helper function to check its existence
   * @param name name of the cookie
   * @returns {boolean} return true if exists, else false
   */
  static checkIfCookieExists(name: string): boolean {
    return document.cookie.split(';').some((c) => {
      return c.trim().startsWith(name + '=');
    });
  }

  /**
   * Returns cookie list
   * @returns {string[]} list of cookies
   */
  static getAllCookies(): string[] {
    return document.cookie.split(';');
  }
}
