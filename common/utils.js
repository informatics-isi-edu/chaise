(function() {
    'use strict';

    angular.module('chaise.utils', ['chaise.errors'])

    .constant("defaultChaiseConfig", {
          "internalHosts": [window.location.host],
          "ermrestLocation": window.location.origin + "/ermrest",
          "headTitle": "Chaise",
          "navbarBrandText": "Chaise",
          "logoutURL": "/",
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
          "disableExternalLinkModal": false
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
            message: "To open the login window press"
        },
        "previousSession": {
            message: "Your login session has expired. You are now accessing data anonymously. <a ng-click='login()'>Log in</a> to continue your privileged access."
        },
        "noSession": {
            title: "You need to be logged in to continue.",
            message: "To open the login window press"
        },
        "clickActionMessage": {
            "messageWReplace": "Click <b>OK</b> to reload this page without @errorStatus.",
            "loginOrDismissDialog": "Click <a ng-click='ctrl.login()'>Login</a> to log in to the system, or click <b>OK</b> to dismiss this dialog.",
            "dismissDialog": "Click <b>OK</b> to dismiss this dialog.",
            "multipleRecords": "Click <b>OK</b> to show all the matched records.",
            "noRecordsFound": "Click <b>OK</b> to show the list of all records.",
            "okBtnMessage": "Click <b>OK</b> to go to the Recordset.",
            "reloadMessage": "Click <b>Reload</b> to start over.",
            "pageRedirect": "Click <b>OK</b> to go to the "
        },
        "errorMessageMissing": "An unexpected error has occurred. Please try again",
        "tableMissing": "No table specified in the form of 'schema-name:table-name' and no Default is set.",
        "maybeNeedLogin": "You may need to login to see the model or data.",
        "maybeUnauthorizedMessage" : "You may not be authorized to view this record (or records).",
        "unauthorizedMessage" : "You are not authorized to perform this action.",
        "reportErrorToAdmin" : " Please report this problem to your system administrators.",
        "noRecordForFilter" : "No matching record found for the given filter or facet.",
        "loginRequired": "Login Required",
        "permissionDenied": "Permission Denied",
        "unauthorizedErrorCode" : "Unauthorized Access",
        "localStorageDisabled": "localStorage is disabled by the browser settings. Some features might not work as expected",
        "showErrDetails" : "Show Error Details",
        "hideErrDetails" : "Hide Error Details",
        "tooltip": {
            versionTime: "You are looking at data that was snapshotted ",
            downloadCSV: "Click to download all matched results",
            permalink: "This link stores your search criteria as a URL. Right click and save.",
            actionCol: "Click on the action buttons to view, edit, or delete each record",
            viewCol: "Click on the eye button to view the detailed page associated with each record",
            null: "Search for any record with no value assigned",
            empty: "Search for any record with the empty string value",
            notNull: "Search for any record that has a value",
            showMore: "Click to show more available fitlers",
            showDetails: "Click to show more details about the filters"
        },
        "URLLimitMessage": "Maximum URL length reached. Cannot perform the requested action.",
        "queryTimeoutList": "<ul class='show-list-style'><li>Reduce the number of facet constraints.</li><li>Minimize the use of 'No value' and 'All Records with Value' filters.</li></ul>",
        "queryTimeoutTooltip": "Request timeout: data cannot be retrieved. Refresh the page later to try again."
    })

    .constant("logActions", {
        "recordRead": "record/main", // read the main entity (record)
        "recordUpdate": "record/main/update", // read the main entity (record)
        "recordRelatedRead": "record/related", // secondary
        "recordRelatedUpdate": "record/related/update", // secondary
        "recordRelatedAggregate": "record/related/aggregate", // secondary
        "recordRelatedAggregateUpdate": "record/related/aggregate/update", // secondary
        "recordInlineRead": "record/inline", // secondary
        "recordInlineUpdate": "record/inline/update", // secondary
        "recordInlineAggregate": "record/inline/aggregate",
        "recordInlineAggregateUpdate": "record/inline/aggregate/update",
        "recordAggregate": "record/aggregate", // secondary
        "recordAggregateUpdate": "record/aggregate/update", // secondary


        "createPrefill": "create/prefill", // create with inbound related prefilled (recordedit) -> does it need referrer? (the pre should have it)
        "createAssociation": "create/prefill/association", // batch create association (record) -> does itneed referrer? (the pre should have it)
        "createModal": "create/modal", // create entity coming from plus button in modal of foreignkey (recordedit)
        "copy": "create/copy", // create entity by copying another (recordedit)
        "create": "create/new", // create entity (recordedit)

        "preCreatePrefill": "pre-create/prefill", // read the foreignkey value for the prefill (recoredit) has referrer -> read is on the fk, .. it's fine. we are not looking at url anyways.
        "preCreateAssociation": "pre-create/prefill/association", // read the association values to add new ones (record) has referrer
        "preCreateAssociationSelected": "pre-create/prefill/association/disabled", // secondary
        "preCopy": "pre-create/copy", // read the current data before copy (recordedit)
        "recordeditDefault": "default",

        "update": "update", // update entity (recordedit)
        "preUpdate": "pre-update", // read entity to be updated (recordedit)

        "recordsetCount": "recordset/main/count", // secondary
        "recordsetLoad": "recordset/main/load", // recordset main data read on load (recordset)
        "recordsetUpdate": "recordset/main/update", // recordset main data read on update (edit or delete) secondary
        "recordsetSort": "recordset/main/sort", // recordset main data read on changing sort (recordset) has sort
        "recordsetPage": "recordset/main/page", // recordset main data read on changing page (recordset) has page
        "recordsetLimit": "recordset/main/limit", // recordset main data read on changing page limit (recordset)
        "recordsetAggregate": "recordset/main/aggregate", //secondary (recordset get data for pseudo-columns)
        "recordsetFacet": "recordset/main/facet", // recordset main data read on changing facet (recordset)
        "recordsetFacetDetails": "recordset/viewmore", // getting facet details in modal (recordset)
        "recordsetFacetRead": "recordset/facet", // secondary
        "recordsetFacetInit": "recordset/facet/init", // secondary (getting the rowname of preselected facets)
        "recordsetFacetHistogram": "recordset/facet/histogram", // secondary (getting the histogrma buckets)

        "recordDelete": "delete/record", // delete record (record)
        "recordEditDelete": "delete/recordedit", // delete record (recordedit)
        "recordsetDelete": "delete/recordset", // delete a row (recordset)
        "recordRelatedDelete": "delete/record/related", // delete a row from related entities (record) has referrer

        "export": "export",

        "viewerMain": "main",
        "viewerAnnotation": "annotation",
        "viewerComment": "comment",
        "viewerAnatomy": "anatomy"

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
        related: "related",
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
         * if returnObject = true: an object that has 'ermrestURI', `ppid`, 'pcid', and `isQueryParameter`
         * otherwise it will return the ermrest uri string.
         * @throws {MalformedUriError} if table or catalog data are missing.
         */
        function chaiseURItoErmrestURI(location, returnObject) {
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
                catalogId, ppid, pcid;

            // remove query params other than limit
            if (hash && hash.indexOf('?') !== -1) {
                var queries = hash.match(/\?(.+)/)[1].split("&"); // get the query params
                var acceptedQueries = [], i;

                hash = hash.slice(0, hash.indexOf('?')); // remove queries
                // add back only the valid queries
                // "valid queries" are ones that the ermrest APIs allow in the uri (like limit)
                for (i = 0; i < queries.length; i++) {
                    if (queries[i].indexOf("limit=") === 0) {
                        acceptedQueries.push(queries[i]);
                    }
                    if (queries[i].indexOf("pcid=") === 0) {
                        pcid = queries[i].split("=")[1];
                    }
                    if (queries[i].indexOf("ppid=") === 0) {
                        ppid = queries[i].split("=")[1];
                    }
                    var q_parts = queries[i].split("=");
                    queryParams[decodeURIComponent(q_parts[0])] = decodeURIComponent(q_parts[1]);
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

            var contextObj = ConfigUtils.getContextJSON();
            pcontext.push("pcid=" + contextObj.cid);
            pcontext.push("ppid=" + contextObj.pid);
            // only add the value to the applink function if it's true
            if (contextObj.hideNavbar) pcontext.push("hideNavbar=" + contextObj.hideNavbar)

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
         * If we access it from an app inside chaise folder then it returns the pathname before the appName in the url
         * otherwise if we access it from an app outside chaise then:
         *      1. It returns the chaise path mentioned in the chaiseConfig
         *      2. If ChaiseConfig doesn't specify the chaisePath, then it returns the default value '/chaise/'
        */
        function chaiseDeploymentPath() {
            var chaiseConfig = ConfigUtils.getConfigJSON();
            var appNames = ["record", "recordset", "recordedit", "search", "login"];
            var currentAppName = appNamefromUrlPathname($window.location.pathname);
            if (appNames.includes(currentAppName)) {
                var index = $window.location.pathname.indexOf(currentAppName);
                return $window.location.pathname.substring(0, index);
            } else if (chaiseConfig && typeof chaiseConfig.chaiseBasePath === "string") {
                var path = chaiseConfig.chaiseBasePath;
                if(path[path.length-1] !== "/")
                    path = path + "/";
                return path;
            } else {
                return '/chaise/';
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

            // if it's a number (isNaN tries to parse to integer before checking) and is the same as current  catalog
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
         * @returns {String} the value of that key or null, if that key doesn't exist as a query parameter
         *
         * Note: This won't handle the case where the url might be like this:
         * '?catalog/schema:table/limit=20' where limit is a column name
         */
        function getQueryParam(url, key) {
            var params = {};
            var idx = url.lastIndexOf("?");
            if (idx !== -1) {
                var queries = url.slice(idx+1).split("&");
                for (var i = 0; i < queries.length; i++) {
                    var q_parts = queries[i].split("=");
                    params[decodeURIComponent(q_parts[0])] = decodeURIComponent(q_parts[1]);
                }
            }
            return params[key];
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
            var dcctx = ConfigUtils.getContextJSON();
            if (dcctx.hideNavbar) {
                url = url + (reference.location.queryParamsString ? "&" : "?") + "hideNavbar=" + dcctx.hideNavbar;
            }

            return url;
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
            isBrowserIE: isBrowserIE,
            isSameOrigin: isSameOrigin,
            parsedFilterToERMrestFilter: parsedFilterToERMrestFilter,
            parseURLFragment: parseURLFragment,
            queryStringToJSON: queryStringToJSON,
            resolvePermalink: resolvePermalink,
            setLocationChangeHandling: setLocationChangeHandling,
            setOrigin: setOrigin,
            stripSortAndQueryParams: stripSortAndQueryParams,
            getRecordsetLink: getRecordsetLink
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

        /**
         * Verifies that the given data is integer
         * @param  {Object}  data
         * @return {Boolean} whether it is integer or not
         */
        function isInteger(data) {
            return (typeof data === 'number') && (data % 1 === 0);
        }

        /**
        *
        * @desc Converts the following characters to HTML entities for safe and
        * HTML5-valid usage in the `id` attributes of HTML elements: spaces, ampersands,
        * right angle brackets, left angle brackets, double quotes, single quotes.
        * @param {String} string
        * @return {String} a string suitable for use in the `id` attributes of HTML elements
        */
        function makeSafeIdAttr(string, val) {
            return String(string)
                .replace(/&/g, '&amp;')
                .replace(/\s/g, '&nbsp;') // any whitespace
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
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

        return {
            getRowValuesFromPage: getRowValuesFromPage,
            getRowValuesFromTupleData: getRowValuesFromTupleData,
            getRowValuesFromTuples: getRowValuesFromTuples,
            isObjectAndKeyDefined: isObjectAndKeyDefined,
            isInteger: isInteger,
            makeSafeIdAttr: makeSafeIdAttr,
            makeSafeHTML: makeSafeHTML,
            addSpaceAfterLogicalOperators: addSpaceAfterLogicalOperators,
            verify: verify
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
         * @param   {DOMElement=} parentContainer - the parent container. if undefined `body` will be used.
         * @param   {DOMElement=} parentContainerSticky - the sticky area of parent. if undefined `#mainnav` will be used.
         * @param   {boolean} useDocHeight - whether we should use the doc height even if parentContainer is passed.
         * Set the height of bottom-panel-container
         * If you don't pass any parentContainer, it will use the body
         * It will assume the following structure in the given parentContainer:
         *  - .app-content-container
         *    - .top-panel-container
         *    - .bottom-panel-container
         */
        function setDisplayContainerHeight(parentContainer, parentContainerSticky, useDocHeight) {
            try {
                var docHeight = $window.innerHeight,
                    parentUsableHeight,
                    appContent, // the container that we might set height for if container height is too small
                    container, // the container that we want to set the height for
                    containerSticky; // the sticky part of the container (top-panel-container)

                // if the size of content is way too small, make the whole app-content-container scrollable
                var resetHeight = function () {
                    appContent.style.overflowY = "auto";
                    appContent.style.height = ((parentUsableHeight/docHeight) * 100) + "vh";
                    container.style.height = "unset";
                }

                // get the parentContainer and its usable height
                if (parentContainer == null || parentContainer == $document[0].querySelector("body")) {
                    parentUsableHeight = docHeight;
                    parentContainer = $document[0];
                } else {
                    parentUsableHeight = parentContainer.offsetHeight;
                }

                if (useDocHeight) {
                    parentUsableHeight = docHeight;
                }

                // get the parent sticky
                if (parentContainerSticky == null) {
                    parentContainerSticky = $document[0].querySelector("#mainnav");
                }
                // subtract the parent sticky from usable height
                parentUsableHeight -= parentContainerSticky.offsetHeight;

                // the content that we should make scrollable if the content height is too small
                appContent = parentContainer.querySelector(".app-content-container");

                // the sticky part of the container
                var stickyHeight = 0;
                containerSticky = appContent.querySelector(".top-panel-container");
                if (containerSticky) {
                    stickyHeight = containerSticky.offsetHeight;
                }

                container = appContent.querySelector(".bottom-panel-container");

                var containerHeight = ((parentUsableHeight - stickyHeight) / docHeight) * 100;
                if (containerHeight < 15) {
                    resetHeight();
                } else {
                    //remove the styles that might have been added to appContent
                    appContent.style.overflowY = "unset";
                    appContent.style.height = "unset";

                    // set the container's height
                    container.style.height = containerHeight + 'vh';
                    console.log("did the containerheight");

                    // now check based on actual pixel size
                    if (container.offsetHeight < 300) {
                        resetHeight();
                    }
                }

            } catch (err) {
                $log.warn(err);
            }
        }

        /**
         * sets the style of domElements.footer
         * @param {Integer} index - index pertaining to which dom element to select
         **/
        function setFooterStyle(index) {
            try {
                var elements = {};
                /**** used for main-body height calculation ****/
                // get main container height
                elements.mainContainerHeight = $document[0].getElementsByClassName('main-container')[index].offsetHeight;
                // get the main body height
                elements.initialInnerHeight = $document[0].getElementsByClassName('main-body')[index].offsetHeight;
                // get the footer
                elements.footer = $document[0].getElementsByTagName('footer')[index];


                var footerHeight = elements.footer.offsetHeight + 10;
                // calculate the inner height of the app content (height of children in main-body + footer)
                if ( (elements.initialInnerHeight + footerHeight) < elements.mainContainerHeight) {
                    removeClass(elements.footer, "position-relative");
                } else {
                    addClass(elements.footer, "position-relative");
                }
            } catch(err) {
                $log.warn(err);
            }
        }

        /**
         * @param   {Object} scope - the scope object
         * @param   {DOMElement} parentContainer - the container that we want the alignment for
         * @param   {DOMElement} paddingElement - the element that we should apply the padding to
         *                            if undefined, we will apply the padding to `.main-container`
         *
         * Make sure the top right panel and main container are aligned.
         * They can be missaligned if the scrollbar is visible and takes space.
         * TODO we might want to improve the performance of this.
         * Currently it's running on every digest cycle.
         */
        function watchForMainContainerPadding(scope, parentContainer, paddingElement) {
            var mainContainer = parentContainer.querySelector(".main-container");
            var topRightPanel = parentContainer.querySelector(".top-right-panel");
            scope.$watch(function () {
                return mainContainer.clientWidth - topRightPanel.clientWidth;
            }, function (padding) {
                if (!paddingElement) {
                    paddingElement = mainContainer;
                }
                paddingElement.style.paddingRight = padding + "px";
            });
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
            setFooterStyle: setFooterStyle,
            setDisplayContainerHeight: setDisplayContainerHeight,
            addClass: addClass,
            removeClass: removeClass,
            watchForMainContainerPadding: watchForMainContainerPadding
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

    .factory("ConfigUtils", ['defaultChaiseConfig', '$http', '$rootScope', '$window', function(defaultConfig, $http, $rootScope, $window) {

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
         * @params {Object} catalogAnnotation - the chaise-config object returned from the 2019 chaise-config annotation tag attached to the catalog object
         *
         */
        function setConfigJSON(catalogAnnotation) {
            var cc = {};
            // check to see if global chaise-config (chaise-config.js) is available
            if (typeof chaiseConfig != 'undefined') cc = Object.assign({}, chaiseConfig);

            // Loop over default properties (global chaise config (chaise-config.js) may not be defined)
            // Handles case 1 and 2a
            for (var property in defaultConfig) {
                // use chaise-config.js property instead of default if defined
                if (typeof chaiseConfig != 'undefined' && typeof chaiseConfig[property] != 'undefined') {
                    cc[property] = chaiseConfig[property];
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
                                        cc[property] = ruleset.config[property];
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
                    cc[property] = catalogAnnotation[property];
                }

                // case 3b
                applyHostConfigRules(catalogAnnotation);
            }

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
                var dcctx = getContextJSON();
                var versionedTemplateUrl = templateUrl + (templateUrl.indexOf(chaiseDeploymentPath) !== -1 ? "?v=" + dcctx.version : "");

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
            if (context.indexOf('compact') != -1 && cc.SystemColumnsDisplayCompact)  {
                mode = cc.SystemColumnsDisplayCompact;
            } else if (context == 'detailed' && cc.SystemColumnsDisplayDetailed) {
                mode = cc.SystemColumnsDisplayDetailed;
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
            systemColumnsMode: systemColumnsMode
        }
    }])

    // directive for including the loading spinner
    .directive('loadingSpinner', ['UriUtils', function (UriUtils) {
        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/spinner.html'
        }
    }])

    // directive for including a smaller loading spinner with less styling
    .directive('loadingSpinnerSm', ['UriUtils', function (UriUtils) {
        return {
            restrict: 'A',
            transclude: true,
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/spinner-sm.html'
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

    .directive('chaiseSearchInput', ['UriUtils', '$timeout', function (UriUtils, $timeout) {

        return {
            restrict: 'E',
            templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/searchInput.html',
            scope: {
                searchTerm: "=",
                searchCallback: "&",
                inputClass: "@",
                placeholder: "=",
                focus: "=",
                disabled: "="
            },
            link: function (scope, elem, attrs) {
                var AUTO_SEARCH_TIMEOUT = 2000;
                scope.inputChangedPromise = undefined;
                scope.inputElement = elem[0].querySelector("input");

                // unrwap the callback function
                scope.searchCallback = scope.searchCallback();

                scope.changeFocus = function () {
                    if (scope.disabled) return;
                    scope.inputElement.focus();
                }

                // will be called when users click on enter or submit button
                scope.enterPressed = function() {
                    if (scope.disabled) return;
                    scope.inputChangedPromise = null;
                    scope.searchCallback(scope.searchTerm);
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
                        scope.searchCallback(scope.searchTerm);
                    }, AUTO_SEARCH_TIMEOUT);
                };

                // clear the search, if we already had a searchTerm, then fire the search
                scope.clearSearch = function() {
                    if (scope.disabled) return;
                    if (scope.searchTerm) {
                        scope.searchCallback(null);
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
            // there shouldn't be any extra between closing span tag and a
            // if added, it will show an extra underline for the space
            template: '<a ng-if="addLink && !displayname.isHTML" ng-href="{{::recordset()}}" ng-attr-uib-tooltip="{{::comment}}" tooltip-placement="bottom-left">' +
                        '<span ng-bind="displayname.value" ng-class="{\'chaise-icon-for-tooltip\': comment}"></span>' +
                      '</a>' +
                      '<a ng-if="addLink && displayname.isHTML" ng-href="{{::recordset()}}" ng-attr-uib-tooltip="{{::comment}}" tooltip-placement="bottom-left">' +
                        '<span ng-bind-html="displayname.value" ng-class="{\'chaise-icon-for-tooltip\': comment}"></span>' +
                      '</a>' +
                      '<span ng-if="!addLink && !displayname.isHTML" ng-attr-uib-tooltip="{{::comment}}" tooltip-placement="bottom-left">' +
                        '<span ng-bind="displayname.value" ng-class="{\'chaise-icon-for-tooltip\': comment}"></span>' +
                      '</span>' +
                      '<span ng-if="!addLink && displayname.isHTML" ng-attr-uib-tooltip="{{::comment}}" tooltip-placement="bottom-left">' +
                        '<span ng-bind-html="displayname.value" ng-class="{\'chaise-icon-for-tooltip\': comment}"></span>' +
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

                if (typeof scope.displayname !== "object") {
                    scope.displayname = scope.reference.displayname;
                }

                if (!scope.comment && scope.reference && scope.reference.table.comment) {
                    scope.comment = scope.reference.table.comment;
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

    .service('headInjector', ['ConfigUtils', 'ERMrest', 'Errors', 'ErrorService', 'MathUtils', 'modalUtils', '$q', '$rootScope', 'UriUtils', '$window', function(ConfigUtils, ERMrest, Errors, ErrorService, MathUtils, modalUtils, $q, $rootScope, UriUtils, $window) {

        /**
         * adds a link tag to head with the custom css. It will be resolved when
         * the file is loaded (or if the customCSS property is not defined)
         */
        function addCustomCSS() {
            var defer = $q.defer();
            var chaiseConfig = ConfigUtils.getConfigJSON();
            if (chaiseConfig['customCSS'] !== undefined) {
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

        function addTitle() {
            var chaiseConfig = ConfigUtils.getConfigJSON();

            var titleTag = document.head.getElementsByTagName('title')[0];
            if (titleTag) {
                titleTag.innerHTML = chaiseConfig.headTitle;
            } else {
                var title = document.createElement("title");
                title.innerHTML = chaiseConfig.headTitle;
                document.head.appendChild(title);
            }
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
            addClickListener("a.asset-permission", function (e) {

                function hideSpinner() {
                    e.target.innerHTML = e.target.innerHTML.slice(0, e.target.innerHTML.indexOf(spinnerHTML));
                }

                e.preventDefault();

                var spinnerHTML = ' <span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>';
                //show spinner
                e.target.innerHTML += spinnerHTML;

                // if same origin, verify authorization
                if (UriUtils.isSameOrigin(e.target.href)) {

                    var dcctx = ConfigUtils.getContextJSON();
                    // make a HEAD request to check if the user can fetch the file

                    dcctx.server.http.head(e.target.href, {skipRetryBrowserError: true, skipHTTP401Handling: true}).then(function (response) {
                        clickHref(e.target.href);
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
            addClickListener('a.external-link', function (e) {
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
                    clickHref(e.target.href);
                }, false);
            });
        }

        /**
         * Will call the handler function upon clicking on the elements represented by selector
         * @param {string} selector the selector string
         * @param {function} handler  the handler callback function
         */
        function addClickListener(selector, handler) {
            document.querySelector("body").addEventListener("click", function (e) {
                if (e.target.closest(selector)) {
                    handler(e);
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
         */
        function setupHead() {
            addPolyfills();
            addCanonicalTag();
            addTitle();
            setWindowName();
            overrideDownloadClickBehavior();
            overrideExternalLinkBehavior();
            return addCustomCSS();
        }

        return {
            addCanonicalTag: addCanonicalTag,
            addCustomCSS: addCustomCSS,
            addTitle: addTitle,
            setWindowName: setWindowName,
            setupHead: setupHead
        };
    }]);
})();
