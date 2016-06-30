(function() {
    'use strict';

    angular.module('chaise.utils', [])

    .factory('UriUtils', ['$injector', '$window', function($injector, $window) {

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

        function parseURLFragment(context) {
            setOrigin()
            // First, configure the service URL, assuming its this origin plus the
            // typical deployment location for ermrest.
            context.serviceURL = $window.location.origin + '/ermrest';

            if (chaiseConfig.ermrestLocation) {
                context.serviceURL = chaiseConfig.ermrestLocation;
            }

            // Then, parse the URL fragment id (aka, hash). Expected format:
            //  "#catalog_id/[schema_name:]table_name[/{attribute::op::value}{&attribute::op::value}*][@sort(column[::desc::])]"
            var hash = $window.location.hash;
            if (hash === undefined || hash == '' || hash.length == 1) {
                return;
            }

            // parse out @sort(...)
            if (hash.indexOf("@sort(") !== -1) {
                context.sort = hash.match(/@sort\((.*)\)/)[1];
                hash = hash.split("@sort(")[0];
            }

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

            // If there are filters appended to the URL, add them to context.js
            if (parts[2]) {
                context.filters = [];
                var filters = parts[2].split('&');
                for (var i = 0, len = filters.length; i < len; i++) {
                    //check for '=' or '::' to decide what split to use
                    if (filters[i].indexOf("=") !== -1) {
                        var filter = filters[i].split('=');
                        if (filter[0] && filter[1]) {
                            context.filters.push({
                                name: decodeURIComponent(filter[0]),
                                op: "=",
                                value: decodeURIComponent(filter[1])
                            });
                        }
                    } else {
                        var filter = filters[i].split("::");
                        if (filter.length != 3) {
                            // Currently, this only supports binary predicates, skips others
                            console.log("invalid filter string: " + filter);
                            continue;
                        } else {
                            context.filters.push({
                                name: decodeURIComponent(filter[0]),
                                op: "::"+filter[1]+"::",
                                value: decodeURIComponent(filter[2])
                            });
                        }
                    }
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

        return {
            fixedEncodeURIComponent: fixedEncodeURIComponent,
            parseURLFragment: parseURLFragment,
            setOrigin: setOrigin
        }
    }]);
})();
