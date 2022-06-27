const DEFAULT_COOKIE_PATH = '/';

export class CookieService {
  /**
   * Delete cookie helper function. Skip if matching cookie doesn't exists, it returns false
   * @param name name of the cookie
   * @param path Indicates a URL path, defaults to '/'
   * @param domain domain/host of the cookie
   * @returns {boolean} deletes cookie with matching name parameter and returns true or false
   */
  static deleteCookie(name: string, path = DEFAULT_COOKIE_PATH, domain?: string) {
    if (this.checkIfCookieExists(name)) {
      document.cookie =
        name +
        '=' +
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
  static checkIfCookieExists(name: string) {
    return document.cookie.split(';').some((c) => {
      return c.trim().startsWith(name + '=');
    });
  }

  /**
   * Returns cookie list
   * @returns {array} list of cookies
   */
  static getAllCookies() {
    return document.cookie.split(';');
  }

  /**
   *
   * @param cookie accpets cookie in format of <cookieName>=<value>
   * @returns {string} cookie name
   */
  static getCookieName(cookie: string) {
    return cookie.split('=')[0].trim();
  }
}
