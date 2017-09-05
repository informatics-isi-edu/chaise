(function() {
    'use strict';

    angular.module('chaise.utils', ['chaise.errors'])

    .constant("appTagMapping", {
        "tag:isrd.isi.edu,2016:chaise:record": "/record",
        "tag:isrd.isi.edu,2016:chaise:detailed": "/detailed",
        "tag:isrd.isi.edu,2016:chaise:viewer": "/viewer",
        "tag:isrd.isi.edu,2016:chaise:search": "/search",
        "tag:isrd.isi.edu,2016:chaise:recordset": "/recordset",
        "tag:isrd.isi.edu,2016:chaise:recordedit": "/recordedit"
    })

    .constant("appContextMapping", {
        "detailed": "/record",
        "compact": "/recordset",
        "edit": "/recordedit",
        "entry": "/recordedit",
        "*": "/record"
    })

    // this constant is used to keep track of our strings that the user is shown
    // so that when one is changed, it is changed in all places.
    // this will make localization easier if we go that route
    .constant("messageMap", {
        "catalogMissing": "No catalog specified and no Default is set.",
        "generalPreconditionFailed": "This page is out of sync with the server. Please refresh the page and try again.",
        "noDataMessage": "No entity exists with ",
        "multipleDataErrorCode" : "Multiple Records Found",
        "multipleDataMessage" : "There are more than 1 record found for the filters provided.",
        "onePagingModifier": "Invalid URL. Only one paging modifier allowed",
        "pageRefreshRequired": {
            title: "Page Refresh Required",
            message: "This record cannot be deleted at this time because someone else has modified it. Please refresh this page before attempting to delete again."
        },
        "pagingModifierRequiresSort": "Invalid URL. Paging modifier requires @sort",
        "reviewModifiedRecord": {
            title: "Review Modified Record",
            message: "This record cannot be deleted or unlinked at this time because someone else has modified it. The record has been updated with the latest changes. Please review them before trying again."
        },
        "sessionExpired": {
            title: "Your session has expired. Please login to continue.",
            message: "To open the login window press"
        },
        "noSession": {
            title: "Your need to be logged in to continue.",
            message: "To open the login window press"
        },
        "tableMissing": "No table specified in the form of 'schema-name:table-name' and no Default is set."
    })

    .factory('UriUtils', ['$injector', '$rootScope', '$window', 'appContextMapping', 'appTagMapping', 'ContextUtils', 'Errors', 'messageMap', 'parsedFilter',
        function($injector, $rootScope, $window, appContextMapping, appTagMapping, ContextUtils, Errors, messageMap, ParsedFilter) {

        var chaiseBaseURL;
        /**
         * @function
         * @param {Object} location - location Object from the $window resource
         * @desc
         * Converts a chaise URI to an ermrest resource URI object.
         * @throws {MalformedUriError} if table or catalog data are missing.
         */

        function chaiseURItoErmrestURI(location) {
            var tableMissing = messageMap.tableMissing,
                catalogMissing = messageMap.catalogMissing;

            var hash = location.hash,
                ermrestUri = {},
                catalogId;

            // remove query params other than limit
            if (hash.indexOf('?') !== -1) {
                var queries = hash.match(/\?(.+)/)[1].split("&"); // get the query params
                var acceptedQueries = [], i;

                hash = hash.slice(0, hash.indexOf('?')); // remove queries
                for (i = 0; i < queries.length; i++) { // add back only the valid queries
                    if (queries[i].indexOf("limit=") === 0 || queries[i].indexOf("subset=") === 0) {
                        acceptedQueries.push(queries[i]);
                    }
                }
                if (acceptedQueries.length != 0) {
                    hash = hash + "?" + acceptedQueries.join("&");
                }
            }

            // If the hash is empty, check for defaults
            if (hash == '' || hash === undefined || hash.length == 1) {
                if (chaiseConfig.defaultCatalog) {
                    if (chaiseConfig.defaultTables) {
                        catalogId = chaiseConfig.defaultCatalog;

                        var tableConfig = chaiseConfig.defaultTables[catalogId];
                        if (tableConfig) {
                            hash = '/' + fixedEncodeURIComponent(tableConfig.schema) + ':' + fixedEncodeURIComponent(tableConfig.table);
                        } else {
                            // no defined or default schema:table for catalogId
                            throw new Errors.MalformedUriError(tableMissing);
                        }
                    } else {
                        // no defined or default schema:table
                        throw new Errors.MalformedUriError(tableMissing);
                    }
                } else {
                    // no defined or default catalog
                    throw new Errors.MalformedUriError(catalogMissing);
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
                        throw new Errors.MalformedUriError(catalogMissing);
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
                            throw new Errors.MalformedUriError(tableMissing);
                        }
                    } else {
                        // no defined or default schema:table
                        throw new Errors.MalformedUriError(tableMissing);
                    }
                } else {
                    // grab the end of the hash from: '.../<schema-name>...'
                    hash = hash.substring(hash.indexOf('/'));
                }
            }

            var baseUri = chaiseConfig.ermrestLocation ? chaiseConfig.ermrestLocation : location.origin + '/ermrest';
            var path = '/catalog/' + fixedEncodeURIComponent(catalogId) + '/entity' + hash;
            return baseUri + path;
        }

        /**
        * @function
        * @param {String} str string to be encoded.
        * @desc
        * converts a string to an URI encoded string
        */
        function fixedEncodeURIComponent(str) {
            return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
                return '%' + c.charCodeAt(0).toString(16).toUpperCase();
            });
        }

        /**
         * given an app tag and location object, return the full url
         * @param {string} tag the tag that is defined in the annotation. If null, should use context.
         * @param {ERMrest.Location} location the location object that ERMrest will return.
         * @param {string} context - optional, used to determine default app if tag is null/undefined
         * @returns {string} url the chaise url
         */
        function appTagToURL(tag, location, context) {
            if (!chaiseBaseURL)
                chaiseBaseURL = $window.location.href.replace($window.location.hash, '');
            chaiseBaseURL = chaiseBaseURL.replace("/" + $rootScope.context.appName + "/", '');
            var appPath;
            if (tag && (tag in appTagMapping)) {
                appPath = appTagMapping[tag];
            } else {
                appPath = ContextUtils.getValueFromContext(appContextMapping, context);
            }

            var url = chaiseBaseURL + appPath + "/#" + fixedEncodeURIComponent(location.catalog) + "/" + location.path;
            if (location.queryParamsString && (context === "compact" || context === "compact/brief")) {
                url = url + "?" + location.queryParamsString;
            }
            return url;
        }
        
        
        /**
         * Return query params
         * @param  {Object} location window.location object
         * @return {Object} key-value pairs of query params
         */
        function getQueryParams(location) {
            var queryParams = {}, 
                modifierPath = location.hash,
                q_parts, i;

            if (modifierPath.indexOf("?") !== -1) {
                var queries = modifierPath.match(/\?(.+)/)[1].split("&");
                for (i = 0; i < queries.length; i++) {
                    q_parts = queries[i].split("=");
                    queryParams[decodeURIComponent(q_parts[0])] = decodeURIComponent(q_parts[1]);
                }
            }
            return queryParams;
        }

        /**
         * NOTE: DO NOT USE THIS FUNCTION, EMRESTJS will take care of parsing.
         * old apps is using are, that's why we should still keep this function.
         * 
         * @function
         * @deprecated
         * @param {Object} location should be $window.location object
         * @param {context} context object; can be null
         * Parses the URL to create the context object
         */
        function parseURLFragment(location, context) {
            var i, row, value;
            if (!context) {
                var context = {};
            }
            // First, configure the service URL, assuming its this origin plus the
            // typical deployment location for ermrest.
            context.serviceURL = location.origin + '/ermrest';

            if (chaiseConfig.ermrestLocation) {
                context.serviceURL = chaiseConfig.ermrestLocation;
            }

            context.queryParams = {};

            // Then, parse the URL fragment id (aka, hash). Expected format:
            //  "#catalog_id/[schema_name:]table_name[/{attribute::op::value}{&attribute::op::value}*][@sort(column[::desc::])]"
            var hash = location.hash;
            var uri = hash;
            if (hash === undefined || hash == '' || hash.length == 1) {
                return context;
            }

            // parse out modifiers, expects in order of sort, paging, then query params
            var modifiers = ["@sort(", "@before(", "@after", "?"];
            for (i = 0; i < modifiers.length; i++) {
                if (hash.indexOf(modifiers[i]) !== -1) {
                    hash = hash.split(modifiers[i])[0]; // remove modifiers from uri
                    break;
                }
            }

            context.mainURI = hash; // uri without modifiers
            var modifierPath = uri.split(hash)[1];

            if (modifierPath) {

                // extract @sort
                if (modifierPath.indexOf("@sort(") !== -1) {
                    var sorts = modifierPath.match(/@sort\(([^\)]*)\)/)[1].split(",");

                    context.sort = [];
                    for (var s = 0; s < sorts.length; s++) {
                        var sort = sorts[s];
                        var column = (sort.endsWith("::desc::") ?
                            decodeURIComponent(sort.match(/(.*)::desc::/)[1]) : decodeURIComponent(sort));
                        context.sort.push({"column": column, "descending": sort.endsWith("::desc::")});
                    }
                }

                // extract @before
                if (modifierPath.indexOf("@before(") !== -1) {
                    // requires @sort
                    if (context.sort) {
                        context.paging = {};
                        context.paging.before = true;
                        context.paging.row = {};
                        row = modifierPath.match(/@before\(([^\)]*)\)/)[1].split(",");
                        for (i = 0; i < context.sort.length; i++) {
                            // ::null:: to null, empty string to "", otherwise decode value
                            value = (row[i] === "::null::" ? null : (row[i] === "" ? "" : decodeURIComponent(row[i])));
                            context.paging.row[context.sort[i].column] = value;
                        }
                    } else {
                        throw new Errors.MalformedUriError(messageMap.pagingModifierRequiresSort);
                    }

                }

                // extract @after
                if (modifierPath.indexOf("@after(") !== -1) {
                    if (context.paging)
                        throw new Errors.MalformedUriError(messageMap.onePagingModifier);
                    if (context.sort) {
                        context.paging = {};
                        context.paging.before = false;
                        context.paging.row = {};
                        row = modifierPath.match(/@after\(([^\)]*)\)/)[1].split(",");
                        for (i = 0; i < context.sort.length; i++) {
                            // ::null:: to null, empty string to "", otherwise decode value
                             value = (row[i] === "::null::" ? null : (row[i] === "" ? "" : decodeURIComponent(row[i])));
                            context.paging.row[context.sort[i].column] = value;
                        }
                    } else {
                        throw new Errors.MalformedUriError(messageMap.pagingModifierRequiresSort);
                    }
                }

                // extract query parameters
                if (modifierPath.indexOf("?") !== -1) {
                    var queries = modifierPath.match(/\?(.+)/)[1].split("&");
                    for (i = 0; i < queries.length; i++) {
                        var q_parts = queries[i].split("=");
                        context.queryParams[decodeURIComponent(q_parts[0])] = decodeURIComponent(q_parts[1]);
                    }
                }

            }

            // TODO With Reference API, we don't need the code below?

            // start extracting values after '#' symbol
            var parts = hash.substring(1).split('/');

            // parts[0] should be the catalog id only
            context.catalogID = parts[0];

            // parts[1] should be <schema-name>:<table-name>
            if (parts[1]) {
                var params = parts[1].split(':');
                if (params.length > 1) {
                    context.schemaName = decodeURIComponent(params[0]);
                    context.tableName = decodeURIComponent(params[1]);
                } else {
                    context.schemaName = '';
                    context.tableName = decodeURIComponent(params[0]);
                }
            }

            // parse filter
            // convert filter string to ParsedFilter
            if (parts[2]) {
                // split by ';' and '&'
                var regExp = new RegExp('(;|&|[^;&]+)', 'g');
                var items = parts[2].match(regExp);
                var filters = [];

                // if a single filter
                if (items.length === 1) {
                    filters.push(processSingleFilterString(items[0]));
                    context.filter = {filters: filters};

                } else {
                    var type = null;
                    for (var i = 0; i < items.length; i++) {
                        // process anything that's inside () first
                        if (items[i].startsWith("(")) {
                            items[i] = items[i].replace("(", "");
                            // collect all filters until reaches ")"
                            var subfilters = [];
                            while(true) {
                                if (items[i].endsWith(")")) {
                                    items[i] = items[i].replace(")", "");
                                    subfilters.push(items[i]);
                                    // get out of while loop
                                    break;
                                } else {
                                    subfilters.push(items[i]);
                                    i++;
                                }
                            }

                            filters.push(processMultiFilterString(subfilters));

                        } else if (type === null && items[i] === "&") {
                            // first level filter type
                            type = "Conjunction"
                        } else if (type === null && items[i] === ";") {
                            // first level filter type
                            type = "Disjunction";
                        } else if (type === "Conjunction" && items[i] === ";") {
                            // using combination of ! and & without ()
                            throw new Errors.MalformedUriError("Invalid filter " + parts[2]);
                        } else if (type === "Disjunction" && items[i] === "&") {
                            // using combination of ! and & without ()
                            throw new Errors.MalformedUriError("Invalid filter " + parts[2]);
                        } else if (items[i] !== "&" && items[i] !== ";") {
                            // single filter on the first level
                            var binaryFilter = processSingleFilterString(items[i]);
                            filters.push(binaryFilter);
                        }
                    }

                    context.filter = {type: type, filters: filters};
                }
            }

            return context;
        }

        // window.location.origin does not work in IE 11 (surprise, surprise)
        function setOrigin() {
            if (!$window.location.origin) {
                $window.location.origin = $window.location.protocol + "//" + $window.location.hostname + ($window.location.port ? ':' + $window.location.port : '');
            }
        }


        /**
         *
         * @param filterString
         * @returns {*}
         * @desc converts a filter string to ParsedFilter
         */
        function processSingleFilterString(filterString) {
            //check for '=' or '::' to decide what split to use
            if (filterString.indexOf("=") !== -1) {
                var f = filterString.split('=');
                if (f[0] && f[1]) {
                    var filter = new ParsedFilter("BinaryPredicate");
                    filter.setBinaryPredicate(decodeURIComponent(f[0]), "=", decodeURIComponent(f[1]));
                    return filter;
                }
                // invalid filter
                throw new Errors.MalformedUriError("Invalid filter " + filterString);
            } else {
                var f = filterString.split("::");
                if (f.length === 3) {
                    var filter = new ParsedFilter("BinaryPredicate");
                    filter.setBinaryPredicate(decodeURIComponent(f[0]), "::"+f[1]+"::", decodeURIComponent(f[2]));
                    return filter;
                }
                // invalid filter error
                throw new Errors.MalformedUriError("Invalid filter " + filterString);
            }
        }

        /**
         *
         * @param {[String]} filterStrings array representation of conjunction and disjunction of filters
         *     without parenthesis. i.e., ['id=123', ';', 'id::gt::234', ';', 'id::le::345']
         * @return {ParsedFilter}
         *
         */
        function processMultiFilterString(filterStrings) {
            var filters = [];
            var type = null;
            for (var i = 0; i < filterStrings.length; i++) {
                if (type === null && filterStrings[i] === "&") {
                    // first level filter type
                    type = "Conjunction"
                } else if (type === null && filterStrings[i] === ";") {
                    // first level filter type
                    type = "Disjunction";
                } else if (type === "Conjunction" && filterStrings[i] === ";") {
                    // TODO throw invalid filter error (using combination of ! and &)
                    throw new Errors.MalformedUriError("Invalid filter " + filterStrings);
                } else if (type === "Disjunction" && filterStrings[i] === "&") {
                    // TODO throw invalid filter error (using combination of ! and &)
                    throw new Errors.MalformedUriError("Invalid filter " + filterStrings);
                } else if (filterStrings[i] !== "&" && filterStrings[i] !== ";") {
                    // single filter on the first level
                    var binaryFilter = processSingleFilterString(filterStrings[i]);
                    filters.push(binaryFilter);
                }
            }

            var filter = new ParsedFilter(type);
            filter.setFilters(filters);
            return filter;
            //return {type: type, filters: filters};
        }

        function parsedFilterToERMrestFilter(filter, table) {
            if (filter.type === "BinaryPredicate") {
                return new ERMrest.BinaryPredicate(
                    table.columns.get(filter.column),
                    filter.operator,
                    filter.value
                );
            } else {
                // convert nested filter structure to Conjunction or Disjunction filter
                var filters = [];

                if (filter.filters) {
                    for (var i = 0; i < filter.filters.length; i++) {
                        var f = filter.filters[i];
                        var f1 = parsedFilterToERMrestFilter(f, table);
                        filters.push(f1);
                    }
                }

                if (filter.type === "Conjunction") {
                    return new ERMrest.Conjunction(filters);
                } else {
                    return new ERMrest.Disjunction(filters);
                }
            }
        }

        /**
         *
         * This code handles address bar changes
         * Normally when user changes the url in the address bar,
         * nothing happens.
         *
         * This code listens when address bar is changes outside the code,
         * and redirects to the new location.
         *
         * Whenever app updates the url (no reloading and no history stack),
         * it saves the location in $rootScope.location.
         * When address bar is changed, this code compares the address bar location
         * with the last save recordset location. If it's the same, the change of url was
         * done internally, do not refresh page. If not, the change was done manually
         * outside recordset, refresh page.
         *
         */
        function setLocationChangeHandling() {
            $window.onhashchange = function() {
                // when address bar changes by user
                if ($window.location.href !== $rootScope.location) {
                    location.reload();
                }
            };
        }


        function queryStringToJSON(queryString) {
            queryString  = queryString || $window.location.search;
            if (queryString.indexOf('?') > -1){
                queryString = queryString.split('?')[1];
            }
            var pairs = queryString.split('&');
            var result = {};
            pairs.forEach(function(pair) {
                pair = pair.split('=');
                result[pair[0]] = decodeURIComponent(pair[1] || '');
            });
            return result;
        }

        function isBrowserIE() {
            //Internet Explorer 6-11
            return /*@cc_on!@*/false || !!document.documentMode;
        }

        return {
            queryStringToJSON: queryStringToJSON,
            appTagToURL: appTagToURL,
            chaiseURItoErmrestURI: chaiseURItoErmrestURI,
            fixedEncodeURIComponent: fixedEncodeURIComponent,
            parseURLFragment: parseURLFragment,
            setOrigin: setOrigin,
            parsedFilterToERMrestFilter: parsedFilterToERMrestFilter,
            setLocationChangeHandling: setLocationChangeHandling,
            isBrowserIE: isBrowserIE,
            getQueryParams: getQueryParams
        }
    }])

    /**
     *
     * A structure to store parsed filter
     *
     * { type: BinaryPredicate,
     *   column: col_name,
     *   operator: '=' or '::opr::'
     *   value: value
     * }
     *
     * or
     *
     * { type: Conjunction or Disjunction
     *   filters: [array of ParsedFilter]
     * }
     *
     *
     */
    .factory("parsedFilter", [function() {
        function ParsedFilter (type) {
            this.type = type;
        }

        /**
         *
         * @param filters array of binary predicate
         */
        ParsedFilter.prototype.setFilters = function(filters) {
            this.filters = filters;
        };

        /**
         *
         * @param colname
         * @param operator '=', '::gt::', '::lt::', etc.
         * @param value
         */
        ParsedFilter.prototype.setBinaryPredicate = function(colname, operator, value) {
            this.column = colname;
            this.operator = operator;
            this.value = value;
        };

        return ParsedFilter;
    }])

    .factory("DataUtils", ['Errors', function(Errors) {
        /**
         *
         * @param {ERMrest.Page} page
         * @return [Object] array of row values in the form of {isHTML: boolean, value: v}
         */
        function getRowValuesFromPage(page) {
            return page.tuples.map(function(tuple, index, array) {
                var row = [];
                tuple.values.forEach(function(value, index) {
                    row.push({
                        isHTML: tuple.isHTML[index],
                        //value: (tuple.isHTML[index]? $sce.trustAsHtml(value) : value)
                        value: value
                    });
                });
                return row;
            });
        }

        function getRowValuesFromTuples(tuples) {
          return tuples.map(function(tuple, index, array) {
              var row = [];
              tuple.values.forEach(function(value, index) {
                  row.push({
                      isHTML: tuple.isHTML[index],
                      value: value
                  });
              });
              return row;
          });
        }

        /**
         * @param {ERMrest.Tuple[]} tuples - array of tuples
         * @param {ERMrest.ReferenceColumn[]} columns - array of column names
         * @return {Object[]} array of row value arrays [{isHTML: boolean, value: v}, ...]
         */
        function getRowValuesFromTupleData(tuples, columns) {
            var rows = [];
            for (var i = 0; i < tuples.length; i++) {
                var tuple = tuples[i],
                    row = [];

                for (var j = 0; j < columns.length; j++) {
                    var value,
                        column = columns[j];

                    if (column.isPseudo) {
                        var keyColumns;

                        if (column.key) {
                            keyColumns = column.key.colset.columns;
                        } else if (column.foreignKey) {
                            keyColumns =  column.foreignKey.colset.columns;
                        }

                        for (var k = 0; k < keyColumns.length; k++) {
                            var referenceColumn = keyColumns[k];

                            value = tuple.data[referenceColumn.name];

                            row.push({
                                isHTML: false,
                                value: value
                            });
                        }
                    } else {
                        value = tuple.data[column.name];

                        row.push({
                            isHTML: false,
                            value: value
                        });
                    }
                }
                rows.push(row);
            }
            return rows;
        }

        /**
        *
        * @desc Converts the following characters to HTML entities for safe and
        * HTML5-valid usage in the `id` attributes of HTML elements: spaces, ampersands,
        * right angle brackets, left angle brackets, double quotes, single quotes.
        * @param {String} string
        * @return {String} a string suitable for use in the `id` attributes of HTML elements
        */
        function makeSafeIdAttr(string) {
            return String(string)
                .replace(/&/g, '&amp;')
                .replace(/\s/g, '&nbsp;') // any whitespace
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        /**
         * Throws an {InvalidInputError} if test is
         * not `True`.
         * @memberof ERMrest
         * @private
         * @function verify
         * @param {boolean} test The test
         * @param {string} message The message
         * @throws {InvalidInputError} If test is not true.
         */
        function verify(test, message) {
            if (!test) {
                throw new Errors.InvalidInputError(message);
            }
        }

        return {
            getRowValuesFromPage: getRowValuesFromPage,
            getRowValuesFromTupleData: getRowValuesFromTupleData,
            getRowValuesFromTuples: getRowValuesFromTuples,
            makeSafeIdAttr: makeSafeIdAttr,
            verify: verify
        };
    }])

    .factory("UiUtils", [function() {
        /**
         *
         * To allow the dropdown button to open at the top/bottom depending on the space available
         */
        function setBootstrapDropdownButtonBehavior() {
            $(document).on("shown.bs.dropdown", ".btn-group", function () {
                // calculate the required sizes, spaces
                var $ul = $(this).children(".dropdown-menu");
                var $button = $(this).children(".dropdown-toggle");
                var ulOffset = $ul.offset();
                // how much space would be left on the top if the dropdown opened that direction
                var spaceUp = (ulOffset.top - $button.height() - $ul.height()) - $(window).scrollTop();
                // how much space is left at the bottom
                var spaceDown = $(window).scrollTop() + $(window).height() - (ulOffset.top + $ul.height());
                // switch to dropup only if there is no space at the bottom AND there is space at the top, or there isn't either but it would be still better fit
                if (spaceDown < 0 && (spaceUp >= 0 || spaceUp > spaceDown))
                  $(this).addClass("dropup");
            }).on("hidden.bs.dropdown", ".dropdown", function() {
                // always reset after close
                $(this).removeClass("dropup");
            });
        }

        /**
         * Gets all tags with only a src attribute
         * @param element Any element from where to start the function.
         * @returns {Array} An array of Matching element
         */
        function getElements(tag, element) {
            if (!element) throw new Error("No element passed for getImageAndIframes");
            var tags = element.querySelectorAll(tag + '[src]');//Get all tags with src attributes
            var matches = [];
            for (var i = 0, j = tags.length; i < j; i++) {
                var attributes = tags[i].attributes;

                if (attributes[0].name === 'src') {//if the attribute is a src attribute, add it to the matches
                    matches.push(tags[i]);
                }
            }

            return matches; //Matches will now just contain tags with only src attribute
        }

        /**
         * Gets all images and iframe with only a src attribute
         * @param element Any element from where to start the function.
         * @returns {Array} An array of images and iframes
         */
        function getImageAndIframes(element) {
            var images = getElements('img', element);
            var iframes = getElements('iframe', element);
            return images.concat(iframes);
        }

        function humanFileSize(size) {
            var i = Math.floor( Math.log(size) / Math.log(1024) );
            return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
        }

        /**
         *
         *
         */
        function getDisplayType(type) {
            var displayType;

            switch (type.name) {
                case 'timestamp':
                case 'timestamptz':
                    displayType = 'timestamp';
                    break;
                case 'date':
                    displayType = 'date';
                    break;
                case 'float4':
                case 'float8':
                case 'numeric':
                    displayType = 'number';
                    break;
                case 'int2':
                    displayType = 'integer2';
                    break;
                case 'int4':
                    displayType = 'integer4';
                    break;
                case 'int8':
                    displayType = 'integer8';
                    break;
                case 'boolean':
                    displayType = 'boolean';
                    break;
                case 'markdown':
                case 'longtext':
                    displayType = 'longtext';
                    break;
                case 'json':
                case 'jsonb':
                    displayType= 'json';
                    break;
                case 'shorttext':
                default:
                    displayType = type.baseType ? getDisplayType(type.baseType) : 'text';
                    break;
            }
            return displayType;
        }

        return {
            setBootstrapDropdownButtonBehavior: setBootstrapDropdownButtonBehavior,
            getImageAndIframes: getImageAndIframes,
            humanFileSize: humanFileSize,
            getDisplayType: getDisplayType
        }
    }])


    .factory("ContextUtils", [function() {

        function getValueFromContext(object, context) {
            var partial = context,
                parts = context.split("/");
            while (partial !== "") {
                if (partial in object) { // found the context
                    return object[partial];
                }
                parts.splice(-1,1); // remove the last part
                partial = parts.join("/");
            }
            return object["*"];
        }

        return {
            getValueFromContext: getValueFromContext
        }
    }])

    .factory("MathUtils", [function() {
        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min;
        }

        /**
         * Generates a unique uuid
         * @returns {String} a string of length 24
         */
        function uuid() {
            // gets a string of a deterministic length of 4
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000).toString(36);
            }
            return s4() + s4() + s4() + s4() + s4() + s4();
        }

        return {
            getRandomInt: getRandomInt,
            uuid: uuid
        }
    }])

    // directive for including the loading spinner
    .directive('loadingSpinner', function () {
        return {
            restrict: 'E',
            templateUrl: '../common/templates/spinner.html'
        }
    })

    // directive for including a smaller loading spinner with less styling
    .directive('loadingSpinnerSm', function () {
        return {
            restrict: 'A',
            transclude: true,
            templateUrl: '../common/templates/spinner-sm.html'
        }
    })

    // directive to show tooltip when data in the row is truncated
    .directive('chaiseEnableTooltip', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, elem, attrs) {
                $timeout(function () {
                    if (elem[0].scrollWidth > elem[0].offsetWidth) scope.tooltipEnabled = true;
                }, 0);
            }
        }
    }])

    // if a view value is empty string (''), change it to null before submitting to the database
    .directive('emptyToNull', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {
                ctrl.$parsers.push(function(viewValue) {
                    if(viewValue === "") {
                        return null;
                    }
                    return viewValue;
                });
            }
        };
    })

    .directive('onEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                var keyCode = event.which || event.keyCode;

                // If enter key is pressed
                if (keyCode === 13) {
                    scope.$apply(function() {
                        // Evaluate the expression
                        scope.$eval(attrs.onEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    })

    // An "autofocus" directive that applies focus on an element when it becomes visible.
    // A directive is necessary because the HTML5 autofocus attribute (1) isn't
    // uniformly implemented across major modern browsers; (2) doesn't focus the
    // element beyond the first time it's loaded in DOM; and (3) works unreliably
    // for dynamically loaded templates.
    // Use: <input type="text" autofocus>
    .directive('autofocus', ['$timeout', function($timeout) {
        return {
            restrict: 'A',
            link: function(scope, element) {
                var focusPromise;
                // When element becomes visible, schedule an event to focus the element
                var unbindWatch = scope.$watch(function() {
                    return element.is(':visible');
                }, function(visible) {
                    if (visible == true) {
                        focusPromise = $timeout(function() {
                            element[0].focus();
                        }, 0, false);
                    }
                });

                // Once element has been focus, there's no need to watch its visibility anymore.
                // So we deregister the watch.
                element.on('focus', function() {
                    unbindWatch();
                });

                // When this element is destroyed, cancel any scheduled focus events and deregister the watch.
                element.on('$destroy', function() {
                    unbindWatch();
                    if (focusPromise) {
                        $timeout.cancel(focusPromise);
                    }
                });
            }
        };
    }])

    .service('headInjector', ['$window', 'MathUtils', function($window, MathUtils) {
        function addCustomCSS() {
            if (chaiseConfig['customCSS'] !== undefined) {
                var fileref = document.createElement("link");
                fileref.setAttribute("rel", "stylesheet");
                fileref.setAttribute("type", "text/css");
                fileref.setAttribute("href", chaiseConfig['customCSS']);
                document.getElementsByTagName("head")[0].appendChild(fileref);
            }
        }

        function addTitle() {
            if (chaiseConfig.headTitle !== undefined) {
                document.getElementsByTagName('head')[0].getElementsByTagName('title')[0].innerHTML = chaiseConfig.headTitle;
            }
        }

        // sets the WID if it doesn't already exist
        function setWindowName() {
            if (!$window.name) {
                $window.name = MathUtils.uuid();
            }
        }

        function setupHead() {
            addCustomCSS();
            addTitle();
            setWindowName();
        }

        return {
            addCustomCSS: addCustomCSS,
            addTitle: addTitle,
            setWindowName: setWindowName,
            setupHead: setupHead
        };
    }]);
})();
