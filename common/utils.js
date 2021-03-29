(function() {
    'use strict';

    angular.module('chaise.utils', ['chaise.errors'])

    .constant("chaiseConfigPropertyNames", [
        "ermrestLocation", "showAllAttributes", "headTitle", "customCSS", "navbarBrand", "navbarBrandText",
        "navbarBrandImage", "logoutURL", "maxRecordsetRowHeight", "dataBrowser", "defaultAnnotationColor",
        "confirmDelete", "hideSearchTextFacet", "editRecord", "deleteRecord", "defaultCatalog", "defaultTables",
        "signUpURL", "profileURL", "navbarMenu", "sidebarPosition", "attributesSidebarHeading", "userGroups",
        "allowErrorDismissal", "footerMarkdown", "maxRelatedTablesOpen", "showFaceting", "hideTableOfContents",
        "showExportButton", "resolverImplicitCatalog", "disableDefaultExport", "exportServicePath", "assetDownloadPolicyURL",
        "includeCanonicalTag", "systemColumnsDisplayCompact", "systemColumnsDisplayDetailed", "systemColumnsDisplayEntry",
        "logClientActions", "disableExternalLinkModal", "internalHosts", "hideGoToRID", "configRules"
    ])

    .constant("defaultChaiseConfig", {
          "internalHosts": [window.location.host],
          "ermrestLocation": window.location.origin + "/ermrest",
          "headTitle": "Chaise",
          "navbarBrandText": "Chaise",
          "logoutURL": "/",
          "dataBrowser": "/chaise/recordset",
          "maxRecordsetRowHeight": 160,
          "confirmDelete": true,
          "deleteRecord": false,
          "signUpURL": "",
          "profileURL": "",
          "allowErrorDismissal": false,
          "showFaceting": false,
          "hideTableOfContents": false,
          "showExportButton": false,
          "navbarMenu": {},
          "navbarBrand": "",
          "disableDefaultExport": false,
          "exportServicePath": "/deriva/export",
          "disableExternalLinkModal": false,
          "logClientActions": true,
          "hideGoToRID": false,
          "shareCiteAcls": {
              "show": ["*"],
              "enable": ["*"]
          }
    })

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

    .constant("appNames", {
        "RECORD": "record",
        "RECORDSET": "recordset",
        "RECORDEDIT": "recordedit",
        "SEARCH": "search"
    })

    // this constant is used to keep track of our strings that the user is shown
    // so that when one is changed, it is changed in all places.
    // this will make localization easier if we go that route
    .constant("messageMap", {
        "catalogMissing": "No catalog specified and no Default is set.",
        "generalPreconditionFailed": "This page is out of sync with the server. Please refresh the page and try again.",
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
        },
        "previousSession": {
            message: "Your login session has expired. You are now accessing data anonymously. <a ng-click='login()'>Log in</a> to continue your privileged access."
        },
        "noSession": {
            title: "You need to be logged in to continue."
        },
        "clickActionMessage": {
            "continueMessageReload": "Click <b>Reload</b> to start over with the identity ",
            "anonContinueMessageReload": "Click <b>Reload</b> to start over with limited anonymous access; or",
            "continueMessage1": "Click <b>Continue</b> to continue as ",
            "continueMessage2": ' after you restore your login status. Instructions on how to restore login is in the <a id="switch-user-accounts-link" ng-click="ctrl.switchUserAccounts()">Switch User Accounts Document</a>.',
            "anonContinueMessage": "Click <b>Login</b> to login and continue access as ",
            "dismissDialog": "Click <b>OK</b> to dismiss this dialog.",
            "loginOrDismissDialog": "Click <a ng-click='ctrl.login()'>Login</a> to log in to the system, or click <b>OK</b> to dismiss this dialog.",
            "messageWReplace": "Click <b>OK</b> to reload this page without @errorStatus.",
            "multipleRecords": "Click <b>OK</b> to show all the matched records.",
            "noRecordsFound": "Click <b>OK</b> to show the list of all records.",
            "okBtnMessage": "Click <b>OK</b> to go to the Recordset.",
            "pageRedirect": "Click <b>OK</b> to go to the ",
            "reloadMessage": "Click <b>Reload</b> to start over."
        },
        "errorMessageMissing": "An unexpected error has occurred. Please try again",
        "tableMissing": "No table specified in the form of 'schema-name:table-name' and no Default is set.",
        "maybeNeedLogin": "You may need to login to see the model or data.",
        "maybeUnauthorizedMessage" : "You may not be authorized to view this record (or records).",
        "unauthorizedMessage" : "You are not authorized to perform this action.",
        "reportErrorToAdmin" : " Please report this problem to your system administrators.",
        "noRecordForFilter" : "No matching record found for the given filter or facet.",
        "noRecordForRid" : "No matching record found for the given RID.",
        "loginRequired": "Login Required",
        "permissionDenied": "Permission Denied",
        "loginStatusChanged": "Unexpected Change of Login Status",
        "unauthorizedErrorCode" : "Unauthorized Access",
        "localStorageDisabled": "localStorage is disabled by the browser settings. Some features might not work as expected",
        "showErrDetails" : "Show Error Details",
        "hideErrDetails" : "Hide Error Details",
        "tooltip": {
            versionTime: "You are looking at data that was snapshotted ",
            downloadCSV: "Click to download all matched results",
            permalink: "Click to copy the current url to clipboard.",
            actionCol: "Click on the action buttons to view, edit, or delete each record",
            viewCol: "Click on the icon to view the detailed page associated with each record",
            null: "Search for any record with no value assigned",
            empty: "Search for any record with the empty string value",
            notNull: "Search for any record that has a value",
            showMore: "Click to show more available filters",
            showDetails: "Click to show more details about the filters"
        },
        "URLLimitMessage": "Maximum URL length reached. Cannot perform the requested action.",
        "queryTimeoutList": "<ul class='show-list-style'><li>Reduce the number of facet constraints.</li><li>Minimize the use of 'No value' and 'All Records with Value' filters.</li></ul>",
        "queryTimeoutTooltip": "Request timeout: data cannot be retrieved. Refresh the page later to try again."
    })

    // NOTE since this has been used with ng-switch in the code, and we cannot
    // have expressions in ng-switch-when, if you want to update the values,
    // make sure to update the templates that are using this: table.html, ellipsis.html
    .constant("modalBox", {
        noSelect: "no-select",
        singleSelectMode:"single-select",
        multiSelectMode:"multi-select"
    })

    // NOTE since this has been used with ng-switch in the code, and we cannot
    // have expressions in ng-switch-when, if you want to update the values,
    // make sure to update the templates that are using this: recordset.html, recordsetSelectFaceting.html
    .constant("recordsetDisplayModes", {
        fullscreen: "fullscreen",
        table: "table",
        related: "related",
        inline: "related/inline",
        popup: "popup",
        foreignKeyPopup: "popup/foreignkey",
        foreignKeyPopupCreate: "popup/foreignkey/create",
        foreignKeyPopupEdit: "popup/foreignkey/edit",
        addPureBinaryPopup: "popup/purebinary/add",
        facetPopup: "popup/facet"
    })

    .constant("defaultDisplayname", {
        null: "<i>No value </i>",
        empty: "<i>Empty</i>",
        notNull: "<i>All records with value </i>"
    })

    .constant("dataFormats", {
        placeholder: {
            date: "YYYY-MM-DD",
            time: "HH:MM:SS"
        },
        date: "YYYY-MM-DD",
        time12: "hh:mm:ss", // used for displaying values in recordedit properly
        time24: "HH:mm:ss",
        datetime:  {
            display: "YYYY-MM-DD HH:mm:ss",
            displayZ: "YYYY-MM-DD HH:mm:ssZ",
            return: "YYYY-MM-DDTHH:mm:ssZ", // the format that the database returns when there are no fractional seconds to show
            submission: "YYYY-MM-DDTHH:mm:ss.SSSZ"
        }
    })

    // Specifies the regexes to be used for a token in a ui-mask input. For example, the '1' key in
    // in vm.maskOptions.date means that only 0 or 1 is allowed wherever the '1' key is used in a ui-mask template.
    // See the maskDefinitions section for more info: https://github.com/angular-ui/ui-mask.
    .constant("maskOptions", {
        date: {
            mask: "2999-19-39",
            options: {
                maskDefinitions: {'1': /[0-1]/, '2': /[0-2]/, '3': /[0-3]/},
                clearOnBlur: true,
                allowInvalidValue: true
            }
        },
        time: {
            mask: "19:59:69",
            options: {
                maskDefinitions: {'1': /[0-1]/, '2': /[0-2]/, '5': /[0-5]/},
                clearOnBlur: true,
                allowInvalidValue: true
            }
        }
    })

    .constant("integerLimits", {
        INT_2_MIN: -32768,
        INT_2_MAX: 32767,
        INT_4_MIN: -2147483648,
        INT_4_MAX: 2147483647,
        INT_8_MIN: -9223372036854775808,
        INT_8_MAX: 9223372036854775807
    })

    // should be used in combination with ng-bind-html
    // if we use ng-bind-html without this filter:
    //  - it will throw error when encounterd and "unsafe" html, while with this, we fail silently.
    //  - it might ignore style tags
    .filter('trustedHTML', ['$sce', function($sce){
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }])

    .factory('UriUtils', ['appContextMapping', 'appTagMapping', 'ConfigUtils', 'ContextUtils', 'defaultChaiseConfig', 'Errors', 'messageMap', 'parsedFilter', '$injector', '$rootScope', '$window',
        function(appContextMapping, appTagMapping, ConfigUtils, ContextUtils, defaultChaiseConfig, Errors, messageMap, ParsedFilter, $injector, $rootScope, $window) {

        function getCatalogId() {
            var catalogId = "",
                cc = ConfigUtils.getConfigJSON();

            try {
                catalogId += chaiseURItoErmrestURI($window.location, true).catalogId;
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
         * @returns {string|Object}
         * if returnObject = true: an object with the following attributes:
         *  - 'ermrestURI': the uri that should be used for communicating with ermrestjs
         *  - `isQueryParameter`: whether the hash was written using ? (not #)
         *  - `ppid`, 'pcid', `paction`: parent context
         *  - `queryParams`: an object containing query parameters of the url.
         *                   The keys are query params names, and value either a
         *                   string value or an array containing multiple strings.
         * otherwise it will return the ermrest uri string.
         * @throws {MalformedUriError} if table or catalog data are missing.
         */
        function chaiseURItoErmrestURI(location, returnObject, dontDecodeQueryParams) {
            var tableMissing = messageMap.tableMissing,
                catalogMissing = messageMap.catalogMissing,
                chaiseConfig = ConfigUtils.getConfigJSON();

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
                queryParams = {},
                queryParamsString = "",
                catalogId, ppid, pcid, paction;

            // remove query params other than limit
            if (hash && hash.indexOf('?') !== -1) {
                queryParamsString = hash.match(/\?(.+)/)[1];
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
                            if(ERMrest){
                                throw new ERMrest.MalformedURIError(tableMissing);
                            } else{
                                throw new Errors.MalformedUriError(tableMissing);
                            }

                        }
                    } else {
                        // no defined or default schema:table
                        if(ERMrest){
                            throw new ERMrest.MalformedURIError(tableMissing);
                        } else{
                            throw new Errors.MalformedUriError(tableMissing);
                        }
                    }
                } else {
                    // no defined or default catalog
                    if(ERMrest){
                        throw new ERMrest.MalformedURIError(catalogMissing);
                    } else{
                        throw new Errors.MalformedUriError(catalogMissing);
                    }
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
                        if(ERMrest){
                            throw new ERMrest.MalformedURIError(catalogMissing);
                        } else{
                            throw new Errors.MalformedUriError(catalogMissing);
                        }
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
                            if(ERMrest){
                                throw new ERMrest.MalformedURIError(tableMissing);
                            } else{
                                throw new Errors.MalformedUriError(tableMissing);
                            }
                        }
                    } else {
                        // no defined or default schema:table
                        if(ERMrest){
                            throw new ERMrest.MalformedURIError(tableMissing);
                        } else{
                            throw new Errors.MalformedUriError(tableMissing);
                        }

                    }
                } else {
                    // grab the end of the hash from: '.../<schema-name>...'
                    hash = hash.substring(hash.indexOf('/'));
                }
            }

            var baseUri = chaiseConfig.ermrestLocation;
            var path = '/catalog/' + catalogId + '/entity' + hash;

            if (returnObject) {
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
            } else {
                return baseUri + path;
            }
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
            var appPath;
            if (tag && (tag in appTagMapping)) {
                appPath = appTagMapping[tag];
            } else {
                appPath = ContextUtils.getValueFromContext(appContextMapping, context);
            }

            var url = chaiseBaseURL() + appPath + "/#" + location.catalog + "/" + location.path;
            var pcontext = [];

            var settingsObj = ConfigUtils.getSettings();
            var contextHeaderParams = ConfigUtils.getContextHeaderParams();
            pcontext.push("pcid=" + contextHeaderParams.cid);
            pcontext.push("ppid=" + contextHeaderParams.pid);
            // only add the value to the applink function if it's true
            if (settingsObj.hideNavbar) pcontext.push("hideNavbar=" + settingsObj.hideNavbar)

            // TODO we might want to allow only certian query parameters
            if (location.queryParamsString) {
                url = url + "?" + location.queryParamsString;
            }
            if (pcontext.length > 0) {
                url = url + (location.queryParamsString ? "&" : "?") + pcontext.join("&");
            }
            return url;
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
            var chaiseConfig = ConfigUtils.getConfigJSON();
            var i, row, value;
            if (!context) {
                var context = ConfigUtils.getContextJSON();
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
            var hash = chaiseURItoErmrestURI(location, true).hash;
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
                        if(ERMrest){
                            throw new ERMrest.MalformedURIError(messageMap.pagingModifierRequiresSort);
                        } else{
                            throw new Errors.MalformedUriError(messageMap.pagingModifierRequiresSort);
                        }
                    }

                }

                // extract @after
                if (modifierPath.indexOf("@after(") !== -1) {
                    if (context.paging)
                        if(ERMrest){
                            throw new ERMrest.MalformedURIError(messageMap.onePagingModifier);
                        } else{
                            throw new Errors.MalformedUriError(messageMap.onePagingModifier);
                        }
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
                        if(ERMrest){
                            throw new ERMrest.MalformedURIError(messageMap.pagingModifierRequiresSort);
                        } else{
                            throw new Errors.MalformedUriError(messageMap.pagingModifierRequiresSort);
                        }

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

                            if(ERMrest){
                                throw new ERMrest.MalformedURIError("Invalid filter " + parts[2]);
                            } else{
                                throw new Errors.MalformedUriError("Invalid filter " + parts[2]);
                            }

                        } else if (type === "Disjunction" && items[i] === "&") {
                            // using combination of ! and & without ()
                            if(ERMrest){
                                throw new ERMrest.MalformedURIError("Invalid filter " + parts[2]);
                            } else{
                                throw new Errors.MalformedUriError("Invalid filter " + parts[2]);
                            }
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

                if(ERMrest){
                    throw new ERMrest.MalformedURIError("Invalid filter " + filterString);
                } else{
                    throw new Errors.MalformedUriError("Invalid filter " + filterString);
                }
            } else {
                var f = filterString.split("::");
                if (f.length === 3) {
                    var filter = new ParsedFilter("BinaryPredicate");
                    filter.setBinaryPredicate(decodeURIComponent(f[0]), "::"+f[1]+"::", decodeURIComponent(f[2]));
                    return filter;
                }
                // invalid filter error
                if(ERMrest){
                    throw new ERMrest.MalformedURIError("Invalid filter " + filterString);
                } else{
                    throw new Errors.MalformedUriError("Invalid filter " + filterString);
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
                    if(ERMrest){
                        throw new ERMrest.MalformedURIError("Invalid filter " + filterStrings);
                    } else{
                        throw new Errors.MalformedUriError("Invalid filter " + filterStrings);
                    }
                } else if (type === "Disjunction" && filterStrings[i] === "&") {
                    // TODO throw invalid filter error (using combination of ! and &)
                    if(ERMrest){
                        throw new ERMrest.MalformedURIError("Invalid filter " + filterStrings);
                    } else{
                        throw new Errors.MalformedUriError("Invalid filter " + filterStrings);
                    }
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

        // Takes any string, finds the '?' character, and splits all content after '?' assuming they are in the form of key=value&key2=value&...
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

        /**
         * Takes pathname attribute of window.location object and returns app name
         * path should be a string literal which appears before #catalog id in URL (/chaise/recordset/)
         * if the path ends with /folder/file.html it will return the folder.
         * (any other pattern will just return anything after last `/`)
        */
        function appNamefromUrlPathname(path){
          var newPath = path.slice(0, -1);
          var lastSlash = newPath.lastIndexOf('/');
          var name = newPath.substring(lastSlash + 1, newPath.length);
          if (name.endsWith(".htm")) {
              return appNamefromUrlPathname(newPath.substring(0, lastSlash) + "/");
          }
          return name;
        }

        // Takes path and creates full redirect links with catalogId
        function createRedirectLinkFromPath(path){
          return $window.location.origin + $window.location.pathname + '#' + chaiseURItoErmrestURI($window.location, true).catalogId + "/" + path;
        }

        /**
         * Gives the path of the chaise deployment directory.
         *   - It returns the chaise path mentioned in the context (based on chaiseBasePath meta tag)
         *   - otherwise, returns the default value '/chaise/'
         * Assume this function will return a value with a leading and trailing `/`
         */
        function chaiseDeploymentPath() {
            if (typeof chaiseBuildVariables === "object" && typeof chaiseBuildVariables.chaiseBasePath === "string") {
                var path = chaiseBuildVariables.chaiseBasePath;
                if(path[path.length-1] !== "/")
                    path = path + "/";
                return path;
            } else {
                return '/chaise/';
            }
        }

        /**
         * Returns the path that openseadragon-viewer is installed
         */
        function OSDViewerDeploymentPath() {
            if (typeof chaiseBuildVariables === "object" && typeof chaiseBuildVariables.OSDViewerBasePath === "string") {
                return chaiseBuildVariables.OSDViewerBasePath;
            } else {
                return '/openseadragon-viewer/';
            }
        }

        /**
         * Returns the chaise base url without the trailing slash
         * TODO we might want to find a better way instead of this.
         * @return {String}
         */
        function chaiseBaseURL() {
            var res = $window.location.origin + chaiseDeploymentPath();
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
        function resolvePermalink(tuple, reference, version) {
            var chaiseConfig = ConfigUtils.getConfigJSON();
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
                return $window.location.origin + "/id/" + tuple.data.RID + (version ? version : "");
            }

            // if resolverId is false or undefined OR any other values that are not allowed use the default
            // default is to show the fully qualified resolveable link for permalink
            return $window.location.origin + "/id/" + currCatalog + "/" + tuple.data.RID + (version ? version : "");
        }

        // if '?' is used instead of '#' (?catalog/schema:table), return in the proper form (#catalog/schema:table)
        function getHash(location) {
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
        function splitVersionFromCatalog(id) {
            var split = id.split('@');

            return {
                catalog: split[0],
                version: split[1]
            }
        }

        /**
         * @param {String} hash - window.location.hash string
         */
        function stripSortAndQueryParams(hash) {
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
        function getQueryParam(url, key) {
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
        function getQueryParams(url, dontDecodeQueryParams) {
            var params = {};
            var idx = url.lastIndexOf("?");
            if (idx !== -1) {
                var queries = url.slice(idx+1).split("&");
                for (var i = 0; i < queries.length; i++) {
                    var q_parts = queries[i].split("=");
                    if (q_parts.length != 2) continue;

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
        function queryParamsToString(queryParams, dontEncodeQueryParams) {
            var res = [];
            var addKeyValue = function(k, v) {
                if (dontEncodeQueryParams) {
                    res.push(k + "=" + v);
                } else {
                    res.push(fixedEncodeURIComponent(k) + "=" + fixedEncodeURIComponent(v));
                }
            }

            for (var k in queryParams) {
                if (Array.isArray(queryParams[k])) {
                    queryParams[k].forEach(function (q) {
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
        function isSameOrigin(url) {
            var currentOrigin = $window.location.origin;

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
        function getRecordsetLink(reference) {
            // before run, use window location
            if (!reference) {
                return $window.location.href;
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
            var settings = ConfigUtils.getSettings();
            if (settings.hideNavbar) {
                url = url + (reference.location.queryParamsString ? "&" : "?") + "hideNavbar=" + settings.hideNavbar;
            }

            return url;
        }

        /**
         * Given a url, will return it if it's absolute, otherwise will
         * attach the current origin (if origin is not passed) to it.
         */
        function getAbsoluteURL(uri, origin) {
            if (typeof origin !== 'string' || origin.length < 1) {
                origin = $window.location.origin;
            }

            // A more universal, non case-sensitive, protocol-agnostic regex
            // to test a URL string is relative or absolute
            var r = new RegExp('^(?:[a-z]+:)?//', 'i');

            // The url is absolute so don't make any changes and return it as it is
            if (r.test(uri))  return uri;

            // If uri starts with "/" then simply prepend the server uri
            if (uri.indexOf("/") === 0)  return origin + uri;

            // else prepend the server uri with an additional "/"
            return origin + "/" + uri;
        }

        return {
            appNamefromUrlPathname: appNamefromUrlPathname,
            appTagToURL: appTagToURL,
            chaiseBaseURL: chaiseBaseURL,
            chaiseDeploymentPath: chaiseDeploymentPath,
            chaiseURItoErmrestURI: chaiseURItoErmrestURI,
            createRedirectLinkFromPath: createRedirectLinkFromPath,
            fixedEncodeURIComponent: fixedEncodeURIComponent,
            getCatalogId: getCatalogId,
            getHash: getHash,
            getQueryParam: getQueryParam,
            getQueryParams: getQueryParams,
            queryParamsToString: queryParamsToString,
            isBrowserIE: isBrowserIE,
            isSameOrigin: isSameOrigin,
            OSDViewerDeploymentPath: OSDViewerDeploymentPath,
            parsedFilterToERMrestFilter: parsedFilterToERMrestFilter,
            parseURLFragment: parseURLFragment,
            queryStringToJSON: queryStringToJSON,
            resolvePermalink: resolvePermalink,
            setLocationChangeHandling: setLocationChangeHandling,
            setOrigin: setOrigin,
            splitVersionFromCatalog: splitVersionFromCatalog,
            stripSortAndQueryParams: stripSortAndQueryParams,
            getRecordsetLink: getRecordsetLink,
            getAbsoluteURL: getAbsoluteURL
        }
    }])

    .factory('FunctionUtils', ['ConfigUtils', 'Session', 'UriUtils', function(ConfigUtils, Session, UriUtils) {
        function registerErmrestCallbacks() {
            ERMrest.appLinkFn(UriUtils.appTagToURL);
            ERMrest.onHTTPSuccess(Session.extendPromptExpirationToken);
            ERMrest.systemColumnsHeuristicsMode(ConfigUtils.systemColumnsMode);

            var chaiseConfig = ConfigUtils.getConfigJSON();
            ERMrest.setClientConfig({
                internalHosts: chaiseConfig.internalHosts,
                disableExternalLinkModal: chaiseConfig.disableExternalLinkModal
            });
        }

        return {
            registerErmrestCallbacks: registerErmrestCallbacks
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
         * Verifies that the object is defined and the containing key/value pair is a non-empty string
         */
        function isObjectAndKeyDefined(obj, keyName) {
            return (obj && typeof obj[keyName] == 'string' && obj[keyName] != '')
        }

        function isNonEmptyObject(obj) {
            return typeof obj === "object" && obj !== null && Object.keys(obj).length > 0;
        }

        /**
         * Verifies that the object is not null and is defined.
         */
        function isObjectAndNotNull(obj) {
            return typeof obj === "object" && obj !== null;
        }

        /**
         * Verifies that the given data is integer
         * @param  {Object}  data
         * @return {Boolean} whether it is integer or not
         */
        function isInteger(data) {
            return (typeof data === 'number') && (data % 1 === 0);
        }

        /**
         * Verifies that the given data is a non-empty string.
         * @param {Object} data
         * @return {Boolean} whether it is non-empty string.
         */
        function isNoneEmptyString (data) {
            return typeof data === "string" && data.length > 0;
        }

        /**
         * return the inner text of a displayname object ({value: string, isHTML:boolean})
         * @param {Object} displayname {value: string, isHTML:boolean}
         * @return {String}
         */
        function getDisplaynameInnerText(displayname) {
            if (!displayname.isHTML) {
                return displayname.value;
            }
            var dummy = document.createElement("div"), res;
            dummy.innerHTML = displayname.value;
            res = dummy.innerText;
            return res;
        }

        var ID_SAFE_REGEX = /[^\w-]+/g;
        /**
        *
        * @desc This function is used to make sure the input `string` is id/class safe
        * For both class and id:
        *   - Must begin with a letter A-Z or a-z
        *   - Can be followed by: letters (A-Za-z), digits (0-9), hyphens ("-"), and underscores ("_")
        * NOTE: this won't ensure the very beginning of the input string is safe
        * it assumes the input string is being appended to an already safe string
        * @param {String} string
        * @return {String} a string suitable for use in the `id` attributes of HTML elements
        */
        function makeSafeIdAttr(string, val) {
            return String(string).replace(ID_SAFE_REGEX, '-');
        }

        /**
        * @desc Converts passed string to a safe HTML string by replacing the following characters to HTML entities:
        * ampersands, right angle brackets, left angle brackets, double quotes, single quotes.
        * @param {String} string
        * @return {String} a string suitable for use in HTML element attributes
        */
        function makeSafeHTML(string){
            return String(string)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        /**
         * Adds space after `;` and `&``
         * @param {String} string
         */
        function addSpaceAfterLogicalOperators(string) {
            return string.replace(/&/g, '& ').replace(/;/g, '; ');
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
              if(ERMrest){
                  throw new ERMrest.InvalidInputError(message);
              } else{
                  throw new Errors.InvalidInputError(message);
              }

            }
        }

        /**
         * @private
         * @function
         * @param  {Object} source the object that you want to be copied
         * @desc
         * Creat a deep copy of the given object.
         * NOTE: This is very limited and only works for simple objects.
         * Some of its limitations are:
         * 1. Cannot copy functions.
         * 2. Cannot work on circular references.
         * 3. Will convert date objects back to UTC in the string representation in the ISO8601 format.
         * 4. It will fail to copy anything that is not in the JSON spec.
         *
         * ONLY USE THIS FUNCTION IF IT IS NOT ANY OF THE GIVEN LIMIATIONS.
         */
        function simpleDeepCopy (source) {
            return JSON.parse(JSON.stringify(source));
        };

        return {
            getRowValuesFromPage: getRowValuesFromPage,
            getRowValuesFromTupleData: getRowValuesFromTupleData,
            getRowValuesFromTuples: getRowValuesFromTuples,
            isObjectAndKeyDefined: isObjectAndKeyDefined,
            isObjectAndNotNull: isObjectAndNotNull,
            isNonEmptyObject: isNonEmptyObject,
            isInteger: isInteger,
            isNoneEmptyString: isNoneEmptyString,
            getDisplaynameInnerText: getDisplaynameInnerText,
            makeSafeIdAttr: makeSafeIdAttr,
            makeSafeHTML: makeSafeHTML,
            addSpaceAfterLogicalOperators: addSpaceAfterLogicalOperators,
            verify: verify,
            simpleDeepCopy: simpleDeepCopy
        };
    }])

    .factory("UiUtils", ['dataFormats', '$document', '$log', '$timeout', '$window', function(dataFormats, $document, $log, $timeout, $window) {

        /**
         * Takes a timestamp in the form of milliseconds since epoch and converts it into a relative string if
         * the timestamp is less than a week old. If more than a week old, the timestamp is displayed as just the date
         *
         * @param {integer} tsMillis - a timestamp in milliseconds
         * @returns {string} either reltive time string or date in format YYYY-MM-DD
         */
        function humanizeTimestamp(tsMillis) {
            var versionTS = moment(tsMillis);
            var weekAgo = moment().subtract(7, 'days').startOf('day');
            // if version is < a week old
            if (versionTS.isAfter(weekAgo)) {
                // find the difference between version and now (will be represented as a negative)
                var timeDiff = versionTS.diff(moment());
                // convert to a negative duration and humanize as if it's from the past
                var displayVal = moment.duration(timeDiff).humanize(true);
            } else {
                var displayVal = versionTS.format(dataFormats.date)
            }

            return displayVal;
        }

        /**
         * @param {integer} tsMillis - a timestamp in milliseconds
         * @returns {string} datetime in format YYYY-MM-DD hh:mm:ss
         */
        function versionDate(tsMillis) {
            return moment(tsMillis).format(dataFormats.datetime.display);
        }

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
         * Recursively sets the display type for inputs (currently for recordedit)
         * @param {Object} type - the type object defining the columns type
         */
        function getInputType(type) {
            var inputType;

            if (type.isArray) {
                return 'array';
            }
            switch (type.name) {
                case 'timestamp':
                case 'timestamptz':
                    inputType = 'timestamp';
                    break;
                case 'date':
                    inputType = 'date';
                    break;
                case 'float4':
                case 'float8':
                case 'numeric':
                    inputType = 'number';
                    break;
                case 'int2':
                    inputType = 'integer2';
                    break;
                case 'int4':
                    inputType = 'integer4';
                    break;
                case 'int8':
                    inputType = 'integer8';
                    break;
                case 'boolean':
                    inputType = 'boolean';
                    break;
                case 'markdown':
                case 'longtext':
                    inputType = 'longtext';
                    break;
                case 'json':
                case 'jsonb':
                    inputType = 'json';
                    break;
                case 'color_rgb_hex':
                    inputType = 'color';
                    break;
                case 'shorttext':
                default:
                    inputType = type.baseType ? getInputType(type.baseType) : 'text';
                    break;
            }
            return inputType;
        }

        /**
         * given a typename string, will return a more human readable version of it.
         * @param  {string} typename
         * @return {string}
         */
        function getSimpleColumnType (typename){
          switch (typename) {
            case "timestamp":
              return "timestamp";
            case "timestamptz":
              return "timestamp with timezone";
            case "date":
              return "date";
            case "float4":
            case "float8":
            case "numeric":
              return "number";
            case "boolean":
              return "boolean";
            case "int2":
            case "int4":
            case "int8":
              return "integer";
            default:
              return "text";
          }
        }

        /**
         * @param   {Node=} parentContainer - the parent container. if undefined `body` will be used.
         * @param   {Node=} parentContainerSticky - the sticky area of parent. if undefined `#navheader` will be used.
         * @param   {boolean} useDocHeight - whether we should use the doc height even if parentContainer is passed.
         * Call this function once the DOM elements are loaded to attach resize sensors that will fix the height of bottom-panel-container
         * If you don't pass any parentContainer, it will use the body
         * It will assume the following structure in the given parentContainer:
         *  - .app-content-container
         *    - .top-panel-container
         *    - .bottom-panel-container
         * Three ResizeSensors will be created for app-content, top-panel and bottom-panel to watch their size change.
         */
        function attachContainerHeightSensors(parentContainer, parentContainerSticky, useDocHeight) {
            try {
                var parentUsableHeight,
                    appContent, // the container that we might set height for if container height is too small
                    container, // the container that we want to set the height for
                    containerSticky; // the sticky part of the container (top-panel-container)

                // if the size of content is way too small, make the whole app-content-container scrollable
                var resetHeight = function () {
                    appContent.style.overflowY = "auto";
                    appContent.style.height = ((parentUsableHeight/$window.innerHeight) * 100) + "vh";
                    container.style.height = "unset";
                }

                var tm;
                // used to ensure we're not calling the setContainerHeightFn multiple times
                var setContainerHeight = function () {
                    if (tm) clearTimeout(tm);

                    tm = setTimeout(function () {
                        setContainerHeightFn();
                    }, 200);
                }

                // the actual function that will change the container height.
                var setContainerHeightFn = function () {
                    parentUsableHeight = useDocHeight ? $window.innerHeight : parentContainer.offsetHeight;

                    // subtract the parent sticky from usable height
                    parentUsableHeight -= parentContainerSticky.offsetHeight;

                    // the sticky part of the container
                    var stickyHeight = 0;
                    if (containerSticky) {
                        stickyHeight = containerSticky.offsetHeight;
                    }

                    var containerHeight = ((parentUsableHeight - stickyHeight) / $window.innerHeight) * 100;
                    if (containerHeight < 15) {
                        resetHeight();
                    } else {
                        //remove the styles that might have been added to appContent
                        appContent.style.overflowY = "unset";
                        appContent.style.height = "unset";

                        // set the container's height
                        container.style.height = containerHeight + 'vh';

                        // now check based on actual pixel size
                        if (container.offsetHeight < 300) {
                            resetHeight();
                        }
                    }
                }

                // get the parentContainer and its usable height
                if (parentContainer == null || parentContainer == document.querySelector("body")) {
                    useDocHeight = true;
                    parentContainer = document;
                }

                // get the parent sticky
                if (parentContainerSticky == null) {
                    parentContainerSticky = document.querySelector("#navheader");
                }

                // the content that we should make scrollable if the content height is too small
                appContent = parentContainer.querySelector(".app-content-container");

                containerSticky = appContent.querySelector(".top-panel-container");
                container = appContent.querySelector(".bottom-panel-container");

                // used to capture the old values of height
                var cache;

                // make sure the main-container has initial height
                setContainerHeightFn();
                cache = {
                    appContentHeight: appContent.offsetHeight,
                    parentContainerStickyHeight: parentContainerSticky.offsetHeight,
                    containerStickyHeight: containerSticky.offsetHeight
                };

                //watch for the parent container height (this act as resize event)
                new ResizeSensor(appContent, function (dimension) {
                    if (appContent.offsetHeight != cache.appContentHeight) {
                        cache.appContentHeight = appContent.offsetHeight;
                        setContainerHeight();
                    }
                });

                // watch for size of the parent sticky section
                new ResizeSensor(parentContainerSticky, function (dimension) {
                    if (parentContainerSticky.offsetHeight != cache.parentContainerStickyHeight) {
                        cache.parentContainerStickyHeight = parentContainerSticky.offsetHeight;
                        setContainerHeight();
                    }
                });

                // watch for size of the sticky section
                new ResizeSensor(containerSticky, function (dimension) {
                    if (containerSticky.offsetHeight != cache.containerStickyHeight) {
                        cache.containerStickyHeight = containerSticky.offsetHeight;
                        setContainerHeight();
                    }
                });


            } catch (err) {
                $log.warn(err);
            }
        }

        /**
         * sets the style of domElements.footer
         * @param {Integer} index - index pertaining to which dom element to select
         * @return {ResizeSensor} ResizeSensor object that can be used to turn it off.
         **/
        function attachFooterResizeSensor(index) {
            try {
                var mainContainer = document.getElementsByClassName('main-container')[index];
                var mainBody = mainContainer.querySelector(".main-body");

                var setFooterTimeout;
                return new ResizeSensor(mainBody, function () {
                    if (setFooterTimeout) clearTimeout(setFooterTimeout);
                    setFooterTimeout = setTimeout(function () {
                        // the footer definition has to be here.
                        // if we move it outside, it will not use the correct footer element
                        var footer = mainContainer.querySelector("footer");

                        // calculate the inner height of the app content (height of children in main-body + footer)
                        if ((mainBody.offsetHeight + footer.offsetHeight + 10) < mainContainer.offsetHeight) {
                            removeClass(footer, "position-relative");
                        } else {
                            addClass(footer, "position-relative");
                        }
                    }, 50);
                });

            } catch(err) {
                $log.warn(err);
            }
        }

        /**
         * @param   {DOMElement} parentContainer - the container that we want the alignment for
         * @return {ResizeSensor} ResizeSensor object that can be used to turn it off.
         *
         * Make sure the `.top-right-panel` and `.main-container` are aligned.
         * They can be missaligned if the scrollbar is visible and takes space.
         */
        function attachMainContainerPaddingSensor(parentContainer) {
            var mainContainer = parentContainer.querySelector(".main-container"),
                topRightPanel = parentContainer.querySelector(".top-right-panel"),
                setPadding, mainContainerPaddingTimeout;

             // timeout makes sure we're not calling this more than we should
            setPadding = function () {
                if (mainContainerPaddingTimeout) clearTimeout(mainContainerPaddingTimeout);
                mainContainerPaddingTimeout = setTimeout(function () {
                    try {
                        var padding = mainContainer.clientWidth - topRightPanel.clientWidth;
                        mainContainer.style.paddingRight = padding + "px";
                    } catch(exp) {}
                }, 10);
            }

            // watch the size of mainContainer
            // (if width of topRightPanel changes, the mainContainer changes too, so just watching mainContainer is enough)
            return new ResizeSensor(mainContainer, setPadding);
        }

        /**
         * Given an element and class name, will remove the class name from element.
         * NOTE added because element.classList.remove is not supported by IE
         * @param  {DOMElement} element
         * @param  {string} className
         */
        function removeClass(element, className) {
            element.className = element.className.split(" ").filter(function (c) {
                return c !== className;
            }).join(" ");
        }

        /**
         * Given an element and class name, will add the class name to element.
         * NOTE added because element.classList.add is not supported by IE
         * @param  {DOMElement} element
         * @param  {string} className
         */
        function addClass(element, className) {
            if (element.className.split(" ").indexOf(className) == -1) {
                element.className += " " + className;
            }
        }

        return {
            humanizeTimestamp: humanizeTimestamp,
            versionDate: versionDate,
            setBootstrapDropdownButtonBehavior: setBootstrapDropdownButtonBehavior,
            getImageAndIframes: getImageAndIframes,
            humanFileSize: humanFileSize,
            getInputType: getInputType,
            getSimpleColumnType: getSimpleColumnType,
            attachFooterResizeSensor: attachFooterResizeSensor,
            attachContainerHeightSensors: attachContainerHeightSensors,
            addClass: addClass,
            removeClass: removeClass,
            attachMainContainerPaddingSensor: attachMainContainerPaddingSensor
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

    .factory("ConfigUtils", ['chaiseConfigPropertyNames', 'defaultChaiseConfig', '$http', '$log', '$rootScope', '$window', function(chaiseConfigPropertyNames, defaultConfig, $http, $log, $rootScope, $window) {
        // List of all accepted chaiseConfig properties in defined case from chaise-config.md

        /**
         * Will return the dcctx object that has the following attributes:
         *  - cid: client id (app name)
         *  - wid: window id
         *  - pid: page id
         *  - chaiseConfig: The chaiseConfig object
         *  - server: An ERMrest.Server object that can be used for http requests
         * @return {Object} dcctx object
         */
        function getContextJSON() {
            return $window.dcctx;
        };

        function getSettings() {
            return getContextJSON().settings;
        }

        function getConfigJSON() {
            return getContextJSON().chaiseConfig;
        };

        /**
         * Chaise Config will be applied in the following order:
         *   1. Define chaise config defaults
         *   2. Look at chaise-config.js
         *     a. Apply base level configuration properties
         *     b. Apply config-rules in order depending on matching host definitions
         *   3. Look at chaise-config returned from the catalog
         *     a. Apply base level configuration properties
         *     b. Apply config-rules in order depending on matching host definitions
         *
         * NOTE: Chaise Config properties can be case-insensitive since we check the properties against a whitelist of accepted property names.
         * If the same property is defined in the same "chaise config" more than once with different case, the latter defined property will be used.
         *
         * For instance, given the below object, defaultCATALOG will be used over defaultCatalog:
         * chaise-config.js = {
         *   "defaultCatalog": 1,
         *   "defaultCATALOG": 2
         * }
         *
         * @params {Object} catalogAnnotation - the chaise-config object returned from the 2019 chaise-config annotation tag attached to the catalog object
         *
         */
        function setConfigJSON(catalogAnnotation) {
            function matchKey(collection, keyToMatch) {
                return collection.filter(function (key) {
                    // toLowerCase both keys for a case insensitive comparison
                    return keyToMatch.toLowerCase() === key.toLowerCase();
                });
            }
            var cc = {};
            // check to see if global chaise-config (chaise-config.js) is available
            if (typeof chaiseConfig != 'undefined') {
                // loop through properties and compare to defaultConfig to see if they are valid
                // chaiseConfigPropertyNames is a whitelist of all accepted values
                for (var key in chaiseConfig) {
                    // see if returned key is in the list we accept
                    var matchedKey = matchKey(chaiseConfigPropertyNames, key);

                    // if we found a match for the current key in chaiseConfig, use the match from chaiseConfigPropertyNames as the key and set the value
                    if (matchedKey.length > 0 && matchedKey[0]) {
                        cc[matchedKey[0]] = chaiseConfig[key];
                    }
                }
            }

            // Loop over default properties (global chaise config (chaise-config.js) may not be defined)
            // Handles case 1 and 2a
            for (var property in defaultConfig) {
                // use chaise-config.js property instead of default if defined
                if (typeof chaiseConfig != 'undefined') {
                    // see if "property" matches a key in chaiseConfig
                    var matchedKey = matchKey(Object.keys(chaiseConfig), property);

                    // property will be in proper case already since it comes from our config object in JS
                    cc[property] = ((matchedKey.length > 0 && matchedKey[0]) ? chaiseConfig[property] : defaultConfig[property]);
                } else {
                    // property doesn't exist
                    cc[property] = defaultConfig[property];
                }
            }

            /**
             * NOTE: defined within function scope so cc is available in the function
             * @params {Object} config - chaise config with configRules defined
             */
            function applyHostConfigRules(config) {
                if (Array.isArray(config.configRules)) {
                    // loop through each config rule and look for a set that matches the current host
                    config.configRules.forEach(function (ruleset) {
                        // we have 1 host
                        if (typeof ruleset.host == "string") {
                            var arr = [];
                            arr.push(ruleset.host);
                            ruleset.host = arr;
                        }
                        if (Array.isArray(ruleset.host)) {
                            for (var i=0; i<ruleset.host.length; i++) {
                                // if there is a config rule for the current host, overwrite the properties defined
                                // $window.location.host refers to the hostname and port (www.something.com:0000)
                                // $window.location.hostname refers to just the hostname (www.something.com)
                                if (ruleset.host[i] === $window.location.hostname && (ruleset.config && typeof ruleset.config === "object")) {
                                    for (var property in ruleset.config) {
                                        var matchedKey = matchKey(chaiseConfigPropertyNames, property);

                                        // if we found a match for the current key in ruleset.config, use the match from chaiseConfigPropertyNames as the key and set the value
                                        if (matchedKey.length > 0 && matchedKey[0]) {
                                            cc[matchedKey[0]] = ruleset.config[property];
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    });
                }
            }

            // case 2b
            // cc contains properties for default config and chaise-config.js configuration
            applyHostConfigRules(cc);


            // apply catalog annotation configuration on top of the rest of the chaise config properties
            if (typeof catalogAnnotation == "object") {
                // case 3a
                for (var property in catalogAnnotation) {
                    var matchedKey = matchKey(chaiseConfigPropertyNames, property);

                    // if we found a match for the current key in catalogAnnotation, use the match from chaiseConfigPropertyNames as the key and set the value
                    if (matchedKey.length > 0 && matchedKey[0]) {
                        cc[matchedKey[0]] = catalogAnnotation[property];
                    }
                }

                // case 3b
                applyHostConfigRules(catalogAnnotation);
            }

            // shareCiteAcls is a nested object, user could define shareCiteAcls:
            //     { show: ["*"] }
            // with no enable array defined
            // make sure the object has both defined and apply the default if one or the other is missing
            if (!cc.shareCiteAcls.show) cc.shareCiteAcls.show = defaultConfig.shareCiteAcls.show;
            if (!cc.shareCiteAcls.enable) cc.shareCiteAcls.enable = defaultConfig.shareCiteAcls.enable;

            if (!$window.dcctx) $window.dcctx = {};
            $window.dcctx.chaiseConfig = cc;
        }

        /**
         * Returns the http service that should be used in chaise
         * NOTE: This has been added for backward compatibility.
         * The window.dcctx.server should always be available if config app has been included
         * TODO this function should return the $window.dcctx.server.http if it's available.
         * But it was causing issues in case of 401 and we reverted it for now.
         * @return {Object}
         */
        function getHTTPService() {
            return getContextJSON().server ? getContextJSON().server.http : $http;
        };

        function getContextHeaderParams() {
            return getContextJSON().contextHeaderParams;
        }

        function configureAngular(compileProvider, cookiesProvider, logProvider, uibTooltipProvider) {
            // angular configurations
            // allows unsafe prefixes to be downloaded
            // full regex: "/^\s*(https?|ftp|mailto|tel|file|blob):/"
            compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|blob):/);
            cookiesProvider.defaults.path = '/';
            logProvider.debugEnabled(getConfigJSON().debug === true);
            // Configure all tooltips to be attached to the body by default. To attach a
            // tooltip on the element instead, set the `tooltip-append-to-body` attribute
            // to `false` on the element.
            uibTooltipProvider.options({appendToBody: true});
        }

        function decorateTemplateRequest(delegate, chaiseDeploymentPath) {
            // return a function that will be called when a template needs t be fetched
            return function(templateUrl) {
                var version = "";
                if (typeof chaiseBuildVariables === "object") {
                    version = chaiseBuildVariables.buildVersion;
                }
                var versionedTemplateUrl = templateUrl + (templateUrl.indexOf(chaiseDeploymentPath) !== -1 ? "?v=" + version : "");

                return delegate(versionedTemplateUrl);
            }
        }

        /**
         * Given the context, returns the value of the chaise config property for system column heuristics
         * @params {String} context - the current app context
         * @return {boolean|Array|null} boolean - value to show or hide all system columns
         *                              Array - order of which columns to show
         *                              null - no value defined for the current context
         */
        function systemColumnsMode(context) {
            var cc = getConfigJSON();

            var mode = null;
            if (context.indexOf('compact') != -1 && cc.systemColumnsDisplayCompact) {
                mode = cc.systemColumnsDisplayCompact;
            } else if (context == 'detailed' && cc.systemColumnsDisplayDetailed) {
                mode = cc.systemColumnsDisplayDetailed;
            } else if (context.indexOf('entry') != -1 && cc.systemColumnsDisplayEntry) {
                mode = cc.systemColumnsDisplayEntry;
            }

            return mode;
        }

        return {
            configureAngular: configureAngular,
            decorateTemplateRequest: decorateTemplateRequest,
            getContextJSON: getContextJSON,
            getConfigJSON: getConfigJSON,
            setConfigJSON: setConfigJSON,
            getHTTPService: getHTTPService,
            getContextHeaderParams: getContextHeaderParams,
            systemColumnsMode: systemColumnsMode,
            getSettings: getSettings
        }
    }])

    // directive for including the loading spinner
    .directive('loadingSpinner', ['UriUtils', function (UriUtils) {
        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/spinner.html',
            scope: {
                message: "@?"
            },
            link: function (scope, elem, attrs) {
                scope.spinnerPath = UriUtils.chaiseDeploymentPath() + "common/styles/images/loader.gif";
            }
        }
    }])

    // directive for including a smaller loading spinner with less styling
    .directive('loadingSpinnerSm', ['UriUtils', function (UriUtils) {
        return {
            restrict: 'A',
            transclude: true,
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/spinner-sm.html',
            scope: {
                message: "@?"
            }
        }
    }])

    // directive to show tooltip when data in the row is truncated because of width limitations
    .directive('chaiseEnableTooltipWidth', ['$timeout', function ($timeout) {
        function toggleTooltipWidth (scope, elem) {
            scope.tooltipEnabled = elem[0].scrollWidth > elem[0].offsetWidth;
        }

        return {
            restrict: 'A',
            link: function (scope, elem, attrs) {
                $timeout(function () {
                    toggleTooltipWidth(scope, elem);
                }, 0);

                scope.$watch(function () {
                    return elem[0].offsetWidth;
                }, function (value) {
                    toggleTooltipWidth(scope, elem);
                });
            }
        }
    }])

    // directive to show tooltip when data in the row is truncated because of height limitations
    .directive('chaiseEnableTooltipHeight', ['$timeout', function ($timeout) {
        function toggleTooltipHeight (scope, elem) {
            scope.tooltipEnabled = elem[0].scrollHeight > elem[0].offsetHeight;
        }

        return {
            restrict: 'A',
            link: function (scope, elem, attrs) {
                $timeout(function () {
                    toggleTooltipHeight(scope, elem);
                }, 0);

                scope.$watch(function () {
                    return elem[0].offsetHeight;
                }, function (value) {
                    toggleTooltipHeight(scope, elem);
                });
            }
        }
    }])

    .directive('chaiseSearchInput', ['logService', 'UriUtils', '$timeout', function (logService, UriUtils, $timeout) {

        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/searchInput.html',
            scope: {
                searchTerm: "=",
                searchCallback: "&",
                inputClass: "@",
                searchColumns: "=",
                focus: "=",
                disabled: "="
            },
            link: function (scope, elem, attrs) {
                var AUTO_SEARCH_TIMEOUT = 2000;
                scope.inputChangedPromise = null;
                scope.inputElement = elem[0].querySelector("input");
                scope.isArray = angular.isArray;

                // unrwap the callback function
                scope.searchCallback = scope.searchCallback();

                scope.changeFocus = function () {
                    if (scope.disabled) return;
                    scope.inputElement.focus();
                }

                // will be called when users click on enter or submit button
                scope.enterPressed = function(isButton) {
                    if (scope.disabled) return;

                    // cancel the timeout
                    if (scope.inputChangedPromise) {
                        $timeout.cancel(scope.inputChangedPromise);
                    }

                    // remove it from scope
                    scope.inputChangedPromise = null;

                    scope.searchCallback(scope.searchTerm, isButton ? logService.logActions.SEARCH_BOX_CLICK : logService.logActions.SEARCH_BOX_ENTER);
                };

                // will be called everytime users change the input
                scope.inputChanged = function() {
                    if (scope.disabled) return;
                    // Cancel previous promise for background search that was queued to be called
                    if (scope.inputChangedPromise) {
                        $timeout.cancel(scope.inputChangedPromise);
                    }

                    // Wait for the user to stop typing for a second and then fire the search
                    scope.inputChangedPromise = $timeout(function() {
                        scope.inputChangedPromise = null;
                        scope.searchCallback(scope.searchTerm, logService.logActions.SEARCH_BOX_AUTO);
                    }, AUTO_SEARCH_TIMEOUT);
                };

                // clear the search, if we already had a searchTerm, then fire the search
                scope.clearSearch = function() {
                    if (scope.disabled) return;
                    if (scope.searchTerm) {
                        scope.searchCallback(null, logService.logActions.SEARCH_BOX_CLEAR);
                    }
                    scope.searchTerm = null;
                };

            }
        };
    }])

    .directive('chaiseClearInput', [function () {
        return {
            restrict: 'E',
            template: '<div class="chaise-input-control-feedback" ng-if="show">' +
                       '<span class="{{btnClass}} remove-input-btn glyphicon glyphicon-remove" ng-click="clickCallback()" tooltip-placement="bottom" uib-tooltip="Clear input"></span>' +
                      '</div>',
            scope: {
                btnClass: "@",
                clickCallback: "&",
                show: "="
            }
        };
    }])

    // TODO currently it has four different modes,we might want to consider
    // rewriting this so we avoid duplicating all these four differnt variations
    .directive('chaiseTitle', [function () {
        return {
            restrict: 'E',
            // there shouldn't be any extra between closing <span> tag and <a>
            // if added, it will show an extra underline for the space
            template: '<a ng-if="addLink && !displayname.isHTML" ng-href="{{::recordset()}}" ng-attr-uib-tooltip="{{::(showTooltip ? comment : undefined)}}" tooltip-placement="bottom-left">' +
                        '<span ng-bind="displayname.value" ng-class="{\'chaise-icon-for-tooltip\': showTooltip}"></span>' +
                      '</a>' +
                      '<a ng-if="addLink && displayname.isHTML" ng-href="{{::recordset()}}" ng-attr-uib-tooltip="{{::(showTooltip ? comment : undefined)}}" tooltip-placement="bottom-left">' +
                        '<span ng-bind-html="displayname.value" ng-class="{\'chaise-icon-for-tooltip\': showTooltip}"></span>' +
                      '</a>' +
                      '<span ng-if="!addLink && !displayname.isHTML" ng-attr-uib-tooltip="{{::(showTooltip ? comment : undefined)}}" tooltip-placement="bottom-left">' +
                        '<span ng-bind="displayname.value" ng-class="{\'chaise-icon-for-tooltip\': showTooltip}"></span>' +
                      '</span>' +
                      '<span ng-if="!addLink && displayname.isHTML" ng-attr-uib-tooltip="{{::(showTooltip ? comment : undefined)}}" tooltip-placement="bottom-left">' +
                        '<span ng-bind-html="displayname.value" ng-class="{\'chaise-icon-for-tooltip\': showTooltip}"></span>' +
                      '</span>',
            scope: {
                reference: "=?",
                displayname: "=?",
                comment: "=?",
                addLink: "=?",
                link: "=?"
            },
            link: function (scope, elem, attrs) {
                if (typeof scope.link === "string") {
                    scope.addLink = true;
                }

                scope.recordset = function () {
                    if (typeof scope.link === "string") {
                        return scope.link;
                    }
                    return scope.reference.unfilteredReference.contextualize.compact.appLink;
                }

                scope.showTooltip = scope.comment ? true : false;

                if (scope.reference) {
                    if (typeof scope.displayname !== "object") {
                        scope.displayname = scope.reference.displayname;
                    }

                    if (!scope.comment && scope.reference.comment) {
                        scope.comment = scope.reference.comment;
                    }

                    scope.showTooltip = scope.reference.commentDisplay == 'tooltip' && (scope.comment || scope.reference.comment);
                }
            }
        };
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

    // This directive is meant to be used on inputs of type="number"
    // This disables the actions that HTML attaches to those input types for up/down
    // arrow key presses. When an integer field errors out (because it's too long),
    // pressing the down arrow changes the input value to scientific notation
    .directive('disableArrows', function() {
        function disableArrows(event) {
            if (event.keyCode === 38 || event.keyCode === 40) {
                event.preventDefault();
            }
        }

        return {
            link: function(scope, element, attrs) {
                element.on('keydown', disableArrows);
            }
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

    /**
    *  The compile directive is used to compile the html/content
    *  for angularjs to resolve functions like "ng-click" within
    *  the alert messages e.g. previousSession.message.
    */
    .directive('compile', ['$compile', function ($compile) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var ensureCompileRunsOnce = scope.$watch(
                    function(scope) {
                        // watch the 'compile' expression for changes
                        return scope.$eval(attrs.compile);
                    },
                    function(value) {
                        // when the 'compile' expression changes
                        // assign it into the current DOM
                        element.html(value);

                        // compile the new DOM and link it to the current
                        // scope.
                        // NOTE: we only compile .childNodes so that
                        // we don't get into infinite loop compiling ourselves
                        $compile(element.contents())(scope);

                        // Use un-watch feature to ensure compilation happens only once.
                        ensureCompileRunsOnce();
                    }
                );
            }
        }
    }])

    /**
     * This service is used for logging purposes. The functions in this service can be used to
     * create new stack nodes, retrieve the stack object, manipulate the stack object, or
     * get the action string that should be used.
     * This service relies on these two attributes in $rootScope:
     *  - $rootScope.appMode: the app-mode. Could be undefined.
     *  - $rootScope.logStack: The stack object of the whole app (usually the stack of the initial request of the page)
     *  - $rootScope.logStackPath: The stack path of the whole app (usually the stack path of the initial request of the page)
     *
     */
    .service('logService', ['ConfigUtils', 'DataUtils', '$log', '$rootScope', function (ConfigUtils, DataUtils, $log, $rootScope) {
        var appModeStackPathSeparator = ":",
            stackPathClientPathSeparator = ",",
            clientPathActionSeparator = ";",
            separator = "/";
        var logActions = Object.freeze({
            // general

            // - server:
            LOAD: clientPathActionSeparator + "load",
            RELOAD: clientPathActionSeparator + "reload",
            DELETE: clientPathActionSeparator + "delete",
            EXPORT: clientPathActionSeparator + "export",
            SHARE_OPEN: "share" + clientPathActionSeparator + "open",
            CREATE: clientPathActionSeparator + "create",
            UPDATE: clientPathActionSeparator + "update",

            // - client:
            CANCEL: clientPathActionSeparator + "cancel",
            OPEN: clientPathActionSeparator + "open",
            CLOSE: clientPathActionSeparator + "close",
            EXPORT_OPEN: "export" + clientPathActionSeparator + "open",
            ADD_INTEND: "add" + clientPathActionSeparator + "intend",
            EDIT_INTEND: "edit" + clientPathActionSeparator + "intend",
            DELETE_INTEND: "delete" + clientPathActionSeparator + "intend",
            DELETE_CANCEL: "delete" + clientPathActionSeparator + "cancel",
            SHARE_LIVE_LINK_COPY: "share" + separator + "live" + clientPathActionSeparator + "copy",
            SHARE_VERSIONED_LINK_COPY: "share" + separator + "version" + clientPathActionSeparator + "copy",
            CITE_BIBTEXT_DOWNLOAD: "cite" + separator + "bibtex" + clientPathActionSeparator + "download",

            // recordset app and table:

            //   - server:
            COUNT: clientPathActionSeparator + "count",
            RECOUNT: clientPathActionSeparator + "recount",
            FACET_CHOICE_LOAD: "choice" + clientPathActionSeparator + "load",
            FACET_CHOICE_RELOAD: "choice" + clientPathActionSeparator + "reload",
            FACET_RANGE_LOAD: "range" + clientPathActionSeparator + "load",
            FACET_RANGE_RELOAD: "range" + clientPathActionSeparator + "reload",
            FACET_HISTOGRAM_LOAD: "range" + clientPathActionSeparator + "load-histogram",
            FACET_HISTOGRAM_RELOAD: "range" + clientPathActionSeparator + "reload-histogram",
            PRESELECTED_FACETS_LOAD: "choice/preselect" + clientPathActionSeparator + "preload",

            //   - client:
            PERMALINK_LEFT: "permalink" + clientPathActionSeparator + "click-left",
            PERMALINK_RIGHT: "permalink" + clientPathActionSeparator + "click-right",
            PAGE_SIZE_OEPN: "page-size" + clientPathActionSeparator + "open",
            PAGE_SIZE_SELECT: "page-size" + clientPathActionSeparator + "select",
            FACET_PANEL_SHOW: "panel" + clientPathActionSeparator + "show",
            FACET_PANEL_HIDE: "panel" + clientPathActionSeparator + "hide",
            PAGE_SELECT_ALL: "page" + clientPathActionSeparator + "select-all",
            PAGE_DESELECT_ALL: "page" + clientPathActionSeparator + "deselect-all",
            PAGE_NEXT: "page" + clientPathActionSeparator + "next",
            PAGE_PREV: "page" + clientPathActionSeparator + "previous",
            SORT: clientPathActionSeparator + "sort",
            SELECTION_CLEAR: "selection" + clientPathActionSeparator + "clear",
            SELECTION_CLEAR_ALL: "selection" + clientPathActionSeparator + "clear-all",
            BREADCRUMB_CLEAR: "breadcrumb" + clientPathActionSeparator + "clear",
            BREADCRUMB_CLEAR_ALL: "breadcrumb" + clientPathActionSeparator + "clear-all",
            BREADCRUMB_CLEAR_CFACET: "breadcrumb" + clientPathActionSeparator + "clear-cfacet",
            BREADCRUMB_CLEAR_CUSTOM: "breadcrumb" + clientPathActionSeparator + "clear-custom",
            BREADCRUMB_SCROLL_TO: "breadcrumb" + clientPathActionSeparator + "scroll-to",
            SEARCH_BOX_AUTO: "search-box" + clientPathActionSeparator + "search-delay",
            SEARCH_BOX_CLEAR: "search-box" + clientPathActionSeparator + "clear",
            SEARCH_BOX_CLICK: "search-box" + clientPathActionSeparator + "search-click",
            SEARCH_BOX_ENTER: "search-box" + clientPathActionSeparator + "search-enter",


            // record app:

            // - server:
            LOAD_DOMAIN: clientPathActionSeparator + "load-domain", // add pure and binary first request
            RELOAD_DOMAIN: clientPathActionSeparator + "reload-domain",
            LINK: clientPathActionSeparator + "link",
            UNLINK: clientPathActionSeparator + "unlink",

            // - client:
            TOC_SHOW: "toc" +  clientPathActionSeparator + "show",
            TOC_HIDE: "toc" +  clientPathActionSeparator + "hide",
            RELATED_DISPLAY_TABLE: "display" + separator + "table" + clientPathActionSeparator + "show",
            RELATED_DISPLAY_MARKDOWN: "display" + separator + "mkdn" + clientPathActionSeparator + "show",
            EMPTY_RELATED_SHOW: "show-empty" + clientPathActionSeparator + "show",
            EMPTY_RELATED_HIDE: "show-empty" + clientPathActionSeparator + "hide",
            UNLINK_INTEND: "unlink" + clientPathActionSeparator + "intend",
            UNLINK_CANCEL: "unlink" + clientPathActionSeparator + "cancel",

            SCROLL_TOP: clientPathActionSeparator + "scroll-top",
            TOC_SCROLL_TOP: "toc" + separator + "main" + clientPathActionSeparator + "scroll-to",
            TOC_SCROLL_RELATED: "toc" + separator + "section" + clientPathActionSeparator + "scroll-to",


            // recordedit app:

            // - server:
            FOREIGN_KEY_PRESELECT: clientPathActionSeparator +  "preselect",
            FOREIGN_KEY_DEFAULT: clientPathActionSeparator + "default",

            // - client:
            FORM_CLONE: clientPathActionSeparator + "clone",
            FORM_CLONE_X: clientPathActionSeparator +  "clone-x",
            FORM_REMOVE: clientPathActionSeparator + "remove",
            SET_ALL_OPEN: "set-all" + clientPathActionSeparator + "open",
            SET_ALL_CLOSE: "set-all" + clientPathActionSeparator + "close",
            SET_ALL_CANCEL: "set-all" + clientPathActionSeparator + "cancel",
            SET_ALL_APPLY: "set-all" + clientPathActionSeparator + "apply",
            SET_ALL_CLEAR: "set-all" + clientPathActionSeparator + "clear",


            // viewer app:
            // TODO viewer logs are a bit different, so for now I just used a prefix for them.
            //      I should later evaluate this decision and see whether I should remove these prefixes
            //      after that we should be able to merge some of the actions with the rest of the chaise

            // - server:
            VIEWER_ANNOT_FETCH: clientPathActionSeparator + "fetch",
            VIEWER_CHANNEL_DEFAULT_LOAD: "z-default" + clientPathActionSeparator + "load",
            VIEWER_UPDATE_CHANNEL_CONFIG: ":entity/channel-set,;update",

            // - client:
            VIEWER_ANNOT_PANEL_SHOW: "toolbar/panel" + clientPathActionSeparator + "show",
            VIEWER_ANNOT_PANEL_HIDE: "toolbar/panel" + clientPathActionSeparator + "hide",
            VIEWER_CHANNEL_SHOW: "toolbar/channel" + clientPathActionSeparator + "show",
            VIEWER_CHANNEL_HIDE: "toolbar/channel" + clientPathActionSeparator + "hide",
            VIEWER_SCREENSHOT: "toolbar" + clientPathActionSeparator + "screenshot",
            VIEWER_ZOOM_RESET: "toolbar" + clientPathActionSeparator + "zoom-reset",
            VIEWER_ZOOM_IN: "toolbar" + clientPathActionSeparator + "zoom-in",
            VIEWER_ZOOM_OUT: "toolbar" + clientPathActionSeparator + "zoom-out",
            // VIEWER_ZOOM_IN_MOUSE: "mouse" + clientPathActionSeparator + "zoom-in",
            // VIEWER_ZOOM_OUT_MOUSE: "mouse" + clientPathActionSeparator + "zoom-out",

            VIEWER_ANNOT_LINE_THICKNESS: "line-thickness" + clientPathActionSeparator + "adjust",
            VIEWER_ANNOT_DISPLAY_ALL: clientPathActionSeparator + "display-all",
            VIEWER_ANNOT_DISPLAY_NONE: clientPathActionSeparator + "display-none",
            VIEWER_ANNOT_SHOW: clientPathActionSeparator + "show",
            VIEWER_ANNOT_HIDE: clientPathActionSeparator + "hide",
            VIEWER_ANNOT_HIGHLIGHT: clientPathActionSeparator + "highlight",

            VIEWER_ANNOT_DRAW_MODE_SHOW: "draw-mode" + clientPathActionSeparator + "show",
            VIEWER_ANNOT_DRAW_MODE_HIDE: "draw-mode" + clientPathActionSeparator + "hide",

            // - authen:
            LOGOUT_NAVBAR: "navbar/account" + clientPathActionSeparator + "logout",
            LOGIN_NAVBAR: "navbar/account" + clientPathActionSeparator + "login",
            LOGIN_ERROR_MODAL: "error-modal" + clientPathActionSeparator + "login",
            LOGIN_LOGIN_MODAL: "login-modal" + clientPathActionSeparator + "login",
            LOGIN_WARNING: "warning" + clientPathActionSeparator + "login",
            SESSION_VALIDATE: "session" + clientPathActionSeparator + "validate",
            SESSION_RETRIEVE: "session" + clientPathActionSeparator + "retrieve",

            SWITCH_USER_ACCOUNTS_LOGIN: "switch-accounts" + clientPathActionSeparator + "login",
            SWITCH_USER_ACCOUNTS_WIKI_LOGIN: "switch-accounts-wiki" + clientPathActionSeparator + "login",
            SWITCH_USER_ACCOUNTS_LOGOUT: "switch-accounts" + clientPathActionSeparator + "logout",

            // - navbar:
            NAVBAR_BRANDING: "navbar/branding" + clientPathActionSeparator + "navigate",
            NAVBAR_MENU_EXTERNAL: "navbar/menu" + clientPathActionSeparator + "navigate-external",
            NAVBAR_MENU_INTERNAL: "navbar/menu" + clientPathActionSeparator + "navigate-internal",
            NAVBAR_MENU_OPEN: "navbar/menu" + clientPathActionSeparator + "open",
            NAVBAR_ACCOUNT_DROPDOWN: "navbar/account" + clientPathActionSeparator + "open",
            NAVBAR_PROFILE_OPEN: "navbar/account/profile" + clientPathActionSeparator + "open",
            NAVBAR_RID_SEARCH: "navbar/go-to-rid" + clientPathActionSeparator + "navigate"
        });

        var logStackTypes = Object.freeze({
            ENTITY: "entity",
            SET: "set",
            RELATED: "related",
            FOREIGN_KEY: "fk",
            COLUMN: "col",
            PSEUDO_COLUMN: "pcol",
            FACET: "facet",

            // used in viewer app:
            ANNOTATION: "annotation",
            CHANNEL: "channel"
        });

        var logStackPaths = Object.freeze({
            ENTITY: "entity",
            SET: "set",
            COLUMN: "col",
            PSEUDO_COLUMN: "pcol",
            FOREIGN_KEY: "fk",
            FACET: "facet",
            RELATED: "related",
            RELATED_INLINE: "related-inline",
            ADD_PB_POPUP: "related-link-picker",
            FOREIGN_KEY_POPUP: "fk-picker",
            FACET_POPUP: "facet-picker",
            // these two have been added to the tables that recordedit is showing
            //(but not used in logs technically since we're not showing any controls he)
            RESULT_SUCCESFUL_SET: "result-successful-set",
            RESULT_FAILED_SET: "result-failed-set",

            // used in viewer app:
            ANNOTATION_ENTITY: "annotation-entity",
            ANNOTATION_SET: "annotation-set",
            CHANNEL_SET: "channel-set"
        });

        var appModes = Object.freeze({
            EDIT: "edit",
            CREATE: "create",
            CREATE_COPY: "create-copy",
            CREATE_PRESELECT: "create-preselect"
        });

        // why we had to reload a request
        var reloadCauses = Object.freeze({
            CLEAR_ALL: "clear-all", // clear all button
            CLEAR_CFACET: "clear-cfacet",
            CLEAR_CUSTOM_FILTER: "clear-custom-filter",
            ENTITY_CREATE: "entity-create", // new rows has been created in the table
            ENTITY_DELETE: "entity-delete", // a row in the table has been deleted
            ENTITY_UPDATE: "entity-update", // a row in the table has been updated
            FACET_CLEAR: "facet-clear", // a facet cleared
            FACET_DESELECT: "facet-deselect", // a facet deselected
            FACET_SELECT: "facet-select", // a facet selected
            FACET_MODIFIED: "facet-modified", // facet changed in the modal
            FACET_SEARCH_BOX: "facet-search-box", // facet search box changed
            FACET_PLOT_RELAYOUT:  "facet-histogram-relayout", // users interact with plot and we need to get new info for it
            FACET_RETRY: "facet-retry", // users click on retry for a facet that errored out
            PAGE_LIMIT: "page-limit", // change page limit
            PAGE_NEXT: "page-next", // go to next page
            PAGE_PREV: "page-prev", // go to previous page
            RELATED_CREATE: "related-create", // new rows in one of the related tables has been created
            RELATED_DELETE: "related-delete", // a row in one of the related tables has been deleted
            RELATED_UPDATE: "related-update", // a row in one of the related tables has been edited
            RELATED_INLINE_CREATE: "related-inline-create", // new rows in one of the related (inline) tables has been created
            RELATED_INLINE_DELETE: "related-inline-delete", // a row in one of the related (inline) tables has been deleted
            RELATED_INLINE_UPDATE: "related-inline-update", // a row in one of the related (inline) tables has been edited
            SORT: "sort", // sort changed
            SEARCH_BOX: "search-box", // search box value changed
        });

        /**
         * Takes a object, adds default logging info to it, and logs the request with ermrest
         * @params {Object} logObj - object of key/value pairs that are specific to this action
         * @params {Object} commonLogInfo - object of key/value pairs that are common to all action requests
         */
        function logClientAction(logObj, commonLogInfo) {
            var cc = ConfigUtils.getConfigJSON();
            var contextHeaderParams = ConfigUtils.getContextHeaderParams();

            if (!cc.logClientActions) return;

            if (commonLogInfo) {
                // TODO this could just use all the attribues in the commonLogInfo
                logObj.catalog = commonLogInfo.catalog;
                logObj.schema_table = commonLogInfo.schema_table;
            }

            var headers = {};

            // in the case of static websites, the getHTTPService might return $http,
            // which doesn't have the contextHeaderParams, so we should add them here just in case
            for (var key in contextHeaderParams) {
                if (!contextHeaderParams.hasOwnProperty(key) || (key in logObj)) continue;
                logObj[key] = contextHeaderParams[key];
            }
            headers[ERMrest.contextHeaderName] = logObj;
            ConfigUtils.getHTTPService().head(cc.ermrestLocation + "/client_action", {headers: headers}).catch(function (err) {
                $log.debug("An error may have occured when logging: ", logObj);
                $log.debug(err);
            });
        }

        /**
         * Returns the appropriate stack object that should be used.
         * If childStackElement passed, it will append it to the existing logStack of the app.
         * @param {Object} childStackElement
         * @param {Object=} logStack if passed, will be used instead of the default value of the app.
         */
        function getStackObject(childStackNode, logStack) {
            if (!logStack) {
                logStack = $rootScope.logStack;
            }
            if (childStackNode) {
                return logStack.concat(childStackNode);
            }
            return logStack;
        }

        /**
         * Returns the stack path that should be used in logs.
         * @param {String=} currentPath - the existing stackPath
         * @param {String} childPath - the current child stack path
         */
        function getStackPath(currentPath, childPath) {
            if (!currentPath) {
                currentPath = $rootScope.logStackPath;
            }
            return currentPath + separator + childPath;
        }

        /**
         * Creates a new stack node given the type, table, and extra information.
         * @param {String} type - one of the logStackTypes
         * @param {ERMrest.Table=} table - the table object of this node
         * @param {Object=} extraInfo - if you want to attach more info to this node.
         */
        function getStackNode(type, table, extraInfo) {
            var obj = {type: type};
            if (table) {
                obj.s_t = table.schema.name + ":" + table.name;
            }
            if (typeof extraInfo === "object" && extraInfo !== null) {
                for (var k in extraInfo) {
                    if (!extraInfo.hasOwnProperty(k)) continue;
                    obj[k] = extraInfo[k];
                }
            }
            return obj;
        }

        /**
         * Given an stack and new filterLogInfo, will remove the old ones and use the new ones.
         * @param {Object} stack - if not passed, will use the app-wide one
         * @param {Object} filterLogInfo
         */
        function updateStackFilterInfo(stack, filterLogInfo) {
            if (!stack) {
                stack = $rootScope.logStack;
            }
            var lastStackElement = stack[stack.length-1];
            // TODO can be better? remove the existing filter info in stack
            ['cfacet', 'cfacet_str', 'cfacet_path', 'filters', 'custom_filters'].forEach(function (k) {
                delete lastStackElement[k];
            });

            // update the stack to have the latest filter info
            for (var f in filterLogInfo) {
                if (!filterLogInfo.hasOwnProperty(f)) continue;
                lastStackElement[f] = filterLogInfo[f];
            }
        }

        /**
         * Given the array of causes and startTime, will return a new stack with appropriate variables.
         * @param {Object=} stack - if not passed, will use the app-wide one
         * @param {Array} causes
         * @param {String} startTime - in milliseconds
         */
        function addCausesToStack(stack, causes, startTime) {
            if (!stack) {
                stack = $rootScope.logStack;
            }
            var newStack = DataUtils.simpleDeepCopy(stack);
            var lastStackElement = newStack[stack.length-1];
            lastStackElement.causes = causes;
            lastStackElement.start_ms = startTime;
            lastStackElement.end_ms = ERMrest.getElapsedTime();
            return newStack;
        }

        /**
         * Given an stack and object, will return a new stack with the object information added.
         * @param {Object=} stack - if not passed, will use the app-wide one
         * @param {Object} extraInfo
         */
        function addExtraInfoToStack(stack, extraInfo) {
            if (!stack) {
                stack = $rootScope.logStack;
            }
            var newStack = DataUtils.simpleDeepCopy(stack);
            var lastStackElement = newStack[stack.length-1];

            for (var f in extraInfo) {
                if (!extraInfo.hasOwnProperty(f)) continue;
                lastStackElement[f] = extraInfo[f];
            }

            return newStack;
        }

        /**
         * Given the logStackPath and logActionVerb will return the appropriate action string.
         * @param {String} logActionVerb - the action verb
         * @param {String} logStackPath - if the given value is not a string, we will use the $rootScope.logStackPath instead.
         * @param {String} appMode -if the given value is not a string, we will use te $rootScope.logAppMode instead.
         */
        function getActionString(logActionVerb, logStackPath, appMode) {
            if (typeof logStackPath !== "string") {
                logStackPath = $rootScope.logStackPath;
            }
            if (typeof appMode !== "string") {
                appMode = $rootScope.logAppMode ? $rootScope.logAppMode : "";
            }
            return  appMode + appModeStackPathSeparator + logStackPath + stackPathClientPathSeparator + logActionVerb;
        }

        return {
            appModes: appModes,
            logStackTypes: logStackTypes,
            logStackPaths: logStackPaths,
            logActions: logActions,
            reloadCauses: reloadCauses,
            logClientAction: logClientAction,
            getActionString: getActionString,
            getStackNode: getStackNode,
            updateStackFilterInfo: updateStackFilterInfo,
            addCausesToStack: addCausesToStack,
            getStackPath: getStackPath,
            getStackObject: getStackObject,
            addExtraInfoToStack: addExtraInfoToStack
        };
    }])

    .service('headInjector', ['ConfigUtils', 'ERMrest', 'Errors', 'ErrorService', 'MathUtils', 'modalUtils', '$q', '$rootScope', 'UriUtils', 'UiUtils', '$window', function(ConfigUtils, ERMrest, Errors, ErrorService, MathUtils, modalUtils, $q, $rootScope, UriUtils, UiUtils, $window) {

        /**
         * adds a link tag to head with the custom css. It will be resolved when
         * the file is loaded (or if the customCSS property is not defined)
         */
        function addCustomCSS() {
            var defer = $q.defer();
            var chaiseConfig = ConfigUtils.getConfigJSON();
            if (chaiseConfig['customCSS'] !== undefined) {
                // if the file is already injected
                if (document.querySelector('link[href^="' + chaiseConfig['customCSS'] + '"]')) {
                    return defer.resolve(), defer.promise;
                }

                var customCSSElement = document.createElement("link");
                customCSSElement.setAttribute("rel", "stylesheet");
                customCSSElement.setAttribute("type", "text/css");
                customCSSElement.setAttribute("href", chaiseConfig['customCSS']);
                // resolve the promise when the css is loaded
                customCSSElement.onload = defer.resolve;
                customCSSElement.onerror = defer.resolve;
                document.getElementsByTagName("head")[0].appendChild(customCSSElement);
            } else {
                defer.resolve();
            }
            return defer.promise;
        }

        /**
         * Detects the running enviornments and adss the following classes to chaise-body:
         *  - chaise-mac: if it's running on macOS
         *  - chaise-firefox: if it's running on Firefox
         *  - chaise-iframe: if running in an iframe
         */
        function addBodyClasses(){
            var osClass = (navigator.platform.indexOf("Mac") != -1 ? "chaise-mac" : undefined);
            var browserClass = (navigator.userAgent.indexOf("Firefox") != -1 ? "chaise-firefox" : undefined);

            var bodyElement = document.querySelector(".chaise-body");
            if (!bodyElement) return;

            if(osClass) {
                UiUtils.addClass(bodyElement, osClass);
            }
            if(browserClass) {
                UiUtils.addClass(bodyElement, browserClass);
            }
            if ($window.self !== $window.parent) {
                UiUtils.addClass(bodyElement, "chaise-iframe");
            }
        }

        function addTitle(title) {
            var chaiseConfig = ConfigUtils.getConfigJSON();

            if (typeof title !== "string" || title.length === 0) {
                title = chaiseConfig.headTitle;
            } else {
                title += " | " + chaiseConfig.headTitle;
            }

            var titleTag = document.head.getElementsByTagName('title')[0];
            if (titleTag) {
                titleTag.innerHTML = title;
            } else {
                titleTag = document.createElement("title");
                titleTag.innerHTML = title;
                document.head.appendChild(titleTag);
            }
        }

        // <title> should already be created in <head> and set to default chaiseConfig.headTitle from config app before app loads
        function updateHeadTitle(contextTitle) {
            var chaiseConfig = ConfigUtils.getConfigJSON();

            var titleTag = document.head.getElementsByTagName('title')[0];
            titleTag.innerHTML = (contextTitle ? contextTitle + ' | ' : "") + chaiseConfig.headTitle;
        }

        // sets the WID if it doesn't already exist
        function setWindowName() {
            if (!$window.name) {
                $window.name = MathUtils.uuid();
            }
        }

        function addCanonicalTag() {
            var chaiseConfig = ConfigUtils.getConfigJSON();
            if (chaiseConfig['includeCanonicalTag'] == true) {
                var canonicalTag = document.createElement("link");
                canonicalTag.setAttribute("rel", "canonical");

                // the hash returned from this function handles the case when '#' is switched with '?'
                var hash = UriUtils.getHash($window.location);
                var canonicalURL = $window.location.origin + $window.location.pathname + UriUtils.stripSortAndQueryParams(hash);
                canonicalTag.setAttribute("href", canonicalURL);
                document.getElementsByTagName("head")[0].appendChild(canonicalTag);
            }
        }

        function clickHref(href) {
            // fetch the file for the user
            var downloadLink = angular.element('<a></a>');
            downloadLink.attr('href', href);
            downloadLink.attr('download', '');
            downloadLink.attr('visibility', 'hidden');
            downloadLink.attr('display', 'none');
            downloadLink.attr('target', '_blank');
            // Append to page
            document.body.appendChild(downloadLink[0]);
            downloadLink[0].click();
            document.body.removeChild(downloadLink[0]);
        }

        function overrideDownloadClickBehavior() {
            addClickListener("a.asset-permission", function (e, element) {

                function hideSpinner() {
                    element.innerHTML = element.innerHTML.slice(0, element.innerHTML.indexOf(spinnerHTML));
                }

                e.preventDefault();

                var spinnerHTML = ' <span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>';
                //show spinner
                element.innerHTML += spinnerHTML;

                // if same origin, verify authorization
                if (UriUtils.isSameOrigin(element.href)) {
                    var config = {skipRetryBrowserError: true, skipHTTP401Handling: true};

                    // make a HEAD request to check if the user can fetch the file
                    ConfigUtils.getHTTPService().head(element.href, config).then(function (response) {
                        clickHref(element.href);
                    }).catch(function (exception) {
                        // error/login modal was closed
                        if (typeof exception == 'string') return;
                        var ermrestError = ERMrest.responseToError(exception);

                        if (ermrestError instanceof ERMrest.UnauthorizedError) {
                            ermrestError = new Errors.UnauthorizedAssetAccess();
                        } else if (ermrestError instanceof ERMrest.ForbiddenError) {
                            ermrestError = new Errors.ForbiddenAssetAccess();
                        }

                        // If an error occurs while a user is trying to download the file, allow them to dismiss the dialog
                        ErrorService.handleException(ermrestError, true);
                    }).finally(function () {
                        // remove the spinner
                        hideSpinner();
                    });
                }
            });
        }

        function overrideExternalLinkBehavior() {
            addClickListener('a.external-link', function (e, element) {
                e.preventDefault();

                // asset-permission will be appended via display annotation or by heuristic if no annotation
                // this else case should only occur if display annotation contains asset-permission and asset is not the same host
                var modalProperties = {
                    windowClass: "modal-redirect",
                    templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/externalLink.modal.html",
                    controller: 'RedirectController',
                    controllerAs: 'ctrl',
                    animation: false,
                    size: "sm",
                }
                // show modal dialog with countdown before redirecting to "asset"
                modalUtils.showModal(modalProperties, function () {
                    clickHref(element.href);
                }, false);
            });
        }

        /**
         * make sure links open in new tab
         */
        function openLinksInTab () {
            addClickListener('a[href]', function (e, element) {
                element.target = "_blank";
            });
        }

        /**
         * Will call the handler function upon clicking on the elements represented by selector
         * @param {string} selector the selector string
         * @param {function} handler  the handler callback function.
         * handler parameters are:
         *  - Event object that is returned.
         *  - The target (element that is described by the selector)
         * NOTE since we're checking the closest element to the target, the e.target might
         * be different from the actual target that we want. That's why we have to send the target too.
         * We observerd this behavior in Firefox were clicking on an image wrapped by link (a tag), returned
         * the image as the value of e.target and not the link
         */
        function addClickListener(selector, handler) {
            document.querySelector("body").addEventListener("click", function (e) {
                if (e.target.closest(selector)) {
                    handler(e, e.target.closest(selector));
                }
            });
        }

        /**
         * Add add pollyfills for the functions that are not supported by all browsers.
         */
        function addPolyfills() {
            if (!Element.prototype.matches) {
              Element.prototype.matches = Element.prototype.msMatchesSelector ||
                                          Element.prototype.webkitMatchesSelector;
            }

            if (!Element.prototype.closest) {
              Element.prototype.closest = function(s) {
                var el = this;

                do {
                  if (el.matches(s)) return el;
                  el = el.parentElement || el.parentNode;
                } while (el !== null && el.nodeType === 1);
                return null;
              };
            }
        }

        /**
         * Will return a promise that is resolved when the setup is done
         *
         * NOTE: should only be called by config.js (or equivalent configuration app)
         */
        function setupHead() {
            addPolyfills();                                 // needs to be set for navbar functionality (and other chaise functionality)
            addBodyClasses();                               // doesn't need to be controlled since it relies on .chaise-body class being present
            addCanonicalTag();                              // controlled by chaise-config value to turn on/off
            setWindowName();                                // will only update if not already set

            var settings = ConfigUtils.getSettings();
            if (settings.openLinksInTab) openLinksInTab();
            if (settings.overrideDownloadClickBehavior) overrideDownloadClickBehavior();
            if (settings.overrideExternalLinkBehavior) overrideExternalLinkBehavior();
            if (settings.overrideHeadTitle) addTitle(settings.appTitle);


            return addCustomCSS();                          // controlled by chaise-config value to attach
        }

        return {
            addCanonicalTag: addCanonicalTag,
            addCustomCSS: addCustomCSS,
            addTitle: addTitle,
            setWindowName: setWindowName,
            setupHead: setupHead,
            updateHeadTitle: updateHeadTitle
        };
    }]);
})();
