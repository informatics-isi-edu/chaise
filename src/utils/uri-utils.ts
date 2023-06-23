/**
 * Utility functions that parse the URL or manipulate it
 */

import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { BUILD_VARIABLES, HELP_PAGES, URL_PATH_LENGTH_LIMIT } from '@isrd-isi-edu/chaise/src/utils/constants';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

/**
* @function
* @param {String} str string to be encoded.
* @desc
* converts a string to an URI encoded string
*/
export function fixedEncodeURIComponent(str: string) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c: string) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
* @function
* @param {Object} location - location Object from the $window resource
* @param {boolean} returnObject - Whether we should just return the url
*  or an object with all the different attributes
* @desc
* Converts a chaise URI to an ermrest resource URI object or string.
* @returns {Object}
* an object with the following attributes:
*  - 'ermrestURI': the uri that should be used for communicating with ermrestjs
*  - `isQueryParameter`: whether the hash was written using ? (not #)
*  - `ppid`, 'pcid', `paction`: parent context
*  - `queryParams`: an object containing query parameters of the url.
*                   The keys are query params names, and value either a
*                   string value or an array containing multiple strings.
* @throws {MalformedUriError} if table or catalog data are missing.
*/
export function chaiseURItoErmrestURI(location: Location, dontDecodeQueryParams?: boolean): {
  ermrestUri: string,
  catalogId: string,
  hash: string,
  ppid: string,
  pcid: string,
  paction: string,
  queryParamsString: string,
  queryParams: {
    [key: string]: string
  },
  isQueryParameter: boolean
} {
  const tableMissing = MESSAGE_MAP.tableMissing,
    catalogMissing = MESSAGE_MAP.catalogMissing,
    chaiseConfig = ConfigService.chaiseConfig;

  let hash = location.hash,
    isQueryParameter = false;

  // allow ? to be used in place of #
  if (!hash && location.href.indexOf('?') !== -1) {
    hash = `#${location.href.substring(location.href.indexOf('?') + 1)}`;
    isQueryParameter = true;
  }
  // capture the hash before it's split for use in ermrestURI generation
  const originalHash = hash;

  // eslint-disable-next-line prefer-const
  let queryParams: any = {},
    queryParamsString = '',
    catalogId,
    ppid = '',
    pcid = '',
    paction = '';

  // remove query params other than limit
  if (hash && hash.indexOf('?') !== -1) {
    queryParamsString = hash.match(/\?(.+)/)![1];
    const queries = queryParamsString.split('&'); // get the query params
    const acceptedQueries = [];
    let i,
      qParts,
      qKey,
      qVal;

    hash = hash.slice(0, hash.indexOf('?'));

    // remove queries add back only the valid queries
    // "valid queries" are ones that the ermrest APIs allow in the uri (like limit)
    for (i = 0; i < queries.length; i++) {
      qParts = queries[i].split('=');
      if (qParts.length !== 2) continue;

      if (dontDecodeQueryParams) {
        qKey = qParts[0]; qVal = qParts[1];
      } else {
        qKey = decodeURIComponent(qParts[0]); qVal = decodeURIComponent(qParts[1]);
      }

      // capture the special values
      // eslint-disable-next-line default-case
      switch (qKey) {
        case 'limit':
          acceptedQueries.push(queries[i]);
          break;
        case 'pcid':
          pcid = qVal;
          break;
        case 'ppid':
          ppid = qVal;
          break;
        case 'paction':
          paction = qVal;
          break;
      }

      // save the query param
      if (qKey in queryParams) {
        if (!Array.isArray(queryParams[qKey])) {
          queryParams[qKey] = [queryParams[qKey]];
        }
        queryParams[qKey].push(qVal);
      } else {
        queryParams[qKey] = qVal;
      }
    }
    if (acceptedQueries.length !== 0) {
      hash = `${hash}?${acceptedQueries.join('&')}`;
    }
  }

  // If the hash is empty, check for defaults
  if (!hash || hash.length === 1) {
    if (chaiseConfig.defaultCatalog) {
      if (chaiseConfig.defaultTable) {
        catalogId = chaiseConfig.defaultCatalog;

        const tableConfig = chaiseConfig.defaultTable
        if (tableConfig) {
          hash = `/${fixedEncodeURIComponent(tableConfig.schema)}:${fixedEncodeURIComponent(tableConfig.table)}`;
        } else {
          // no defined or default schema:table for catalogId
          throw new ConfigService.ERMrest.MalformedURIError(tableMissing);
        }
      } else {
        // no defined or default schema:table
        throw new ConfigService.ERMrest.MalformedURIError(tableMissing);
      }
    } else {
      // no defined or default catalog
      throw new ConfigService.ERMrest.MalformedURIError(catalogMissing);
    }
  } else {
    // pull off the catalog ID
    // location.hash in the form of '#<catalog-id>/<schema-name>:<table-name>/<filters>'
    catalogId = hash.substring(1).split('/')[0];

    // if no catalog id for some reason
    if (catalogId === '' || catalogId === undefined || catalogId === null) {
      if (chaiseConfig.defaultCatalog) {
        catalogId = chaiseConfig.defaultCatalog;
      } else {
        // no defined or default catalog
        throw new ConfigService.ERMrest.MalformedURIError(catalogMissing);
      }
    }

    // there is no '/' character (only a catalog id) or a trailing '/' after the id
    if (hash.indexOf('/') === -1 || hash.substring(hash.indexOf('/')).length === 1) {
      /**
       * if the hash was actually just query parameter, don't even attempt the default logic
       *
       * this function is used in every react app as part of config.ts. in some cases (like help app),
       * the url doesn't have any hash fragment and has only query parameter. therefore we should
       * throw an error here since the combination of chaise-config properties might accidently
       * cause side effects.
       */
      if (isQueryParameter) {
        throw new ConfigService.ERMrest.MalformedURIError(catalogMissing);
      }

      // check for default Table
      if (chaiseConfig.defaultTable) {
        const tableConfig = chaiseConfig.defaultTable;
        if (tableConfig) {
          hash = `/${fixedEncodeURIComponent(tableConfig.schema)}:${fixedEncodeURIComponent(tableConfig.table)}`;
        } else {
          // no defined or default schema:table for catalogId
          throw new ConfigService.ERMrest.MalformedURIError(tableMissing);
        }
      } else {
        // no defined or default schema:table
        throw new ConfigService.ERMrest.MalformedURIError(tableMissing);
      }
    } else {
      // grab the end of the hash from: '.../<schema-name>...'
      hash = hash.substring(hash.indexOf('/'));
    }
  }

  const baseUri = ConfigService.ERMrestLocation;
  const path = `/catalog/${catalogId}/entity${hash}`;

  return {
    ermrestUri: baseUri + path,
    catalogId,
    hash: originalHash,
    ppid,
    pcid,
    paction,
    queryParamsString,
    queryParams,
    isQueryParameter,
  };
}

export function getCatalogId() {
  let catalogId = '';
  try {
    catalogId += chaiseURItoErmrestURI(windowRef.location).catalogId;
  } catch (err) {
    const cc = ConfigService.chaiseConfig;
    if (cc.defaultCatalog) catalogId += cc.defaultCatalog;
  }

  return catalogId;
}

/**
 * Takes any string, finds the '?' character, and splits all content after '?' assuming they are in the form of key=value&key2=value&...
 * @param queryString
 * @returns
 */
export function queryStringToJSON(queryString: string): any {
  queryString = queryString || windowRef.location.search;
  if (queryString.indexOf('?') > -1) {
    queryString = queryString.split('?')[1];
  }
  const pairs = queryString.split('&');
  const result: any = {};
  pairs.forEach((pair) => {
    const pairArr = pair.split('=');
    result[pairArr[0]] = decodeURIComponent(pairArr[1] || '');
  });
  return result;
}

/**
* Takes pathname attribute of window.location object and returns app name
* path should be a string literal which appears before #catalog id in URL (/chaise/recordset/)
* if the path ends with /folder/file.html it will return the folder.
* (any other pattern will just return anything after last `/`)
*/
export function appNamefromUrlPathname(path: string): string {
  const newPath = path.slice(0, -1);
  const lastSlash = newPath.lastIndexOf('/');
  const name = newPath.substring(lastSlash + 1, newPath.length);
  if (name.endsWith('.htm')) {
    return appNamefromUrlPathname(`${newPath.substring(0, lastSlash)}/`);
  }
  return name;
}

/**
 * Takes path and creates full redirect links with catalogId
 * @param path
 * @returns
 */
export function createRedirectLinkFromPath(path: string): string {
  return `${windowRef.location.origin + windowRef.location.pathname}#${chaiseURItoErmrestURI(windowRef.location, true).catalogId}/${path}`;
}

/**
* Returns the chaise base url without the trailing slash
* @return {String}
*/
export function chaiseBaseURL(): string {
  const res = windowRef.location.origin + BUILD_VARIABLES.CHAISE_BASE_PATH;
  if (res.endsWith('/')) {
    return res.slice(0, -1);
  }
  return res;
}

/**
* The following cases need to be handled for the resolverImplicitCatalog value:
*  - if resolverImplicitCatalog === null:         use current chaise path (without the version if one is present)
*  - if resolverImplicitCatalog === currCatalog:  /id/RID
*  - otherwise:                                   /id/currCatalog/RID
* @param {ERMrest.Tuple} tuple - the `ermrestJS` tuple object returned from the page object when data is read
* @param {ERMrest.Reference} reference - the `ermrestJS` reference object associated with this current page
* @param {String} version - the encoded version string prepended with the '@' character
* */
export function resolvePermalink(tuple: any, reference: any, version?: string) {
  const chaiseConfig = ConfigService.chaiseConfig;
  const resolverId = chaiseConfig.resolverImplicitCatalog;
  const currCatalog = reference.location.catalogId;

  // null or no RID
  if (resolverId === null || !tuple.data || !tuple.data.RID) {
    let url = tuple.reference.contextualize.detailed.appLink;
    // remove query parameters
    const lastIndex = url.lastIndexOf('?') > 0 ? url.lastIndexOf('?') : url.length;
    url = url.substring(0, lastIndex);

    // location.catalog will be in the form of `<id>` or `<id>@<version>`
    return url.replace(`#${reference.location.catalog}`, `#${currCatalog}${version || ''}`);
  }

  // if it's a number (isNaN tries to parse to integer before checking) and is the same as current catalog
  // currCatalog is a string,that's why we have to do == check not ===
  // eslint-disable-next-line eqeqeq
  if (!Number.isNaN(resolverId) && resolverId == currCatalog) {
    return `${windowRef.location.origin}/id/${tuple.data.RID}${version || ''}`;
  }

  // if resolverId is false or undefined OR any other values that are not allowed use the default
  // default is to show the fully qualified resolveable link for permalink
  return `${windowRef.location.origin}/id/${currCatalog}/${tuple.data.RID}${version || ''}`;
}

/**
 * if '?' is used instead of '#' (?catalog/schema:table), return in the proper form (#catalog/schema:table)
 * @param location
 */
export function getURLHashFragment(location: Location) {
  let hash = location.hash;

  // allow ? to be used in place of #
  if (!hash && location.href.indexOf('?') !== -1) {
    hash = `#${location.href.substring(location.href.indexOf('?') + 1)}`;
  }

  return hash;
}

/**
*
*/
export function splitVersionFromCatalog(id: string) {
  const split = id.split('@');

  return {
    catalog: split[0],
    version: split[1],
  };
}

/**
* @param {String} hash - window.location.hash string
*/
export function stripSortAndQueryParams(hash: string): string {
  // '@' appears first, search for that before searching for '?'
  if (hash.indexOf('@') > -1) {
    return hash.split('@')[0];
  }
  return hash.split('?')[0];
}

/**
* Given a location href, return all the query parameters available on the url.
* @param {String} url - the full url for the current page
* @param {Boolean=} dontDecodeQueryParams - if true, the values will not be decoded.
* @returns {Object} an object, containing the query parameters.
*                   The keys are query params names, and value either a
*                   string value or an array containing multiple strings.
*
* Note: This won't handle urls that use `?` instead of `#` for hash fragment.
* so should not be used for the main url. if we're looking for the query params
* of the main url, we should just use the queryParams that chaiseURItoErmrestURI returns
*/
export function getQueryParams(url: string, dontDecodeQueryParams?: boolean): any {
  const params: any = {};
  const idx = url.lastIndexOf('?');
  if (idx !== -1) {
    const queries = url.slice(idx + 1).split('&');
    for (let i = 0; i < queries.length; i++) {
      const qParts = queries[i].split('=');
      // allow for length 1 query params
      if (qParts.length > 2) continue;
      // if value is not defined, use true since key would still be defined
      qParts[1] = qParts[1] || 'true';

      let qVal, qKey;
      if (dontDecodeQueryParams) {
        qKey = qParts[0]; qVal = qParts[1];
      } else {
        qKey = decodeURIComponent(qParts[0]); qVal = decodeURIComponent(qParts[1]);
      }

      if (qKey in params) {
        if (!Array.isArray(params[qKey])) {
          params[qKey] = [params[qKey]];
        }
        params[qKey].push(qVal);
      } else {
        params[qKey] = qVal;
      }
    }
  }
  return params;
}

/**
* Given a location href and key, return the query param value that matches that key
* @param {String} url - the full url for the current page
* @param {String} key - the key of the query parameter you want the value of
* @returns {String|Array|Null} the value of that key or null, if that key doesn't exist as a query parameter
*
* Note: This won't handle urls that use `?` instead of `#` for hash fragment.
* so should not be used for the main url. if we're looking for the query params
* of the main url, we should just use the queryParams that chaiseURItoErmrestURI returns
*/
export function getQueryParam(url: string, key: string): any {
  return getQueryParams(url)[key];
}

/**
* Given a queryParams object, will return the string representation of it.
* @param {Object} queryParams - the query params object
* @param {Boolean=} dontEncodeQueryParams - if true, the values will not be encoded.
* @returns {String} the string representation of the query params (doesn't include ? at the beginning)
*
*/
export function queryParamsToString(queryParams: any, dontEncodeQueryParams?: boolean): string {
  const res: string[] = [];
  const addKeyValue = (k: string, v: string) => {
    if (dontEncodeQueryParams) {
      res.push(`${k}=${v}`);
    } else {
      res.push(`${fixedEncodeURIComponent(k)}=${fixedEncodeURIComponent(v)}`);
    }
  };
  for (const k in queryParams) {
    if (Array.isArray(queryParams[k])) {
      queryParams[k].forEach((q: string) => {
        addKeyValue(k, q);
      });
    } else {
      addKeyValue(k, queryParams[k]);
    }
  }
  return res.join('&');
}

/**
 * Gives the path of the chaise deployment directory.
 *   - It returns the chaise path mentioned in the context (based on chaiseBasePath meta tag)
 *   - otherwise, returns the default value '/chaise/'
 * Assume this function will return a value with a leading and trailing `/`
 */
export function chaiseDeploymentPath(): string {
  if (typeof BUILD_VARIABLES === 'object' && typeof BUILD_VARIABLES.CHAISE_BASE_PATH === 'string') {
    let path = BUILD_VARIABLES.CHAISE_BASE_PATH;
    if (path[path.length - 1] !== '/')
      path = path + '/';
    return path;
  } else {
    return '/chaise/';
  }
}

/**
* converts the supplied url into a window.location object and compares it with current window.location
* @param {String} url - the url to be checked if same origin
* @returns {boolean} true if same origin (or relative path)
*
*/
export function isSameOrigin(url: string): boolean {
  const currentOrigin = windowRef.location.origin;

  // parses the url into a location object
  const eleUrl = document.createElement('a');
  eleUrl.href = url;

  return eleUrl.origin === currentOrigin;
}

/**
* Given a reference will return the appropriate link to recordset
* TODO why not use appLink? the only reason could be that we don't want
* ppid and pcid
* @param {ERMrest.reference} reference
* @returns {string} url to recordset app
*/
export function getRecordsetLink(reference?: any) {
  // before run, use window location
  if (!reference) {
    return windowRef.location.href;
  }

  let url = `${chaiseBaseURL()}/recordset/#${reference.location.catalog}/${reference.location.compactPath}`;

  // add sort modifier
  if (reference.location.sort) url += reference.location.sort;

  // add paging modifier
  if (reference.location.paging) url += reference.location.paging;

  // add ermrestjs supported queryParams
  if (reference.location.queryParamsString) {
    url = `${url}?${reference.location.queryParamsString}`;
  }

  // add hideNavbar if present/defined
  const settings = ConfigService.appSettings;
  if (settings.hideNavbar) {
    url = `${url + (reference.location.queryParamsString ? '&' : '?')}hideNavbar=${settings.hideNavbar}`;
  }

  return url;
}

/**
* Given a url, will return it if it's absolute, otherwise will
* attach the current origin (if origin is not passed) to it.
*/
export function getAbsoluteURL(uri: string, origin?: string) {
  if (typeof origin !== 'string' || origin.length < 1) {
    origin = windowRef.location.origin;
  }

  // A more universal, non case-sensitive, protocol-agnostic regex
  // to test a URL string is relative or absolute
  const r = /^(?:[a-z]+:)?\/\//i;

  // The url is absolute so don't make any changes and return it as it is
  if (r.test(uri)) return uri;

  // If uri starts with "/" then simply prepend the server uri
  if (uri.indexOf('/') === 0) return origin + uri;

  // else prepend the server uri with an additional "/"
  return `${origin}/${uri}`;
}

/**
 * This function can be used for making the custom filters easier to read
 * @param filter the filter string
 * @returns transformed filter that can be used for display
 */
export function transformCustomFilter(filter: string) {
  return filter.replace(/&/g, '& ').replace(/;/g, '; ');
}

/**
 * Given a url string and object, add the object properties as query parameter
 * @param url
 * @param queryParams
 * @param urlEncode whether we should url encode or not
 */
export function addQueryParamsToURL(url: string, queryParams: {[key: string]: string}, urlEncode?: boolean) {
  let qCharacter = url.indexOf('?') !== -1 ? '&' : '?';
  return Object.keys(queryParams).reduce((prev: string, currKey: string, currIndex: number) => {
    if (currIndex > 0) qCharacter = '&';
    const usedKey = urlEncode ? fixedEncodeURIComponent(currKey) : currKey;
    const usedValue = urlEncode ? fixedEncodeURIComponent(queryParams[currKey]) : queryParams[currKey];
    return prev + qCharacter + usedKey + '=' + usedValue;
  }, url);
}

/**
 * Given the page info, return the proper link to it
 */
export function getHelpPageURL(pageInfo: typeof HELP_PAGES.MARKDOWN_HELP) {
  return `${chaiseDeploymentPath()}help/?page=${fixedEncodeURIComponent(pageInfo.location)}`
}
