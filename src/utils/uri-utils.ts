/**
 * Utility functions that parse the URL or manipulate it
 */


import { ConfigService } from "@chaise/services/config";
import { BUILD_VARIABLES } from "@chaise/utils/constants";
import { MESSAGE_MAP } from "@chaise/utils/message-map";
import { windowRef } from "@chaise/utils/window-ref";

export function getCatalogId() {
  var catalogId = "",
    cc = ConfigService.chaiseConfig;

  try {
    catalogId += chaiseURItoErmrestURI(windowRef.location).catalogId;
  } catch (err) {
    if (cc.defaultCatalog) catalogId += cc.defaultCatalog;
  }

  return catalogId;
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
  var tableMissing = MESSAGE_MAP.tableMissing,
    catalogMissing = MESSAGE_MAP.catalogMissing,
    chaiseConfig = ConfigService.chaiseConfig;

  var hash = location.hash,
    isQueryParameter = false;

  // allow ? to be used in place of #
  if ((hash == '' || hash == undefined) && location.href.indexOf("?") !== -1) {
    hash = "#" + location.href.substring(location.href.indexOf("?") + 1);
    isQueryParameter = true;
  }
  // capture the hash before it's split for use in ermrestURI generation
  var originalHash = hash;

  var ermrestUri = {},
    queryParams: any = {},
    queryParamsString = "",
    catalogId, ppid = "", pcid = "", paction = "";

  // remove query params other than limit
  if (hash && hash.indexOf('?') !== -1) {
    queryParamsString = hash.match(/\?(.+)/)![1];
    var queries = queryParamsString.split("&"); // get the query params
    var acceptedQueries = [], i, q_parts, q_key, q_val;

    hash = hash.slice(0, hash.indexOf('?'));

    // remove queries add back only the valid queries
    // "valid queries" are ones that the ermrest APIs allow in the uri (like limit)
    for (i = 0; i < queries.length; i++) {
      q_parts = queries[i].split("=");
      if (q_parts.length != 2) continue;

      if (dontDecodeQueryParams) {
        q_key = q_parts[0], q_val = q_parts[1];
      } else {
        q_key = decodeURIComponent(q_parts[0]), q_val = decodeURIComponent(q_parts[1]);
      }

      // capture the special values
      switch (q_key) {
        case "limit":
          acceptedQueries.push(queries[i]);
          break;
        case "pcid":
          pcid = q_val;
          break;
        case "ppid":
          ppid = q_val;
          break;
        case "paction":
          paction = q_val;
          break;
      }

      // save the query param
      if (q_key in queryParams) {
        if (!Array.isArray(queryParams[q_key])) {
          queryParams[q_key] = [queryParams[q_key]]
        }
        queryParams[q_key].push(q_val);
      } else {
        queryParams[q_key] = q_val;
      }
    }
    if (acceptedQueries.length != 0) {
      hash = hash + "?" + acceptedQueries.join("&");
    }
  }

  // If the hash is empty, check for defaults
  if (hash == '' || hash === null || hash.length == 1) {
    if (chaiseConfig.defaultCatalog) {
      if (chaiseConfig.defaultTables) {
        catalogId = chaiseConfig.defaultCatalog;

        var tableConfig = chaiseConfig.defaultTables[catalogId];
        if (tableConfig) {
          hash = '/' + fixedEncodeURIComponent(tableConfig.schema) + ':' + fixedEncodeURIComponent(tableConfig.table);
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
        throw new Error(catalogMissing);
        // no defined or default catalog
        throw new ConfigService.ERMrest.MalformedURIError(catalogMissing);
      }
    }

    // there is no '/' character (only a catalog id) or a trailing '/' after the id
    if (hash.indexOf('/') === -1 || hash.substring(hash.indexOf('/')).length === 1) {
      // check for default Table
      if (chaiseConfig.defaultTables) {
        var tableConfig = chaiseConfig.defaultTables[catalogId];
        if (tableConfig) {
          hash = '/' + fixedEncodeURIComponent(tableConfig.schema) + ':' + fixedEncodeURIComponent(tableConfig.table);
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

  var baseUri = chaiseConfig.ermrestLocation;
  var path = '/catalog/' + catalogId + '/entity' + hash;

  return {
    ermrestUri: baseUri + path,
    catalogId: catalogId,
    hash: originalHash,
    ppid: ppid,
    pcid: pcid,
    paction: paction,
    queryParamsString: queryParamsString,
    queryParams: queryParams,
    isQueryParameter: isQueryParameter
  };
}

/**
* @function
* @param {String} str string to be encoded.
* @desc
* converts a string to an URI encoded string
*/
export function fixedEncodeURIComponent(str: string) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}


/**
 * Takes any string, finds the '?' character, and splits all content after '?' assuming they are in the form of key=value&key2=value&...
 * @param queryString
 * @returns
 */
export function queryStringToJSON(queryString: string): object {
  queryString = queryString || windowRef.location.search;
  if (queryString.indexOf('?') > -1) {
    queryString = queryString.split('?')[1];
  }
  var pairs = queryString.split('&');
  var result: any = {};
  pairs.forEach(function (pair) {
    let pairArr = pair.split('=');
    result[pair[0]] = decodeURIComponent(pairArr[1] || '');
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
  var newPath = path.slice(0, -1);
  var lastSlash = newPath.lastIndexOf('/');
  var name = newPath.substring(lastSlash + 1, newPath.length);
  if (name.endsWith(".htm")) {
    return appNamefromUrlPathname(newPath.substring(0, lastSlash) + "/");
  }
  return name;
}

/**
 * Takes path and creates full redirect links with catalogId
 * @param path
 * @returns
 */
export function createRedirectLinkFromPath(path: string): string {
  return windowRef.location.origin + windowRef.location.pathname + '#' + chaiseURItoErmrestURI(windowRef.location, true).catalogId + "/" + path;
}

/**
* Returns the chaise base url without the trailing slash
* TODO we might want to find a better way instead of this.
* @return {String}
*/
export function chaiseBaseURL() : string {
  var res = windowRef.location.origin + BUILD_VARIABLES.CHAISE_BASE_PATH;
  if (res.endsWith("/")) {
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
**/
export function resolvePermalink(tuple: any, reference: any, version: string) {
  var chaiseConfig = ConfigService.chaiseConfig;
  var resolverId = chaiseConfig.resolverImplicitCatalog;
  var currCatalog = reference.location.catalogId;

  // null or no RID
  if (resolverId === null || !tuple.data || !tuple.data.RID) {
    var url = tuple.reference.contextualize.detailed.appLink;
    // remove query parameters
    var lastIndex = url.lastIndexOf("?") > 0 ? url.lastIndexOf("?") : url.length
    url = url.substring(0, lastIndex);

    // location.catalog will be in the form of `<id>` or `<id>@<version>`
    return url.replace('#' + reference.location.catalog, '#' + currCatalog + (version ? version : ""));
  }

  // if it's a number (isNaN tries to parse to integer before checking) and is the same as current catalog
  if (!isNaN(resolverId) && resolverId == currCatalog) {
    return windowRef.location.origin + "/id/" + tuple.data.RID + (version ? version : "");
  }

  // if resolverId is false or undefined OR any other values that are not allowed use the default
  // default is to show the fully qualified resolveable link for permalink
  return windowRef.location.origin + "/id/" + currCatalog + "/" + tuple.data.RID + (version ? version : "");
}

/**
 * if '?' is used instead of '#' (?catalog/schema:table), return in the proper form (#catalog/schema:table)
 * @param location
 */
export function getURLHashFragment(location: Location) {
  var hash = location.hash

  // allow ? to be used in place of #
  if ((hash == '' || hash == undefined) && location.href.indexOf("?") !== -1) {
    hash = "#" + location.href.substring(location.href.indexOf("?") + 1);
  }

  return hash;
}

/**
*
*/
export function splitVersionFromCatalog(id: string) {
  var split = id.split('@');

  return {
    catalog: split[0],
    version: split[1]
  }
}

/**
* @param {String} hash - window.location.hash string
*/
export function stripSortAndQueryParams(hash: string): string {
  // '@' appears first, search for that before searching for '?'
  if (hash.indexOf('@') > -1) {
    return hash.split('@')[0];
  } else {
    return hash.split('?')[0];
  }
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
  var params: any = {};
  var idx = url.lastIndexOf("?");
  if (idx !== -1) {
    var queries = url.slice(idx + 1).split("&");
    for (var i = 0; i < queries.length; i++) {
      var q_parts = queries[i].split("=");
      // allow for length 1 query params
      if (q_parts.length > 2) continue;
      // if value is not defined, use true since key would still be defined
      q_parts[1] = q_parts[1] || "true";

      var q_key, q_val;
      if (dontDecodeQueryParams) {
        q_key = q_parts[0], q_val = q_parts[1];
      } else {
        q_key = decodeURIComponent(q_parts[0]), q_val = decodeURIComponent(q_parts[1]);
      }

      if (q_key in params) {
        if (!Array.isArray(params[q_key])) {
          params[q_key] = [params[q_key]]
        }
        params[q_key].push(q_val);
      } else {
        params[q_key] = q_val;
      }
    }
  }
  return params;
}

/**
* Given a queryParams object, will return the string representation of it.
* @param {Object} queryParams - the query params object
* @param {Boolean=} dontEncodeQueryParams - if true, the values will not be encoded.
* @returns {String} the string representation of the query params (doesn't include ? at the beginning)
*
*/
export function queryParamsToString(queryParams: any, dontEncodeQueryParams?: boolean): string {
  var res: string[] = [];
  var addKeyValue = function (k: string, v: string) {
    if (dontEncodeQueryParams) {
      res.push(k + "=" + v);
    } else {
      res.push(fixedEncodeURIComponent(k) + "=" + fixedEncodeURIComponent(v));
    }
  }

  for (var k in queryParams) {
    if (Array.isArray(queryParams[k])) {
      queryParams[k].forEach(function (q: string) {
        addKeyValue(k, q);
      });
    } else {
      addKeyValue(k, queryParams[k])
    }
  }
  return res.join("&");
}

/**
* converts the supplied url into a window.location object and compares it with current window.location
* @param {String} url - the url to be checked if same origin
* @returns {boolean} true if same origin (or relative path)
*
*/
export function isSameOrigin(url: string): boolean {
  var currentOrigin = windowRef.location.origin;

  // parses the url into a location object
  var eleUrl = document.createElement('a');
  eleUrl.href = url;

  return eleUrl.origin == currentOrigin;
}

/**
* Given a reference will return the appropriate link to recordset
* TODO why not use appLink? the only reason could be that we don't want
* ppid and pcid
* @param {ERMrest.reference} reference
* @returns {string} url to recordset app
*/
export function getRecordsetLink(reference: any) {
  // before run, use window location
  if (!reference) {
    return windowRef.location.href;
  }

  var url = chaiseBaseURL() + "/recordset/#" + reference.location.catalog + "/" + reference.location.compactPath;

  // add sort modifier
  if (reference.location.sort)
    url = url + reference.location.sort;

  // add paging modifier
  if (reference.location.paging)
    url = url + reference.location.paging;

  // add ermrestjs supported queryParams
  if (reference.location.queryParamsString) {
    url = url + "?" + reference.location.queryParamsString;
  }

  // add hideNavbar if present/defined
  var settings = ConfigService.appSettings;
  if (settings.hideNavbar) {
    url = url + (reference.location.queryParamsString ? "&" : "?") + "hideNavbar=" + settings.hideNavbar;
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
  var r = new RegExp('^(?:[a-z]+:)?//', 'i');

  // The url is absolute so don't make any changes and return it as it is
  if (r.test(uri)) return uri;

  // If uri starts with "/" then simply prepend the server uri
  if (uri.indexOf("/") === 0) return origin + uri;

  // else prepend the server uri with an additional "/"
  return origin + "/" + uri;
}
