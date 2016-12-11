(function() {
    'use strict';

    angular.module('chaise.utils', [])

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
        "entry": "/recordedit"
    })

    .factory('UriUtils', ['$injector', '$window', 'parsedFilter', '$rootScope', 'appTagMapping', 'appContextMapping', 'ContextUtils',
        function($injector, $window, ParsedFilter, $rootScope, appTagMapping, appContextMapping, ContextUtils) {

            var chaiseBaseURL;
        /**
         * @function
         * @param {Object} location - location Object from the $window resource
         * @desc
         * Converts a chaise URI to an ermrest resource URI object
         */
        function chaiseURItoErmrestURI(location) {
            var tableMissing = "No table specified in the form of 'schema-name:table-name' and no Default is set.",
                catalogMissing = "No catalog specified and no Default is set.";

            var hash = location.hash,
                ermrestUri = {},
                catalogId;

            // If hash has ?prefill or &prefill parameter, remove it
            if (hash.indexOf('prefill=') !== -1) {
                var startIndex = hash.indexOf('prefill=');
                var stopIndex = hash.indexOf('&', startIndex);
                if (stopIndex !== -1) {
                    hash = hash.substring(0, startIndex) + hash.substring(stopIndex + 1);
                } else {
                    hash = hash.substring(0, startIndex - 1);
                }
            }

            // If hash has ?copy or &copy parameter, remove it
            if (hash.indexOf('copy=') !== -1) {
                var startIndex = hash.indexOf('copy=');
                var stopIndex = hash.indexOf('&', startIndex);
                if (stopIndex !== -1) {
                    hash = hash.substring(0, startIndex) + hash.substring(stopIndex + 1);
                } else {
                    hash = hash.substring(0, startIndex - 1);
                }
            }

            // If the hash is empty, check for defaults
            if (hash == '' || hash === undefined || hash.length == 1) {
                if (chaiseConfig.defaultCatalog) {
                    if (chaiseConfig.defaultTables) {
                        catalogId = chaiseConfig.defaultCatalog;

                        var tableConfig = chaiseConfig.defaultTables[catalogId];
                        hash = '/' + fixedEncodeURIComponent(tableConfig.schema) + ':' + fixedEncodeURIComponent(tableConfig.table);
                    } else {
                        // no defined or default schema:table
                        throw new Error(tableMissing);
                    }
                } else {
                    // no defined or default catalog
                    throw new Error(catalogMissing);
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
                        throw new Error(catalogMissing);
                    }
                }

                // there is no '/' character (only a catalog id) or a trailing '/' after the id
                if (hash.indexOf('/') === -1 || hash.substring(hash.indexOf('/')).length === 1) {
                    // check for default Table
                    if (chaiseConfig.defaultTables) {
                        var tableConfig = chaiseConfig.defaultTables[catalogId];
                        hash = '/' + fixedEncodeURIComponent(tableConfig.schema) + ':' + fixedEncodeURIComponent(tableConfig.table);
                    } else {
                        // no defined or default schema:table
                        throw new Error(tableMissing);
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
            })
        }

        /**
         * given an app tag and location object, return the full url
         * @param {string} tag
         * @param {ERMrest.Location} location
         * @param {string} context - optional, used to determine default app is tag is null/undefined
         * @returns {string} url
         */
        function appTagToURL(tag, location, context) {
            if (!chaiseBaseURL)
                chaiseBaseURL = $window.location.href.replace($window.location.hash, '');
            chaiseBaseURL = chaiseBaseURL.replace("/" + $rootScope.context.appName + "/", '');
            var appPath;
            if (!tag && context) {
                appPath = ContextUtils.getValueFromContext(appContextMapping, context);
            } else if (tag) {
                appPath = appTagMapping[tag];
            } else {
                return undefined;
            }

            return chaiseBaseURL + appPath + "/#" + fixedEncodeURIComponent(location.catalog) + "/" + location.path;
        }

        /**
         * @function
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

            // Then, parse the URL fragment id (aka, hash). Expected format:
            //  "#catalog_id/[schema_name:]table_name[/{attribute::op::value}{&attribute::op::value}*][@sort(column[::desc::])]"
            var hash = location.hash;
            var uri = hash;
            if (hash === undefined || hash == '' || hash.length == 1) {
                return context;
            }

            // parse out modifiers, expects in order of sort, paging, limit, prefill, and copy
            // copy will always be followed by a colname and val modifier
            var modifiers = ["@sort(", "@before(", "@after", "?limit=", "?prefill=", "&prefill=", "?copy", "&copy"];
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
                        throw new Error("Invalid URL. Paging modifier requires @sort");
                    }

                }

                // extract @after
                if (modifierPath.indexOf("@after(") !== -1) {
                    if (context.paging)
                        throw new Error("Invalid URL. Only one paging modifier allowed");
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
                        throw new Error("Invalid URL. Paging modifier requires @sort");
                    }
                }

                // extract ?limit
                if (modifierPath.indexOf("?limit=") !== -1) {
                    context.limit = parseInt(modifierPath.match(/\?limit=([0-9]*)/)[1]);
                }

                // extract ?prefill or &prefill
                var prefills = ['?prefill=', '&prefill='];
                prefills.forEach(function(query) {
                    if (modifierPath.indexOf(query) !== -1) {
                        var startIndex = modifierPath.indexOf(query) + query.length;
                        var stopIndex = modifierPath.indexOf('&', startIndex);
                        if (stopIndex !== -1) {
                            context.prefill = modifierPath.substring(startIndex, stopIndex);
                        } else {
                            context.prefill = modifierPath.substring(startIndex);
                        }
                    }
                });

                // extract ?copy or &copy
                var copies = ["?copy=", "&copy="];
                copies.forEach(function(copy) {
                    if (modifierPath.indexOf(copy) !== -1) {
                        var startIndex = modifierPath.indexOf(copy) + copy.length;
                        var stopIndex = modifierPath.indexOf('&', startIndex);
                        if (stopIndex !== -1) {
                            context.copy = modifierPath.substring(startIndex, stopIndex);
                        } else {
                            context.copy = modifierPath.substring(startIndex);
                        }
                    }
                });
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

                // if a single filter
                if (items.length === 1) {
                    context.filter = processSingleFilterString(items[0]);

                } else {
                    var filters = [];
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
                            throw new Error("Invalid filter " + parts[2]);
                        } else if (type === "Disjunction" && items[i] === "&") {
                            // using combination of ! and & without ()
                            throw new Error("Invalid filter " + parts[2]);
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
                } else {
                    // invalid filter
                    throw new Error("Invalid filter " + filterString);
                }
            } else {
                var f = filterString.split("::");
                if (f.length === 3) {
                    var filter = new ParsedFilter("BinaryPredicate");
                    filter.setBinaryPredicate(decodeURIComponent(f[0]), "::"+f[1]+"::", decodeURIComponent(f[2]));
                    return filter;
                } else {
                    // invalid filter error
                    throw new Error("Invalid filter " + filterString);
                }
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
                    throw new Error("Invalid filter " + filterStrings);
                } else if (type === "Disjunction" && filterStrings[i] === "&") {
                    // TODO throw invalid filter error (using combination of ! and &)
                    throw new Error("Invalid filter " + filterStrings);
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


        return {
            appTagToURL: appTagToURL,
            chaiseURItoErmrestURI: chaiseURItoErmrestURI,
            fixedEncodeURIComponent: fixedEncodeURIComponent,
            parseURLFragment: parseURLFragment,
            setOrigin: setOrigin,
            parsedFilterToERMrestFilter: parsedFilterToERMrestFilter,
            setLocationChangeHandling: setLocationChangeHandling
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

    .factory("DataUtils", [function() {
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

        return {
            getRowValuesFromPage: getRowValuesFromPage
        }
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

        return {
            setBootstrapDropdownButtonBehavior: setBootstrapDropdownButtonBehavior
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
        }

        return {
            getValueFromContext: getValueFromContext
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

    .service('headInjector', function() {
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
        return {
            addCustomCSS: addCustomCSS,
            addTitle: addTitle
        };
    });
})();
