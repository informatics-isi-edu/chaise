import { ConfigService } from "@chaise/services/config";
import { MESSAGE_MAP } from "./message-map";
import { windowRef } from "./window-ref";

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
  queryParams: object,
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
          throw new Error(tableMissing);
          // TODO
          // if (ERMrest) {
          //   throw new ERMrest.MalformedURIError(tableMissing);
          // } else {
          //   throw new Errors.MalformedUriError(tableMissing);
          // }

        }
      } else {
        // no defined or default schema:table
        throw new Error(tableMissing);
        // TODO
        // if (ERMrest) {
        //   throw new ERMrest.MalformedURIError(tableMissing);
        // } else {
        //   throw new Errors.MalformedUriError(tableMissing);
        // }
      }
    } else {
      // no defined or default catalog
      throw new Error(catalogMissing);
      // TODO
      // if (ERMrest) {
      //   throw new ERMrest.MalformedURIError(catalogMissing);
      // } else {
      //   throw new Errors.MalformedUriError(catalogMissing);
      // }
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
        // TODO
        // if(ERMrest){
        //     throw new ERMrest.MalformedURIError(catalogMissing);
        // } else{
        //     throw new Errors.MalformedUriError(catalogMissing);
        // }
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
          throw new Error(tableMissing);
          // TODO
          // if(ERMrest){
          //     throw new ERMrest.MalformedURIError(tableMissing);
          // } else{
          //     throw new Errors.MalformedUriError(tableMissing);
          // }
        }
      } else {
        // no defined or default schema:table
        throw new Error(tableMissing);
        // TODO
        // if(ERMrest){
        //     throw new ERMrest.MalformedURIError(tableMissing);
        // } else{
        //     throw new Errors.MalformedUriError(tableMissing);
        // }

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

// /**
// * given an app tag and location object, return the full url
// * @param {string} tag the tag that is defined in the annotation. If null, should use context.
// * @param {ERMrest.Location} location the location object that ERMrest will return.
// * @param {string} context - optional, used to determine default app if tag is null/undefined
// * @returns {string} url the chaise url
// */
// function appTagToURL(tag, location, context) {
//   var appPath;
//   if (tag && (tag in appTagMapping)) {
//       appPath = appTagMapping[tag];
//   } else {
//       appPath = ContextUtils.getValueFromContext(appContextMapping, context);
//   }

//   var url = chaiseBaseURL() + appPath + "/#" + location.catalog + "/" + location.path;
//   var pcontext = [];

//   var settingsObj = ConfigUtils.getSettings();
//   var contextHeaderParams = ConfigUtils.getContextHeaderParams();
//   pcontext.push("pcid=" + contextHeaderParams.cid);
//   pcontext.push("ppid=" + contextHeaderParams.pid);
//   // only add the value to the applink function if it's true
//   if (settingsObj.hideNavbar) pcontext.push("hideNavbar=" + settingsObj.hideNavbar)

//   // TODO we might want to allow only certian query parameters
//   if (location.queryParamsString) {
//       url = url + "?" + location.queryParamsString;
//   }
//   if (pcontext.length > 0) {
//       url = url + (location.queryParamsString ? "&" : "?") + pcontext.join("&");
//   }
//   return url;
// }

// /**
// * NOTE: DO NOT USE THIS FUNCTION, EMRESTJS will take care of parsing.
// * old apps is using are, that's why we should still keep this function.
// *
// * @function
// * @deprecated
// * @param {Object} location should be $window.location object
// * @param {context} context object; can be null
// * Parses the URL to create the context object
// */
// function parseURLFragment(location, context) {
//   var chaiseConfig = ConfigUtils.getConfigJSON();
//   var i, row, value;
//   if (!context) {
//       var context = ConfigUtils.getContextJSON();
//   }
//   // First, configure the service URL, assuming its this origin plus the
//   // typical deployment location for ermrest.
//   context.serviceURL = location.origin + '/ermrest';

//   if (chaiseConfig.ermrestLocation) {
//       context.serviceURL = chaiseConfig.ermrestLocation;
//   }

//   context.queryParams = {};

//   // Then, parse the URL fragment id (aka, hash). Expected format:
//   //  "#catalog_id/[schema_name:]table_name[/{attribute::op::value}{&attribute::op::value}*][@sort(column[::desc::])]"
//   var hash = chaiseURItoErmrestURI(location, true).hash;
//   var uri = hash;
//   if (hash === undefined || hash == '' || hash.length == 1) {
//       return context;
//   }

//   // parse out modifiers, expects in order of sort, paging, then query params
//   var modifiers = ["@sort(", "@before(", "@after", "?"];
//   for (i = 0; i < modifiers.length; i++) {
//       if (hash.indexOf(modifiers[i]) !== -1) {
//           hash = hash.split(modifiers[i])[0]; // remove modifiers from uri
//           break;
//       }
//   }

//   var modifierPath = uri.split(hash)[1];

//   if (modifierPath) {

//       // extract @sort
//       if (modifierPath.indexOf("@sort(") !== -1) {
//           var sorts = modifierPath.match(/@sort\(([^\)]*)\)/)[1].split(",");

//           context.sort = [];
//           for (var s = 0; s < sorts.length; s++) {
//               var sort = sorts[s];
//               var column = (sort.endsWith("::desc::") ?
//                   decodeURIComponent(sort.match(/(.*)::desc::/)[1]) : decodeURIComponent(sort));
//               context.sort.push({"column": column, "descending": sort.endsWith("::desc::")});
//           }
//       }

//       // extract @before
//       if (modifierPath.indexOf("@before(") !== -1) {
//           // requires @sort
//           if (context.sort) {
//               context.paging = {};
//               context.paging.before = true;
//               context.paging.row = {};
//               row = modifierPath.match(/@before\(([^\)]*)\)/)[1].split(",");
//               for (i = 0; i < context.sort.length; i++) {
//                   // ::null:: to null, empty string to "", otherwise decode value
//                   value = (row[i] === "::null::" ? null : (row[i] === "" ? "" : decodeURIComponent(row[i])));
//                   context.paging.row[context.sort[i].column] = value;
//               }
//           } else {
//               if(ERMrest){
//                   throw new ERMrest.MalformedURIError(messageMap.pagingModifierRequiresSort);
//               } else{
//                   throw new Errors.MalformedUriError(messageMap.pagingModifierRequiresSort);
//               }
//           }

//       }

//       // extract @after
//       if (modifierPath.indexOf("@after(") !== -1) {
//           if (context.paging)
//               if(ERMrest){
//                   throw new ERMrest.MalformedURIError(messageMap.onePagingModifier);
//               } else{
//                   throw new Errors.MalformedUriError(messageMap.onePagingModifier);
//               }
//           if (context.sort) {
//               context.paging = {};
//               context.paging.before = false;
//               context.paging.row = {};
//               row = modifierPath.match(/@after\(([^\)]*)\)/)[1].split(",");
//               for (i = 0; i < context.sort.length; i++) {
//                   // ::null:: to null, empty string to "", otherwise decode value
//                    value = (row[i] === "::null::" ? null : (row[i] === "" ? "" : decodeURIComponent(row[i])));
//                   context.paging.row[context.sort[i].column] = value;
//               }
//           } else {
//               if(ERMrest){
//                   throw new ERMrest.MalformedURIError(messageMap.pagingModifierRequiresSort);
//               } else{
//                   throw new Errors.MalformedUriError(messageMap.pagingModifierRequiresSort);
//               }

//           }
//       }

//       // extract query parameters
//       if (modifierPath.indexOf("?") !== -1) {
//           var queries = modifierPath.match(/\?(.+)/)[1].split("&");
//           for (i = 0; i < queries.length; i++) {
//               var q_parts = queries[i].split("=");
//               context.queryParams[decodeURIComponent(q_parts[0])] = decodeURIComponent(q_parts[1]);
//           }
//       }

//   }

//   // TODO With Reference API, we don't need the code below?

//   // start extracting values after '#' symbol
//   var parts = hash.substring(1).split('/');

//   // parts[0] should be the catalog id only
//   context.catalogID = parts[0];

//   // parts[1] should be <schema-name>:<table-name>
//   if (parts[1]) {
//       var params = parts[1].split(':');
//       if (params.length > 1) {
//           context.schemaName = decodeURIComponent(params[0]);
//           context.tableName = decodeURIComponent(params[1]);
//       } else {
//           context.schemaName = '';
//           context.tableName = decodeURIComponent(params[0]);
//       }
//   }

//   // parse filter
//   // convert filter string to ParsedFilter
//   if (parts[2]) {
//       // split by ';' and '&'
//       var regExp = new RegExp('(;|&|[^;&]+)', 'g');
//       var items = parts[2].match(regExp);
//       var filters = [];

//       // if a single filter
//       if (items.length === 1) {
//           filters.push(processSingleFilterString(items[0]));
//           context.filter = {filters: filters};

//       } else {
//           var type = null;
//           for (var i = 0; i < items.length; i++) {
//               // process anything that's inside () first
//               if (items[i].startsWith("(")) {
//                   items[i] = items[i].replace("(", "");
//                   // collect all filters until reaches ")"
//                   var subfilters = [];
//                   while(true) {
//                       if (items[i].endsWith(")")) {
//                           items[i] = items[i].replace(")", "");
//                           subfilters.push(items[i]);
//                           // get out of while loop
//                           break;
//                       } else {
//                           subfilters.push(items[i]);
//                           i++;
//                       }
//                   }

//                   filters.push(processMultiFilterString(subfilters));

//               } else if (type === null && items[i] === "&") {
//                   // first level filter type
//                   type = "Conjunction"
//               } else if (type === null && items[i] === ";") {
//                   // first level filter type
//                   type = "Disjunction";
//               } else if (type === "Conjunction" && items[i] === ";") {
//                   // using combination of ! and & without ()

//                   if(ERMrest){
//                       throw new ERMrest.MalformedURIError("Invalid filter " + parts[2]);
//                   } else{
//                       throw new Errors.MalformedUriError("Invalid filter " + parts[2]);
//                   }

//               } else if (type === "Disjunction" && items[i] === "&") {
//                   // using combination of ! and & without ()
//                   if(ERMrest){
//                       throw new ERMrest.MalformedURIError("Invalid filter " + parts[2]);
//                   } else{
//                       throw new Errors.MalformedUriError("Invalid filter " + parts[2]);
//                   }
//               } else if (items[i] !== "&" && items[i] !== ";") {
//                   // single filter on the first level
//                   var binaryFilter = processSingleFilterString(items[i]);
//                   filters.push(binaryFilter);
//               }
//           }

//           context.filter = {type: type, filters: filters};
//       }
//   }

//   return context;
// }

// // window.location.origin does not work in IE 11 (surprise, surprise)
// function setOrigin() {
//   if (!$window.location.origin) {
//       $window.location.origin = $window.location.protocol + "//" + $window.location.hostname + ($window.location.port ? ':' + $window.location.port : '');
//   }
// }


// /**
// *
// * @param filterString
// * @returns {*}
// * @desc converts a filter string to ParsedFilter
// */
// function processSingleFilterString(filterString) {
//   //check for '=' or '::' to decide what split to use
//   if (filterString.indexOf("=") !== -1) {
//       var f = filterString.split('=');
//       if (f[0] && f[1]) {
//           var filter = new ParsedFilter("BinaryPredicate");
//           filter.setBinaryPredicate(decodeURIComponent(f[0]), "=", decodeURIComponent(f[1]));
//           return filter;
//       }
//       // invalid filter

//       if(ERMrest){
//           throw new ERMrest.MalformedURIError("Invalid filter " + filterString);
//       } else{
//           throw new Errors.MalformedUriError("Invalid filter " + filterString);
//       }
//   } else {
//       var f = filterString.split("::");
//       if (f.length === 3) {
//           var filter = new ParsedFilter("BinaryPredicate");
//           filter.setBinaryPredicate(decodeURIComponent(f[0]), "::"+f[1]+"::", decodeURIComponent(f[2]));
//           return filter;
//       }
//       // invalid filter error
//       if(ERMrest){
//           throw new ERMrest.MalformedURIError("Invalid filter " + filterString);
//       } else{
//           throw new Errors.MalformedUriError("Invalid filter " + filterString);
//       }
//   }
// }

// /**
// *
// * @param {[String]} filterStrings array representation of conjunction and disjunction of filters
// *     without parenthesis. i.e., ['id=123', ';', 'id::gt::234', ';', 'id::le::345']
// * @return {ParsedFilter}
// *
// */
// function processMultiFilterString(filterStrings) {
//   var filters = [];
//   var type = null;
//   for (var i = 0; i < filterStrings.length; i++) {
//       if (type === null && filterStrings[i] === "&") {
//           // first level filter type
//           type = "Conjunction"
//       } else if (type === null && filterStrings[i] === ";") {
//           // first level filter type
//           type = "Disjunction";
//       } else if (type === "Conjunction" && filterStrings[i] === ";") {
//           // TODO throw invalid filter error (using combination of ! and &)
//           if(ERMrest){
//               throw new ERMrest.MalformedURIError("Invalid filter " + filterStrings);
//           } else{
//               throw new Errors.MalformedUriError("Invalid filter " + filterStrings);
//           }
//       } else if (type === "Disjunction" && filterStrings[i] === "&") {
//           // TODO throw invalid filter error (using combination of ! and &)
//           if(ERMrest){
//               throw new ERMrest.MalformedURIError("Invalid filter " + filterStrings);
//           } else{
//               throw new Errors.MalformedUriError("Invalid filter " + filterStrings);
//           }
//       } else if (filterStrings[i] !== "&" && filterStrings[i] !== ";") {
//           // single filter on the first level
//           var binaryFilter = processSingleFilterString(filterStrings[i]);
//           filters.push(binaryFilter);
//       }
//   }

//   var filter = new ParsedFilter(type);
//   filter.setFilters(filters);
//   return filter;
//   //return {type: type, filters: filters};
// }

// function parsedFilterToERMrestFilter(filter, table) {
//   if (filter.type === "BinaryPredicate") {
//       return new ERMrest.BinaryPredicate(
//           table.columns.get(filter.column),
//           filter.operator,
//           filter.value
//       );
//   } else {
//       // convert nested filter structure to Conjunction or Disjunction filter
//       var filters = [];

//       if (filter.filters) {
//           for (var i = 0; i < filter.filters.length; i++) {
//               var f = filter.filters[i];
//               var f1 = parsedFilterToERMrestFilter(f, table);
//               filters.push(f1);
//           }
//       }

//       if (filter.type === "Conjunction") {
//           return new ERMrest.Conjunction(filters);
//       } else {
//           return new ERMrest.Disjunction(filters);
//       }
//   }
// }

// /**
// *
// * This code handles address bar changes
// * Normally when user changes the url in the address bar,
// * nothing happens.
// *
// * This code listens when address bar is changes outside the code,
// * and redirects to the new location.
// *
// * Whenever app updates the url (no reloading and no history stack),
// * it saves the location in $rootScope.location.
// * When address bar is changed, this code compares the address bar location
// * with the last save recordset location. If it's the same, the change of url was
// * done internally, do not refresh page. If not, the change was done manually
// * outside recordset, refresh page.
// *
// */
// function setLocationChangeHandling() {
//   $window.onhashchange = function() {
//       // when address bar changes by user
//       if ($window.location.href !== $rootScope.location) {
//           location.reload();
//       }
//   };
// }

// // Takes any string, finds the '?' character, and splits all content after '?' assuming they are in the form of key=value&key2=value&...
// function queryStringToJSON(queryString) {
//   queryString  = queryString || $window.location.search;
//   if (queryString.indexOf('?') > -1){
//       queryString = queryString.split('?')[1];
//   }
//   var pairs = queryString.split('&');
//   var result = {};
//   pairs.forEach(function(pair) {
//       pair = pair.split('=');
//       result[pair[0]] = decodeURIComponent(pair[1] || '');
//   });
//   return result;
// }

// function isBrowserIE() {
//   //Internet Explorer 6-11
//   return /*@cc_on!@*/false || !!document.documentMode;
// }

// /**
// * Takes pathname attribute of window.location object and returns app name
// * path should be a string literal which appears before #catalog id in URL (/chaise/recordset/)
// * if the path ends with /folder/file.html it will return the folder.
// * (any other pattern will just return anything after last `/`)
// */
// function appNamefromUrlPathname(path){
// var newPath = path.slice(0, -1);
// var lastSlash = newPath.lastIndexOf('/');
// var name = newPath.substring(lastSlash + 1, newPath.length);
// if (name.endsWith(".htm")) {
//     return appNamefromUrlPathname(newPath.substring(0, lastSlash) + "/");
// }
// return name;
// }

// // Takes path and creates full redirect links with catalogId
// function createRedirectLinkFromPath(path){
// return $window.location.origin + $window.location.pathname + '#' + chaiseURItoErmrestURI($window.location, true).catalogId + "/" + path;
// }

// /**
// * Gives the path of the chaise deployment directory.
// *   - It returns the chaise path mentioned in the context (based on chaiseBasePath meta tag)
// *   - otherwise, returns the default value '/chaise/'
// * Assume this function will return a value with a leading and trailing `/`
// */
// function chaiseDeploymentPath() {
//   if (typeof chaiseBuildVariables === "object" && typeof chaiseBuildVariables.chaiseBasePath === "string") {
//       var path = chaiseBuildVariables.chaiseBasePath;
//       if(path[path.length-1] !== "/")
//           path = path + "/";
//       return path;
//   } else {
//       return '/chaise/';
//   }
// }

// /**
// * Returns the path that openseadragon-viewer is installed
// */
// function OSDViewerDeploymentPath() {
//   if (typeof chaiseBuildVariables === "object" && typeof chaiseBuildVariables.OSDViewerBasePath === "string") {
//       return chaiseBuildVariables.OSDViewerBasePath;
//   } else {
//       return '/openseadragon-viewer/';
//   }
// }

// /**
// * Returns the chaise base url without the trailing slash
// * TODO we might want to find a better way instead of this.
// * @return {String}
// */
// function chaiseBaseURL() {
//   var res = $window.location.origin + chaiseDeploymentPath();
//   if (res.endsWith("/")) {
//       return res.slice(0, -1);
//   }
//   return res;
// }

// /**
// * The following cases need to be handled for the resolverImplicitCatalog value:
// *  - if resolverImplicitCatalog === null:         use current chaise path (without the version if one is present)
// *  - if resolverImplicitCatalog === currCatalog:  /id/RID
// *  - otherwise:                                   /id/currCatalog/RID
// * @param {ERMrest.Tuple} tuple - the `ermrestJS` tuple object returned from the page object when data is read
// * @param {ERMrest.Reference} reference - the `ermrestJS` reference object associated with this current page
// * @param {String} version - the encoded version string prepended with the '@' character
// **/
// function resolvePermalink(tuple, reference, version) {
//   var chaiseConfig = ConfigUtils.getConfigJSON();
//   var resolverId = chaiseConfig.resolverImplicitCatalog;
//   var currCatalog = reference.location.catalogId;

//   // null or no RID
//   if (resolverId === null || !tuple.data || !tuple.data.RID) {
//       var url = tuple.reference.contextualize.detailed.appLink;
//       // remove query parameters
//       var lastIndex = url.lastIndexOf("?") > 0 ? url.lastIndexOf("?") : url.length
//       url = url.substring(0, lastIndex);

//       // location.catalog will be in the form of `<id>` or `<id>@<version>`
//       return url.replace('#' + reference.location.catalog, '#' + currCatalog + (version ? version : ""));
//   }

//   // if it's a number (isNaN tries to parse to integer before checking) and is the same as current catalog
//   if (!isNaN(resolverId) && resolverId == currCatalog) {
//       return $window.location.origin + "/id/" + tuple.data.RID + (version ? version : "");
//   }

//   // if resolverId is false or undefined OR any other values that are not allowed use the default
//   // default is to show the fully qualified resolveable link for permalink
//   return $window.location.origin + "/id/" + currCatalog + "/" + tuple.data.RID + (version ? version : "");
// }

// // if '?' is used instead of '#' (?catalog/schema:table), return in the proper form (#catalog/schema:table)
// function getHash(location) {
//   var hash = location.hash

//   // allow ? to be used in place of #
//   if ((hash == '' || hash == undefined) && location.href.indexOf("?") !== -1) {
//       hash = "#" + location.href.substring(location.href.indexOf("?") + 1);
//   }

//   return hash;
// }

// /**
// *
// */
// function splitVersionFromCatalog(id) {
//   var split = id.split('@');

//   return {
//       catalog: split[0],
//       version: split[1]
//   }
// }

// /**
// * @param {String} hash - window.location.hash string
// */
// function stripSortAndQueryParams(hash) {
//   // '@' appears first, search for that before searching for '?'
//   if (hash.indexOf('@') > -1) {
//       return hash.split('@')[0];
//   } else {
//       return hash.split('?')[0];
//   }
// }

// /**
// * Given a location href and key, return the query param value that matches that key
// * @param {String} url - the full url for the current page
// * @param {String} key - the key of the query parameter you want the value of
// * @returns {String|Array|Null} the value of that key or null, if that key doesn't exist as a query parameter
// *
// * Note: This won't handle urls that use `?` instead of `#` for hash fragment.
// * so should not be used for the main url. if we're looking for the query params
// * of the main url, we should just use the queryParams that chaiseURItoErmrestURI returns
// */
// function getQueryParam(url, key) {
//   return getQueryParams(url)[key];
// }

// /**
// * Given a location href, return all the query parameters available on the url.
// * @param {String} url - the full url for the current page
// * @param {Boolean=} dontDecodeQueryParams - if true, the values will not be decoded.
// * @returns {Object} an object, containing the query parameters.
// *                   The keys are query params names, and value either a
// *                   string value or an array containing multiple strings.
// *
// * Note: This won't handle urls that use `?` instead of `#` for hash fragment.
// * so should not be used for the main url. if we're looking for the query params
// * of the main url, we should just use the queryParams that chaiseURItoErmrestURI returns
// */
// function getQueryParams(url, dontDecodeQueryParams) {
//   var params = {};
//   var idx = url.lastIndexOf("?");
//   if (idx !== -1) {
//       var queries = url.slice(idx+1).split("&");
//       for (var i = 0; i < queries.length; i++) {
//           var q_parts = queries[i].split("=");
//           // allow for length 1 query params
//           if (q_parts.length > 2) continue;
//           // if value is not defined, use true since key would still be defined
//           q_parts[1] = q_parts[1] || true

//           var q_key, q_val;
//           if (dontDecodeQueryParams) {
//               q_key = q_parts[0], q_val = q_parts[1];
//           } else {
//               q_key = decodeURIComponent(q_parts[0]), q_val = decodeURIComponent(q_parts[1]);
//           }

//           if (q_key in params) {
//               if (!Array.isArray(params[q_key])) {
//                   params[q_key] = [params[q_key]]
//               }
//               params[q_key].push(q_val);
//           } else {
//               params[q_key] = q_val;
//           }
//       }
//   }
//   return params;
// }

// /**
// * Given a queryParams object, will return the string representation of it.
// * @param {Object} queryParams - the query params object
// * @param {Boolean=} dontEncodeQueryParams - if true, the values will not be encoded.
// * @returns {String} the string representation of the query params (doesn't include ? at the beginning)
// *
// */
// function queryParamsToString(queryParams, dontEncodeQueryParams) {
//   var res = [];
//   var addKeyValue = function(k, v) {
//       if (dontEncodeQueryParams) {
//           res.push(k + "=" + v);
//       } else {
//           res.push(fixedEncodeURIComponent(k) + "=" + fixedEncodeURIComponent(v));
//       }
//   }

//   for (var k in queryParams) {
//       if (Array.isArray(queryParams[k])) {
//           queryParams[k].forEach(function (q) {
//               addKeyValue(k, q);
//           });
//       } else {
//           addKeyValue(k, queryParams[k])
//       }
//   }
//   return res.join("&");
// }

// /**
// * converts the supplied url into a window.location object and compares it with current window.location
// * @param {String} url - the url to be checked if same origin
// * @returns {boolean} true if same origin (or relative path)
// *
// */
// function isSameOrigin(url) {
//   var currentOrigin = $window.location.origin;

//   // parses the url into a location object
//   var eleUrl = document.createElement('a');
//   eleUrl.href = url;

//   return eleUrl.origin == currentOrigin;
// }

// /**
// * Given a reference will return the appropriate link to recordset
// * TODO why not use appLink? the only reason could be that we don't want
// * ppid and pcid
// * @param {ERMrest.reference} reference
// * @returns {string} url to recordset app
// */
// function getRecordsetLink(reference) {
//   // before run, use window location
//   if (!reference) {
//       return $window.location.href;
//   }

//   var url = chaiseBaseURL() + "/recordset/#" + reference.location.catalog + "/" + reference.location.compactPath;

//   // add sort modifier
//   if (reference.location.sort)
//       url = url + reference.location.sort;

//   // add paging modifier
//   if (reference.location.paging)
//       url = url + reference.location.paging;

//   // add ermrestjs supported queryParams
//   if (reference.location.queryParamsString) {
//       url = url + "?" + reference.location.queryParamsString;
//   }

//   // add hideNavbar if present/defined
//   var settings = ConfigUtils.getSettings();
//   if (settings.hideNavbar) {
//       url = url + (reference.location.queryParamsString ? "&" : "?") + "hideNavbar=" + settings.hideNavbar;
//   }

//   return url;
// }

// /**
// * Given a url, will return it if it's absolute, otherwise will
// * attach the current origin (if origin is not passed) to it.
// */
// function getAbsoluteURL(uri, origin) {
//   if (typeof origin !== 'string' || origin.length < 1) {
//       origin = $window.location.origin;
//   }

//   // A more universal, non case-sensitive, protocol-agnostic regex
//   // to test a URL string is relative or absolute
//   var r = new RegExp('^(?:[a-z]+:)?//', 'i');

//   // The url is absolute so don't make any changes and return it as it is
//   if (r.test(uri))  return uri;

//   // If uri starts with "/" then simply prepend the server uri
//   if (uri.indexOf("/") === 0)  return origin + uri;

//   // else prepend the server uri with an additional "/"
//   return origin + "/" + uri;
// }
